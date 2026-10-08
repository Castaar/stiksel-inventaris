import { allowMethods, sendError, HttpError } from "../../lib/api";
import { MAX_QUESTION_LENGTH, askAssistant, takeQuestionFromQuota } from "../../lib/assistant";

// POST { question } -> { answer, products: ["db:collection:id", ...] }
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;

  try {
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    if (!question) throw new HttpError(400, "Geen vraag opgegeven");
    if (question.length > MAX_QUESTION_LENGTH) throw new HttpError(400, `Vraag is te lang (max ${MAX_QUESTION_LENGTH} tekens)`);
    if (!process.env.GEMINI_API_KEY) throw new HttpError(503, "De assistent is niet ingesteld (GEMINI_API_KEY)");

    if (!(await takeQuestionFromQuota())) {
      return res.status(429).json({ error: "De vragen voor vandaag zijn op. Probeer het morgen opnieuw." });
    }

    return res.status(200).json(await askAssistant(question));
  } catch (error) {
    if (!(error instanceof HttpError)) {
      console.error("ask:", error);
      return res.status(502).json({ error: "De assistent kon even niet antwoorden. Probeer opnieuw." });
    }
    return sendError(res, error, "ask");
  }
}
