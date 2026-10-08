// Browser-side changes to the inventory, through the API routes
import { postJson } from "./client-api";

const target = (product) => ({ db: product.db, collection: product.collection, _id: product._id });

// Adds or takes out pieces in one atomic step on the server, so two people can't overwrite each other
export async function changeQuantity(product, delta) {
  return postJson("/api/products/adjust", { ...target(product), delta });
}

export async function updateProduct(product, values) {
  return postJson("/api/products/update", {
    ...values,
    ...target(product),
    expected_updated_at: product.updated_at ?? null,
  });
}

export async function deleteProduct(product) {
  return postJson("/api/products/delete", target(product));
}

export async function addProduct(db, collection, values) {
  return postJson("/api/products/add", { ...values, db, collection });
}

export async function manageCollection(db, body) {
  return postJson("/api/collections", { db, ...body });
}

// A CSV of one database (and optionally one category), or of everything
export async function downloadExport(db, collection) {
  const params = new URLSearchParams();
  if (db) params.set("db", db);
  if (collection) params.set("collection", collection);
  const response = await fetch(`/api/export?${params}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP-fout ${response.status}`);
  }
  const blob = await response.blob();
  const match = (response.headers.get("Content-Disposition") || "").match(/filename="(.+)"/);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = match ? match[1] : "stiksel-inventaris.csv";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// dryRun returns what would change without writing anything
export async function uploadImport(file, { db, collection, password, dryRun }) {
  const formData = new FormData();
  formData.append("file", file);
  const params = new URLSearchParams({ db });
  if (collection) params.set("collection", collection);
  if (dryRun) params.set("dryRun", "1");
  const response = await fetch(`/api/import?${params}`, {
    method: "POST",
    headers: password ? { "x-import-password": password } : {},
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Verkeerd importwachtwoord" : data.error || `HTTP-fout ${response.status}`);
  }
  return data;
}
