import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function MapView() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    
    const [dealType, setDealType] = useState("rent");
    const [propertyType, setPropertyType] = useState("any");
    const [priceMin, setPriceMin] = useState("");
    const [priceMax, setPriceMax] = useState("");
    
    const isAuthed = Boolean(localStorage.getItem("access") || localStorage.getItem("token"));
    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

    useEffect(() => {
        const existingScript = document.querySelector(`script[src*="api-maps.yandex.ru"]`);
        
        if (existingScript) {
            if (window.ymaps) {
                window.ymaps.ready(() => setMapLoaded(true));
            }
            return;
        }

        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
        script.type = 'text/javascript';
        script.onload = () => {
            window.ymaps.ready(() => setMapLoaded(true));
        };
        document.head.appendChild(script);

    }, [apiKey]);

    useEffect(() => {
        axios.get("http://localhost:8000/api/properties/")
            .then(res => {
                setProperties(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Фильтрация объектов
    const filteredProperties = useMemo(() => {
        const min = priceMin === "" ? null : Number(priceMin);
        const max = priceMax === "" ? null : Number(priceMax);

        return properties
            .filter(p => p.latitude && p.longitude)
            .filter(p => dealType ? p.deal === dealType : true)
            .filter(p => propertyType === "any" ? true : p.property_type === propertyType)
            .filter(p => min === null ? true : p.price >= min)
            .filter(p => max === null ? true : p.price <= max);
    }, [properties, dealType, propertyType, priceMin, priceMax]);

    // Инициализируем карту
    useEffect(() => {
        if (!mapLoaded || !filteredProperties.length) return;

        const initMap = () => {
            if (mapInstanceRef.current) return;

            const center = [55.7887, 49.1221]; // Казань

            const map = new window.ymaps.Map(mapRef.current, {
                center: center,
                zoom: 12,
                controls: ['zoomControl', 'fullscreenControl']
            });

            mapInstanceRef.current = map;

            // Добавляем метки
            if (filteredProperties.length > 0) {
                const firstProp = filteredProperties[0];
                map.setCenter([firstProp.latitude, firstProp.longitude]);
                
                filteredProperties.forEach(prop => {
                    const placemark = new window.ymaps.Placemark(
                        [prop.latitude, prop.longitude],
                        {
                            balloonContentHeader: `<strong>${prop.title}</strong>`,
                            balloonContentBody: `
                                <div style="min-width: 200px;">
                                    <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #1890ff;">
                                        ${new Intl.NumberFormat("ru-RU").format(prop.price)} 
                                        ${prop.deal === "rent" ? "₽/мес" : "₽"}
                                    </p>
                                    <p style="margin: 5px 0;">${prop.address || 'Адрес не указан'}</p>
                                    <a href="/property/${prop.id}" style="
                                        display: inline-block;
                                        margin-top: 8px;
                                        padding: 6px 12px;
                                        background: #111827;
                                        color: white;
                                        text-decoration: none;
                                        border-radius: 8px;
                                        font-size: 12px;
                                        font-weight: bold;
                                    ">Подробнее →</a>
                                </div>
                            `,
                            hintContent: prop.title
                        },
                        {
                            preset: 'islands#blueHomeIcon',
                            iconColor: prop.deal === 'rent' ? '#10b981' : '#3b82f6'
                        }
                    );
                    map.geoObjects.add(placemark);
                });
            }
        };

        window.ymaps.ready(initMap);
    }, [mapLoaded, filteredProperties]);

    // Обновляем карту при изменении фильтров
    useEffect(() => {
        if (!mapLoaded || !mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        
        // Очищаем старые метки
        map.geoObjects.removeAll();
        
        if (filteredProperties.length === 0) return;
        
        // Центрируем карту по первому объекту
        const firstProp = filteredProperties[0];
        map.setCenter([firstProp.latitude, firstProp.longitude]);

        // Добавляем новые метки
        filteredProperties.forEach(prop => {
            const placemark = new window.ymaps.Placemark(
                [prop.latitude, prop.longitude],
                {
                    balloonContentHeader: `<strong>${prop.title}</strong>`,
                    balloonContentBody: `
                        <div style="min-width: 200px;">
                            <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #1890ff;">
                                ${new Intl.NumberFormat("ru-RU").format(prop.price)} 
                                ${prop.deal === "rent" ? "₽/мес" : "₽"}
                            </p>
                            <p style="margin: 5px 0;">${prop.address || 'Адрес не указан'}</p>
                            <a href="/property/${prop.id}" style="
                                display: inline-block;
                                margin-top: 8px;
                                padding: 6px 12px;
                                background: #111827;
                                color: white;
                                text-decoration: none;
                                border-radius: 8px;
                                font-size: 12px;
                                font-weight: bold;
                            ">Подробнее →</a>
                        </div>
                    `,
                    hintContent: prop.title
                },
                {
                    preset: 'islands#blueHomeIcon',
                    iconColor: prop.deal === 'rent' ? '#10b981' : '#3b82f6'
                }
            );
            map.geoObjects.add(placemark);
        });
    }, [mapLoaded, filteredProperties, dealType, propertyType, priceMin, priceMax]);

    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const typeLabels = {
        'apartment': 'Квартира',
        'house': 'Дом',
        'commercial': 'Коммерческая'
    };

    return (
        <div className="min-h-screen bg-white text-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-gray-900" />
                        <span className="font-extrabold tracking-tight text-gray-900">Недвижимость</span>
                    </Link>

                    <nav className="flex items-center gap-2">
                        <Link to="/" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
                            Каталог
                        </Link>
                        <Link to="/map" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-100">
                            Карта
                        </Link>
                        {localStorage.getItem("role") === "owner" && (
                            <Link to="/create-property" className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-extrabold text-white hover:bg-emerald-700">
                                + Добавить объект
                            </Link>
                        )}
                        {!isAuthed ? (
                            <>
                                <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">Вход</Link>
                                <Link to="/register" className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-gray-800">Регистрация</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/favorites" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">Избранное</Link>
                                <Link to="/profile" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">Профиль</Link>
                                <Link to="/logout" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">Выйти</Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* Фильтры + Карта */}
            <div className="flex h-[calc(100vh-60px)]">
                {/* Панель фильтров */}
                <aside className="w-80 border-r border-gray-200 bg-white p-4 overflow-y-auto">
                    <h3 className="mb-4 text-base font-extrabold text-gray-900">Фильтры</h3>

                    <div className="mb-4">
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">Тип сделки</label>
                        <div className="flex gap-2 rounded-2xl bg-gray-100 p-1.5">
                            <button
                                type="button"
                                onClick={() => setDealType("rent")}
                                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                                    dealType === "rent"
                                        ? "border border-gray-200 bg-white text-gray-900"
                                        : "text-gray-700 hover:bg-white/60"
                                }`}
                            >
                                Аренда
                            </button>
                            <button
                                type="button"
                                onClick={() => setDealType("buy")}
                                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                                    dealType === "buy"
                                        ? "border border-gray-200 bg-white text-gray-900"
                                        : "text-gray-700 hover:bg-white/60"
                                }`}
                            >
                                Покупка
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">Тип недвижимости</label>
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

                    <div className="mb-4">
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">Диапазон цены</label>
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

                    <div className="h-px w-full bg-gray-200 my-4" />

                    <button
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-extrabold text-gray-900 hover:bg-gray-100"
                        type="button"
                        onClick={() => {
                            setDealType("rent");
                            setPropertyType("any");
                            setPriceMin("");
                            setPriceMax("");
                        }}
                    >
                        Сбросить фильтры
                    </button>

                    <div className="mt-4 text-sm text-gray-600">
                        Найдено: <span className="font-extrabold text-gray-900">{filteredProperties.length}</span>
                    </div>
                </aside>

                {/* Карта */}
                <main className="flex-1 relative">
                    {loading || !mapLoaded ? (
                        <div className="flex justify-center py-20">
                            <div className="text-gray-500">Загрузка карты...</div>
                        </div>
                    ) : filteredProperties.length === 0 ? (
                        <div className="flex justify-center py-20">
                            <div className="text-gray-500">Нет объектов по фильтрам</div>
                        </div>
                    ) : (
                        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                    )}
                </main>
            </div>
        </div>
    );
}