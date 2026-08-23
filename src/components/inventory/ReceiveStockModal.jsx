import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const today = new Date().toISOString().slice(0, 10);
const initialForm = {
  name: "", generic_name: "", dosage_form: "", strength: "", therapeutic_class: "",
  manufacturer: "", batch_number: "", expiry_date: "", purchase_price: "",
  selling_price: "", quantity: "", minimum_stock: "0", supplier: "",
  received_at: today, notes: "",
};

function ReceiveStockModal({ open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    const required = ["name", "dosage_form", "manufacturer", "batch_number", "expiry_date", "purchase_price", "selling_price", "quantity"];
    if (required.some((field) => !String(form[field]).trim())) {
      setError("Complete all required batch, price, and quantity fields.");
      return;
    }
    if (Number(form.quantity) <= 0 || !Number.isInteger(Number(form.quantity))) {
      setError("Quantity received must be a positive whole number.");
      return;
    }
    if (!Number.isFinite(Number(form.purchase_price)) || !Number.isFinite(Number(form.selling_price)) || Number(form.purchase_price) < 0 || Number(form.selling_price) < 0) {
      setError("Prices must be valid non-negative numbers.");
      return;
    }
    if (Number(form.selling_price) < Number(form.purchase_price)) {
      setError("Selling price cannot be lower than purchase price.");
      return;
    }
    if (Number(form.minimum_stock) < 0 || !Number.isInteger(Number(form.minimum_stock))) {
      setError("Minimum stock must be a non-negative whole number.");
      return;
    }
    if (form.expiry_date < today) {
      setError("Expiry date must be today or later.");
      return;
    }
    try {
      await onSubmit(form);
      setForm(initialForm);
      setError("");
    } catch (submitError) {
      setError(submitError.message || "Unable to receive this batch.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Receive new batch" size="lg">
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-slate-500">Record physical stock receipt. The batch and its inventory transaction are saved together.</p>
        {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="receive-name" label="Medicine name *" name="name" value={form.name} onChange={update} required />
          <Input id="receive-generic" label="Generic name" name="generic_name" value={form.generic_name} onChange={update} />
          <Input id="receive-dosage" label="Dosage form *" name="dosage_form" value={form.dosage_form} onChange={update} placeholder="Tablet, syrup" required />
          <Input id="receive-strength" label="Strength" name="strength" value={form.strength} onChange={update} placeholder="500 mg" />
          <Input id="receive-class" label="Therapeutic class" name="therapeutic_class" value={form.therapeutic_class} onChange={update} />
          <Input id="receive-manufacturer" label="Manufacturer *" name="manufacturer" value={form.manufacturer} onChange={update} required />
          <Input id="receive-batch" label="Batch number *" name="batch_number" value={form.batch_number} onChange={update} required />
          <Input id="receive-expiry" label="Expiry date *" name="expiry_date" type="date" value={form.expiry_date} onChange={update} required />
          <Input id="receive-quantity" label="Quantity received *" name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={update} required />
          <Input id="receive-minimum" label="Minimum stock" name="minimum_stock" type="number" min="0" step="1" value={form.minimum_stock} onChange={update} />
          <Input id="receive-purchase" label="Purchase price *" name="purchase_price" type="number" min="0" step="0.01" value={form.purchase_price} onChange={update} required />
          <Input id="receive-selling" label="Selling price *" name="selling_price" type="number" min="0" step="0.01" value={form.selling_price} onChange={update} required />
          <Input id="receive-supplier" label="Supplier / reference" name="supplier" value={form.supplier} onChange={update} />
          <Input id="receive-date" label="Received date" name="received_at" type="date" value={form.received_at} onChange={update} max={today} required />
          <div className="sm:col-span-2"><label htmlFor="receive-notes" className="block text-sm font-semibold text-slate-700">Notes</label><textarea id="receive-notes" name="notes" value={form.notes} onChange={update} rows="3" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={loading}>Receive stock</Button></div>
      </form>
    </Modal>
  );
}

export default ReceiveStockModal;

