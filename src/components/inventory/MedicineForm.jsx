import { useEffect, useState } from "react";

function MedicineForm({
  onSubmit,
  medicine,
  isEditing,
}) {
  const [formData, setFormData] = useState({
    
    name: "",
    category: "",
    manufacturer: "",
    batch_number: "",
    expiry_date: "",
    purchase_price: "",
    selling_price: "",
    quantity: "",
    minimum_stock: "",
  });
useEffect(() => {
  if (medicine) {
    setFormData({
      name: medicine.name || "",
      category: medicine.category || "",
      manufacturer: medicine.manufacturer || "",
      batch_number: medicine.batch_number || "",
      expiry_date: medicine.expiry_date || "",
      purchase_price: medicine.purchase_price || "",
      selling_price: medicine.selling_price || "",
      quantity: medicine.quantity || "",
      minimum_stock: medicine.minimum_stock || "",
    });
  }
}, [medicine]);
  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
  e.preventDefault();

  await onSubmit({
  ...formData,
  id: medicine?.id,
});

  setFormData({
    name: "",
    category: "",
    manufacturer: "",
    batch_number: "",
    expiry_date: "",
    purchase_price: "",
    selling_price: "",
    quantity: "",
    minimum_stock: "",
  });
 
}

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >

      <input
        name="name"
        placeholder="Medicine Name"
        onChange={handleChange}
        value={formData.name}
        className="w-full rounded-lg border p-3"
      />

      <input
        name="category"
        placeholder="Category"
        onChange={handleChange}
        value={formData.category}
        className="w-full rounded-lg border p-3"
      />

      <input
        name="manufacturer"
        placeholder="Manufacturer"
        onChange={handleChange}
        value={formData.manufacturer}
        className="w-full rounded-lg border p-3"
      />

      <input
        name="batch_number"
        placeholder="Batch Number"
        onChange={handleChange}
        value={formData.batch_number}
        className="w-full rounded-lg border p-3"
      />

      <input
        type="date"
        name="expiry_date"
        onChange={handleChange}
        value={formData.expiry_date}
        className="w-full rounded-lg border p-3"
      />

      <input
        type="number"
        name="purchase_price"
        placeholder="Purchase Price"
        onChange={handleChange}
        value={formData.purchase_price}
        className="w-full rounded-lg border p-3"
      />

      <input
        type="number"
        name="selling_price"
        placeholder="Selling Price"
        onChange={handleChange}
        value={formData.selling_price}
        className="w-full rounded-lg border p-3"
      />

      <input
        type="number"
        name="quantity"
        placeholder="Quantity"
        onChange={handleChange}
        value={formData.quantity}
        className="w-full rounded-lg border p-3"
      />

      <input
        type="number"
        name="minimum_stock"
        placeholder="Minimum Stock"
        onChange={handleChange}
        value={formData.minimum_stock}
        className="w-full rounded-lg border p-3"
      />

      <button
        className="w-full rounded-lg bg-teal-600 py-3 text-white font-semibold"
      >
        Save Medicine
      </button>

    </form>
  );
}

export default MedicineForm;