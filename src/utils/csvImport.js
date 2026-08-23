import { validateReceipt } from "./receiving.js";

export const CSV_COLUMNS = [
  "name", "generic_name", "dosage_form", "strength", "therapeutic_class",
  "manufacturer", "batch_number", "expiry_date", "purchase_price",
  "selling_price", "quantity", "minimum_stock", "supplier", "received_at", "notes",
];

export const REQUIRED_CSV_COLUMNS = [
  "name", "dosage_form", "manufacturer", "batch_number", "expiry_date",
  "purchase_price", "selling_price", "quantity", "received_at",
];

function normalizeHeader(value) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim().toLowerCase();
}

export function parseCsv(text) {
  if (typeof text !== "string" || !text.trim()) throw new Error("The CSV file is empty.");

  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  let justClosedQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
        justClosedQuote = true;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"' && value.length === 0) {
      quoted = true;
      justClosedQuote = false;
    } else if (char === ",") {
      row.push(value);
      value = "";
      justClosedQuote = false;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      value = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      justClosedQuote = false;
    } else if (justClosedQuote && char.trim() !== "") {
      throw new Error("The CSV contains characters after a closing quote.");
    } else {
      value += char;
    }
  }

  if (quoted) throw new Error("The CSV contains an unterminated quoted field.");
  if (value !== "" || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  if (rows.length < 2) throw new Error("The CSV must contain headers and at least one data row.");
  if (rows.length > 1001) throw new Error("CSV imports are limited to 1000 data rows.");

  const headers = rows[0].map(normalizeHeader);
  if (headers.some((header) => !header)) throw new Error("The CSV contains an empty header.");
  const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicates.length) throw new Error("Duplicate CSV header: " + duplicates[0]);
  const unknown = headers.filter((header) => !CSV_COLUMNS.includes(header));
  if (unknown.length) throw new Error("Unsupported CSV column: " + unknown[0]);
  const missing = REQUIRED_CSV_COLUMNS.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error("Missing required CSV column: " + missing[0]);

  return rows.slice(1).map((cells, index) => {
    if (cells.length > headers.length) throw new Error("CSV row " + (index + 2) + " contains too many columns.");
    const data = Object.fromEntries(CSV_COLUMNS.map((column) => [column, ""]));
    headers.forEach((header, columnIndex) => {
      data[header] = String(cells[columnIndex] ?? "").trim();
    });
    return { rowNumber: index + 2, data };
  });
}

export function validateImportRows(rows, existingBatchNumbers = new Set(), today = new Date().toISOString().slice(0, 10)) {
  const normalizedExisting = new Set([...existingBatchNumbers].map((batch) => String(batch).trim().toLowerCase()));
  const batchRows = new Map();
  rows.forEach(({ rowNumber, data }) => {
    const key = String(data.batch_number).trim().toLowerCase();
    if (key) batchRows.set(key, [...(batchRows.get(key) || []), rowNumber]);
  });

  return rows.map(({ rowNumber, data }) => {
    const normalized = { ...data, minimum_stock: data.minimum_stock || "0" };
    const errors = [];
    const warnings = [];
    const validationError = validateReceipt(normalized, today);
    if (validationError) errors.push(validationError);
    if (data.received_at === "") errors.push("Received date is required.");
    const batchKey = data.batch_number.trim().toLowerCase();
    if (batchKey && (batchRows.get(batchKey) || []).length > 1) errors.push("Batch number is duplicated in this CSV.");
    if (batchKey && normalizedExisting.has(batchKey)) errors.push("Batch already exists in this pharmacy.");
    if (!data.therapeutic_class) warnings.push("Therapeutic class is optional and was left blank.");
    return { rowNumber, data: normalized, errors, warnings, valid: errors.length === 0 };
  });
}





