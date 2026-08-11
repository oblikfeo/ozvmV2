/*
  Логики на странице минимум: слайдер баннеров и мобильное меню.
  Никаких зависимостей — страница остаётся обычной статикой.
*/

/* ---------- Мобильное меню ---------- */

(function initMenu() {
  const burger = document.querySelector("[data-burger]");
  const nav = document.querySelector("[data-nav]");
  if (!burger || !nav) return;

  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });

  // клик по пункту меню — закрываем
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }
  });
})();

/* ---------- Слайдер баннеров ---------- */

(function initSlider() {
  const root = document.querySelector("[data-slider]");
  if (!root) return;

  const track = root.querySelector("[data-track]");
  const slides = Array.from(track.children);
  const dotsBox = root.querySelector("[data-dots]");
  const AUTOPLAY_MS = 6000;

  if (slides.length <= 1) return;

  let index = 0;
  let timer = null;

  // Точки
  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slider__dot";
    dot.setAttribute("aria-label", "Баннер " + (i + 1));
    dot.addEventListener("click", () => {
      goTo(i);
      restart();
    });
    dotsBox.appendChild(dot);
    return dot;
  });

  function goTo(next) {
    index = (next + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    slides.forEach((s, i) => s.setAttribute("aria-hidden", String(i !== index)));
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
  }

  root.querySelector("[data-prev]").addEventListener("click", () => {
    goTo(index - 1);
    restart();
  });

  root.querySelector("[data-next]").addEventListener("click", () => {
    goTo(index + 1);
    restart();
  });

  // Пауза, пока курсор на слайдере
  root.addEventListener("mouseenter", () => clearInterval(timer));
  root.addEventListener("mouseleave", restart);

  // Свайп на телефоне
  let startX = null;
  root.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true }
  );

  root.addEventListener(
    "touchend",
    (e) => {
      if (startX === null) return;
      const delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 45) goTo(index + (delta < 0 ? 1 : -1));
      startX = null;
      restart();
    },
    { passive: true }
  );

  // Стрелки клавиатуры, когда слайдер в фокусе
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { goTo(index - 1); restart(); }
    if (e.key === "ArrowRight") { goTo(index + 1); restart(); }
  });

  goTo(0);
  restart();
})();

/* ---------- Появление секций при скролле ---------- */

(function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  // Если пользователь просил меньше движения — просто показываем всё
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));
})();
