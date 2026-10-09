// Runs the real API route handlers against an in-memory MongoDB replica set.
import http from 'node:http';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

export const APP_PASSWORD = 'test-app-password';

let replSet;
let server;
let baseUrl;

const ROUTES = [
  'products/add', 'products/adjust', 'products/update', 'products/delete',
  'export', 'import', 'collections', 'settings', 'health', 'login', 'history', 'ask',
];

// Minimal version of the Next.js API route runtime (query, body parser, res helpers)
function nextApiAdapter(handlers) {
  return async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const route = url.pathname.replace(/^\/api\//, '');
    const handler = handlers[route];
    if (!handler) {
      res.statusCode = 404;
      return res.end();
    }

    req.query = Object.fromEntries(url.searchParams);
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); return res; };
    res.send = (body) => { res.end(body); return res; };

    if (handler.config?.api?.bodyParser !== false) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      req.body = (req.headers['content-type'] || '').includes('application/json') && raw ? JSON.parse(raw) : raw;
    }
    return handler.default(req, res);
  };
}

export async function startApp() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri();
  delete process.env.IMPORT_PASSWORD;
  process.env.APP_PASSWORD = APP_PASSWORD;
  process.env.AUTH_SECRET = 'test-auth-secret';

  // Nested routes (products/add) can't be a variable import in Vite, so load them through a glob
  const modules = import.meta.glob('../../pages/api/**/*.js');
  const handlers = {};
  for (const route of ROUTES) {
    handlers[route] = await modules[`../../pages/api/${route}.js`]();
  }

  server = http.createServer(nextApiAdapter(handlers));
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;

  const { getClient } = await import('../../lib/mongodb.js');
  return getClient();
}

export async function stopApp() {
  const { getClient } = await import('../../lib/mongodb.js');
  await (await getClient()).close();
  await new Promise((resolve) => server.close(resolve));
  await replSet.stop();
}

export async function api(path, { method = 'POST', body, headers = {} } = {}) {
  const isForm = body instanceof FormData;
  const response = await fetch(`${baseUrl}/api/${path}`, {
    method,
    headers: isForm || body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  const type = response.headers.get('content-type') || '';
  const data = type.includes('json') ? await response.json() : Buffer.from(await response.arrayBuffer());
  return { status: response.status, data, headers: response.headers };
}
