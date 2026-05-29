# Deploy

## 1. Пуш

```bash
cd /Users/timurbtr23/Programming/D1Capital/d1-events
git add <files>
git commit -m "message"
git push
```

GitHub Actions собирает Docker-образ и деплоит автоматически (~3 мин).

## 2. Рестарт nginx (после завершения сборки)

```bash
ssh root@5.42.103.212 "docker restart club-nginx-1"
```

## 3. Проверка

```bash
ssh root@5.42.103.212 "curl -s -o /dev/null -w '%{http_code}' https://tma.d1capital.ru"
```

Должен вернуть `200`.
