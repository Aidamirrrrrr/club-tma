#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────
# Первичное получение SSL-сертификата Let's Encrypt.
# Запустите один раз: ./scripts/deploy/init-letsencrypt.sh example.com admin@example.com
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
DEPLOY_DIR="$APP_DIR/deploy"
cd "$DEPLOY_DIR"

compose() {
  docker compose -p club --env-file "$APP_DIR/.env" -f "$DEPLOY_DIR/docker-compose.yml" "$@"
}

info "Настраиваем nginx для домена $DOMAIN..."
sed -i "s/DOMAIN/$DOMAIN/g" nginx.conf
sed -i "s/server_name _;/server_name $DOMAIN;/g" nginx.conf

info "Запускаем nginx для ACME challenge..."
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

docker run -d --name nginx-temp \
  -v "$(pwd)/nginx-temp.conf:/etc/nginx/nginx.conf:ro" \
  -v "club_certbot-www:/var/www/certbot" \
  -p 80:80 \
  nginx:alpine || {
    docker stop nginx-temp 2>/dev/null || true
    docker rm nginx-temp 2>/dev/null || true
    docker run -d --name nginx-temp \
      -v "$(pwd)/nginx-temp.conf:/etc/nginx/nginx.conf:ro" \
      -v "club_certbot-www:/var/www/certbot" \
      -p 80:80 \
      nginx:alpine
  }

info "Запрашиваем сертификат Let's Encrypt для $DOMAIN..."
compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

docker stop nginx-temp 2>/dev/null && docker rm nginx-temp 2>/dev/null || true
rm -f nginx-temp.conf

info "Перезапускаем с SSL..."
compose up -d

ok "HTTPS настроен! https://$DOMAIN"
echo ""
echo "Сертификат будет автоматически обновляться контейнером certbot."