function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function init() {
  const id = getIdFromUrl();
  const promo = id ? PromoStore.getById(id) : null;
  const content = document.getElementById("promo-content");
  const notFound = document.getElementById("promo-not-found");

  if (!promo) {
    content.style.display = "none";
    notFound.style.display = "block";
    return;
  }

  content.innerHTML = `
    <img class="promo-detail__hero" src="${promo.image || ''}" alt="${promo.title}" onerror="this.style.opacity=0" />
    <div class="promo-detail__meta">
      <span class="badge badge-accent">Акция</span>
      <span class="badge badge-muted">${formatDate(promo.dateStart)} — ${formatDate(promo.dateEnd)}</span>
    </div>
    <div class="promo-detail__text">${(promo.fullDescription || promo.shortDescription || "").replace(/\n/g, "<br>")}</div>
  `;
  document.getElementById("promo-title").textContent = promo.title;
  document.title = promo.title + " | ЗооВетМир";
}

init();
