import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { nf, productTitle, quantity, sum } from "../../lib/stock-view";
import { splitRows } from "../../lib/stock-actions";
import { filledVariants, gridKey } from "../../lib/variant-grid";
import { DrawerBody, DrawerFoot, DrawerHead } from "./drawer";
import VariantGrid from "./variant-grid";

const lower = (value) => String(value ?? "").trim().toLowerCase();

// A real colour or size of the model: not "onbekend" and not a range like "2xs -> 2xl"
const isReal = (value) => value && value !== "onbekend" && !value.includes("->");

// Divide the pieces of rows like "kleur onbekend" over real colours and sizes.
// What isn't filled in stays where it is, so nothing has to be deleted first.
export default function SplitDrawer({ rows, variants, suggestions, onClose, onDone }) {
  const unique = (field) => [...new Set(variants.map((p) => lower(p[field])).filter(isReal))];
  const [colors, setColors] = useState(() => unique("kleur"));
  const [sizes, setSizes] = useState(() => unique("maat"));
  const [quantities, setQuantities] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const total = sum(rows, quantity);
  const filled = filledVariants(colors, sizes, quantities);
  const divided = sum(filled || [], (variant) => variant.stock);
  const left = total - divided;
  const source = [lower(rows[0].kleur), lower(rows[0].maat)];
  const usesSource = (filled || []).some((variant) => variant.kleur === source[0] && variant.maat === source[1]);

  // What's in stock now for each cell: dividing to that cell adds to it
  const existing = useMemo(() => {
    const map = new Map();
    variants
      .filter((p) => lower(p.gender) === lower(rows[0].gender))
      .forEach((p) => map.set(gridKey(lower(p.kleur), lower(p.maat)), Number(p.stock) || 0));
    return map;
  }, [variants, rows]);

  const save = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await splitRows(rows, filled);
      toast.success(`${nf.format(divided)} stuks verdeeld`);
      await onDone();
    } catch (error) {
      toast.error(`Verdelen mislukt: ${error.message}`);
      setIsSaving(false);
    }
  };

  const problem = !filled ? "Een aantal klopt niet: vul enkel getallen in" : left < 0 ? `Dat is ${nf.format(-left)} stuks te veel` : usesSource ? "Kies een andere kleur of maat dan de rij die je verdeelt" : null;

  return (
    <>
      <DrawerHead kicker="Verdelen over kleuren en maten" title={<span className="cap">{productTitle(rows[0])}</span>} onClose={onClose} />
      <DrawerBody as="form" id="split-form" onSubmit={save} autoComplete="off">
        <p className="hint">
          Te verdelen: <b>{nf.format(total)} stuks</b> met kleur &ldquo;{rows[0].kleur || "geen"}&rdquo;
          {rows[0].maat ? ` en maat ${rows[0].maat.toUpperCase()}` : ""}. Wat je niet invult, blijft daar staan.
        </p>
        <VariantGrid
          colors={colors}
          sizes={sizes}
          quantities={quantities}
          existing={existing}
          suggestions={suggestions}
          onColors={setColors}
          onSizes={setSizes}
          onQuantity={(key, value) => setQuantities((prev) => ({ ...prev, [key]: value }))}
        />
        {problem ? <p className="error-message">{problem}</p> : <p className="hint">Nog {nf.format(left)} stuks niet verdeeld.</p>}
      </DrawerBody>
      <DrawerFoot>
        <button type="button" className="btn" onClick={onClose}>
          Annuleren
        </button>
        <button type="submit" form="split-form" className="btn primary" disabled={isSaving || Boolean(problem) || divided <= 0}>
          {isSaving ? "Bewaren…" : `${nf.format(divided)} stuks verdelen`}
        </button>
      </DrawerFoot>
    </>
  );
}
