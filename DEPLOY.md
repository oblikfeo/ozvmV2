# Разворот на поддомене

Розничная часть развёрнута на **https://shop.ozvm.ru**.

Это статический сайт: HTML, CSS, JS и картинки. Ни сборки, ни Node, ни PHP
у него нет — его отдаёт тот же nginx, что уже обслуживает `ozvm.ru`.

## Как устроен сервер

Весь боевой стек живёт в Docker, compose-файл — `/var/www/docker-compose.yml`:

| Контейнер | Что это | Порты |
|---|---|---|
| `nginx` | край: принимает 80 и 443, раздаёт статику, проксирует остальное | `80`, `443` |
| `ozvmru` | Next.js основного проекта | `3000` внутри сети |
| `php` | PHP-FPM с Laravel (`api.ozvm.ru`) | `9000` внутри сети |
| `mysql` | база | `3306` |

Конфиги сайтов лежат на хосте и монтируются в контейнер:

```
/var/www/nginx/sites-enabled   ->  /etc/nginx/conf.d
/etc/letsencrypt               ->  /etc/letsencrypt
/var/www/acme-challenge        ->  /var/www/acme-challenge
/var/www/shop.ozvm.ru          ->  /var/www/shop.ozvm.ru
```

Благодаря этому правки конфига и выкладка кода **не требуют пересоздания
контейнера** — достаточно перечитать конфиг.

## Что где лежит

| На сервере | Что это |
|---|---|
| `/var/www/shop.ozvm.ru` | клон этого репозитория |
| `/var/www/nginx/sites-enabled/shop.ozvm.ru.conf` | конфиг сайта, копия [deploy/nginx/shop.ozvm.ru.conf](deploy/nginx/shop.ozvm.ru.conf) |
| `/var/www/nginx/sites-enabled/.htpasswd-shop` | пароль на админку |
| `/etc/letsencrypt/live/shop.ozvm.ru/` | сертификат |

## Адреса

| Адрес | Страница |
|---|---|
| `/` | Лендинг компании |
| `/index.html` | Витрина акций |
| `/promotion.html?id=N` | Страница одной акции |
| `/admin.html` | Админка, закрыта basic auth |
| `/design-system.html` | Стайлгайд |

Корень отдаёт лендинг — так задано в конфиге, файлы лежат там же, где
в репозитории. `/deploy/` и `/.git/` наружу закрыты.

## Обновление после правок

```bash
ssh root@5.129.199.253
cd /var/www/shop.ozvm.ru && git pull
```

Всё. Перезапускать nginx не нужно: он отдаёт файлы с диска, а диск
примонтирован. HTML уходит с `Cache-Control: no-cache`, css и js — с часовым
кешем, картинки — с месячным.

Если менялся сам конфиг nginx:

```bash
cp /var/www/shop.ozvm.ru/deploy/nginx/shop.ozvm.ru.conf /var/www/nginx/sites-enabled/
docker exec nginx nginx -t && docker exec nginx nginx -s reload
```

Сначала `nginx -t`, только потом `reload`. При плохом конфиге reload
не применится и nginx продолжит работать на старом.

## Сертификат

Выпущен через webroot, продлевается сам:

- `certbot.timer` в systemd проверяет сертификаты дважды в сутки
- хук `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh` перечитывает
  конфиг nginx после продления — общий для всех сертификатов на машине

Проверить: `certbot renew --dry-run`

## Пароль на админку

```bash
htpasswd /var/www/nginx/sites-enabled/.htpasswd-shop admin
```

Файл лежит в примонтированной папке конфигов, поэтому reload не нужен —
nginx перечитывает его на каждый запрос.

> Свой вход в админке демонстрационный: логин и пароль зашиты в `js/auth.js`
> открытым текстом. Basic auth на nginx — единственная настоящая защита.

## Ограничения текущей версии

**Данные живут в браузере.** Акции и контент лендинга лежат в `localStorage`
того, кто их сохранил. У каждого посетителя своя копия: правки администратора
не видны никому, кроме него самого, и пропадут при очистке браузера. Пока это
витрина, а не работающая CMS.

Снимается переносом хранилищ на API — см. ниже.

## Следующий шаг — каталог на API основного проекта

CORS на `api.ozvm.ru` открыт (`Access-Control-Allow-Origin: *`), поэтому
поддомен ходит в API из браузера без правок на бэкенде.

Что уже готово в коде:

- `js/config.js` — адрес API и внешние ссылки в одном месте
- `js/api.js` — обёртка над fetch: базовый адрес, заголовки, Bearer-токен,
  разбор ошибок. Пока не используется, написана под каталог
- `js/store.js` и `js/landing-store.js` — вся работа с данными изолирована
  в них, страницы дёргают только их методы. Меняется тело функций, вёрстка нет

Готовые ручки (`routes/api.php` основного проекта):

| Ручка | Назначение |
|---|---|
| `GET /api/v1/shop/categories` | категории |
| `GET /api/v1/shop/manufacturers` | производители |
| `GET /api/v1/shop/products` | список товаров |
| `GET /api/v1/shop/products/{slug}` | карточка товара |
| `POST /api/v1/shop/checkout` | оформление заказа |
| `GET/POST/PATCH/DELETE /api/v1/cart` | корзина (нужен токен) |
| `POST /api/v1/user/login` | вход |
| `POST /api/v1/user/registration` | регистрация |
| `GET /api/v1/user`, `/api/v1/user/orders` | профиль и заказы (нужен токен) |

Чего в API нет и что придётся добавить на стороне Laravel:

- **акции** — таблица `promotions` и роуты под неё
- **контент лендинга** — хранилище под тексты и картинки блоков
- **права администратора** — сейчас `auth:sanctum` не отличает админа
  от обычного клиента

Токен кладётся в `localStorage` под тем же ключом `USER_TOKEN`, что
в основном проекте.
