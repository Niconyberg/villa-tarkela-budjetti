# Villa Tarkela – Budjettilaskuri

HTML-pohjainen remonttibudjetin laskuri 1968 rakennetulle Villa Tarkelalle (kaksi kerrosta, n. 200 m² + kellari).

## Käyttö

Avaa `index.html` selaimessa tai käytä julkaistua versiota GitHub Pagesissa.

Laskuri laskee automaattisesti:

- **Pinta-alat** – kokonaisala, kerroksittain, huoneittain
- **Seinämitat** – sisäseinien ja ulkoseinien yhteispituudet
- **Pinnoituskustannukset** – lattiat, seinät, katot huoneittain
- **Asbestilattian purku** – merkitse rasti niihin huoneisiin joissa epäillään asbestia
- **Väliseinien rakentaminen** – uusien gyproc-väliseinien kustannukset
- **Kalusteet ja varusteet** – WC-istuimet, suihkut, saunan kiuas, keittiön kalusteet jne.
- **Erityiskustannukset** – asbestikartoitus, purkutyöt, suunnittelu, jätteen poiskuljetus

Tiedot tallentuvat selaimen `localStorage`-muistiin. Voit viedä koko datan JSON-muodossa.

## Rakenne

```
index.html      – käyttöliittymä
styles.css      – tyylit
data.js         – oletustiedot (huoneet, materiaalit, kalusteet)
app.js          – laskentalogiikka
Bredantie(2).pdf – alkuperäinen pohjapiirros
```

## Oletusarvot

Huoneiden mitat on luettu arviona pohjapiirroksesta (mittakaava 1:50). Tarkista jokainen mitta pohjapiirroksesta ennen päätöksentekoa.

Materiaalihinnat ovat suomalaisia 2026 keskihintoja asennettuna; muokkaa hintoja paikallisten urakoitsijoiden tarjousten mukaan.
