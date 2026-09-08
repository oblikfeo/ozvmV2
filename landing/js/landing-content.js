/*
  Подстановка контента из админки в готовую вёрстку лендинга.

  Пока администратор ничего не сохранял, скрипт молча выходит и страница
  остаётся обычной статикой — тем же HTML, что лежит в index.html.
  После первого сохранения секции перерисовываются из хранилища.

  Скрипт обязан идти ДО landing.js: слайдер собирает точки и автопрокрутку
  по тем баннерам, которые уже стоят в разметке.
*/

(function applyLandingContent() {
  if (typeof LandingStore === "undefined") return;

  const saved = LandingStore.getSaved();
  if (!saved) return;

  /* Накладываем сохранённое на исходные данные: если в старом сохранении
     нет какого-то поля, берётся значение из seed, а не пустота. */
  function merge(base, override) {
    if (override === undefined) return base;
    if (Array.isArray(base) || Array.isArray(override)) return override;
    if (base && typeof base === "object" && override && typeof override === "object") {
      const out = {};
      Object.keys(base).forEach((key) => {
        out[key] = merge(base[key], override[key]);
      });
      Object.keys(override).forEach((key) => {
        if (!(key in out)) out[key] = override[key];
      });
      return out;
    }
    return override;
  }

  const data = merge(LandingStore.getSeed(), saved);

  /* ---------- Мелкие помощники ---------- */

  function q(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setText(selector, value, scope) {
    const node = q(selector, scope);
    if (node) node.textContent = value == null ? "" : value;
  }

  /** Надзаголовок, заголовок и подводка секции */
  function head(sectionSelector, block, withLead) {
    const titles = q(sectionSelector + " .section__titles");
    if (!titles) return;
    setText(".section__kicker", block.kicker, titles);
    const heading = q("h2", titles);
    if (heading) heading.textContent = block.heading || "";
    if (withLead !== false) setText(".section__lead", block.lead, titles);
  }

  /* Иконки полосы преимуществ: ключ из данных -> готовая разметка. */
  const ICONS = {
    shield:
      '<path d="M12 2L4 5.5V11c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5.5L12 2z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    truck:
      '<path d="M3 7h11v10H3z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 10h4l3 3v4h-7z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.8" stroke="currentColor" stroke-width="1.7"/><circle cx="17.5" cy="18" r="1.8" stroke="currentColor" stroke-width="1.7"/>',
    pin:
      '<path d="M12 21s-7-4.6-7-10a7 7 0 1114 0c0 5.4-7 10-7 10z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.5 11.5l1.7 1.7 3.3-3.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    clock:
      '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  function icon(key, size) {
    const body = ICONS[key] || ICONS.shield;
    const s = size || 26;
    return (
      '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      body +
      "</svg>"
    );
  }

  const STAR =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8L12 2z"/></svg>';

  /* ---------- 1. Шапка ---------- */

  (function renderHeader() {
    const h = data.header;
    setText(".header__logo-name", h.logoName);
    setText(".header__logo-tag", h.logoTag);

    const phone = q(".header__phone");
    if (phone) {
      phone.href = h.phoneHref || "#";
      setText("b", h.phone, phone);
    }

    const socials = document.querySelectorAll(".header__social");
    if (socials[0]) socials[0].href = h.telegram || "#";
    if (socials[1]) socials[1].href = h.max || "#";

    setText(".header__lk span", h.lkText);
  })();

  /* ---------- 2. Слайдер ---------- */

  (function renderSlides() {
    const track = q("[data-track]");
    if (!track) return;

    const slides = (data.slides || []).filter((s) => s.active !== false);
    if (!slides.length) return;

    track.innerHTML = slides
      .map(function (slide, index) {
        const isBrand = slide.kind === "brand";
        const titleTag = index === 0 ? "h1" : "h2";

        const media = slide.image
          ? isBrand
            ? '<img class="slide__cutout" src="' + esc(slide.image) + '" alt="" />'
            : '<img class="slide__img" src="' + esc(slide.image) + '" alt="" />'
          : "";

        let actions = "";
        if (slide.btn1Text) {
          actions +=
            '<a class="btn btn-accent" href="' + esc(slide.btn1Href || "#") + '">' + esc(slide.btn1Text) + "</a>";
        }
        if (slide.btn2Text) {
          /* На фото вторая кнопка белая: текст слайда светлый и обводка
             тёмно-синим на затемнении не читается. */
          const btn2 = isBrand ? "btn-outline" : "btn-light";
          actions +=
            '<a class="btn ' + btn2 + '" href="' + esc(slide.btn2Href || "#") + '">' + esc(slide.btn2Text) + "</a>";
        }

        return (
          '<article class="slide' + (isBrand ? " slide--brand" : "") + '">' +
          media +
          '<div class="container slide__content"><div class="slide__box">' +
          (slide.badge
            ? '<span class="badge badge-accent slide__badge">' + esc(slide.badge) + "</span>"
            : "") +
          "<" + titleTag + ' class="slide__title">' + esc(slide.title) + "</" + titleTag + ">" +
          (slide.text ? '<p class="slide__text">' + esc(slide.text) + "</p>" : "") +
          (actions ? '<div class="slide__actions">' + actions + "</div>" : "") +
          "</div></div></article>"
        );
      })
      .join("");
  })();

  /* ---------- Полоса преимуществ ---------- */

  (function renderStrip() {
    const strip = q(".hero__strip");
    if (!strip) return;

    strip.innerHTML = (data.strip || [])
      .map(function (item) {
        return (
          '<div class="hero__strip-item">' +
          icon(item.icon) +
          "<div><b>" + esc(item.title) + "</b><span>" + esc(item.text) + "</span></div>" +
          "</div>"
        );
      })
      .join("");
  })();

  /* ---------- 3. Акции ---------- */

  (function renderPromos() {
    head("#promotions", data.promos);

    const grid = q(".promos");
    if (!grid) return;

    grid.innerHTML = (data.promos.items || [])
      .filter((item) => item.active !== false)
      .map(function (item) {
        return (
          '<article class="promo">' +
          '<div class="promo__media">' +
          (item.image ? '<img src="' + esc(item.image) + '" alt="' + esc(item.title) + '" loading="lazy" />' : "") +
          (item.badge ? '<span class="badge badge-accent promo__badge">' + esc(item.badge) + "</span>" : "") +
          "</div>" +
          '<div class="promo__body">' +
          (item.date ? '<span class="promo__date">' + esc(item.date) + "</span>" : "") +
          "<h3>" + esc(item.title) + "</h3>" +
          "<p>" + esc(item.text) + "</p>" +
          "</div></article>"
        );
      })
      .join("");
  })();

  /* ---------- 4. Каталог ---------- */

  (function renderCategories() {
    head("#categories", data.categories);

    const grid = q(".categories");
    if (!grid) return;

    grid.innerHTML = (data.categories.items || [])
      .map(function (item) {
        return (
          '<article class="category">' +
          (item.image ? '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" loading="lazy" />' : "") +
          "<div>" +
          '<span class="category__name">' + esc(item.name) + "</span>" +
          '<span class="category__count">' + esc(item.count) + "</span>" +
          "</div></article>"
        );
      })
      .join("");
  })();

  /* ---------- 5. Оптовым покупателям ---------- */

  (function renderWholesale() {
    const w = data.wholesale;
    const section = q("#wholesale");
    if (!section || !w) return;

    setText(".section__kicker", w.kicker, section);
    const heading = q("h2", section);
    if (heading) heading.textContent = w.heading || "";

    setText(".wholesale__lead", w.lead, section);
    setText(".wholesale__who-label", w.whoLabel, section);
    setText(".wholesale__geo", w.geo, section);
    setText(".wholesale__note", w.note, section);

    const tags = q(".wholesale__tags", section);
    if (tags) {
      tags.innerHTML = (w.who || [])
        .map(function (item) {
          return "<li>" + esc(item.name) + "</li>";
        })
        .join("");
    }

    const btn = q(".wholesale__btn", section);
    if (btn) {
      btn.href = w.btnHref || "#";
      btn.textContent = w.btnText || "";
    }
  })();

  /* ---------- 6. О компании ---------- */

  (function renderAbout() {
    head("#advantages", data.about);

    const photos = q(".about__photos");
    if (photos) {
      photos.innerHTML = [data.about.photo1, data.about.photo2]
        .filter(Boolean)
        .map(function (src) {
          return '<figure class="about__photo"><img src="' + esc(src) + '" alt="" loading="lazy" /></figure>';
        })
        .join("");
    }

    const facts = q(".about__facts");
    if (facts) {
      facts.innerHTML = (data.about.facts || [])
        .map(function (fact) {
          return "<li><h3>" + esc(fact.title) + "</h3><p>" + esc(fact.text) + "</p></li>";
        })
        .join("");
    }

    const stats = q(".stats");
    if (stats) {
      stats.innerHTML = (data.about.stats || [])
        .map(function (stat) {
          return (
            '<div class="stat"><div class="stat__value">' + esc(stat.value) + "</div>" +
            '<div class="stat__label">' + esc(stat.label) + "</div></div>"
          );
        })
        .join("");
    }
  })();

  /* ---------- 7. Как заказать ---------- */

  (function renderSteps() {
    head("#steps", data.steps);

    const grid = q(".steps");
    if (!grid) return;

    grid.innerHTML = (data.steps.items || [])
      .map(function (step) {
        return '<article class="step"><h3>' + esc(step.title) + "</h3><p>" + esc(step.text) + "</p></article>";
      })
      .join("");
  })();

  /* ---------- 8. Отзывы ---------- */

  /** «Анна Ковалёва» -> «АК» для кружка рядом с именем */
  function initials(name) {
    return String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  (function renderReviews() {
    head("#reviews", data.reviews, false);

    const grid = q(".reviews");
    if (!grid) return;

    grid.innerHTML = (data.reviews.items || [])
      .map(function (review) {
        return (
          '<article class="review">' +
          '<div class="review__stars" aria-label="Оценка 5 из 5">' + STAR.repeat(5) + "</div>" +
          '<p class="review__text">' + esc(review.text) + "</p>" +
          '<div class="review__author">' +
          '<div class="review__avatar" aria-hidden="true">' + esc(initials(review.name)) + "</div>" +
          "<div>" +
          '<div class="review__name">' + esc(review.name) + "</div>" +
          '<div class="review__role">' + esc(review.role) + "</div>" +
          "</div></div></article>"
        );
      })
      .join("");
  })();

  /* ---------- 9. Контакты ---------- */

  (function renderContacts() {
    const c = data.contacts;
    const section = q("#contacts");
    if (!section) return;

    setText(".section__kicker", c.kicker, section);
    const heading = q("h2", section);
    if (heading) heading.textContent = c.heading || "";

    const lead = q(".cta__inner > div > p", section);
    if (lead) lead.textContent = c.lead || "";

    const actions = q(".cta__actions", section);
    if (actions) {
      let html = "";
      if (c.btn1Text) {
        html += '<a class="btn btn-accent" href="' + esc(c.btn1Href || "#") + '">' + esc(c.btn1Text) + "</a>";
      }
      if (c.btn2Text) {
        html +=
          '<a class="btn btn-light" href="' + esc(c.btn2Href || "#") +
          '" target="_blank" rel="noopener">' + esc(c.btn2Text) + "</a>";
      }
      actions.innerHTML = html;
    }

    const card = q(".cta__card", section);
    if (!card) return;

    const hours = (c.hours || [])
      .map(function (row) {
        return (
          '<li><span class="hours__day">' + esc(row.day) + "</span>" +
          '<span class="hours__time">' + esc(row.time) + "</span></li>"
        );
      })
      .join("");

    card.innerHTML =
      '<div class="cta__row">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5.5 2C5 2 4.75 2.18 4.43 2.54L2.54 4.7C2.15 5.15 2 5.86 2 6.6c0 2.45 1.85 6.44 5.4 10 3.56 3.55 7.55 5.4 10 5.4.74 0 1.44-.15 1.9-.54l2.16-1.9c.36-.31.54-.54.55-1.07 0-.39-.22-.76-.54-1.08l-2.97-2.97c-.34-.34-.62-.55-1.08-.55-.48 0-.79.25-1.08.55l-1.08 1.08c-.5.48-.87.51-1.35.27L8.22 10.1c-.24-.48-.2-.85.27-1.35l1.08-1.08c.3-.3.54-.6.54-1.08 0-.46-.21-.75-.54-1.08L6.6 2.54C6.28 2.22 5.9 2 5.5 2z" fill="currentColor"/></svg>' +
      "<div><b>" + esc(c.phone) + '</b><ul class="hours">' + hours + "</ul></div>" +
      "</div>" +
      '<div class="cta__row">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M2.5 6.5L12 13l9.5-6.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>' +
      "<div><b>" + esc(c.email) + "</b><span>" + esc(c.emailNote) + "</span></div>" +
      "</div>" +
      '<div class="cta__row">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s-7-4.6-7-10a7 7 0 1114 0c0 5.4-7 10-7 10z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="11" r="2.4" stroke="currentColor" stroke-width="1.7"/></svg>' +
      "<div><b>" + esc(c.address) + "</b><span>" + esc(c.addressNote) + "</span></div>" +
      "</div>";
  })();

  /* ---------- 10. Карта ---------- */

  (function renderMap() {
    head("#map", data.map);

    const frame = q(".map__frame iframe");
    if (!frame) return;

    const query = encodeURIComponent(data.map.query || "");
    frame.src = "https://yandex.ru/map-widget/v1/?text=" + query + "&z=17";
    frame.title = "Карта: " + (data.map.query || "");
  })();

  /* ---------- Подвал ---------- */

  (function renderFooter() {
    setText(".footer__brand b", data.footer.brand);
    setText(".footer__brand span", data.footer.tagline);
    setText(".footer__note", data.footer.note);
  })();
})();
