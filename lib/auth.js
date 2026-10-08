// Login with one shared password (APP_PASSWORD). A signed session cookie keeps people
// logged in for 30 days. Changing AUTH_SECRET logs everyone out.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "stiksel_stock_session";
const SESSION_DAYS = 30;

export function authConfigured() {
  return Boolean(process.env.APP_PASSWORD && process.env.AUTH_SECRET);
}

function secretKey() {
  return new TextEncoder().encode(process.env.AUTH_SECRET);
}

export async function createSessionToken() {
  return new SignJWT({ role: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySessionToken(token) {
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.role === "user";
  } catch {
    return false;
  }
}

function cookie(value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export const sessionCookie = (token) => cookie(token, SESSION_DAYS * 24 * 60 * 60);
export const clearedSessionCookie = () => cookie("", 0);
