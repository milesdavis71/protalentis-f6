# Pro Talentis F6

Statikus Foundation 6.9 alapú weboldal Panini templatinggel, Gulp builddel és Markdown-alapú tartalomkezeléssel.

## Követelmények

- Node.js 18+ ajánlott
- npm

## Telepítés

```bash
npm install
```

## Fejlesztés

Fejlesztői szerver indítása:

```bash
npm run dev
```

Build parancsok:

```bash
npm run build
```

```bash
npm run build:prod
```

Development build watch/server nélkül:

```bash
npm run build:dev
```

A kimenet a `dist/` mappába kerül.

## Fő szerkezet

- `src/pages/`: oldalak frontmatterrel és layout-hivatkozásokkal
- `src/layouts/`: Panini layoutok
- `src/partials/`: újrafelhasználható sablonrészek
- `src/content/`: hosszabb szerkeszthető markdown tartalmak
- `src/data/`: YAML adatok
- `src/helpers/`: egyedi Panini/Handlebars helperek
- `src/assets/`: képek, scss, js, pdf

## Markdown tartalmak

A hosszabb szöveges tartalmak már nem inline `{{#markdown}}` blokkokban vannak, hanem a `src/content/` alatt.

Mappák:

- `src/content/pages/body/`: normál oldaltörzsek
- `src/content/pages/elerhetosegek/`: az elérhetőségek oldal külön blokkjai
- `src/content/fragments/home/`: nyitólaphoz tartozó markdown fragmentek
- `src/content/fragments/sidebar/`: sidebar markdown fragmentek
- `src/content/palyazatok/news/`: pályázati és hír tartalmak
- `src/content/partners/modals/`: partner modál szövegek

Ezeket a [src/helpers/mdFile.js](C:/Users/heves/vscode_projects/protalentis-f6/src/helpers/mdFile.js:1) helper tölti be.

## Szerkesztési szabály

- Hosszabb szöveges tartalom módosításához a megfelelő `.md` fájlt szerkeszd a `src/content/` alatt.
- Layout vagy markup módosításához a `src/pages/` vagy `src/partials/` fájlokat szerkeszd.
- Frontmatter mezőknél YAML szintaxis érvényes.
- Tartalmi módosítás után mindig futtasd:

```bash
npm run build
```

Ez gyorsan kiszűri a YAML, Handlebars és Markdown renderelési hibákat.

## Pályázatok kezelése Front Matter CMS-sel

Minden pályázat egyetlen Markdown-fájlban található a `src/content/palyazatok/news/` mappában. A fájl eleji YAML front matter tartalmazza a kártya és az oldal metaadatait, alatta pedig a pályázat teljes leírása írható Markdownban.

A javasolt VS Code bővítmény a **Front Matter CMS** (`eliostruyf.vscode-front-matter`). A workspace automatikusan felajánlja a telepítését. Új pályázat létrehozása:

1. nyisd meg a Front Matter CMS panelt a VS Code oldalsávjában
2. válaszd a **Create new content** műveletet
3. válaszd a **Pályázatok** mappát és a `palyazat` tartalomtípust
4. töltsd ki a címet, URL-azonosítót, dátumokat és a kártyán megjelenő mezőket
5. írd meg a leírást a létrejött Markdown-fájl törzsében
6. futtasd az `npm run build:dev` parancsot

Az `active` kapcsoló dönti el, hogy a tartalom az aktuális vagy a korábbi pályázatok között jelenik meg. A `slug` adja az oldal URL-jét. A `date` és `deadline` mezők formátuma `yyyy-MM-dd`.

A build a Markdown-fájlokból generálja:

- az oldalfájlokat a `src/pages/hirek/` alatt
- a Panini számára használt `src/data/palyazatok.json` adatfájlt

Mindkettő generált állomány, ezért egyiket sem kell kézzel szerkeszteni.

Kapcsolódó részek:

- adatforrás és tartalmi törzs: `src/content/palyazatok/news/*.md`
- Front Matter CMS konfiguráció: `frontmatter.json`
- generálás: `gulpfile.babel.js`

## Gyakori feladatok

Új normál oldal tartalmának módosítása:

1. keresd meg az oldal `.html` fájlját a `src/pages/` alatt
2. az ott megadott `title` alapján keresd meg a megfelelő `.md` fájlt a `src/content/pages/body/` alatt
3. szerkesztés után futtasd a buildet

Új partner modál szövegének módosítása:

1. nyisd meg a megfelelő fájlt a `src/content/partners/modals/` alatt
2. szerkesztés után futtasd a buildet

Meglévő pályázat módosítása:

1. nyisd meg a Front Matter CMS tartalomkezelő paneljét
2. válaszd ki a pályázatot a tartalomlistából
3. módosítsd a metaadatokat vagy a Markdown-törzset
4. futtasd a buildet
