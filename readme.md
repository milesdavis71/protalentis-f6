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

## Automatikusan generált pályázat oldalak

A `src/data/global.yml` pályázati adataiból a build generál oldalfájlokat a `src/pages/hirek/` alá. Ezeket nem érdemes kézzel szerkeszteni, mert újragenerálódnak.

Kapcsolódó részek:

- adatforrás: `src/data/global.yml`
- generálás: `gulpfile.babel.js`
- tartalmi törzs: `src/content/palyazatok/news/`

## Gyakori feladatok

Új normál oldal tartalmának módosítása:

1. keresd meg az oldal `.html` fájlját a `src/pages/` alatt
2. az ott megadott `title` alapján keresd meg a megfelelő `.md` fájlt a `src/content/pages/body/` alatt
3. szerkesztés után futtasd a buildet

Új partner modál szövegének módosítása:

1. nyisd meg a megfelelő fájlt a `src/content/partners/modals/` alatt
2. szerkesztés után futtasd a buildet

Új pályázati hír tartalmának módosítása:

1. ellenőrizd a kulcsot a `src/data/global.yml` fájlban
2. szerkeszd a megfelelő `.md` fájlt a `src/content/palyazatok/news/` alatt
3. futtasd a buildet
