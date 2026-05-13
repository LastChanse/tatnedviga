import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button, Popconfirm, Select, Table, Tag, message } from 'antd';
import { propertyService } from '../services/propertyService';

const statusLabels = {
  available: 'Доступен',
  booked: 'Забронирован',
  sold: 'Продан',
  rented: 'Сдан в аренду',
};

export default function OwnerProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  if (localStorage.getItem('role') !== 'owner') {
    return <Navigate to="/" />;
  }

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getOwnerProperties();
      setProperties(data);
    } catch (error) {
      console.error(error);
      message.error('Не удалось загрузить объявления');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleStatusChange = async (propertyId, status) => {
    try {
      const updated = await propertyService.updateProperty(propertyId, { status });
      setProperties((items) => items.map((item) => (item.id === propertyId ? updated : item)));
      message.success('Статус объекта обновлён');
    } catch (error) {
      console.error(error);
      message.error('Не удалось обновить статус');
    }
  };

  const handleAvailabilityChange = async (property) => {
    try {
      const updated = property.is_active
        ? await propertyService.deactivateProperty(property.id)
        : await propertyService.activateProperty(property.id);
      setProperties((items) => items.map((item) => (item.id === property.id ? updated : item)));
      message.success(property.is_active ? 'Объявление деактивировано' : 'Объявление активировано');
    } catch (error) {
      console.error(error);
      message.error('Не удалось изменить доступность объявления');
    }
  };

  const handleDelete = async (propertyId) => {
    try {
      await propertyService.deleteProperty(propertyId);
      setProperties((items) => items.filter((item) => item.id !== propertyId));
      message.success('Объявление удалено');
    } catch (error) {
      console.error(error);
      message.error('Не удалось удалить объявление');
    }
  };

  const columns = [
    {
      title: 'Объект',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => <Link to={`/property/${record.id}`}>{title}</Link>,
    },
    {
      title: 'Район / площадь',
      key: 'district_area',
      render: (_, record) => `${record.district || 'Район не указан'} · ${record.area ? `${record.area} м²` : 'площадь не указана'}`,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 170 }}
          onChange={(value) => handleStatusChange(record.id, value)}
          options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
        />
      ),
    },
    {
      title: 'Доступность',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Активно' : 'Неактивно'}
        </Tag>
      ),
    },
    {
      title: 'Просмотры',
      dataIndex: 'views_count',
      key: 'views_count',
      render: (value) => value || 0,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <div className="flex flex-wrap gap-2">
          <Link to={`/property/${record.id}/edit`}>
            <Button>Редактировать</Button>
          </Link>
          <Button onClick={() => handleAvailabilityChange(record)}>
            {record.is_active ? 'Деактивировать' : 'Активировать'}
          </Button>
          <Popconfirm
            title="Удалить объявление?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>Удалить</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-extrabold text-gray-900">Недвижимость</Link>
            <Link to="/profile" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
              Профиль
            </Link>
          </div>
          <Link to="/create-property" className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-extrabold text-white">
            + Добавить объект
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-gray-900">Мои объявления</h1>
          <p className="mt-1 text-sm text-gray-600">
            Управляйте редактированием, статусом, доступностью и удалением опубликованных объектов.
          </p>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={properties}
          pagination={{ pageSize: 10 }}
        />
      </main>
    </div>
  );
}
