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

# 👤 Профиль и разделение ролей

## Реализовано:

- добавлена кастомная модель пользователя (`CustomUser`)
- добавлено поле `role` в БД
- реализовано разделение ролей (client / owner + вычисляемые роли)
- добавлен профиль пользователя (получение + обновление)
- добавлена возможность смены пароля
- реализован возврат дополнительных данных (`is_admin`, `groups`, `role`)
- frontend обновлён: добавлена страница профиля и выбор роли при регистрации

---

## 🔹 Пользовательская модель

### Модель

```python
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ("client", "Клиент"),
        ("owner", "Собственник"),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
````

### Поля:

| Поле | Тип | Описание |
| --- | --- | --- |
| username | string | логин пользователя |
| email | string | email |
| password | string | пароль (хранится в хэшированном виде) |
| role | string | роль (`client` или `owner`) |
| is\_staff | boolean | доступ к админке |
| is\_superuser | boolean | полный доступ |

* * *

🔹 Регистрация
--------------

### API

```
POST /api/user/register/
```

### Request:

```
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "client | owner"
}
```

### Описание параметров:

| Поле | Тип | Обязательное | Описание |
| --- | --- | --- | --- |
| username | string | да | имя пользователя (≥ 3 символов) |
| email | string | да | email |
| password | string | да | пароль (≥ 6 символов) |
| role | string | да | роль пользователя |

* * *

🔹 Профиль пользователя
-----------------------

### API

#### Получение профиля

```
GET /api/profile/
```

#### Обновление профиля

```
PATCH /api/profile/
```

* * *

🔹 Формат профиля
-----------------

```
{
  "id": 1,
  "username": "user1",
  "email": "user@mail.com",
  "first_name": "Ivan",
  "last_name": "Ivanov",
  "is_admin": false,
  "groups": [],
  "role": "user"
}
```

* * *

🔹 ProfileSerializer
--------------------

### Поля:

| Поле | Тип | Описание |
| --- | --- | --- |
| id | number | id пользователя |
| username | string | логин |
| email | string | email |
| first\_name | string | имя |
| last\_name | string | фамилия |
| password | string | пароль (write-only) |
| is\_admin | boolean | является ли администратором |
| groups | array | список групп |
| role | string | вычисляемая роль |

* * *

🔹 Логика функций
-----------------

### get\_is\_admin(obj)

```
def get_is_admin(self, obj):
    return obj.is_staff or obj.is_superuser
```

**Параметры:**

| Параметр | Тип | Описание |
| --- | --- | --- |
| obj | User | объект пользователя |

**Возвращает:**

*   `boolean` — является ли пользователь администратором

* * *

### get\_groups(obj)

```
def get_groups(self, obj):
    return list(obj.groups.values_list("name", flat=True))
```

**Параметры:**

| Параметр | Тип | Описание |
| --- | --- | --- |
| obj | User | объект пользователя |

**Возвращает:**

*   `array[string]` — список групп

* * *

### get\_role(obj)

```
def get_role(self, obj):
    if obj.is_staff or obj.is_superuser:
        return "admin"

    groups = {group.lower() for group in obj.groups.values_list("name", flat=True)}
    publisher_groups = {"publisher", "seller", "agent", "realtor"}

    if groups.intersection(publisher_groups):
        return "publisher"

    return "user"
```

**Параметры:**

| Параметр | Тип | Описание |
| --- | --- | --- |
| obj | User | объект пользователя |

**Возвращает:**

*   `string` — роль (`admin`, `publisher`, `user`)

* * *

### update(instance, validated\_data)

```
def update(self, instance, validated_data):
    password = validated_data.pop("password", None)

    for attr, value in validated_data.items():
        setattr(instance, attr, value)

    if password:
        instance.set_password(password)

    instance.save()
    return instance
```

**Параметры:**

| Параметр | Тип | Описание |
| --- | --- | --- |
| instance | User | текущий пользователь |
| validated\_data | dict | данные для обновления |

**Поведение:**

*   обновляет поля пользователя
*   если передан пароль → хэшируется
*   сохраняет изменения в БД

* * *

🔹 Frontend
-----------

### Регистрация (выбор роли)

```
<Select placeholder="Выберите роль">
  <Option value="client">Клиент</Option>
  <Option value="owner">Собственник</Option>
</Select>
```

* * *

### Профиль

```
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
```

* * *

🔹 Интеграция
-------------

```
Authorization: Bearer <token>
```

* * *

⚠️ Зависимости между задачами
-----------------------------

Аутентификация → роли → профиль

