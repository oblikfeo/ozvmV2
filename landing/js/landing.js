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
  const AUTOPLAY_MS = 7500;

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

/* ---------- Кнопка «наверх» ---------- */

(function initToTop() {
  const btn = document.querySelector("[data-to-top]");
  if (!btn) return;

  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Показываем, когда позади остался примерно первый экран
  const toggle = () => {
    btn.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.6);
  };

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  });
})();

/* ---------- Цифры в «Почему выбирают»: счёт от нуля ---------- */

(function initStats() {
  const values = document.querySelectorAll(".stat__value");
  if (!values.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* Из «4 000+» и «24 ч» вынимаем само число, а всё, что стоит вокруг
     него, возвращаем на место как есть — вместе с тем же разделителем
     тысяч, что стоял в вёрстке. */
  function parse(text) {
    const m = text.match(/^(\D*?)([\d\s]*\d)(.*)$/);
    if (!m) return null;

    const raw = m[2];
    const sepMatch = raw.match(/[\s]/);

    return {
      prefix: m[1],
      suffix: m[3],
      value: Number(raw.replace(/[^\d]/g, "")),
      sep: sepMatch ? sepMatch[0] : "",
    };
  }

  function render(parts, n) {
    let body = String(n);
    if (parts.sep) {
      body = body.replace(/\B(?=(\d{3})+(?!\d))/g, parts.sep);
    }
    return parts.prefix + body + parts.suffix;
  }

  function run(el) {
    const parts = parse(el.textContent.trim());
    if (!parts || !parts.value) return;

    const duration = 1600;
    const started = performance.now();

    function step(now) {
      const p = Math.min((now - started) / duration, 1);
      // Замедление к концу, чтобы цифра доезжала, а не обрывалась
      const eased = 1 - Math.pow(1 - p, 3);

      el.textContent = render(parts, Math.round(parts.value * eased));
      if (p < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        run(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  values.forEach((el) => observer.observe(el));
})();

/* ---------- Подсветка раздела, который сейчас на экране ---------- */

(function initNavSpy() {
  const header = document.querySelector(".header");
  const links = Array.from(document.querySelectorAll("[data-nav] a[href^='#']"));
  if (!header || !links.length) return;

  const pairs = links
    .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
    .filter((pair) => pair.section);
  if (!pairs.length) return;

  let current = null;
  let ticking = false;

  function update() {
    ticking = false;

    // Текущий — тот раздел, который пересекает линию сразу под шапкой
    const line = header.getBoundingClientRect().height + 8;
    let active = null;

    pairs.forEach(({ link, section }) => {
      const box = section.getBoundingClientRect();
      if (box.top <= line && box.bottom > line) active = link;
    });

    // В самом низу страницы последний раздел до линии уже не дотягивается
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (!active && atBottom) active = pairs[pairs.length - 1].link;

    if (active === current) return;
    if (current) current.classList.remove("is-active");
    if (active) active.classList.add("is-active");
    current = active;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  window.addEventListener("resize", update);
  update();
})();
