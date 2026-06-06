// Villa Tarkela - oletustiedot
// Huoneiden mitat luettu pohjapiirroksesta (mittakaava 1:50). Arvioita - tarkista pohjapiirroksesta.

const ASBESTOS_REMOVAL_PRICE_PER_M2 = 80;

const DEFAULT_DATA = {
  meta: {
    name: "Villa Tarkela",
    year: 1968,
    defaultHeight: 2.5,
    currency: "€"
  },

  // Materiaalit (€/m²)
  materials: {
    floor: [
      { id: "parketti",         name: "Parketti",                       price: 65 },
      { id: "laminaatti",       name: "Laminaatti",                     price: 35 },
      { id: "vinyyli",          name: "Vinyylilankku",                  price: 45 },
      { id: "klinkkeri-lattia", name: "Klinkkeri + vedeneristys",       price: 110 },
      { id: "betoni",           name: "Betonihionta / pinnoite",        price: 55 },
      { id: "lautalattia",      name: "Lautalattia (mänty)",            price: 70 },
      { id: "ei-lattiaa",       name: "Ei pinnoitusta (säilytetään)",   price: 0 }
    ],
    wall: [
      { id: "maali",            name: "Maali + pohjustus",              price: 18 },
      { id: "tapetti",          name: "Tapetti",                        price: 28 },
      { id: "klinkkeri-seina",  name: "Klinkkeri + vedeneristys",       price: 105 },
      { id: "saunapaneeli",     name: "Saunapaneeli (haapa/leppä)",     price: 65 },
      { id: "paneeli",          name: "Puupaneeli",                     price: 50 },
      { id: "gyproc-maali",     name: "Gyproc + tasoite + maali",       price: 45 },
      { id: "ei-seinaa",        name: "Ei pintakäsittelyä",             price: 0 }
    ],
    ceiling: [
      { id: "maali",            name: "Maali",                          price: 14 },
      { id: "gyproc-katto",     name: "Gyproc + tasoite + maali",       price: 38 },
      { id: "paneeli",          name: "Puupaneeli",                     price: 55 },
      { id: "saunapaneeli",     name: "Saunapaneeli",                   price: 60 },
      { id: "akustopaneeli",    name: "Akustopaneeli",                  price: 75 },
      { id: "ei-kattoa",        name: "Ei pintakäsittelyä",             price: 0 }
    ]
  },

  // Huoneet pohjapiirroksen mukaan
  // w = leveys (m), l = pituus (m), h = korkeus (m)
  // openings = ovi-/ikkuna-aukot yhteensä (m²) - vähennetään seinäalasta
  // outerWallLen = huoneen seinämatkasta ulkoseinää (m)
  // asbestos = epäilläänkö asbestilattian olevan piilossa
  rooms: [
    // 1. KERROS
    { id: "101", name: "Tekninen tila / komero", floor: "1. krs", w: 1.0, l: 1.5, h: 2.5, openings: 0,   outerWallLen: 0,    floorMat: "betoni",           wallMat: "maali",           ceilMat: "maali",        asbestos: false },
    { id: "102", name: "Eteishalli",             floor: "1. krs", w: 4.4, l: 3.5, h: 2.5, openings: 4,   outerWallLen: 3.5,  floorMat: "klinkkeri-lattia", wallMat: "maali",           ceilMat: "maali",        asbestos: false },
    { id: "103", name: "Keittiö",                floor: "1. krs", w: 2.0, l: 3.0, h: 2.5, openings: 3,   outerWallLen: 2.0,  floorMat: "vinyyli",          wallMat: "maali",           ceilMat: "maali",        asbestos: false },
    { id: "104", name: "Ruokailutila",           floor: "1. krs", w: 4.4, l: 5.0, h: 2.5, openings: 6,   outerWallLen: 9.4,  floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: true  },
    { id: "105", name: "Olohuone",               floor: "1. krs", w: 5.4, l: 4.4, h: 2.5, openings: 8,   outerWallLen: 5.4,  floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: true  },
    { id: "106", name: "Työhuone",               floor: "1. krs", w: 3.0, l: 3.0, h: 2.5, openings: 3,   outerWallLen: 6.0,  floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: true  },
    { id: "107", name: "WC 1",                   floor: "1. krs", w: 1.0, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,    floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto", asbestos: false },
    { id: "108", name: "Jakelu / pukeutuminen",  floor: "1. krs", w: 1.8, l: 2.2, h: 2.5, openings: 1.5, outerWallLen: 0,    floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: false },
    { id: "109", name: "Käytävä",                floor: "1. krs", w: 2.4, l: 3.0, h: 2.5, openings: 6,   outerWallLen: 0,    floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: true  },
    { id: "110", name: "Makuuhuone 1",           floor: "1. krs", w: 3.5, l: 3.5, h: 2.5, openings: 3,   outerWallLen: 3.5,  floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: true  },
    { id: "111", name: "Vierashuone",            floor: "1. krs", w: 3.5, l: 2.0, h: 2.5, openings: 2,   outerWallLen: 0,    floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: false },
    { id: "112", name: "Kylpyhuone (KH)",        floor: "1. krs", w: 1.6, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,    floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto", asbestos: false },
    { id: "113", name: "Makuuhuone 2",           floor: "1. krs", w: 2.4, l: 4.0, h: 2.5, openings: 2.5, outerWallLen: 2.4,  floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: true  },
    { id: "114", name: "Makuuhuone 3",           floor: "1. krs", w: 2.4, l: 4.0, h: 2.5, openings: 2.5, outerWallLen: 2.4,  floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: true  },
    { id: "115", name: "Perhehuone",             floor: "1. krs", w: 3.4, l: 2.7, h: 2.5, openings: 3,   outerWallLen: 3.4,  floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: true  },
    { id: "116", name: "Kodinhoitohuone",        floor: "1. krs", w: 2.4, l: 1.9, h: 2.5, openings: 2,   outerWallLen: 0,    floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto", asbestos: false },
    { id: "117", name: "Pukuhuone",              floor: "1. krs", w: 2.7, l: 3.5, h: 2.5, openings: 2,   outerWallLen: 2.7,  floorMat: "parketti",         wallMat: "maali",           ceilMat: "maali",        asbestos: false },
    { id: "118", name: "Pesuhuone",              floor: "1. krs", w: 1.9, l: 2.1, h: 2.5, openings: 1.5, outerWallLen: 1.9,  floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto", asbestos: false },
    { id: "119", name: "Sauna",                  floor: "1. krs", w: 2.0, l: 2.1, h: 2.3, openings: 1.5, outerWallLen: 2.0,  floorMat: "klinkkeri-lattia", wallMat: "saunapaneeli",    ceilMat: "saunapaneeli", asbestos: false },
    { id: "191", name: "WC 2",                   floor: "1. krs", w: 1.0, l: 1.6, h: 2.5, openings: 1.5, outerWallLen: 0,    floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto", asbestos: false },

    // KELLARI (POHJAKERROS)
    { id: "01", name: "Harrastetila / sisäänkäynti", floor: "Kellari", w: 5.9,  l: 3.4,  h: 2.4, openings: 3, outerWallLen: 5.9,  floorMat: "betoni",           wallMat: "maali",           ceilMat: "maali",        asbestos: false },
    { id: "02", name: "Varasto 1",                   floor: "Kellari", w: 1.1,  l: 2.95, h: 2.4, openings: 1, outerWallLen: 2.95, floorMat: "betoni",           wallMat: "maali",           ceilMat: "maali",        asbestos: false },
    { id: "03", name: "Lämmityshuone",               floor: "Kellari", w: 2.2,  l: 2.87, h: 2.4, openings: 1, outerWallLen: 0,    floorMat: "betoni",           wallMat: "maali",           ceilMat: "maali",        asbestos: false },
    { id: "04", name: "Varasto 2",                   floor: "Kellari", w: 3.49, l: 2.87, h: 2.4, openings: 1, outerWallLen: 3.49, floorMat: "betoni",           wallMat: "maali",           ceilMat: "maali",        asbestos: false },
    { id: "05", name: "WC (kellari)",                floor: "Kellari", w: 1.5,  l: 1.6,  h: 2.4, openings: 1.5, outerWallLen: 0,  floorMat: "klinkkeri-lattia", wallMat: "klinkkeri-seina", ceilMat: "gyproc-katto", asbestos: false },
    { id: "07", name: "Autotalli",                   floor: "Kellari", w: 5.9,  l: 4.88, h: 2.4, openings: 8, outerWallLen: 10.78, floorMat: "betoni",          wallMat: "maali",           ceilMat: "maali",        asbestos: false }
  ],

  // Uusien gyproc-väliseinien rakentaminen
  partitions: [
    { name: "Esim. uusi väliseinä makuuhuoneeseen", length: 0, height: 2.5, price: 75, note: "Gyproc 95mm + eristys + tasoite + maali" }
  ],

  // Kalusteet ja varusteet
  fixtures: [
    { name: "WC-istuin",                            qty: 3, unitPrice: 450,   note: "WC 107, WC 191, WC kellari" },
    { name: "Pesuallas + hana",                     qty: 5, unitPrice: 320,   note: "WC:t + pesutilat + kodinhoito" },
    { name: "Suihkukaappi (allas + hana + seinät)", qty: 1, unitPrice: 1200,  note: "Kylpyhuone 112" },
    { name: "Suihku (Pesuhuone)",                   qty: 1, unitPrice: 850,   note: "Pesuhuone 118 - kahden hengen tila" },
    { name: "Saunan kiuas (sähkö, 8 kW)",           qty: 1, unitPrice: 1400,  note: "Sauna 119" },
    { name: "Saunan lauteet ja paneelit",           qty: 1, unitPrice: 1800,  note: "Sauna 119, asennettuna" },
    { name: "Saunan ovi (lasi)",                    qty: 1, unitPrice: 450,   note: "" },
    { name: "Keittiön kalusteet (rungot + ovet)",   qty: 1, unitPrice: 14000, note: "Keittiö 103, kohtuutaso" },
    { name: "Keittiön kodinkoneet",                 qty: 1, unitPrice: 4500,  note: "Liesi, jääkaappi-pakastin, astianpesukone, liesituuletin" },
    { name: "Pyykinpesukone + kuivausrumpu",        qty: 1, unitPrice: 1800,  note: "Kodinhoito 116" },
    { name: "Astianpesukoneliitäntä",               qty: 1, unitPrice: 250,   note: "" },
    { name: "Pyykinpesukoneliitäntä",               qty: 1, unitPrice: 250,   note: "" },
    { name: "Lattiakaivo asennettuna",              qty: 4, unitPrice: 380,   note: "WC 107, WC 191, KH 112, Pesu 118, Sauna 119, KH-kellari" },
    { name: "Lämminvesivaraaja 300 L",              qty: 1, unitPrice: 1900,  note: "Lämmityshuone 03" },
    { name: "Ilmalämpöpumppu (sisä+ulko)",          qty: 2, unitPrice: 2800,  note: "" },
    { name: "Liesituuletin / huippuimuri",          qty: 1, unitPrice: 1200,  note: "" }
  ],

  // Erityiskustannukset (purku, asbestityö, suunnittelu)
  special: [
    { name: "Asbestilattian purku (matto/pinnoite)", qty: 0,  unit: "m²",  unitPrice: 80,    note: "Lasketaan automaattisesti merkityistä huoneista. Voit lisätä neliöitä käsin." },
    { name: "Asbestikartoitus (sertifioitu)",        qty: 1,  unit: "kpl", unitPrice: 700,   note: "Pakollinen ennen purkutöitä 1994 vanhempiin rakennuksiin" },
    { name: "Asbestipurun urakkapalkkio + valmistelu", qty: 1, unit: "krt", unitPrice: 2500, note: "Suojaukset, alipaineistus, jätteen pakkaus" },
    { name: "Vanhojen tapettien / maalien poisto",   qty: 0,  unit: "m²",  unitPrice: 12,    note: "" },
    { name: "Vanhojen väliseinien purku",            qty: 0,  unit: "m²",  unitPrice: 35,    note: "Ei-kantavat seinät" },
    { name: "Sähkösuunnittelu ja päivitys",          qty: 1,  unit: "kpl", unitPrice: 15000, note: "1968 sähköjärjestelmä - todennäköisesti tarvitsee uusinnan" },
    { name: "LVI-suunnittelu ja päivitys",           qty: 1,  unit: "kpl", unitPrice: 18000, note: "Putket, viemärit, ilmanvaihto" },
    { name: "Vedeneristys märkätiloissa",            qty: 0,  unit: "m²",  unitPrice: 55,    note: "Sisältyy yleensä klinkkerin hintaan" },
    { name: "Jätelava (8 m³)",                       qty: 3,  unit: "kpl", unitPrice: 500,   note: "Toimitus + nouto + jätemaksu" },
    { name: "Rakennuslupa + suunnittelu",            qty: 1,  unit: "kpl", unitPrice: 3000,  note: "" },
    { name: "Vakuutus + odottamaton (10%)",          qty: 1,  unit: "%",   unitPrice: 0,    note: "Lisää käsin esim. 10% kokonaisbudjetista" }
  ]
};
