import Modal from "@/components/ui/Modal";
import MedicineForm from "@/components/inventory/MedicineForm";

function AddMedicineModal({ open, onClose, onSubmit, medicine, isEditing, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit medicine" : "Add medicine"} size="lg">
      <MedicineForm
        key={medicine?.id || "new-medicine"}
        onSubmit={onSubmit}
        medicine={medicine}
        isEditing={isEditing}
        onCancel={onClose}
        loading={loading}
      />
    </Modal>
  );
}

export default AddMedicineModal;