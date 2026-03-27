#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────
# Скрипт первоначальной настройки сервера для деплоя.
# Запускается один раз на VPS: ./scripts/deploy/setup-server.sh
# После этого деплой идёт автоматически через GitHub Actions.
# ─────────────────────────────────────────────────────────────────────

info()  { printf '\033[1;34m→ %s\033[0m\n' "$*"; }
ok()    { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
err()   { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

APP_DIR="$HOME/club"
DEPLOY_DIR="$APP_DIR/deploy"
INIT_SSL_SCRIPT="$APP_DIR/scripts/deploy/init-letsencrypt.sh"

export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/snap/bin:$PATH"

compose() {
  docker compose -p club --env-file "$APP_DIR/.env" -f "$DEPLOY_DIR/docker-compose.yml" "$@"
}

# ─── 1. Docker ────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Устанавливаем Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  ok "Docker установлен. Перезайдите в SSH и запустите скрипт снова."
  exit 0
fi

docker info &>/dev/null || err "Docker daemon не запущен"

# ─── 2. Директория проекта ────────────────────────────────────────────
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# ─── 3. .env ──────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  info "Создаём .env — заполните переменные:"
  cat > .env <<'EOF'
# PostgreSQL
POSTGRES_USER=club
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=club

# Telegram Bot
BOT_TOKEN=CHANGE_ME

# Домен (для nginx и Let's Encrypt)
DOMAIN=CHANGE_ME
EMAIL=CHANGE_ME
EOF
  err "Заполните $APP_DIR/.env и запустите скрипт снова."
fi

# shellcheck source=/dev/null
source .env
[ "${POSTGRES_PASSWORD:-}" != "CHANGE_ME" ] || err "Измените POSTGRES_PASSWORD в .env"
[ "${BOT_TOKEN:-}" != "CHANGE_ME" ]         || err "Измените BOT_TOKEN в .env"
[ "${DOMAIN:-}" != "CHANGE_ME" ]             || err "Измените DOMAIN в .env"
[ "${EMAIL:-}" != "CHANGE_ME" ]              || err "Измените EMAIL в .env"

# ─── 4. SSH-ключ для GitHub Actions ──────────────────────────────────
KEY_FILE="$HOME/.ssh/github_actions"
if [ ! -f "$KEY_FILE" ]; then
  info "Генерируем SSH-ключ для GitHub Actions..."
  ssh-keygen -t ed25519 -f "$KEY_FILE" -N "" -C "github-actions-deploy"
  cat "$KEY_FILE.pub" >> "$HOME/.ssh/authorized_keys"
  chmod 600 "$HOME/.ssh/authorized_keys"
  ok "Ключ создан."
  echo ""
  echo "┌─────────────────────────────────────────────────────┐"
  echo "│  Добавьте приватный ключ в GitHub → Settings →      │"
  echo "│  Secrets and variables → Actions → New secret:      │"
  echo "│                                                     │"
  echo "│  SSH_KEY   = содержимое файла ниже                  │"
  echo "│  SSH_HOST  = $(curl -s ifconfig.me || echo 'IP_СЕРВЕРА')"
  echo "│  SSH_USER  = $USER"
  echo "│  SSH_PORT  = 22"
  echo "└─────────────────────────────────────────────────────┘"
  echo ""
  echo "Приватный ключ (SSH_KEY):"
  echo "─────────────────────────"
  cat "$KEY_FILE"
  echo "─────────────────────────"
  echo ""
fi

# ─── 5. Пробный запуск ───────────────────────────────────────────────
if [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
  info "Запускаем контейнеры..."
  compose up -d db app
  ok "Приложение запущено."

  if [ ! -d "/etc/letsencrypt/live/${DOMAIN:-}" ]; then
    if [ -f "$INIT_SSL_SCRIPT" ]; then
      info "Получаем SSL-сертификат..."
      bash "$INIT_SSL_SCRIPT" "$DOMAIN" "$EMAIL"
    else
      info "Скопируйте scripts/deploy/init-letsencrypt.sh на сервер и запустите:"
      echo "  ./scripts/deploy/init-letsencrypt.sh $DOMAIN $EMAIL"
    fi
  else
    info "SSL-сертификат найден, запускаем nginx..."
    compose up -d
    ok "HTTPS: https://$DOMAIN"
  fi
else
  info "Скопируйте deploy/docker-compose.yml и deploy/nginx.conf в $APP_DIR или дождитесь первого деплоя через GitHub Actions."
fi

echo ""
ok "Сервер готов к деплою через GitHub Actions."