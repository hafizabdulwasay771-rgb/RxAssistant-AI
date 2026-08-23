import test from "node:test";
import assert from "node:assert/strict";
import { getMedicineConditions } from "../src/utils/medicine.js";

const dateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const base = {
  status: "active",
  expiry_date: dateOffset(18),
  quantity: 10,
  minimum_stock: 5,
};

test("medicine conditions expose low stock and expiry independently", () => {
  const conditions = getMedicineConditions({ ...base, quantity: 3 }, 30);
  assert.equal(conditions.lowStock, true);
  assert.equal(conditions.expiring, true);
  assert.equal(conditions.expired, false);
});

test("expired low-stock medicine retains both conditions", () => {
  const conditions = getMedicineConditions({ ...base, expiry_date: dateOffset(-30), quantity: 3 }, 30);
  assert.equal(conditions.lowStock, true);
  assert.equal(conditions.expired, true);
  assert.equal(conditions.expiring, false);
});
