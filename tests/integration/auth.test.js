import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { NextRequest } from 'next/server';
import { APP_PASSWORD, api, startApp, stopApp } from './setup.js';
import { SESSION_COOKIE, createSessionToken } from '../../lib/auth.js';
import { proxy } from '../../proxy.js';

beforeAll(startApp);
afterAll(stopApp);

const request = (path, cookie) =>
  new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : {} });

describe('login', () => {
  test('sets a session cookie for the right password', async () => {
    const { status, headers } = await api('login', { body: { password: APP_PASSWORD } });
    expect(status).toBe(200);
    expect(headers.get('set-cookie')).toMatch(new RegExp(`^${SESSION_COOKIE}=.+; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`));
  });

  test('rejects a wrong or missing password', async () => {
    for (const body of [{ password: 'fout' }, {}]) {
      const { status, headers } = await api('login', { body });
      expect(status).toBe(401);
      expect(headers.get('set-cookie')).toBeNull();
    }
  });

  test('logout clears the cookie', async () => {
    const { status, headers } = await api('login', { method: 'DELETE' });
    expect(status).toBe(200);
    expect(headers.get('set-cookie')).toMatch(new RegExp(`^${SESSION_COOKIE}=; .*Max-Age=0`));
  });
});

describe('proxy', () => {
  test('sends pages without a session to the login page', async () => {
    const res = await proxy(request('/winkel/hoodies?x=1'));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get('location'));
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('next')).toBe('/winkel/hoodies?x=1');
  });

  test('answers API calls without a session with 401', async () => {
    const res = await proxy(request('/api/collections'));
    expect(res.status).toBe(401);
  });

  test('rejects a forged or expired token', async () => {
    expect((await proxy(request('/', 'not-a-token'))).status).toBe(307);
  });

  test('lets a valid session through', async () => {
    const res = await proxy(request('/', await createSessionToken()));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  test('keeps the login page, health check and 403 page reachable', async () => {
    for (const path of ['/login', '/api/health', '/403']) {
      expect((await proxy(request(path))).headers.get('x-middleware-next')).toBe('1');
    }
  });
});
