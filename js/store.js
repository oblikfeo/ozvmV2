/*
  Акции: данные лежат в базе основного проекта и приходят через API
  (api.ozvm.ru, ветка /api/v1/retail). Раньше здесь был localStorage —
  от него отказались, потому что правки администратора видел только
  его собственный браузер.

  Все методы асинхронные и возвращают промис.
*/

const PromoStore = (function () {
  const api = window.OZVM.api;

  const builtinImages = [
    { path: "img/dog-vitamins.jpg", label: "Собака" },
    { path: "img/cat-food.jpg", label: "Кошка" },
    { path: "img/delivery-dog.jpg", label: "Доставка" },
    { path: "img/puppy-vaccine.jpg", label: "Щенок" },
    { path: "img/rabbit-care.jpg", label: "Кролик" },
    { path: "img/horse-farm.jpg", label: "Лошадь" },
    { path: "img/puppy-kitten.jpg", label: "Щенок и котёнок" },
    { path: "img/vet-checkup.jpg", label: "У ветеринара" },
  ];

  /** Все акции, включая выключенные и просроченные. Нужен токен админа. */
  function getAll() {
    return api.get("/retail/admin/promotions");
  }

  /** То, что видит покупатель: активные и не просроченные. */
  function getActive() {
    return api.get("/retail/promotions");
  }

  function getById(id) {
    return api.get("/retail/promotions/" + encodeURIComponent(id));
  }

  /** Создание и правка одной ручкой: с id — правим, без него — создаём. */
  function upsert(promotion) {
    return api.post("/retail/admin/promotions", promotion);
  }

  function remove(id) {
    return api.delete("/retail/admin/promotions/" + encodeURIComponent(id));
  }

  function getBuiltinImages() {
    return builtinImages.slice();
  }

  return {
    getAll,
    getActive,
    getById,
    upsert,
    remove,
    getBuiltinImages,
  };
})();
