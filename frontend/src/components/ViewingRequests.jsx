import { useState, useEffect } from 'react';
import { Button, Modal, Form, DatePicker, TimePicker, message, List, Tag, Space, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { requestService } from "../services/requestService.js";

const ViewingRequests = ({ propertyId, isOwner }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  const fetchRequests = async (propertyId) => {
    try {
      setLoading(true);
      if (!propertyId) {
        throw new Error('Не указан ID объекта недвижимости');
      }
      const data = await requestService.getRequestsByProperty(propertyId);
      setRequests(data);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
      message.error(
        error.response?.data?.message ||
        error.message ||
        'Ошибка при загрузке заявок'
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(propertyId);
  }, [propertyId]);

  const handleSubmit = async (values) => {
    const { date, time, message: comment } = values;

    const formattedDate = date.format('YYYY-MM-DD');
    const formattedTime = time.format('HH:mm');

    try {
      if (editingId) {
        // Обновление существующей заявки
        await requestService.updateRequest(
          editingId,
          formattedDate,
          formattedTime,
          comment || ''
        );
        message.success('Заявка успешно обновлена');
      } else {
        // Создание новой заявки
        await requestService.createViewingRequest(
          propertyId,
          formattedDate,
          formattedTime,
          comment || ''
        );
        message.success('Заявка успешно создана');
      }

      // Закрываем окно
      setModalVisible(false);
      // Очищаем форму
      form.resetFields();
      // Сбрасываем ID редактирования
      setEditingId(null);
      // Обновляем список
      await fetchRequests(propertyId);

    } catch (error) {
      console.error('Ошибка при сохранении заявки:', error);
      message.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Ошибка при сохранении заявки'
      );
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await requestService.deleteRequest(id);
      message.success('Заявка отменена');
      await fetchRequests(propertyId);
    } catch (error) {
      console.error('Ошибка при отмене заявки:', error);
      message.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Ошибка при отмене заявки'
      );
    }
  };

  const handleApprove = async (id) => {
    try {
      await requestService.approveRequest(id);
      message.success('Заявка подтверждена');
      await fetchRequests(propertyId);
    } catch (error) {
      console.error('Ошибка при подтверждении заявки:', error);
      message.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Ошибка при подтверждении заявки'
      );
    }
  };

  const handleReject = async (id) => {
    try {
      await requestService.rejectRequest(id);
      message.success('Заявка отклонена');
      await fetchRequests(propertyId);
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
      message.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Ошибка при отклонении заявки'
      );
    }
  };

  const handleEditRequest = (request) => {
    setEditingId(request.id);
    form.setFieldsValue({
      date: dayjs(request.requested_date),
      time: dayjs(request.requested_time, 'HH:mm'),
      message: request.message || ''
    });
    setModalVisible(true);
  };

  const handleCancelModal = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: 'На рассмотрении' },
      approved: { color: 'green', text: 'Подтверждена' },
      rejected: { color: 'red', text: 'Отклонена' },
      completed: { color: 'blue', text: 'Завершена' },
      default: { color: 'gray', text: status }
    };

    const currentStatus = statusMap[status] || statusMap.default;
    return <Tag color={currentStatus.color}>{currentStatus.text}</Tag>;
  };

  return (
    <div className="mt-6 ml-4 mr-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-extrabold text-gray-900 mb-3">Заявки на просмотр</h3>
        {!isOwner && (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Записаться на просмотр
          </Button>
        )}
      </div>

      <List
        loading={loading}
        dataSource={requests}
        renderItem={(request) => (
          <List.Item
            actions={
              !isOwner && request.status === 'pending' ? [
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditRequest(request)}
                />,
                <Popconfirm
                  key="delete"
                  title="Вы уверены, что хотите отменить заявку?"
                  onConfirm={() => handleCancelRequest(request.id)}
                  okText="Да"
                  cancelText="Нет"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ] : []
            }
          >
            <List.Item.Meta
              title={
                <Space>
                  {dayjs(request.requested_date).format('DD.MM.YYYY')} в {request.requested_time}
                  {getStatusTag(request.status)}
                </Space>
              }
              description={request.message || 'Без комментария'}
            />
            {isOwner && request.status === 'pending' && (
              <Space>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(request.id)}
                >
                  Подтвердить
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(request.id)}
                >
                  Отклонить
                </Button>
              </Space>
            )}
          </List.Item>
        )}
        locale={{ emptyText: 'Нет заявок на просмотр' }}
      />

      <Modal
        title={editingId ? 'Редактировать заявку' : 'Новая заявка на просмотр'}
        open={modalVisible}
        onCancel={handleCancelModal}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            message: ''
          }}
        >
          <Form.Item
            name="date"
            label="Дата просмотра"
            rules={[{ required: true, message: 'Выберите дату' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            name="time"
            label="Время просмотра"
            rules={[{ required: true, message: 'Выберите время' }]}
          >
            <TimePicker
              style={{ width: '100%' }}
              format="HH:mm"
              minuteStep={15}
              showNow={false}
            />
          </Form.Item>

          <Form.Item
            name="message"
            label="Комментарий (необязательно)"
          >
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              placeholder="Ваш комментарий..."
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={handleCancelModal}>
              Отмена
            </Button>
            <Button type="primary" htmlType="submit">
              {editingId ? 'Обновить' : 'Отправить'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ViewingRequests;