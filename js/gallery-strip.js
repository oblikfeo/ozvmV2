/*
  Готовые изображения в форме — не сеткой в несколько рядов, а одной
  прокручиваемой лентой со стрелками. Картинок в лендинге почти два десятка,
  сеткой они занимали пол-экрана и отжимали форму вниз.

  Общий компонент: используется и в форме акции, и во всех полях с картинкой
  в редакторе лендинга. Разметку не переписываем — компонент сам оборачивает
  существующий .image-picker__gallery и добавляет стрелки.
*/

const GalleryStrip = (function () {
  // За один клик прокручиваем почти всю видимую ширину, оставляя край
  // предыдущей картинки — так видно, что лента продолжается.
  const STEP_RATIO = 0.85;

  const ARROW_PATH = {
    prev: "M15 6L9 12L15 18",
    next: "M9 6L15 12L9 18",
  };

  function makeArrow(direction, gallery, wrap) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "image-picker__arrow image-picker__arrow--" + direction;
    btn.setAttribute("aria-label", direction === "prev" ? "Предыдущие" : "Следующие");
    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="' + ARROW_PATH[direction] + '" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';

    /* Двигаем ленту присвоением scrollLeft — надёжнее, чем scrollBy.
       Прокрутка мгновенная: со scroll-behavior: smooth позицию доводит
       анимация, и состояние стрелок приходится угадывать. */
    btn.addEventListener("click", function () {
      const step = Math.max(120, gallery.clientWidth * STEP_RATIO);
      const max = gallery.scrollWidth - gallery.clientWidth;
      const target = gallery.scrollLeft + (direction === "prev" ? -step : step);

      gallery.scrollLeft = Math.max(0, Math.min(max, target));

      // scroll-snap может дотянуть позицию до ближайшей картинки уже после
      // присвоения, поэтому состояние стрелок пересчитываем ещё раз.
      update(wrap, gallery);
      setTimeout(function () { update(wrap, gallery); }, 100);
    });

    return btn;
  }

  /** Показывать ли стрелки и какая из них уже упёрлась в край. */
  function update(wrap, gallery) {
    const max = gallery.scrollWidth - gallery.clientWidth;
    const scrollable = max > 2;

    wrap.classList.toggle("is-scrollable", scrollable);
    wrap.querySelector(".image-picker__arrow--prev").disabled = !scrollable || gallery.scrollLeft <= 1;
    wrap.querySelector(".image-picker__arrow--next").disabled = !scrollable || gallery.scrollLeft >= max - 1;
  }

  /** Подкрутить ленту к уже выбранной картинке, чтобы её было видно. */
  function revealSelected(gallery) {
    const selected = gallery.querySelector(".image-picker__thumb.is-selected");
    if (!selected || !gallery.clientWidth) return;
    if (selected.offsetLeft + selected.offsetWidth <= gallery.clientWidth) return;
    gallery.scrollLeft = selected.offsetLeft - gallery.clientWidth / 2 + selected.offsetWidth / 2;
  }

  /**
   * Превратить .image-picker__gallery в ленту со стрелками.
   * Вызывать можно сколько угодно раз: обёртка создаётся один раз,
   * дальше только пересчитывается состояние стрелок.
   */
  function attach(gallery) {
    if (!gallery) return;

    let wrap = gallery.parentNode;
    const isNew = !wrap || !wrap.classList || !wrap.classList.contains("image-picker__slider");

    if (isNew) {
      const holder = gallery.parentNode;
      wrap = document.createElement("div");
      wrap.className = "image-picker__slider";
      if (holder) holder.insertBefore(wrap, gallery);
      wrap.appendChild(makeArrow("prev", gallery, wrap));
      wrap.appendChild(gallery);
      wrap.appendChild(makeArrow("next", gallery, wrap));

      gallery.addEventListener("scroll", function () { update(wrap, gallery); }, { passive: true });

      // Пока поле не показано на экране, ширина равна нулю и считать нечего.
      // Ссылку на наблюдателя держим на самом элементе, иначе его может
      // собрать сборщик мусора вместе с подпиской.
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(function () { update(wrap, gallery); });
        observer.observe(gallery);
        gallery.__stripObserver = observer;
      }
      window.addEventListener("resize", function () { update(wrap, gallery); });
    }

    update(wrap, gallery);
    revealSelected(gallery);
  }

  /**
   * Пересчитать ленты внутри только что показанного блока.
   * Нужно потому, что у скрытой панели ширина нулевая: пока её не показали,
   * непонятно, нужны стрелки или всё и так помещается.
   */
  function refresh(root) {
    (root || document).querySelectorAll(".image-picker__gallery").forEach(attach);
  }

  return { attach: attach, refresh: refresh };
})();
