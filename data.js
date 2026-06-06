// Villa Tarkela - oletustiedot
// Asunto on asumiskuntoinen - ei sähkö-/LVI-suunnittelua.
// Plan tagit: "A" = sis. A, B, C · "B" = sis. B, C · "C" = vain C · "-" = ei sis. mihinkään
// Asbestilattian purku lasketaan automaattisesti niistä huoneista joissa floorPlan ≠ "-" ja asbestos = true.

const ASBESTOS_REMOVAL_PRICE_PER_M2 = 80;
const PLAN_RANK = { "-": 0, "A": 1, "B": 2, "C": 3 };

function planIncludes(itemPlan, selectedPlan) {
  if (itemPlan === "-" || !itemPlan) return false;
  return PLAN_RANK[itemPlan] <= PLAN_RANK[selectedPlan];
}

const DEFAULT_DATA = {
  meta: {
    name: "Villa Tarkela",
    year: 1968,
    defaultHeight: 2.5,
    currency: "€",
    selectedPlan: "B"
  },

  plans: {
    A: { name: "Kevyt", desc: "Asbestipurku päätiloissa · 2 WC-pyttyä · 1 KH:n kalusteet · päätilojen maalaus. EI lattialämmitystä." },
    B: { name: "Keskitaso", desc: "A + asuintilojen lattiat (lattialämmitys + kipsivalu) + maalaus · yläkerran märkätilojen täysuusinta · sauna" },
    C: { name: "Laaja", desc: "B + sisäseinien gyproc-uusinta · kattopaneelit kauttaaltaan. (Kellariin ei kosketa missään suunnitelmassa.)" }
  },

  // B/C: kaikkien uusittavien lattioiden alle lattialämmitysputket + kipsivalu
  extras: {
    floorHeatingPipesPerM2: 22,    // omana työnä — vain materiaalit
    floorHeatingPipesLabel: "Lattialämmitysputket (omana työnä, vain materiaalit)",
    gypsumScreedPerM2: 45,         // urakka
    gypsumScreedLabel: "Kipsivalu (urakka)",
    floorWorksFromPlan: "B"        // sovelletaan B:stä alkaen
  },

  materials: {
    floor: [
      { id: "parketti",         name: "Parketti",                       price: 65 },
      { id: "laminaatti",       name: "Laminaatti",                     price: 35 },
      { id: "vinyyli",          name: "Vinyylilankku",                  price: 45 },
      { id: "klinkkeri-lattia", name: "Klinkkeri + vedeneristys",       price: 110 },
      { id: "betoni",           name: "Betonihionta / pinnoite",        price: 55 },
      { id: "lautalattia",      name: "Lautalattia (mänty)",            price: 70 }
    ],
    wall: [
      { id: "maali",            name: "Maali + pohjustus",              price: 18 },
      { id: "tapetti",          name: "Tapetti",                        price: 28 },
      { id: "klinkkeri-seina",  name: "Klinkkeri + vedeneristys",       price: 105 },
      { id: "saunapaneeli",     name: "Saunapaneeli (haapa/leppä)",     price: 65 },
      { id: "paneeli",          name: "Puupaneeli",                     price: 50 },
      { id: "gyproc-maali",     name: "Gyproc + tasoite + maali",       price: 45 }
    ],
    ceiling: [
      { id: "maali",            name: "Maali (vanhan päälle)",          price: 14 },
      { id: "gyproc-katto",     name: "Gyproc + tasoite + maali",       price: 38 },
      { id: "paneeli",          name: "Sisäkattopaneeli (mänty/MDF)",   price: 55 },
      { id: "saunapaneeli",     name: "Saunapaneeli",                   price: 60 },
      { id: "akustopaneeli",    name: "Akustopaneeli",                  price: 75 }
    ]
  },

  // Huoneet: per-työ plan-tagi (floorPlan, wallPlan, ceilPlan).
  // "A" = tehdään plan A:ssa (ja siten myös B:ssä ja C:ssä)
  // asbestos = boolean: jos true ja floorPlan ≠ "-", asbestipurku lasketaan automaattisesti
  rooms: [
    // 1. KERROS
    { id: "101", name: "Tekninen tila / komero", floor: "1. krs", w: 1.0, l: 1.5, h: 2.5, openings: 0,   outerWallLen: 0,
      floorMat: "betoni",           wallMat: "maali",           ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },

    { id: "102", name: "Eteishalli",             floor: "1. krs", w: 4.4, l: 3.5, h: 2.5, openings: 4,   outerWallLen: 3.5,
      floorMat: "klinkkeri-lattia", wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "C", asbestos: false },

    { id: "103", name: "Keittiö",                floor: "1. krs", w: 2.0, l: 3.0, h: 2.5, openings: 3,   outerWallLen: 2.0,
      floorMat: "vinyyli",          wallMat: "maali",           ceilMat: "maali",
      floorPlan: "-", wallPlan: "C", ceilPlan: "-", asbestos: false },

    { id: "104", name: "Ruokailutila",           floor: "1. krs", w: 4.4, l: 5.0, h: 2.5, openings: 6,   outerWallLen: 9.4,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "A", ceilPlan: "B", asbestos: true },

    { id: "105", name: "Olohuone",               floor: "1. krs", w: 5.4, l: 4.4, h: 2.5, openings: 8,   outerWallLen: 5.4,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "A", ceilPlan: "B", asbestos: true },

    { id: "106", name: "Työhuone",               floor: "1. krs", w: 3.0, l: 3.0, h: 2.5, openings: 3,   outerWallLen: 6.0,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "C", asbestos: true },

    { id: "107", name: "WC 1",                   floor: "1. krs", w: 1.0, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "108", name: "Jakelu / pukeutuminen",  floor: "1. krs", w: 1.8, l: 2.2, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "C", wallPlan: "C", ceilPlan: "C", asbestos: false },

    { id: "109", name: "Käytävä",                floor: "1. krs", w: 2.4, l: 3.0, h: 2.5, openings: 6,   outerWallLen: 0,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "A", ceilPlan: "B", asbestos: true },

    { id: "110", name: "Makuuhuone 1",           floor: "1. krs", w: 3.5, l: 3.5, h: 2.5, openings: 3,   outerWallLen: 3.5,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "111", name: "Vierashuone",            floor: "1. krs", w: 3.5, l: 2.0, h: 2.5, openings: 2,   outerWallLen: 0,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "C", wallPlan: "B", ceilPlan: "C", asbestos: false },

    { id: "112", name: "Kylpyhuone (KH)",        floor: "1. krs", w: 1.6, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "113", name: "Makuuhuone 2",           floor: "1. krs", w: 2.4, l: 4.0, h: 2.5, openings: 2.5, outerWallLen: 2.4,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "114", name: "Makuuhuone 3",           floor: "1. krs", w: 2.4, l: 4.0, h: 2.5, openings: 2.5, outerWallLen: 2.4,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "115", name: "Perhehuone",             floor: "1. krs", w: 3.4, l: 2.7, h: 2.5, openings: 3,   outerWallLen: 3.4,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "116", name: "Kodinhoitohuone",        floor: "1. krs", w: 2.4, l: 1.9, h: 2.5, openings: 2,   outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "117", name: "Pukuhuone",              floor: "1. krs", w: 2.7, l: 3.5, h: 2.5, openings: 2,   outerWallLen: 2.7,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "C", wallPlan: "B", ceilPlan: "C", asbestos: false },

    { id: "118", name: "Pesuhuone",              floor: "1. krs", w: 1.9, l: 2.1, h: 2.5, openings: 1.5, outerWallLen: 1.9,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "119", name: "Sauna",                  floor: "1. krs", w: 2.0, l: 2.1, h: 2.3, openings: 1.5, outerWallLen: 2.0,
      floorMat: "klinkkeri-lattia", wallMat: "saunapaneeli",    ceilMat: "saunapaneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "191", name: "WC 2",                   floor: "1. krs", w: 1.0, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false },

    // KELLARI - ei kosketa missään suunnitelmassa paitsi WC C:ssä
    { id: "01", name: "Harrastetila / sisäänk.", floor: "Kellari", w: 5.9,  l: 3.4,  h: 2.4, openings: 3, outerWallLen: 5.9,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },

    { id: "02", name: "Varasto 1",               floor: "Kellari", w: 1.1,  l: 2.95, h: 2.4, openings: 1, outerWallLen: 2.95,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },

    { id: "03", name: "Lämmityshuone",           floor: "Kellari", w: 2.2,  l: 2.87, h: 2.4, openings: 1, outerWallLen: 0,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },

    { id: "04", name: "Varasto 2",               floor: "Kellari", w: 3.49, l: 2.87, h: 2.4, openings: 1, outerWallLen: 3.49,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },

    { id: "05", name: "WC (kellari)",            floor: "Kellari", w: 1.5,  l: 1.6,  h: 2.4, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },

    { id: "07", name: "Autotalli",               floor: "Kellari", w: 5.9,  l: 4.88, h: 2.4, openings: 8, outerWallLen: 10.78,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false }
  ],

  // Uusien väliseinien gyproc-rakentaminen (vain C-suunnitelmassa)
  partitions: [
    { name: "Sisäseinien gyproc-uusinta (asuintilat, ei märkätilat)", length: 30, height: 2.5, price: 75, plan: "C", note: "Arvio: 30 m olemassaolevia sisäseiniä uusittu" }
  ],

  // Kalusteet ja varusteet
  fixtures: [
    // A — kevyt
    { name: "WC-istuin",                              qty: 2, unitPrice: 450,  plan: "A", note: "WC 107 + WC 191" },
    { name: "Pesuallas + hana (Kylpyhuone 112)",      qty: 1, unitPrice: 320,  plan: "A", note: "Yhden kylpyhuoneen kalusteet" },

    // B — märkätilojen täysuusinta (yläkerta)
    { name: "Suihkukaappi (KH 112)",                  qty: 1, unitPrice: 1300, plan: "B", note: "Allas + hana + suihku + seinät" },
    { name: "Suihku (Pesuhuone 118)",                 qty: 1, unitPrice: 900,  plan: "B", note: "Saunan eteinen, kahden hengen suihku" },
    { name: "Pesualtaat märkätiloihin (uusittu)",     qty: 3, unitPrice: 320,  plan: "B", note: "WC 107, WC 191, Pesuhuone 118" },
    { name: "Hanat ja vesikalusteet (märkätilat)",    qty: 5, unitPrice: 220,  plan: "B", note: "Kaikki yläkerran märkätilat" },
    { name: "Lattiakaivot uusittu",                   qty: 4, unitPrice: 380,  plan: "B", note: "KH 112, Pesu 118, WC 107, WC 191" },
    { name: "Saunan kiuas (sähkö, 8 kW)",             qty: 1, unitPrice: 1400, plan: "B", note: "Sauna 119" },
    { name: "Saunan lauteet + paneelit",              qty: 1, unitPrice: 1800, plan: "B", note: "Asennettuna" },
    { name: "Saunan ovi (lasi)",                      qty: 1, unitPrice: 450,  plan: "B", note: "" },

  ],

  // Erityiskustannukset (purkutyöt, asbesti, suunnittelu)
  // EI sisällä sähkö-/LVI-suunnittelua koska asunto on asumiskuntoinen
  special: [
    // A — asbestityöt pakollisia
    { name: "Asbestikartoitus (sertifioitu)",            qty: 1, unit: "kpl", unitPrice: 700,  plan: "A", note: "Pakollinen ennen purkutöitä" },
    { name: "Asbestipurun urakkapalkkio + valmistelu",   qty: 1, unit: "krt", unitPrice: 2500, plan: "A", note: "Suojaukset, alipaineistus, jätehuolto" },
    { name: "Jätelava (8 m³)",                           qty: 2, unit: "kpl", unitPrice: 500,  plan: "A", note: "Asbestipurku + pintapurku" },

    // B — märkätilauusinta + asuintilojen pintaremontti
    { name: "Vanhojen tapettien / pintamaalien poisto",  qty: 40, unit: "m²", unitPrice: 12,   plan: "B", note: "Asuintilojen seinät" },
    { name: "Lisäjätelava",                              qty: 1, unit: "kpl", unitPrice: 500,  plan: "B", note: "Märkätilojen purkujäte" },

    // C — sisäseinien uusinta + kattopaneelit
    { name: "Vanhojen väliseinien purku",                qty: 15, unit: "m²", unitPrice: 35,   plan: "C", note: "Ennen gyproc-uusintaa" },
    { name: "Rakennuslupa / muutosilmoitus",             qty: 1,  unit: "kpl", unitPrice: 800, plan: "C", note: "Jos rakenteellisia muutoksia" },
    { name: "Sisustussuunnittelu",                       qty: 1,  unit: "kpl", unitPrice: 2500, plan: "C", note: "Vapaaehtoinen" }
  ]
};
