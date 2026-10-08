import { timingSafeEqual } from 'crypto';
import { ObjectId } from 'mongodb';

// Our own data (history, AI usage, import backups). Never shown as an inventory.
export const SETTINGS_DB = 'stiksel_inventaris';
// Databases MongoDB or Atlas manage themselves
const RESERVED_DATABASES = ['admin', 'local', 'config', SETTINGS_DB];

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Returns false (and sends 405) when the method isn't allowed
export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ error: 'Method Not Allowed' });
  return false;
}

// Collection names come from the URL, the request body or a CSV column. Reject anything
// MongoDB treats specially ($, dots, null bytes, system.* collections).
export function assertCollectionName(name) {
  if (
    typeof name !== 'string' ||
    name.length === 0 ||
    name.length > 60 ||
    /[$.\0/\\]/.test(name) ||
    name.startsWith('system')
  ) {
    throw new HttpError(400, 'Ongeldige categorienaam');
  }
  return name;
}

// Turn user input into a safe collection name: "Hoodies Kids" -> "hoodies_kids"
export function normalizeNewCollectionName(input) {
  const name = String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  if (!name || name.length > 40) {
    throw new HttpError(400, 'Naam moet 1-40 letters, cijfers of _ bevatten');
  }
  return assertCollectionName(name);
}

// The inventories are the databases on the cluster. Only names that could exist are accepted;
// whether the database really exists is checked by listDatabaseNames (lib/inventory.js).
export function assertDatabaseName(name) {
  if (
    typeof name !== 'string' ||
    !/^[A-Za-z0-9_-]{1,38}$/.test(name) ||
    RESERVED_DATABASES.includes(name)
  ) {
    throw new HttpError(400, 'Ongeldige database');
  }
  return name;
}

export function isInventoryDatabase(name) {
  return !RESERVED_DATABASES.includes(name);
}

export function parseObjectId(value) {
  if (typeof value !== 'string' || !ObjectId.isValid(value) || value.length !== 24) {
    throw new HttpError(400, 'Ongeldig _id');
  }
  return ObjectId.createFromHexString(value);
}

// Optimistic concurrency: the client sends the updated_at it loaded as expected_updated_at.
// Returns an extra filter so the update only applies when nobody changed the product since.
export function concurrencyFilter(body) {
  if (!body || !('expected_updated_at' in body)) return {};
  const expected = body.expected_updated_at;
  if (expected === null || expected === '') return { updated_at: null }; // never saved with a timestamp
  const date = new Date(expected);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, 'Ongeldige expected_updated_at');
  return { updated_at: date };
}

export const CONFLICT_MESSAGE = 'Iemand anders heeft dit product net aangepast. Herlaad de pagina.';

// Constant-time password comparison
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Log the real error, send a safe message to the client
export function sendError(res, error, context) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(`${context}:`, error);
  return res.status(500).json({ error: 'Interne serverfout' });
}
