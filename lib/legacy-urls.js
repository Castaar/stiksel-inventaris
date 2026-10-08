// The old pages /[database], /[database]/[collection] and /[database]/[collection]/[refnr-kleur]
// moved into the dashboard on "/". Bookmarks and home screen shortcuts redirect to the matching view.
import { getClient } from "./mongodb";
import { assertCollectionName } from "./api";
import { existingDatabase } from "./inventory";

function redirectTo(query) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  const search = params.toString();
  return { redirect: { destination: search ? `/?${search}` : "/", permanent: false } };
}

async function databaseOrNull(name) {
  try {
    return await existingDatabase(name);
  } catch {
    return null;
  }
}

export async function databaseRedirect({ params }) {
  return redirectTo({ tab: await databaseOrNull(params.database) });
}

export async function collectionRedirect({ params }) {
  const db = await databaseOrNull(params.database);
  return redirectTo({ tab: db, cat: db ? params.collection : null });
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Old product links were "refnr-initials of the colour" ("jh001-nb" for navy blue)
export async function productRedirect({ params }) {
  const db = await databaseOrNull(params.database);
  if (!db) return redirectTo({});
  const slug = String(params.refnr || "");
  const lastDash = slug.lastIndexOf("-");
  const refnr = lastDash >= 0 ? slug.slice(0, lastDash) : slug;
  const initials = (lastDash >= 0 ? slug.slice(lastDash + 1) : "").replace(/[^a-z]/gi, "");

  let id = null;
  try {
    const collection = assertCollectionName(params.collection);
    const client = await getClient();
    const query = { refnr };
    if (initials) {
      const pattern = initials.split("").map((c, i) => `${i === 0 ? "^" : "\\s+"}${escapeRegExp(c)}\\S*`).join("");
      query.kleur = { $regex: pattern, $options: "i" };
    }
    const doc = await client.db(db).collection(collection).findOne(query, { projection: { _id: 1 } });
    id = doc ? String(doc._id) : null;
  } catch {
    id = null;
  }
  return redirectTo({ tab: db, cat: params.collection, open: id });
}
