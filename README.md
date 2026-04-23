# Татнедвижимость

Современное полнофункциональное веб-приложение, построенное с
использованием Django REST Framework (DRF) для бэкенда и React для
фронтенда.

## 🔗 Связанные файлы проекта

- [📘 База знаний](./BASE.md)
- [📋 Правила работы](./RULES.md)
- [🗂 Список задач](./TODO.md)

## 🌟 Возможности

-   **Аутентификация пользователей**

    -   Аутентификация на основе JWT
    -   Безопасный вход/выход
    -   Защищённые маршруты

-   **Фронтенд**

    -   Построен на React 18 и Vite
    -   Адаптивный дизайн с Taiwind CSS и Ant Design
    -   Клиентская маршрутизация с React Router

-   **Бэкенд**

    -   Django REST Framework для API
    -   База данных SQLite (легко заменить на PostgreSQL)
    -   JWT-аутентификация
    -   Настроены CORS-заголовки

## 🛠 Структура проекта

    Django-React-Template/
    ├── backend/                  # Django проект
    │   ├── api/                  # Основное приложение с API
    │   ├── backend/              # Настройки и конфигурации проекта
    │   ├── manage.py
    │   └── requirements.txt
    │
    ├── frontend/                 # React фронтенд
    │   ├── public/               # Статические файлы
    │   └── src/
    │       ├── components/       # Переиспользуемые UI-компоненты
    │       ├── pages/            # Страницы
    │       ├── styles/           # Глобальные стили и переменные
    │       ├── App.jsx           # Главный компонент
    │       └── main.jsx          # Точка входа
    │
    ├── .env.example             # Пример переменных окружения
    └── README.md                # Этот файл


## 🚀 Быстрый старт

### Требования

-   Python 3.8+
-   Node.js 16+
-   npm или yarn

### Настройка бэкенда

1.  **Создать и активировать виртуальное окружение**

    ``` bash
    # Windows
    python -m venv venv
    .\venv\Scripts\activate

    # macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  **Установить зависимости Python**

    ``` bash
    cd backend
    pip install -r requirements.txt
    ```

3.  **Настроить переменные окружения**

    Скопируйте `.env.example` в `.env`, `frontend/.env.example` в `frontend/.env` и обновите значения:

    ``` bash
    cp .env.example .env
    cp frontend/.env.example frontend/.env
    ```

4.  **Выполнить миграции**

    ``` bash
    python manage.py makemigrations
    python manage.py migrate
    ```

5.  **Создать суперпользователя (необязательно)**

    ``` bash
    python manage.py createsuperuser
    ```

### Настройка фронтенда

1.  **Установить зависимости Node.js**

    ``` bash
    cd frontend
    npm install
    # или
    yarn install
    ```

## 🏃 Запуск приложения

1.  **Запуск Django бэкенда**

    ``` bash
    cd backend
    python manage.py runserver
    ```

    -   API: http://localhost:8000
    -   Админка: http://localhost:8000/admin

2.  **Запуск React фронтенда** (в новом терминале)

    ``` bash
    cd frontend
    npm run dev
    ```

    -   Фронтенд: http://localhost:5173

## Запуск в `Docker`

* Сборка образов и запуск всех сервисов

```bash
docker-compose up --build
```

* Остановить и полностью удалить все данные

```bash
docker-compose down -v
```

* Если нужно применить новые миграции или перезагрузить сервер:
```bash
docker-compose restart backend
```

* Применение миграций без перезапуска
```bash
docker exec -it tatnedviga-backend bash

python manage.py makemigrations
python manage.py migrate
```

**‼️ Большинство проблем решаются через последовательность команд:**
```bash
docker-compose down -v
docker-compose up --build
```

## 🛠 Доступные команды

### Бэкенд

-   `python manage.py runserver` --- Запуск сервера разработки
-   `python manage.py makemigrations` --- Создание миграций
-   `python manage.py migrate` --- Применение миграций
-   `python manage.py createsuperuser` --- Создание администратора

### Фронтенд

-   `npm run dev` --- Запуск сервера разработки
-   `npm run build` --- Сборка для продакшена
-   `npm run lint` --- Проверка кода
-   `npm run preview` --- Предпросмотр сборки

## 🔧 Используемые технологии

-   **Фронтенд**

    -   React 18
    -   React Router 6
    -   Vite
    -   Tainwind CSS Modules
    -   Ant design Modules
    -   Axios для запросов к API

-   **Бэкенд**

    -   Django 4.2
    -   Django REST Framework
    -   djangorestframework-simplejwt
    -   django-cors-headers

## 🙏 Благодарности

-   Сообществам Django и React за отличную документацию
-   Vite за быстрый опыт разработки