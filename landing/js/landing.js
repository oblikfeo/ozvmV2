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

/* ---------- Статус «открыто / закрыто» в шапке ---------- */

(function initWorkTime() {
  const el = document.querySelector("[data-worktime]");
  if (!el) return;

  // Часы работы: [открытие, закрытие]. Воскресенья в списке нет — выходной.
  const HOURS = { 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 18] };
  const DAY_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  // Магазин в Омске, а посетитель может быть в любом часовом поясе,
  // поэтому день и время берём по Asia/Omsk, а не из локальной даты.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Omsk",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  function render() {
    const parts = {};
    fmt.formatToParts(new Date()).forEach((p) => (parts[p.type] = p.value));

    const day = WEEKDAY[parts.weekday];
    const minutes = Number(parts.hour) * 60 + Number(parts.minute);
    const today = HOURS[day];

    if (today) {
      if (minutes < today[0] * 60) return set(false, `Откроется в ${today[0]}:00`);
      if (minutes < today[1] * 60) return set(true, `Открыто до ${today[1]}:00`);
    }

    // Закрыто: показываем, когда откроемся снова
    for (let i = 1; i <= 7; i++) {
      const next = (day + i) % 7;
      if (!HOURS[next]) continue;
      const when = i === 1 ? "завтра" : DAY_SHORT[next];
      return set(false, `Закрыто · ${when} с ${HOURS[next][0]}:00`);
    }
  }

  function set(isOpen, text) {
    el.textContent = text;
    el.classList.toggle("is-open", isOpen);
  }

  render();
  setInterval(render, 60000);
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
