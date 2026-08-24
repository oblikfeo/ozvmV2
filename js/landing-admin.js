/*
  Вторая половина админки — редактор лендинга (/landing).

  Формы не написаны руками: ниже лежит схема разделов страницы, а рендер
  разбирает её и строит поля. Добавить новое поле = дописать строку в схему.

  Данные правятся прямо в объекте content и уходят в LandingStore.save()
  по кнопке «Сохранить». Пока не сохранили — на странице ничего не меняется.
*/

const LandingAdmin = (function () {
  /* Пропорции кадрирования подобраны под рамки на самой странице,
     чтобы админ видел ровно тот кадр, который окажется на сайте. */
  const ASPECT_SLIDE = 21 / 9;
  const ASPECT_PROMO = 16 / 9;
  const ASPECT_CATEGORY = 4 / 3;
  const ASPECT_ABOUT = 3 / 4;

  let content = null;
  let dirty = false;
  let activeSection = null;

  let tabsBox = null;
  let panelsBox = null;
  let statusBox = null;

  /* ---------------- Схема разделов ---------------- */

  function slideKindOptions() {
    return [
      { value: "photo", label: "Фото на весь баннер" },
      { value: "brand", label: "Голубая плашка с вырезкой" },
    ];
  }

  function iconOptions() {
    return LandingStore.getStripIcons().map((i) => ({ value: i.key, label: i.label }));
  }

  const SECTIONS = [
    {
      id: "header",
      label: "Шапка",
      blocks: [
        {
          type: "fields",
          path: "header",
          title: "Логотип и контакты",
          fields: [
            { key: "logoName", label: "Название", type: "text" },
            { key: "logoTag", label: "Подпись под названием", type: "text" },
            {
              row: [
                { key: "phone", label: "Телефон (как показывать)", type: "text" },
                { key: "phoneHref", label: "Ссылка телефона", type: "text", hint: "tel:+79048299202" },
              ],
            },
            { key: "telegram", label: "Ссылка на Telegram", type: "text" },
            { key: "max", label: "Ссылка на MAX", type: "text" },
            {
              key: "lkText",
              label: "Надпись на кнопке кабинета",
              type: "text",
              hint: "Кнопка пока заглушка: авторизация не подключена.",
            },
          ],
        },
      ],
    },

    {
      id: "slides",
      label: "Слайдер",
      blocks: [
        {
          type: "list",
          path: "slides",
          title: "Баннеры",
          addLabel: "Добавить баннер",
          titleField: "title",
          min: 1,
          hint: "Баннеры листаются автоматически раз в 7,5 секунды в том порядке, в котором стоят здесь.",
          newItem: function () {
            return {
              id: uid("s"),
              kind: "photo",
              badge: "",
              title: "Новый баннер",
              text: "",
              image: "",
              btn1Text: "",
              btn1Href: "",
              btn2Text: "",
              btn2Href: "",
              active: true,
            };
          },
          fields: [
            { key: "kind", label: "Оформление", type: "select", options: slideKindOptions() },
            { key: "badge", label: "Плашка над заголовком", type: "text" },
            { key: "title", label: "Заголовок", type: "text" },
            { key: "text", label: "Текст", type: "textarea", rows: 3 },
            {
              key: "image",
              label: "Изображение",
              type: "image",
              aspect: ASPECT_SLIDE,
              hint: "Для голубой плашки нужна вырезка без фона (PNG или WebP) — её кадрировать не надо.",
            },
            {
              row: [
                { key: "btn1Text", label: "Кнопка 1: текст", type: "text" },
                { key: "btn1Href", label: "Кнопка 1: ссылка", type: "text" },
              ],
            },
            {
              row: [
                { key: "btn2Text", label: "Кнопка 2: текст", type: "text" },
                { key: "btn2Href", label: "Кнопка 2: ссылка", type: "text" },
              ],
            },
            { key: "active", label: "Показывать баннер", type: "checkbox" },
          ],
        },
      ],
    },

    {
      id: "strip",
      label: "Преимущества",
      blocks: [
        {
          type: "list",
          path: "strip",
          title: "Полоса под баннером",
          titleField: "title",
          fixed: true,
          hint: "Четыре ячейки в ряд — так свёрстана полоса, поэтому их количество не меняется.",
          fields: [
            { key: "icon", label: "Иконка", type: "select", options: iconOptions() },
            { key: "title", label: "Заголовок", type: "text" },
            { key: "text", label: "Подпись", type: "text" },
          ],
        },
      ],
    },

    {
      id: "promos",
      label: "Акции",
      blocks: [
        { type: "fields", path: "promos", title: "Заголовок секции", fields: headFields() },
        {
          type: "list",
          path: "promos.items",
          title: "Предложения",
          addLabel: "Добавить предложение",
          titleField: "title",
          min: 1,
          hint: "Карточки идут по три в ряд — лучше держать количество кратным трём.",
          newItem: function () {
            return {
              id: uid("p"),
              badge: "",
              date: "",
              title: "Новое предложение",
              text: "",
              image: "",
              active: true,
            };
          },
          fields: [
            {
              row: [
                { key: "badge", label: "Плашка на фото", type: "text" },
                { key: "date", label: "Условие или срок", type: "text" },
              ],
            },
            { key: "title", label: "Заголовок", type: "text" },
            { key: "text", label: "Текст", type: "textarea", rows: 3 },
            { key: "image", label: "Изображение", type: "image", aspect: ASPECT_PROMO },
            { key: "active", label: "Показывать карточку", type: "checkbox" },
          ],
        },
      ],
    },

    {
      id: "categories",
      label: "Каталог",
      blocks: [
        { type: "fields", path: "categories", title: "Заголовок секции", fields: headFields() },
        {
          type: "list",
          path: "categories.items",
          title: "Категории",
          addLabel: "Добавить категорию",
          titleField: "name",
          min: 1,
          hint: "Плитки идут по три в ряд — лучше держать количество кратным трём.",
          newItem: function () {
            return { id: uid("c"), name: "Новая категория", count: "", image: "" };
          },
          fields: [
            { key: "name", label: "Название", type: "text" },
            { key: "count", label: "Подпись", type: "text", hint: "Например: 480 наименований" },
            { key: "image", label: "Изображение", type: "image", aspect: ASPECT_CATEGORY },
          ],
        },
      ],
    },

    {
      id: "about",
      label: "О компании",
      blocks: [
        {
          type: "fields",
          path: "about",
          title: "Заголовок секции и фотографии",
          fields: headFields().concat([
            { key: "photo1", label: "Фото слева", type: "image", aspect: ASPECT_ABOUT },
            { key: "photo2", label: "Фото справа", type: "image", aspect: ASPECT_ABOUT },
          ]),
        },
        {
          type: "list",
          path: "about.facts",
          title: "Пункты списка",
          addLabel: "Добавить пункт",
          titleField: "title",
          min: 1,
          newItem: function () {
            return { title: "Новый пункт", text: "" };
          },
          fields: [
            { key: "title", label: "Заголовок", type: "text" },
            { key: "text", label: "Текст", type: "textarea", rows: 3 },
          ],
        },
        {
          type: "list",
          path: "about.stats",
          title: "Цифры",
          titleField: "value",
          fixed: true,
          hint: "Четыре ячейки в ряд — количество не меняется.",
          fields: [
            { key: "value", label: "Значение", type: "text" },
            { key: "label", label: "Подпись", type: "text" },
          ],
        },
      ],
    },

    {
      id: "steps",
      label: "Как заказать",
      blocks: [
        { type: "fields", path: "steps", title: "Заголовок секции", fields: headFields() },
        {
          type: "list",
          path: "steps.items",
          title: "Шаги",
          titleField: "title",
          fixed: true,
          hint: "Четыре шага в ряд — количество не меняется, номера проставляются сами.",
          fields: [
            { key: "title", label: "Заголовок", type: "text" },
            { key: "text", label: "Текст", type: "textarea", rows: 2 },
          ],
        },
      ],
    },

    {
      id: "reviews",
      label: "Отзывы",
      blocks: [
        {
          type: "fields",
          path: "reviews",
          title: "Заголовок секции",
          fields: [
            { key: "kicker", label: "Надзаголовок", type: "text" },
            { key: "heading", label: "Заголовок", type: "text" },
          ],
        },
        {
          type: "list",
          path: "reviews.items",
          title: "Отзывы",
          addLabel: "Добавить отзыв",
          titleField: "name",
          min: 1,
          hint: "Кружок с инициалами собирается из имени автоматически.",
          newItem: function () {
            return { name: "Имя Фамилия", role: "", text: "" };
          },
          fields: [
            { key: "text", label: "Текст отзыва", type: "textarea", rows: 4 },
            {
              row: [
                { key: "name", label: "Имя", type: "text" },
                { key: "role", label: "Кто это", type: "text" },
              ],
            },
          ],
        },
      ],
    },

    {
      id: "contacts",
      label: "Контакты",
      blocks: [
        {
          type: "fields",
          path: "contacts",
          title: "Блок контактов",
          fields: headFields().concat([
            {
              row: [
                { key: "btn1Text", label: "Кнопка 1: текст", type: "text" },
                { key: "btn1Href", label: "Кнопка 1: ссылка", type: "text" },
              ],
            },
            {
              row: [
                { key: "btn2Text", label: "Кнопка 2: текст", type: "text" },
                { key: "btn2Href", label: "Кнопка 2: ссылка", type: "text" },
              ],
            },
            { key: "phone", label: "Телефон в карточке", type: "text" },
            {
              row: [
                { key: "email", label: "Почта", type: "text" },
                { key: "emailNote", label: "Подпись под почтой", type: "text" },
              ],
            },
            { key: "address", label: "Адрес", type: "text" },
            { key: "addressNote", label: "Подпись под адресом", type: "text" },
          ]),
        },
        {
          type: "list",
          path: "contacts.hours",
          title: "Часы работы",
          addLabel: "Добавить строку",
          titleField: "day",
          min: 1,
          newItem: function () {
            return { day: "", time: "" };
          },
          fields: [
            {
              row: [
                { key: "day", label: "Дни", type: "text" },
                { key: "time", label: "Время", type: "text" },
              ],
            },
          ],
        },
      ],
    },

    {
      id: "map",
      label: "Карта",
      blocks: [
        {
          type: "fields",
          path: "map",
          title: "Секция с картой",
          fields: headFields().concat([
            {
              key: "query",
              label: "Что искать на карте",
              type: "text",
              hint: "Адрес подставляется в виджет Яндекс.Карт как поисковый запрос.",
            },
          ]),
        },
      ],
    },

    {
      id: "footer",
      label: "Подвал",
      blocks: [
        {
          type: "fields",
          path: "footer",
          title: "Подвал страницы",
          fields: [
            { key: "brand", label: "Название", type: "text" },
            { key: "tagline", label: "Подпись", type: "text" },
            { key: "note", label: "Примечание", type: "textarea", rows: 3 },
          ],
        },
      ],
    },
  ];

  function headFields() {
    return [
      { key: "kicker", label: "Надзаголовок", type: "text" },
      { key: "heading", label: "Заголовок", type: "text" },
      { key: "lead", label: "Подводка", type: "textarea", rows: 3 },
    ];
  }

  /* ---------------- Утилиты ---------------- */

  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function byPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc ? acc[key] : undefined;
    }, obj);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(label, className, onClick) {
    const b = el("button", className, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  function markDirty() {
    dirty = true;
    setStatus("Есть несохранённые изменения", "warn");
  }

  function setStatus(text, kind) {
    if (!statusBox) return;
    statusBox.textContent = text;
    statusBox.className = "editor-status" + (kind ? " editor-status--" + kind : "");
  }

  function move(arr, from, to) {
    if (to < 0 || to >= arr.length) return;
    const item = arr.splice(from, 1)[0];
    arr.splice(to, 0, item);
    markDirty();
  }

  /* ---------------- Поля ---------------- */

  function makeField(def, obj) {
    if (def.row) {
      const row = el("div", "field-row");
      def.row.forEach(function (sub) {
        row.appendChild(makeField(sub, obj));
      });
      return row;
    }

    const id = "lf-" + Math.random().toString(36).slice(2, 9);

    if (def.type === "checkbox") {
      const wrap = el("div", "field checkbox-field");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      input.checked = !!obj[def.key];
      input.addEventListener("change", function () {
        obj[def.key] = input.checked;
        markDirty();
      });
      const label = el("label", null, def.label);
      label.htmlFor = id;
      label.style.margin = "0";
      wrap.appendChild(input);
      wrap.appendChild(label);
      return wrap;
    }

    const wrap = el("div", "field");
    const label = el("label", null, def.label);
    label.htmlFor = id;
    wrap.appendChild(label);

    if (def.type === "image") {
      wrap.appendChild(imagePicker(def, obj));
      if (def.hint) wrap.appendChild(el("span", "field__hint", def.hint));
      return wrap;
    }

    let input;
    if (def.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = def.rows || 3;
    } else if (def.type === "select") {
      input = document.createElement("select");
      def.options.forEach(function (option) {
        const node = el("option", null, option.label);
        node.value = option.value;
        input.appendChild(node);
      });
    } else {
      input = document.createElement("input");
      input.type = "text";
    }

    input.id = id;
    input.value = obj[def.key] == null ? "" : obj[def.key];

    const onEdit = function () {
      obj[def.key] = input.value;
      markDirty();
    };
    input.addEventListener("input", onEdit);
    input.addEventListener("change", onEdit);

    wrap.appendChild(input);
    if (def.hint) wrap.appendChild(el("span", "field__hint", def.hint));
    return wrap;
  }

  function imagePicker(def, obj) {
    const box = el("div", "image-picker");
    const preview = el("div", "image-picker__preview");
    const actions = el("div", "image-picker__actions");
    const gallery = el("div", "image-picker__gallery");

    function draw() {
      const value = obj[def.key];
      preview.innerHTML = "";
      if (value) {
        const img = document.createElement("img");
        img.src = value;
        img.alt = "";
        preview.appendChild(img);
      } else {
        preview.appendChild(el("span", "image-picker__empty", "Изображение не выбрано"));
      }
      gallery.querySelectorAll(".image-picker__thumb").forEach(function (thumb) {
        thumb.classList.toggle("is-selected", thumb.dataset.path === value);
      });
    }

    function set(value) {
      obj[def.key] = value || "";
      markDirty();
      draw();
    }

    const uploadLabel = el("label", "btn btn-ghost btn-sm", "Загрузить файл");
    uploadLabel.style.cursor = "pointer";
    const file = document.createElement("input");
    file.type = "file";
    file.accept = "image/*";
    file.style.display = "none";
    file.addEventListener("change", function (e) {
      const chosen = e.target.files[0];
      if (chosen) {
        ImageCropper.openFile(chosen, set, function (message) { alert(message); }, def.aspect);
      }
      e.target.value = "";
    });
    uploadLabel.appendChild(file);

    actions.appendChild(uploadLabel);
    actions.appendChild(
      button("Кадрировать", "btn btn-outline btn-sm", function () {
        if (!obj[def.key]) {
          alert("Сначала выберите изображение.");
          return;
        }
        ImageCropper.openSrc(obj[def.key], set, function (message) { alert(message); }, def.aspect);
      })
    );
    actions.appendChild(
      button("Убрать", "btn btn-outline btn-sm", function () {
        set("");
      })
    );

    LandingStore.getGallery().forEach(function (image) {
      const thumb = el("button", "image-picker__thumb");
      thumb.type = "button";
      thumb.dataset.path = image.path;
      thumb.title = image.label;
      const img = document.createElement("img");
      img.src = image.path;
      img.alt = "";
      thumb.appendChild(img);
      thumb.addEventListener("click", function () {
        set(image.path);
      });
      gallery.appendChild(thumb);
    });

    box.appendChild(preview);
    box.appendChild(actions);
    box.appendChild(el("div", "image-picker__gallery-label", "или выберите готовое:"));
    box.appendChild(gallery);
    draw();
    return box;
  }

  /* ---------------- Блоки ---------------- */

  function renderFieldsBlock(def) {
    const block = el("div", "editor-block");
    const head = el("div", "editor-block__head");
    head.appendChild(el("h3", "editor-block__title", def.title));
    block.appendChild(head);

    const target = byPath(content, def.path);
    const body = el("div", "editor-block__body");
    def.fields.forEach(function (field) {
      body.appendChild(makeField(field, target));
    });
    block.appendChild(body);
    return block;
  }

  function renderListBlock(def) {
    const block = el("div", "editor-block");
    redrawList(def, block);
    return block;
  }

  function redrawList(def, block) {
    const arr = byPath(content, def.path);
    block.innerHTML = "";

    const head = el("div", "editor-block__head");
    head.appendChild(el("h3", "editor-block__title", def.title));
    if (!def.fixed) {
      head.appendChild(
        button(def.addLabel || "Добавить", "btn btn-outline btn-sm", function () {
          arr.push(def.newItem());
          markDirty();
          redrawList(def, block);
        })
      );
    }
    block.appendChild(head);

    if (def.hint) block.appendChild(el("p", "editor-block__hint", def.hint));

    arr.forEach(function (item, index) {
      const card = el("div", "editor-item");

      const bar = el("div", "editor-item__bar");
      bar.appendChild(el("span", "editor-item__num", String(index + 1)));
      bar.appendChild(
        el("span", "editor-item__name", String(item[def.titleField] || "").trim() || "Без названия")
      );

      const tools = el("div", "editor-item__tools");
      const up = button("↑", "editor-item__tool", function () {
        move(arr, index, index - 1);
        redrawList(def, block);
      });
      up.title = "Выше";
      up.disabled = index === 0;

      const down = button("↓", "editor-item__tool", function () {
        move(arr, index, index + 1);
        redrawList(def, block);
      });
      down.title = "Ниже";
      down.disabled = index === arr.length - 1;

      tools.appendChild(up);
      tools.appendChild(down);

      if (!def.fixed) {
        const remove = button("✕", "editor-item__tool editor-item__tool--danger", function () {
          if (!confirm("Удалить этот блок со страницы?")) return;
          arr.splice(index, 1);
          markDirty();
          redrawList(def, block);
        });
        remove.title = "Удалить";
        remove.disabled = arr.length <= (def.min || 1);
        tools.appendChild(remove);
      }

      bar.appendChild(tools);
      card.appendChild(bar);

      const body = el("div", "editor-item__body");
      def.fields.forEach(function (field) {
        body.appendChild(makeField(field, item));
      });
      card.appendChild(body);
      block.appendChild(card);
    });
  }

  /* ---------------- Вкладки ---------------- */

  function renderTabs() {
    tabsBox.innerHTML = "";
    SECTIONS.forEach(function (section) {
      const tab = button(section.label, "editor-tab", function () {
        showSection(section.id);
      });
      tab.dataset.section = section.id;
      tabsBox.appendChild(tab);
    });
  }

  function renderPanels() {
    panelsBox.innerHTML = "";
    SECTIONS.forEach(function (section) {
      const panel = el("div", "editor-panel");
      panel.dataset.panel = section.id;
      panel.hidden = true;
      section.blocks.forEach(function (block) {
        panel.appendChild(block.type === "list" ? renderListBlock(block) : renderFieldsBlock(block));
      });
      panelsBox.appendChild(panel);
    });
  }

  function showSection(id) {
    activeSection = id;
    tabsBox.querySelectorAll(".editor-tab").forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.section === id);
    });
    panelsBox.querySelectorAll(".editor-panel").forEach(function (panel) {
      panel.hidden = panel.dataset.panel !== id;
    });
  }

  /* ---------------- Сохранение ---------------- */

  function save() {
    try {
      LandingStore.save(content);
    } catch (e) {
      alert(e.message);
      return;
    }
    dirty = false;
    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    setStatus("Сохранено в " + time + ". Обновите страницу лендинга, чтобы увидеть правки.", "ok");
  }

  function reset() {
    if (!confirm("Вернуть лендингу исходный вид? Все правки будут стёрты.")) return;
    content = LandingStore.resetToSeed();
    dirty = false;
    renderPanels();
    showSection(activeSection || SECTIONS[0].id);
    setStatus("Возвращён исходный вид страницы", "ok");
  }

  /* ---------------- Запуск ---------------- */

  function open() {
    if (!tabsBox) {
      tabsBox = document.getElementById("lp-tabs");
      panelsBox = document.getElementById("lp-panels");
      statusBox = document.getElementById("lp-status");
      document.getElementById("lp-save").addEventListener("click", save);
      document.getElementById("lp-reset").addEventListener("click", reset);
      renderTabs();
    }

    // Заново поднимаем данные из хранилища: вдруг их правили в другой вкладке
    if (!dirty) {
      content = LandingStore.get();
      renderPanels();
      setStatus(
        LandingStore.getSaved()
          ? "Страница показывает сохранённую версию"
          : "Страница показывает исходную версию",
        null
      );
    }
    showSection(activeSection || SECTIONS[0].id);
  }

  return { open: open };
})();
