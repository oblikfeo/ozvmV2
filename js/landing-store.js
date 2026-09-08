/*
  Хранилище контента лендинга.

  Устроено так же, как PromoStore: сейчас данные лежат в localStorage браузера,
  при интеграции в основной проект тело функций меняется на вызовы API,
  а сигнатуры остаются — ни админка, ни страница не переписываются.

  Важно: админка (/admin.html) и лендинг (/landing/) отдаются с одного домена,
  поэтому localStorage у них общий и правки видны на странице сразу.

  Пока администратор ничего не сохранял, getSaved() возвращает null,
  и лендинг показывает свою обычную статическую вёрстку. Первое сохранение
  включает отрисовку из хранилища.
*/

const LandingStore = (function () {
  const STORAGE_KEY = "landing_prototype_content";
  const VERSION_KEY = "landing_prototype_version";
  /* Поднять число, если структура seed изменилась и сохранённые данные
     старого формата нужно выбросить. */
  const VERSION = "2";

  const IMG = "/landing/img/";

  /* Картинки, которые уже лежат в /landing/img/ — галерея готовых
     изображений в админке. */
  const gallery = [
    { path: IMG + "slide-main.jpg", label: "Баннер: главный" },
    { path: IMG + "girl-hero.webp", label: "Девушка с собакой (вырезка)" },
    { path: IMG + "slide-care.jpg", label: "Баннер: забота" },
    { path: IMG + "slide-delivery.jpg", label: "Баннер: доставка" },
    { path: IMG + "cat-dogs.jpg", label: "Собаки" },
    { path: IMG + "cat-cats.jpg", label: "Кошки" },
    { path: IMG + "cat-rabbits.jpg", label: "Грызуны и кролики" },
    { path: IMG + "cat-farm.jpg", label: "Сельхозживотные" },
    { path: IMG + "cat-vaccines.jpg", label: "Вакцины" },
    { path: IMG + "vet-checkup.jpg", label: "Инструменты" },
    { path: IMG + "about-cat.jpg", label: "Кот" },
    { path: IMG + "about-dog.jpg", label: "Щенок" },
    { path: IMG + "delivery-dog.jpg", label: "Доставка" },
    { path: IMG + "puppy-kitten.jpg", label: "Щенок и котёнок" },
    { path: IMG + "prod-vitamins.jpg", label: "Витамины" },
    { path: IMG + "prod-care.jpg", label: "Уход" },
    { path: IMG + "prod-food.jpg", label: "Корма" },
    { path: IMG + "prod-pills.jpg", label: "Препараты" },
    { path: IMG + "prod-shampoo.jpg", label: "Шампуни" },
    { path: IMG + "prod-syringe.jpg", label: "Шприцы" },
  ];

  /* Иконки строки преимуществ под баннером. В данных лежит ключ,
     саму разметку подставляет страница. */
  const stripIcons = [
    { key: "shield", label: "Щит" },
    { key: "truck", label: "Машина" },
    { key: "pin", label: "Метка" },
    { key: "clock", label: "Часы" },
  ];

  const seed = {
    header: {
      logoName: "ЗооВетМир",
      logoTag: "ветеринарные препараты для всех видов животных",
      phone: "+7 (904) 829-92-02",
      phoneHref: "tel:+79048299202",
      telegram: "https://t.me/zoovetmir",
      max: "https://max.ru/join/iCLqieIfmNNSp-RzGTlwsww1gAphmKCFU4K6v3BGqnI",
      lkText: "Личный кабинет партнёра",
    },

    slides: [
      {
        id: "s1",
        kind: "photo",
        badge: "Сезонное предложение",
        title: "Ветеринарная аптека полного профиля",
        text:
          "Более 4 000 наименований препаратов, вакцин, кормов и витаминов для домашних и сельскохозяйственных животных.",
        image: IMG + "slide-main.jpg",
        btn1Text: "Смотреть каталог",
        btn1Href: "#categories",
        btn2Text: "Связаться с нами",
        btn2Href: "#contacts",
        active: true,
      },
      {
        id: "s2",
        kind: "photo",
        badge: "С 2001 года",
        title: "Более 25 лет заботимся о ваших питомцах",
        text:
          "От первой прививки щенку до плановой обработки стада. За это время мы точно узнали, какие препараты работают, — и держим их в наличии.",
        image: IMG + "slide-care.jpg",
        btn1Text: "О компании",
        btn1Href: "#advantages",
        btn2Text: "",
        btn2Href: "",
        active: true,
      },
      {
        id: "s3",
        kind: "photo",
        badge: "Бесплатно от 3 000 ₽",
        title: "Доставим по Омску в день заказа",
        text:
          "Заказы до 14:00 привозим сегодня. Соблюдаем холодовую цепь для вакцин и термозависимых препаратов.",
        image: IMG + "slide-delivery.jpg",
        btn1Text: "Как это работает",
        btn1Href: "#steps",
        btn2Text: "",
        btn2Href: "",
        active: true,
      },
    ],

    strip: [
      { icon: "shield", title: "Только оригинал", text: "прямые поставки от производителей" },
      { icon: "truck", title: "Доставка в день заказа", text: "по Омску при заказе до 14:00" },
      { icon: "pin", title: "Холодовая цепь", text: "вакцины доезжают рабочими" },
      { icon: "clock", title: "Консультация бесплатно", text: "подберём препарат и дозировку" },
    ],

    promos: {
      kicker: "Акции",
      heading: "Действующие предложения",
      lead: "Постоянные предложения аптеки. Условия уточняйте у оператора при оформлении заказа.",
      items: [
        {
          id: "p1",
          badge: "Набор",
          date: "при заказе от 2 000 ₽",
          title: "Домашняя ветаптечка одним заказом",
          text:
            "Соберём базовый набор: обработка от паразитов, антисептик, средства первой помощи и витамины.",
          image: IMG + "prod-vitamins.jpg",
          active: true,
        },
        {
          id: "p2",
          badge: "В подарок",
          date: "к заказу вакцин",
          title: "Термобокс с хладоэлементами",
          text:
            "Термозависимые препараты упакуем так, чтобы вы довезли их до клиники или дачи без потери свойств.",
          image: IMG + "delivery-dog.jpg",
          active: true,
        },
        {
          id: "p3",
          badge: "Бесплатно",
          date: "до оформления заказа",
          title: "Подбор препарата и дозировки",
          text:
            "Скажите вид, возраст и вес животного — рассчитаем курс и предложим аналог, если нужной позиции нет в наличии.",
          image: IMG + "puppy-kitten.jpg",
          active: true,
        },
      ],
    },

    categories: {
      kicker: "Каталог",
      heading: "Подберём препараты для любого питомца",
      lead:
        "Работаем и с владельцами домашних животных, и с фермерскими хозяйствами. Для каждого вида — свои дозировки и формы выпуска.",
      items: [
        { id: "c1", name: "Собаки", count: "1 240 наименований", image: IMG + "cat-dogs.jpg" },
        { id: "c2", name: "Кошки", count: "980 наименований", image: IMG + "cat-cats.jpg" },
        { id: "c3", name: "Грызуны и кролики", count: "410 наименований", image: IMG + "cat-rabbits.jpg" },
        { id: "c4", name: "Сельхозживотные", count: "760 наименований", image: IMG + "cat-farm.jpg" },
        { id: "c5", name: "Вакцины", count: "180 наименований", image: IMG + "cat-vaccines.jpg" },
        { id: "c6", name: "Инструменты и расходники", count: "520 наименований", image: IMG + "vet-checkup.jpg" },
      ],
    },

    wholesale: {
      kicker: "Оптовые продажи",
      heading: "Нужны ветеринарные препараты оптом?",
      lead: "Получите доступ к оптовому каталогу и специальным ценам для бизнеса.",
      whoLabel: "Для кого",
      who: [
        { name: "Зоомагазины" },
        { name: "Ветеринарные клиники" },
        { name: "Питомники" },
        { name: "Предприниматели" },
        { name: "Оптовые покупатели" },
      ],
      geo:
        "Поставляем ветеринарную фармацевтику напрямую от производителей по России и в страны СНГ.",
      btnText: "Получить доступ к оптовым ценам",
      btnHref: "https://ozvm.ru/",
      note:
        "Оставьте контакты — менеджер свяжется с вами, зарегистрирует компанию и откроет доступ к оптовому каталогу.",
    },

    about: {
      kicker: "О компании",
      heading: "Почему выбирают ЗооВетМир",
      lead:
        "Мы снабжаем ветеринарные клиники, зоомагазины и хозяйства Омской области с 2001 года. Знаем ассортимент не по каталогу, а по практике.",
      photo1: IMG + "about-cat.jpg",
      photo2: IMG + "about-dog.jpg",
      facts: [
        {
          title: "25 лет на рынке",
          text:
            "Прошли через смену поставщиков, дефициты и импортозамещение — и научились держать наличие даже по редким позициям.",
        },
        {
          title: "Более 4 000 позиций",
          text:
            "Препараты для мелких домашних животных, птицы, КРС и лошадей. Под заказ привозим то, чего нет на складе.",
        },
        {
          title: "Документы на каждую партию",
          text:
            "Декларации соответствия и ветеринарные свидетельства. Для юрлиц — полный пакет закрывающих документов.",
        },
        {
          title: "Личный менеджер",
          text:
            "Постоянным клиентам закрепляем менеджера: подскажет аналог, соберёт заказ и предупредит о поступлении.",
        },
      ],
      stats: [
        { value: "25", label: "лет на рынке" },
        { value: "4 000+", label: "наименований в наличии" },
        { value: "600+", label: "постоянных клиентов" },
        { value: "24 ч", label: "средний срок доставки" },
      ],
    },

    steps: {
      kicker: "Доставка",
      heading: "Как оформить заказ",
      lead: "Четыре шага от заявки до получения. Ничего сложного — большую часть работы берём на себя.",
      items: [
        { title: "Оставляете заявку", text: "Звонком, в Telegram или MAX. Список позиций можно прислать файлом." },
        { title: "Согласуем состав", text: "Проверим наличие, предложим аналоги и посчитаем итоговую стоимость." },
        { title: "Собираем заказ", text: "Термозависимые препараты упаковываем в термобокс с хладоэлементами." },
        { title: "Привозим", text: "По Омску — в день заказа, по области — от суток. Оплата при получении." },
      ],
    },

    reviews: {
      kicker: "Отзывы",
      heading: "Что говорят клиенты",
      items: [
        {
          name: "Анна Ковалёва",
          role: "ветеринарная клиника «Друг»",
          text:
            "Заказываем вакцины третий год. Ни разу не было проблем с холодовой цепью — приезжают в термобоксе, температура в норме. Для клиники это критично.",
        },
        {
          name: "Сергей Мельник",
          role: "КФХ, Омский район",
          text:
            "Держим подворье, берём препараты для КРС оптом. Менеджер сам напоминает, когда пора обрабатывать стадо, и придерживает нужные позиции.",
        },
        {
          name: "Екатерина Тимофеева",
          role: "владелец питомца",
          text:
            "Нужны были капли для шиншиллы — в обычных зоомагазинах только для кошек и собак. Здесь подобрали дозировку по весу и всё объяснили.",
        },
      ],
    },

    contacts: {
      kicker: "Контакты",
      heading: "Подберём препарат и рассчитаем заказ",
      lead:
        "Напишите или позвоните — ответим в рабочее время в течение 15 минут. Для хозяйств и клиник готовим коммерческое предложение с оптовыми ценами.",
      btn1Text: "Позвонить",
      btn1Href: "tel:+79048299202",
      btn2Text: "Написать в MAX",
      btn2Href: "https://max.ru/join/iCLqieIfmNNSp-RzGTlwsww1gAphmKCFU4K6v3BGqnI",
      phone: "+7 (904) 829-92-02",
      hours: [
        { day: "Понедельник–пятница", time: "с 9:00 до 19:00" },
        { day: "Суббота", time: "с 9:00 до 18:00" },
        { day: "Воскресенье", time: "выходной" },
      ],
      email: "info@ozvm.ru",
      emailNote: "заявки и коммерческие предложения",
      address: "Омск, улица 10 лет Октября, 115",
      addressNote: "доставка по городу и Омской области",
    },

    map: {
      kicker: "На карте",
      heading: "Омск, улица 10 лет Октября, 115",
      lead: "Магазин и склад в одном месте: заказ можно забрать самому или оформить доставку по городу и области.",
      query: "Омск, улица 10 лет Октября, 115",
    },

    footer: {
      brand: "ЗооВетМир",
      tagline: "ветеринарные препараты для всех видов животных",
      note:
        "Информация на странице не является публичной офертой. Перед применением препаратов проконсультируйтесь с ветеринарным врачом.",
    },
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /** Сохранённый контент или null, если администратор ещё ничего не менял. */
  function getSaved() {
    try {
      if (localStorage.getItem(VERSION_KEY) !== VERSION) return null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  /** Контент для редактирования: сохранённый, иначе исходный. */
  function get() {
    return getSaved() || clone(seed);
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Загруженные картинки хранятся как data URL, а у localStorage лимит ~5 МБ.
      throw new Error(
        "Не хватило места в хранилище браузера. Возьмите картинку из готовой галереи или загрузите изображение меньшего размера."
      );
    }
    localStorage.setItem(VERSION_KEY, VERSION);
  }

  /** Вернуть страницу к исходному виду: правки стираются полностью. */
  function resetToSeed() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
    return clone(seed);
  }

  function getSeed() {
    return clone(seed);
  }

  function getGallery() {
    return gallery.slice();
  }

  function getStripIcons() {
    return stripIcons.slice();
  }

  return { get, getSaved, getSeed, save, resetToSeed, getGallery, getStripIcons };
})();
