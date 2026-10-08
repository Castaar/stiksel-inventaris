// CSV reading and writing (browser and server). Reads both "," and ";" files (Excel in Belgium
// saves with ";"), quoted fields with commas, quotes and line breaks, and a UTF-8 BOM.

function detectDelimiter(text) {
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const count = (char) => firstLine.split(char).length - 1;
  return count(";") > count(",") ? ";" : ",";
}

// Returns the rows as arrays of strings
export function parseCsvRows(input) {
  const text = String(input ?? "").replace(/^﻿/, "");
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.trim() === "") {
      inQuotes = true;
      field = "";
    } else if (char === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field.trim());
    rows.push(row);
  }
  // Skip empty lines (also ";;;;" lines that Excel leaves behind)
  return rows.filter((r) => r.some((value) => value !== ""));
}

// Returns objects keyed by the lower-case header names
export function parseCsv(input) {
  const [header, ...rows] = parseCsvRows(input);
  if (!header) return [];
  const keys = header.map((h) => h.trim().toLowerCase());
  return rows.map((values) => Object.fromEntries(keys.map((key, i) => [key, values[i] ?? ""])));
}

function escapeField(value, delimiter) {
  const str = value === null || value === undefined ? "" : String(value);
  return str.includes(delimiter) || /["\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// With a BOM, so Excel shows accents correctly
export function toCsv(headers, rows, delimiter = ",") {
  const lines = [headers, ...rows].map((row) => row.map((value) => escapeField(value, delimiter)).join(delimiter));
  return `﻿${lines.join("\r\n")}\r\n`;
}
