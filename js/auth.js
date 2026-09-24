/*
  Вход в админку.

  Логин проверяет сервер: POST /api/v1/retail/admin/login возвращает токен,
  он кладётся в localStorage и уходит в заголовке Authorization. Пароля
  в этом файле больше нет — раньше он лежал здесь открытым текстом,
  и любой мог прочитать его в исходниках страницы.
*/

const AdminAuth = (function () {
  const api = window.OZVM.api;

  /** Токен мог протухнуть или быть отозван — спрашиваем сервер. */
  async function isAuthenticated() {
    if (!api.getToken()) return false;

    try {
      await api.get("/retail/admin/me");
      return true;
    } catch (e) {
      api.setToken(null);
      return false;
    }
  }

  async function signIn(login, password) {
    try {
      const data = await api.post("/retail/admin/login", { login, password });
      api.setToken(data.token);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function signOut() {
    try {
      await api.post("/retail/admin/logout");
    } catch (e) {
      // Сервер мог и не ответить — токен всё равно выбрасываем
    }
    api.setToken(null);
  }

  return { isAuthenticated, signIn, signOut };
})();
