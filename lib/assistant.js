// Stock assistant (server only): Gemini answers questions by calling search functions on the
// real stock, so models, colours, sizes and quantities always come from the database, never from the model.
import { getClient } from "./mongodb";
import { SETTINGS_DB } from "./api";
import { loadInventories } from "./inventory";
import { listHistory, topUsage } from "./history";
import { searchProducts } from "./stock-search.js";
import { generateContent } from "./gemini";
import { compareSizes } from "./product.js";
import { eur, nf, productKey } from "./stock-view.js";

export const DAILY_QUESTION_LIMIT = 150;
const MAX_TOOL_ROUNDS = 5;
const MAX_SHOWN_PRODUCTS = 12;
export const MAX_QUESTION_LENGTH = 500;

const SYSTEM_PROMPT = `Je bent de stock-assistent van Stiksel (textieldrukkerij: kledij die bedrukt of geborduurd wordt). Collega's typen in het zoekveld wat ze nodig hebben.
Regels:
- Gebruik ALTIJD de functies om stock op te zoeken. Verzin nooit modellen, kleuren, maten of aantallen.
- Een product is één variant: refnr + kleur + maat (+ gender). Aantallen zijn stuks.
- Gevonden producten toon je met toon_producten: geef de id's mee, de beste keuze eerst (max ${MAX_SHOWN_PRODUCTS}).
  De app toont die producten als kaartjes onder je antwoord, dus herhaal de productlijst NIET in je tekst.
- Je tekst is in het Nederlands en kort: 1 tot 3 zinnen met de conclusie (bv. of er genoeg stuks zijn in de gevraagde maten, of welke kleur het meeste stock heeft).
- Vraagt iemand een aantal (bv. "20 zwarte hoodies in M"), tel dan de stock over de gevonden varianten op en zeg duidelijk of het volstaat.
- Kleuren: kleurnamen kunnen Nederlands of Engels zijn. Geef bij zoek_producten de kleur mee in het veld kleur (bv. "blauw" vindt ook navy en royal blue).
- Maten zoals S, M, L, XL geef je mee in het veld maat.
- Is er niets gevonden, zeg dan duidelijk: "Geen stock: dit is niet mogelijk met de huidige stock." en roep toon_producten niet aan.
- Twijfel je welke database of categorie bedoeld is, roep dan eerst categorieen aan.
- Over verbruik en historiek: gebruik meest_verbruikt of wijzigingen. Daar mag je wel een kort lijstje met "- " in je tekst zetten.
- Producten met lang_in_stock liggen al lang in voorraad: zet ze bij een gelijkwaardige keuze eerst en zeg dat ze eerst op mogen.`;

const TOOLS = [
  {
    name: "toon_producten",
    description: "Toont producten als kaartjes onder je antwoord. Gebruik de id's uit de zoekresultaten.",
    parameters: {
      type: "OBJECT",
      properties: { ids: { type: "ARRAY", items: { type: "STRING" }, description: "Product-id's, beste eerst" } },
      required: ["ids"],
    },
  },
  {
    name: "zoek_producten",
    description: "Zoekt producten (varianten) op woorden in refnr, modelnaam, merk, kleur of categorie, en filtert op kleur, maat, merk en gender.",
    parameters: {
      type: "OBJECT",
      properties: {
        zoektermen: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Woorden waarvan er minstens één moet voorkomen, bv. [\"hoodie\", \"sweater\"]. Leeg = alles.",
        },
        kleur: { type: "STRING", description: "Kleur of kleurfamilie, bv. zwart, navy, blauw" },
        maat: { type: "STRING", description: "Exacte maat, bv. M of XL" },
        merk: { type: "STRING", description: "Merk, bv. just hoods" },
        gender: { type: "STRING", description: "Bv. dames, heren, unisex, kids" },
        database: { type: "STRING", description: "Beperk tot één database (zie categorieen)" },
        categorie: { type: "STRING", description: "Beperk tot een categorie" },
        ook_uitverkocht: { type: "BOOLEAN", description: "Ook producten met 0 in stock tonen" },
      },
    },
  },
  {
    name: "categorieen",
    description: "Alle databases met hun categorieën en het aantal producten.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "meest_verbruikt",
    description: "De producten die het vaakst afgeboekt werden (verbruik).",
    parameters: {
      type: "OBJECT",
      properties: { dagen: { type: "NUMBER", description: "Periode in dagen, standaard 30" } },
    },
  },
  {
    name: "wijzigingen",
    description: "Laatste wijzigingen in de stock (aangevuld, afgeboekt, ...), eventueel van één product.",
    parameters: {
      type: "OBJECT",
      properties: { zoekterm: { type: "STRING", description: "Refnr, modelnaam, kleur of categorie" } },
    },
  },
];

function describeProduct(product) {
  const item = {
    id: productKey(product),
    database: product.db,
    categorie: product.collection,
    refnr: product.refnr,
    model: product.modelnaam,
    merk: product.merk,
    kleur: product.kleur,
    maat: product.maat,
    gender: product.gender,
    stock: `${nf.format(Number(product.stock) || 0)} stuks`,
  };
  if (product.has_price) item.akp = eur.format(product.akp);
  if (product.leverdatum) item.leverdatum = product.leverdatum;
  if (product.lang_in_stock) item.lang_in_stock = true;
  return item;
}

async function runTool(name, args, loadProducts) {
  switch (name) {
    case "zoek_producten": {
      const hits = searchProducts(await loadProducts(), {
        terms: Array.isArray(args.zoektermen) ? args.zoektermen.map(String) : [],
        kleur: args.kleur,
        maat: args.maat,
        merk: args.merk,
        gender: args.gender,
        db: args.database,
        collection: args.categorie,
        onlyAvailable: !args.ook_uitverkocht,
      });
      hits.sort((a, b) => String(a.refnr).localeCompare(String(b.refnr)) || String(a.kleur).localeCompare(String(b.kleur)) || compareSizes(a.maat, b.maat));
      return {
        aantal_varianten: hits.length,
        totaal_stuks: hits.reduce((n, p) => n + (Number(p.stock) || 0), 0),
        producten: hits.slice(0, 60).map(describeProduct),
      };
    }
    case "categorieen": {
      const products = await loadProducts();
      const result = {};
      for (const product of products) {
        result[product.db] ??= {};
        result[product.db][product.collection] = (result[product.db][product.collection] || 0) + 1;
      }
      return { databases: result };
    }
    case "meest_verbruikt": {
      const days = Math.min(Math.max(Number(args.dagen) || 30, 1), 365);
      const top = await topUsage({ days, limit: 10 });
      return {
        periode_dagen: days,
        producten: top.map((item) => ({
          refnr: item.refnr,
          model: item.name,
          kleur: item.kleur,
          maat: item.maat,
          categorie: item._id.collection,
          verbruikt_stuks: item.used,
          keer_afgeboekt: item.times,
        })),
      };
    }
    case "wijzigingen": {
      const entries = await listHistory({ search: args.zoekterm ? String(args.zoekterm) : "", limit: 20 });
      return {
        wijzigingen: entries.map((e) => ({
          datum: e.at.toISOString(),
          refnr: e.refnr,
          model: e.name,
          kleur: e.kleur,
          maat: e.maat,
          categorie: e.collection,
          soort: e.source,
          van: e.before,
          naar: e.after,
        })),
      };
    }
    default:
      return { fout: `Onbekende functie ${name}` };
  }
}

let usageIndex;

// Counts the question for today; false when the daily limit is reached
export async function takeQuestionFromQuota() {
  const client = await getClient();
  const usage = client.db(SETTINGS_DB).collection("ask_usage");
  // One document per day; the unique index makes the upsert below fail instead of adding a second one
  usageIndex ??= usage.createIndex({ date: 1 }, { unique: true }).catch((error) => {
    usageIndex = undefined;
    throw error;
  });
  await usageIndex;
  const date = new Date().toISOString().slice(0, 10);
  const doc = await usage
    .findOneAndUpdate({ date, count: { $lt: DAILY_QUESTION_LIMIT } }, { $inc: { count: 1 } }, { upsert: true, returnDocument: "after" })
    .catch((error) => {
      // Upsert on a full day's document hits the unique date index
      if (error.code === 11000) return null;
      throw error;
    });
  return Boolean(doc);
}

// Returns { answer, products }: the answer text and the keys (db:collection:id) of the products to show
export async function askAssistant(question) {
  let products;
  const loadProducts = async () => {
    products ??= loadInventories().then((inventories) => Object.values(inventories).flatMap((part) => part.products));
    return products;
  };

  let shown = [];
  // Only keys of products that exist: the model can't make up a product card
  const showProducts = async (ids) => {
    const known = new Set((await loadProducts()).map(productKey));
    shown = [...new Set((Array.isArray(ids) ? ids : []).map(String))].filter((id) => known.has(id)).slice(0, MAX_SHOWN_PRODUCTS);
    return { getoond: shown.length };
  };

  const contents = [{ role: "user", parts: [{ text: question }] }];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const content = await generateContent({ system: SYSTEM_PROMPT, contents, tools: round < MAX_TOOL_ROUNDS ? TOOLS : [] });
    const calls = content.parts.filter((part) => part.functionCall);
    if (!calls.length) {
      const answer = content.parts.map((part) => part.text || "").join("").trim();
      return { answer: answer || (shown.length ? "" : "Ik vond geen antwoord, probeer het anders te vragen."), products: shown };
    }

    // Keep the model's turn as is (it may carry thought signatures), then answer each call
    contents.push(content);
    const responses = await Promise.all(
      calls.map(async ({ functionCall }) => {
        const args = functionCall.args || {};
        let result;
        try {
          result =
            functionCall.name === "toon_producten" ? await showProducts(args.ids) : await runTool(functionCall.name, args, loadProducts);
        } catch (error) {
          console.error(`assistant: ${functionCall.name} failed:`, error);
          result = { fout: "Opzoeken mislukt" };
        }
        return { functionResponse: { id: functionCall.id, name: functionCall.name, response: result } };
      })
    );
    contents.push({ role: "user", parts: responses });
  }
  return { answer: "Dit lukte niet in een paar stappen, probeer een eenvoudigere vraag.", products: shown };
}
