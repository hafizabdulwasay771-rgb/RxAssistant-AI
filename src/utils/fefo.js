function normalized(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

export function medicineProductKey(medicine) {
  return [medicine.name, medicine.generic_name, medicine.dosage_form, medicine.strength]
    .map(normalized)
    .join("\u001f");
}

function isEligibleBatch(medicine, today) {
  return medicine.status !== "archived"
    && Number(medicine.quantity) > 0
    && Boolean(medicine.expiry_date)
    && String(medicine.expiry_date).slice(0, 10) >= today;
}

// The database remains authoritative. This only makes the POS represent a
// product once, with stock from its non-expired batches combined.
export function buildFefoProducts(medicines, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const groups = new Map();

  for (const medicine of medicines.filter((item) => isEligibleBatch(item, today))) {
    const key = medicineProductKey(medicine);
    const group = groups.get(key) || [];
    group.push(medicine);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, batches]) => {
    const ordered = [...batches].sort((left, right) => String(left.expiry_date).localeCompare(String(right.expiry_date)) || String(left.id).localeCompare(String(right.id)));
    const first = ordered[0];
    return {
      ...first,
      id: first.id,
      fefoKey: key,
      quantity: ordered.reduce((total, batch) => total + Number(batch.quantity || 0), 0),
      batchCount: ordered.length,
      batchNumbers: ordered.map((batch) => batch.batch_number).filter(Boolean),
      earliestExpiryDate: first.expiry_date,
    };
  });
}

export function allocateFefoBatches(batches, requestedQuantity, now = new Date()) {
  let remaining = Number(requestedQuantity);
  if (!Number.isInteger(remaining) || remaining <= 0) throw new Error("Requested quantity must be a positive integer.");

  const today = now.toISOString().slice(0, 10);
  const allocations = [];
  for (const batch of [...batches].filter((item) => isEligibleBatch(item, today)).sort((left, right) => String(left.expiry_date).localeCompare(String(right.expiry_date)) || String(left.id).localeCompare(String(right.id)))) {
    const quantity = Math.min(remaining, Number(batch.quantity));
    if (quantity > 0) allocations.push({ medicine_id: batch.id, batch_number: batch.batch_number, quantity });
    remaining -= quantity;
    if (remaining === 0) return allocations;
  }
  throw new Error("Insufficient eligible stock.");
}
