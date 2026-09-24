/*
  Тонкая обёртка над fetch для работы с API основного проекта.

  Пока розничная часть живёт на localStorage и этот файл никем не вызывается —
  он подготовлен под следующий шаг, каталог. Здесь собрано то, что иначе
  пришлось бы повторять в каждом запросе: базовый адрес, заголовки, Bearer-токен
  и разбор ошибок.

  Список ручек — routes/api.php основного проекта:

    GET  /api/v1/shop/categories          список категорий
    GET  /api/v1/shop/manufacturers       список производителей
    GET  /api/v1/shop/products            список товаров
    GET  /api/v1/shop/products/{slug}     карточка товара
    POST /api/v1/shop/checkout            оформление заказа
    GET  /api/v1/cart                     корзина          (нужен токен)
    POST /api/v1/user/login               вход
    POST /api/v1/user/registration        регистрация
    GET  /api/v1/user                     профиль          (нужен токен)
    GET  /api/v1/user/orders              заказы           (нужен токен)
*/

window.OZVM = window.OZVM || {};

window.OZVM.api = (function () {
  const config = window.OZVM.config || {};
  const BASE = (config.apiBaseUrl || "").replace(/\/+$/, "");
  const TOKEN_KEY = config.tokenKey || "USER_TOKEN";

  function getToken() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      return token && token !== "undefined" && token !== "null" ? token : null;
    } catch (e) {
      // Приватный режим браузера может запрещать localStorage
      return null;
    }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      /* молча: без токена работают только публичные ручки */
    }
  }

  async function request(path, options) {
    const opts = options || {};
    const headers = Object.assign({ Accept: "application/json" }, opts.headers);

    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;

    let body = opts.body;
    if (body !== undefined && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }

    const response = await fetch(BASE + "/api/v1" + path, {
      method: opts.method || "GET",
      headers: headers,
      body: body,
    });

    /* 204 и пустое тело — нормальный ответ, разбирать нечего */
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const error = new Error((data && data.message) || "Ошибка запроса");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  return {
    getToken: getToken,
    setToken: setToken,
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body: body }),
    patch: (path, body) => request(path, { method: "PATCH", body: body }),
    delete: (path) => request(path, { method: "DELETE" }),
  };
})();
