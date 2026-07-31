/* ---------- Вход ---------- */

const loginScreen = document.getElementById("login-screen");
const adminApp = document.getElementById("admin-app");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

function showApp() {
  loginScreen.hidden = true;
  adminApp.hidden = false;
  renderTable();
  renderGallery();
}

function showLogin() {
  adminApp.hidden = true;
  loginScreen.hidden = false;
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("login-user").value;
  const pass = document.getElementById("login-pass").value;

  if (AdminAuth.signIn(user, pass)) {
    loginError.hidden = true;
    loginForm.reset();
    showApp();
  } else {
    loginError.hidden = false;
  }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  AdminAuth.signOut();
  showLogin();
});

/* ---------- Утилиты ---------- */

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- Форма ---------- */

const form = document.getElementById("promo-form");
const tableBody = document.getElementById("table-body");
const formTitle = document.getElementById("form-title");
const imagePreview = document.getElementById("image-preview");
const imageGallery = document.getElementById("image-gallery");

const fields = {
  id: document.getElementById("field-id"),
  title: document.getElementById("field-title"),
  image: document.getElementById("field-image"),
  short: document.getElementById("field-short"),
  full: document.getElementById("field-full"),
  start: document.getElementById("field-start"),
  end: document.getElementById("field-end"),
  active: document.getElementById("field-active"),
};

function setImage(value) {
  fields.image.value = value || "";

  if (value) {
    imagePreview.innerHTML = `<img src="${escapeHtml(value)}" alt="" />`;
  } else {
    imagePreview.innerHTML = '<span class="image-picker__empty">Изображение не выбрано</span>';
  }

  // подсветка выбранной картинки в галерее
  imageGallery.querySelectorAll(".image-picker__thumb").forEach((btn) => {
    btn.classList.toggle("is-selected", btn.dataset.path === value);
  });
}

function renderGallery() {
  imageGallery.innerHTML = "";
  PromoStore.getBuiltinImages().forEach((img) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "image-picker__thumb";
    btn.dataset.path = img.path;
    btn.title = img.label;
    btn.innerHTML = `<img src="${img.path}" alt="${escapeHtml(img.label)}" />`;
    btn.addEventListener("click", () => setImage(img.path));
    imageGallery.appendChild(btn);
  });
}

/*
  Выбранный файл сразу открывается в редакторе кадрирования: администратор
  сам задаёт масштаб и видимую область. На выходе получается картинка 16:9 —
  ровно в тех пропорциях, в которых она показывается на витрине и на странице
  акции, поэтому браузеру уже нечего дообрезать.

  Попутно решается вопрос веса: результат — 1200×675 JPEG (~150 КБ), тогда как
  исходное фото с телефона на 3–5 МБ в base64 переполнило бы localStorage,
  у которого лимит ~5 МБ на весь сайт.
*/
document.getElementById("input-image").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  ImageCropper.openFile(
    file,
    (dataUrl) => setImage(dataUrl),
    (message) => alert(message)
  );

  // сбрасываем, иначе повторный выбор того же файла не вызовет change
  e.target.value = "";
});

// Перекадрировать уже выбранную картинку (в том числе из галереи)
document.getElementById("btn-image-crop").addEventListener("click", () => {
  const current = fields.image.value;
  if (!current) {
    alert("Сначала выберите изображение.");
    return;
  }
  ImageCropper.openSrc(
    current,
    (dataUrl) => setImage(dataUrl),
    (message) => alert(message)
  );
});

document.getElementById("btn-image-clear").addEventListener("click", () => setImage(""));

function resetForm() {
  form.reset();
  fields.id.value = "";
  fields.active.checked = true;
  setImage("");
  formTitle.textContent = "Новая акция";
}

function fillForm(promo) {
  fields.id.value = promo.id;
  fields.title.value = promo.title || "";
  fields.short.value = promo.shortDescription || "";
  fields.full.value = promo.fullDescription || "";
  fields.start.value = promo.dateStart || "";
  fields.end.value = promo.dateEnd || "";
  fields.active.checked = !!promo.active;
  setImage(promo.image || "");
  formTitle.textContent = "Редактирование";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- Таблица ---------- */

function renderTable() {
  const list = PromoStore.getAll();
  tableBody.innerHTML = "";

  if (list.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="4" style="text-align:center; color: var(--color-muted);">Акций пока нет</td></tr>';
    return;
  }

  list.forEach((promo) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="admin-table__promo">
          <img class="admin-table__thumb" src="${escapeHtml(promo.image || "")}" alt="" onerror="this.style.visibility='hidden'" />
          <span>${escapeHtml(promo.title)}</span>
        </div>
      </td>
      <td>${formatDate(promo.dateStart)} — ${formatDate(promo.dateEnd)}</td>
      <td>${
        promo.active
          ? '<span class="badge badge-accent">активна</span>'
          : '<span class="badge badge-muted">скрыта</span>'
      }</td>
      <td>
        <div class="admin-table__actions">
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${promo.id}">Изменить</button>
          <button class="btn btn-outline btn-sm" data-action="delete" data-id="${promo.id}">Удалить</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

tableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.dataset.action === "edit") {
    const promo = PromoStore.getById(id);
    if (promo) fillForm(promo);
  }

  if (btn.dataset.action === "delete") {
    if (confirm("Удалить эту акцию?")) {
      PromoStore.remove(id);
      renderTable();
      resetForm();
    }
  }
});

/* ---------- Сохранение ---------- */

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const promo = {
    id: fields.id.value || null,
    title: fields.title.value.trim(),
    image: fields.image.value,
    shortDescription: fields.short.value.trim(),
    fullDescription: fields.full.value.trim(),
    dateStart: fields.start.value,
    dateEnd: fields.end.value,
    active: fields.active.checked,
  };

  try {
    PromoStore.upsert(promo);
  } catch (err) {
    alert(err.message);
    return;
  }

  renderTable();
  resetForm();
});

document.getElementById("btn-cancel").addEventListener("click", resetForm);

/* ---------- Экспорт / импорт / сброс ---------- */

document.getElementById("btn-export").addEventListener("click", () => {
  PromoStore.exportJSON();
});

document.getElementById("input-import").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  PromoStore.importJSON(file, (ok) => {
    if (ok) {
      renderTable();
    } else {
      alert("Не удалось прочитать файл. Ожидается JSON-массив акций.");
    }
    e.target.value = "";
  });
});

document.getElementById("btn-reset").addEventListener("click", () => {
  if (confirm("Вернуть демо-данные? Все внесённые акции будут удалены.")) {
    PromoStore.resetToSeed();
    renderTable();
    resetForm();
  }
});

/* ---------- Старт ---------- */

if (AdminAuth.isAuthenticated()) {
  showApp();
} else {
  showLogin();
}
