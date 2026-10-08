import { Fragment } from "react";

import { ProductGrid } from "./product-card";

import styles from "../../styles/stock/_ai.module.scss";

// **bold** inside a line
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part}</Fragment>
  );
}

// Plain lines and "- " lists from the answer
function AnswerText({ text }) {
  const blocks = [];
  for (const line of text.replace(/`/g, "").split("\n").map((l) => l.trim()).filter(Boolean)) {
    const item = line.match(/^[-*•]\s+(.*)/);
    if (item) {
      const last = blocks[blocks.length - 1];
      if (Array.isArray(last)) last.push(item[1]);
      else blocks.push([item[1]]);
    } else {
      blocks.push(line);
    }
  }
  return blocks.map((block, i) =>
    Array.isArray(block) ? (
      <ul key={i}>
        {block.map((item, j) => (
          <li key={j}>{inline(item)}</li>
        ))}
      </ul>
    ) : (
      <p key={i}>{inline(block)}</p>
    )
  );
}

const Spark = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9zM19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z" />
  </svg>
);

// The AI answer above the search results: a button to ask, the loading state, or the answer with product cards.
// `ai` is the state for the current search text ({ loading } | { answer, keys } | { error }), or null.
export default function AiAnswer({ question, ai, onAsk, byKey, cardProps }) {
  if (!ai) {
    return (
      <button type="button" className={styles["ask"]} onClick={onAsk}>
        <Spark />
        <span>
          Vraag de AI: <b>“{question}”</b>
        </span>
        <small>of druk op Enter</small>
      </button>
    );
  }

  const products = (ai.keys || []).map((key) => byKey.get(key)).filter(Boolean);

  return (
    <section className={styles["box"]} aria-live="polite">
      <div className={styles["head"]}>
        <Spark />
        <b>AI</b>
        <span>zoekt in de echte stock, controleer bij twijfel</span>
      </div>
      {ai.loading && <p className={styles["loading"]}>Zoeken in de stock…</p>}
      {ai.error && (
        <p className={styles["error"]}>
          {ai.error}{" "}
          <button type="button" className="linkbtn" onClick={onAsk}>
            Opnieuw
          </button>
        </p>
      )}
      {ai.answer && (
        <div className={styles["text"]}>
          <AnswerText text={ai.answer} />
        </div>
      )}
      {products.length > 0 && <ProductGrid products={products} {...cardProps} />}
    </section>
  );
}
