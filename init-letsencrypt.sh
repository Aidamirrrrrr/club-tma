#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────
# Первичное получение SSL-сертификата Let's Encrypt.
# Запустите один раз: ./init-letsencrypt.sh example.com admin@example.com
# ─────────────────────────────────────────────────────────────────────

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Использование: $0 <домен> <email>"
  echo "Пример: $0 events.example.com admin@example.com"
  exit 1
fi

info()  { printf '\033[1;34m→ %s\033[0m\n' "$*"; }
ok()    { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }

APP_DIR="$HOME/club"
cd "$APP_DIR"

# 1. Подставим домен в nginx.conf
info "Настраиваем nginx для домена $DOMAIN..."
sed -i "s/DOMAIN/$DOMAIN/g" nginx.conf
sed -i "s/server_name _;/server_name $DOMAIN;/g" nginx.conf

# 2. Временно закомментируем SSL-блок, чтобы nginx стартовал без сертификата
info "Запускаем nginx для ACME challenge..."
# Создадим временный конфиг только с HTTP
cat > nginx-temp.conf <<'NGINX'
worker_processes auto;
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name _;
        location /.well-known/acme-challenge/ { root /var/www/certbot; }
        location / { return 200 'ok'; add_header Content-Type text/plain; }
    }
}
NGINX

# Запустим nginx с временным конфигом
docker compose run -d --name nginx-temp \
  -v "$(pwd)/nginx-temp.conf:/etc/nginx/nginx.conf:ro" \
  -v "club_certbot-www:/var/www/certbot" \
  -p 80:80 \
  nginx:alpine || {
    # Если контейнер уже есть — перезапустим через compose
    docker compose up -d nginx
  }

# 3. Получаем сертификат
info "Запрашиваем сертификат Let's Encrypt для $DOMAIN..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# 4. Убираем временный контейнер
docker stop nginx-temp 2>/dev/null && docker rm nginx-temp 2>/dev/null || true
rm -f nginx-temp.conf

# 5. Запускаем всё с настоящим конфигом
info "Перезапускаем с SSL..."
docker compose up -d

ok "HTTPS настроен! https://$DOMAIN"
echo ""
echo "Сертификат будет автоматически обновляться контейнером certbot."
