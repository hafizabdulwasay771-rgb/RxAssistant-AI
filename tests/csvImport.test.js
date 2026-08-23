import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, validateImportRows } from "../src/utils/csvImport.js";

const headers = "name,generic_name,dosage_form,strength,therapeutic_class,manufacturer,batch_number,expiry_date,purchase_price,selling_price,quantity,minimum_stock,supplier,received_at,notes";
const row = "Paracetamol,Acetaminophen,Tablet,500 mg,,Acme,P-001,2027-01-01,10,15,20,2,Vendor,2026-08-23,First receipt";

test("CSV parser accepts valid rows and optional therapeutic class", () => {
  const parsed = parseCsv(headers + "\n" + row);
  const result = validateImportRows(parsed, new Set(), "2026-08-23");
  assert.equal(result.length, 1);
  assert.equal(result[0].valid, true);
  assert.equal(result[0].data.therapeutic_class, "");
  assert.equal(result[0].warnings.length, 2);
  assert.ok(result[0].warnings.some((warning) => /legacy text/i.test(warning)));
});

test("CSV parser rejects missing and duplicate headers", () => {
  assert.throws(() => parseCsv("name,batch_number\nA,B"), /Missing required CSV column/);
  assert.throws(() => parseCsv(headers + ",quantity\n" + row + ",1"), /Duplicate CSV header/);
});

test("CSV validation catches bad quantity, price, expiry, and existing batches", () => {
  const parsed = parseCsv(headers + "\nA,,,,,Acme,P-002,2026-08-22,10,9,0,0,,2026-08-23,");
  const result = validateImportRows(parsed, new Set(["P-002"]), "2026-08-23")[0];
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /positive|lower|Expiry|already exists/i.test(error)));
});

test("CSV validation catches duplicate batches and supports multiple valid rows", () => {
  const parsed = parseCsv(headers + "\n" + row + "\n" + row.replace("P-001", "P-002"));
  const result = validateImportRows(parsed, new Set(), "2026-08-23");
  assert.equal(result.filter((item) => item.valid).length, 2);
  const duplicate = validateImportRows(parseCsv(headers + "\n" + row + "\n" + row), new Set(), "2026-08-23");
  assert.equal(duplicate.filter((item) => !item.valid).length, 2);
});

test("CSV parser rejects rows with too many columns", () => {
  assert.throws(() => parseCsv(headers + "\n" + row + ",unexpected"), /too many columns/i);
});

test("CSV parser rejects malformed quoting", () => {
  assert.throws(() => parseCsv(headers + "\n" + '"unclosed'), /unterminated/i);
});

