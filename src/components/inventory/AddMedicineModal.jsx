import MedicineForm from "./MedicineForm";

function AddMedicineModal({
  open,
  onClose,
  onSubmit,
  medicine,
  isEditing,
}) {
  if (!open) return null;

  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

     <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">

        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-2xl font-bold">
            Add Medicine
          </h2>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-500"
          >
            ✕
          </button>

        </div>

        <MedicineForm
  onSubmit={onSubmit}
  medicine={medicine}
  isEditing={isEditing}
/>

      </div>

    </div>
  );
}

export default AddMedicineModal;