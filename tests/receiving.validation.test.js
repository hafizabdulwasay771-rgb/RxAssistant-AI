import test from "node:test";
import assert from "node:assert/strict";
import { validateReceipt } from "../src/utils/receiving.js";

const valid = {
  name: "Paracetamol", dosage_form: "Tablet", manufacturer: "Acme",
  batch_number: "P-001", expiry_date: "2027-01-01", purchase_price: "10",
  selling_price: "15", quantity: "20", minimum_stock: "2", received_at: "2026-08-23",
};

test("receiving accepts a valid new batch", () => {
  assert.equal(validateReceipt(valid, "2026-08-23"), null);
});
test("receiving rejects missing required fields", () => {
  assert.match(validateReceipt({ ...valid, batch_number: "" }, "2026-08-23"), /required/i);
});
test("receiving rejects non-positive or fractional quantity", () => {
  assert.match(validateReceipt({ ...valid, quantity: "0" }, "2026-08-23"), /positive/i);
  assert.match(validateReceipt({ ...valid, quantity: "1.5" }, "2026-08-23"), /whole number/i);
});
test("receiving rejects invalid price relationships", () => {
  assert.match(validateReceipt({ ...valid, purchase_price: "-1" }, "2026-08-23"), /non-negative/i);
  assert.match(validateReceipt({ ...valid, selling_price: "9" }, "2026-08-23"), /lower/i);
});
test("receiving rejects expired and future-dated receipts", () => {
  assert.match(validateReceipt({ ...valid, expiry_date: "2026-08-22" }, "2026-08-23"), /Expiry/i);
  assert.match(validateReceipt({ ...valid, received_at: "2026-08-24" }, "2026-08-23"), /Received/i);
});
