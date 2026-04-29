import { useState, useEffect } from 'react';
import { Button, Modal, Form, DatePicker, TimePicker, message, List, Tag, Space, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import {requestService} from "../services/requestService.js";

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
    const { date, time, message } = values;

    // Format dates
    const formattedDate = date.format('YYYY-MM-DD');
    const formattedTime = time.format('HH:mm');

    console.log('Submitting:', {
      propertyId,
      formattedDate,
      formattedTime,
      message
    });

    if (editingId) {
      await requestService.updateRequest(
        editingId,
        formattedDate,
        formattedTime,
        message
      );
      message.success('Request updated');
    } else {
      await requestService.createViewingRequest(
        propertyId,
        formattedDate,
        formattedTime,
        message
      );
      message.success('Request created');
    }

    setModalVisible(false);
    form.resetFields();
    setEditingId(null);
    fetchRequests(propertyId);
};

const handleCancelRequest = async (id) => {
  try {
    await requestService.deleteRequest(id);
    message.success('Заявка отменена');
    fetchRequests(propertyId);
  } catch (error) {
    message.error('Ошибка при отмене заявки');
  }
};

const handleStatusChange = async (id, status) => {
  try {
    await requestService.changeStatus(id, status);
    message.success(status === 'approved' ? 'Заявка подтверждена' : 'Заявка отклонена');
    fetchRequests(propertyId);
  } catch (error) {
    message.error('Ошибка при изменении статуса');
  }
};

const handleEditRequest = (request) => {
  setEditingId(request.id);
  form.setFieldsValue({
    date: dayjs(request.requested_date),
    time: dayjs(request.requested_time, 'HH:mm'),
    message: request.message
  });
  setModalVisible(true);
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
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditRequest(request)}
                />,
                <Popconfirm
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
                  onClick={() => handleStatusChange(request.id, 'approved')}
                >
                  Подтвердить
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleStatusChange(request.id, 'rejected')}
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
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="date"
            label="Дата просмотра"
            rules={[{ required: true, message: 'Выберите дату' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
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
            <textarea className="w-full border rounded p-2" rows={3} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setModalVisible(false);
              form.resetFields();
              setEditingId(null);
            }}>
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