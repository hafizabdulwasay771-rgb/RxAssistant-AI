import test from "node:test";
import assert from "node:assert/strict";
import { allocateFefoBatches } from "../src/utils/fefo.js";

const now = new Date("2026-08-01T12:00:00Z");
const batch = (id, expiry_date, quantity) => ({ id, batch_number: id.toUpperCase(), expiry_date, quantity, status: "active" });

test("FEFO allocates a sufficient single batch", () => {
  assert.deepEqual(allocateFefoBatches([batch("b1", "2026-08-20", 20)], 10, now), [{ medicine_id: "b1", batch_number: "B1", quantity: 10 }]);
});

test("FEFO chooses the earliest expiry and then the next batch", () => {
  const batches = [batch("b3", "2026-12-10", 100), batch("b2", "2026-09-15", 50), batch("b1", "2026-08-20", 20)];
  assert.deepEqual(allocateFefoBatches(batches, 25, now), [
    { medicine_id: "b1", batch_number: "B1", quantity: 20 },
    { medicine_id: "b2", batch_number: "B2", quantity: 5 },
  ]);
});

test("FEFO never allocates expired batches", () => {
  assert.deepEqual(allocateFefoBatches([batch("expired", "2026-07-31", 100), batch("fresh", "2026-08-20", 8)], 8, now), [{ medicine_id: "fresh", batch_number: "FRESH", quantity: 8 }]);
  assert.throws(() => allocateFefoBatches([batch("expired", "2026-07-31", 100)], 1, now), /Insufficient eligible stock/);
});

test("FEFO rejects insufficient stock without returning a partial allocation", () => {
  assert.throws(() => allocateFefoBatches([batch("b1", "2026-08-20", 2), batch("b2", "2026-09-15", 3)], 6, now), /Insufficient eligible stock/);
});

test("FEFO supports an exact multi-batch quantity with deterministic tie-breaking", () => {
  assert.deepEqual(allocateFefoBatches([batch("b2", "2026-08-20", 3), batch("b1", "2026-08-20", 2)], 5, now), [
    { medicine_id: "b1", batch_number: "B1", quantity: 2 },
    { medicine_id: "b2", batch_number: "B2", quantity: 3 },
  ]);
});
