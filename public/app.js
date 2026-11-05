"use strict";
import { request, setScenario } from './demo.js';
import { level, arrival, position, upperMedian } from './rules.js';

// Vía libre: mapa en vivo y llegadas con retraso

const demoMode = new URLSearchParams(location.search).get("mode") === "demo";
const NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const svg = $("svg");
const capa = { base: $("capaBase"), red: $("capaRed"), inc: $("capaInc"), trenes: $("capaTrenes"), etiq: $("capaEtiq") };
const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const guardado = { leer(k, d) { try { const v = localStorage.getItem("vialibre-spectra." + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, poner(k, v) { try { localStorage.setItem("vialibre-spectra." + k, JSON.stringify(v)); } catch {} } };

// ---------- Tipos de tren (código de producto de Renfe) ----------
const TIPOS = [
  { id: "ave", nom: "AVE", prod: [2, 25] },
  { id: "avlo", nom: "Avlo", prod: [28] },
  { id: "avant", nom: "Avant", prod: [3] },
  { id: "alvia", nom: "Alvia", prod: [11] },
  { id: "ld", nom: "Euromed e Intercity", prod: [10, 13, 4, 5, 7, 8, 9, 24] },
  { id: "md", nom: "Media distancia y regionales", prod: [14, 15, 16, 18, 19, 20] },
  { id: "other", nom: "Sin clasificar", prod: [0] },
  { id: "iryo", nom: "Iryo", sinDatos: true },
  { id: "ouigo", nom: "Ouigo", sinDatos: true },
];
const NOM_PROD = { 2: "AVE", 25: "AVE", 28: "Avlo", 3: "Avant", 11: "Alvia", 10: "Euromed", 13: "Intercity", 4: "Talgo", 5: "Altaria", 7: "Diurno", 8: "Estrella", 9: "Tren Hotel", 24: "AV City", 14: "Andalucía Exprés", 15: "Catalunya Exprés", 16: "Media distancia", 18: "Regional", 19: "Regional Exprés", 20: "TRD" };
const tipoDe = (p) => TIPOS.find((t) => t.prod && t.prod.includes(p));
const savedTypes = guardado.leer("tipos", null);
const validTypes = TIPOS.filter(t => t.prod).map(t => t.id);
const activos = new Set(Array.isArray(savedTypes) ? savedTypes.filter(id => validTypes.includes(id)) : validTypes);

// ---------- Zonas para el filtro de llegadas (provincia de destino) ----------
const ZONAS = [
  { id: "todo", nom: "Toda España" },
  { id: "mad", nom: "Madrid", prov: ["MADRID"] },
  { id: "cat", nom: "Cataluña", prov: ["BARCELONA", "GIRONA", "GERONA", "LLEIDA", "LERIDA", "TARRAGONA"] },
  { id: "val", nom: "C. Valenciana", prov: ["VALENCIA", "ALICANTE", "CASTELLON"] },
  { id: "and", nom: "Andalucía", prov: ["SEVILLA", "MALAGA", "CORDOBA", "GRANADA", "CADIZ", "HUELVA", "JAEN", "ALMERIA"] },
  { id: "gal", nom: "Galicia", prov: ["CORUNA", "A CORUNA", "LUGO", "OURENSE", "ORENSE", "PONTEVEDRA"] },
  { id: "nor", nom: "Norte", prov: ["ASTURIAS", "CANTABRIA", "VIZCAYA", "BIZKAIA", "GUIPUZCOA", "GIPUZKOA", "ALAVA", "ARABA", "NAVARRA", "LEON", "BURGOS", "PALENCIA", "LA RIOJA", "RIOJA"] },
];
let zona = guardado.leer("zona", "todo");
if (!ZONAS.some(z => z.id === zona)) zona = "todo";
const normal = (s) => String(s || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
const enZona = (codEst) => { const z = ZONAS.find((z) => z.id === zona); if (!z || !z.prov) return true; const p = normal(D.est[codEst]?.prov); return z.prov.some((x) => p === x || p.endsWith(" " + x) || p.startsWith(x + " ")); };

// ---------- Utilidades ----------
const nivel = level;
const COL = { ok: "#4CC38A", leve: "#F0B429", grave: "#F4603F", info: "#7FA7D6" };
const addMin = arrival;
const durTxt = (m) => (m == null ? "Sin dato de retraso" : m <= 0 ? (m < 0 ? `${-m} min adelantado` : "En hora") : m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
const CORTOS = { "60000": "Madrid Atocha", "17000": "Madrid Chamartín", "18000": "Madrid Atocha", "10000": "Madrid Príncipe Pío", "71801": "Barcelona Sants", "79400": "Barcelona França", "03216": "València J. Sorolla", "65000": "València Nord", "51003": "Sevilla", "60911": "Alicante", "04040": "Zaragoza", "08223": "Vigo", "31412": "A Coruña", "15100": "León", "15211": "Oviedo", "11511": "San Sebastián", "04307": "Figueres", "87089": "Marsella", "87303": "Lyon", "03309": "Villena AV", "08240": "Medina AV", "60600": "Albacete", "03208": "Cuenca", "04007": "Guadalajara", "08004": "Segovia", "04104": "Camp de Tarragona", "50500": "Córdoba", "54413": "Málaga" };
const corto = (c) => c == null ? "Sin datos" : CORTOS[c] || (D.est[c]?.n || "estación " + c).split("/")[0].replace(/ - /g, " ").replace(/^(.{24}).+$/, "$1…");
const tramo = t => !t.sig ? "Sin parada indicada" : !t.ant ? "Parada indicada: " + corto(t.sig) : t.ant === t.sig ? "En " + corto(t.ant) : "Entre " + corto(t.ant) + " y " + corto(t.sig);
const horaLocal = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" }); };

// ---------- Vista y zoom ----------
const esMovil = () => innerWidth <= 760;
const VB0 = () => (esMovil() ? { x: 40, y: 10, w: 930, h: 840 } : { x: -90, y: -50, w: 1120, h: 920 });
let vb = VB0();
const zoomK = () => VB0().w / vb.w;
function upx() { const r = svg.getBoundingClientRect(); return Math.max(vb.w / r.width, vb.h / r.height) || 1; }
function aplicarVista() {
  const v = VB0(), minW = v.w / 64, maxW = v.w * 1.05;
  const k = Math.min(maxW, Math.max(minW, vb.w)) / vb.w;
  if (k !== 1) { const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2; vb.w *= k; vb.h *= k; vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2; }
  const cx = Math.min(1150, Math.max(-150, vb.x + vb.w / 2)), cy = Math.min(1010, Math.max(-150, vb.y + vb.h / 2));
  vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2;
  svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  pedirDibujo();
}
// Punto del mapa bajo unas coordenadas de pantalla
function aMapa(cx, cy) {
  const r = svg.getBoundingClientRect(), u = upx();
  const ox = (r.width - vb.w / u) / 2, oy = (r.height - vb.h / u) / 2;
  return { x: vb.x + (cx - r.left - ox) * u, y: vb.y + (cy - r.top - oy) * u };
}
function zoomEn(factor, cx, cy) {
  const r = svg.getBoundingClientRect();
  if (cx == null) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
  const p = aMapa(cx, cy), v = VB0();
  const nw = Math.min(v.w * 1.05, Math.max(v.w / 64, vb.w / factor)), f = nw / vb.w;
  vb = { x: p.x - (p.x - vb.x) * f, y: p.y - (p.y - vb.y) * f, w: vb.w * f, h: vb.h * f };
  aplicarVista();
}
let animVista = null;
function irA(dest, ms = 450) {
  const ini = { ...vb }, t0 = performance.now();
  animVistaFin = t0 + ms;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) ms = 0;
  cancelAnimationFrame(animVista);
  const paso = (t) => {
    const a = ms ? Math.min(1, (t - t0) / ms) : 1, e = a < .5 ? 2 * a * a : 1 - Math.pow(-2 * a + 2, 2) / 2;
    vb = { x: ini.x + (dest.x - ini.x) * e, y: ini.y + (dest.y - ini.y) * e, w: ini.w + (dest.w - ini.w) * e, h: ini.h + (dest.h - ini.h) * e };
    aplicarVista();
    if (a < 1) animVista = requestAnimationFrame(paso);
  };
  animVista = requestAnimationFrame(paso);
}
function centrarEn(x, y, k) { const v = VB0(), w = v.w / k, h = v.h / k; irA({ x: x - w / 2, y: y - h / 2, w, h }); }

$("zMas").onclick = () => zoomEn(1.6);
$("zMenos").onclick = () => zoomEn(1 / 1.6);
$("zTodo").onclick = () => { siguiendo = null; irA(VB0()); };
svg.addEventListener("wheel", (e) => {
  e.preventDefault();
  const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  zoomEn(Math.exp(-d * (e.ctrlKey ? 0.01 : 0.0022)), e.clientX, e.clientY);
}, { passive: false });
svg.addEventListener("dblclick", (e) => { e.preventDefault(); zoomEn(2, e.clientX, e.clientY); });
addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea")) return;
  if (e.key === "+" || e.key === "=") zoomEn(1.5);
  else if (e.key === "-" || e.key === "_") zoomEn(1 / 1.5);
  else if (e.key === "0") irA(VB0());
  else if (e.key === "Escape") seleccionar(null);
});

// Arrastre y pellizco
const punteros = new Map();
let gesto = null, movido = false;
svg.addEventListener("pointerdown", (e) => {
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  movido = false;
  iniciarGesto();
});
function iniciarGesto() {
  const ps = [...punteros.values()];
  if (!ps.length) { gesto = null; return; }
  const c = { x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length };
  const dist = ps.length > 1 ? Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) : 0;
  gesto = { c, dist, vb: { ...vb }, u: upx(), n: ps.length };
}
svg.addEventListener("pointermove", (e) => {
  if (!punteros.has(e.pointerId) || !gesto) return;
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const ps = [...punteros.values()];
  if (ps.length !== gesto.n) return iniciarGesto();
  const c = { x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length };
  if (!movido && Math.hypot(c.x - gesto.c.x, c.y - gesto.c.y) > 4) { movido = true; siguiendo = null; try { svg.setPointerCapture(e.pointerId); } catch {} }
  svg.classList.toggle("arrastrando", movido);
  let { x, y, w, h } = gesto.vb;
  if (ps.length > 1 && gesto.dist > 0) {
    const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
    const v = VB0(), f = Math.min(v.w * 1.05, Math.max(v.w / 64, w * gesto.dist / d)) / w;
    const r = svg.getBoundingClientRect(), u = gesto.u, ox = (r.width - w / u) / 2, oy = (r.height - h / u) / 2;
    const px = x + (gesto.c.x - r.left - ox) * u, py = y + (gesto.c.y - r.top - oy) * u;
    x = px - (px - x) * f; y = py - (py - y) * f; w *= f; h *= f;
    movido = true;
    const u2 = gesto.u * f;
    vb = { x: x - (c.x - gesto.c.x) * u2, y: y - (c.y - gesto.c.y) * u2, w, h };
  } else {
    vb = { x: x - (c.x - gesto.c.x) * gesto.u, y: y - (c.y - gesto.c.y) * gesto.u, w, h };
  }
  aplicarVista();
});
const soltar = (e) => { punteros.delete(e.pointerId); svg.classList.remove("arrastrando"); iniciarGesto(); };
svg.addEventListener("pointerup", soltar);
svg.addEventListener("pointercancel", soltar);
svg.addEventListener("click", (e) => {
  if (movido) return;
  const g = e.target.closest("[data-n]");
  seleccionar(g ? g.dataset.n : null);
});

// ---------- Datos ----------
let BASE = null, D = { trenes: [], est: {}, incidencias: [], fuentes: {} }, redVersion = null;
const nodos = new Map(); // n -> { g, x, y, tx, ty }
let seleccion = null;

async function cargarBase() {
  BASE = await request("/api/base").then((r) => r.json());
  for (const k of ["fra", "and", "mar", "prt"]) el("path", { d: BASE.land[k], fill: "var(--tierra2)", stroke: "var(--frontera)", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }, capa.base);
  el("path", { d: BASE.land.esp, fill: "var(--tierra)", stroke: "var(--frontera)", "stroke-width": 1.2, "vector-effect": "non-scaling-stroke" }, capa.base);
  const linea = (pts) => pts.map((p, i) => (i ? "L" : "M") + p[0] + "," + p[1]).join("");
  el("path", { d: BASE.corr.map(linea).join(""), fill: "none", stroke: "var(--via)", "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round", "vector-effect": "non-scaling-stroke" }, capa.base);
  for (const p of BASE.principales) el("rect", { class: "ciudad", "data-x": p.x, "data-y": p.y, fill: "var(--via-av)" }, capa.base);
}
async function cargarRed() {
  const r = await request("/api/red");
  if (!r.ok) throw new Error("Network HTTP " + r.status);
  const segs = await r.json();
  capa.red.innerHTML = "";
  el("path", { d: segs.map((s) => `M${s[0]},${s[1]}L${s[2]},${s[3]}`).join(""), fill: "none", stroke: "var(--via)", "stroke-width": 1.5, "stroke-linecap": "round", "vector-effect": "non-scaling-stroke" }, capa.red);
}

let updating = false;
async function actualizar() {
  if (updating) return;
  updating = true;
  try {
    const r = await request("/api/estado");
    if (!r.ok) throw new Error("HTTP " + r.status);
    const next = await r.json();
    if (!Array.isArray(next.trenes) || !next.est || !next.fuentes) throw new Error("Invalid state");
    D = next;
    if (D.generado) desfase = Date.parse(D.generado) - Date.now();
    if (D.red !== redVersion) { try { await cargarRed(); redVersion = D.red; } catch {} }
    pintarTodo();
    $("aviso").hidden = !D.datosAviso;
    $("aviso").textContent = D.datosAviso || "";
  } catch (e) {
    $("aviso").hidden = false;
    $("aviso").textContent = "No hay conexión con el servidor. Reintentando cada 20 segundos.";
    $("vivo").className = "vivo viejo";
    $("hora").textContent = demoMode ? "Demostración · conexión interrumpida" : D.trenes.length ? "Sin conexión · últimas posiciones conservadas" : "Sin conexión · aún sin posiciones";
  } finally { updating = false; }
}

// ---------- Pintado ----------
const visibles = () => D.trenes.filter((t) => { const tp = tipoDe(t.p); return tp && activos.has(tp.id); });

function pintarTodo() {
  pintarCabecera();
  pintarTipos();
  pintarIncidencias();
  pintarTrenes();
  pintarLista();
  pintarFicha();
}

function pintarCabecera() {
  const f = D.fuentes.renfe || {};
  const hora = D.flotaHora ? horaLocal(D.flotaHora) : "";
  const edad = f.hora ? (Date.now() - Date.parse(f.hora)) / 60000 : 99;
  const viejo = !f.ok || !Number.isFinite(edad) || edad > 3;
  $("vivo").className = "vivo " + (viejo ? "viejo" : "ok");
  const sourceDate = iso => iso ? new Date(iso).toLocaleString("es-ES", {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Madrid"}) : "sin hora";
  const label = demoMode ? (viejo ? "Simulación · datos antiguos" : "Datos simulados") : (viejo ? "GPS antiguo" : "GPS Renfe");
  $("hora").textContent = label + " · " + sourceDate(f.hora);
  const delaySource = D.fuentes.retrasos;
  if (!demoMode && delaySource) $("hora").textContent += " · Retrasos " + (delaySource.ok ? sourceDate(delaySource.hora) : "no disponibles");
  $("sourceDetails").textContent = demoMode ? "65 servicios ficticios · red esquemática" : `${D.trenes.length} posiciones publicadas · ${D.sinRetraso || 0} sin dato de retraso · conexiones orientativas entre estaciones`;

}

function pintarTipos() {
  const cuenta = (id) => D.trenes.filter((x) => tipoDe(x.p)?.id === id).length;
  $("tipos").innerHTML = TIPOS.map((t) => t.sinDatos
    ? `<button disabled title="Sin cobertura en este caso de estudio">${t.nom} <b>sin datos</b></button>`
    : `<button class="${activos.has(t.id) ? "on" : ""}" data-id="${t.id}" aria-pressed="${activos.has(t.id)}">${t.nom} <b>${cuenta(t.id)}</b></button>`).join("");
}
$("tipos").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-id]"); if (!b) return;
  const id = b.dataset.id;
  activos.has(id) ? activos.delete(id) : activos.add(id);
  guardado.poner("tipos", [...activos]);
  if (seleccion && !visibles().some((t) => t.n === seleccion)) seleccion = null;
  pintarTipos(); pintarTrenes(); pintarLista(); pintarFicha();
});

function pintarIncidencias() { capa.inc.innerHTML = ""; } // las incidencias de Adif ya no se muestran

// Trenes con movimiento suave entre actualizaciones
let animTrenes = null;
function pintarTrenes() {
  const vis = visibles(), vivos = new Set(vis.map((t) => t.n));
  for (const [n, o] of nodos) if (!vivos.has(n)) { o.g.remove(); nodos.delete(n); }
  for (const t of vis) {
    let o = nodos.get(t.n);
    const nv = nivel(t.ret), md = tipoDe(t.p).id === "md";
    if (!o) {
      const g = el("g", { class: "tren", "data-n": t.n }, capa.trenes);
      el("circle", { r: md ? 3.2 : 4.4, stroke: "var(--fondo)", "stroke-width": 1.2 }, g);
      o = { g, x: t.x, y: t.y, x0: t.x, y0: t.y };
      nodos.set(t.n, o);
    }
    o.x0 = o.x; o.y0 = o.y; o.tx = t.x; o.ty = t.y; o.t = t;
    const c = o.g.firstChild;
    c.setAttribute("fill", COL[nv]); c.setAttribute("fill-opacity", md ? .6 : 1);
    o.g.setAttribute("aria-label", `${(t.producto || NOM_PROD[t.p]) || "Tren"} ${t.n}, ${durTxt(t.ret)}`);
  }
  // los de alta velocidad por encima de los regionales y los más retrasados arriba del todo
  const esMd = (o) => (tipoDe(o.t.p).id === "md" ? 1 : 0);
  [...nodos.values()].sort((a, b) => esMd(b) - esMd(a) || a.t.ret - b.t.ret).forEach((o) => capa.trenes.appendChild(o.g));
  const ahora = performance.now();
  for (const o of nodos.values()) { o.bx = o.x; o.by = o.y; o.b0 = ahora; }
  arrancarMovimiento();
}

// Posición estimada de cada tren en cada fotograma: último punto GPS + velocidad × tiempo transcurrido
let desfase = 0; // reloj del servidor menos reloj del navegador
const quieto = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function objetivo(o, ahoraSrv) {
  return position(o.t, ahoraSrv, quieto());
}
let movimiento = null, ultimoEtiquetado = 0, siguiendo = null, animVistaFin = 0;
function arrancarMovimiento() {
  if (movimiento) return;
  const paso = (now) => {
    const ahoraSrv = Date.now() + desfase;
    for (const o of nodos.values()) {
      const [x, y] = objetivo(o, ahoraSrv);
      const a = quieto() ? 1 : Math.min(1, (now - (o.b0 || 0)) / 1500), e = 1 - Math.pow(1 - a, 3);
      o.x = o.bx + (x - o.bx) * e; o.y = o.by + (y - o.by) * e;
      if (a >= 1) { o.bx = x; o.by = y; }
    }
    if (siguiendo && !gesto) {
      const o = nodos.get(siguiendo);
      if (!o) siguiendo = null;
      else if (!animVista || now - (animVistaFin || 0) > 0) {
        const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2, dx = o.x - cx, dy = o.y - cy;
        if (Math.abs(dx) + Math.abs(dy) > vb.w * 0.002) { vb.x += dx * 0.08; vb.y += dy * 0.08; svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); ultimoEtiquetado = 0; }
      }
    }
    if (now - ultimoEtiquetado > 500) { ultimoEtiquetado = now; dibujar(); } else mover();
    movimiento = document.hidden ? null : requestAnimationFrame(paso);
  };
  movimiento = requestAnimationFrame(paso);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) arrancarMovimiento(); });
// Solo desplaza puntos y etiquetas ya colocados (barato, cada fotograma)
let escalaActual = 1, uActual = 1;
function mover() {
  for (const o of nodos.values()) {
    const tr = `translate(${o.x.toFixed(2)},${o.y.toFixed(2)})`;
    o.g.setAttribute("transform", `${tr} scale(${escalaActual.toFixed(4)})`);
    if (o.etq && o.etq.isConnected) o.etq.setAttribute("transform", `${tr} scale(${uActual.toFixed(4)})`);
  }
  if (anillo && anillo.isConnected) { const o = nodos.get(seleccion); if (o) { anillo.setAttribute("cx", o.x); anillo.setAttribute("cy", o.y); } }
}
let anillo = null;

// Etiquetas y tamaños: se recalculan con cada cambio de zoom o de posición
let pedido = false;
function pedirDibujo() { if (!pedido) { pedido = true; requestAnimationFrame(() => { pedido = false; dibujar(); }); } }
function dibujar() {
  const u = upx(), k = zoomK(), movil = esMovil();
  const crece = movil ? 1.35 : 1;
  const escala = u * crece * Math.min(1.6, 1 + Math.log2(Math.max(1, k)) * 0.1);
  escalaActual = escala; uActual = u;
  for (const o of nodos.values()) o.g.setAttribute("transform", `translate(${o.x.toFixed(2)},${o.y.toFixed(2)}) scale(${escala.toFixed(4)})`);
  for (const r of capa.base.querySelectorAll("rect.ciudad")) { const s = 4 * u; r.setAttribute("x", r.dataset.x - s); r.setAttribute("y", r.dataset.y - s); r.setAttribute("width", 2 * s); r.setAttribute("height", 2 * s); }
  for (const g of capa.inc.querySelectorAll("g.rombo-inc")) g.setAttribute("transform", `translate(${g.dataset.x},${g.dataset.y}) scale(${u})`);
  etiquetar(u, k, movil);
}

function etiquetar(u, k, movil) {
  capa.etiq.innerHTML = "";
  for (const o of nodos.values()) o.etq = null;
  anillo = null;
  if (!BASE) return;
  const r = svg.getBoundingClientRect();
  const enVista = (x, y) => x > vb.x - 20 * u && x < vb.x + vb.w + 20 * u && y > vb.y - 20 * u && y < vb.y + vb.h + 20 * u;
  const cajas = [];
  const sx = (x) => (x - vb.x) / u, sy = (y) => (y - vb.y) / u;
  const libre = (b) => !cajas.some((c) => !(b[2] < c[0] || b[0] > c[2] || b[3] < c[1] || b[1] > c[3]));
  // reserva los puntos de los trenes para que las etiquetas no los tapen
  for (const o of nodos.values()) if (enVista(o.x, o.y)) cajas.push([sx(o.x) - 3, sy(o.y) - 3, sx(o.x) + 3, sy(o.y) + 3]);
  // la cabecera, el zoom y el pie del mapa también ocupan sitio
  cajas.push([0, 0, Math.min(r.width, 900), movil ? 96 : 100], [r.width - 72, r.height / 2 - 70, r.width, r.height / 2 + 70], [0, r.height - 80, 420, r.height]);
  const fs = movil ? 13 : 12;
  // nombres de ciudades
  const ciudades = BASE.principales.slice(0, k < 1.5 ? 18 : k < 3 ? 30 : 99);
  if (!movil || k >= 1.8) for (const p of ciudades) {
    if (!enVista(p.x, p.y)) continue;
    const w = p.n.length * fs * 0.6 + 4, x = sx(p.x) + 7, y = sy(p.y) + 4;
    const b = [x, y, x + w, y + fs + 3];
    if (!libre(b)) continue;
    cajas.push(b);
    const t = el("text", { x: p.x + 7 * u, y: p.y + (4 + fs) * u, "font-size": fs * u, fill: "var(--texto2)", stroke: "var(--fondo)", "stroke-width": 3 * u, "paint-order": "stroke" }, capa.etiq);
    t.textContent = p.n;
  }
  // con mucho zoom, también las estaciones por las que pasan los trenes
  if (k >= 6) for (const [c, e] of Object.entries(D.est)) {
    if (!enVista(e.x, e.y)) continue;
    const n = corto(c), w = n.length * 11 * 0.6 + 4, x = sx(e.x) + 6, y = sy(e.y) + 3;
    const b = [x, y, x + w, y + 14];
    el("rect", { x: e.x - 2.5 * u, y: e.y - 2.5 * u, width: 5 * u, height: 5 * u, fill: "var(--via-av)" }, capa.etiq);
    if (!libre(b)) continue;
    cajas.push(b);
    const t = el("text", { x: e.x + 6 * u, y: e.y + 14 * u, "font-size": 11 * u, fill: "var(--texto2)", stroke: "var(--fondo)", "stroke-width": 3 * u, "paint-order": "stroke" }, capa.etiq);
    t.textContent = n;
  }
  // etiquetas de trenes según el zoom
  const quien = (o) => {
    const t = o.t, md = tipoDe(t.p).id === "md";
    if (t.n === seleccion) return true;
    if (movil) return k >= 2.2 && (t.ret >= 5 || k >= 4) && (!md || k >= 4);
    if (k >= 3) return true;
    if (k >= 1.6) return !md;
    return !md && t.ret >= 5;
  };
  const cand = [...nodos.values()].filter((o) => enVista(o.x, o.y) && quien(o)).sort((a, b) => (b.t.n === seleccion) - (a.t.n === seleccion) || b.t.ret - a.t.ret);
  for (const o of cand) {
    const t = o.t, nv = nivel(t.ret);
    const txt = t.n + (t.ret >= 1 ? " +" + t.ret : "");
    const w = txt.length * 7.4 + 12, h = 19, x = sx(o.x), y = sy(o.y);
    const ops = [[8, -h - 6], [8, 6], [-w - 8, -h - 6], [-w - 8, 6], [8, -h * 2 - 10], [-w - 8, -h * 2 - 10], [8, h + 10], [-w - 8, h + 10]];
    let pos = null;
    for (const [dx, dy] of ops) { const b = [x + dx, y + dy, x + dx + w, y + dy + h]; if (libre(b)) { pos = [dx, dy]; cajas.push(b); break; } }
    if (!pos) { if (t.n !== seleccion) continue; pos = ops[0]; }
    const g = el("g", { class: "tren", "data-n": t.n, transform: `translate(${o.x},${o.y}) scale(${u})` }, capa.etiq);
    o.etq = g;
    el("rect", { x: pos[0], y: pos[1], width: w, height: h, rx: 2, fill: "#0F171F", stroke: COL[nv], "stroke-width": t.n === seleccion ? 2.4 : 1.6 }, g);
    const tx = el("text", { x: pos[0] + 6, y: pos[1] + 13.5, "font-size": 12, "font-family": "B612 Mono, monospace", fill: "var(--texto)" }, g);
    tx.textContent = t.n;
    if (t.ret >= 1) { const s = el("tspan", { fill: COL[nv], "font-weight": 700 }, tx); s.textContent = " +" + t.ret; }
  }
  // anillo del tren seleccionado
  const sel = seleccion && nodos.get(seleccion);
  if (sel) anillo = el("circle", { cx: sel.x, cy: sel.y, r: 12 * u, fill: "none", stroke: COL[nivel(sel.t.ret)], "stroke-width": 2 * u }, capa.etiq);
}

// ---------- Ficha del tren ----------
function seleccionar(n, centrar = false) {
  seleccion = n;
  siguiendo = n;
  pintarFicha();
  pintarLista();
  if (n && centrar) { const o = nodos.get(n); if (o) centrarEn(o.x, o.y, Math.max(zoomK(), 3)); }
  pedirDibujo();
}
function pintarFicha() {
  const f = $("ficha");
  const t = seleccion && D.trenes.find((x) => x.n === seleccion);
  if (!t) { f.hidden = true; seleccion = null; return; }
  const nv = nivel(t.ret);
  f.className = "ficha " + nv;
  f.hidden = false;
  f.innerHTML = `<button class="cerrar" aria-label="Cerrar ficha">×</button>
    <h3>${(t.producto || NOM_PROD[t.p]) || "Tren"} ${esc(t.n)}</h3><div class="ruta">${t.routeConflict ? "Ruta sin confirmar" : esc(corto(t.ori)) + " → " + esc(corto(t.des))}</div><dl>
    ${t.routeConflict ? "<dt>Itinerario</dt><dd>La parada publicada no coincide con el itinerario disponible.</dd>" : ""}
    <dt>Retraso</dt><dd class="n">${durTxt(t.ret)}</dd>
    ${t.lleg ? `<dt>Llegada prevista</dt><dd>${t.lleg}</dd><dt>Llegada estimada</dt><dd>${t.ret == null ? "Sin dato" : addMin(t.lleg, Math.max(0, t.ret))}</dd>` : ""}
    <dt>Velocidad</dt><dd>${t.kmh == null ? "No disponible" : t.kmh < 4 ? "Parado" : "≈ " + t.kmh + " km/h"}</dd>
    <dt>Dónde</dt><dd>${esc(tramo(t))}</dd>
    ${t.hs && t.ant !== t.sig ? `<dt>Llega a ${esc(corto(t.sig))}</dt><dd>${t.hs}</dd>` : ""}
    ${t.acc ? `<dt>Accesible</dt><dd>Sí</dd>` : ""}</dl>`;
  f.querySelector(".cerrar").onclick = () => seleccionar(null);
}

// ---------- Lista de llegadas con retraso ----------
let expandida = false;
function pintarZonas() {
  $("zonas").innerHTML = ZONAS.map((z) => `<button class="${z.id === zona ? "on" : ""}" data-z="${z.id}" aria-pressed="${z.id === zona}">${z.nom}</button>`).join("");
}
$("zonas").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-z]"); if (!b) return;
  zona = b.dataset.z; guardado.poner("zona", zona); expandida = false; pintarZonas(); pintarLista();
});
function pintarLista() {
  const vis = visibles();
  const ret = vis.filter((t) => t.ret >= 5 && enZona(t.des)).sort((a, b) => b.ret - a.ret);
  const orden = vis.map((t) => Math.max(0, t.ret)).sort((a, b) => a - b);
  $("nTotal").textContent = vis.length;
  $("nRet").textContent = vis.filter((t) => t.ret >= 5).length;
  $("medio").textContent = upperMedian(vis.map(t => t.ret)) + " min";
  const z = ZONAS.find((x) => x.id === zona);
  $("sub").textContent = ret.length
    ? `${ret.length} ${ret.length === 1 ? "tren llegará" : "trenes llegarán"} ${z.prov ? "a " + z.nom + " " : ""}5 min tarde o más`
    : "";
  const N = expandida ? ret.length : (esMovil() ? 6 : 12);
  $("lista").innerHTML = ret.length ? ret.slice(0, N).map((t) => `<li class="${nivel(t.ret)}${t.n === seleccion ? " sel" : ""}" data-n="${t.n}" tabindex="0">
      <span class="min">+${t.ret}</span>
      <div><div class="tren">${(t.producto || NOM_PROD[t.p]) || ""} ${t.routeConflict ? "Ruta sin confirmar" : esc(corto(t.ori)) + " → " + esc(corto(t.des))}<small>${t.n}</small></div>
      <div class="donde">${esc(tramo(t))}</div></div>
      <div class="horas">${t.lleg ? `<del>${t.lleg}</del>${addMin(t.lleg, t.ret)}` : ""}</div></li>`).join("")
    : `<li class="vacio">${D.trenes.length ? "Ningún retraso conocido de 5 minutos o más coincide con estos filtros." : "Sin trenes disponibles en la fuente…"}</li>`;
  const mas = $("mas");
  mas.hidden = ret.length <= N;
  mas.innerHTML = `Ver <b>${ret.length - N} más</b>`;
}
$("mas").onclick = () => { expandida = true; pintarLista(); };
$("lista").addEventListener("click", (e) => { const li = e.target.closest("li[data-n]"); if (li) { seleccionar(li.dataset.n, true); if (esMovil()) $("mapa").scrollIntoView({ behavior: "smooth" }); } });
$("lista").addEventListener("keydown", (e) => { const li = e.target.closest("li[data-n]"); if (li && e.key === "Enter") seleccionar(li.dataset.n, true); });

// Contacto: se compone al cargar para que no aparezca en el HTML
{ const c = $("contacto"); if (c) { const m = c.dataset.u + "@" + c.dataset.d; c.textContent = m; c.href = "mailto:" + m + "?subject=V%C3%ADa%20libre"; } }

// Portada de aviso: sale en cada visita salvo que se marque "No volver a mostrar"
{
  const p = $("portada");
  if (p && !guardado.leer("portadaVista", false)) {
    p.hidden = false; document.body.style.overflow = "hidden";
    setTimeout(() => $("pEntrar").focus(), 50);
    $("pEntrar").onclick = () => { if ($("pNoMostrar").checked) guardado.poner("portadaVista", true); p.hidden = true; document.body.style.overflow = ""; };
  }
}

// ---------- Arranque ----------
addEventListener("resize", () => { aplicarVista(); });
(async () => {
  pintarZonas();
  aplicarVista();
  try { await cargarBase(); } catch {}
  await actualizar();
  setInterval(() => { if (!document.hidden) actualizar(); }, 20000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) actualizar(); });
})();

// Demo scenarios are explicit and never presented as real observations.
$("scenario").addEventListener("change", async event => {
  setScenario(event.target.value);
  await actualizar();
});
$("demoEnter").onclick = () => {
  if ($("demoRemember").checked) guardado.poner(demoMode ? "portadaVista" : "liveWelcome", true);
  $("demoWelcome").close();
};
$("modeLabel").textContent = demoMode ? "DEMOSTRACIÓN" : "DATOS DE RENFE";
$("scenarioLabel").hidden = !demoMode;
$("modeLink").href = demoMode ? "/" : "/?mode=demo";
$("modeLink").textContent = demoMode ? "Ver datos de Renfe" : "Abrir demostración";
$("welcomeTitle").textContent = demoMode ? "Vía libre, reconstruida" : "Trenes con datos de Renfe";
$("welcomeText").textContent = demoMode ? "Los servicios, posiciones y retrasos son simulados. El mapa y las vías son esquemáticos." : "Consulta las posiciones GPS y las actualizaciones de retrasos publicadas por Renfe. La hora de cada fuente indica su antigüedad. Las líneas conectan estaciones de forma orientativa. Una ausencia de datos no permite confirmar una cancelación.";
if (!guardado.leer(demoMode ? "portadaVista" : "liveWelcome", false)) $("demoWelcome").showModal();
