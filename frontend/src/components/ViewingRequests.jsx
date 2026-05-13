import { useState, useEffect } from 'react';
import { Button, Modal, Form, DatePicker, TimePicker, message, List, Tag, Space, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { requestService } from "../services/requestService.js";

const ViewingRequests = ({ propertyId, isOwner, canCreateRequest = true }) => {
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const isAuthed = Boolean(localStorage.getItem('access'));
  const isClient = localStorage.getItem('role') === 'client';

  const fetchTotalCount = async () => {
    if (!propertyId || !isAuthed) return;
    try {
      const data = await requestService.getRequestsCountByProperty(propertyId);
      setTotalCount(data.count);
    } catch (error) {
      console.error('Ошибка загрузки количества заявок:', error);
    }
  };

  const fetchRequests = async () => {
    if (!propertyId || !isAuthed) return;
    try {
      setLoading(true);
      const data = await requestService.getRequestsByProperty(propertyId);
      setRequests(data);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    await Promise.all([fetchRequests(), fetchTotalCount()]);
  };

  useEffect(() => {
    loadAllData();
  }, [propertyId, isOwner]);

  const handleSubmit = async (values) => {
    const formattedDate = values.date.format('YYYY-MM-DD');
    const formattedTime = values.time.format('HH:mm');
    const comment = values.message || '';

    try {
      if (editingId) {
        await requestService.updateRequest(editingId, formattedDate, formattedTime, comment);
        message.success('Заявка обновлена');
      } else {
        await requestService.createViewingRequest(propertyId, formattedDate, formattedTime, comment);
        message.success('Заявка создана');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingId(null);
      await loadAllData();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.error || 'Ошибка при сохранении заявки');
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await requestService.deleteRequest(id);
      message.success(isOwner ? 'Заявка удалена' : 'Заявка отменена');
      await loadAllData();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.error || 'Ошибка при удалении заявки');
    }
  };

  const handleApprove = async (id) => {
    try {
      await requestService.approveRequest(id);
      message.success('Заявка подтверждена, объект забронирован');
      await loadAllData();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.error || 'Ошибка при подтверждении заявки');
    }
  };

  const handleReject = async (id) => {
    try {
      await requestService.rejectRequest(id);
      message.success('Заявка отклонена');
      await loadAllData();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.error || 'Ошибка при отклонении заявки');
    }
  };

  const handleComplete = async (id) => {
    try {
      await requestService.completeRequest(id);
      message.success('Сделка завершена, объект снят с публикации');
      await loadAllData();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.error || 'Ошибка при завершении сделки');
    }
  };

  const handleEditRequest = (request) => {
    setEditingId(request.id);
    form.setFieldsValue({
      date: dayjs(request.requested_date),
      time: dayjs(request.requested_time, 'HH:mm:ss'),
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

  const canShowCreateButton = isClient && canCreateRequest;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Заявки на просмотр</h3>
          <span className="text-sm text-gray-500">{isOwner ? `Всего входящих заявок: ${totalCount}` : `Ваши заявки по объекту: ${requests.length}`}</span>
        </div>
        {canShowCreateButton && (
          <Button type="primary" icon={<EyeOutlined />} onClick={() => setModalVisible(true)}>
            Записаться на просмотр
          </Button>
        )}
      </div>

      {!isAuthed && <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">Войдите, чтобы записаться на просмотр или посмотреть свои заявки.</div>}
      {isClient && !canCreateRequest && <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Новая запись недоступна: объект неактивен или уже забронирован/продан/сдан.</div>}

      {isAuthed && (
        <List
          loading={loading}
          dataSource={requests}
          renderItem={(request) => {
            const clientCanEdit = isClient && request.status === 'pending';
            const ownerCanAct = isOwner && ['pending', 'approved'].includes(request.status);
            return (
              <List.Item
                actions={clientCanEdit ? [
                  <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => handleEditRequest(request)} title="Редактировать заявку" />,
                  <Popconfirm key="delete" title="Отменить заявку?" onConfirm={() => handleCancelRequest(request.id)} okText="Да" cancelText="Нет">
                    <Button type="text" danger icon={<DeleteOutlined />} title="Отменить заявку" />
                  </Popconfirm>
                ] : []}
              >
                <List.Item.Meta
                  title={
                    <Space direction="vertical" size="small">
                      <Space wrap>{dayjs(request.requested_date).format('DD.MM.YYYY')} в {request.requested_time}{getStatusTag(request.status)}</Space>
                      {isOwner && request.user_name && <Space size="small" style={{ fontSize: 12, color: '#666' }}><UserOutlined /> <span>Клиент: {request.user_name}</span></Space>}
                    </Space>
                  }
                  description={request.message && <div className="mt-2 text-gray-600"><strong>Комментарий:</strong> {request.message}</div>}
                />
                {ownerCanAct && (
                  <Space wrap>
                    {request.status === 'pending' && <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(request.id)}>Подтвердить</Button>}
                    <Button size="small" onClick={() => handleEditRequest(request)}>Перенести</Button>
                    {request.status === 'approved' && <Button size="small" onClick={() => handleComplete(request.id)}>Завершить сделку</Button>}
                    {request.status === 'pending' && <Button danger size="small" icon={<CloseOutlined />} onClick={() => handleReject(request.id)}>Отклонить</Button>}
                  </Space>
                )}
              </List.Item>
            );
          }}
          locale={{ emptyText: isOwner ? 'Входящих заявок нет' : 'У вас нет заявок по этому объекту' }}
        />
      )}

      <Modal title={editingId ? 'Изменить дату и время просмотра' : 'Новая заявка на просмотр'} open={modalVisible} onCancel={handleCancelModal} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ message: '' }}>
          <Form.Item name="date" label="Дата просмотра" rules={[{ required: true, message: 'Выберите дату' }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().startOf('day')} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="time" label="Время просмотра" rules={[{ required: true, message: 'Выберите время' }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} showNow={false} />
          </Form.Item>
          <Form.Item name="message" label="Комментарий">
            <textarea className="w-full rounded-xl border border-gray-300 bg-white p-2 text-gray-900 placeholder:text-gray-400" rows={3} placeholder="Комментарий..." />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={handleCancelModal}>Отмена</Button>
            <Button type="primary" htmlType="submit">{editingId ? 'Сохранить' : 'Отправить'}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ViewingRequests;