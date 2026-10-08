import { MongoClient } from "mongodb";

// Validate MongoDB URI environment variable
if (!process.env.MONGODB_URI) {
  throw new Error(
    'Invalid or missing environment variable: "MONGODB_URI"\n' +
    'Please add MONGODB_URI to your .env.local file'
  );
}

const uri = process.env.MONGODB_URI;
const options = {
  // Fail after 10s instead of the default 30s when Atlas can't be reached
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  // Serverless: many instances each open their own pool, keep it small
  maxPoolSize: 10,
  maxIdleTimeMS: 60000,
};

// Cached per server instance (and across HMR reloads in development)
const cache = global._mongo || (global._mongo = { client: null, promise: null });

function connect() {
  const client = new MongoClient(uri, options);
  cache.client = client;
  cache.promise = client.connect().catch((error) => {
    // Don't keep a failed connection cached: the next request tries again
    if (cache.client === client) {
      cache.client = null;
      cache.promise = null;
    }
    client.close().catch(() => {});
    throw error;
  });
  return cache.promise;
}

// Returns a connected MongoClient. Retries once on a failed connection,
// so a temporary hiccup doesn't break the request.
export async function getClient() {
  try {
    return await (cache.promise || connect());
  } catch (error) {
    console.error("MongoDB connection failed, retrying once:", error.message);
    // Another request may already have started a new connection
    return cache.promise || connect();
  }
}
