// Villa Tarkela - Budjettilaskuri (A/B/C-suunnitelmat, alueittain, komponenteittain)

const STATE_KEY = "villaTarkela.v4";
let asbestosPrice = ASBESTOS_REMOVAL_PRICE_PER_M2;
let state = loadState() || cloneDefaults();
let selectedPlan = state.meta?.selectedPlan || "B";

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed._asbestosPrice) asbestosPrice = parsed._asbestosPrice;
    return parsed.data || parsed;
  } catch { return null; }
}

function saveState() {
  state.meta.selectedPlan = selectedPlan;
  localStorage.setItem(STATE_KEY, JSON.stringify({ data: state, _asbestosPrice: asbestosPrice }));
}

// ---------- formatters ----------
const fi  = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 });
const fi2 = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const eur  = (n) => fi.format(Math.round(n)) + " €";
const m2u  = (n) => fi2.format(n) + " m²";
const mu   = (n) => fi2.format(n) + " m";

const isIncluded = (itemPlan, sel) => {
  if (itemPlan === "-" || !itemPlan) return false;
  return PLAN_RANK[itemPlan] <= PLAN_RANK[sel];
};

// ---------- room calculations ----------
const floorArea  = r => r.w * r.l;
const perimeter  = r => 2 * (r.w + r.l);
const wallArea   = r => Math.max(0, perimeter(r) * r.h - (r.openings || 0));
const ceilArea   = r => r.w * r.l;
const innerWallLen = r => Math.max(0, perimeter(r) - (r.outerWallLen || 0));

const findMat = (cat, id) => state.materials[cat].find(x => x.id === id);
const findType = (typeId) => (state.partitionTypes || []).find(t => t.id === typeId);

function partitionCost(p) {
  if (p.typeId) {
    const t = findType(p.typeId);
    return (+p.length || 0) * matPrice(t);
  }
  // legacy fallback (vanhat partitiot per m²)
  return (+p.length || 0) * (+p.height || 0) * (+p.price || 0);
}

function roomCost(r, plan) {
  const fm = findMat("floor", r.floorMat);
  const wm = findMat("wall", r.wallMat);
  const cm = findMat("ceiling", r.ceilMat);
  const doFloor      = isIncluded(r.floorPlan, plan);
  const doWall       = isIncluded(r.wallPlan, plan);
  const doCeil       = isIncluded(r.ceilPlan, plan);
  const doFloorWorks = doFloor && isIncluded(state.extras.floorWorksFromPlan, plan);
  const fc  = doFloor ? floorArea(r) * matPrice(fm) : 0;
  const wc  = doWall  ? wallArea(r)  * matPrice(wm) : 0;
  const cc  = doCeil  ? ceilArea(r)  * matPrice(cm) : 0;
  const ac  = doFloor && r.asbestos ? floorArea(r) * asbestosPrice : 0;
  const fhc = doFloorWorks ? floorArea(r) * state.extras.floorHeatingPipesPerM2 : 0;
  const gsc = doFloorWorks ? floorArea(r) * state.extras.gypsumScreedPerM2 : 0;
  return {
    doFloor, doWall, doCeil, doFloorWorks,
    floor: fc, wall: wc, ceiling: cc, asbestos: ac,
    floorHeating: fhc, gypsum: gsc,
    total: fc + wc + cc + ac + fhc + gsc
  };
}

function totals(plan = selectedPlan) {
  let floor = 0, wall = 0, ceiling = 0, asbestos = 0, floorHeating = 0, gypsum = 0;
  let area = 0, wallAr = 0, ceilAr = 0;
  let innerLen = 0, outerLen = 0;
  state.rooms.forEach(r => {
    const c = roomCost(r, plan);
    floor += c.floor; wall += c.wall; ceiling += c.ceiling;
    asbestos += c.asbestos; floorHeating += c.floorHeating; gypsum += c.gypsum;
    area += floorArea(r);
    wallAr += wallArea(r);
    ceilAr += ceilArea(r);
    innerLen += innerWallLen(r);
    outerLen += (r.outerWallLen || 0);
  });
  innerLen = innerLen / 2;
  const partitions = state.partitions.filter(p => isIncluded(p.plan, plan))
    .reduce((s, p) => s + partitionCost(p), 0);
  const fixtures = state.fixtures.filter(f => isIncluded(f.plan, plan))
    .reduce((s, f) => s + f.qty * f.unitPrice, 0);
  const special = state.special.filter(x => isIncluded(x.plan, plan))
    .reduce((s, x) => s + x.qty * x.unitPrice, 0);
  const grand = floor + wall + ceiling + asbestos + floorHeating + gypsum + partitions + fixtures + special;
  return {
    floor, wall, ceiling, asbestos, floorHeating, gypsum,
    partitions, fixtures, special, grand,
    area, wallAr, ceilAr, innerLen, outerLen
  };
}

// Vyöhykekohtaiset summat
function totalsByZone(plan = selectedPlan) {
  const zones = ["kuiva", "marka", "keittio", "yhteinen"];
  const z = {}; zones.forEach(k => z[k] = 0);

  state.rooms.forEach(r => {
    const c = roomCost(r, plan);
    const zone = r.zone || "kuiva";
    z[zone] = (z[zone] || 0) + c.total;
  });
  state.partitions.forEach(p => {
    if (!isIncluded(p.plan, plan)) return;
    const zone = p.zone || "kuiva";
    z[zone] = (z[zone] || 0) + partitionCost(p);
  });
  state.fixtures.forEach(f => {
    if (!isIncluded(f.plan, plan)) return;
    const zone = f.zone || "yhteinen";
    z[zone] = (z[zone] || 0) + f.qty * f.unitPrice;
  });
  state.special.forEach(x => {
    if (!isIncluded(x.plan, plan)) return;
    const zone = x.zone || "yhteinen";
    z[zone] = (z[zone] || 0) + x.qty * x.unitPrice;
  });
  return z;
}

function areaByZone() {
  const z = { kuiva: 0, marka: 0, keittio: 0 };
  state.rooms.forEach(r => {
    const zone = r.zone || "kuiva";
    z[zone] = (z[zone] || 0) + floorArea(r);
  });
  return z;
}

function areaByFloor(name) {
  return state.rooms.filter(r => r.floor === name).reduce((s, r) => s + floorArea(r), 0);
}
function roomCountByFloor(name) {
  return state.rooms.filter(r => r.floor === name).length;
}

// ---------- DOM helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ---------- plan selector ----------
function renderPlanSelector() {
  const cont = $("#planSelector");
  const tA = totals("A").grand;
  const tB = totals("B").grand;
  const tC = totals("C").grand;
  cont.innerHTML = `
    ${["A", "B", "C"].map(p => {
      const t = p === "A" ? tA : p === "B" ? tB : tC;
      const plan = state.plans[p];
      return `<button class="plan-card ${p === selectedPlan ? "active" : ""}" data-plan="${p}">
        <div class="plan-letter">${p}</div>
        <div class="plan-name">${plan.name}</div>
        <div class="plan-total">${eur(t)}</div>
      </button>`;
    }).join("")}
  `;
  cont.querySelectorAll("button[data-plan]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedPlan = btn.dataset.plan;
      saveState();
      renderAll();
    });
  });
  $("#planDesc").textContent = state.plans[selectedPlan].desc;
}

// ---------- tab navigation ----------
$$("nav button[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    $$("nav button[data-tab]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    $$(".tab").forEach(t => t.classList.remove("active"));
    $("#" + btn.dataset.tab).classList.add("active");
  });
});

// ---------- summary ----------
function renderSummary() {
  const t = totals();
  const az = areaByZone();
  $("#totalArea").textContent = m2u(t.area);
  $("#totalAreaSub").textContent = state.rooms.length + " huonetta";
  $("#floor1Area").textContent = m2u(areaByFloor("1. krs"));
  $("#floor1Sub").textContent = roomCountByFloor("1. krs") + " huonetta";
  $("#floor0Area").textContent = m2u(areaByFloor("Kellari"));
  $("#floor0Sub").textContent = roomCountByFloor("Kellari") + " tilaa · ei remonttia";
  $("#innerWalls").textContent = mu(t.innerLen);
  $("#innerWallsSub").textContent = m2u(t.innerLen * 2.5);
  $("#outerWalls").textContent = mu(t.outerLen);
  $("#outerWallsSub").textContent = m2u(t.outerLen * 2.5);
  $("#grandTotal").textContent = eur(t.grand);
  $("#grandTotalSub").textContent = `Suunnitelma ${selectedPlan}`;

  // Cost breakdown (luokittain)
  const rows = [
    ["Lattiapinnoitukset",                  t.floor],
    ["Seinäpintakäsittelyt",                t.wall],
    ["Kattopinnoitukset",                   t.ceiling],
    ["Asbestilattian purku",                t.asbestos],
    ["Lattialämmitysputket (omana työnä)",  t.floorHeating],
    ["Kipsivalu (urakka)",                  t.gypsum],
    ["Uudet väliseinät",                    t.partitions],
    ["Kalusteet ja varusteet",              t.fixtures],
    ["Erityiskustannukset",                 t.special]
  ];
  let html = "<thead><tr><th>Luokka</th><th class='num'>Hinta</th><th class='num' style='width:80px'>%</th></tr></thead><tbody>";
  rows.forEach(([name, val]) => {
    const pct = t.grand > 0 ? (val / t.grand * 100) : 0;
    const dim = val === 0 ? " style='color:var(--muted)'" : "";
    html += `<tr${dim}><td>${name}</td><td class='num'>${eur(val)}</td><td class='num'>${pct.toFixed(1)} %</td></tr>`;
  });
  html += `<tr class='total-row'><td>Yhteensä — Suunnitelma ${selectedPlan}</td><td class='num'>${eur(t.grand)}</td><td class='num'>100.0 %</td></tr></tbody>`;
  $("#breakdownTable").innerHTML = html;

  // Zone breakdown
  const zABC = { A: totalsByZone("A"), B: totalsByZone("B"), C: totalsByZone("C") };
  let zHtml = "<thead><tr><th>Vyöhyke</th><th class='num'>Ala</th><th class='num'>A</th><th class='num'>B</th><th class='num'>C</th></tr></thead><tbody>";
  ["kuiva", "marka", "keittio", "yhteinen"].forEach(z => {
    const zname = state.zones[z]?.name || z;
    const ar = az[z] != null ? m2u(az[z]) : "–";
    zHtml += `<tr>
      <td><span class="zone-tag zone-${z}">${zname}</span></td>
      <td class='num'>${z === "yhteinen" ? "–" : ar}</td>
      <td class='num'>${eur(zABC.A[z] || 0)}</td>
      <td class='num'>${eur(zABC.B[z] || 0)}</td>
      <td class='num'>${eur(zABC.C[z] || 0)}</td>
    </tr>`;
  });
  const sumA = Object.values(zABC.A).reduce((a,b) => a+b, 0);
  const sumB = Object.values(zABC.B).reduce((a,b) => a+b, 0);
  const sumC = Object.values(zABC.C).reduce((a,b) => a+b, 0);
  zHtml += `<tr class='total-row'>
    <td>Yhteensä</td>
    <td class='num'>${m2u(t.area)}</td>
    <td class='num'>${eur(sumA)}</td>
    <td class='num'>${eur(sumB)}</td>
    <td class='num'>${eur(sumC)}</td>
  </tr></tbody>`;
  $("#zoneTable").innerHTML = zHtml;

  // Plan comparison (luokittain)
  const tABC = { A: totals("A"), B: totals("B"), C: totals("C") };
  let cmpHtml = "<thead><tr><th>Luokka</th><th class='num'>A</th><th class='num'>B</th><th class='num'>C</th></tr></thead><tbody>";
  [
    ["Lattiapinnoitukset",         "floor"],
    ["Seinäpinnat",                 "wall"],
    ["Kattopinnat",                 "ceiling"],
    ["Asbestin purku",              "asbestos"],
    ["Lattialämmitys",              "floorHeating"],
    ["Kipsivalu",                   "gypsum"],
    ["Uudet väliseinät",            "partitions"],
    ["Kalusteet",                   "fixtures"],
    ["Erityiskustannukset",         "special"]
  ].forEach(([label, k]) => {
    cmpHtml += `<tr>
      <td>${label}</td>
      <td class='num'>${eur(tABC.A[k])}</td>
      <td class='num'>${eur(tABC.B[k])}</td>
      <td class='num'>${eur(tABC.C[k])}</td>
    </tr>`;
  });
  cmpHtml += `<tr class='total-row'>
    <td>Yhteensä</td>
    <td class='num'>${eur(tABC.A.grand)}</td>
    <td class='num'>${eur(tABC.B.grand)}</td>
    <td class='num'>${eur(tABC.C.grand)}</td>
  </tr></tbody>`;
  $("#comparisonTable").innerHTML = cmpHtml;

  // Fixture summary
  let fxHtml = "<thead><tr><th>Varuste</th><th class='num'>Kpl</th><th>Vyöhyke</th><th>Plan</th></tr></thead><tbody>";
  state.fixtures.forEach(f => {
    if (!isIncluded(f.plan, selectedPlan)) return;
    if (f.qty > 0) fxHtml += `<tr>
      <td>${f.name}${f.note ? ` <span style="color:var(--muted)">— ${f.note}</span>` : ""}</td>
      <td class='num'>${f.qty}</td>
      <td><span class="zone-tag zone-${f.zone || 'yhteinen'}">${state.zones[f.zone || 'yhteinen']?.name || ''}</span></td>
      <td><span class="plan-tag plan-${f.plan}">${f.plan}</span></td>
    </tr>`;
  });
  fxHtml += "</tbody>";
  $("#fixtureSummaryTable").innerHTML = fxHtml;

  // Room costs
  let rHtml = "<thead><tr><th>Tunn.</th><th>Huone</th><th>Vyöhyke</th><th class='num'>Ala m²</th><th class='num'>Lattia</th><th class='num'>Seinä</th><th class='num'>Katto</th><th class='num'>Asb.</th><th class='num'>Lattialämm.</th><th class='num'>Kipsivalu</th><th class='num'>Yht.</th></tr></thead><tbody>";
  let s = { f: 0, w: 0, c: 0, a: 0, fh: 0, gs: 0, t: 0, area: 0 };
  state.rooms.forEach(r => {
    const c = roomCost(r, selectedPlan);
    if (c.total === 0) return;
    s.f += c.floor; s.w += c.wall; s.c += c.ceiling; s.a += c.asbestos;
    s.fh += c.floorHeating; s.gs += c.gypsum; s.t += c.total;
    s.area += floorArea(r);
    rHtml += `<tr>
      <td>${r.id}</td>
      <td>${r.name}</td>
      <td><span class="zone-tag zone-${r.zone}">${state.zones[r.zone]?.name || ''}</span></td>
      <td class='num'>${fi2.format(floorArea(r))}</td>
      <td class='num'>${c.doFloor ? eur(c.floor) : "–"}</td>
      <td class='num'>${c.doWall ? eur(c.wall) : "–"}</td>
      <td class='num'>${c.doCeil ? eur(c.ceiling) : "–"}</td>
      <td class='num'>${c.asbestos > 0 ? eur(c.asbestos) : "–"}</td>
      <td class='num'>${c.floorHeating > 0 ? eur(c.floorHeating) : "–"}</td>
      <td class='num'>${c.gypsum > 0 ? eur(c.gypsum) : "–"}</td>
      <td class='num'><strong>${eur(c.total)}</strong></td>
    </tr>`;
  });
  rHtml += `<tr class='total-row'>
    <td colspan='3'>Yhteensä</td>
    <td class='num'>${fi2.format(s.area)}</td>
    <td class='num'>${eur(s.f)}</td>
    <td class='num'>${eur(s.w)}</td>
    <td class='num'>${eur(s.c)}</td>
    <td class='num'>${eur(s.a)}</td>
    <td class='num'>${eur(s.fh)}</td>
    <td class='num'>${eur(s.gs)}</td>
    <td class='num'>${eur(s.t)}</td>
  </tr></tbody>`;
  $("#roomCostsTable").innerHTML = rHtml;
}

// ---------- rooms table ----------
function matOptions(cat, selected) {
  return state.materials[cat]
    .map(m => `<option value="${m.id}"${m.id === selected ? " selected" : ""}>${m.name} (${matPrice(m)} €/m²)</option>`)
    .join("");
}

function planOpts(selected) {
  return ["-", "A", "B", "C"]
    .map(p => `<option value="${p}"${p === selected ? " selected" : ""}>${p}</option>`)
    .join("");
}

function zoneOpts(selected) {
  return ["kuiva", "marka", "keittio", "yhteinen"]
    .map(z => `<option value="${z}"${z === selected ? " selected" : ""}>${state.zones[z]?.name || z}</option>`)
    .join("");
}

function renderRooms() {
  const tbl = $("#roomsTable");
  let html = `<thead><tr>
    <th class='col-id'>Tunn.</th>
    <th class='col-name'>Nimi</th>
    <th>Kerros</th>
    <th>Vyöhyke</th>
    <th class='num'>L</th>
    <th class='num'>P</th>
    <th class='num'>K</th>
    <th class='num'>Aukot</th>
    <th class='num'>Ulk.</th>
    <th class='col-mat'>Lattia</th>
    <th>L↺</th>
    <th class='col-mat'>Seinä</th>
    <th>S↺</th>
    <th class='col-mat'>Katto</th>
    <th>K↺</th>
    <th>Asb.</th>
    <th class='num'>Ala m²</th>
    <th class='num'>Hinta (${selectedPlan})</th>
    <th class='col-del'></th>
  </tr></thead><tbody>`;
  state.rooms.forEach((r, i) => {
    const c = roomCost(r, selectedPlan);
    const dim = c.total === 0 ? " class='inactive'" : "";
    html += `<tr data-i='${i}'${dim}>
      <td><input value="${r.id}" data-k="id"></td>
      <td><input value="${r.name}" data-k="name"></td>
      <td><input value="${r.floor}" data-k="floor"></td>
      <td><select class="zone-select zone-${r.zone}" data-k="zone">${zoneOpts(r.zone)}</select></td>
      <td><input type="number" step="0.05" value="${r.w}" data-k="w"></td>
      <td><input type="number" step="0.05" value="${r.l}" data-k="l"></td>
      <td><input type="number" step="0.05" value="${r.h}" data-k="h"></td>
      <td><input type="number" step="0.1" value="${r.openings}" data-k="openings"></td>
      <td><input type="number" step="0.1" value="${r.outerWallLen}" data-k="outerWallLen"></td>
      <td><select data-k="floorMat">${matOptions("floor", r.floorMat)}</select></td>
      <td><select class="plan-select plan-${r.floorPlan}" data-k="floorPlan">${planOpts(r.floorPlan)}</select></td>
      <td><select data-k="wallMat">${matOptions("wall", r.wallMat)}</select></td>
      <td><select class="plan-select plan-${r.wallPlan}" data-k="wallPlan">${planOpts(r.wallPlan)}</select></td>
      <td><select data-k="ceilMat">${matOptions("ceiling", r.ceilMat)}</select></td>
      <td><select class="plan-select plan-${r.ceilPlan}" data-k="ceilPlan">${planOpts(r.ceilPlan)}</select></td>
      <td class='checkbox-cell'><input type="checkbox" data-k="asbestos" ${r.asbestos ? "checked" : ""}></td>
      <td class='calc'>${fi2.format(floorArea(r))}</td>
      <td class='calc'><strong>${eur(c.total)}</strong></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  const t = totals();
  html += `<tr class='total-row'>
    <td colspan='9'>Suunnitelma ${selectedPlan} yhteensä</td>
    <td colspan='7'></td>
    <td class='num'>${fi2.format(t.area)}</td>
    <td class='num'><strong>${eur(t.floor + t.wall + t.ceiling + t.asbestos + t.floorHeating + t.gypsum)}</strong></td>
    <td></td>
  </tr></tbody>`;
  tbl.innerHTML = html;

  tbl.querySelectorAll("tbody tr[data-i]").forEach(tr => {
    const i = +tr.dataset.i;
    tr.querySelectorAll("input, select").forEach(inp => {
      const handler = () => updateRoomField(i, inp);
      inp.addEventListener("change", handler);
      if (inp.type !== "checkbox" && inp.tagName !== "SELECT")
        inp.addEventListener("input", handler);
    });
    tr.querySelector("[data-del]").addEventListener("click", () => {
      if (confirm(`Poistetaanko huone "${state.rooms[i].name}"?`)) {
        state.rooms.splice(i, 1);
        saveState();
        renderAll();
      }
    });
  });
}

function updateRoomField(i, inp) {
  const k = inp.dataset.k;
  let val;
  if (inp.type === "checkbox") val = inp.checked;
  else if (inp.type === "number") val = +inp.value || 0;
  else val = inp.value;
  state.rooms[i][k] = val;
  saveState();
  renderRooms();
  renderPlanSelector();
  const next = document.querySelector(`#roomsTable tr[data-i='${i}'] [data-k='${k}']`);
  if (next) {
    next.focus();
    if (next.tagName === "INPUT" && (next.type === "text" || next.type === "number")) {
      const v = next.value;
      next.setSelectionRange?.(v.length, v.length);
    }
  }
}

$("#addRoom").addEventListener("click", () => {
  state.rooms.push({
    id: "uusi", name: "Uusi huone", floor: "1. krs", zone: "kuiva",
    w: 3, l: 3, h: 2.5, openings: 2, outerWallLen: 0,
    floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
    floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false
  });
  saveState();
  renderAll();
});

// ---------- materials with components ----------
function renderMaterials() {
  ["floor", "wall", "ceiling"].forEach(cat => {
    const tblId = cat === "floor" ? "floorMatsTable" : cat === "wall" ? "wallMatsTable" : "ceilingMatsTable";
    renderMaterialTable(cat, tblId, "€/m²");
  });

  $("#asbestosPrice").value = asbestosPrice;
  $("#asbestosPrice").oninput = (e) => {
    asbestosPrice = +e.target.value || 0;
    saveState();
    renderPlanSelector();
  };

  $("#fhPrice").value = state.extras.floorHeatingPipesPerM2;
  $("#fhPrice").oninput = (e) => {
    state.extras.floorHeatingPipesPerM2 = +e.target.value || 0;
    saveState();
    renderPlanSelector();
  };

  $("#gsPrice").value = state.extras.gypsumScreedPerM2;
  $("#gsPrice").oninput = (e) => {
    state.extras.gypsumScreedPerM2 = +e.target.value || 0;
    saveState();
    renderPlanSelector();
  };

  $$("[data-add-mat]").forEach(btn => {
    btn.onclick = () => {
      const cat = btn.dataset.addMat;
      state.materials[cat].push({ id: "uusi-" + Date.now(), name: "Uusi materiaali", price: 0 });
      saveState();
      renderAll();
    };
  });

  // Väliseinätyypit
  renderPartitionTypes();
}

function renderMaterialTable(cat, tblId, unit) {
  const tbl = $("#" + tblId);
  let html = `<thead><tr><th>Tunnus</th><th>Nimi</th><th class='num'>Hinta ${unit}</th><th>Komp.</th><th class='col-del'></th></tr></thead><tbody>`;
  state.materials[cat].forEach((mat, i) => {
    const hasComp = Array.isArray(mat.components) && mat.components.length;
    const totalP = matPrice(mat);
    html += `<tr data-cat='${cat}' data-i='${i}'>
      <td><input value="${mat.id}" data-k="id"></td>
      <td><input value="${mat.name}" data-k="name"></td>
      <td>${hasComp
        ? `<span class='calc'><strong>${fi2.format(totalP)} ${unit}</strong> <span style='color:var(--muted)'>(autom.)</span></span>`
        : `<input type="number" step="1" value="${mat.price ?? 0}" data-k="price">`}</td>
      <td>${hasComp ? `<button class='link' data-toggle='${cat}-${i}'>${mat.components.length} osaa ▾</button>` : `<button class='link' data-add-comp='${cat}-${i}'>+ Lisää</button>`}</td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
    if (hasComp) {
      html += `<tr class='component-rows' data-rows-for='${cat}-${i}'><td colspan='5'>
        <table class='nested-table'><thead><tr><th>Komponentti</th><th class='num'>Hinta ${unit}</th><th class='col-del'></th></tr></thead><tbody>
        ${mat.components.map((c, ci) => `<tr data-ci='${ci}'>
          <td><input value="${c.name}" data-k="cname"></td>
          <td><input type="number" step="1" value="${c.price}" data-k="cprice"></td>
          <td><button class='del' data-del-comp>×</button></td>
        </tr>`).join("")}
        <tr><td colspan='3'><button class='link' data-add-comp='${cat}-${i}'>+ Lisää komponentti</button></td></tr>
        </tbody></table>
      </td></tr>`;
    }
  });
  html += "</tbody>";
  tbl.innerHTML = html;

  tbl.querySelectorAll("tbody > tr[data-i]").forEach(tr => {
    const i = +tr.dataset.i;
    tr.querySelectorAll("input").forEach(inp => {
      inp.addEventListener("input", () => {
        const k = inp.dataset.k;
        const val = inp.type === "number" ? +inp.value : inp.value;
        state.materials[cat][i][k] = val;
        saveState();
        renderPlanSelector();
      });
    });
    tr.querySelector("[data-del]").addEventListener("click", () => {
      if (confirm("Poistetaanko materiaali?")) {
        state.materials[cat].splice(i, 1);
        saveState();
        renderAll();
      }
    });
  });

  tbl.querySelectorAll(".component-rows tbody tr[data-ci]").forEach(tr => {
    const parent = tr.closest("tr[data-rows-for]") || tr.parentElement.closest("tr[data-rows-for]");
    const rowsFor = parent?.dataset.rowsFor;
    if (!rowsFor) return;
    const [catId, idxStr] = rowsFor.split("-");
    const i = +idxStr;
    const ci = +tr.dataset.ci;
    tr.querySelectorAll("input").forEach(inp => {
      inp.addEventListener("input", () => {
        const k = inp.dataset.k;
        const val = inp.type === "number" ? +inp.value : inp.value;
        const mat = state.materials[catId][i];
        if (k === "cname") mat.components[ci].name = val;
        if (k === "cprice") mat.components[ci].price = val;
        saveState();
        // Re-render: just the totalP cell + plan totals
        renderMaterialTable(catId, tblId, unit);
        renderPlanSelector();
      });
    });
    tr.querySelector("[data-del-comp]").addEventListener("click", () => {
      state.materials[catId][i].components.splice(ci, 1);
      saveState();
      renderMaterialTable(catId, tblId, unit);
      renderPlanSelector();
    });
  });

  tbl.querySelectorAll("[data-add-comp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const [catId, idxStr] = btn.dataset.addComp.split("-");
      const i = +idxStr;
      const mat = state.materials[catId][i];
      if (!mat.components) mat.components = [];
      mat.components.push({ name: "Uusi komponentti", price: 0 });
      saveState();
      renderMaterialTable(catId, tblId, unit);
      renderPlanSelector();
    });
  });
}

// ---------- partition types ----------
function renderPartitionTypes() {
  const cont = $("#partitionTypesContainer");
  if (!cont || !state.partitionTypes) return;
  let html = "";
  state.partitionTypes.forEach((t, i) => {
    const totalP = matPrice(t);
    html += `<div class="ptype-box" data-i='${i}'>
      <div class="ptype-header">
        <input class="ptype-name" value="${t.name}" data-k="name">
        <span class='ptype-total'>${fi2.format(totalP)} ${t.unit || '€/m'}</span>
      </div>
      <table class='nested-table'><thead><tr><th>Komponentti</th><th class='num'>Hinta ${t.unit || '€/m'}</th><th class='col-del'></th></tr></thead><tbody>
        ${(t.components || []).map((c, ci) => `<tr data-ci='${ci}'>
          <td><input value="${c.name}" data-k="cname"></td>
          <td><input type="number" step="1" value="${c.price}" data-k="cprice"></td>
          <td><button class='del' data-del-comp>×</button></td>
        </tr>`).join("")}
        <tr><td colspan='3'><button class='link' data-add-pcomp='${i}'>+ Lisää komponentti</button></td></tr>
      </tbody></table>
    </div>`;
  });
  cont.innerHTML = html;
  cont.querySelectorAll(".ptype-box").forEach(box => {
    const i = +box.dataset.i;
    const nameInp = box.querySelector(".ptype-name");
    nameInp.addEventListener("input", () => {
      state.partitionTypes[i].name = nameInp.value;
      saveState();
    });
    box.querySelectorAll("tbody tr[data-ci]").forEach(tr => {
      const ci = +tr.dataset.ci;
      tr.querySelectorAll("input").forEach(inp => {
        inp.addEventListener("input", () => {
          const k = inp.dataset.k;
          const val = inp.type === "number" ? +inp.value : inp.value;
          if (k === "cname") state.partitionTypes[i].components[ci].name = val;
          if (k === "cprice") state.partitionTypes[i].components[ci].price = val;
          saveState();
          renderPartitionTypes();
          renderPartitions();
          renderPlanSelector();
        });
      });
      tr.querySelector("[data-del-comp]").addEventListener("click", () => {
        state.partitionTypes[i].components.splice(ci, 1);
        saveState();
        renderPartitionTypes();
        renderPartitions();
        renderPlanSelector();
      });
    });
    box.querySelector("[data-add-pcomp]").addEventListener("click", () => {
      if (!state.partitionTypes[i].components) state.partitionTypes[i].components = [];
      state.partitionTypes[i].components.push({ name: "Uusi", price: 0 });
      saveState();
      renderPartitionTypes();
      renderPartitions();
      renderPlanSelector();
    });
  });
}

// ---------- partitions ----------
function partitionTypeOpts(selected) {
  return (state.partitionTypes || [])
    .map(t => `<option value="${t.id}"${t.id === selected ? " selected" : ""}>${t.name} (${matPrice(t)} ${t.unit || '€/m'})</option>`)
    .join("");
}

function renderPartitions() {
  const tbl = $("#partitionsTable");
  let html = `<thead><tr>
    <th>Kuvaus</th>
    <th class='num'>Pituus m</th>
    <th>Tyyppi</th>
    <th class='num'>€/m</th>
    <th class='num'>Hinta</th>
    <th>Suunnit.</th>
    <th>Vyöhyke</th>
    <th>Huomio</th>
    <th class='col-del'></th>
  </tr></thead><tbody>`;
  let total = 0;
  state.partitions.forEach((p, i) => {
    const t = findType(p.typeId);
    const perM = matPrice(t);
    const c = (+p.length || 0) * perM;
    const incl = isIncluded(p.plan, selectedPlan);
    if (incl) total += c;
    html += `<tr data-i='${i}'${!incl ? " class='inactive'" : ""}>
      <td><input value="${p.name}" data-k="name"></td>
      <td><input type="number" step="0.5" value="${p.length}" data-k="length"></td>
      <td><select data-k="typeId">${partitionTypeOpts(p.typeId)}</select></td>
      <td class='calc'>${fi2.format(perM)} €/m</td>
      <td class='calc'>${eur(c)}</td>
      <td><select class="plan-select plan-${p.plan}" data-k="plan">${planOpts(p.plan)}</select></td>
      <td><select class="zone-select zone-${p.zone}" data-k="zone">${zoneOpts(p.zone)}</select></td>
      <td><input value="${p.note || ''}" data-k="note"></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  html += `<tr class='total-row'><td colspan='4'>Suunnitelma ${selectedPlan} yhteensä</td><td class='num'>${eur(total)}</td><td colspan='4'></td></tr></tbody>`;
  tbl.innerHTML = html;
  bindRows(tbl, "partitions");
}

$("#addPartition").addEventListener("click", () => {
  state.partitions.push({ name: "Uusi väliseinä", length: 3, typeId: "kuiva", plan: "B", zone: "kuiva", note: "" });
  saveState();
  renderAll();
});

// ---------- fixtures ----------
function renderFixtures() {
  const tbl = $("#fixturesTable");
  let html = `<thead><tr>
    <th>Varuste / kaluste</th>
    <th class='num'>Kpl</th>
    <th class='num'>€/kpl</th>
    <th class='num'>Yht.</th>
    <th>Suunnit.</th>
    <th>Vyöhyke</th>
    <th>Huomio</th>
    <th class='col-del'></th>
  </tr></thead><tbody>`;
  let total = 0;
  state.fixtures.forEach((f, i) => {
    const c = f.qty * f.unitPrice;
    const incl = isIncluded(f.plan, selectedPlan);
    if (incl) total += c;
    html += `<tr data-i='${i}'${!incl ? " class='inactive'" : ""}>
      <td><input value="${f.name}" data-k="name"></td>
      <td><input type="number" step="1" value="${f.qty}" data-k="qty"></td>
      <td><input type="number" step="1" value="${f.unitPrice}" data-k="unitPrice"></td>
      <td class='calc'>${eur(c)}</td>
      <td><select class="plan-select plan-${f.plan}" data-k="plan">${planOpts(f.plan)}</select></td>
      <td><select class="zone-select zone-${f.zone}" data-k="zone">${zoneOpts(f.zone)}</select></td>
      <td><input value="${f.note || ''}" data-k="note"></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  html += `<tr class='total-row'><td colspan='3'>Suunnitelma ${selectedPlan} yhteensä</td><td class='num'>${eur(total)}</td><td colspan='4'></td></tr></tbody>`;
  tbl.innerHTML = html;
  bindRows(tbl, "fixtures");
}

$("#addFixture").addEventListener("click", () => {
  state.fixtures.push({ name: "Uusi varuste", qty: 1, unitPrice: 0, plan: "B", zone: "marka", note: "" });
  saveState();
  renderAll();
});

// ---------- special ----------
function renderSpecial() {
  const tbl = $("#specialTable");
  let html = `<thead><tr>
    <th>Kohde</th>
    <th class='num'>Määrä</th>
    <th>Yksikkö</th>
    <th class='num'>€/yks.</th>
    <th class='num'>Yht.</th>
    <th>Suunnit.</th>
    <th>Vyöhyke</th>
    <th>Huomio</th>
    <th class='col-del'></th>
  </tr></thead><tbody>`;
  let total = 0;
  state.special.forEach((s, i) => {
    const c = s.qty * s.unitPrice;
    const incl = isIncluded(s.plan, selectedPlan);
    if (incl) total += c;
    html += `<tr data-i='${i}'${!incl ? " class='inactive'" : ""}>
      <td><input value="${s.name}" data-k="name"></td>
      <td><input type="number" step="0.1" value="${s.qty}" data-k="qty"></td>
      <td><input value="${s.unit}" data-k="unit"></td>
      <td><input type="number" step="1" value="${s.unitPrice}" data-k="unitPrice"></td>
      <td class='calc'>${eur(c)}</td>
      <td><select class="plan-select plan-${s.plan}" data-k="plan">${planOpts(s.plan)}</select></td>
      <td><select class="zone-select zone-${s.zone}" data-k="zone">${zoneOpts(s.zone)}</select></td>
      <td><input value="${s.note || ''}" data-k="note"></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  html += `<tr class='total-row'><td colspan='4'>Suunnitelma ${selectedPlan} yhteensä</td><td class='num'>${eur(total)}</td><td colspan='4'></td></tr></tbody>`;
  tbl.innerHTML = html;
  bindRows(tbl, "special");
}

$("#addSpecial").addEventListener("click", () => {
  state.special.push({ name: "Uusi kustannus", qty: 1, unit: "kpl", unitPrice: 0, plan: "B", zone: "yhteinen", note: "" });
  saveState();
  renderAll();
});

function bindRows(tbl, listKey) {
  tbl.querySelectorAll("tbody tr[data-i]").forEach(tr => {
    const i = +tr.dataset.i;
    tr.querySelectorAll("input, select").forEach(inp => {
      const handler = () => {
        const k = inp.dataset.k;
        let val;
        if (inp.type === "number") val = +inp.value || 0;
        else val = inp.value;
        state[listKey][i][k] = val;
        saveState();
        if (listKey === "partitions") renderPartitions();
        else if (listKey === "fixtures") renderFixtures();
        else if (listKey === "special") renderSpecial();
        renderPlanSelector();
        document.querySelector(`#${tbl.id} tr[data-i='${i}'] [data-k='${k}']`)?.focus();
      };
      inp.addEventListener("change", handler);
      if (inp.type !== "checkbox" && inp.tagName !== "SELECT")
        inp.addEventListener("input", handler);
    });
    tr.querySelector("[data-del]").addEventListener("click", () => {
      state[listKey].splice(i, 1);
      saveState();
      renderAll();
    });
  });
}

// ---------- header ----------
$("#reset").addEventListener("click", () => {
  if (confirm("Palautetaanko oletustiedot?")) {
    state = cloneDefaults();
    asbestosPrice = ASBESTOS_REMOVAL_PRICE_PER_M2;
    selectedPlan = "B";
    saveState();
    renderAll();
  }
});

$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ data: state, _asbestosPrice: asbestosPrice }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `villa-tarkela-budjetti-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

$("#importBtn").addEventListener("click", () => $("#importFile").click());
$("#importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      state = obj.data || obj;
      if (obj._asbestosPrice) asbestosPrice = obj._asbestosPrice;
      selectedPlan = state.meta?.selectedPlan || "B";
      saveState();
      renderAll();
      alert("Tiedosto tuotu.");
    } catch (err) {
      alert("Virhe: " + err.message);
    }
  };
  reader.readAsText(file);
});

// ---------- migrations ----------
if (!state.extras) state.extras = DEFAULT_DATA.extras;
if (!state.plans) state.plans = DEFAULT_DATA.plans;
if (!state.zones) state.zones = DEFAULT_DATA.zones;
if (!state.partitionTypes) state.partitionTypes = DEFAULT_DATA.partitionTypes;
state.rooms.forEach(r => { if (!r.zone) r.zone = "kuiva"; });
state.fixtures.forEach(f => { if (!f.zone) f.zone = "marka"; });
state.special.forEach(x => { if (!x.zone) x.zone = "yhteinen"; });
state.partitions.forEach(p => { if (!p.zone) p.zone = "kuiva"; });

// ---------- init ----------
function renderAll() {
  renderPlanSelector();
  renderSummary();
  renderRooms();
  renderMaterials();
  renderPartitions();
  renderFixtures();
  renderSpecial();
}

renderAll();
