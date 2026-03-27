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

resolve_docker() {
  export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/snap/bin:$PATH"

  if command -v docker >/dev/null 2>&1; then
    echo "docker"
    return
  fi

  for candidate in /usr/bin/docker /usr/local/bin/docker /snap/bin/docker; do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return
    fi
  done

  if command -v sudo >/dev/null 2>&1; then
    for candidate in /usr/bin/docker /usr/local/bin/docker /snap/bin/docker; do
      if sudo test -x "$candidate" 2>/dev/null; then
        echo "sudo $candidate"
        return
      fi
    done
  fi

  echo "Docker не найден. Установите Docker на сервере или сначала запустите scripts/deploy/setup-server.sh" >&2
  exit 127
}

DOCKER="$(resolve_docker)"
if [ -z "$DOCKER" ]; then
  echo "Docker не найден. Установите Docker на сервере или сначала запустите scripts/deploy/setup-server.sh" >&2
  exit 127
fi

compose() {
  $DOCKER compose -p club --env-file "$APP_DIR/.env" -f "$DEPLOY_DIR/docker-compose.yml" "$@"
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

$DOCKER run -d --name nginx-temp \
  -v "$(pwd)/nginx-temp.conf:/etc/nginx/nginx.conf:ro" \
  -v "club_certbot-www:/var/www/certbot" \
  -p 80:80 \
  nginx:alpine || {
    $DOCKER stop nginx-temp 2>/dev/null || true
    $DOCKER rm nginx-temp 2>/dev/null || true
    $DOCKER run -d --name nginx-temp \
      -v "$(pwd)/nginx-temp.conf:/etc/nginx/nginx.conf:ro" \
      -v "club_certbot-www:/var/www/certbot" \
      -p 80:80 \
      nginx:alpine
  }

info "Запрашиваем сертификат Let's Encrypt для $DOMAIN..."
compose run --rm --no-deps --entrypoint certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

$DOCKER stop nginx-temp 2>/dev/null && $DOCKER rm nginx-temp 2>/dev/null || true
rm -f nginx-temp.conf

info "Перезапускаем с SSL..."
compose up -d

ok "HTTPS настроен! https://$DOMAIN"
echo ""
echo "Сертификат будет автоматически обновляться контейнером certbot."