# D1 Events — Telegram Mini App

Веб-приложение для управления клубом: мероприятия, участники, профили. Работает как Telegram Mini App с авторизацией через `initData`.

## Стек

- **Next.js 16** + React 19, TypeScript
- **PostgreSQL** + Prisma 7
- **TailwindCSS 4** + Radix UI (shadcn/ui)
- **Telegram Mini App SDK** (`@telegram-apps/sdk-react`)
- **Biome** — линтер и форматтер
- **Docker** — multi-stage production build
- **GitHub Actions** — CI/CD деплой по SSH

## Требования

- Node.js 22+
- pnpm
- PostgreSQL (или Docker)
- Telegram Bot Token

## Переменные окружения

| Переменная                | Описание                              | Обязательна |
| ------------------------- | ------------------------------------- | :---------: |
| `POSTGRES_USER`           | Пользователь PostgreSQL               |             |
| `POSTGRES_PASSWORD`       | Пароль PostgreSQL                     |      ✓      |
| `POSTGRES_DB`             | Имя базы данных                       |             |
| `DATABASE_URL`            | Строка подключения (для локальной БД) |      ✓      |
| `BOT_TOKEN`               | Токен Telegram-бота                   |      ✓      |
| `TELEGRAM_WEBHOOK_SECRET` | Секрет для Telegram webhook           |             |
| `APP_URL`                 | Полный URL mini app                   |             |
| `PORT`                    | Порт приложения (по умолчанию 3000)   |             |

Создайте `.env` файл в корне проекта (см. `.env.example`):

```env
POSTGRES_USER=club
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=club
DATABASE_URL=postgresql://club:your_secure_password@localhost:5432/club
BOT_TOKEN=123456789:ABCDefGHijKLmnopqrStuVwxyz
TELEGRAM_WEBHOOK_SECRET=super-secret-token
APP_URL=https://events.example.com
```

## Запуск (локально)

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
| `pnpm db:generate` | Генерация Prisma Client      |
| `pnpm db:migrate`  | Применение миграций          |
| `pnpm db:studio`   | Prisma Studio (GUI для БД)   |
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
│   └── schema.ts             # Реэкспорт типов Prisma (users, events, registrations)
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

### Telegram Bot Webhook

| Метод  | Путь                    | Описание                               | Доступ   |
| ------ | ----------------------- | -------------------------------------- | -------- |
| `POST` | `/api/telegram/webhook` | Обработка `/start` и выдача кнопки app | Telegram |

### Мероприятия

| Метод    | Путь                       | Описание                   | Доступ   |
| -------- | -------------------------- | -------------------------- | -------- |
| `GET`    | `/api/events`              | Список мероприятий         | Авториз. |
| `POST`   | `/api/events`              | Создание мероприятия       | Админ    |
| `GET`    | `/api/events/:id`          | Детали мероприятия         | Авториз. |
| `PATCH`  | `/api/events/:id`          | Обновление мероприятия     | Админ    |
| `DELETE` | `/api/events/:id`          | Удаление мероприятия       | Админ    |
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

## Деплой

### Docker Compose (продакшен)

На сервере поднимается PostgreSQL + приложение:

```bash
# Создать .env и заполнить переменные
cp .env.example .env

# Запуск
docker compose -p club --env-file .env -f deploy/docker-compose.yml up -d
```

### GitHub Actions (автодеплой)

При пуше в `main` автоматически:

1. Собирается Docker-образ → пушится в GitHub Container Registry
2. По SSH копируются файлы из `deploy/` и `scripts/deploy/` на сервер
3. Выполняется `docker compose pull` + `up -d` + миграции

### Настройка кнопки запуска по `/start`

1. Укажите `APP_URL` в GitHub Secrets или хотя бы `DOMAIN`.
2. Деплой сам создаст `TELEGRAM_WEBHOOK_SECRET`, если он ещё не задан.
3. Деплой сам вызовет `setWebhook` для `https://YOUR_DOMAIN/api/telegram/webhook`.

После этого бот будет отвечать на `/start` сообщением с кнопкой `Запустить приложение` автоматически после каждого деплоя.

#### Настройка секретов

В GitHub → Settings → Secrets → Actions добавить:

| Секрет     | Описание                     |
| ---------- | ---------------------------- |
| `SSH_KEY`  | Приватный SSH-ключ (ed25519) |
| `SSH_HOST` | IP-адрес сервера             |
| `SSH_USER` | Имя пользователя на сервере  |
| `SSH_PORT` | Порт SSH (по умолчанию 22)   |

#### Первоначальная настройка сервера

```bash
# Генерация SSH-ключа для GitHub Actions
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N "" -C "github-actions-deploy"
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Приватный ключ — скопировать в секрет SSH_KEY
cat ~/.ssh/github_actions

# Создать директорию и .env
mkdir -p ~/club && cd ~/club
# Создать .env с переменными POSTGRES_PASSWORD, BOT_TOKEN и т.д.
```

Или использовать готовый скрипт `scripts/deploy/setup-server.sh` для автоматической настройки.

## Безопасность

- HMAC-SHA256 валидация Telegram `initData` с проверкой `auth_date`
- Санитизация всех входных данных (XSS, SQL injection)
- Magic bytes валидация загружаемых файлов
- Rate limiting на всех эндпоинтах
- Транзакции для атомарных операций (регистрация)
- Ролевая модель доступа (user / admin)
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
