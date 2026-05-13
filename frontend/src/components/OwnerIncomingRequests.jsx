import { useEffect, useState } from 'react';
import { Button, DatePicker, List, Space, TimePicker, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { requestService } from '../services/requestService';

const statusMap = {
  pending: { color: 'orange', label: 'На рассмотрении' },
  approved: { color: 'green', label: 'Подтверждена' },
  rejected: { color: 'red', label: 'Отклонена' },
  completed: { color: 'blue', label: 'Завершена' },
};

export default function OwnerIncomingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await requestService.getRequests();
      setRequests(data);
    } catch (error) {
      console.error(error);
      message.error('Не удалось загрузить входящие запросы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const approve = async (id) => {
    try {
      await requestService.approveRequest(id);
      message.success('Запрос подтверждён');
      await loadRequests();
    } catch (error) {
      console.error(error);
      message.error('Не удалось подтвердить запрос');
    }
  };

  const reject = async (id) => {
    try {
      await requestService.rejectRequest(id);
      message.success('Запрос отклонён');
      await loadRequests();
    } catch (error) {
      console.error(error);
      message.error('Не удалось отклонить запрос');
    }
  };

  const complete = async (id) => {
    try {
      await requestService.completeRequest(id);
      message.success('Запрос завершён');
      await loadRequests();
    } catch (error) {
      console.error(error);
      message.error('Не удалось завершить запрос');
    }
  };

  const startReschedule = (request) => {
    setEditingId(request.id);
    setDate(dayjs(request.requested_date));
    setTime(dayjs(request.requested_time, 'HH:mm:ss'));
  };

  const saveReschedule = async (id) => {
    if (!date || !time) {
      message.error('Выберите дату и время');
      return;
    }
    try {
      await requestService.updateRequest(
        id,
        date.format('YYYY-MM-DD'),
        time.format('HH:mm'),
        ''
      );
      message.success('Дата просмотра перенесена');
      setEditingId(null);
      setDate(null);
      setTime(null);
      await loadRequests();
    } catch (error) {
      console.error(error);
      message.error('Не удалось перенести дату');
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-gray-900">Входящие запросы на просмотр</h2>
        <Tag>{requests.length}</Tag>
      </div>

      <List
        loading={loading}
        dataSource={requests}
        locale={{ emptyText: 'Входящих запросов пока нет' }}
        renderItem={(request) => {
          const status = statusMap[request.status] || { color: 'default', label: request.status };
          const canAct = ['pending', 'approved'].includes(request.status);

          return (
            <List.Item>
              <div className="w-full">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-gray-900">
                    Заявка #{request.id} · {request.requested_date} в {request.requested_time}
                  </div>
                  <Tag color={status.color}>{status.label}</Tag>
                </div>

                {request.user_name && <div className="mb-2 text-sm text-gray-600">Клиент: {request.user_name}</div>}
                {request.message && <div className="mb-3 text-sm text-gray-600">Комментарий: {request.message}</div>}

                {editingId === request.id ? (
                  <Space wrap>
                    <DatePicker value={date} onChange={setDate} format="YYYY-MM-DD" />
                    <TimePicker value={time} onChange={setTime} format="HH:mm" minuteStep={15} />
                    <Button type="primary" onClick={() => saveReschedule(request.id)}>Сохранить перенос</Button>
                    <Button onClick={() => setEditingId(null)}>Отмена</Button>
                  </Space>
                ) : (
                  <Space wrap>
                    {request.status === 'pending' && <Button type="primary" onClick={() => approve(request.id)}>Подтвердить</Button>}
                    {canAct && <Button onClick={() => startReschedule(request)}>Перенести дату</Button>}
                    {request.status === 'approved' && <Button onClick={() => complete(request.id)}>Завершить</Button>}
                    {request.status === 'pending' && <Button danger onClick={() => reject(request.id)}>Отклонить</Button>}
                  </Space>
                )}
              </div>
            </List.Item>
          );
        }}
      />
    </section>
  );
}
