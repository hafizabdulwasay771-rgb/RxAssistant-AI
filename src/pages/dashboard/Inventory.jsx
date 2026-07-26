import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

import AddMedicineModal from "../../components/inventory/AddMedicineModal";
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} from "../../services/inventoryService";
function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
const [openModal, setOpenModal] = useState(false);
const [selectedMedicine, setSelectedMedicine] = useState(null);
const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    loadMedicines();
  }, []);

  async function loadMedicines() {
  try {
    const data = await getMedicines();
    setMedicines(data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}

async function handleAddMedicine(formData) {
  try {

    if (isEditing) {

      await updateMedicine(
        formData.id,
        {
          name: formData.name,
          category: formData.category,
          manufacturer: formData.manufacturer,
          batch_number: formData.batch_number,
          expiry_date: formData.expiry_date,
          purchase_price: Number(formData.purchase_price),
          selling_price: Number(formData.selling_price),
          quantity: Number(formData.quantity),
          minimum_stock: Number(formData.minimum_stock),
        }
      );

    } else {

      await addMedicine({
        name: formData.name,
        category: formData.category,
        manufacturer: formData.manufacturer,
        batch_number: formData.batch_number,
        expiry_date: formData.expiry_date,
        purchase_price: Number(formData.purchase_price),
        selling_price: Number(formData.selling_price),
        quantity: Number(formData.quantity),
        minimum_stock: Number(formData.minimum_stock),
      });

    }

    setOpenModal(false);
    setIsEditing(false);
    setSelectedMedicine(null);

    loadMedicines();

  } catch (error) {
    console.error(error);
  }
}
function handleEdit(medicine) {
  setSelectedMedicine(medicine);
  setIsEditing(true);
  setOpenModal(true);
}
async function handleDelete(id) {

  const confirmed = window.confirm(
    "Are you sure you want to delete this medicine?"
  );

  if (!confirmed) return;

  try {

    await deleteMedicine(id);

    loadMedicines();

  } catch (error) {

    console.error(error);

  }

}
  if (loading) {
    return (
      <div className="text-center py-10">
        Loading medicines...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

  <h1 className="text-3xl font-bold">
    Inventory
  </h1>

  <button
    onClick={() => setOpenModal(true)}
    className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-white font-semibold hover:bg-teal-700"
  >
    <Plus size={20} />
    Add Medicine
  </button>

</div>

     <div className="rounded-2xl bg-white shadow border border-slate-200 overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-100">

  <tr>

    <th className="px-6 py-4 text-left font-semibold">
      Medicine
    </th>

    <th className="px-6 py-4 text-left font-semibold">
      Category
    </th>

    <th className="px-6 py-4 text-left font-semibold">
      Manufacturer
    </th>

    <th className="px-6 py-4 text-right font-semibold">
      Purchase
    </th>

    <th className="px-6 py-4 text-right font-semibold">
      Selling
    </th>

    <th className="px-6 py-4 text-center font-semibold">
      Stock
    </th>

    <th className="px-6 py-4 text-center font-semibold">
      Min Stock
    </th>

    <th className="px-6 py-4 text-center font-semibold">
      Expiry
    </th>

    <th className="px-6 py-4 text-center font-semibold">
      Actions
    </th>

  </tr>

</thead>
          <tbody>

            {medicines.map((medicine) => (

              <tr
  key={medicine.id}
  className="border-t hover:bg-slate-50 transition"
>

  <td className="px-6 py-4 font-semibold">
    {medicine.name}
  </td>

  <td className="px-6 py-4">
    {medicine.category}
  </td>

  <td className="px-6 py-4">
    {medicine.manufacturer}
  </td>

  <td className="px-6 py-4 text-right">
    Rs. {medicine.purchase_price}
  </td>

  <td className="px-6 py-4 text-right font-medium text-emerald-600">
    Rs. {medicine.selling_price}
  </td>

  <td
  className={`px-6 py-4 text-center font-semibold ${
    medicine.quantity <= medicine.minimum_stock
      ? "text-red-600"
      : "text-emerald-600"
  }`}
>
  {medicine.quantity}
</td>

 <td className="px-6 py-4 text-center font-medium text-red-600">
  {medicine.minimum_stock}
</td>

  <td className="px-6 py-4 text-center">
    {new Date(medicine.expiry_date).toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})}
  </td>

  <td className="px-6 py-4">
  <div className="flex items-center justify-center gap-2">

    <button
      onClick={() => handleEdit(medicine)}
      className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 transition"
      title="Edit Medicine"
    >
      <Pencil size={18} />
    </button>

    <button
      onClick={() => handleDelete(medicine.id)}
      className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700 transition"
      title="Delete Medicine"
    >
      <Trash2 size={18} />
    </button>

  </div>
</td>

</tr>

            ))}

          </tbody>

        </table>

      </div>
<AddMedicineModal
  open={openModal}
  onClose={() => {
    setOpenModal(false);
    setIsEditing(false);
    setSelectedMedicine(null);
  }}
  onSubmit={handleAddMedicine}
  medicine={selectedMedicine}
  isEditing={isEditing}
/>
    </div>
  );
}

export default Inventory;