import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

const initialForm = {
  title: "",
  description: "",
  price: "",
  area: "",
  deal: "rent",
  property_type: "apartment",
  status: "available",
  image: "",
  address: "",
  district: "",
};

export default function PropertyFormPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (localStorage.getItem("role") !== "owner") {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    if (mode !== "edit" || !id) return;

    async function loadProperty() {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/properties/${id}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
        });
        setFormData({ ...initialForm, ...response.data, image: "" });
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить объект для редактирования.");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [id, mode]);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleFileChange = (event) => {
    setFormData((current) => ({
      ...current,
      image: event.target.files[0],
    }));
  };

  const validate = () => {
    if (!formData.title.trim()) return "Введите заголовок";
    if (!formData.price || Number(formData.price) <= 0) return "Введите корректную цену";
    if (formData.area && Number(formData.area) <= 0) return "Площадь должна быть больше 0";
    if (!formData.address.trim()) return "Введите адрес";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    const body = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        body.append(key, value);
      }
    });

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
          "Content-Type": "multipart/form-data",
        },
      };

      if (mode === "edit") {
        await axios.patch(`${API_URL}/properties/${id}/`, body, config);
      } else {
        await axios.post(`${API_URL}/properties/`, body, config);
      }

      navigate("/owner/properties");
    } catch (err) {
      console.error(err);
      setError(mode === "edit" ? "Ошибка при сохранении объекта." : "Ошибка при создании объекта.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gray-900" />
            <span className="font-extrabold tracking-tight text-gray-900">Недвижимость</span>
          </Link>
          <Link to="/owner/properties" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
            Мои объявления
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h1 className="mb-6 text-2xl font-extrabold text-gray-900">
            {mode === "edit" ? "Редактировать объект" : "Создать объект недвижимости"}
          </h1>

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">Заголовок *</label>
              <input name="title" value={formData.title} onChange={handleChange} required className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">Описание</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-900">Тип недвижимости *</label>
                <select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5">
                  <option value="apartment">Квартира</option>
                  <option value="house">Дом</option>
                  <option value="commercial">Коммерческая</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-900">Тип сделки *</label>
                <select name="deal" value={formData.deal} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5">
                  <option value="rent">Аренда</option>
                  <option value="buy">Продажа</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-900">Цена *</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} min="1" required className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-900">Площадь, м²</label>
                <input type="number" name="area" value={formData.area || ""} onChange={handleChange} min="1" className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-900">Адрес *</label>
                <input name="address" value={formData.address} onChange={handleChange} required className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-900">Район</label>
                <input name="district" value={formData.district || ""} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">Статус</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5">
                <option value="available">Доступен</option>
                <option value="booked">Забронирован</option>
                <option value="sold">Продан</option>
                <option value="rented">Сдан в аренду</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">Фотография</label>
              <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
            </div>

            <div className="flex gap-3 pt-3">
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-gray-800 disabled:opacity-50">
                {loading ? "Сохранение..." : mode === "edit" ? "Сохранить" : "Создать объект"}
              </button>
              <Link to="/owner/properties" className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Отмена
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
