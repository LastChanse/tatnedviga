import React, {useEffect, useMemo, useState} from "react";
import { Link } from "react-router-dom";
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { favoriteService } from '../services/favoriteService';
import axios from "axios";

export default function HomePage() {
  const [dealType, setDealType] = useState("rent");
  const [propertyType, setPropertyType] = useState("any");
  const [district, setDistrict] = useState("any");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [query, setQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const [favorites, setFavorites] = useState(new Set());

  const isAuthed = Boolean(localStorage.getItem("access") || localStorage.getItem("token"));

  const [listings, setListings] = useState([]);
  
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/properties/")
      .then((res) => setListings(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (isAuthed) {
      favoriteService.getFavorites()
        .then(data => setFavorites(new Set(data.map(f => f.property.id))))
        .catch(console.error);
    }
  }, [isAuthed]);

  const toggleFavorite = async (e, propertyId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      setAuthModalOpen(true);
      return;
    }
    try {
      const result = await favoriteService.toggleFavorite(propertyId);
      setFavorites(prev => {
        const next = new Set(prev);
        result.status === 'added' ? next.add(propertyId) : next.delete(propertyId);
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = useMemo(() => {
    const min = priceMin === "" ? null : Number(priceMin);
    const max = priceMax === "" ? null : Number(priceMax);
    const q = query.trim().toLowerCase();

    return listings
      .filter((x) => (dealType ? x.deal === dealType : true))
      .filter((x) => (propertyType === "any" ? true : x.property_type === propertyType))
      .filter((x) => (district === "any" ? true : x.district === district))
      .filter((x) => (min === null ? true : x.price >= min))
      .filter((x) => (max === null ? true : x.price <= max))
      .filter((x) => {
        if (!q) return true;
        return (
          x.title.toLowerCase().includes(q) ||
          x.district.toLowerCase().includes(q) ||
          (x.description && x.description.toLowerCase().includes(q))
        );
      });
  }, [listings, dealType, propertyType, district, priceMin, priceMax, query]);

  const formatPrice = (n) =>
    new Intl.NumberFormat("ru-RU").format(n) + (dealType === "rent" ? " ₽/мес" : " ₽");

  const statusMeta = (status) => {
    switch (status) {
      case "available":
        return { label: "Доступен", cls: "bg-emerald-50 text-emerald-700" };
      case "sold":
        return { label: "Продан", cls: "bg-rose-50 text-rose-700" };
      case "rented":
        return { label: "Сдан", cls: "bg-sky-50 text-sky-700" };
      default:
        return { label: status, cls: "bg-gray-100 text-gray-700" };
    }
  };

  const typeLabels = {
    'apartment': 'Квартира',
    'house': 'Дом',
    'commercial': 'Коммерческая'
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gray-900" />
            <span className="font-extrabold tracking-tight text-gray-900">Недвижимость</span>
          </Link>

          <nav className="flex items-center gap-2">
            {localStorage.getItem("role") === "owner" && (
              <Link
                to="/create-property"
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-extrabold text-white hover:bg-emerald-700"
              >
                + Добавить объект
              </Link>
            )}
            <a
              href="#catalog"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
            >
              Каталог
            </a>

            {isAuthed && (
              <Link
                to="/favorites"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
              >
                Избранное
              </Link>
            )}
            {!isAuthed ? (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Вход
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-gray-800"
                >
                  Регистрация
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/profile"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Профиль
                </Link>
                <Link
                  to="/logout"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Выйти
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-gray-900/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-6 lg:grid-cols-[1fr,360px] lg:items-start">
            <div>
              <h1 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
                Найдите жильё для аренды или покупки
              </h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                Фильтруйте объекты по району, цене и типу недвижимости — всё в одном месте.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <input
                  className="w-full flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 placeholder:text-gray-400"
                  placeholder="Поиск по объектам (адрес, тип, характеристики)…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-gray-800"
                  onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
                  type="button"
                >
                  Искать
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <main id="catalog" className="py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-extrabold text-gray-900">Каталог недвижимости</h2>
            <div className="text-sm text-gray-600">
              Найдено: <span className="font-extrabold text-gray-900">{filtered.length}</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
            {/* Filters */}
            <aside className="top-[76px] h-fit rounded-2xl border border-gray-200 bg-white p-4 lg:sticky">
              <h3 className="mb-3 text-base font-extrabold text-gray-900">Фильтры</h3>

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Тип сделки</label>
                <div className="flex gap-2 rounded-2xl bg-gray-100 p-1.5">
                  <button
                    type="button"
                    onClick={() => setDealType("rent")}
                    className={[
                      "flex-1 rounded-xl px-3 py-2 text-sm font-bold",
                      dealType === "rent"
                        ? "border border-gray-200 bg-white text-gray-900"
                        : "text-gray-700 hover:bg-white/60",
                    ].join(" ")}
                  >
                    Аренда
                  </button>
                  <button
                    type="button"
                    onClick={() => setDealType("buy")}
                    className={[
                      "flex-1 rounded-xl px-3 py-2 text-sm font-bold",
                      dealType === "buy"
                        ? "border border-gray-200 bg-white text-gray-900"
                        : "text-gray-700 hover:bg-white/60",
                    ].join(" ")}
                  >
                    Покупка
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Тип недвижимости
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  <option value="any">Любой</option>
                  <option value="apartment">Квартира</option>
                  <option value="house">Дом</option>
                  <option value="commercial">Коммерческая</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Диапазон цены
                </label>
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 placeholder:text-gray-400"
                    placeholder="От"
                    inputMode="numeric"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value.replace(/[^\d]/g, ""))}
                  />
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 placeholder:text-gray-400"
                    placeholder="До"
                    inputMode="numeric"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {dealType === "rent" ? "₽/мес" : "₽"}
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Район</label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option value="any">Любой</option>
                  <option value="center">Центральный</option>
                  <option value="north">Северный</option>
                  <option value="south">Южный</option>
                </select>
              </div>

              <div className="h-px w-full bg-gray-200" />

              <button
                className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-extrabold text-gray-900 hover:bg-gray-100"
                type="button"
                onClick={() => {
                  setDealType("rent");
                  setPropertyType("any");
                  setDistrict("any");
                  setPriceMin("");
                  setPriceMax("");
                  setQuery("");
                }}
              >
                Сбросить фильтры
              </button>
            </aside>

            {/* Listings */}
            <section className="min-w-0">
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((item) => {
                  const s = statusMeta(item.status);

                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                    >
                      <Link to={`/property/${item.id}`}>
                        <div className="relative h-44 bg-gray-100">
                          <img 
                            src={item.image || 'https://via.placeholder.com/300x200?text=Нет+фото'} 
                            alt={item.title} 
                            className="h-full w-full object-cover" 
                          />
                          <span
                            className={[
                              "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold",
                              s.cls,
                            ].join(" ")}
                          >
                            {s.label}
                          </span>

                          {}
                          <button
                            onClick={(e) => toggleFavorite(e, item.id)}
                            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 backdrop-blur hover:bg-white shadow-sm"
                          >
                            {favorites.has(item.id) 
                              ? <HeartFilled className="text-red-500 text-lg" />
                              : <HeartOutlined className="text-gray-700 text-lg" />
                            }
                          </button>
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-base font-extrabold leading-snug text-gray-900">{item.title}</h4>
                            <div className="whitespace-nowrap text-sm font-extrabold text-gray-900">
                              {formatPrice(item.price)}
                            </div>
                          </div>

                          <div className="mt-1 text-sm text-gray-600">{item.district}</div>
                          <div className="mt-1 text-sm text-gray-500">
                            {typeLabels[item.property_type]} • {item.deal === 'rent' ? 'Аренда' : 'Продажа'}
                          </div>

                          <button
                            className="mt-4 w-full rounded-xl border border-gray-900 bg-white px-3 py-2 text-sm font-extrabold text-gray-900 hover:bg-gray-50"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isAuthed) return setAuthModalOpen(true);
                              alert("Открыть чат/контакты (пока демо).");
                            }}
                          >
                            Связаться
                          </button>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-600">
                  <div className="font-extrabold text-gray-900">Ничего не найдено.</div>
                  <div className="mt-1">Попробуйте изменить фильтры или запрос.</div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-gray-600">
          <div className="text-gray-600">© {new Date().getFullYear()} Платформа недвижимости</div>
        </div>
      </footer>

      {/* Auth modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <div className="text-lg font-extrabold text-gray-900">Нужна авторизация</div>
            <p className="mt-1 text-sm text-gray-600">
              Чтобы связаться с собственником, войдите или зарегистрируйтесь.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                to="/login"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-extrabold text-gray-900 hover:bg-gray-50"
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="flex-1 rounded-xl bg-gray-900 px-3 py-2 text-center text-sm font-extrabold text-white hover:bg-gray-800"
              >
                Регистрация
              </Link>
            </div>
            <button
              className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              type="button"
              onClick={() => setAuthModalOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}