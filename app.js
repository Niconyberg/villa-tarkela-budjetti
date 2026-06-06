// Villa Tarkela - Budjettilaskuri

const STATE_KEY = "villaTarkela.v1";
let asbestosPrice = ASBESTOS_REMOVAL_PRICE_PER_M2;
let state = loadState() || cloneDefaults();

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
  localStorage.setItem(STATE_KEY, JSON.stringify({ data: state, _asbestosPrice: asbestosPrice }));
}

// ---------- formatters ----------
const fi = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 });
const fi2 = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const eur = (n) => fi.format(Math.round(n)) + " €";
const m2 = (n) => fi2.format(n) + " m²";
const m = (n) => fi2.format(n) + " m";

// ---------- room calculations ----------
const floorArea = r => +(r.w * r.l);
const perimeter = r => 2 * (r.w + r.l);
const wallArea = r => Math.max(0, perimeter(r) * r.h - (r.openings || 0));
const ceilArea = r => r.w * r.l;
const outerWallArea = r => (r.outerWallLen || 0) * r.h;
const innerWallLen = r => Math.max(0, perimeter(r) - (r.outerWallLen || 0));

const findMat = (cat, id) => state.materials[cat].find(x => x.id === id) || { id, name: "?", price: 0 };

function roomCost(r) {
  const fm = findMat("floor", r.floorMat);
  const wm = findMat("wall", r.wallMat);
  const cm = findMat("ceiling", r.ceilMat);
  const fc = floorArea(r) * fm.price;
  const wc = wallArea(r) * wm.price;
  const cc = ceilArea(r) * cm.price;
  const ac = r.asbestos ? floorArea(r) * asbestosPrice : 0;
  return { floor: fc, wall: wc, ceiling: cc, asbestos: ac, total: fc + wc + cc + ac };
}

function totals() {
  let floor = 0, wall = 0, ceiling = 0, asbestos = 0, area = 0, wallAr = 0, ceilAr = 0;
  let innerLen = 0, outerLen = 0;
  state.rooms.forEach(r => {
    const c = roomCost(r);
    floor += c.floor; wall += c.wall; ceiling += c.ceiling; asbestos += c.asbestos;
    area += floorArea(r);
    wallAr += wallArea(r);
    ceilAr += ceilArea(r);
    innerLen += innerWallLen(r);
    outerLen += (r.outerWallLen || 0);
  });
  innerLen = innerLen / 2; // sisäseinät jaetaan kahdella koska jaettu kahden huoneen kesken
  const partitions = state.partitions.reduce((s, p) => s + p.length * p.height * p.price, 0);
  const fixtures = state.fixtures.reduce((s, f) => s + f.qty * f.unitPrice, 0);
  const special = state.special.reduce((s, x) => s + x.qty * x.unitPrice, 0);
  const grand = floor + wall + ceiling + asbestos + partitions + fixtures + special;
  return { floor, wall, ceiling, asbestos, partitions, fixtures, special, grand, area, wallAr, ceilAr, innerLen, outerLen };
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

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, "");
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

// ---------- tab navigation ----------
$$("nav button[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    $$("nav button[data-tab]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    $$(".tab").forEach(t => t.classList.remove("active"));
    $("#" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "summary") renderSummary();
  });
});

// ---------- summary rendering ----------
function renderSummary() {
  const t = totals();
  $("#totalArea").textContent = m2(t.area);
  $("#totalAreaSub").textContent = state.rooms.length + " huonetta";
  $("#floor1Area").textContent = m2(areaByFloor("1. krs"));
  $("#floor1Sub").textContent = roomCountByFloor("1. krs") + " huonetta";
  $("#floor0Area").textContent = m2(areaByFloor("Kellari"));
  $("#floor0Sub").textContent = roomCountByFloor("Kellari") + " tilaa";
  $("#innerWalls").textContent = m(t.innerLen);
  $("#innerWallsSub").textContent = m2(t.innerLen * 2.5) + " (h=2.5m)";
  $("#outerWalls").textContent = m(t.outerLen);
  $("#outerWallsSub").textContent = m2(t.outerLen * 2.5);
  $("#grandTotal").textContent = eur(t.grand);

  // Cost breakdown
  const rows = [
    ["Lattiapinnoitukset",       t.floor],
    ["Seinäpintakäsittelyt",     t.wall],
    ["Kattopinnoitukset",        t.ceiling],
    ["Asbestilattian purku",     t.asbestos],
    ["Uudet väliseinät (gyproc)", t.partitions],
    ["Kalusteet ja varusteet",   t.fixtures],
    ["Erityiskustannukset",      t.special]
  ];
  let html = "<thead><tr><th>Luokka</th><th class='num'>Hinta</th><th class='num' style='width:80px'>%</th></tr></thead><tbody>";
  rows.forEach(([name, val]) => {
    const pct = t.grand > 0 ? (val / t.grand * 100) : 0;
    html += `<tr><td>${name}</td><td class='num'>${eur(val)}</td><td class='num'>${pct.toFixed(1)} %</td></tr>`;
  });
  html += `<tr class='total-row'><td>Yhteensä</td><td class='num'>${eur(t.grand)}</td><td class='num'>100.0 %</td></tr>`;
  html += "</tbody>";
  $("#breakdownTable").innerHTML = html;

  // Fixture summary - count key items
  const counts = {};
  state.fixtures.forEach(f => { counts[f.name] = (counts[f.name] || 0) + f.qty; });
  const keyFixtures = [
    "WC-istuin", "Pesuallas + hana", "Suihkukaappi (allas + hana + seinät)", "Suihku (Pesuhuone)",
    "Saunan kiuas (sähkö, 8 kW)", "Saunan lauteet ja paneelit", "Lattiakaivo asennettuna"
  ];
  let fxHtml = "<thead><tr><th>Varuste</th><th class='num'>Kpl</th></tr></thead><tbody>";
  state.fixtures.forEach(f => {
    if (f.qty > 0) fxHtml += `<tr><td>${f.name}${f.note ? ` <span style="color:var(--muted)">— ${f.note}</span>` : ""}</td><td class='num'>${f.qty}</td></tr>`;
  });
  fxHtml += "</tbody>";
  $("#fixtureSummaryTable").innerHTML = fxHtml;

  // Room costs
  let rHtml = "<thead><tr><th>Tunn.</th><th>Huone</th><th>Kerros</th><th class='num'>Ala m²</th><th class='num'>Seinä m²</th><th class='num'>Lattia</th><th class='num'>Seinä</th><th class='num'>Katto</th><th class='num'>Asbesti</th><th class='num'>Yht.</th></tr></thead><tbody>";
  let sumF = 0, sumW = 0, sumC = 0, sumA = 0, sumT = 0, sumArea = 0, sumWA = 0;
  state.rooms.forEach(r => {
    const c = roomCost(r);
    sumF += c.floor; sumW += c.wall; sumC += c.ceiling; sumA += c.asbestos; sumT += c.total;
    sumArea += floorArea(r); sumWA += wallArea(r);
    rHtml += `<tr>
      <td>${r.id}</td>
      <td>${r.name}</td>
      <td>${r.floor}</td>
      <td class='num'>${fi2.format(floorArea(r))}</td>
      <td class='num'>${fi2.format(wallArea(r))}</td>
      <td class='num'>${eur(c.floor)}</td>
      <td class='num'>${eur(c.wall)}</td>
      <td class='num'>${eur(c.ceiling)}</td>
      <td class='num'>${c.asbestos > 0 ? eur(c.asbestos) : "–"}</td>
      <td class='num'><strong>${eur(c.total)}</strong></td>
    </tr>`;
  });
  rHtml += `<tr class='total-row'>
    <td colspan='3'>Yhteensä</td>
    <td class='num'>${fi2.format(sumArea)}</td>
    <td class='num'>${fi2.format(sumWA)}</td>
    <td class='num'>${eur(sumF)}</td>
    <td class='num'>${eur(sumW)}</td>
    <td class='num'>${eur(sumC)}</td>
    <td class='num'>${eur(sumA)}</td>
    <td class='num'>${eur(sumT)}</td>
  </tr></tbody>`;
  $("#roomCostsTable").innerHTML = rHtml;
}

// ---------- rooms table ----------
function matOptions(cat, selected) {
  return state.materials[cat]
    .map(m => `<option value="${m.id}"${m.id === selected ? " selected" : ""}>${m.name} (${m.price} €/m²)</option>`)
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
    <th class='num' title='Ovi- ja ikkuna-aukot m²'>Aukot</th>
    <th class='num' title='Ulkoseinän pituus huoneessa, m'>Ulkos.</th>
    <th class='col-mat'>Lattia</th>
    <th class='col-mat'>Seinä</th>
    <th class='col-mat'>Katto</th>
    <th class='col-asb' title='Asbestilattia'>Asb.</th>
    <th class='num'>Ala m²</th>
    <th class='num'>Seinä m²</th>
    <th class='num'>Hinta</th>
    <th class='col-del'></th>
  </tr></thead><tbody>`;
  state.rooms.forEach((r, i) => {
    const c = roomCost(r);
    html += `<tr data-i='${i}'>
      <td><input value="${r.id}" data-k="id"></td>
      <td><input value="${r.name}" data-k="name"></td>
      <td><input value="${r.floor}" data-k="floor"></td>
      <td><input type="number" step="0.05" value="${r.w}" data-k="w"></td>
      <td><input type="number" step="0.05" value="${r.l}" data-k="l"></td>
      <td><input type="number" step="0.05" value="${r.h}" data-k="h"></td>
      <td><input type="number" step="0.1" value="${r.openings}" data-k="openings"></td>
      <td><input type="number" step="0.1" value="${r.outerWallLen}" data-k="outerWallLen"></td>
      <td><select data-k="floorMat">${matOptions("floor", r.floorMat)}</select></td>
      <td><select data-k="wallMat">${matOptions("wall", r.wallMat)}</select></td>
      <td><select data-k="ceilMat">${matOptions("ceiling", r.ceilMat)}</select></td>
      <td class='checkbox-cell'><input type="checkbox" data-k="asbestos" ${r.asbestos ? "checked" : ""}></td>
      <td class='calc'>${fi2.format(floorArea(r))}</td>
      <td class='calc'>${fi2.format(wallArea(r))}</td>
      <td class='calc'><strong>${eur(c.total)}</strong></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  // Totals row
  const t = totals();
  html += `<tr class='total-row'>
    <td colspan='6'>Yhteensä</td>
    <td class='num'>${fi2.format(state.rooms.reduce((s,r)=>s+(r.openings||0),0))}</td>
    <td class='num'>${fi2.format(t.outerLen)}</td>
    <td colspan='3'></td>
    <td></td>
    <td class='num'>${fi2.format(t.area)}</td>
    <td class='num'>${fi2.format(t.wallAr)}</td>
    <td class='num'><strong>${eur(t.floor + t.wall + t.ceiling + t.asbestos)}</strong></td>
    <td></td>
  </tr>`;
  html += "</tbody>";
  tbl.innerHTML = html;

  tbl.querySelectorAll("tbody tr[data-i]").forEach(tr => {
    const i = +tr.dataset.i;
    tr.querySelectorAll("input, select").forEach(inp => {
      inp.addEventListener("change", () => updateRoomField(i, inp));
      if (inp.type !== "checkbox") inp.addEventListener("input", () => updateRoomField(i, inp));
    });
    tr.querySelector("[data-del]").addEventListener("click", () => {
      if (confirm(`Poistetaanko huone "${state.rooms[i].name}"?`)) {
        state.rooms.splice(i, 1);
        saveState();
        renderRooms();
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
  // Light re-render: just update calc cells on this row + totals row
  // Simpler: full re-render of rooms table to keep totals in sync
  renderRooms();
  // Restore focus
  const sel = `tr[data-i='${i}'] [data-k='${k}']`;
  const next = document.querySelector(sel);
  if (next) {
    next.focus();
    if (next.type === "text" || next.type === "number") {
      const v = next.value;
      next.setSelectionRange?.(v.length, v.length);
    }
  }
}

$("#addRoom").addEventListener("click", () => {
  state.rooms.push({
    id: "uusi",
    name: "Uusi huone",
    floor: "1. krs",
    w: 3, l: 3, h: 2.5,
    openings: 2,
    outerWallLen: 0,
    floorMat: "parketti",
    wallMat: "maali",
    ceilMat: "maali",
    asbestos: false
  });
  saveState();
  renderRooms();
});

// ---------- materials ----------
function renderMaterials() {
  ["floor", "wall", "ceiling"].forEach(cat => {
    const tbl = $(`#${cat === "floor" ? "floorMats" : cat === "wall" ? "wallMats" : "ceilingMats"}Table`);
    let html = `<thead><tr><th>Tunnus</th><th>Nimi</th><th class='num'>Hinta €/m²</th><th class='col-del'></th></tr></thead><tbody>`;
    state.materials[cat].forEach((m, i) => {
      html += `<tr data-cat='${cat}' data-i='${i}'>
        <td><input value="${m.id}" data-k="id"></td>
        <td><input value="${m.name}" data-k="name"></td>
        <td><input type="number" step="1" value="${m.price}" data-k="price"></td>
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
        });
      });
      tr.querySelector("[data-del]").addEventListener("click", () => {
        if (confirm("Poistetaanko materiaali?")) {
          state.materials[cat].splice(i, 1);
          saveState();
          renderMaterials();
          renderRooms();
        }
      });
    });
  });

  $("#asbestosPrice").value = asbestosPrice;
  $("#asbestosPrice").oninput = (e) => {
    asbestosPrice = +e.target.value || 0;
    saveState();
  };

  $$("[data-add-mat]").forEach(btn => {
    btn.onclick = () => {
      const cat = btn.dataset.addMat;
      state.materials[cat].push({ id: "uusi-" + Date.now(), name: "Uusi materiaali", price: 0 });
      saveState();
      renderMaterials();
      renderRooms();
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
    <th>Huomio</th>
    <th class='col-del'></th>
  </tr></thead><tbody>`;
  let total = 0;
  state.partitions.forEach((p, i) => {
    const a = p.length * p.height;
    const c = a * p.price;
    total += c;
    html += `<tr data-i='${i}'>
      <td><input value="${p.name}" data-k="name"></td>
      <td><input type="number" step="0.1" value="${p.length}" data-k="length"></td>
      <td><input type="number" step="0.1" value="${p.height}" data-k="height"></td>
      <td><input type="number" step="1" value="${p.price}" data-k="price"></td>
      <td class='calc'>${fi2.format(a)}</td>
      <td class='calc'>${eur(c)}</td>
      <td><input value="${p.note || ''}" data-k="note"></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  html += `<tr class='total-row'><td colspan='5'>Yhteensä</td><td class='num'>${eur(total)}</td><td colspan='2'></td></tr></tbody>`;
  tbl.innerHTML = html;
  tbl.querySelectorAll("tbody tr[data-i]").forEach(tr => {
    const i = +tr.dataset.i;
    tr.querySelectorAll("input").forEach(inp => {
      inp.addEventListener("input", () => {
        const k = inp.dataset.k;
        state.partitions[i][k] = inp.type === "number" ? +inp.value : inp.value;
        saveState();
        renderPartitions();
        document.querySelector(`tr[data-i='${i}'] [data-k='${k}']`)?.focus();
      });
    });
    tr.querySelector("[data-del]").addEventListener("click", () => {
      state.partitions.splice(i, 1);
      saveState();
      renderPartitions();
    });
  });
}

$("#addPartition").addEventListener("click", () => {
  state.partitions.push({ name: "Uusi väliseinä", length: 3, height: 2.5, price: 75, note: "" });
  saveState();
  renderPartitions();
});

// ---------- fixtures ----------
function renderFixtures() {
  const tbl = $("#fixturesTable");
  let html = `<thead><tr>
    <th>Varuste / kaluste</th>
    <th class='num'>Kpl</th>
    <th class='num'>€/kpl</th>
    <th class='num'>Yht.</th>
    <th>Huomio</th>
    <th class='col-del'></th>
  </tr></thead><tbody>`;
  let total = 0;
  state.fixtures.forEach((f, i) => {
    const c = f.qty * f.unitPrice;
    total += c;
    html += `<tr data-i='${i}'>
      <td><input value="${f.name}" data-k="name"></td>
      <td><input type="number" step="1" value="${f.qty}" data-k="qty"></td>
      <td><input type="number" step="1" value="${f.unitPrice}" data-k="unitPrice"></td>
      <td class='calc'>${eur(c)}</td>
      <td><input value="${f.note || ''}" data-k="note"></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  html += `<tr class='total-row'><td colspan='3'>Yhteensä</td><td class='num'>${eur(total)}</td><td colspan='2'></td></tr></tbody>`;
  tbl.innerHTML = html;
  tbl.querySelectorAll("tbody tr[data-i]").forEach(tr => {
    const i = +tr.dataset.i;
    tr.querySelectorAll("input").forEach(inp => {
      inp.addEventListener("input", () => {
        const k = inp.dataset.k;
        state.fixtures[i][k] = inp.type === "number" ? +inp.value : inp.value;
        saveState();
        renderFixtures();
        document.querySelector(`#fixturesTable tr[data-i='${i}'] [data-k='${k}']`)?.focus();
      });
    });
    tr.querySelector("[data-del]").addEventListener("click", () => {
      state.fixtures.splice(i, 1);
      saveState();
      renderFixtures();
    });
  });
}

$("#addFixture").addEventListener("click", () => {
  state.fixtures.push({ name: "Uusi varuste", qty: 1, unitPrice: 0, note: "" });
  saveState();
  renderFixtures();
});

// ---------- special costs ----------
function renderSpecial() {
  const tbl = $("#specialTable");
  let html = `<thead><tr>
    <th>Kohde</th>
    <th class='num'>Määrä</th>
    <th>Yksikkö</th>
    <th class='num'>€/yks.</th>
    <th class='num'>Yht.</th>
    <th>Huomio</th>
    <th class='col-del'></th>
  </tr></thead><tbody>`;
  let total = 0;
  state.special.forEach((s, i) => {
    const c = s.qty * s.unitPrice;
    total += c;
    html += `<tr data-i='${i}'>
      <td><input value="${s.name}" data-k="name"></td>
      <td><input type="number" step="0.1" value="${s.qty}" data-k="qty"></td>
      <td><input value="${s.unit}" data-k="unit"></td>
      <td><input type="number" step="1" value="${s.unitPrice}" data-k="unitPrice"></td>
      <td class='calc'>${eur(c)}</td>
      <td><input value="${s.note || ''}" data-k="note"></td>
      <td><button class='del' data-del>×</button></td>
    </tr>`;
  });
  html += `<tr class='total-row'><td colspan='4'>Yhteensä</td><td class='num'>${eur(total)}</td><td colspan='2'></td></tr></tbody>`;
  tbl.innerHTML = html;
  tbl.querySelectorAll("tbody tr[data-i]").forEach(tr => {
    const i = +tr.dataset.i;
    tr.querySelectorAll("input").forEach(inp => {
      inp.addEventListener("input", () => {
        const k = inp.dataset.k;
        state.special[i][k] = inp.type === "number" ? +inp.value : inp.value;
        saveState();
        renderSpecial();
        document.querySelector(`#specialTable tr[data-i='${i}'] [data-k='${k}']`)?.focus();
      });
    });
    tr.querySelector("[data-del]").addEventListener("click", () => {
      state.special.splice(i, 1);
      saveState();
      renderSpecial();
    });
  });
}

$("#addSpecial").addEventListener("click", () => {
  state.special.push({ name: "Uusi kustannus", qty: 1, unit: "kpl", unitPrice: 0, note: "" });
  saveState();
  renderSpecial();
});

// ---------- header actions ----------
$("#reset").addEventListener("click", () => {
  if (confirm("Palautetaanko oletustiedot? Tämä poistaa kaikki muutokset.")) {
    state = cloneDefaults();
    asbestosPrice = ASBESTOS_REMOVAL_PRICE_PER_M2;
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
      saveState();
      renderAll();
      alert("Tiedosto tuotu onnistuneesti.");
    } catch (err) {
      alert("Virhe tiedoston lukemisessa: " + err.message);
    }
  };
  reader.readAsText(file);
});

// ---------- init ----------
function renderAll() {
  renderSummary();
  renderRooms();
  renderMaterials();
  renderPartitions();
  renderFixtures();
  renderSpecial();
}

renderAll();
