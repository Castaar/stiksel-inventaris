import { colorSwatches, swatchBackground } from "../../lib/colors";

// A dot in the product's colour; a dashed circle when the colour name isn't known
export default function ColorDot({ kleur, big = false }) {
  const background = swatchBackground(colorSwatches(kleur));
  return (
    <span
      className={`swatch ${big ? "big" : ""} ${background ? "" : "unknown"}`}
      style={background ? { background } : undefined}
      aria-hidden="true"
    />
  );
}
