import { useId } from "react";

import { PRODUCT_FIELDS } from "../../lib/product";
import ColorDot from "./color-dot";

function Field({ field, value, onChange, suggestions, autoFocus }) {
  const id = useId();
  const listId = `${id}-list`;

  if (field.type === "checkbox") {
    return (
      <label className="check" htmlFor={id}>
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }

  const options = field.list ? suggestions?.[field.key] || [] : [];
  return (
    <div className="field">
      <label htmlFor={id}>
        {field.label}
        {field.required && " *"}
        {field.key === "kleur" && value && (
          <>
            {" "}
            <ColorDot kleur={value} />
          </>
        )}
      </label>
      <input
        id={id}
        type={field.type === "number" ? "text" : field.type}
        inputMode={field.type === "number" ? "decimal" : undefined}
        className="input"
        placeholder={field.placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        list={options.length ? listId : undefined}
        data-autofocus={autoFocus || undefined}
      />
      {options.length > 0 && (
        <datalist id={listId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
    </div>
  );
}

// The product form (edit and new). `suggestions` lists the existing values per field.
export default function ProductFields({ values, onChange, suggestions, skip = [] }) {
  return PRODUCT_FIELDS.filter((field) => !skip.includes(field.key)).map((field, index) => (
    <Field
      key={field.key}
      field={field}
      value={values[field.key]}
      onChange={(value) => onChange(field.key, value)}
      suggestions={suggestions}
      autoFocus={index === 0}
    />
  ));
}

// Values from the products of a database, most used first, for the suggestions
export function suggestionsFor(products) {
  const out = {};
  for (const field of PRODUCT_FIELDS.filter((f) => f.list)) {
    const counts = new Map();
    products.forEach((p) => {
      const value = String(p[field.key] ?? "").trim();
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    });
    out[field.key] = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 200).map(([value]) => value);
  }
  return out;
}
