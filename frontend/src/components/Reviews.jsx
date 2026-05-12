import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Form, Input, List, Rate, Tag, message } from 'antd';
import { reviewService } from '../services/reviewService';
import { requestService } from '../services/requestService';

export default function Reviews({ propertyId }) {
  const [reviews, setReviews] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const isAuthed = Boolean(localStorage.getItem('access'));
  const role = localStorage.getItem('role');

  const completedRequest = useMemo(
    () => requests.find((item) => Number(item.property) === Number(propertyId) && item.status === 'completed'),
    [requests, propertyId]
  );

  const alreadyReviewed = useMemo(
    () => Boolean(completedRequest) && reviews.some((item) => item.viewing_request === completedRequest.id),
    [reviews, completedRequest]
  );

  const canReview = isAuthed && role !== 'owner' && Boolean(completedRequest) && !alreadyReviewed;

  const loadData = async () => {
    try {
      setLoading(true);
      const reviewData = await reviewService.getReviewsByProperty(propertyId);
      setReviews(reviewData);
      if (isAuthed) {
        const requestData = await requestService.getRequests();
        setRequests(requestData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) loadData();
  }, [propertyId]);

  const handleSubmit = async (values) => {
    if (!completedRequest) return;
    try {
      await reviewService.createReview({
        property: propertyId,
        viewing_request: completedRequest.id,
        rating: values.rating,
        text: values.text || '',
      });
      form.resetFields();
      setShowForm(false);
      message.success('Отзыв добавлен');
      await loadData();
    } catch (error) {
      console.error(error);
      message.error('Не удалось добавить отзыв');
    }
  };

  const hint = () => {
    if (!isAuthed) return 'Войдите в аккаунт, чтобы оставить отзыв.';
    if (role === 'owner') return 'Собственник не может оставлять отзыв на свой объект.';
    if (alreadyReviewed) return 'Вы уже оставили отзыв по этому завершённому просмотру.';
    if (!completedRequest) return 'Сначала нужно записаться на просмотр, а собственник должен завершить заявку.';
    return '';
  };

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-gray-900">Отзывы</h2>
        <Tag>{reviews.length}</Tag>
      </div>

      <List
        loading={loading}
        dataSource={reviews}
        locale={{ emptyText: 'Отзывов пока нет' }}
        renderItem={(review) => (
          <List.Item>
            <List.Item.Meta
              title={<div className="flex items-center gap-2"><Rate disabled value={review.rating} /> <span>{review.user_name}</span></div>}
              description={review.text || 'Без комментария'}
            />
          </List.Item>
        )}
      />

      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-gray-900">Оставить отзыв</h3>
            {!canReview && <p className="mt-1 text-sm text-gray-600">{hint()}</p>}
          </div>
          {!isAuthed ? (
            <Link to="/login" className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white">Войти</Link>
          ) : (
            <Button type="primary" disabled={!canReview} onClick={() => setShowForm((value) => !value)}>Оставить отзыв</Button>
          )}
        </div>

        {canReview && showForm && (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="rating" label="Оценка" rules={[{ required: true, message: 'Поставьте оценку' }]}>
              <Rate />
            </Form.Item>
            <Form.Item name="text" label="Комментарий">
              <Input.TextArea rows={3} placeholder="Расскажите о просмотре" />
            </Form.Item>
            <Button type="primary" htmlType="submit">Отправить отзыв</Button>
          </Form>
        )}
      </div>
    </section>
  );
}
