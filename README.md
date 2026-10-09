# Stiksel Inventaris

Stockbeheer voor Stiksel (Next.js, pages router, MongoDB Atlas). Zelfde opzet als de Castaar-inventaris, in de huisstijl van stiksel.com.

Elke database op de cluster is een inventaris (een tab), elke collectie een categorie. Een product is één variant van een model: `refnr` + `kleur` + `maat` (+ `gender`), met `stock` (stuks) en `akp` (aankoopprijs per stuk). Waarde = stock × akp.

## Wat het kan

- **Overzicht**: totale stockwaarde per database, op / bijna op / dubbele rijen / zonder AKP, laatst gewijzigd.
- **Per database**: één kaart per model (refnr) met zijn kleuren en maten; filter op categorie, kleur en maat; sorteren; tegels of rijen. Een model openen toont de tabel kleuren × maten, een aantal aanklikken om af te boeken of aan te vullen.
- **Bijna op** per inventaris in te stellen (bij Categorieën), standaard uit. **Nieuwe inventaris** (bv. DTF-printer) via het menu.
- **Productpaneel**: afboeken of aanvullen met een aantal, alle kleuren × maten van hetzelfde refnr in één tabel, gegevens en historiek.
- **Nieuw product**: een bekend refnr vult model, merk, gender en AKP in; meerdere maten tegelijk met `S, M, L`. Een variant die al bestaat wordt geweigerd (geen dubbels meer).
- **Categorieën** aanmaken, hernoemen, verwijderen (alleen leeg).
- **CSV export** (alles, een database of een categorie) en **CSV import** met controle vooraf. Komma of puntkomma, met of zonder `id`/`versie` uit een export. Rijen die na de export in de app gewijzigd zijn, worden overgeslagen. Voor elke import wordt een back-up bewaard (laatste 10).
- **Historiek** van elke stockwijziging en de meest verbruikte producten.
- **AI-assistent** in het zoekveld (Enter), als `GEMINI_API_KEY` ingesteld is.
- Login met één wachtwoord, IP-whitelist, CSRF-bescherming, security headers, licht en donker thema.

De oude adressen (`/database`, `/database/collectie`, `/database/collectie/refnr-kleur`) sturen door naar de juiste plek in het dashboard.

## Instellen

Kopieer `.env.example` naar `.env.local` en vul in. Op Vercel dezelfde variabelen als environment variables.

- `MONGODB_URI` (verplicht)
- `APP_PASSWORD` en `AUTH_SECRET`: zet je beide, dan moet iedereen inloggen. Zonder beschermt alleen de IP-whitelist.
- `ALLOWED_IPS`, `CF_ORIGIN_SECRET`: zie `proxy.js`.
- `IMPORT_PASSWORD` (optioneel), `GEMINI_API_KEY` (optioneel).
- `CASTAAR_URL` (optioneel): adres van de Castaar-inventaris, voor de knop "Castaar" in de header.

De app bewaart historiek, AI-gebruik en import-back-ups in de database `stiksel_inventaris`; die verschijnt niet als inventaris.

## Ontwikkelen

```bash
npm install
npm run dev
npm run lint
npm test
```

`npm test` draait de unit tests en de integratietests tegen een MongoDB in het geheugen (de eerste keer wordt die gedownload).

## MongoDB

```bash
# Download database
mongodump --uri "mongodb+srv://<username>:<password>@<clustername>/<db_name>" --out /path/to/your/folder

# Import new database
mongorestore --uri "mongodb+srv://<username>:<password>@<clustername>" --db new_db_name /path/to/your/folder/db_name
```
