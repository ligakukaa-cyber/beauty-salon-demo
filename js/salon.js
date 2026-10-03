/* Данные салона ПИОН. Услуги, уровни мастеров и часы правятся здесь — верстку трогать не нужно. */

window.CATS = {
  hair:  "Волосы",
  nails: "Ногти",
  brows: "Брови и ресницы",
  care:  "Уход",
};

/* price — у мастера базового уровня, в рублях; dur — минут */
window.SERVICES = [
  { id: "cut",       cat: "hair",  name: "Женская стрижка",               price: 2500,  dur: 60 },
  { id: "mencut",    cat: "hair",  name: "Мужская стрижка",               price: 1800,  dur: 45 },
  { id: "color",     cat: "hair",  name: "Окрашивание в один тон",        price: 5500,  dur: 120 },
  { id: "balayage",  cat: "hair",  name: "Сложное окрашивание, балаяж",   price: 12000, dur: 240 },
  { id: "styling",   cat: "hair",  name: "Укладка",                       price: 2000,  dur: 45 },
  { id: "mani",      cat: "nails", name: "Маникюр с покрытием",           price: 2400,  dur: 90 },
  { id: "mani0",     cat: "nails", name: "Маникюр без покрытия",          price: 1200,  dur: 45 },
  { id: "pedi",      cat: "nails", name: "Педикюр с покрытием",           price: 3200,  dur: 90 },
  { id: "brows",     cat: "brows", name: "Коррекция и окрашивание бровей", price: 1500, dur: 45 },
  { id: "lamination",cat: "brows", name: "Ламинирование ресниц",          price: 2800,  dur: 60 },
  { id: "lashes",    cat: "brows", name: "Наращивание ресниц",            price: 3500,  dur: 120 },
  { id: "face",      cat: "care",  name: "Уход для лица",                 price: 4500,  dur: 60 },
  { id: "keratin",   cat: "care",  name: "Кератиновое восстановление",    price: 7000,  dur: 150 },
];

/* уровень мастера — множитель цены */
window.LEVELS = [
  { id: "master", name: "Мастер",        k: 1,    note: "опыт от 2 лет" },
  { id: "top",    name: "Топ-мастер",    k: 1.25, note: "опыт от 5 лет" },
  { id: "art",    name: "Арт-директор",  k: 1.5,  note: "автор техник салона" },
];

window.MASTERS = [
  { name: "Алина Морозова", level: "Арт-директор", what: "Стрижки и сложное окрашивание", img: "m1" },
  { name: "Карина Ли",      level: "Топ-мастер",   what: "Маникюр, педикюр, дизайн ногтей", img: "m2" },
  { name: "Денис Волков",   level: "Мастер",        what: "Мужские и женские стрижки, укладки", img: "m3" },
];

/* ежедневно с 10 до 21; визит должен закончиться до закрытия */
window.OPEN = { from: 10, to: 21, step: 30 };

window.CERT_AMOUNTS = [3000, 5000, 10000];
