import { useId, useState } from "react";

import { compareSizes } from "../../lib/product";
import { nf } from "../../lib/stock-view";
import { addTags, gridKey } from "../../lib/variant-grid";
import ColorDot from "./color-dot";

import styles from "../../styles/stock/_drawer.module.scss";

const SIZE_PRESETS = ["xs", "s", "m", "l", "xl", "2xl", "3xl"];

// A list of values: type and press Enter or a comma, tap × to remove. Typed text is added when leaving the field.
function TagInput({ label, tags, onChange, suggestions = [], placeholder, renderTag = (tag) => tag, hideTags = [] }) {
  const id = useId();
  const [text, setText] = useState("");
  const shown = tags.filter((tag) => !hideTags.includes(tag));
  const commit = () => {
    if (text.trim()) onChange(addTags(tags, text));
    setText("");
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input"
        value={text}
        placeholder={placeholder}
        list={suggestions.length ? `${id}-list` : undefined}
        onChange={(e) => {
          // A value from the suggestions has no comma or Enter: it is added when leaving the field
          if (e.target.value.includes(",")) {
            onChange(addTags(tags, e.target.value));
            setText("");
          } else {
            setText(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
      />
      {suggestions.length > 0 && (
        <datalist id={`${id}-list`}>
          {suggestions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
      {shown.length > 0 && (
        <div className="chips">
          {shown.map((tag) => (
            <button key={tag} type="button" className="chip" aria-label={`${tag} verwijderen`} onClick={() => onChange(tags.filter((t) => t !== tag))}>
              {renderTag(tag)} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// One model in several colours and sizes: pick them, then fill in the pieces per colour and size.
// `existing` maps a cell to the stock it has now; filling in that cell adds to it.
export default function VariantGrid({ colors, sizes, quantities, existing, suggestions, onColors, onSizes, onQuantity }) {
  const singleId = useId();
  const sortedSizes = sizes.slice().sort(compareSizes);
  const rows = colors.length ? colors : [""];
  const columns = sortedSizes.length ? sortedSizes : [""];

  const cell = (kleur, maat, labelText) => {
    const key = gridKey(kleur, maat);
    const current = existing.get(key);
    return (
      <>
        <input
          className={`input ${styles["grid-input"]}`}
          inputMode="decimal"
          aria-label={labelText}
          value={quantities[key] ?? ""}
          onChange={(e) => onQuantity(key, e.target.value)}
        />
        {current !== undefined && <small className={styles["grid-now"]}>nu {nf.format(current)}</small>}
      </>
    );
  };

  return (
    <>
      <TagInput
        label="Kleuren"
        tags={colors}
        onChange={onColors}
        suggestions={suggestions.kleur}
        placeholder="bv. navy, zwart (Enter of komma)"
        renderTag={(tag) => (
          <>
            <ColorDot kleur={tag} /> {tag}
          </>
        )}
      />
      <TagInput
        label="Maten"
        tags={sortedSizes}
        onChange={onSizes}
        suggestions={suggestions.maat}
        placeholder="bv. s, m, l (Enter of komma)"
        renderTag={(tag) => tag.toUpperCase()}
        hideTags={SIZE_PRESETS}
      />
      <div className={`chips ${styles["grid-presets"]}`} role="group" aria-label="Snel een maat kiezen">
        {SIZE_PRESETS.map((size) => (
          <button
            key={size}
            type="button"
            className={`chip ${styles["grid-preset"]}`}
            aria-pressed={sizes.includes(size)}
            onClick={() => onSizes(sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size])}
          >
            {size}
          </button>
        ))}
      </div>

      <h3>Aantal stuks</h3>
      {!colors.length && !sizes.length ? (
        <div className="field">
          <label htmlFor={singleId}>Stuks (zonder kleur of maat)</label>
          <div id={singleId}>{cell("", "", "Aantal stuks")}</div>
        </div>
      ) : (
        <>
          <div className={styles["matrix-wrap"]}>
            <table className={styles["matrix"]}>
              <thead>
                <tr>
                  <th scope="col">Kleur</th>
                  {columns.map((maat) => (
                    <th key={maat} scope="col">{maat ? maat.toUpperCase() : "Stuks"}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((kleur) => (
                  <tr key={kleur}>
                    <th scope="row" className="cap">
                      {kleur ? (
                        <>
                          <ColorDot kleur={kleur} /> {kleur}
                        </>
                      ) : (
                        "Geen kleur"
                      )}
                    </th>
                    {columns.map((maat) => (
                      <td key={maat}>{cell(kleur, maat, `${kleur || "geen kleur"} maat ${maat || "-"}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">Laat een vakje leeg als die kleur en maat er niet zijn. Bij &ldquo;nu&rdquo; wordt je aantal bij de bestaande stock opgeteld.</p>
        </>
      )}
    </>
  );
}
