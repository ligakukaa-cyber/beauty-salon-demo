/* ПИОН — сборка визита из услуг, окна под длительность визита, галерея, сертификат. */
(() => {
  const CATS = window.CATS, SERVICES = window.SERVICES, LEVELS = window.LEVELS, OPEN = window.OPEN;
  const rub = (n) => Math.round(n).toLocaleString("ru-RU") + " ₽";
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
  const durText = (min) => {
    const h = Math.floor(min / 60), m = min % 60;
    return [h ? `${h} ч` : "", m ? `${m} мин` : ""].filter(Boolean).join(" ");
  };

  /* ---------- расчет визита (чистые функции — их проверяет тест) ---------- */
  const calc = (ids, levelId) => {
    const level = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
    const list = SERVICES.filter((s) => ids.includes(s.id));
    const price = list.reduce((sum, s) => sum + Math.round(s.price * level.k / 100) * 100, 0);
    const dur = list.reduce((sum, s) => sum + s.dur, 0);
    return { price, dur, lines: list.map((s) => [s.name, Math.round(s.price * level.k / 100) * 100]) };
  };

  // Занятость в демо — 2–3 записи блоками по 30–120 минут, детерминированно от дня:
  // одинакова при каждой загрузке и похожа на живое расписание (запись идет блоками, а не дырами).
  const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 11);
  const bookings = (dayIso) => {
    const slotsInDay = (OPEN.to - OPEN.from) * 60 / OPEN.step;
    const n = 2 + (hash(dayIso) % 2);
    return [...Array(n)].map((_, i) => {
      const start = OPEN.from * 60 + (hash(`${dayIso}|s${i}`) % slotsInDay) * OPEN.step;
      return [start, start + (1 + hash(`${dayIso}|l${i}`) % 4) * OPEN.step];
    });
  };
  const busy = (dayIso, min) => bookings(dayIso).some(([a, b]) => min >= a && min < b);

  // Время начала, с которого весь визит помещается подряд и заканчивается до закрытия.
  const starts = (dayIso, dur, now = new Date()) => {
    if (dur <= 0) return [];
    const need = Math.ceil(dur / OPEN.step);
    const out = [];
    for (let m = OPEN.from * 60; m + dur <= OPEN.to * 60; m += OPEN.step) {
      const at = new Date(`${dayIso}T${hm(m)}:00`);
      if (at - now < 60 * 60 * 1000) continue;
      let ok = true;
      for (let k = 0; k < need; k += 1) if (busy(dayIso, m + k * OPEN.step)) { ok = false; break; }
      if (ok) out.push(hm(m));
    }
    return out;
  };
  window.PION_CALC = calc;
  window.PION_STARTS = starts;

  /* ---------- шапка, появление ---------- */
  const nav = document.getElementById("nav");
  const fab = document.querySelector(".call-fab");
  const visitSec = document.getElementById("visit");
  const onScroll = () => {
    nav.classList.toggle("stuck", window.scrollY > 30);
    const r = visitSec.getBoundingClientRect();
    fab?.classList.toggle("hide", window.scrollY < 400 || (r.top < window.innerHeight && r.bottom > 0));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const io = new IntersectionObserver((items) => {
    items.forEach((it) => { if (it.isIntersecting) { it.target.classList.add("in"); io.unobserve(it.target); } });
  }, { threshold: 0.1 });

  /* ---------- карточки направлений ---------- */
  const CAT_IMG = { hair: "hair", nails: "nails", brows: "brows", care: "care" };
  document.getElementById("catCards").innerHTML = Object.entries(CATS).map(([id, name]) => {
    const from = Math.min(...SERVICES.filter((s) => s.cat === id).map((s) => s.price));
    return `<a class="cat reveal" href="#visit" data-cat="${id}">
      <img src="assets/${CAT_IMG[id]}.jpg" alt="${name}" loading="lazy">
      <span class="cat-in"><b>${name}</b><i>от ${rub(from)}</i></span></a>`;
  }).join("");

  /* ---------- сборка визита ---------- */
  const st = { ids: [], level: "master", day: null, time: null, tab: "hair" };
  const tabsEl = document.getElementById("svcTabs"), listEl = document.getElementById("svcList");
  const levelsEl = document.getElementById("levels"), daysEl = document.getElementById("days"), timesEl = document.getElementById("times");
  const submit = document.getElementById("visitSubmit");

  const renderTabs = () => {
    tabsEl.innerHTML = Object.entries(CATS).map(([id, name]) => {
      const n = SERVICES.filter((s) => s.cat === id && st.ids.includes(s.id)).length;
      return `<button type="button" role="tab" aria-selected="${id === st.tab}" class="${id === st.tab ? "on" : ""}" data-tab="${id}">${name}${n ? `<i>${n}</i>` : ""}</button>`;
    }).join("");
    listEl.innerHTML = SERVICES.filter((s) => s.cat === st.tab).map((s) => `
      <label class="svc${st.ids.includes(s.id) ? " on" : ""}">
        <input type="checkbox" value="${s.id}" ${st.ids.includes(s.id) ? "checked" : ""}>
        <span class="svc-name">${s.name}<i>${durText(s.dur)}</i></span>
        <b>${rub(Math.round(s.price * LEVELS.find((l) => l.id === st.level).k / 100) * 100)}</b></label>`).join("");
  };
  const renderLevels = () => {
    levelsEl.innerHTML = LEVELS.map((l) => `
      <button type="button" role="radio" aria-checked="${l.id === st.level}" class="lvl${l.id === st.level ? " on" : ""}" data-level="${l.id}">
        <b>${l.name}</b><span>${l.note}</span><i>${l.k === 1 ? "базовая цена" : `+${Math.round((l.k - 1) * 100)}%`}</i></button>`).join("");
  };
  const week = () => [...Array(7)].map((_, i) => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + i); });
  const renderTimes = () => {
    const { dur } = calc(st.ids, st.level);
    const note = document.getElementById("timesNote");
    if (!dur) {
      daysEl.innerHTML = ""; timesEl.innerHTML = "";
      note.textContent = "Сначала выберите услуги — покажем окна под длительность визита.";
      return;
    }
    const days = week();
    if (!st.day || !starts(st.day, dur).length) {
      const first = days.find((d) => starts(iso(d), dur).length);
      st.day = first ? iso(first) : iso(days[0]);
    }
    daysEl.innerHTML = days.map((d, i) => {
      const n = starts(iso(d), dur).length;
      const label = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : d.toLocaleDateString("ru-RU", { weekday: "short" });
      return `<button type="button" role="radio" aria-checked="${iso(d) === st.day}" class="day${iso(d) === st.day ? " on" : ""}" data-day="${iso(d)}" ${n ? "" : "disabled"}>
        <i>${label}</i><b>${d.getDate()}</b></button>`;
    }).join("");
    const list = starts(st.day, dur);
    if (!list.includes(st.time)) st.time = null;
    timesEl.innerHTML = list.map((t) => `<button type="button" role="radio" aria-checked="${t === st.time}" class="time${t === st.time ? " on" : ""}" data-time="${t}">${t}</button>`).join("");
    note.textContent = list.length
      ? `Показываем начало визита: все ${durText(dur)} пройдут без перерыва.`
      : "На эту неделю нет окна на весь визит подряд — разделим его на два дня, позвоните нам.";
  };
  const renderSum = () => {
    const r = calc(st.ids, st.level);
    document.getElementById("sumLines").innerHTML = r.lines.length
      ? r.lines.map(([n, p]) => `<li><span>${n}</span><b>${rub(p)}</b></li>`).join("")
      : '<li class="empty">Выберите хотя бы одну услугу</li>';
    document.getElementById("sumLevel").textContent = LEVELS.find((l) => l.id === st.level).name;
    document.getElementById("sumDur").textContent = r.dur ? durText(r.dur) : "—";
    document.getElementById("sumWhen").textContent = st.day && st.time
      ? `${new Date(st.day + "T00:00:00").toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}, ${st.time}–${hm(+st.time.slice(0, 2) * 60 + +st.time.slice(3) + r.dur)}`
      : "—";
    document.getElementById("sumTotal").textContent = rub(r.price);
    submit.disabled = !(r.dur && st.time);
  };
  const render = () => { renderTabs(); renderLevels(); renderTimes(); renderSum(); };

  tabsEl.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { st.tab = b.dataset.tab; renderTabs(); } });
  listEl.addEventListener("change", (e) => {
    const id = e.target.value;
    st.ids = e.target.checked ? [...st.ids, id] : st.ids.filter((x) => x !== id);
    render();
  });
  levelsEl.addEventListener("click", (e) => { const b = e.target.closest("[data-level]"); if (b) { st.level = b.dataset.level; render(); } });
  daysEl.addEventListener("click", (e) => { const b = e.target.closest("[data-day]"); if (b && !b.disabled) { st.day = b.dataset.day; st.time = null; renderTimes(); renderSum(); } });
  timesEl.addEventListener("click", (e) => { const b = e.target.closest("[data-time]"); if (b) { st.time = b.dataset.time; renderTimes(); renderSum(); } });
  document.getElementById("catCards").addEventListener("click", (e) => {
    const a = e.target.closest("[data-cat]"); if (a) { st.tab = a.dataset.cat; renderTabs(); }
  });
  render();

  /* ---------- форма записи ---------- */
  const bad = (input, text) => {
    const f = input.closest(".field, .check"); f.classList.add("bad");
    if (text && !f.querySelector(".err")) { const p = document.createElement("p"); p.className = "err"; p.textContent = text; f.appendChild(p); }
  };
  const clean = (input) => { const f = input.closest(".field, .check"); f.classList.remove("bad"); f.querySelector(".err")?.remove(); };
  const phoneMask = (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (!d) { e.target.value = ""; return; }
    const b = d.length === 11 ? d.slice(1) : d;
    const p = [b.slice(0, 3), b.slice(3, 6), b.slice(6, 8), b.slice(8, 10)];
    e.target.value = "+7 " + p[0] + (p[1] ? " " + p[1] : "") + (p[2] ? "-" + p[2] : "") + (p[3] ? "-" + p[3] : "");
  };
  document.getElementById("phone").addEventListener("input", phoneMask);
  document.getElementById("visitForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name"), phone = document.getElementById("phone"), agree = document.getElementById("agree");
    [name, phone, agree].forEach(clean);
    let ok = true;
    if (name.value.trim().length < 2) { bad(name, "Как к вам обращаться?"); ok = false; }
    if (phone.value.replace(/\D/g, "").length < 10) { bad(phone, "Проверьте номер"); ok = false; }
    if (!agree.checked) { bad(agree); ok = false; }
    if (!ok) return;
    const msg = document.getElementById("visitOk");
    msg.textContent = `Готово, ${name.value.trim()}! Ждем вас ${document.getElementById("sumWhen").textContent}. Администратор пришлет подтверждение в мессенджер.`;
    msg.hidden = false;
    submit.disabled = true;
  });

  /* ---------- мастера ---------- */
  document.getElementById("mastersList").innerHTML = window.MASTERS.map((m) => `
    <figure class="master reveal"><img src="assets/${m.img}.jpg" alt="${m.name}" loading="lazy">
      <figcaption><span>${m.level}</span><b>${m.name}</b><i>${m.what}</i></figcaption></figure>`).join("");

  /* ---------- работы ---------- */
  document.getElementById("worksFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    document.querySelectorAll("#worksFilter button").forEach((x) => x.classList.toggle("on", x === b));
    document.querySelectorAll("#worksGrid .work").forEach((w) => { w.hidden = !!b.dataset.cat && w.dataset.cat !== b.dataset.cat; });
  });

  /* ---------- сертификат ---------- */
  let amount = 5000;
  const amountsEl = document.getElementById("amounts");
  const custom = document.getElementById("giftCustom");
  const renderAmounts = () => {
    amountsEl.innerHTML = window.CERT_AMOUNTS.map((a) =>
      `<button type="button" class="${a === amount && !custom.value ? "on" : ""}" data-amount="${a}">${rub(a)}</button>`).join("");
  };
  const renderCert = () => {
    const to = document.getElementById("giftTo").value.trim(), from = document.getElementById("giftFrom").value.trim();
    document.getElementById("certSum").textContent = rub(amount);
    document.getElementById("certTo").textContent = to ? `Для: ${to}` : "Для особенного человека";
    document.getElementById("certFrom").textContent = from ? `С любовью, ${from}` : "";
  };
  amountsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-amount]"); if (!b) return;
    amount = +b.dataset.amount; custom.value = ""; renderAmounts(); renderCert();
  });
  custom.addEventListener("input", () => {
    const v = Math.round(+custom.value);
    if (v >= 1000 && v <= 100000) amount = v;
    renderAmounts(); renderCert();
  });
  ["giftTo", "giftFrom"].forEach((id) => document.getElementById(id).addEventListener("input", renderCert));
  document.getElementById("giftPhone").addEventListener("input", phoneMask);
  document.getElementById("giftForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const phone = document.getElementById("giftPhone");
    clean(phone);
    if (phone.value.replace(/\D/g, "").length < 10) { bad(phone, "Куда позвонить, чтобы оформить?"); return; }
    const ok = document.getElementById("giftOk");
    ok.textContent = `Сертификат на ${rub(amount)} оформлен (демо). Администратор свяжется, чтобы уточнить доставку и оплату.`;
    ok.hidden = false;
  });
  renderAmounts(); renderCert();

  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
