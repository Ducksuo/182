/* Plan 182 · app de checklist. Todo se guarda en localStorage del dispositivo. */
(() => {
  const KEY = "plan182.v1";
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DAY_MS = 86400000;
  const WD_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const fmtN = x => Number(x).toLocaleString("es-ES");

  /* ---------- Estado ---------- */
  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); s.days ||= {}; s.shop ||= {}; return s; }
    } catch (e) {}
    return { version: 1, start: null, goal: null, days: {}, shop: {} };
  }
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { toast("No se pudo guardar. Exporta una copia desde Ajustes."); }
    }, 150);
  }
  function dayData(n) { return (state.days[n] ||= { c: {}, w: {} }); }

  /* ---------- Fechas ---------- */
  function parseDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function toISO(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
  function today0() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function dateOfDay(n) { const d = parseDate(state.start); d.setDate(d.getDate() + n - 1); return d; }
  function todayN() { return Math.round((today0() - parseDate(state.start)) / DAY_MS) + 1; }
  function fmtDate(d, long = false) {
    return long ? `${WD_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}` : `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  }

  /* ---------- Puntuación del día ---------- */
  function score(n) {
    const p = getDay(n), dd = state.days[n] || { c: {} }, c = dd.c || {};
    let done = 0, total = 0;
    for (const k of ["b", "l", "d"]) { total++; if (c[k]) done++; }
    total++; if (c.steps) done++;
    total++;
    if (p.workout) { const ex = p.workout.exercises.length; done += p.workout.exercises.filter((_, i) => c["ex" + i]).length / ex; }
    else if (c.rest) done++;
    for (const [k] of HABITS) { total++; if (c["h_" + k]) done++; }
    return done / total;
  }
  function status(n) {
    const t = todayN();
    if (n > t) return "future";
    const r = score(n);
    if (r >= 0.999) return "good";
    if (n === t) return "today";
    return r >= 0.6 ? "mid" : "bad";
  }
  const ICON = {
    good: '<svg viewBox="0 0 24 24" class="ic good"><circle cx="12" cy="12" r="11"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mid: '<svg viewBox="0 0 24 24" class="ic mid"><circle cx="12" cy="12" r="8"/></svg>',
    bad: '<svg viewBox="0 0 24 24" class="ic bad"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke-width="3.2" stroke-linecap="round"/></svg>',
  };

  /* ---------- Navegación ---------- */
  let view = "hoy", current = 1;
  function go(v, n) {
    view = v; if (n) current = n;
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("on", b.dataset.v === v));
    render(); window.scrollTo(0, 0);
  }

  function render() {
    const app = $("#app");
    if (!state.start) { $("#tabs").hidden = true; app.innerHTML = viewStart(); return; }
    setStartWeekday(parseDate(state.start).getDay() + 6);
    $("#tabs").hidden = false;
    app.innerHTML = { hoy: viewDay, calendario: viewCalendar, progreso: viewProgress, plan: viewPlan, ajustes: viewSettings }[view]();
  }

  /* ---------- Inicio ---------- */
  function viewStart() {
    return `<section class="hero">
      <div class="logo">${ICON.good}</div>
      <h1>Plan de 182 días</h1>
      <p class="muted">Alimentación, pasos y entrenamiento día a día. Marca cada cosa al momento y mira en el calendario cómo lo vas haciendo.</p>
      <label class="field"><span>Fecha del Día 1</span><input type="date" id="startDate" value="${toISO(today0())}"></label>
      <p class="hint">Puedes empezar cualquier día. Las comidas y el entreno siguen el día real: si el Día 1 es martes, empiezas con lo del martes.</p>
      <label class="field"><span>Peso objetivo (opcional, kg)</span><input type="number" inputmode="decimal" id="goalIn" placeholder="Ej. 75"></label>
      <button class="btn primary big" data-act="begin">Iniciar</button>
      <button class="btn ghost" data-act="import">Restaurar una copia de seguridad</button>
      <p class="hint">Tus datos se guardan solo en este dispositivo.</p>
    </section>`;
  }

  /* ---------- Día ---------- */
  function check(key, n, title, body = "", right = "") {
    const on = !!(state.days[n]?.c?.[key]);
    return `<button class="row ${on ? "on" : ""}" data-chk="${key}">
      <span class="box" aria-hidden="true"></span>
      <span class="row-main"><b>${title}</b>${body ? `<span class="row-body">${body}</span>` : ""}</span>
      ${right ? `<span class="row-right">${right}</span>` : ""}
    </button>`;
  }
  // Los pesos se guardan por nombre de ejercicio, así se recuerdan aunque cambie la rutina
  function lastWeight(n, exName) {
    for (let d = n - 1; d >= 1; d--) { const v = state.days[d]?.w?.["n:" + exName]; if (v) return v; }
    return null;
  }
  function viewDay() {
    const t = todayN();
    if (current < 1) current = 1;
    if (current > TOTAL_DAYS) current = TOTAL_DAYS;
    const n = current, p = getDay(n), dd = state.days[n] || { c: {}, w: {} }, date = dateOfDay(n);
    const pct = Math.round(score(n) * 100), st = status(n);
    const label = n === t ? "Hoy" : n === t - 1 ? "Ayer" : n === t + 1 ? "Mañana" : fmtDate(date, true);
    let h = "";
    if (t < 1) h += `<div class="notice">Empiezas el ${fmtDate(parseDate(state.start), true)}. Mientras tanto puedes ver el plan.</div>`;
    if (t > TOTAL_DAYS && n === TOTAL_DAYS) h += `<div class="notice">Has terminado los 182 días. Revisa tu progreso en la pestaña Progreso.</div>`;

    h += `<header class="dayhead">
      <button class="nav" data-act="prev" ${n <= 1 ? "disabled" : ""} aria-label="Día anterior">‹</button>
      <div class="dh-mid">
        <div class="dh-num">Día ${n}<small> / ${TOTAL_DAYS}</small></div>
        <div class="dh-sub">${esc(label)}${n === t || label !== fmtDate(date, true) ? " · " + fmtDate(date) : ""}</div>
        <div class="dh-sub">Semana ${p.week} · ${p.phase.name} · ${fmtN(p.phase.kcal)} kcal</div>
      </div>
      <button class="nav" data-act="next" ${n >= TOTAL_DAYS ? "disabled" : ""} aria-label="Día siguiente">›</button>
    </header>
    <div class="progress"><div class="bar ${st}" style="width:${pct}%"></div></div>
    <div class="prog-row"><span>${pct}% completado</span>${n !== t && t >= 1 && t <= TOTAL_DAYS ? `<button class="link" data-act="today">Ir a hoy</button>` : ""}</div>`;

    for (const no of p.notices) h += `<div class="notice">${esc(no)}</div>`;

    // Alimentación
    h += `<h2>Alimentación <span class="h-right">${fmtN(p.kcal)} kcal · ${p.prot} g prot.</span></h2><div class="card">`;
    ["b", "l", "d"].forEach((k, i) => {
      const m = p.meals[i], lab = ["Desayuno", "Comida", "Cena"][i];
      const items = m.items.map(([f, q]) => `<li>${esc(formatItem(f, q))}</li>`).join("");
      h += check(k, n, `${lab}: ${esc(m.name)}`, `<ul>${items}</ul><span class="prep">${esc(m.prep)}</span>`, `${m.kcal} kcal<small>${m.prot} g prot.</small>`);
    });
    h += `</div>`;

    // Actividad
    h += `<h2>Pasos</h2><div class="card">
      ${check("steps", n, `Objetivo: ${fmtN(p.steps)} pasos`, "Reparte en 2-3 paseos, por ejemplo 15-20 min después de comer y de cenar.")}
      <label class="inline"><span>Pasos hechos</span><input type="number" inputmode="numeric" data-in="stepsDone" value="${esc(dd.stepsDone || "")}" placeholder="0"></label>
    </div>`;

    // Entreno
    if (p.workout) {
      const w = p.workout;
      h += `<h2>Entreno: ${esc(w.session)} <span class="h-right">${esc(w.block)}</span></h2>
      <div class="card"><p class="small muted pad">${esc(w.note)} Descanso: 90-120 s en los principales, 60 s en los accesorios.</p>
      ${check("warm", n, "Calentamiento", "5-10 min + 1-2 series ligeras del primer ejercicio.")}`;
      w.exercises.forEach((e, i) => {
        const last = lastWeight(n, e.name);
        h += `<div class="ex">
          ${check("ex" + i, n, esc(e.name), `${esc(e.sets)}${last ? ` · última vez: ${esc(last)} kg` : ""}`)}
          <input class="kg" type="text" inputmode="decimal" data-w="${i}" value="${esc(dd.w?.["n:" + e.name] || "")}" placeholder="kg" aria-label="Peso usado en ${esc(e.name)}">
        </div>`;
      });
      h += `</div>`;
    } else {
      h += `<h2>Entreno: descanso</h2><div class="card">` + (p.restType === "activo"
        ? check("rest", n, "Descanso activo: 10 min de movilidad", esc(MOBILITY))
        : check("rest", n, "Descanso total", "Solo los pasos. Aprovecha para preparar la comida de la semana.")) + `</div>`;
    }

    // Hábitos
    h += `<h2>Hábitos</h2><div class="card grid2">`;
    for (const [k, lab] of HABITS) h += check("h_" + k, n, esc(lab));
    h += `</div>`;

    // Control
    if (p.weighIn) {
      h += `<h2>Control</h2><div class="card">
        <label class="inline"><span>Peso en ayunas</span><input type="number" step="0.1" inputmode="decimal" data-in="peso" value="${esc(dd.peso || "")}" placeholder="kg"></label>`;
      if (p.measure) h += `<label class="inline"><span>Cintura (ombligo)</span><input type="number" step="0.5" inputmode="decimal" data-in="cintura" value="${esc(dd.cintura || "")}" placeholder="cm"></label>
        ${check("fotos", n, "Fotos de frente, perfil y espalda")}`;
      h += `</div>`;
    }

    h += `<div class="tip"><b>Consejo del día</b>${esc(p.tip)}</div>
      <h2>Notas</h2><textarea data-in="notes" rows="3" placeholder="Cómo me he sentido, cambios que he hecho…">${esc(dd.notes || "")}</textarea>`;
    return h;
  }

  /* ---------- Calendario ---------- */
  function viewCalendar() {
    const t = todayN(), counts = { good: 0, mid: 0, bad: 0 };
    for (let n = 1; n <= Math.min(t, TOTAL_DAYS); n++) { const s = status(n); if (counts[s] !== undefined) counts[s]++; }
    let h = `<h1 class="title">Calendario</h1>
      <div class="legend">
        <span>${ICON.good} Completo <b>${counts.good}</b></span>
        <span>${ICON.mid} Más o menos <b>${counts.mid}</b></span>
        <span>${ICON.bad} Mal <b>${counts.bad}</b></span>
      </div>
      <p class="hint">Completo: todo marcado. Más o menos: 60% o más. Mal: menos del 60%. Toca un día para abrirlo.</p>`;
    const start = parseDate(state.start), end = dateOfDay(TOTAL_DAYS);
    let y = start.getFullYear(), m = start.getMonth();
    while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth())) {
      h += `<section class="month"><h3>${MONTHS[m][0].toUpperCase() + MONTHS[m].slice(1)} ${y}</h3>
        <div class="cal"><span class="wd">L</span><span class="wd">M</span><span class="wd">X</span><span class="wd">J</span><span class="wd">V</span><span class="wd">S</span><span class="wd">D</span>`;
      const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate();
      for (let i = 0; i < lead; i++) h += `<span></span>`;
      for (let d = 1; d <= dim; d++) {
        const n = Math.round((new Date(y, m, d) - start) / DAY_MS) + 1;
        if (n < 1 || n > TOTAL_DAYS) { h += `<span class="cell out"><i>${d}</i></span>`; continue; }
        const s = status(n);
        const inner = ICON[s] || (s === "today" ? `<span class="ring">${Math.round(score(n) * 100)}%</span>` : `<span class="dn">${n}</span>`);
        h += `<button class="cell ${s} ${n === t ? "is-today" : ""}" data-open="${n}" aria-label="Día ${n}, ${d} de ${MONTHS[m]}"><i>${d}</i>${inner}</button>`;
      }
      h += `</div></section>`;
      if (++m > 11) { m = 0; y++; }
    }
    return h;
  }

  /* ---------- Progreso ---------- */
  function viewProgress() {
    const t = Math.min(todayN(), TOTAL_DAYS);
    let sum = 0, past = 0, streak = 0, best = 0, run = 0;
    for (let n = 1; n <= t; n++) {
      const r = score(n); if (n < todayN() || r > 0) { sum += r; past++; }
      if (status(n) === "good") { run++; best = Math.max(best, run); } else if (n !== todayN()) run = 0;
    }
    for (let n = t; n >= 1; n--) { const s = status(n); if (s === "good") streak++; else if (s === "today") continue; else break; }
    const weights = [];
    for (let n = 1; n <= TOTAL_DAYS; n++) { const v = parseFloat(String(state.days[n]?.peso || "").replace(",", ".")); if (!isNaN(v)) weights.push([n, v]); }
    let h = `<h1 class="title">Progreso</h1>
      <div class="stats">
        <div><b>${past ? Math.round(sum / past * 100) : 0}%</b><span>cumplimiento</span></div>
        <div><b>${streak}</b><span>racha actual</span></div>
        <div><b>${best}</b><span>mejor racha</span></div>
        <div><b>${Math.max(0, Math.min(todayN(), TOTAL_DAYS))}</b><span>de ${TOTAL_DAYS} días</span></div>
      </div>`;
    if (weights.length) {
      const first = weights[0][1], last = weights[weights.length - 1][1], dn = last - first;
      h += `<div class="stats two"><div><b>${String(last).replace(".", ",")} kg</b><span>último peso</span></div>
        <div><b>${dn > 0 ? "+" : ""}${dn.toFixed(1).replace(".", ",")} kg</b><span>desde el inicio</span></div></div>`;
      h += chart(weights);
      h += `<h2>Pesajes</h2><div class="card list">`;
      weights.slice().reverse().forEach(([n, v], i, arr) => {
        const prev = arr[i + 1]; const d = prev ? (v - prev[1]).toFixed(1) : null;
        const cin = state.days[n]?.cintura;
        h += `<button class="lrow" data-open="${n}"><span>Semana ${Math.floor((n - 1) / 7) + 1} · ${fmtDate(dateOfDay(n))}</span>
          <span><b>${String(v).replace(".", ",")} kg</b>${d !== null ? ` <small class="${d <= 0 ? "down" : "up"}">${d > 0 ? "+" : ""}${d.replace(".", ",")}</small>` : ""}${cin ? ` · ${esc(cin)} cm` : ""}</span></button>`;
      });
      h += `</div>`;
    } else h += `<p class="hint">Cuando registres tu peso (el primer día de cada semana) aparecerá aquí la gráfica.</p>`;
    h += `<h2>Reglas de ajuste</h2><div class="card pad"><ul class="rules">${RULES.map(r => `<li>${r}</li>`).join("")}</ul></div>`;
    return h;
  }
  function chart(pts) {
    const W = 340, H = 170, P = 30;
    const vals = pts.map(p => p[1]); if (state.goal) vals.push(Number(state.goal));
    let mn = Math.min(...vals) - 1, mx = Math.max(...vals) + 1;
    const x = n => P + (n - 1) / (TOTAL_DAYS - 1) * (W - P - 8), yy = v => 8 + (mx - v) / (mx - mn) * (H - 8 - 22);
    let s = `<div class="card chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de peso">`;
    for (let i = 0; i <= 3; i++) { const v = mn + (mx - mn) * i / 3; s += `<line x1="${P}" x2="${W - 8}" y1="${yy(v)}" y2="${yy(v)}" class="grid"/><text x="${P - 4}" y="${yy(v) + 3}" text-anchor="end">${v.toFixed(0)}</text>`; }
    [1, 56, 112, 182].forEach(n => s += `<text x="${x(n)}" y="${H - 6}" text-anchor="${n === 182 ? "end" : n === 1 ? "start" : "middle"}">D${n}</text>`);
    if (state.goal) s += `<line x1="${P}" x2="${W - 8}" y1="${yy(state.goal)}" y2="${yy(state.goal)}" class="goal"/><text x="${W - 10}" y="${yy(state.goal) - 4}" text-anchor="end" class="goalt">Objetivo ${state.goal}</text>`;
    s += `<polyline points="${pts.map(p => `${x(p[0])},${yy(p[1])}`).join(" ")}" class="line"/>`;
    pts.forEach(p => s += `<circle cx="${x(p[0])}" cy="${yy(p[1])}" r="3" class="dot"/>`);
    return s + `</svg></div>`;
  }

  /* ---------- Plan ---------- */
  let planPhase = null;
  function viewPlan() {
    if (planPhase === null) planPhase = state.start && todayN() >= 1 ? getDay(Math.min(Math.max(todayN(), 1), TOTAL_DAYS)).phaseIndex : 0;
    const ph = PHASES[planPhase];
    let h = `<h1 class="title">El plan</h1>
      <div class="card"><table class="tbl"><tr><th>Fase</th><th>Días</th><th>Kcal</th><th>Pasos</th></tr>
      ${PHASES.map(p => `<tr><td>${p.name}</td><td>${(p.from - 1) * 7 + 1}-${p.to * 7}</td><td>${fmtN(p.kcal)}</td><td>${[...new Set(Array.from({ length: p.to - p.from + 1 }, (_, i) => stepsOf(p.from + i)))].map(fmtN).join(" → ")}</td></tr>`).join("")}
      </table></div>
      <div class="seg">${PHASES.map((p, i) => `<button class="${i === planPhase ? "on" : ""}" data-phase="${i}">${p.name}</button>`).join("")}</div>
      <h2>Menú semanal · ${ph.name}</h2><div class="card list">`;
    MENUS[planPhase].forEach((meals, wd) => {
      h += `<details class="menu"><summary><b>${WEEKDAYS[wd]}</b><span>${fmtN(meals.reduce((s, m) => s + m.kcal, 0))} kcal</span></summary>`;
      meals.forEach((m, i) => h += `<p><b>${["Desayuno", "Comida", "Cena"][i]}:</b> ${esc(m.name)} · ${m.kcal} kcal<br><span class="muted small">${m.items.map(([f, q]) => esc(formatItem(f, q))).join(" · ")}</span></p>`);
      h += `</details>`;
    });
    h += `</div><h2>Lista de la compra (1 semana) <button class="link" data-act="shopreset">Desmarcar</button></h2><div class="card">`;
    shoppingList(planPhase).forEach((it, i) => {
      const k = `${planPhase}-${i}`, on = !!state.shop[k];
      h += `<button class="row ${on ? "on" : ""}" data-shop="${k}"><span class="box"></span><span class="row-main">${esc(it)}</span></button>`;
    });
    h += `</div><p class="hint">Pesos en crudo. Puedes comprar la carne en 2 veces por semana o congelarla en raciones.</p>
      <h2>Rutina semanal</h2><div class="card"><table class="tbl">
      ${SESSIONS.map((s, i) => `<tr><td>${WEEKDAYS[i]}</td><td>${s ? SESSION_NAMES[s] + " (4 ejercicios)" : (REST_ACTIVE.includes(i) ? "Descanso activo (movilidad)" : "Descanso total")}</td></tr>`).join("")}</table></div>
      <h2>Bloques de entrenamiento</h2><div class="card"><table class="tbl"><tr><th>Semanas</th><th>Principales</th><th>Accesorios</th></tr>
      <tr><td>1-4</td><td>${BLOCKS.B1.main}</td><td>${BLOCKS.B1.acc}</td></tr>
      <tr><td>5-7</td><td>${BLOCKS.B2.main}</td><td>${BLOCKS.B2.acc}</td></tr>
      <tr><td>8 · 16 · 24</td><td>${BLOCKS.DL.main}</td><td>${BLOCKS.DL.acc}</td></tr>
      <tr><td>9-15 · 25-26</td><td>${BLOCKS.B3.main}</td><td>${BLOCKS.B3.acc}</td></tr>
      <tr><td>17-23</td><td>${BLOCKS.B4.main}</td><td>${BLOCKS.B4.acc}</td></tr></table>
      <p class="small muted pad">Los ejercicios cambian en las semanas 9 y 25 (variante B) y vuelven en la 17. Cuando completes el rango alto de repeticiones en todas las series, sube 1-2 kg.</p></div>
      <h2>Movilidad (descanso activo)</h2><div class="card pad small">${esc(MOBILITY)}</div>
      <h2>Equivalencias</h2><div class="card pad small">${esc(EQUIVALENCES)}</div>
      <h2>Reglas de ajuste</h2><div class="card pad"><ul class="rules">${RULES.map(r => `<li>${r}</li>`).join("")}</ul></div>
      <p class="hint">Plan orientativo calculado con fórmulas estándar. No sustituye a un médico o dietista-nutricionista.</p>`;
    return h;
  }

  /* ---------- Ajustes ---------- */
  function viewSettings() {
    return `<h1 class="title">Ajustes</h1>
      <div class="card pad">
        <label class="field"><span>Fecha del Día 1</span><input type="date" id="setStart" value="${state.start}"></label>
        <label class="field"><span>Peso objetivo (kg)</span><input type="number" inputmode="decimal" id="setGoal" value="${state.goal ?? ""}" placeholder="Opcional"></label>
        <button class="btn primary" data-act="saveset">Guardar</button>
      </div>
      <h2>Copia de seguridad</h2>
      <div class="card pad">
        <p class="small muted">Los datos se guardan solo en este navegador. Si borras los datos del navegador o cambias de móvil, se pierden: exporta una copia de vez en cuando.</p>
        <button class="btn" data-act="export">Exportar copia (.json)</button>
        <div id="bkBox" hidden>
          <p class="small muted">Si no se ha descargado el archivo, copia este texto y guárdalo en una nota:</p>
          <textarea id="bkText" rows="3" readonly></textarea>
          <button class="btn" data-act="copybk">Copiar texto de la copia</button>
        </div>
        <button class="btn" data-act="import">Importar copia desde archivo</button>
        <label class="field"><span>O pega aquí el texto de una copia</span><textarea id="bkPaste" rows="2"></textarea></label>
        <button class="btn" data-act="pastebk">Restaurar desde el texto</button>
      </div>
      <h2>Zona peligrosa</h2>
      <div class="card pad"><button class="btn danger" data-act="reset">Borrar todos los datos</button></div>`;
  }

  /* ---------- Eventos ---------- */
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-act],[data-chk],[data-open],[data-v],[data-phase],[data-shop]");
    if (!el) return;
    if (el.dataset.v) return go(el.dataset.v, el.dataset.v === "hoy" ? clampToday() : null);
    if (el.dataset.open) return go("hoy", +el.dataset.open);
    if (el.dataset.phase) { planPhase = +el.dataset.phase; return render(); }
    if (el.dataset.shop) { const k = el.dataset.shop; state.shop[k] = !state.shop[k]; save(); el.classList.toggle("on"); return; }
    if (el.dataset.chk) {
      const c = dayData(current).c, k = el.dataset.chk; c[k] = !c[k]; save();
      el.classList.toggle("on", c[k]); refreshProgress(); return;
    }
    const a = el.dataset.act;
    if (a === "begin") {
      const s = $("#startDate").value; if (!s) return toast("Elige una fecha");
      state.start = s; const g = parseFloat($("#goalIn").value); state.goal = isNaN(g) ? null : g;
      save(); requestPersist(); go("hoy", clampToday());
    } else if (a === "prev") go("hoy", current - 1);
    else if (a === "next") go("hoy", current + 1);
    else if (a === "today") go("hoy", clampToday());
    else if (a === "saveset") {
      const s = $("#setStart").value; if (s) state.start = s;
      const g = parseFloat($("#setGoal").value); state.goal = isNaN(g) ? null : g; save(); toast("Guardado");
    } else if (a === "export") exportData();
    else if (a === "import") importData();
    else if (a === "shopreset") { for (const k of Object.keys(state.shop)) if (k.startsWith(planPhase + "-")) delete state.shop[k]; save(); render(); }
    else if (a === "reset") {
      if (!el.dataset.armed) {
        el.dataset.armed = "1"; el.textContent = "Pulsa otra vez para borrarlo todo (no se puede deshacer)";
        setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = "Borrar todos los datos"; } }, 5000);
        return;
      }
      state = { version: 1, start: null, goal: null, days: {}, shop: {} };
      try { localStorage.removeItem(KEY); } catch (e) {}
      go("hoy");
    }
    else if (a === "copybk") {
      const ta = $("#bkText"); const txt = ta.value;
      Promise.resolve().then(() => navigator.clipboard.writeText(txt)).then(() => toast("Copia copiada"))
        .catch(() => { ta.focus(); ta.select(); toast("Selecciona el texto y cópialo"); });
    }
    else if (a === "pastebk") {
      try { restore(JSON.parse($("#bkPaste").value)); } catch (e) { toast("El texto no es una copia válida"); }
    }
  });
  document.addEventListener("input", e => {
    const el = e.target;
    if (el.dataset.in) {
      const d = dayData(current); d[el.dataset.in] = el.value;
      if (el.dataset.in === "stepsDone") {
        const target = getDay(current).steps, v = parseInt(el.value, 10);
        if (!isNaN(v)) { d.c.steps = v >= target; $('[data-chk="steps"]')?.classList.toggle("on", d.c.steps); refreshProgress(); }
      }
      save();
    } else if (el.dataset.w) {
      const ex = getDay(current).workout?.exercises[+el.dataset.w];
      if (ex) { dayData(current).w["n:" + ex.name] = el.value; save(); }
    }
  });
  function refreshProgress() {
    const pct = Math.round(score(current) * 100), bar = $(".progress .bar");
    if (bar) { bar.style.width = pct + "%"; bar.className = "bar " + status(current); }
    const lbl = $(".prog-row span"); if (lbl) lbl.textContent = pct + "% completado";
  }
  function clampToday() { return Math.min(Math.max(todayN(), 1), TOTAL_DAYS); }

  function exportData() {
    const json = JSON.stringify(state);
    try {
      const blob = new Blob([json], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `plan182-copia-${toISO(new Date())}.json`; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    } catch (e) {}
    // Por si la descarga está bloqueada: la copia también se muestra como texto
    const box = $("#bkBox"); if (box) { box.hidden = false; $("#bkText").value = json; }
  }
  function restore(s) {
    if (!s || typeof s !== "object" || !s.days) throw 0;
    s.shop ||= {}; state = s; save(); toast("Copia restaurada"); go("hoy", state.start ? clampToday() : 1);
  }
  function importData() {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json,.json";
    inp.onchange = async () => {
      try {
        restore(JSON.parse(await inp.files[0].text()));
      } catch (e) { toast("El archivo no es una copia válida"); }
    };
    inp.click();
  }
  function requestPersist() { try { navigator.storage?.persist?.(); } catch (e) {} }
  let toastT;
  function toast(msg) {
    let t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200);
  }

  // Al volver a la app otro día, abrir el día actual
  let lastSeen = toISO(today0());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && toISO(today0()) !== lastSeen) {
      lastSeen = toISO(today0()); if (state.start && view === "hoy") go("hoy", clampToday());
    }
  });

  if (state.start) current = clampToday();
  render();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
