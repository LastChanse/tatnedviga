import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function CreateProperty() {
  if (localStorage.getItem("role") !== "owner") {
    return <Navigate to="/" />;
  }

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    deal: "rent",
    property_type: "apartment",
    status: "available",
    image: "",
    address: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      await axios.post("http://localhost:8000/api/properties/", formDataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert("Объект успешно создан!");
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Ошибка при создании объекта.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gray-900" />
            <span className="font-extrabold tracking-tight text-gray-900">Недвижимость</span>
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
            Создать объект недвижимости
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Название */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Название <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Например: 2-комн. квартира в центре"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
              />
            </div>

            {/* Цена */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Цена (₽) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                placeholder="5000000"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
              />
            </div>

            {/* Тип сделки */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Тип сделки <span className="text-red-500">*</span>
              </label>
              <select
                name="deal"
                value={formData.deal}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-gray-900 focus:outline-none"
              >
                <option value="rent">Аренда</option>
                <option value="buy">Продажа</option>
              </select>
            </div>

            {/* Тип недвижимости */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Тип недвижимости <span className="text-red-500">*</span>
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-gray-900 focus:outline-none"
              >
                <option value="apartment">Квартира</option>
                <option value="house">Дом</option>
                <option value="commercial">Коммерческая</option>
              </select>
            </div>

            { /* Адрес */ }
            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Полный адрес (для карты)
                </label>
                <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="г. Москва, ул. Тверская, д. 1"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900"
                />
            </div>

            {/* Адрес */}
            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Полный адрес
                </label>
                <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="г. Казань, ул. Баумана, д. 5"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900"
                />
            </div>

            {/* Статус */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Статус
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-gray-900 focus:outline-none"
              >
                <option value="available">Доступен</option>
                <option value="sold">Продан</option>
                <option value="rented">Сдан</option>
              </select>
            </div>

            {/* URL изображения */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Ссылка на изображение
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    image: e.target.files[0]
                  });
                }}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                Оставьте пустым, если нет изображения
              </p>
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Описание
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Подробное описание объекта..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none resize-none"
              />
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Создание..." : "Создать объект"}
              </button>
              <Link
                to="/"
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-center"
              >
                Отмена
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}