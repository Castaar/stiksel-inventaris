// Shared parts of the product API routes (server only)
import { getClient } from "./mongodb";
import { assertCollectionName, parseObjectId } from "./api";
import { existingDatabase } from "./inventory";

// { db, collection } from a request body: an existing database and a valid category name
export async function productTarget(body) {
  const dbName = await existingDatabase(body?.db);
  const collectionName = assertCollectionName(body?.collection);
  const client = await getClient();
  return { dbName, collectionName, collection: client.db(dbName).collection(collectionName) };
}

export function productId(body) {
  return parseObjectId(typeof body?._id === "string" ? body._id : "");
}
