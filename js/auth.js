/*
  Вход в админку — демо-версия.

  ВАЖНО: это НЕ настоящая защита. Приложение полностью статическое (Vercel),
  проверка логина происходит в браузере, и любой может прочитать эти строки
  в исходном коде страницы. Такой вход годится только для того, чтобы
  показать клиенту сценарий «админ заходит под своим логином».

  При интеграции в основной проект вход должен идти через Laravel
  (отдельная учётка администратора + токен), а не отсюда.
*/

const AdminAuth = (function () {
  const SESSION_KEY = "promo_admin_session";

  const CREDENTIALS = {
    login: "admin",
    password: "zoovetmir2026",
  };

  function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  function signIn(login, password) {
    const ok =
      String(login).trim().toLowerCase() === CREDENTIALS.login &&
      String(password) === CREDENTIALS.password;

    if (ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    return ok;
  }

  function signOut() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  return { isAuthenticated, signIn, signOut };
})();
