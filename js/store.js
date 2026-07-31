/*
  Прототип хранилища акций.
  Сейчас данные лежат в localStorage браузера — это временная реализация
  только для этого автономного прототипа. При интеграции в основной проект
  функции ниже нужно будет заменить на вызовы реального API (Laravel),
  сохранив те же имена и сигнатуры, чтобы страницы не переписывать.
*/

const PromoStore = (function () {
  const STORAGE_KEY = "promo_prototype_promotions";
  const SEED_VERSION_KEY = "promo_prototype_seed_version";
  /* Версия демо-данных. Если поднять число — у всех браузеров данные
     перезапишутся свежим сидом при следующей загрузке.
     Без этого старый сид жил в localStorage вечно, и разные окна/профили
     показывали разные акции. */
  const SEED_VERSION = "3";

  /* Встроенные изображения — лежат в папке img/ внутри приложения,
     поэтому не зависят от внешних сервисов и работают на Vercel как есть.
     Этот же список показывается в админке как галерея готовых картинок. */
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

  const seed = [
    {
      id: "1",
      title: "Скидка 15% на витамины и добавки для собак",
      shortDescription:
        "Вся линейка витаминных комплексов и кормовых добавок для собак — со скидкой 15% при заказе от 2 000 ₽.",
      fullDescription:
        "Летний сезон — время активных прогулок, а значит и повышенных нагрузок на суставы, шерсть и иммунитет питомца.\n\nДо конца августа мы снижаем цену на всю линейку витаминных комплексов и кормовых добавок для собак: хондропротекторы, витамины группы B, комплексы для шерсти и кожи, пробиотики.\n\nУсловия участия:\n• скидка 15% действует при сумме заказа от 2 000 ₽;\n• применяется автоматически в корзине, промокод не нужен;\n• не суммируется с другими акциями и персональными скидками.\n\nЕсли сомневаетесь в выборе — напишите нам в Telegram или WhatsApp, подскажем препарат под возраст и породу.",
      image: "img/dog-vitamins.jpg",
      dateStart: "2026-07-01",
      dateEnd: "2026-08-31",
      active: true,
    },
    {
      id: "2",
      title: "Бесплатная доставка по Омску от 3 000 ₽",
      shortDescription:
        "Оформляйте заказ от 3 000 ₽ — привезём по городу бесплатно в течение рабочего дня.",
      fullDescription:
        "Больше не нужно планировать поездку в аптеку: привезём препараты прямо к вам.\n\nПри сумме заказа от 3 000 ₽ доставка по городу Омску — бесплатно. Заказы, оформленные до 14:00, доставляем в тот же день, остальные — на следующий рабочий день.\n\nКак это работает:\n• условие проверяется автоматически при оформлении заказа;\n• курьер связывается с вами за 30–60 минут до приезда;\n• оплата наличными или картой при получении.\n\nДля заказов меньше 3 000 ₽ стоимость доставки рассчитывается при оформлении. Доставка за пределы города — по договорённости с оператором.",
      image: "img/delivery-dog.jpg",
      dateStart: "2026-07-15",
      dateEnd: "2026-09-30",
      active: true,
    },
    {
      id: "3",
      title: "Корма для кошек: вторая упаковка в подарок",
      shortDescription:
        "Покупаете две упаковки лечебного корма одной линейки — вторая бесплатно.",
      fullDescription:
        "Лечебные и профилактические корма — это курс, а не разовая покупка. Поэтому мы сделали так, чтобы запас на месяц обходился выгоднее.\n\nПри покупке двух упаковок корма из акционной линейки вторая предоставляется бесплатно. В акции участвуют диетические корма при мочекаменной болезни, проблемах с ЖКТ, почками и лишним весом.\n\nВажно знать:\n• обе упаковки должны быть одного наименования и объёма;\n• подарочная позиция оформляется оператором при подтверждении заказа;\n• количество товара по акции ограничено складскими остатками.\n\nПеред сменой рациона рекомендуем проконсультироваться с ветеринарным врачом.",
      image: "img/cat-food.jpg",
      dateStart: "2026-07-20",
      dateEnd: "2026-09-20",
      active: true,
    },
    {
      id: "4",
      title: "Вакцинация щенков: комплекс со скидкой 20%",
      shortDescription:
        "Комплексные вакцины для щенков и котят — минус 20% на весь период акции.",
      fullDescription:
        "Первая вакцинация закладывает иммунитет питомца на годы вперёд. Мы снижаем цену, чтобы это не откладывали.\n\nСкидка 20% распространяется на комплексные вакцины для щенков и котят, включая препараты против чумы плотоядных, парвовирусного энтерита, гепатита, панлейкопении и бешенства.\n\nЧто входит в предложение:\n• импортные и отечественные вакцины ведущих производителей;\n• препараты хранятся и перевозятся с соблюдением холодовой цепи;\n• бесплатная консультация по графику вакцинации.\n\nОбратите внимание: вакцинация проводится только клинически здоровым животным после дегельминтизации. Схему прививок подбирает ветеринарный врач.",
      image: "img/puppy-vaccine.jpg",
      dateStart: "2026-08-01",
      dateEnd: "2026-10-31",
      active: true,
    },
    {
      id: "5",
      title: "Уход за грызунами и кроликами — скидка 10%",
      shortDescription:
        "Антипаразитарные препараты, витамины и средства ухода для мелких домашних животных.",
      fullDescription:
        "Кролики, морские свинки, хомяки и шиншиллы требуют не меньше внимания, чем кошки и собаки — а подобрать для них препараты сложнее.\n\nМы собрали отдельную витрину товаров для мелких домашних животных и снизили на неё цены на 10%: антипаразитарные капли и спреи, витаминные добавки, средства для ухода за шерстью и когтями, наполнители и дезинфицирующие растворы.\n\nПочему это удобно:\n• дозировки рассчитаны специально для мелких видов;\n• в наличии препараты, которых нет в зоомагазинах общего профиля;\n• поможем подобрать дозировку по весу животного.\n\nСкидка действует на весь раздел без ограничения по сумме заказа.",
      image: "img/rabbit-care.jpg",
      dateStart: "2026-07-10",
      dateEnd: "2026-09-15",
      active: true,
    },
    {
      id: "6",
      title: "Препараты для сельхозживотных по оптовым ценам",
      shortDescription:
        "Оптовая цена от 5 упаковок одного наименования — для хозяйств и частных подворий.",
      fullDescription:
        "Работаем не только с владельцами домашних питомцев, но и с фермерскими хозяйствами, КФХ и частными подворьями.\n\nПри заказе от 5 упаковок одного наименования цена автоматически пересчитывается по оптовому прайсу. Предложение действует на ветеринарные препараты для КРС, лошадей, свиней, овец и птицы: антибиотики, противопаразитарные средства, витаминно-минеральные комплексы, вакцины и дезинфицирующие средства.\n\nДля постоянных клиентов:\n• закреплённый персональный менеджер;\n• отсрочка платежа по договору;\n• полный пакет документов, включая ветеринарные свидетельства;\n• доставка по Омской области.\n\nДля расчёта заказа и заключения договора свяжитесь с нами по телефону или электронной почте.",
      image: "img/horse-farm.jpg",
      dateStart: "2026-07-05",
      dateEnd: "2026-12-31",
      active: true,
    },
  ];

  function resetSeed() {
    writeAll(seed);
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    return seed.slice();
  }

  function readAll() {
    // Сид устарел (или его не было) — перезаписываем, чтобы данные
    // всегда соответствовали текущей версии прототипа.
    if (localStorage.getItem(SEED_VERSION_KEY) !== SEED_VERSION) {
      return resetSeed();
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return resetSeed();
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : resetSeed();
    } catch (e) {
      return resetSeed();
    }
  }

  function writeAll(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // Загруженные картинки хранятся как data URL, а у localStorage лимит ~5 МБ.
      // Сообщаем явно, вместо того чтобы молча потерять данные.
      throw new Error(
        "Не хватило места в хранилище браузера. Удалите часть акций или используйте изображение меньшего размера."
      );
    }
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }

  function getAll() {
    return readAll();
  }

  function getActive() {
    return readAll().filter((p) => p.active);
  }

  function getById(id) {
    return readAll().find((p) => String(p.id) === String(id)) || null;
  }

  function upsert(promotion) {
    const list = readAll();
    if (!promotion.id) {
      promotion.id = String(Date.now());
      list.push(promotion);
    } else {
      const index = list.findIndex((p) => String(p.id) === String(promotion.id));
      if (index === -1) {
        list.push(promotion);
      } else {
        list[index] = promotion;
      }
    }
    writeAll(list);
    return promotion;
  }

  function remove(id) {
    const list = readAll().filter((p) => String(p.id) !== String(id));
    writeAll(list);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(readAll(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "promotions.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file, onDone) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (Array.isArray(parsed)) {
          writeAll(parsed);
          if (onDone) onDone(true);
        } else {
          if (onDone) onDone(false);
        }
      } catch (err) {
        if (onDone) onDone(false);
      }
    };
    reader.readAsText(file);
  }

  function resetToSeed() {
    resetSeed();
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
    exportJSON,
    importJSON,
    resetToSeed,
    getBuiltinImages,
  };
})();
