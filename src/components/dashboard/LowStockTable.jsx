const medicines = [
  {
    name: "Panadol",
    stock: 8,
    status: "Low",
  },
  {
    name: "Augmentin",
    stock: 5,
    status: "Critical",
  },
  {
    name: "Vitamin C",
    stock: 11,
    status: "Low",
  },
  {
    name: "Paracetamol",
    stock: 3,
    status: "Critical",
  },
];

function LowStockTable() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <h2 className="mb-6 text-xl font-bold text-slate-900">
        Low Stock Medicines
      </h2>

      <table className="w-full">

        <thead>

          <tr className="border-b border-slate-200 text-left">

            <th className="pb-3 font-semibold text-slate-700">
              Medicine
            </th>

            <th className="pb-3 font-semibold text-slate-700">
              Stock
            </th>

            <th className="pb-3 font-semibold text-slate-700">
              Status
            </th>

          </tr>

        </thead>

        <tbody>

          {medicines.map((medicine, index) => (

            <tr
              key={index}
              className="border-b border-slate-100"
            >

              <td className="py-4 font-medium">
                {medicine.name}
              </td>

              <td className="py-4">
                {medicine.stock}
              </td>

              <td className="py-4">

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    medicine.status === "Critical"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {medicine.status}
                </span>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default LowStockTable;
