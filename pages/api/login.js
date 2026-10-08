import { allowMethods, safeEqual } from "../../lib/api";
import { authConfigured, clearedSessionCookie, createSessionToken, sessionCookie } from "../../lib/auth";

// Slows down password guessing
const FAILED_LOGIN_DELAY_MS = 500;

// POST { password } logs in, DELETE logs out
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST", "DELETE"])) return;

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearedSessionCookie());
    return res.status(200).json({ ok: true });
  }

  if (!authConfigured()) {
    return res.status(503).json({ error: "Login is niet ingesteld (APP_PASSWORD en AUTH_SECRET)" });
  }
  if (!safeEqual(req.body?.password, process.env.APP_PASSWORD)) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
    return res.status(401).json({ error: "Wachtwoord onjuist" });
  }

  res.setHeader("Set-Cookie", sessionCookie(await createSessionToken()));
  return res.status(200).json({ ok: true });
}
