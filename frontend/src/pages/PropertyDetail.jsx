import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8000/api/properties/${id}/`);
        setProperty(response.data);
      } catch (err) {
        setError('Не удалось загрузить информацию об объекте');
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const getDealType = (deal) => {
    return deal === 'rent' ? 'Аренда' : 'Продажа';
  };

  const getPropertyType = (type) => {
    const types = {
      'apartment': 'Квартира',
      'house': 'Дом',
      'commercial': 'Коммерческая'
    };
    return types[type] || type;
  };

  const getStatus = (status) => {
    const statuses = {
      'available': { text: 'Доступен', color: 'bg-emerald-50 text-emerald-700' },
      'sold': { text: 'Продан', color: 'bg-rose-50 text-rose-700' },
      'rented': { text: 'Сдан', color: 'bg-sky-50 text-sky-700' }
    };
    return statuses[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 text-lg">Загрузка...</div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 text-lg">{error || 'Объект не найден'}</div>
        <Link to="/" className="text-blue-600 hover:underline">Вернуться на главную</Link>
      </div>
    );
  }

  const status = getStatus(property.status);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            ← Назад
          </button>
          <Link to="/" className="font-extrabold tracking-tight text-gray-900">Недвижимость</Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{property.title}</h1>
        
        {/* Image */}
        <div className="mb-6">
          <img
            src={property.image || 'https://via.placeholder.com/800x400?text=Нет+фото'}
            alt={property.title}
            className="w-full h-[400px] object-cover rounded-2xl"
          />
        </div>

        {/* Price */}
        <div className="text-3xl font-extrabold text-gray-900 mb-4">
          {formatPrice(property.price)}
          {property.deal === 'rent' && ' /мес'}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${status.color}`}>
            {status.text}
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
            {getDealType(property.deal)}
          </span>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-extrabold text-purple-700">
            {getPropertyType(property.property_type)}
          </span>
        </div>

        {/* Info cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Район</div>
            <div className="font-bold text-gray-900 text-lg">{property.district}</div>
        </div>
        
        <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Владелец</div>
            <div className="font-bold text-gray-900 text-lg">{property.owner_name || `ID: ${property.owner}`}</div>
        </div>

        <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Опубликовано</div>
            <div className="font-bold text-gray-900 text-lg">
            {new Date(property.created_at).toLocaleDateString('ru-RU')}
            </div>
        </div>
        </div>

        {/* Description */}
        {property.description && (
        <div className="mb-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">Описание</h2>
            <p className="text-gray-800 leading-relaxed">{property.description}</p>
        </div>
        )}

        {/* Contact button */}
        <button
        className="w-full rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-extrabold text-white hover:bg-gray-800 transition-colors"
        onClick={() => alert('Связаться с владельцем (демо)')}
        >
        Связаться с владельцем
        </button>
      </main>
    </div>
  );
}