# Club — Telegram Mini App

Веб-приложение для управления клубом: мероприятия, участники, профили. Работает как Telegram Mini App с авторизацией через `initData`.

## Стек

- **Next.js 16** + React 19, TypeScript
- **PostgreSQL** + Drizzle ORM
- **TailwindCSS 4** + Radix UI (shadcn/ui)
- **Telegram Mini App SDK** (`@telegram-apps/sdk-react`)
- **Biome** — линтер и форматтер
- **Docker** — multi-stage production build

## Требования

- Node.js 22+
- pnpm
- PostgreSQL
- Telegram Bot Token (для уведомлений)

## Переменные окружения

| Переменная     | Описание                        | Обязательна |
| -------------- | ------------------------------- | :---------: |
| `DATABASE_URL` | Строка подключения к PostgreSQL |      ✓      |
| `BOT_TOKEN`    | Токен Telegram-бота             |             |

Создайте `.env` файл в корне проекта:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/club
BOT_TOKEN=123456789:ABCDefGHijKLmnopqrStuVwxyz
```

## Запуск

```bash
# Установка зависимостей
pnpm install

# Применение схемы БД
pnpm db:push

# Заполнение тестовых данных (опционально)
pnpm db:seed

# Запуск dev-сервера
pnpm dev
```

## Скрипты

| Команда            | Описание                     |
| ------------------ | ---------------------------- |
| `pnpm dev`         | Запуск dev-сервера           |
| `pnpm build`       | Production-сборка            |
| `pnpm start`       | Запуск production-сервера    |
| `pnpm lint`        | Проверка линтером (Biome)    |
| `pnpm format`      | Форматирование кода (Biome)  |
| `pnpm db:push`     | Применение схемы к БД        |
| `pnpm db:generate` | Генерация миграции           |
| `pnpm db:migrate`  | Применение миграций          |
| `pnpm db:studio`   | Drizzle Studio (GUI для БД)  |
| `pnpm db:seed`     | Заполнение тестовыми данными |

## Структура проекта

```
src/
├── app/
│   ├── api/                  # API-роуты (серверная часть)
│   │   ├── auth/             # Авторизация через Telegram
│   │   ├── events/           # CRUD мероприятий + регистрация
│   │   ├── stats/            # Статистика клуба
│   │   ├── upload/           # Загрузка изображений
│   │   └── users/            # Пользователи + профили
│   ├── events/               # Страницы мероприятий
│   ├── members/              # Страницы участников
│   └── profile/              # Профиль пользователя
├── components/
│   ├── ui/                   # UI-библиотека (shadcn/ui)
│   ├── bottom-nav.tsx        # Мобильная навигация
│   ├── desktop-sidebar.tsx   # Десктопный сайдбар
│   ├── icons.tsx             # SVG-иконки
│   ├── main-content.tsx      # Обёртка контента
│   └── telegram.tsx          # Telegram SDK интеграция
├── db/
│   ├── index.ts              # Подключение к БД (синглтон)
│   └── schema.ts             # Drizzle-схема (users, events, registrations)
└── lib/
    ├── hooks.ts              # React-хуки (useDebounce)
    ├── notifications.ts      # Уведомления через Telegram Bot API
    ├── telegram-store.ts     # Стейт-стор авторизации
    ├── telegram.ts           # Серверная валидация initData
    ├── utils.ts              # Утилиты (cn, formatDate, ...)
    └── validation.ts         # Валидация и санитизация ввода
```

## База данных

Три таблицы:

**users** — пользователи клуба

- `telegramId` (уникальный), `firstName`, `lastName`, `username`
- Профиль: `bio`, `instagram`, `telegram`, `phone`, `photoUrl`, `profileGradient`
- Роли: `user` | `admin`
- Блокировка: `blocked`

**events** — мероприятия

- `title`, `description`, `date`, `time`, `location`, `coverUrl`
- `maxParticipants` — лимит участников (0 = без лимита)
- Статусы: `open` | `closed` | `cancelled` | `completed`
- `createdBy` → users

**registrations** — регистрации на мероприятия

- `userId` → users, `eventId` → events
- Уникальный constraint на пару (userId, eventId)
- CASCADE DELETE при удалении пользователя или мероприятия

## API

### Авторизация

| Метод  | Путь        | Описание                   | Доступ    |
| ------ | ----------- | -------------------------- | --------- |
| `POST` | `/api/auth` | Авторизация через Telegram | Публичный |

### Мероприятия

| Метод    | Путь                       | Описание                   | Доступ   |
| -------- | -------------------------- | -------------------------- | -------- |
| `GET`    | `/api/events`              | Список мероприятий         | Авториз. |
| `POST`   | `/api/events`              | Создание мероприятия       | Админ    |
| `GET`    | `/api/events/:id`          | Детали мероприятия         | Авториз. |
| `PATCH`  | `/api/events/:id`          | Обновление мероприятия     | Админ    |
| `POST`   | `/api/events/:id/register` | Регистрация на мероприятие | Авториз. |
| `DELETE` | `/api/events/:id/register` | Отмена регистрации         | Авториз. |

### Пользователи

| Метод   | Путь             | Описание                        | Доступ       |
| ------- | ---------------- | ------------------------------- | ------------ |
| `GET`   | `/api/users`     | Список пользователей            | Авториз.     |
| `GET`   | `/api/users/:id` | Профиль с историей мероприятий  | Авториз.     |
| `PATCH` | `/api/users/:id` | Обновление профиля / управление | Свой / Админ |

### Прочее

| Метод  | Путь          | Описание                      | Доступ   |
| ------ | ------------- | ----------------------------- | -------- |
| `GET`  | `/api/stats`  | Статистика клуба              | Авториз. |
| `POST` | `/api/upload` | Загрузка изображения (≤ 5 МБ) | Авториз. |

## Страницы

| Путь               | Описание                                    |
| ------------------ | ------------------------------------------- |
| `/`                | Главная — статистика, ближайшие мероприятия |
| `/events`          | Список мероприятий с фильтрами и поиском    |
| `/events/create`   | Создание мероприятия (админ)                |
| `/events/:id`      | Детали мероприятия, участники, регистрация  |
| `/events/:id/edit` | Редактирование мероприятия (админ)          |
| `/members`         | Список участников с поиском                 |
| `/members/:id`     | Профиль участника, история мероприятий      |
| `/profile`         | Редактирование своего профиля               |

## Docker

```bash
# Сборка
docker build -t club .

# Запуск
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/club \
  -e BOT_TOKEN=your_bot_token \
  club
```

## Безопасность

- HMAC-SHA256 валидация Telegram `initData`
- Санитизация всех входных данных (XSS, SQL injection)
- Magic bytes валидация загружаемых файлов
- Rate limiting на критичных эндпоинтах
- Транзакции для атомарных операций (регистрация)
- Ролевая модель доступа (user / admin)
