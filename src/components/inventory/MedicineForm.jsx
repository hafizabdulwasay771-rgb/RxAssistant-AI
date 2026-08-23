import { useEffect, useState } from "react";

function MedicineForm({ onSubmit, medicine, isEditing, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: "", dosage_form: "", therapeutic_class: "", manufacturer: "",
    batch_number: "", expiry_date: "", purchase_price: "", selling_price: "",
    quantity: "", minimum_stock: "",
  });

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name || "",
        dosage_form: medicine.dosage_form || "",
        therapeutic_class: medicine.therapeutic_class || "",
        manufacturer: medicine.manufacturer || "",
        batch_number: medicine.batch_number || "",
        expiry_date: medicine.expiry_date || "",
        purchase_price: medicine.purchase_price || "",
        selling_price: medicine.selling_price || "",
        quantity: medicine.quantity ?? "",
        minimum_stock: medicine.minimum_stock ?? "",
      });
    }
  }, [medicine]);

  function handleChange(event) {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({ ...formData, id: medicine?.id });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEditing && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Batch identity, expiry, purchase cost, and stock quantity are protected. Use Receive Stock for new inventory.</p>}
      <input name="name" placeholder="Medicine Name" onChange={handleChange} value={formData.name} className="w-full rounded-lg border p-3" required />
      <input name="dosage_form" placeholder="Dosage Form (Tablet, Syrup, Capsule...)" onChange={handleChange} value={formData.dosage_form} className="w-full rounded-lg border p-3" required />
      <input name="therapeutic_class" placeholder="Therapeutic Class (Antibiotic, Analgesic...)" onChange={handleChange} value={formData.therapeutic_class} className="w-full rounded-lg border p-3" />
      <input name="manufacturer" placeholder="Manufacturer" onChange={handleChange} value={formData.manufacturer} className="w-full rounded-lg border p-3" required />
      <input name="batch_number" placeholder="Batch Number" onChange={handleChange} value={formData.batch_number} className="w-full rounded-lg border p-3 disabled:bg-slate-100" disabled={isEditing} />
      <input type="date" name="expiry_date" onChange={handleChange} value={formData.expiry_date} className="w-full rounded-lg border p-3 disabled:bg-slate-100" disabled={isEditing} />
      <input type="number" name="purchase_price" placeholder="Purchase Price" onChange={handleChange} value={formData.purchase_price} className="w-full rounded-lg border p-3 disabled:bg-slate-100" disabled={isEditing} />
      <input type="number" name="selling_price" placeholder="Selling Price" onChange={handleChange} value={formData.selling_price} className="w-full rounded-lg border p-3" min="0" step="0.01" required />
      <input type="number" name="quantity" placeholder="Quantity" onChange={handleChange} value={formData.quantity} className="w-full rounded-lg border p-3 disabled:bg-slate-100" disabled={isEditing} />
      <input type="number" name="minimum_stock" placeholder="Minimum Stock" onChange={handleChange} value={formData.minimum_stock} className="w-full rounded-lg border p-3" min="0" step="1" required />
      <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-lg border px-4 py-3 text-slate-700">Cancel</button><button disabled={loading} className="w-full rounded-lg bg-teal-600 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Saving..." : "Save changes"}</button></div>
    </form>
  );
}

export default MedicineForm;

