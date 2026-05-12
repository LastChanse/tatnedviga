import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, List, Rate, Tag, message } from 'antd';
import { reviewService } from '../services/reviewService';
import { requestService } from '../services/requestService';

export default function Reviews({ propertyId }) {
  const [reviews, setReviews] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const isAuthed = Boolean(localStorage.getItem('access'));
  const role = localStorage.getItem('role');

  const completedRequest = useMemo(
    () => requests.find((item) => item.property === propertyId && item.status === 'completed'),
    [requests, propertyId]
  );

  const alreadyReviewed = useMemo(
    () => reviews.some((item) => item.viewing_request === completedRequest?.id),
    [reviews, completedRequest]
  );

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
      message.success('Отзыв добавлен');
      await loadData();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.non_field_errors?.[0] || 'Не удалось добавить отзыв');
    }
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

      {isAuthed && role !== 'owner' && completedRequest && !alreadyReviewed && (
        <div className="mt-5 rounded-xl bg-gray-50 p-4">
          <h3 className="mb-3 font-extrabold text-gray-900">Оставить отзыв после завершённого просмотра</h3>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="rating" label="Оценка" rules={[{ required: true, message: 'Поставьте оценку' }]}>
              <Rate />
            </Form.Item>
            <Form.Item name="text" label="Комментарий">
              <Input.TextArea rows={3} placeholder="Расскажите о сделке или просмотре" />
            </Form.Item>
            <Button type="primary" htmlType="submit">Отправить отзыв</Button>
          </Form>
        </div>
      )}
    </section>
  );
}
