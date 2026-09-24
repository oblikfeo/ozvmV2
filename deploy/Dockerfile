# Розничная часть — статика, сборка не нужна: берём nginx и кладём в него файлы.
# Вариант на случай, если сайт поднимают контейнером рядом с ozvm.ru,
# а не просто папкой в /var/www.
#
# Собирать из корня репозитория:
#   docker build -f deploy/Dockerfile -t ozvm-retail .

FROM nginx:1.27-alpine

# Конфиг именно как server-блок: снаружи остаётся штатный nginx.conf
COPY deploy/nginx/retail.conf /etc/nginx/conf.d/default.conf

COPY . /var/www/ozvm-retail

# Исходники деплоя внутрь образа не тащим
RUN rm -rf /var/www/ozvm-retail/deploy /var/www/ozvm-retail/.git

EXPOSE 80
