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
    A: { name: "Kevyt (ei lattialämmitystä)", desc: "Asbestipurku 4 päätilassa · niiden uudet parketit · päätilojen maalaus · 2 WC-pyttyä · KH 112:n pesuallas + hana. EI lattialämmitystä, ei märkätilojen täysremonttia." },
    B: { name: "Laajempi pintaremontti (ei lattialämmitystä)", desc: "A + asuintilojen lattiat ja maalaus kauttaaltaan · sisäkattopaneelit päätiloihin · saunan kiuas + lisäkalusteet · märkätilojen pintapäivitys (hanat, altaat). EI lattialämmitystä, ei vesieristyksen avaamista." },
    C: { name: "Lattialämmitys + täysremontti", desc: "Vesikiertoinen lattialämmitys (liitetään olemassa olevaan maalämpöön). Tämä pakottaa: kaikki lattiat uusittavat (+ kipsivalu) · kaikki väliseinät uusittavat · märkätilojen täysremontti (vesieristys + laatat + kalusteet) · saunan täysremontti · kattopaneelit kauttaaltaan." }
  },

  // C: vesikiertoiset lattialämmitysputket (omana työnä) + kipsivalu (urakka)
  // Talossa maalämpöjärjestelmä, lattialämmitys liitetään olemassa olevaan järjestelmään.
  extras: {
    floorHeatingPipesPerM2: 22,    // putket + jakotukki + materiaalit; omana työnä
    floorHeatingPipesLabel: "Vesikiertoiset lattialämmitysputket (omana työnä, materiaalit)",
    gypsumScreedPerM2: 45,         // kipsivalu lattialämmityksen päälle, urakka
    gypsumScreedLabel: "Kipsivalu (urakka, lattialämmityksen päälle)",
    floorWorksFromPlan: "C",       // vain C:ssä lattialämmitys
    maalampoLink: 800              // putkimiehen kytkentätyö olemassa olevaan maalämpöön
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
      floorPlan: "C", wallPlan: "B", ceilPlan: "C", asbestos: false },

    { id: "103", name: "Keittiö",                floor: "1. krs", w: 2.0, l: 3.0, h: 2.5, openings: 3,   outerWallLen: 2.0,
      floorMat: "vinyyli",          wallMat: "maali",           ceilMat: "maali",
      floorPlan: "C", wallPlan: "B", ceilPlan: "-", asbestos: false },

    { id: "104", name: "Ruokailutila",           floor: "1. krs", w: 4.4, l: 5.0, h: 2.5, openings: 6,   outerWallLen: 9.4,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "A", ceilPlan: "B", asbestos: true },

    { id: "105", name: "Olohuone",               floor: "1. krs", w: 5.4, l: 4.4, h: 2.5, openings: 8,   outerWallLen: 5.4,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "A", ceilPlan: "B", asbestos: true },

    { id: "106", name: "Työhuone",               floor: "1. krs", w: 3.0, l: 3.0, h: 2.5, openings: 3,   outerWallLen: 6.0,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "107", name: "WC 1",                   floor: "1. krs", w: 1.0, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "C", wallPlan: "C", ceilPlan: "C", asbestos: false },

    { id: "108", name: "Jakelu / pukeutuminen",  floor: "1. krs", w: 1.8, l: 2.2, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "109", name: "Käytävä",                floor: "1. krs", w: 2.4, l: 3.0, h: 2.5, openings: 6,   outerWallLen: 0,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "A", ceilPlan: "B", asbestos: true },

    { id: "110", name: "Makuuhuone 1",           floor: "1. krs", w: 3.5, l: 3.5, h: 2.5, openings: 3,   outerWallLen: 3.5,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "111", name: "Vierashuone",            floor: "1. krs", w: 3.5, l: 2.0, h: 2.5, openings: 2,   outerWallLen: 0,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "112", name: "Kylpyhuone (KH)",        floor: "1. krs", w: 1.6, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "C", wallPlan: "C", ceilPlan: "C", asbestos: false },

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
      floorPlan: "C", wallPlan: "C", ceilPlan: "C", asbestos: false },

    { id: "117", name: "Pukuhuone",              floor: "1. krs", w: 2.7, l: 3.5, h: 2.5, openings: 2,   outerWallLen: 2.7,
      floorMat: "parketti",         wallMat: "maali",           ceilMat: "paneeli",
      floorPlan: "B", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "118", name: "Pesuhuone",              floor: "1. krs", w: 1.9, l: 2.1, h: 2.5, openings: 1.5, outerWallLen: 1.9,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "C", wallPlan: "C", ceilPlan: "C", asbestos: false },

    { id: "119", name: "Sauna",                  floor: "1. krs", w: 2.0, l: 2.1, h: 2.3, openings: 1.5, outerWallLen: 2.0,
      floorMat: "klinkkeri-lattia", wallMat: "saunapaneeli",    ceilMat: "saunapaneeli",
      floorPlan: "C", wallPlan: "C", ceilPlan: "C", asbestos: false },

    { id: "191", name: "WC 2",                   floor: "1. krs", w: 1.0, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "C", wallPlan: "C", ceilPlan: "C", asbestos: false },

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

  // Uusien väliseinien gyproc-rakentaminen
  // C-suunnitelmassa kaikki väliseinät uusittavat (lattialämmityksen putket, korot ovissa, sähkövedot)
  partitions: [
    { name: "Sisäseinien gyproc-uusinta (asuintilat)",  length: 45, height: 2.5, price: 75,  plan: "C", note: "Lattialämmityksen vuoksi kaikki ei-kantavat väliseinät uusitaan asuintiloissa" },
    { name: "Märkätilojen väliseinät (kosteudenkestävä gyproc)", length: 18, height: 2.5, price: 95,  plan: "C", note: "KH, Pesuhuone, WC:t, Kodinhoito — kosteudenkestävä levy + tuplapanelointi" }
  ],

  // Kalusteet ja varusteet
  fixtures: [
    // A — minimi
    { name: "WC-istuin",                              qty: 2, unitPrice: 450,  plan: "A", note: "WC 107 + WC 191 (helppo vaihto)" },
    { name: "Pesuallas + hana (Kylpyhuone 112)",      qty: 1, unitPrice: 320,  plan: "A", note: "KH 112 kosmeettinen vaihto" },

    // B — pintaremontti laajemmin, ei vesieristyksen avaamista
    { name: "Saunan kiuas (sähkö, 8 kW)",             qty: 1, unitPrice: 1400, plan: "B", note: "Sauna 119 — pelkkä kiukaan vaihto onnistuu ilman muuta remonttia" },
    { name: "Pesualtaat (kevyt vaihto)",              qty: 2, unitPrice: 320,  plan: "B", note: "WC 107 + WC 191 altaat" },
    { name: "Hanat ja vesikalusteet",                 qty: 5, unitPrice: 220,  plan: "B", note: "Kaikki yläkerran märkätilojen hanat" },

    // C — märkätilojen täysremontti (vesieristys auki + lattialämmitys)
    { name: "Suihkukaappi (KH 112, täysuusinta)",     qty: 1, unitPrice: 1300, plan: "C", note: "Korvaa A:n altaan + lisää suihkun" },
    { name: "WC-istuin (KH 112)",                     qty: 1, unitPrice: 450,  plan: "C", note: "KH:n oma WC uusittu täysremontin yhteydessä" },
    { name: "Suihku (Pesuhuone 118)",                 qty: 1, unitPrice: 900,  plan: "C", note: "Saunan eteistila — kahden hengen suihku" },
    { name: "Pesuallas + hana (Pesuhuone 118)",       qty: 1, unitPrice: 320,  plan: "C", note: "" },
    { name: "Saunan lauteet + paneelit",              qty: 1, unitPrice: 1800, plan: "C", note: "Sauna 119 täysremontti" },
    { name: "Saunan ovi (lasi)",                      qty: 1, unitPrice: 450,  plan: "C", note: "" },
    { name: "Lattiakaivot uusittu",                   qty: 4, unitPrice: 380,  plan: "C", note: "KH, Pesu, WC 107, WC 191 — vesieristyksen yhteydessä" },
    { name: "Lattialämmityksen kytkentä maalämpöön",  qty: 1, unitPrice: 800,  plan: "C", note: "Putkimiehen työ kytkeä uusi lattialämmityspiiri olemassa olevaan maalämpöjärjestelmään" }
  ],

  // Erityiskustannukset (purkutyöt, asbesti, suunnittelu)
  // EI sisällä sähkö-/LVI-suunnittelua (asunto asumiskuntoinen, maalämpö jo asennettu)
  special: [
    // A — asbestityöt pakollisia
    { name: "Asbestikartoitus (sertifioitu)",            qty: 1,  unit: "kpl", unitPrice: 700,  plan: "A", note: "Pakollinen ennen purkutöitä 1968 talossa" },
    { name: "Asbestipurun urakkapalkkio + valmistelu",   qty: 1,  unit: "krt", unitPrice: 2500, plan: "A", note: "Suojaukset, alipaineistus, jätehuolto" },
    { name: "Jätelava (8 m³)",                           qty: 2,  unit: "kpl", unitPrice: 500,  plan: "A", note: "Asbestipurku + pintapurku" },

    // B — asuintilojen pintaremontti laajemmin
    { name: "Vanhojen tapettien / pintamaalien poisto",  qty: 60, unit: "m²", unitPrice: 12,    plan: "B", note: "Asuintilojen seinät kauttaaltaan" },
    { name: "Lisäasbestipurku (laajempi)",               qty: 1,  unit: "krt", unitPrice: 1500, plan: "B", note: "Useamman huoneen lattiat" },
    { name: "Lisäjätelava",                              qty: 1,  unit: "kpl", unitPrice: 500,  plan: "B", note: "" },

    // C — lattialämmitys + märkätilojen täysremontti + sisäseinien purku
    { name: "Vanhojen väliseinien purku (laaja)",        qty: 80, unit: "m²", unitPrice: 35,    plan: "C", note: "Ennen gyproc-uusintaa — lattialämmitys vaatii avaamisen" },
    { name: "Märkätilojen vesieristys (urakka)",         qty: 25, unit: "m²", unitPrice: 65,    plan: "C", note: "KH 112, Pesuhuone 118, Sauna, WC 107, WC 191, Kodinhoito (lattia + seinien alaosat)" },
    { name: "Vanhojen lattioiden täyspurku",             qty: 130, unit: "m²", unitPrice: 22,   plan: "C", note: "Lattialämmityksen vuoksi koko lattia maalattuun betoniin asti" },
    { name: "Lisäjätelavat (C)",                         qty: 3,  unit: "kpl", unitPrice: 500,  plan: "C", note: "Iso remontti = paljon jätettä" },
    { name: "Rakennuslupa / muutosilmoitus",             qty: 1,  unit: "kpl", unitPrice: 1200, plan: "C", note: "Märkätilojen täysremontti vaatii ilmoituksen" },
    { name: "Sisustus- ja märkätilasuunnittelu",         qty: 1,  unit: "kpl", unitPrice: 2500, plan: "C", note: "" }
  ]
};
