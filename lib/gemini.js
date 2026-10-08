// Minimal Gemini client with function calling (server only).
// The flash-lite model first; the full flash model when it's overloaded.
const MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"];
const MAX_ATTEMPTS_PER_MODEL = 2;

async function generate(model, apiKey, body) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });
}

// One model turn: returns the content ({ role: "model", parts }) of the first candidate
export async function generateContent({ system, contents, tools }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY ontbreekt");

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents,
    tools: tools?.length ? [{ function_declarations: tools }] : undefined,
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
  };

  let lastError = "";
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      const res = await generate(model, apiKey, body);
      if (res.ok) {
        const data = await res.json();
        const content = data?.candidates?.[0]?.content;
        if (content?.parts?.length) return content;
        lastError = "Geen antwoord ontvangen van Gemini";
      } else {
        const text = await res.text().catch(() => "");
        lastError = `Gemini API error ${res.status}: ${text.slice(0, 300)}`;
        // 429/503: quota or overloaded, worth retrying or trying the next model
        if (res.status !== 503 && res.status !== 429) throw new Error(lastError);
      }
      if (attempt < MAX_ATTEMPTS_PER_MODEL) await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }
  throw new Error(lastError);
}
