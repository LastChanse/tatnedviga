import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, DatePicker, TimePicker, message, List, Tag, Space } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const ViewingRequests = ({ propertyId, isOwner }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access');
      const response = await axios.get(`/api/viewing-requests/?property=${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      message.error('Ошибка при загрузке заявок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [propertyId]);

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('access');
      const data = {
        property: propertyId,
        requested_date: values.date.format('YYYY-MM-DD'),
        requested_time: values.time.format('HH:mm'),
        message: values.message
      };

      if (editingId) {
        await axios.put(`/api/viewing-requests/${editingId}/`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Заявка обновлена');
      } else {
        await axios.post('/api/viewing-requests/', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Заявка отправлена');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingId(null);
      fetchRequests();
    } catch (error) {
      message.error('Ошибка при отправке заявки');
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      const token = localStorage.getItem('access');
      await axios.delete(`/api/viewing-requests/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Заявка отменена');
      fetchRequests();
    } catch (error) {
      message.error('Ошибка при отмене заявки');
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
      completed: { color: 'blue', text: 'Завершена' }
    };
    return <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>;
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Заявки на просмотр</h3>
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
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleCancelRequest(request.id)}
                />
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
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('access');
                      await axios.patch(`/api/viewing-requests/${request.id}/`, {
                        status: 'approved'
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      message.success('Заявка подтверждена');
                      fetchRequests();
                    } catch (error) {
                      message.error('Ошибка при подтверждении заявки');
                    }
                  }}
                >
                  Подтвердить
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('access');
                      await axios.patch(`/api/viewing-requests/${request.id}/`, {
                        status: 'rejected'
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      message.success('Заявка отклонена');
                      fetchRequests();
                    } catch (error) {
                      message.error('Ошибка при отклонении заявки');
                    }
                  }}
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