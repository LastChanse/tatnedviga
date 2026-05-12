import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartOutlined, HeartFilled, MessageOutlined } from '@ant-design/icons';
import { favoriteService } from '../services/favoriteService';
import { chatService } from '../services/chatService';
import axios from "axios";

const baseButton = "rounded-xl px-3 py-2 text-sm font-semibold transition-colors";
const activeButton = `${baseButton} bg-gray-900 text-white shadow-sm`;
const ghostButton = `${baseButton} text-gray-900 hover:bg-gray-100`;
const filterButton = "flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors";
const activeFilterButton = `${filterButton} bg-gray-900 text-white shadow-sm`;
const inactiveFilterButton = `${filterButton} text-gray-700 hover:bg-white/70`;

export default function HomePage() {
  const navigate = useNavigate();
  const [dealType, setDealType] = useState("rent");
  const [propertyType, setPropertyType] = useState("any");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [query, setQuery] = useState("");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [listings, setListings] = useState([]);
  const requestIdRef = useRef(0);

  const role = localStorage.getItem("role");
  const isOwner = role === "owner";
  const isClient = role === "client";
  const isAuthed = Boolean(localStorage.getItem("access") || localStorage.getItem("token"));

  const loadListings = async (onlyAvailable = showOnlyAvailable) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const params = onlyAvailable ? {} : { include_inactive: "true" };

    try {
      const res = await axios.get("http://localhost:8000/api/properties/", { params });
      if (requestIdRef.current === requestId) {
        setListings(res.data);
      }
    } catch (err) {
      if (requestIdRef.current === requestId) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    loadListings(showOnlyAvailable);
  }, [showOnlyAvailable]);

  useEffect(() => {
    if (isAuthed && isClient) {
      favoriteService.getFavorites()
        .then(data => setFavorites(new Set(data.map(f => f.property.id))))
        .catch(console.error);
    } else {
      setFavorites(new Set());
    }
  }, [isAuthed, isClient]);

  const toggleFavorite = async (e, propertyId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      setAuthModalOpen(true);
      return;
    }
    if (!isClient) return;
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

  const startChat = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      setAuthModalOpen(true);
      return;
    }
    if (!isClient) return;
    try {
      const conversation = await chatService.startConversation(item.id, `Здравствуйте! Интересует объект: ${item.title}`);
      navigate(`/chats/${conversation.id}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || 'Не удалось открыть чат');
    }
  };

  const filtered = useMemo(() => {
    const min = priceMin === "" ? null : Number(priceMin);
    const max = priceMax === "" ? null : Number(priceMax);
    const q = query.trim().toLowerCase();

    return listings
      .filter((x) => showOnlyAvailable ? x.is_active && x.status === "available" : true)
      .filter((x) => (dealType ? x.deal === dealType : true))
      .filter((x) => (propertyType === "any" ? true : x.property_type === propertyType))
      .filter((x) => (min === null ? true : x.price >= min))
      .filter((x) => (max === null ? true : x.price <= max))
      .filter((x) => {
        if (!q) return true;
        return (
          x.title?.toLowerCase().includes(q) ||
          x.address?.toLowerCase().includes(q) ||
          x.district?.toLowerCase().includes(q) ||
          x.description?.toLowerCase().includes(q)
        );
      });
  }, [listings, dealType, propertyType, priceMin, priceMax, query, showOnlyAvailable]);

  const formatPrice = (n, deal) =>
    new Intl.NumberFormat("ru-RU").format(n) + (deal === "rent" ? " ₽/мес" : " ₽");

  const statusMeta = (status) => {
    switch (status) {
      case "available": return { label: "Доступен", cls: "bg-emerald-50 text-emerald-700" };
      case "booked": return { label: "Забронирован", cls: "bg-amber-50 text-amber-700" };
      case "sold": return { label: "Продан", cls: "bg-rose-50 text-rose-700" };
      case "rented": return { label: "Сдан в аренду", cls: "bg-sky-50 text-sky-700" };
      default: return { label: status, cls: "bg-gray-100 text-gray-700" };
    }
  };

  const typeLabels = { apartment: 'Квартира', house: 'Дом', commercial: 'Коммерческая' };

  const resetFilters = () => {
    setDealType("rent");
    setPropertyType("any");
    setPriceMin("");
    setPriceMax("");
    setQuery("");
    setShowOnlyAvailable(true);
    loadListings(true);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gray-900" />
            <span className="font-extrabold tracking-tight text-gray-900">Недвижимость</span>
          </Link>

          <nav className="flex flex-wrap items-center justify-end gap-2">
            <a href="#catalog" className={activeButton}>Каталог</a>
            {isAuthed && <Link to="/chats" className={ghostButton}>Сообщения</Link>}

            {isOwner && (
              <>
                <Link to="/create-property" className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-700">+ Добавить объект</Link>
                <Link to="/owner/properties" className={ghostButton}>Мои объявления</Link>
              </>
            )}

            {!isOwner && (
              <>
                {isAuthed && <Link to="/favorites" className={ghostButton}>Избранное</Link>}
                <Link to="/map" className={ghostButton}>Карта</Link>
              </>
            )}

            {!isAuthed ? (
              <>
                <Link to="/login" className={ghostButton}>Вход</Link>
                <Link to="/register" className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-gray-800">Регистрация</Link>
              </>
            ) : (
              <>
                <Link to="/profile" className={ghostButton}>Профиль</Link>
                <Link to="/logout" className={ghostButton}>Выйти</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="border-b border-gray-200 bg-gradient-to-b from-gray-900/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">Найдите жильё для аренды или покупки</h1>
          <p className="mt-3 max-w-2xl text-gray-600">Фильтруйте объекты по району, цене, статусу и типу недвижимости.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <input className="w-full flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 placeholder:text-gray-400" placeholder="Поиск по объектам, адресу, району…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-gray-800" onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })} type="button">Искать</button>
          </div>
        </div>
      </section>

      <main id="catalog" className="py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Каталог недвижимости</h2>
              <p className="mt-1 text-sm text-gray-500">{showOnlyAvailable ? "Показаны только активные и доступные объекты" : "Показаны все объекты, включая неактивные и завершённые"}</p>
            </div>
            <div className="text-sm text-gray-600">Найдено: <span className="font-extrabold text-gray-900">{filtered.length}</span></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
            <aside className="top-[76px] h-fit rounded-2xl border border-gray-200 bg-white p-4 lg:sticky">
              <h3 className="mb-3 text-base font-extrabold text-gray-900">Фильтры</h3>
              <div className="mb-4 rounded-2xl bg-gray-100 p-1.5">
                <button type="button" onClick={() => setShowOnlyAvailable((value) => !value)} className={showOnlyAvailable ? activeFilterButton : inactiveFilterButton}>{showOnlyAvailable ? "✓ Только активные и доступные" : "Показать все объекты"}</button>
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Тип сделки</label>
                <div className="flex gap-2 rounded-2xl bg-gray-100 p-1.5">
                  <button type="button" onClick={() => setDealType("rent")} className={dealType === "rent" ? activeFilterButton : inactiveFilterButton}>Аренда</button>
                  <button type="button" onClick={() => setDealType("buy")} className={dealType === "buy" ? activeFilterButton : inactiveFilterButton}>Покупка</button>
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Тип недвижимости</label>
                <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  <option value="any">Любой</option><option value="apartment">Квартира</option><option value="house">Дом</option><option value="commercial">Коммерческая</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Диапазон цены</label>
                <div className="flex gap-2">
                  <input className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 placeholder:text-gray-400" placeholder="От" inputMode="numeric" value={priceMin} onChange={(e) => setPriceMin(e.target.value.replace(/[^\d]/g, ""))} />
                  <input className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 placeholder:text-gray-400" placeholder="До" inputMode="numeric" value={priceMax} onChange={(e) => setPriceMax(e.target.value.replace(/[^\d]/g, ""))} />
                </div>
                <div className="mt-2 text-xs text-gray-500">{dealType === "rent" ? "₽/мес" : "₽"}</div>
              </div>
              <div className="h-px w-full bg-gray-200" />
              <button className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-extrabold text-gray-900 hover:bg-gray-100" type="button" onClick={resetFilters}>Сбросить фильтры</button>
            </aside>

            <section className="min-w-0">
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((item) => {
                  const s = statusMeta(item.status);
                  const canClientAct = isClient && item.is_active && item.status === "available";
                  return (
                    <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <Link to={`/property/${item.id}`}>
                        <div className="relative h-44 bg-gray-100">
                          <img src={item.image || 'https://via.placeholder.com/300x200?text=Нет+фото'} alt={item.title} className="h-full w-full object-cover" />
                          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                            <span className={["rounded-full px-3 py-1 text-xs font-extrabold", s.cls].join(" ")}>{s.label}</span>
                            {!item.is_active && <span className="rounded-full bg-gray-900/80 px-3 py-1 text-xs font-extrabold text-white">Неактивно</span>}
                          </div>
                          {isClient && (
                            <button onClick={(e) => toggleFavorite(e, item.id)} className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur hover:bg-white" title="Избранное">
                              {favorites.has(item.id) ? <HeartFilled className="text-lg text-red-500" /> : <HeartOutlined className="text-lg text-gray-700" />}
                            </button>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-base font-extrabold leading-snug text-gray-900">{item.title}</h4>
                            <div className="whitespace-nowrap text-sm font-extrabold text-gray-900">{formatPrice(item.price, item.deal)}</div>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">{item.address || 'Адрес не указан'}</div>
                          <div className="mt-1 text-sm text-gray-500">{typeLabels[item.property_type]} • {item.deal === 'rent' ? 'Аренда' : 'Продажа'}{item.district ? ` • ${item.district}` : ''}</div>

                          {isOwner ? (
                            <Link to="/owner/properties" className="mt-4 block w-full rounded-xl border border-gray-900 bg-white px-3 py-2 text-center text-sm font-extrabold text-gray-900 hover:bg-gray-50" onClick={(e) => e.stopPropagation()}>Управлять объявлениями</Link>
                          ) : (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              <button className={canClientAct ? "rounded-xl border border-gray-900 bg-white px-3 py-2 text-sm font-extrabold text-gray-900 hover:bg-gray-50" : "rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-extrabold text-gray-500"} type="button" disabled={!canClientAct} onClick={(e) => { e.preventDefault(); if (!isAuthed) return setAuthModalOpen(true); if (canClientAct) window.location.href = `/property/${item.id}`; }}>{canClientAct ? "Подробнее" : "Недоступно"}</button>
                              <button className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-gray-800" type="button" onClick={(e) => startChat(e, item)}><MessageOutlined /> Связаться</button>
                            </div>
                          )}
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
              {filtered.length === 0 && <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-600"><div className="font-extrabold text-gray-900">Ничего не найдено.</div><div className="mt-1">Попробуйте изменить фильтры или выключить фильтр активных доступных объектов.</div></div>}
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-gray-600"><div>© {new Date().getFullYear()} Платформа недвижимости</div></div></footer>

      {authModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <div className="text-lg font-extrabold text-gray-900">Нужна авторизация</div>
            <p className="mt-1 text-sm text-gray-600">Чтобы добавить объект в избранное, записаться на просмотр или написать собственнику, войдите или зарегистрируйтесь.</p>
            <div className="mt-4 flex gap-2"><Link to="/login" className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-extrabold text-gray-900 hover:bg-gray-50">Войти</Link><Link to="/register" className="flex-1 rounded-xl bg-gray-900 px-3 py-2 text-center text-sm font-extrabold text-white hover:bg-gray-800">Регистрация</Link></div>
            <button className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50" type="button" onClick={() => setAuthModalOpen(false)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
