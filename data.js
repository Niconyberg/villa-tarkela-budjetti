// Villa Tarkela - oletustiedot
// Plan tagit: "A" = sis. A,B,C · "B" = sis. B,C · "C" = vain C · "-" = ei sis. mihinkään
// Vyöhykkeet (zone): "kuiva" | "marka" | "keittio" | "yhteinen"

const ASBESTOS_REMOVAL_PRICE_PER_M2 = 80;
const PLAN_RANK = { "-": 0, "A": 1, "B": 2, "C": 3 };

// Apurit (käytetään myös app.js:ssä)
function planIncludes(itemPlan, selectedPlan) {
  if (itemPlan === "-" || !itemPlan) return false;
  return PLAN_RANK[itemPlan] <= PLAN_RANK[selectedPlan];
}

function matPrice(mat) {
  if (!mat) return 0;
  if (Array.isArray(mat.components) && mat.components.length) {
    return mat.components.reduce((s, c) => s + (+c.price || 0), 0);
  }
  return +mat.price || 0;
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
    A: { name: "Vain parketit (kaikki muu ennallaan)", desc: "Parkettilattia asuintiloihin + asbestipurku näistä huoneista · 2 WC-pyttyä · KH 112:n pesuallas + hana · asbestikartoitus. Seinät, katot ja kaikki märkätilat säilytetään ennallaan." },
    B: { name: "A + seinät + katot + märkätilojen pintapäivitys (ei lattialämmitystä)", desc: "A + sisäväliseinien gyproc-uusinta (paitsi märkätilat) · sisäkattopaneelit kaikkialle · saunan kiuas + lauteet + paneelit · pesualtaita + hanat · märkätilojen klinkkerin uusinta vanhan päälle (vesieristys EI avata)." },
    C: { name: "Lattialämmitys + täysremontti", desc: "Vesikiertoinen lattialämmitys liitetään olemassa olevaan maalämpöön. Pakottaa: lattiat kaikkialle (myös eteishalli, keittiö, märkätilat) · kipsivalu · märkätilojen väliseinät uusittu (kosteudenkestävä gyproc) · märkätilojen täysremontti (vesieristys + laatat + kalusteet) · suihkukaapit + lattiakaivot + kytkentä maalämpöön." }
  },

  zones: {
    kuiva:    { name: "Kuivat huoneet",  color: "#2c4a7c" },
    marka:    { name: "Märkätilat",       color: "#7c2c2c" },
    keittio:  { name: "Keittiö",          color: "#7c5c2c" },
    yhteinen: { name: "Yhteinen / yleinen", color: "#555" }
  },

  // C: vesikiertoiset lattialämmitysputket + kipsivalu — molemmat omana työnä
  // Kaikki työ on omaa työtä. Ainut hankittava palvelu on asbestipurku.
  extras: {
    floorHeatingPipesPerM2: 22,
    floorHeatingPipesLabel: "Vesikiertoiset lattialämmitysputket (omana työnä, materiaalit)",
    gypsumScreedPerM2: 25,
    gypsumScreedLabel: "Kipsivalu (omana työnä, materiaalit — kipsi-tasoitemassa)",
    floorWorksFromPlan: "C"
  },

  // Lattia-, seinä- ja kattomateriaalit
  // Tärkeimmillä on komponentit (osahinta). Kokonaishinta lasketaan summasta.
  materials: {
    floor: [
      {
        id: "parketti", name: "Parkettilattia (asuintilat) — materiaalit", unit: "€/m²",
        components: [
          { name: "Parketti",                      price: 30 },
          { name: "Lattiatasoite + tarvikkeet",    price: 5 },
          { name: "Aluskate / -nauha",             price: 3 }
        ]
        // total: 38 €/m²
      },
      { id: "laminaatti",       name: "Laminaatti",                price: 35 },
      { id: "vinyyli",          name: "Vinyylilankku",             price: 45 },
      {
        id: "klinkkeri-lattia", name: "Märkätilan lattia (klinkkeri + vedeneristys) — materiaalit", unit: "€/m²",
        components: [
          { name: "Pohjatasoite + kallistuslaastit",       price: 10 },
          { name: "Vedeneriste-järjestelmä (materiaalit)", price: 20 },
          { name: "Klinkkerilaatat",                       price: 25 },
          { name: "Kiinnityslaasti + saumalaasti",         price: 10 }
        ]
        // total: 65 €/m²
      },
      { id: "betoni",           name: "Betonihionta / pinnoite",   price: 55 },
      { id: "lautalattia",      name: "Lautalattia (mänty)",       price: 70 }
    ],
    wall: [
      { id: "maali",            name: "Maali + pohjustus",         price: 18 },
      { id: "tapetti",          name: "Tapetti",                   price: 28 },
      { id: "klinkkeri-seina",  name: "Klinkkeri + vedeneristys (per m² wall)", price: 105 },
      { id: "saunapaneeli",     name: "Saunapaneeli (haapa/leppä)",price: 65 },
      { id: "paneeli",          name: "Puupaneeli",                price: 50 },
      { id: "gyproc-maali",     name: "Gyproc + tasoite + maali",  price: 45 }
    ],
    ceiling: [
      { id: "maali",            name: "Maali (vanhan päälle)",     price: 14 },
      { id: "gyproc-katto",     name: "Gyproc + tasoite + maali",  price: 38 },
      {
        id: "paneeli", name: "Sisäkattopaneeli — materiaalit", unit: "€/m²",
        components: [
          { name: "Koolauspuut + ruuvit",           price: 5 },
          { name: "Paneelit",                       price: 20 },
          { name: "Listat",                         price: 3 },
          { name: "Maali + tarvikkeet",             price: 4 }
        ]
        // total: 32 €/m²
      },
      { id: "saunapaneeli",     name: "Saunapaneeli",              price: 60 },
      { id: "akustopaneeli",    name: "Akustopaneeli",             price: 75 }
    ]
  },

  // Väliseinätyypit — per metri (sisältää koko korkeuden)
  // Käytetään partitions-taulukossa typeId:llä
  partitionTypes: [
    {
      id: "kuiva", name: "Sisäväliseinä (kuiva) — materiaalit", unit: "€/m",
      components: [
        { name: "Runkopuu (2x10) + ruuvit",         price: 12 },
        { name: "Eristysvilla 100mm",                price: 20 },
        { name: "Gyproc-levyt (molemmin puolin)",   price: 25 },
        { name: "Tasoite + saumanauhat",            price: 12 },
        { name: "Maali (molemmin puolin)",          price: 25 }
      ]
      // total: 94 €/m
    },
    {
      id: "marka", name: "Märkätilan seinä — materiaalit", unit: "€/m",
      components: [
        { name: "Runkopuu + ruuvit",                            price: 12 },
        { name: "Eristysvilla 100mm",                            price: 20 },
        { name: "Kosteudenkestävä gyproc-levy (kuiva puoli + märkä puoli)", price: 30 },
        { name: "Vedeneriste-järjestelmä (materiaalit)",          price: 40 },
        { name: "Klinkkerilaatat + kiinnityslaasti + saumalaasti", price: 75 }
      ]
      // total: 177 €/m
    }
  ],

  // Huoneet
  // zone: "kuiva" | "marka" | "keittio"
  rooms: [
    // 1. KERROS
    { id: "101", name: "Tekninen tila / komero", floor: "1. krs", zone: "kuiva", w: 1.0, l: 1.5, h: 2.5, openings: 0, outerWallLen: 0,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },

    { id: "102", name: "Eteishalli", floor: "1. krs", zone: "kuiva", w: 4.4, l: 3.5, h: 2.5, openings: 4, outerWallLen: 3.5,
      floorMat: "klinkkeri-lattia", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "C", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "103", name: "Keittiö", floor: "1. krs", zone: "keittio", w: 2.0, l: 3.0, h: 2.5, openings: 3, outerWallLen: 2.0,
      floorMat: "vinyyli", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "C", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "104", name: "Ruokailutila", floor: "1. krs", zone: "kuiva", w: 4.4, l: 5.0, h: 2.5, openings: 6, outerWallLen: 9.4,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "105", name: "Olohuone", floor: "1. krs", zone: "kuiva", w: 5.4, l: 4.4, h: 2.5, openings: 8, outerWallLen: 5.4,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "106", name: "Työhuone", floor: "1. krs", zone: "kuiva", w: 3.0, l: 3.0, h: 2.5, openings: 3, outerWallLen: 6.0,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "107", name: "WC 1", floor: "1. krs", zone: "marka", w: 1.0, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "C", wallPlan: "-", ceilPlan: "C", asbestos: false },

    { id: "108", name: "Jakelu / pukeutuminen", floor: "1. krs", zone: "kuiva", w: 1.8, l: 2.2, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "109", name: "Käytävä", floor: "1. krs", zone: "kuiva", w: 2.4, l: 3.0, h: 2.5, openings: 6, outerWallLen: 0,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "110", name: "Makuuhuone 1", floor: "1. krs", zone: "kuiva", w: 3.5, l: 3.5, h: 2.5, openings: 3, outerWallLen: 3.5,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "111", name: "Vierashuone", floor: "1. krs", zone: "kuiva", w: 3.5, l: 2.0, h: 2.5, openings: 2, outerWallLen: 0,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "112", name: "Kylpyhuone (KH)", floor: "1. krs", zone: "marka", w: 1.6, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "C", wallPlan: "-", ceilPlan: "C", asbestos: false },

    { id: "113", name: "Makuuhuone 2", floor: "1. krs", zone: "kuiva", w: 2.4, l: 4.0, h: 2.5, openings: 2.5, outerWallLen: 2.4,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "114", name: "Makuuhuone 3", floor: "1. krs", zone: "kuiva", w: 2.4, l: 4.0, h: 2.5, openings: 2.5, outerWallLen: 2.4,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "115", name: "Perhehuone", floor: "1. krs", zone: "kuiva", w: 3.4, l: 2.7, h: 2.5, openings: 3, outerWallLen: 3.4,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: true },

    { id: "116", name: "Kodinhoitohuone", floor: "1. krs", zone: "marka", w: 2.4, l: 1.9, h: 2.5, openings: 2, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "C", wallPlan: "-", ceilPlan: "C", asbestos: false },

    { id: "117", name: "Pukuhuone", floor: "1. krs", zone: "kuiva", w: 2.7, l: 3.5, h: 2.5, openings: 2, outerWallLen: 2.7,
      floorMat: "parketti", wallMat: "maali", ceilMat: "paneeli",
      floorPlan: "A", wallPlan: "B", ceilPlan: "B", asbestos: false },

    { id: "118", name: "Pesuhuone", floor: "1. krs", zone: "marka", w: 1.9, l: 2.1, h: 2.5, openings: 1.5, outerWallLen: 1.9,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "C", wallPlan: "-", ceilPlan: "C", asbestos: false },

    { id: "119", name: "Sauna", floor: "1. krs", zone: "marka", w: 2.0, l: 2.1, h: 2.3, openings: 1.5, outerWallLen: 2.0,
      floorMat: "klinkkeri-lattia", wallMat: "saunapaneeli", ceilMat: "saunapaneeli",
      floorPlan: "C", wallPlan: "C", ceilPlan: "C", asbestos: false },

    { id: "191", name: "WC 2", floor: "1. krs", zone: "marka", w: 1.0, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "C", wallPlan: "-", ceilPlan: "C", asbestos: false },

    // KELLARI — ei kosketa missään suunnitelmassa
    { id: "01", name: "Harrastetila / sisäänk.", floor: "Kellari", zone: "kuiva", w: 5.9, l: 3.4, h: 2.4, openings: 3, outerWallLen: 5.9,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },
    { id: "02", name: "Varasto 1", floor: "Kellari", zone: "kuiva", w: 1.1, l: 2.95, h: 2.4, openings: 1, outerWallLen: 2.95,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },
    { id: "03", name: "Lämmityshuone", floor: "Kellari", zone: "kuiva", w: 2.2, l: 2.87, h: 2.4, openings: 1, outerWallLen: 0,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },
    { id: "04", name: "Varasto 2", floor: "Kellari", zone: "kuiva", w: 3.49, l: 2.87, h: 2.4, openings: 1, outerWallLen: 3.49,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },
    { id: "05", name: "WC (kellari)", floor: "Kellari", zone: "marka", w: 1.5, l: 1.6, h: 2.4, openings: 1.5, outerWallLen: 0,
      floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false },
    { id: "07", name: "Autotalli", floor: "Kellari", zone: "kuiva", w: 5.9, l: 4.88, h: 2.4, openings: 8, outerWallLen: 10.78,
      floorMat: "betoni", wallMat: "maali", ceilMat: "maali",
      floorPlan: "-", wallPlan: "-", ceilPlan: "-", asbestos: false }
  ],

  // Sisäväliseinät — per metri × tyypin kokonaishinta
  partitions: [
    { name: "Sisäväliseinien gyproc-uusinta (asuintilat + keittiö + eteishalli)", length: 45, typeId: "kuiva", plan: "B", zone: "kuiva", note: "Ei märkätilojen seiniä" },
    { name: "Märkätilojen seinät (täyspaketti: levy + vedeneriste + klinkkeri)", length: 33, typeId: "marka", plan: "C", zone: "marka", note: "Korvaa märkätilojen huoneiden wallPlanin — kustannukset tulevat tästä" }
  ],

  fixtures: [
    // A — minimi
    { name: "WC-istuin",                              qty: 2, unitPrice: 450,  plan: "A", zone: "marka", note: "WC 107 + WC 191 (helppo vaihto)" },
    { name: "Pesuallas + hana (Kylpyhuone 112)",      qty: 1, unitPrice: 320,  plan: "A", zone: "marka", note: "KH 112 kosmeettinen vaihto" },

    // B — pintaremontti laajemmin
    { name: "Saunan kiuas (sähkö, 8 kW)",             qty: 1, unitPrice: 1400, plan: "B", zone: "marka", note: "Sauna 119" },
    { name: "Pesualtaat (kevyt vaihto)",              qty: 2, unitPrice: 320,  plan: "B", zone: "marka", note: "WC 107 + WC 191" },
    { name: "Hanat ja vesikalusteet",                 qty: 5, unitPrice: 220,  plan: "B", zone: "marka", note: "Kaikki yläkerran märkätilojen hanat" },

    // C — märkätilojen täysremontti
    { name: "Suihkukaappi (KH 112, täysuusinta)",     qty: 1, unitPrice: 1300, plan: "C", zone: "marka", note: "Korvaa A:n altaan + lisää suihkun" },
    { name: "WC-istuin (KH 112)",                     qty: 1, unitPrice: 450,  plan: "C", zone: "marka", note: "" },
    { name: "Suihku (Pesuhuone 118)",                 qty: 1, unitPrice: 900,  plan: "C", zone: "marka", note: "Kahden hengen suihku" },
    { name: "Pesuallas + hana (Pesuhuone 118)",       qty: 1, unitPrice: 320,  plan: "C", zone: "marka", note: "" },
    { name: "Saunan lauteet + paneelit",              qty: 1, unitPrice: 1800, plan: "C", zone: "marka", note: "Sauna 119" },
    { name: "Saunan ovi (lasi)",                      qty: 1, unitPrice: 450,  plan: "C", zone: "marka", note: "" },
    { name: "Lattiakaivot (materiaalit)",             qty: 4, unitPrice: 250,  plan: "C", zone: "marka", note: "KH, Pesu, WC 107, WC 191 — asennus omana työnä" },
    { name: "Lattialämmitysjakotukki + tarvikkeet",   qty: 1, unitPrice: 500,  plan: "C", zone: "marka", note: "Kytkentä olemassa olevaan maalämpöön omana työnä" }
  ],

  // Erityiskustannukset: vain palvelut, maksut ja materiaalit
  // Kaikki työ omana työnä (paitsi asbestipurku — pakollinen sertifioitu)
  special: [
    // A — asbestityöt (ainoa hankittava palvelu)
    { name: "Asbestikartoitus (sertifioitu)",                qty: 1, unit: "kpl", unitPrice: 700,  plan: "A", zone: "yhteinen", note: "Pakollinen sertifioitu tutkimus 1968 talossa" },
    { name: "Asbestipurku (sertifioitu urakka)",             qty: 1, unit: "krt", unitPrice: 2500, plan: "A", zone: "kuiva",    note: "AINOA HANKITTAVA PALVELU. Sis. suojaukset, alipaineistus, pakkaus" },
    { name: "Jätelava (8 m³)",                               qty: 2, unit: "kpl", unitPrice: 500,  plan: "A", zone: "yhteinen", note: "Vuokra + nouto + jätemaksu" },

    // B — lisäjätettä (sisävaliseinät + katot + pintojen poisto)
    { name: "Märkätilojen klinkkeri pintapäivitys (materiaalit)", qty: 50, unit: "m²", unitPrice: 30, plan: "B", zone: "marka", note: "Uudet laatat + laasti vanhan päälle. Asennus omana työnä" },
    { name: "Lisäjätelavat (B)",                             qty: 2, unit: "kpl", unitPrice: 500,  plan: "B", zone: "yhteinen", note: "Vanhat seinät, katot, tapetit" },

    // C — lattialämmitys + märkätilojen täysremontti
    // Omakotitalossa märkätilojen sisäremontti ei yleensä vaadi rakennuslupaa
    { name: "Lisäjätelavat (C)",                             qty: 3, unit: "kpl", unitPrice: 500,  plan: "C", zone: "yhteinen", note: "Lattiat + märkätilojen rakenteet" }
  ]
};
