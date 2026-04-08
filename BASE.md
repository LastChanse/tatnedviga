# База знаний проекта (Wiki)

# 🔐 Аутентификация (по коммитам)

## Реализовано:

- логин по email + password
- JWT (access + refresh)
- хранение токена на клиенте

---

## 🔹 API прототип

```http
POST /api/auth/login/
```

### Request:

```json
{
  "email": "user@mail.com",
  "password": "123456"
}
```

### Response:

```json
{
  "access": "jwt",
  "refresh": "jwt",
  "user": {
    "id": 1,
    "role": "client"
  }
}
```

---

## 🔹 Frontend прототип

```js
async function login(email, password) {
  return axios.post("/api/auth/login/", { email, password });
}
```

---

# 👤 Роли пользователей

## Возможные роли:

- client
- owner

## Логика:

```js
if (user.role === "owner") {
  navigate("/owner");
} else {
  navigate("/");
}
```

---

# 🏠 Недвижимость

## Модель

```python
class Property(models.Model):
    title = models.CharField(...)
    description = models.TextField()
    price = models.DecimalField(...)
    type = models.CharField(...)
    deal_type = models.CharField(...)
```

---

## API

### Получение списка

```http
GET /api/properties/
```

### Фильтрация

```http
GET /api/properties/?type=house&price_min=1000
```

---

## Frontend

```js
function fetchProperties(filters) {
  return axios.get("/api/properties", { params: filters });
}
```

---

# ⭐ Избранное

## API

```http
POST /api/favorites/
DELETE /api/favorites/:id/
GET /api/favorites/
```

---

## Прототип

```python
def add_to_favorites(user_id, property_id):
    pass
```

---

# 📅 Заявки на просмотр

## API

```http
POST /api/requests/
GET /api/requests/
PATCH /api/requests/:id/
```

---

## Формат

```json
{
  "property_id": 1,
  "date": "2026-04-10",
  "time": "14:00"
}
```

---

# 🧪 Заглушки

```python
def get_properties():
    return [
        {"id": 1, "title": "Квартира"},
        {"id": 2, "title": "Дом"}
    ]
```

---

# 🔗 Правила интеграции

## Backend → Frontend

```http
Authorization: Bearer <token>
```

---

## Контракты

Обязательно фиксируются:

- endpoint
- request
- response
- ошибки

---

# ⚠️ Зависимости между задачами

Аутентификация → профиль / избранное / заявки

---

# 🧱 Пример интеграции

## До backend

```js
function mockLogin() {
  return Promise.resolve({
    access: "fake-token",
    user: { role: "client" }
  });
}
```

---

## После

```js
login(email, password)
```

---

# 🗄️ База данных и регистрация

## База данных по умолчанию

Проект использует **SQLite** (встроенная БД, идёт в комплекте с Django).

- Файл БД: `db.sqlite3` (создаётся автоматически после миграций)
- Не требует отдельной установки или настройки
- Для продакшена рекомендуется переключиться на PostgreSQL

---

## ✅ Регистрация пользователей

### Реализовано:

- создание нового пользователя (email + пароль)
- валидация на сервере
- автоматическое сохранение в БД

---

### API эндпоинт

```http
POST /api/register/
