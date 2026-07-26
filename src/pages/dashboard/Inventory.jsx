import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import AddMedicineModal from "../../components/inventory/AddMedicineModal";

import {
  getMedicines,
  addMedicine,
} from "../../services/inventoryService";
function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
const [openModal, setOpenModal] = useState(false);
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
    await addMedicine({
      ...formData,
      purchase_price: Number(formData.purchase_price),
      selling_price: Number(formData.selling_price),
      quantity: Number(formData.quantity),
      minimum_stock: Number(formData.minimum_stock),
    });

    setOpenModal(false);

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

      <div className="rounded-2xl bg-white shadow border border-slate-200 overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="p-4 text-left">Medicine</th>

              <th className="p-4 text-left">Category</th>

              <th className="p-4 text-left">Stock</th>

              <th className="p-4 text-left">Expiry</th>

            </tr>

          </thead>

          <tbody>

            {medicines.map((medicine) => (

              <tr
                key={medicine.id}
                className="border-t"
              >

                <td className="p-4">
                  {medicine.name}
                </td>

                <td className="p-4">
                  {medicine.category}
                </td>

                <td className="p-4">
                  {medicine.quantity}
                </td>

                <td className="p-4">
                  {medicine.expiry_date}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>
<AddMedicineModal
  open={openModal}
  onClose={() => setOpenModal(false)}
  onSubmit={handleAddMedicine}
/>
    </div>
  );
}

export default Inventory;