import Modal from "@/components/ui/Modal";
import MedicineForm from "@/components/inventory/MedicineForm";

function AddMedicineModal({ open, onClose, onSubmit, medicine, isEditing, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="Edit medicine" size="lg">
      <MedicineForm key={medicine?.id || "medicine"} onSubmit={onSubmit} medicine={medicine} isEditing={isEditing} onCancel={onClose} loading={loading} />
    </Modal>
  );
}

export default AddMedicineModal;

