// Villa Tarkela - Budjettilaskuri (A/B/C-suunnitelmat)

const STATE_KEY = "villaTarkela.v2";
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
const fi = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 });
const fi2 = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const eur = (n) => fi.format(Math.round(n)) + " €";
const m2 = (n) => fi2.format(n) + " m²";
const m = (n) => fi2.format(n) + " m";

const isIncluded = (itemPlan, sel) => {
  if (itemPlan === "-" || !itemPlan) return false;
  return PLAN_RANK[itemPlan] <= PLAN_RANK[sel];
};

// ---------- room calculations ----------
const floorArea = r => r.w * r.l;
const perimeter = r => 2 * (r.w + r.l);
const wallArea = r => Math.max(0, perimeter(r) * r.h - (r.openings || 0));
const ceilArea = r => r.w * r.l;
const innerWallLen = r => Math.max(0, perimeter(r) - (r.outerWallLen || 0));

const findMat = (cat, id) => state.materials[cat].find(x => x.id === id) || { id, name: "?", price: 0 };

function roomCost(r, plan) {
  const fm = findMat("floor", r.floorMat);
  const wm = findMat("wall", r.wallMat);
  const cm = findMat("ceiling", r.ceilMat);
  const doFloor   = isIncluded(r.floorPlan, plan);
  const doWall    = isIncluded(r.wallPlan, plan);
  const doCeil    = isIncluded(r.ceilPlan, plan);
  const doFloorWorks = doFloor && isIncluded(state.extras.floorWorksFromPlan, plan);
  const fc = doFloor ? floorArea(r) * fm.price : 0;
  const wc = doWall  ? wallArea(r) * wm.price : 0;
  const cc = doCeil  ? ceilArea(r) * cm.price : 0;
  const ac = doFloor && r.asbestos ? floorArea(r) * asbestosPrice : 0;
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
    .reduce((s, p) => s + p.length * p.height * p.price, 0);
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
  $("#totalArea").textContent = m2(t.area);
  $("#totalAreaSub").textContent = state.rooms.length + " huonetta";
  $("#floor1Area").textContent = m2(areaByFloor("1. krs"));
  $("#floor1Sub").textContent = roomCountByFloor("1. krs") + " huonetta";
  $("#floor0Area").textContent = m2(areaByFloor("Kellari"));
  $("#floor0Sub").textContent = roomCountByFloor("Kellari") + " tilaa · ei remonttia";
  $("#innerWalls").textContent = m(t.innerLen);
  $("#innerWallsSub").textContent = m2(t.innerLen * 2.5);
  $("#outerWalls").textContent = m(t.outerLen);
  $("#outerWallsSub").textContent = m2(t.outerLen * 2.5);
  $("#grandTotal").textContent = eur(t.grand);
  $("#grandTotalSub").textContent = `Suunnitelma ${selectedPlan} · ${state.plans[selectedPlan].name}`;

  // remontoituvien huoneiden ala (rooms with any work)
  const renovatedArea = state.rooms
    .filter(r => isIncluded(r.floorPlan, selectedPlan) || isIncluded(r.wallPlan, selectedPlan) || isIncluded(r.ceilPlan, selectedPlan))
    .reduce((s, r) => s + floorArea(r), 0);
  const floorWorkArea = state.rooms
    .filter(r => isIncluded(r.floorPlan, selectedPlan))
    .reduce((s, r) => s + floorArea(r), 0);

  // Breakdown
  const rows = [
    ["Lattiapinnoitukset",                  t.floor],
    ["Seinäpintakäsittelyt",                t.wall],
    ["Kattopinnoitukset",                   t.ceiling],
    ["Asbestilattian purku",                t.asbestos],
    ["Lattialämmitysputket (omana työnä)",  t.floorHeating],
    ["Kipsivalu (urakka)",                  t.gypsum],
    ["Uudet väliseinät (gyproc)",           t.partitions],
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

  // Plan comparison
  const tABC = { A: totals("A"), B: totals("B"), C: totals("C") };
  let cmpHtml = "<thead><tr><th>Luokka</th><th class='num'>A — Kevyt</th><th class='num'>B — Keskitaso</th><th class='num'>C — Laaja</th></tr></thead><tbody>";
  [
    ["Lattiapinnoitukset",        "floor"],
    ["Seinäpinnat",                "wall"],
    ["Kattopinnat",                "ceiling"],
    ["Asbestin purku",             "asbestos"],
    ["Lattialämmitys (materiaalit)", "floorHeating"],
    ["Kipsivalu (urakka)",         "gypsum"],
    ["Uudet väliseinät",           "partitions"],
    ["Kalusteet",                  "fixtures"],
    ["Erityiskustannukset",        "special"]
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
  </tr>
  <tr>
    <td>Remontoitava ala</td>
    <td class='num'>${m2(state.rooms.filter(r => isIncluded(r.floorPlan, "A") || isIncluded(r.wallPlan, "A") || isIncluded(r.ceilPlan, "A")).reduce((s,r) => s + floorArea(r), 0))}</td>
    <td class='num'>${m2(state.rooms.filter(r => isIncluded(r.floorPlan, "B") || isIncluded(r.wallPlan, "B") || isIncluded(r.ceilPlan, "B")).reduce((s,r) => s + floorArea(r), 0))}</td>
    <td class='num'>${m2(state.rooms.filter(r => isIncluded(r.floorPlan, "C") || isIncluded(r.wallPlan, "C") || isIncluded(r.ceilPlan, "C")).reduce((s,r) => s + floorArea(r), 0))}</td>
  </tr>
  <tr>
    <td>Lattiaa uusittu</td>
    <td class='num'>${m2(state.rooms.filter(r => isIncluded(r.floorPlan, "A")).reduce((s,r) => s + floorArea(r), 0))}</td>
    <td class='num'>${m2(state.rooms.filter(r => isIncluded(r.floorPlan, "B")).reduce((s,r) => s + floorArea(r), 0))}</td>
    <td class='num'>${m2(state.rooms.filter(r => isIncluded(r.floorPlan, "C")).reduce((s,r) => s + floorArea(r), 0))}</td>
  </tr></tbody>`;
  $("#comparisonTable").innerHTML = cmpHtml;

  // Fixture summary
  let fxHtml = "<thead><tr><th>Varuste</th><th class='num'>Kpl</th><th>Suunnitelma</th></tr></thead><tbody>";
  state.fixtures.forEach(f => {
    if (!isIncluded(f.plan, selectedPlan)) return;
    if (f.qty > 0) fxHtml += `<tr><td>${f.name}${f.note ? ` <span style="color:var(--muted)">— ${f.note}</span>` : ""}</td><td class='num'>${f.qty}</td><td><span class="plan-tag plan-${f.plan}">${f.plan}</span></td></tr>`;
  });
  fxHtml += "</tbody>";
  $("#fixtureSummaryTable").innerHTML = fxHtml;

  // Room costs
  let rHtml = "<thead><tr><th>Tunn.</th><th>Huone</th><th>Kerros</th><th class='num'>Ala m²</th><th class='num'>Seinä m²</th><th class='num'>Lattia</th><th class='num'>Seinä</th><th class='num'>Katto</th><th class='num'>Asb.</th><th class='num'>Lattialämm.</th><th class='num'>Kipsivalu</th><th class='num'>Yht.</th></tr></thead><tbody>";
  let s = { f: 0, w: 0, c: 0, a: 0, fh: 0, gs: 0, t: 0, area: 0, wa: 0 };
  state.rooms.forEach(r => {
    const c = roomCost(r, selectedPlan);
    if (c.total === 0) return;
    s.f += c.floor; s.w += c.wall; s.c += c.ceiling; s.a += c.asbestos;
    s.fh += c.floorHeating; s.gs += c.gypsum; s.t += c.total;
    s.area += floorArea(r); s.wa += wallArea(r);
    rHtml += `<tr>
      <td>${r.id}</td>
      <td>${r.name}</td>
      <td>${r.floor}</td>
      <td class='num'>${fi2.format(floorArea(r))}</td>
      <td class='num'>${fi2.format(wallArea(r))}</td>
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
    <td class='num'>${fi2.format(s.wa)}</td>
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
    .map(m => `<option value="${m.id}"${m.id === selected ? " selected" : ""}>${m.name} (${m.price} €/m²)</option>`)
    .join("");
}

function planOpts(selected) {
  return ["-", "A", "B", "C"]
    .map(p => `<option value="${p}"${p === selected ? " selected" : ""}>${p}</option>`)
    .join("");
}

function renderRooms() {
  const tbl = $("#roomsTable");
  let html = `<thead><tr>
    <th class='col-id'>Tunn.</th>
    <th class='col-name'>Nimi</th>
    <th>Kerros</th>
    <th class='num' title='Leveys'>L</th>
    <th class='num' title='Pituus'>P</th>
    <th class='num' title='Korkeus'>K</th>
    <th class='num' title='Aukot m²'>Aukot</th>
    <th class='num' title='Ulkoseinä m'>Ulk.</th>
    <th class='col-mat'>Lattia</th>
    <th title='Lattian remontti suunnitelmissa'>L↺</th>
    <th class='col-mat'>Seinä</th>
    <th title='Seinän remontti suunnitelmissa'>S↺</th>
    <th class='col-mat'>Katto</th>
    <th title='Katon remontti suunnitelmissa'>K↺</th>
    <th class='col-asb' title='Asbestilattia'>Asb.</th>
    <th class='num'>Ala m²</th>
    <th class='num'>Seinä m²</th>
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
      <td class='calc'>${fi2.format(wallArea(r))}</td>
      <td class='calc'><strong>${eur(c.total)}</strong></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  const t = totals();
  html += `<tr class='total-row'>
    <td colspan='6'>Suunnitelma ${selectedPlan} yhteensä</td>
    <td class='num'>${fi2.format(state.rooms.reduce((s,r)=>s+(r.openings||0),0))}</td>
    <td class='num'>${fi2.format(t.outerLen)}</td>
    <td colspan='6'></td>
    <td></td>
    <td class='num'>${fi2.format(t.area)}</td>
    <td class='num'>${fi2.format(t.wallAr)}</td>
    <td class='num'><strong>${eur(t.floor + t.wall + t.ceiling + t.asbestos + t.floorHeating + t.gypsum)}</strong></td>
    <td></td>
  </tr></tbody>`;
  tbl.innerHTML = html;

  tbl.querySelectorAll("tbody tr[data-i]").forEach(tr => {
    const i = +tr.dataset.i;
    tr.querySelectorAll("input, select").forEach(inp => {
      inp.addEventListener("change", () => updateRoomField(i, inp));
      if (inp.type !== "checkbox" && inp.tagName !== "SELECT")
        inp.addEventListener("input", () => updateRoomField(i, inp));
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
  const next = document.querySelector(`tr[data-i='${i}'] [data-k='${k}']`);
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
    id: "uusi", name: "Uusi huone", floor: "1. krs",
    w: 3, l: 3, h: 2.5, openings: 2, outerWallLen: 0,
    floorMat: "parketti", wallMat: "maali", ceilMat: "maali",
    floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false
  });
  saveState();
  renderAll();
});

// ---------- materials ----------
function renderMaterials() {
  ["floor", "wall", "ceiling"].forEach(cat => {
    const tblId = cat === "floor" ? "floorMatsTable" : cat === "wall" ? "wallMatsTable" : "ceilingMatsTable";
    const tbl = $("#" + tblId);
    let html = `<thead><tr><th>Tunnus</th><th>Nimi</th><th class='num'>Hinta €/m²</th><th class='col-del'></th></tr></thead><tbody>`;
    state.materials[cat].forEach((mat, i) => {
      html += `<tr data-cat='${cat}' data-i='${i}'>
        <td><input value="${mat.id}" data-k="id"></td>
        <td><input value="${mat.name}" data-k="name"></td>
        <td><input type="number" step="1" value="${mat.price}" data-k="price"></td>
        <td><button class='del' data-del>×</button></td>
      </tr>`;
    });
    html += "</tbody>";
    tbl.innerHTML = html;
    tbl.querySelectorAll("tbody tr").forEach(tr => {
      const i = +tr.dataset.i;
      const cat = tr.dataset.cat;
      tr.querySelectorAll("input").forEach(inp => {
        inp.addEventListener("input", () => {
          const k = inp.dataset.k;
          state.materials[cat][i][k] = inp.type === "number" ? +inp.value : inp.value;
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
}

// ---------- partitions ----------
function renderPartitions() {
  const tbl = $("#partitionsTable");
  let html = `<thead><tr>
    <th>Kuvaus</th>
    <th class='num'>Pituus m</th>
    <th class='num'>Korkeus m</th>
    <th class='num'>€/m²</th>
    <th class='num'>Ala m²</th>
    <th class='num'>Hinta</th>
    <th>Suunnitelma</th>
    <th>Huomio</th>
    <th class='col-del'></th>
  </tr></thead><tbody>`;
  let total = 0;
  state.partitions.forEach((p, i) => {
    const a = p.length * p.height;
    const c = a * p.price;
    const incl = isIncluded(p.plan, selectedPlan);
    if (incl) total += c;
    html += `<tr data-i='${i}'${!incl ? " class='inactive'" : ""}>
      <td><input value="${p.name}" data-k="name"></td>
      <td><input type="number" step="0.1" value="${p.length}" data-k="length"></td>
      <td><input type="number" step="0.1" value="${p.height}" data-k="height"></td>
      <td><input type="number" step="1" value="${p.price}" data-k="price"></td>
      <td class='calc'>${fi2.format(a)}</td>
      <td class='calc'>${eur(c)}</td>
      <td><select class="plan-select plan-${p.plan}" data-k="plan">${planOpts(p.plan)}</select></td>
      <td><input value="${p.note || ''}" data-k="note"></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  html += `<tr class='total-row'><td colspan='5'>Suunnitelma ${selectedPlan} yhteensä</td><td class='num'>${eur(total)}</td><td colspan='3'></td></tr></tbody>`;
  tbl.innerHTML = html;
  bindRows(tbl, "partitions");
}

$("#addPartition").addEventListener("click", () => {
  state.partitions.push({ name: "Uusi väliseinä", length: 3, height: 2.5, price: 75, plan: "C", note: "" });
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
    <th>Suunnitelma</th>
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
      <td><input value="${f.note || ''}" data-k="note"></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  html += `<tr class='total-row'><td colspan='3'>Suunnitelma ${selectedPlan} yhteensä</td><td class='num'>${eur(total)}</td><td colspan='3'></td></tr></tbody>`;
  tbl.innerHTML = html;
  bindRows(tbl, "fixtures");
}

$("#addFixture").addEventListener("click", () => {
  state.fixtures.push({ name: "Uusi varuste", qty: 1, unitPrice: 0, plan: "B", note: "" });
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
    <th>Suunnitelma</th>
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
      <td><input value="${s.note || ''}" data-k="note"></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  html += `<tr class='total-row'><td colspan='4'>Suunnitelma ${selectedPlan} yhteensä</td><td class='num'>${eur(total)}</td><td colspan='3'></td></tr></tbody>`;
  tbl.innerHTML = html;
  bindRows(tbl, "special");
}

$("#addSpecial").addEventListener("click", () => {
  state.special.push({ name: "Uusi kustannus", qty: 1, unit: "kpl", unitPrice: 0, plan: "B", note: "" });
  saveState();
  renderAll();
});

// generic row binding
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
  if (confirm("Palautetaanko oletustiedot? Tämä poistaa kaikki muutokset.")) {
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
      alert("Tiedosto tuotu onnistuneesti.");
    } catch (err) {
      alert("Virhe: " + err.message);
    }
  };
  reader.readAsText(file);
});

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

// ensure state has extras (migration)
if (!state.extras) state.extras = DEFAULT_DATA.extras;
if (!state.plans) state.plans = DEFAULT_DATA.plans;

renderAll();
