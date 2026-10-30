/* Datos del plan de 182 días. Sin datos personales: todo lo personal
   (fecha de inicio, pesos, checks) se guarda solo en el dispositivo. */

const FOODS = {
  // nombre, unidad ("g" = valores por 100 g en crudo, "u" = por unidad), kcal, proteína
  huevo:    ["huevos L", "u", 85, 7.5],
  claras:   ["g de claras de huevo", "g", 50, 11],
  pan:      ["g de pan integral", "g", 250, 10],
  avena:    ["g de copos de avena", "g", 375, 13],
  proteina: ["g de proteína en polvo (≈1 cacito)", "g", 400, 80],
  leche:    ["ml de leche semidesnatada", "g", 46, 3.2],
  cafe:     ["café con leche (250 ml de leche semidesnatada, sin azúcar)", "u", 115, 8],
  fruta:    ["pieza de fruta (manzana o naranja)", "u", 80, 0.5],
  tomate:   ["g de tomate", "g", 18, 0.9],
  picada5:  ["g de carne picada de ternera 5% grasa", "g", 137, 21],
  pollo:    ["g de pechuga de pollo", "g", 115, 23],
  ternera:  ["g de filete de ternera magro", "g", 125, 22],
  pasta:    ["g de pasta (en crudo)", "g", 355, 12],
  patata:   ["g de patata (en crudo)", "g", 77, 2],
  verdura:  ["g de verdura (brócoli, judías, calabacín…)", "g", 30, 2.5],
  ensalada: ["g de ensalada (lechuga, tomate, pepino)", "g", 18, 1],
  aceite:   ["g de aceite de oliva", "g", 900, 0],
  triturado:["g de tomate triturado", "g", 30, 1.5],
};

// [nombre, preparación, ingredientes fijos, [ingrediente que se ajusta, paso, mínimo]]
// Los desayunos sin ingrediente que se ajusta (null) tienen kcal fijas; la diferencia
// con el objetivo del desayuno se reparte entre la comida y la cena.
const BREAKFASTS = {
  B1: ["Huevos revueltos y café con leche", "Revuelve los huevos y las claras en sartén antiadherente sin aceite. Si usas leche entera en el café, son 45 kcal más.",
       [["huevo",3],["claras",150],["fruta",1],["cafe",1]], null],
  B2: ["Tortilla francesa con tomate y café con leche", "Tortilla de huevos y claras en sartén antiadherente; tomate en rodajas con sal y orégano.",
       [["huevo",3],["claras",100],["tomate",100],["cafe",1]], null],
  B3: ["Avena con leche y proteína, y café con leche", "Mezcla la proteína con la leche, añade la avena y déjala toda la noche en la nevera (o caliéntala 1-2 min). Si queda espesa, un chorrito más de leche.",
       [["proteina",30],["leche",200],["cafe",1]], ["avena",5,40]],
  B4: ["Huevos a la plancha con tomate y café con leche", "Huevos a la plancha con ½ cucharada de aceite; tomate en rodajas con sal y orégano.",
       [["huevo",4],["aceite",5],["tomate",100],["cafe",1]], null],
};
// Solo pollo y ternera (picada 5% o filete); carbohidratos: pasta, patata y pan.
const LUNCHES = [
  ["Pasta boloñesa casera", "Carne picada dorada con el tomate triturado y especias, sobre la pasta.",
   [["picada5",250],["triturado",150],["aceite",5]], ["pasta",5,50]],
  ["Pechuga de pollo con patata y ensalada", "Pollo a la plancha o en cubos marinados; patata cocida, al horno o en air fryer.",
   [["pollo",250],["ensalada",200],["aceite",10]], ["patata",10,250]],
  ["Filete de ternera con patata y verdura", "Ternera a la plancha; patata al horno y verdura al vapor o salteada.",
   [["ternera",250],["verdura",200],["aceite",10]], ["patata",10,250]],
  ["Pollo con pasta y verdura", "Pollo en tiras salteado con la verdura y especias, mezclado con la pasta.",
   [["pollo",250],["verdura",200],["aceite",10]], ["pasta",5,50]],
  ["Carne picada con patata y verdura", "Carne picada a la plancha, sin salsas. Sal, pimienta y especias libres.",
   [["picada5",250],["verdura",200],["aceite",10]], ["patata",10,250]],
  ["Hamburguesas caseras con patatas al horno", "2 hamburguesas de carne picada sola (sin pan), patatas al horno o air fryer.",
   [["picada5",230],["ensalada",150],["aceite",5]], ["patata",10,250]],
  ["Ternera con pasta y tomate", "Ternera en tiras salteada con el tomate triturado y orégano, sobre la pasta.",
   [["ternera",250],["triturado",150],["aceite",10]], ["pasta",5,50]],
];
const DINNERS = [
  ["Pollo con patata y verdura", "Pollo a la plancha; patata y verdura al vapor o al horno.",
   [["pollo",220],["verdura",200],["aceite",5]], ["patata",10,200]],
  ["Carne picada con huevos y pan", "Carne picada a la plancha con 2 huevos a la plancha encima; verdura al lado.",
   [["picada5",200],["huevo",2],["verdura",150]], ["pan",5,30]],
  ["Tortilla de patata", "Patata en air fryer, microondas o cocida (no frita) y cuajada con los huevos y claras.",
   [["huevo",3],["claras",150],["aceite",10]], ["patata",10,200]],
  ["Ternera con patata y ensalada", "Ternera a la plancha; patata cocida o al horno.",
   [["ternera",220],["ensalada",200],["aceite",10]], ["patata",10,200]],
  ["Bocadillo de pollo con ensalada", "Pollo a la plancha en el pan con lechuga y tomate; resto de ensalada al lado.",
   [["pollo",200],["ensalada",150],["aceite",5]], ["pan",5,30]],
  ["Ensalada de pollo y huevo con pan", "Pollo a la plancha en tiras, huevos cocidos y ensalada aliñada; pan al lado.",
   [["pollo",150],["huevo",2],["ensalada",200],["aceite",10]], ["pan",5,30]],
  ["Carne picada con patata", "Carne picada a la plancha con especias; patata al horno y verdura.",
   [["picada5",200],["verdura",200],["aceite",5]], ["patata",10,200]],
];
const WEEK_BREAKFAST = ["B1","B3","B2","B1","B3","B4","B2"];

const PHASES = [
  { name: "Fase 1", from: 1, to: 8, kcal: 2250 },
  { name: "Fase 2", from: 9, to: 16, kcal: 2100 },
  { name: "Fase 3", from: 17, to: 26, kcal: 1950 },
];
const SPLIT = [0.27, 0.38, 0.35];

// Día de la semana real (0 = lunes … 6 = domingo) -> sesión (clave de EXERCISES) o descanso
const SESSIONS = ["PH1", "BT1", null, "PH2", "BT2", null, null];
const SESSION_NAMES = { PH1: "Pecho + Hombro", PH2: "Pecho + Hombro", BT1: "Bíceps + Tríceps", BT2: "Bíceps + Tríceps" };
const REST_ACTIVE = [2, 5]; // miércoles y sábado: descanso activo; domingo: descanso total
// 4 ejercicios por sesión. role: M = principal, A = accesorio, A4 = accesorio con una serie extra, "F:texto" = fijo
// [variante A (semanas 1-8 y 17-24), variante B (semanas 9-16 y 25-26)]
const EXERCISES = {
  PH1: [
    [["Press de banca con mancuernas","M"],["Press inclinado con mancuernas","M"],["Press militar sentado","M"],["Elevaciones laterales","A"]],
    [["Press inclinado con mancuernas","M"],["Press plano agarre neutro","M"],["Press militar sentado agarre neutro","M"],["Elevaciones laterales","A4"]]],
  PH2: [
    [["Press inclinado con mancuernas","M"],["Aperturas en banco plano","A"],["Press Arnold","M"],["Pájaros (deltoides posterior)","A"]],
    [["Press de banca con mancuernas","M"],["Aperturas en banco inclinado","A"],["Elevaciones laterales","A"],["Pájaros (deltoides posterior)","A"]]],
  BT1: [
    [["Curl de bíceps alterno","M"],["Press francés con mancuernas","M"],["Curl martillo","A"],["Extensión de tríceps sobre la cabeza","A"]],
    [["Curl Zottman","M"],["Press francés con mancuernas","M"],["Curl martillo cruzado","A"],["Fondos en el banco","F:3 series al fallo técnico"]]],
  BT2: [
    [["Curl en banco inclinado","M"],["Press cerrado con mancuernas","M"],["Curl concentrado","A"],["Patada de tríceps","A"]],
    [["Curl en banco inclinado","M"],["Extensión de tríceps sobre la cabeza","M"],["Curl concentrado","A"],["Flexiones diamante","F:3 series al fallo técnico"]]],
};
const BLOCKS = {
  B1: { label: "Bloque 1", main: "3 × 10-12", acc: "3 × 12-15", note: "Deja 3 repeticiones en reserva. Aprende la técnica." },
  B2: { label: "Bloque 2", main: "4 × 8-10", acc: "3 × 10-12", note: "Deja 2 repeticiones en reserva." },
  B3: { label: "Bloque 3", main: "4 × 8-12", acc: "3 × 12-15", note: "Deja 1-2 repeticiones en reserva; última serie de accesorios al fallo técnico." },
  B4: { label: "Bloque 4", main: "4 × 6-8", acc: "3 × 10-15", note: "Deja 1 repetición en reserva. Busca subir peso en los principales." },
  DL: { label: "Descarga", main: "2 × 10", acc: "2 × 12", note: "Semana de descarga: usa un 20% menos de peso. Recupera articulaciones." },
};

const TIPS = [
  "Pesa la comida en crudo con una báscula de cocina. Es la diferencia entre adivinar y saber.",
  "Cocina la proteína de 2-3 días de una vez: carne picada, pollo y huevos cocidos.",
  "El peso diario sube y baja por agua y sal. Mira la media semanal, no un día suelto.",
  "Bebe un vaso de agua grande antes de cada comida.",
  "Haz parte de los pasos después de comer y cenar: 15-20 min de paseo ayudan a la digestión y suman.",
  "Especias sin límite: pimentón, ajo en polvo, comino, orégano, pimienta. Salsas, solo las de 0-20 kcal.",
  "Si un ejercicio te molesta en la articulación, cámbialo por uno similar del plan que no moleste.",
  "Progresión: cuando completes el rango alto de reps en todas las series, sube 1-2 kg en la siguiente sesión.",
  "Duerme 7-8 h. Dormir poco aumenta el hambre y empeora la recuperación.",
  "El alcohol aporta 7 kcal por gramo y frena la quema de grasa. Mejor evitarlo en estos 6 meses.",
  "Bebidas: agua, café, té, gaseosas zero. Nada de zumos ni refrescos con azúcar.",
  "Si tienes hambre, añade verdura o ensalada: casi no suma kcal y llena mucho.",
  "Si un día te sales del plan, no compenses al día siguiente. Simplemente vuelve al plan.",
  "Puedes cambiar una comida por otra de la misma fase: las kcal son equivalentes.",
  "Saca fotos de frente, perfil y espalda cada 4 semanas, con la misma luz. La báscula a veces engaña, las fotos no.",
  "Calienta 5-10 min antes de entrenar y haz 1-2 series ligeras del primer ejercicio.",
  "Apunta el peso que usas en cada ejercicio. Si no lo apuntas, no sabrás si progresas.",
  "El contador de pasos del móvil es suficiente; llévalo encima o usa un reloj.",
  "Las semanas de descarga no son perder el tiempo: permiten que sigas progresando después.",
  "Ten siempre huevos cocidos en la nevera: son tu comida de emergencia.",
  "Usa sartén antiadherente o air fryer: ahorras aceite sin perder sabor.",
  "Si llueve, haz los pasos en casa, en un centro comercial o en una cinta. El objetivo sigue igual.",
  "Mastica despacio. El cerebro tarda unos 20 min en notar la saciedad.",
  "La creatina monohidrato (3-5 g/día) es un suplemento seguro y útil para la fuerza. Es opcional.",
  "Prepara la comida del día siguiente antes de dormir: elimina la tentación de improvisar.",
  "Mantén la técnica: recorrido completo y bajada controlada (2-3 segundos) en cada repetición.",
];

const HABITS = [
  ["agua", "Agua: 3 litros"],
  ["sueno", "Sueño: 7-8 horas"],
  ["verdura", "Verdura en comida y cena"],
  ["alcohol", "Sin alcohol ni bebidas azucaradas"],
];

const MOBILITY = "Círculos de hombro y brazo (1 min) · rotaciones de cadera (1 min) · estiramiento de pectoral en marco de puerta (2 × 30 s) · gato-camello (10 reps) · estiramiento de cadera en zancada (2 × 30 s por lado) · estiramiento de isquios (2 × 30 s) · respiración profunda (1 min).";

const RULES = [
  "Compara la <b>media de peso</b> de esta semana con la anterior. Pésate en ayunas, tras ir al baño.",
  "Si bajas <b>menos de 0,4 kg</b> de media durante 2 semanas seguidas: suma 2.000 pasos diarios o quita 10 g de pasta (o 40 g de patata o 15 g de pan) en comida y cena.",
  "Si bajas <b>más de 1,2 kg</b> por semana a partir de la semana 3, o la fuerza cae mucho: añade 1 pieza de fruta o 20 g de pasta al día.",
  "Si el Día 1 pesas <b>más de 100 kg</b>: añade 1 huevo al desayuno durante la Fase 1 (+85 kcal).",
  "Hambre fuerte: primero más verdura y agua; si persiste, revisa el sueño.",
];
const EQUIVALENCES = "100 g de pasta en crudo ≈ 460 g de patata cruda ≈ 140 g de pan. 1 café con leche (250 ml de leche semidesnatada) ≈ 45 g de pan ≈ 30 g de avena. Pollo y filete de ternera magro son intercambiables gramo a gramo; la carne picada 5% tiene algo más de grasa (≈ 20% más kcal).";

/* ---------------- Cálculos ---------------- */
function foodKcal(food, q) {
  const [, unit, k, p] = FOODS[food];
  const m = unit === "u" ? q : q / 100;
  return [k * m, p * m];
}
function formatItem(food, q) {
  const [name, unit] = FOODS[food];
  if (food === "huevo") return q > 1 ? `${q} ${name}` : "1 huevo L";
  if (unit === "u") return q === 1 ? `1 ${name}` : `${q} ${name}s`;
  if (food === "aceite") return `${q} g de aceite de oliva (${q >= 10 ? "1 cucharada" : "½ cucharada"})`;
  return `${q} ${name}`;
}
function pyRound(x) { // redondeo igual que el del PDF (al par en .5)
  const f = Math.floor(x), d = x - f;
  if (d === 0.5) return f % 2 === 0 ? f : f + 1;
  return Math.round(x);
}
function fsum(xs) { // suma compensada (igual que sum() de Python 3.12+)
  let s = 0, c = 0;
  for (const x of xs) { const t = s + x; c += Math.abs(s) >= Math.abs(x) ? (s - t) + x : (x - t) + s; s = t; }
  return s + c;
}
function buildMeal(def, target) {
  const [name, prep, fixed, scal] = def;
  const items = [...fixed];
  if (scal) {
    const [sc, step, min] = scal;
    const base = fsum(fixed.map(([f, q]) => foodKcal(f, q)[0]));
    const per = foodKcal(sc, 100)[0] / 100;
    items.push([sc, Math.max(min, pyRound((target - base) / per / step) * step)]);
  }
  const k = fsum(items.map(([f, q]) => foodKcal(f, q)[0]));
  const p = fsum(items.map(([f, q]) => foodKcal(f, q)[1]));
  return { name, prep, items, kcal: pyRound(k), prot: pyRound(p) };
}

const TOTAL_DAYS = 182;
function phaseIndex(week) { return PHASES.findIndex(p => week >= p.from && week <= p.to); }
function stepsOf(week) { return week <= 4 ? 10000 : week <= 8 ? 11000 : week <= 16 ? 12000 : 13000; }
function blockOf(week) {
  if ([8, 16, 24].includes(week)) return "DL";
  if (week <= 4) return "B1";
  if (week <= 7) return "B2";
  if (week <= 15) return "B3";
  if (week <= 23) return "B4";
  return "B3";
}

const MENUS = PHASES.map(ph => Array.from({ length: 7 }, (_, wd) => {
  const b = buildMeal(BREAKFASTS[WEEK_BREAKFAST[wd]], ph.kcal * SPLIT[0]);
  const rest = ph.kcal - b.kcal, ld = SPLIT[1] + SPLIT[2];
  return [b, buildMeal(LUNCHES[wd], rest * SPLIT[1] / ld), buildMeal(DINNERS[wd], rest * SPLIT[2] / ld)];
}));

function workoutFor(week, wd) {
  const s = SESSIONS[wd];
  if (!s) return null;
  const variant = week <= 8 ? 0 : week <= 16 ? 1 : week <= 24 ? 0 : 1;
  const bk = blockOf(week), b = BLOCKS[bk];
  const exercises = EXERCISES[s][variant].map(([name, role]) => {
    let sr;
    if (role === "M") sr = b.main;
    else if (role === "A") sr = b.acc;
    else if (role === "A4") sr = b.acc.replace("3 ×", "4 ×").replace("2 ×", "3 ×");
    else sr = bk === "DL" ? "2 series suaves" : role.slice(2);
    return { name, sets: sr };
  });
  return { session: SESSION_NAMES[s], block: b.label, note: b.note, exercises };
}

// Las comidas y el entreno siguen el día real de la semana: si el Día 1 es martes, toca lo del martes.
// Las fases, los pasos y los bloques avanzan cada 7 días contados desde el Día 1.
let START_WD = 0; // día de la semana del Día 1 (0 = lunes)
function setStartWeekday(wd) { START_WD = ((wd % 7) + 7) % 7; }
const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function noticesFor(day, week, first) {
  const n = [], ph = PHASES[phaseIndex(week)], steps = stepsOf(week);
  const fmtN = x => x.toLocaleString("es-ES");
  if (day === 1) n.push("Primer día: pésate en ayunas, mide tu cintura (a la altura del ombligo) y saca fotos. Es tu punto de partida.");
  if (first && (week === 9 || week === 17)) n.push(`Empieza la ${ph.name}: bajan las kcal a ${fmtN(ph.kcal)} y suben los pasos a ${fmtN(steps)}.`);
  if (first && week === 5) n.push("Suben los pasos a 11.000 y empieza el bloque 2 de entrenamiento (más series, más intensidad).");
  if (first && blockOf(week) === "DL") n.push("Semana de descarga: menos series y un 20% menos de peso. La dieta y los pasos siguen igual.");
  if (first && (week === 9 || week === 25)) n.push("Cambian los ejercicios (variante B). Apunta los pesos de nuevo desde cero.");
  if (first && week === 17) n.push("Vuelven los ejercicios de la variante A: compara tus pesos con los de las semanas 1-7.");
  if (day === TOTAL_DAYS) n.push("Último día. Pésate, mide y saca fotos para comparar con el Día 1. Luego decide: seguir la Fase 3 unas semanas o pasar a mantenimiento (+300-400 kcal).");
  return n;
}

function getDay(day) {
  const week = Math.floor((day - 1) / 7) + 1, wd = (START_WD + day - 1) % 7, first = (day - 1) % 7 === 0;
  const pi = phaseIndex(week), ph = PHASES[pi];
  const meals = MENUS[pi][wd];
  return {
    day, week, wd, phase: ph, phaseIndex: pi,
    meals, kcal: meals.reduce((s, m) => s + m.kcal, 0), prot: meals.reduce((s, m) => s + m.prot, 0),
    steps: stepsOf(week),
    workout: workoutFor(week, wd),
    restType: SESSIONS[wd] ? null : (REST_ACTIVE.includes(wd) ? "activo" : "total"),
    notices: noticesFor(day, week, first),
    tip: TIPS[(day - 1) % TIPS.length],
    weighIn: wd === 0 || day === 1 || day === TOTAL_DAYS, // cada lunes, más el primer y el último día
    measure: (day - 1) % 28 === 0 || day === TOTAL_DAYS,  // cada 4 semanas desde el Día 1
  };
}

function shoppingList(pi) {
  const tot = {};
  for (const meals of MENUS[pi]) for (const m of meals) for (const [f, q] of m.items) tot[f] = (tot[f] || 0) + q;
  return Object.entries(tot).map(([f, q]) => {
    const [name, unit] = FOODS[f];
    if (f === "huevo") return `Huevos L: ${q} unidades (≈ ${Math.ceil(q / 12)} docenas)`;
    if (f === "cafe") return `Café y leche semidesnatada para ${q} cafés con leche (≈ ${(q * 0.25).toFixed(2).replace(".", ",").replace(/0$/, "")} l de leche)`;
    if (unit === "u") return `${name[0].toUpperCase() + name.slice(1)}: ${q}`;
    if (f === "aceite") return `Aceite de oliva: ≈ ${q} g`;
    if (f === "leche") return `Leche semidesnatada: ${(q / 1000).toFixed(1).replace(".", ",")} l (más la de los cafés)`;
    let label = name.replace("g de ", "").split(" (")[0];
    label = label[0].toUpperCase() + label.slice(1);
    const val = q >= 1000 ? `${(q / 1000).toFixed(1).replace(".", ",")} kg` : `${Math.ceil(q / 50) * 50} g`;
    return `${label}: ${val}`;
  });
}
