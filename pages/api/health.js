import { getClient } from "../../lib/mongodb";
import { allowMethods } from "../../lib/api";

// Public status check for an uptime monitor. Only reveals whether the database answers.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET", "HEAD"])) return;
  res.setHeader("Cache-Control", "no-store");

  const started = Date.now();
  try {
    const client = await getClient();
    await client.db("admin").command({ ping: 1 });
    return res.status(200).json({ status: "ok", database: "up", ms: Date.now() - started });
  } catch (error) {
    console.error("health: database ping failed:", error.message);
    return res.status(503).json({ status: "error", database: "down", ms: Date.now() - started });
  }
}
