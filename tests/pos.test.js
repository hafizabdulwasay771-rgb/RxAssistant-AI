import test from "node:test";
import assert from "node:assert/strict";
import { buildFefoProducts } from "../src/utils/fefo.js";

const batch = (id, name, expiry_date, quantity, status = "active") => ({
  id, batch_number: id.toUpperCase(), name, generic_name: "Acetaminophen", dosage_form: "Tablet", strength: "500 mg",
  selling_price: 15, minimum_stock: 2, expiry_date, quantity, status,
});

test("POS groups valid batches into one product and exposes earliest expiry", () => {
  const products = buildFefoProducts([
    batch("later", "Paracetamol", "2027-01-01", 10),
    batch("earlier", "Paracetamol", "2026-09-01", 3),
  ], new Date("2026-08-23T00:00:00Z"));
  assert.equal(products.length, 1);
  assert.equal(products[0].quantity, 13);
  assert.equal(products[0].id, "earlier");
  assert.equal(products[0].earliestExpiryDate, "2026-09-01");
  assert.deepEqual(products[0].batchNumbers, ["EARLIER", "LATER"]);
});

test("POS excludes expired, empty, and archived batches from safe stock", () => {
  const products = buildFefoProducts([
    batch("expired", "Ibuprofen", "2026-08-22", 20),
    batch("empty", "Ibuprofen", "2027-01-01", 0),
    batch("archived", "Ibuprofen", "2027-02-01", 10, "archived"),
    batch("valid", "Ibuprofen", "2027-03-01", 4),
  ], new Date("2026-08-23T00:00:00Z"));
  assert.equal(products.length, 1);
  assert.equal(products[0].quantity, 4);
  assert.deepEqual(products[0].batchNumbers, ["VALID"]);
});
