import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartFilled, ArrowLeftOutlined } from '@ant-design/icons';
import { favoriteService } from '../services/favoriteService';

export default function Favorites() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    const isAuthed = Boolean(localStorage.getItem("access") || localStorage.getItem("token"));

    useEffect(() => {
        favoriteService.getFavorites()
            .then(data => {
                setFavorites(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const removeFavorite = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await favoriteService.removeFavorite(id);
            setFavorites(favorites.filter(f => f.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const formatPrice = (n, deal) =>
        new Intl.NumberFormat("ru-RU").format(n) + (deal === "rent" ? " ₽/мес" : " ₽");

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
                        <Link
                            to="/"
                            className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                        >
                            Каталог
                        </Link>
                        {localStorage.getItem("role") === "owner" && (
                            <Link
                                to="/create-property"
                                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-extrabold text-white hover:bg-emerald-700"
                            >
                                + Добавить объект
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
                                    to="/favorites"
                                    className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-100"
                                >
                                    Избранное
                                </Link>
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

            {/* Main content */}
            <main className="py-8">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="mb-6 flex items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                        >
                            <ArrowLeftOutlined /> Назад
                        </button>
                        <h1 className="text-2xl font-extrabold text-gray-900">Избранное</h1>
                        <div className="text-sm text-gray-600">
                            <span className="font-extrabold text-gray-900">{favorites.length}</span> объектов
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="text-gray-500">Загрузка...</div>
                        </div>
                    ) : favorites.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                            <HeartFilled className="text-6xl text-gray-300 mb-4" />
                            <div className="text-xl font-extrabold text-gray-900 mb-2">Нет избранных объектов</div>
                            <p className="text-gray-600 mb-4">
                                Добавляйте понравившиеся объекты в избранное, чтобы не потерять их
                            </p>
                            <Link
                                to="/"
                                className="inline-block rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-gray-800"
                            >
                                Перейти в каталог
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {favorites.map(({ id, property }) => {
                                const s = statusMeta(property.status);
                                
                                return (
                                    <article
                                        key={id}
                                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white relative group"
                                    >
                                        <Link to={`/property/${property.id}`}>
                                            <div className="relative h-48 bg-gray-100">
                                                <img 
                                                    src={property.image || 'https://via.placeholder.com/300x200?text=Нет+фото'} 
                                                    alt={property.title} 
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
                                                
                                                {/* Кнопка удаления */}
                                                <button
                                                    onClick={(e) => removeFavorite(e, id)}
                                                    className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 backdrop-blur hover:bg-red-50 shadow-sm transition-colors"
                                                >
                                                    <HeartFilled className="text-red-500 text-lg" />
                                                </button>
                                            </div>

                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <h3 className="text-base font-extrabold leading-snug text-gray-900">
                                                        {property.title}
                                                    </h3>
                                                    <div className="whitespace-nowrap text-sm font-extrabold text-gray-900">
                                                        {formatPrice(property.price, property.deal)}
                                                    </div>
                                                </div>

                                                <div className="mt-1 text-sm text-gray-600">{property.address || 'Адрес не указан'}</div>
                                                <div className="mt-1 text-sm text-gray-500">
                                                    {typeLabels[property.property_type]} • {property.deal === 'rent' ? 'Аренда' : 'Продажа'}
                                                </div>

                                                <div className="mt-3 flex gap-2">
                                                    <span className="flex-1 text-center rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                                                        Добавлено: {new Date(property.created_at).toLocaleDateString('ru-RU')}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 py-6">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-gray-600">
                    <div className="text-gray-600">© {new Date().getFullYear()} Платформа недвижимости</div>
                </div>
            </footer>
        </div>
    );
}