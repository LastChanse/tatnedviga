import React, { useMemo, useState } from "react";

export default function HomePage() {
  const [dealType, setDealType] = useState("rent"); // rent | buy
  const [propertyType, setPropertyType] = useState("any"); // any | apartment | house | commercial
  const [district, setDistrict] = useState("any"); // any | center | north | south
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [query, setQuery] = useState("");

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
    new Intl.NumberFormat("ru-RU").format(n) +
    (dealType === "rent" ? " ₽/мес" : " ₽");

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
            <span className="font-extrabold tracking-tight text-[100px]">Недвижимость</span>
          </div>

          <nav className="flex items-center gap-2">
            <a
              href="#catalog"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
            >
              Каталог
            </a>
            <a
              href="#auth"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
            >
              Вход
            </a>
            <a
              href="#register"
              className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-gray-800"
            >
              Регистрация
            </a>
          </nav>
        </div>
      </header>

      {/* Hero + Search */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-gray-900/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
            Найдите жильё для аренды или покупки
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Фильтруйте объекты по району, цене и типу недвижимости — всё в одном месте.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <input
              className="w-full flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400 md:min-w-[520px]"
              placeholder="Поиск по объектам (адрес, тип, характеристики)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-gray-800"
              onClick={() =>
                document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })
              }
              type="button"
            >
              Искать
            </button>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <main id="catalog" className="py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-extrabold">Каталог недвижимости</h2>
            <div className="text-sm text-gray-600">
              Найдено: <span className="font-extrabold text-gray-900">{filtered.length}</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
            {/* Filters */}
            <aside className="top-[76px] h-fit rounded-2xl border border-gray-200 bg-white p-4 lg:sticky">
              <h3 className="mb-3 text-base font-extrabold">Фильтры</h3>

              {/* Deal type */}
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Тип сделки
                </label>
                <div className="flex gap-2 rounded-2xl bg-gray-100 p-1.5">
                  <button
                    type="button"
                    onClick={() => setDealType("rent")}
                    className={[
                      "flex-1 rounded-xl px-3 py-2 text-sm font-bold",
                      dealType === "rent"
                        ? "border border-gray-200 bg-white"
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
                        ? "border border-gray-200 bg-white"
                        : "text-gray-700 hover:bg-white/60",
                    ].join(" ")}
                  >
                    Покупка
                  </button>
                </div>
              </div>

              {/* Property type */}
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Тип недвижимости
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  <option value="any">Любой</option>
                  <option value="apartment">Квартира</option>
                  <option value="house">Дом</option>
                  <option value="commercial">Коммерческая</option>
                </select>
              </div>

              {/* Price range */}
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Диапазон цены
                </label>
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="От"
                    inputMode="numeric"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value.replace(/[^\d]/g, ""))}
                  />
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
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

              {/* District */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Район
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
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
                        <img
                          src={item.image}
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
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-base font-extrabold leading-snug">
                            {item.title}
                          </h4>
                          <div className="whitespace-nowrap text-sm font-extrabold">
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
                          onClick={() =>
                            alert("Нужно войти, чтобы связаться с собственником.")
                          }
                        >
                          Войти для связи
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

      {/* Registration */}
      <section id="register" className="py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-extrabold">Регистрация</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="text-base font-extrabold">Выбор роли</h3>
              <div className="mt-3 flex gap-2 rounded-2xl bg-gray-100 p-1.5">
                <button
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-extrabold"
                  type="button"
                >
                  Клиент
                </button>
                <button
                  className="flex-1 rounded-xl px-3 py-2 text-sm font-extrabold text-gray-700 hover:bg-white/60"
                  type="button"
                >
                  Собственник
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                В демо роль не сохраняется — это UI по карте сайта.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="text-base font-extrabold">Форма регистрации</h3>
              <form
                className="mt-3 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Регистрация (демо).");
                }}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="Имя"
                  />
                  <input
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="Телефон"
                  />
                </div>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  placeholder="Email"
                  type="email"
                />
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  placeholder="Пароль"
                  type="password"
                />
                <button
                  className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-gray-800"
                  type="submit"
                >
                  Зарегистрироваться
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Auth */}
      <section id="auth" className="border-t border-gray-200 bg-gray-50 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-extrabold">Вход (Авторизация)</h2>

          <div className="mt-4 max-w-xl rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-base font-extrabold">Войти в аккаунт</h3>
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Вход (демо).");
              }}
            >
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                placeholder="Email"
                type="email"
              />
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                placeholder="Пароль"
                type="password"
              />
              <button
                className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-gray-800"
                type="submit"
              >
                Войти
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-500">
              После входа можно будет нажимать «Войти для связи» на карточках.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-gray-600">
          <div>© {new Date().getFullYear()} Платформа недвижимости</div>
          <div className="flex items-center gap-3">
            <a href="#catalog" className="hover:text-gray-900">
              Каталог
            </a>
            <a href="#register" className="hover:text-gray-900">
              Регистрация
            </a>
            <a href="#auth" className="hover:text-gray-900">
              Вход
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}