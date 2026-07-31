function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function renderPromoTile(promo) {
  const el = document.createElement("a");
  el.className = "promo-tile";
  el.href = "promotion.html?id=" + encodeURIComponent(promo.id);

  el.innerHTML = `
    <img class="promo-tile__img" src="${promo.image || ''}" alt="${promo.title}" onerror="this.style.opacity=0" />
    <div class="promo-tile__body">
      <div class="promo-tile__badge-row">
        <span class="badge badge-accent">Акция</span>
        <span class="badge badge-muted">до ${formatDate(promo.dateEnd)}</span>
      </div>
      <div class="promo-tile__title">${promo.title}</div>
      <div class="promo-tile__desc">${promo.shortDescription || ""}</div>
      <div class="promo-tile__footer">
        <span class="btn btn-ghost btn-sm">Подробнее</span>
      </div>
    </div>
  `;
  return el;
}

function init() {
  const grid = document.getElementById("promo-grid");
  const empty = document.getElementById("promo-empty");
  const active = PromoStore.getActive();

  if (active.length === 0) {
    grid.style.display = "none";
    empty.style.display = "block";
    return;
  }

  active.forEach((promo) => grid.appendChild(renderPromoTile(promo)));
}

init();
