import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [dealType, setDealType] = useState("rent"); // rent | buy
  const [propertyType, setPropertyType] = useState("any"); // any | apartment | house | commercial
  const [district, setDistrict] = useState("any"); // any | center | north | south
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [query, setQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // ПРИМЕР: подставь свою логику (token, user, cookie и т.д.)
  const isAuthed = Boolean(localStorage.getItem("access") || localStorage.getItem("token"));

  const listings = useMemo(
    () => [
      {
        id: 1,
        title: "1-комн. квартира, 38 м²",
        address: "Центральный район",
        price: 45000,
        deal: "rent",
        type: "apartment",
        district: "center",
        status: "available", // available | sold | rented
        features: ["38 м²", "2/9 этаж", "Метро 7 мин"],
        image:
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
      },
      {
        id: 2,
        title: "Дом, 140 м², участок 6 сот.",
        address: "Северный район",
        price: 12900000,
        deal: "buy",
        type: "house",
        district: "north",
        status: "sold",
        features: ["140 м²", "3 спальни", "Гараж"],
        image:
          "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80",
      },
      {
        id: 3,
        title: "Студия, 24 м²",
        address: "Южный район",
        price: 32000,
        deal: "rent",
        type: "apartment",
        district: "south",
        status: "rented",
        features: ["24 м²", "Новый ремонт", "Балкон"],
        image:
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const min = priceMin === "" ? null : Number(priceMin);
    const max = priceMax === "" ? null : Number(priceMax);
    const q = query.trim().toLowerCase();

    return listings
      .filter((x) => (dealType ? x.deal === dealType : true))
      .filter((x) => (propertyType === "any" ? true : x.type === propertyType))
      .filter((x) => (district === "any" ? true : x.district === district))
      .filter((x) => (min === null ? true : x.price >= min))
      .filter((x) => (max === null ? true : x.price <= max))
      .filter((x) => {
        if (!q) return true;
        return (
          x.title.toLowerCase().includes(q) ||
          x.address.toLowerCase().includes(q) ||
          x.features.join(" ").toLowerCase().includes(q)
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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gray-900" />
            <span className="font-extrabold tracking-tight text-gray-900">Недвижимость</span>
          </div>

          <nav className="flex items-center gap-2">
            <a
              href="#catalog"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
            >
              Каталог
            </a>

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
              <Link
                to="/logout"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
              >
                Выйти
              </Link>
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

            {/* CTA card вместо видимых форм */}
            {!isAuthed && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-extrabold text-gray-900">Чтобы связаться с собственником</div>
                <p className="mt-1 text-sm text-gray-600">
                  Войдите или зарегистрируйтесь — это займёт минуту.
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    to="/login"
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-sm font-extrabold text-gray-900 hover:bg-gray-50"
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
                <div className="mt-3 text-xs text-gray-500">
                  Демо-данные. Реальные контакты скрыты без авторизации.
                </div>
              </div>
            )}
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
                  {dealType === "rent" ? "₽/мес" : "₽"} — демо, без валидации.
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
                      <div className="relative h-44 bg-gray-100">
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                        <span
                          className={[
                            "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold",
                            s.cls,
                          ].join(" ")}
                        >
                          {s.label}
                        </span>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-base font-extrabold leading-snug text-gray-900">{item.title}</h4>
                          <div className="whitespace-nowrap text-sm font-extrabold text-gray-900">
                            {formatPrice(item.price)}
                          </div>
                        </div>

                        <div className="mt-1 text-sm text-gray-600">{item.address}</div>

                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                          {item.features.map((f, idx) => (
                            <li key={idx}>{f}</li>
                          ))}
                        </ul>

                        <button
                          className="mt-4 w-full rounded-xl border border-gray-900 bg-white px-3 py-2 text-sm font-extrabold text-gray-900 hover:bg-gray-50"
                          type="button"
                          onClick={() => {
                            if (!isAuthed) return setAuthModalOpen(true);
                            // тут будет действие "связаться"
                            alert("Открыть чат/контакты (пока демо).");
                          }}
                        >
                          Связаться
                        </button>
                      </div>
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
          <div className="flex items-center gap-3">
            <a href="#catalog" className="text-gray-600 hover:text-gray-900">
              Каталог
            </a>
            {!isAuthed ? (
              <>
                <Link to="/register" className="text-gray-600 hover:text-gray-900">
                  Регистрация
                </Link>
                <Link to="/login" className="text-gray-600 hover:text-gray-900">
                  Вход
                </Link>
              </>
            ) : (
              <Link to="/logout" className="text-gray-600 hover:text-gray-900">
                Выйти
              </Link>
            )}
          </div>
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