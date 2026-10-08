// Colour names as they appear in the "kleur" field (Dutch, English, supplier names)
// mapped to a swatch colour and a colour family. Used for the colour dots, the colour
// filter and to find "navy" when someone searches for "blauw".

// [hex, family]
const COLORS = {
  zwart: ["#111111", "zwart"], black: ["#111111", "zwart"], noir: ["#111111", "zwart"], jet: ["#111111", "zwart"],
  wit: ["#ffffff", "wit"], white: ["#ffffff", "wit"], blanc: ["#ffffff", "wit"], optic: ["#ffffff", "wit"],
  grijs: ["#8a8d91", "grijs"], grey: ["#8a8d91", "grijs"], gray: ["#8a8d91", "grijs"], gris: ["#8a8d91", "grijs"],
  heather: ["#b4b6b9", "grijs"], melange: ["#b4b6b9", "grijs"], mélange: ["#b4b6b9", "grijs"], ash: ["#c9cacc", "grijs"],
  sportgrey: ["#b4b6b9", "grijs"], antraciet: ["#3b3d40", "grijs"], anthracite: ["#3b3d40", "grijs"],
  charcoal: ["#3b3d40", "grijs"], graphite: ["#45484d", "grijs"], steel: ["#6f7780", "grijs"], titanium: ["#7c7f84", "grijs"],
  zilver: ["#c0c2c5", "grijs"], silver: ["#c0c2c5", "grijs"],
  navy: ["#1f2a44", "blauw"], marine: ["#1f2a44", "blauw"], marineblauw: ["#1f2a44", "blauw"], ink: ["#24324a", "blauw"],
  blauw: ["#2f5fd0", "blauw"], blue: ["#2f5fd0", "blauw"], bleu: ["#2f5fd0", "blauw"], denim: ["#4a6a8f", "blauw"],
  royal: ["#2340b8", "blauw"], kobalt: ["#1f48b0", "blauw"], cobalt: ["#1f48b0", "blauw"], azure: ["#3f8ee8", "blauw"],
  sky: ["#86c5ea", "blauw"], hemelsblauw: ["#86c5ea", "blauw"], lichtblauw: ["#9fd0ee", "blauw"], babyblauw: ["#b9dcf2", "blauw"],
  turquoise: ["#1fb5b0", "blauw"], turkoois: ["#1fb5b0", "blauw"], aqua: ["#3cc8d0", "blauw"], petrol: ["#1f5f6b", "blauw"],
  teal: ["#1f7a7a", "blauw"], indigo: ["#3a3f8f", "blauw"],
  rood: ["#d0302f", "rood"], red: ["#d0302f", "rood"], rouge: ["#d0302f", "rood"], cherry: ["#a3172f", "rood"],
  bordeaux: ["#6d1a2b", "rood"], burgundy: ["#6d1a2b", "rood"], wine: ["#6d1a2b", "rood"], maroon: ["#6d1a2b", "rood"],
  cardinal: ["#a31d2b", "rood"], koraal: ["#ff7f6a", "rood"], coral: ["#ff7f6a", "rood"], brick: ["#9c3b2b", "rood"],
  roze: ["#f2a7c0", "roze"], pink: ["#f2a7c0", "roze"], rose: ["#f2a7c0", "roze"], fuchsia: ["#d12e8f", "roze"],
  magenta: ["#d12e8f", "roze"], framboos: ["#c42e6b", "roze"], raspberry: ["#c42e6b", "roze"], oudroze: ["#d9a3a8", "roze"],
  paars: ["#6f42a8", "paars"], purple: ["#6f42a8", "paars"], violet: ["#6f42a8", "paars"], aubergine: ["#4a2440", "paars"],
  lila: ["#b9a3d9", "paars"], lilac: ["#b9a3d9", "paars"], lavender: ["#c4b5e6", "paars"], mauve: ["#a07ca8", "paars"],
  groen: ["#2f8f46", "groen"], green: ["#2f8f46", "groen"], vert: ["#2f8f46", "groen"], kelly: ["#2a9d4a", "groen"],
  bottle: ["#0f4d2f", "groen"], flessengroen: ["#0f4d2f", "groen"], forest: ["#1e4d2b", "groen"], dennengroen: ["#1e4d2b", "groen"],
  kaki: ["#8b8456", "groen"], khaki: ["#8b8456", "groen"], olijf: ["#6b6b2a", "groen"], olive: ["#6b6b2a", "groen"],
  army: ["#4b5320", "groen"], military: ["#4b5320", "groen"], legergroen: ["#4b5320", "groen"], sage: ["#9caf88", "groen"],
  saliegroen: ["#9caf88", "groen"], mint: ["#98e0c4", "groen"], munt: ["#98e0c4", "groen"], lime: ["#9bd43b", "groen"],
  limoen: ["#9bd43b", "groen"], appelgroen: ["#8cc63f", "groen"], emerald: ["#1f9e6e", "groen"], smaragd: ["#1f9e6e", "groen"],
  geel: ["#f5d000", "geel"], yellow: ["#f5d000", "geel"], jaune: ["#f5d000", "geel"], sun: ["#f7c600", "geel"],
  lemon: ["#f7ea48", "geel"], citroen: ["#f7ea48", "geel"], mosterd: ["#c99a2e", "geel"], mustard: ["#c99a2e", "geel"],
  oker: ["#c99a2e", "geel"], ochre: ["#c99a2e", "geel"], goud: ["#c9a227", "geel"], gold: ["#c9a227", "geel"],
  oranje: ["#f28c28", "oranje"], orange: ["#f28c28", "oranje"], apricot: ["#f6b37f", "oranje"], abrikoos: ["#f6b37f", "oranje"],
  roest: ["#a5512a", "oranje"], rust: ["#a5512a", "oranje"], terracotta: ["#c0603e", "oranje"],
  bruin: ["#6b4226", "bruin"], brown: ["#6b4226", "bruin"], chocolate: ["#4a2c1a", "bruin"], chocolade: ["#4a2c1a", "bruin"],
  camel: ["#c19a6b", "bruin"], cognac: ["#9a5b2e", "bruin"], taupe: ["#8b7d6b", "bruin"], mokka: ["#6f5443", "bruin"],
  beige: ["#e3d5b8", "beige"], zand: ["#e3d5b8", "beige"], sand: ["#e3d5b8", "beige"], stone: ["#d6cdbd", "beige"],
  naturel: ["#efe6d2", "beige"], natural: ["#efe6d2", "beige"], ecru: ["#efe6d2", "beige"], creme: ["#f3ead6", "beige"],
  crème: ["#f3ead6", "beige"], cream: ["#f3ead6", "beige"], vanilla: ["#f3e5bf", "beige"], offwhite: ["#f4f0e6", "beige"],
};

// Words that change the shade of the colour after them
const LIGHTER = ["licht", "light", "pastel", "baby", "pale", "bleek"];
const DARKER = ["donker", "dark", "deep", "diep"];

export const COLOR_FAMILIES = ["zwart", "wit", "grijs", "blauw", "rood", "roze", "paars", "groen", "geel", "oranje", "bruin", "beige"];

// English and other names that people type for a family, besides the family name itself
const FAMILY_ALIASES = {
  zwart: ["black"], wit: ["white"], grijs: ["grey", "gray"], blauw: ["blue"], rood: ["red"], roze: ["pink"],
  paars: ["purple"], groen: ["green"], geel: ["yellow"], oranje: ["orange"], bruin: ["brown"], beige: ["sand", "naturel"],
};

const normalize = (text) =>
  String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function mix(hex, target, amount) {
  const from = hex.match(/\w\w/g).map((h) => parseInt(h, 16));
  const to = target.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `#${from.map((c, i) => Math.round(c + (to[i] - c) * amount).toString(16).padStart(2, "0")).join("")}`;
}

// One colour name ("dark heather grey") -> { hex, family } or null
function parsePart(part) {
  const words = normalize(part).split(/[^a-z0-9]+/).filter(Boolean);
  let shade = 0;
  for (const word of words) {
    if (LIGHTER.includes(word)) shade = 0.45;
    else if (DARKER.includes(word)) shade = -0.35;
    const color = COLORS[word] || COLORS[word.replace(/s$/, "")];
    if (color) {
      const [hex, family] = color;
      const shaded = shade > 0 ? mix(hex, "#ffffff", shade) : shade < 0 ? mix(hex, "#000000", -shade) : hex;
      return { hex: shaded, family };
    }
  }
  // Glued words: "lichtgrijs", "donkerblauw"
  for (const word of words) {
    const prefix = [...LIGHTER, ...DARKER].find((p) => word.startsWith(p) && COLORS[word.slice(p.length)]);
    if (prefix) return parsePart(`${prefix} ${word.slice(prefix.length)}`);
  }
  return null;
}

// "wit/zwart" or "navy & white" -> up to two swatches. Unknown names give an empty list.
export function colorSwatches(kleur) {
  return String(kleur ?? "")
    .split(/\s*(?:\/|\\|,|&|\+|\s-\s|\sen\s|\sand\s)\s*/i)
    .map(parsePart)
    .filter(Boolean)
    .slice(0, 2);
}

export function colorFamily(kleur) {
  return colorSwatches(kleur)[0]?.family || null;
}

// "blauw", "blue", "Blauw" -> "blauw"; anything else -> null
export function familyForWord(word) {
  const w = normalize(word).trim();
  if (COLOR_FAMILIES.includes(w)) return w;
  return Object.entries(FAMILY_ALIASES).find(([, aliases]) => aliases.includes(w))?.[0] || null;
}

// CSS background for a swatch: one colour, or two halves
export function swatchBackground(swatches) {
  if (!swatches.length) return null;
  if (swatches.length === 1) return swatches[0].hex;
  return `linear-gradient(135deg, ${swatches[0].hex} 50%, ${swatches[1].hex} 50%)`;
}
