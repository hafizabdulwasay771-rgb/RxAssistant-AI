import { useMemo, useState } from "react";
import { FileUp, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { CSV_COLUMNS, REQUIRED_CSV_COLUMNS, parseCsv, validateImportRows } from "@/utils/csvImport";

const templateRow = [
  "Paracetamol", "Acetaminophen", "Tablet", "500 mg", "", "Acme Pharma",
  "PAR-001", "2027-01-01", "10", "15", "20", "2", "Example supplier",
  "2026-08-23", "Example only",
];

function downloadTemplate() {
  const content = [CSV_COLUMNS.join(","), templateRow.map((value) => '"' + value.replaceAll('"', '""') + '"').join(",")].join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "rx-assistant-inventory-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function CSVImportModal({ open, onClose, onImport, existingBatchNumbers }) {
  const [step, setStep] = useState("upload");
  const [validation, setValidation] = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const counts = useMemo(() => ({
    total: validation.length,
    valid: validation.filter((row) => row.valid).length,
    errors: validation.filter((row) => !row.valid).length,
    duplicates: validation.filter((row) => row.errors.some((item) => /duplicate|already exists/i.test(item))).length,
    warnings: validation.reduce((total, row) => total + row.warnings.length, 0),
  }), [validation]);

  function close() {
    if (importing) return;
    setStep("upload");
    setValidation([]);
    setFileName("");
    setError("");
    setResult(null);
    onClose();
  }

  async function readFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Choose a .csv file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("CSV files are limited to 5 MB.");
      return;
    }
    try {
      const rows = parseCsv(await file.text());
      setValidation(validateImportRows(rows, existingBatchNumbers));
      setFileName(file.name);
      setError("");
      setStep("preview");
    } catch (readError) {
      setError(readError.message || "The CSV could not be read.");
      setStep("upload");
    }
  }

  async function confirmImport() {
    if (counts.errors > 0 || counts.valid === 0) return;
    try {
      setImporting(true);
      const imported = await onImport(validation.filter((row) => row.valid).map((row) => row.data));
      setResult(imported);
      setStep("success");
    } catch (importError) {
      setError(importError.message || "The import failed. No rows were imported.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title="Import inventory CSV" size="lg">
      {step === "upload" && <div className="space-y-5">
        <div><p className="text-sm text-slate-600">Upload a CSV to preview and validate medicine batches before anything is written to inventory.</p><button type="button" onClick={downloadTemplate} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:underline"><Download size={16} />Download CSV template</button></div>
        <label htmlFor="inventory-csv" className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-6 py-12 text-center hover:border-teal-400"><FileUp size={32} className="text-teal-600" /><span className="mt-3 font-extrabold text-slate-800">Choose a CSV file</span><span className="mt-1 text-sm text-slate-500">CSV only, up to 5 MB</span><input id="inventory-csv" type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => readFile(event.target.files?.[0])} /></label>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Accepted columns</p><p className="mt-2 text-xs leading-6 text-slate-600">{CSV_COLUMNS.join(" • ")}</p><p className="mt-2 text-xs text-slate-500"><strong>Required:</strong> {REQUIRED_CSV_COLUMNS.join(", ")}. Therapeutic class is optional.</p></div>
        {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
      </div>}
      {step === "preview" && <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-extrabold text-slate-800">{fileName}</p><p className="text-sm text-slate-500">Review all rows before confirming import.</p></div><Button variant="secondary" onClick={() => setStep("upload")}>Choose another file</Button></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5"><Card className="p-3"><p className="text-xs text-slate-500">Total</p><p className="mt-1 text-xl font-extrabold">{counts.total}</p></Card><Card className="p-3"><p className="text-xs text-slate-500">Valid</p><p className="mt-1 text-xl font-extrabold text-emerald-700">{counts.valid}</p></Card><Card className="p-3"><p className="text-xs text-slate-500">Errors</p><p className="mt-1 text-xl font-extrabold text-rose-700">{counts.errors}</p></Card><Card className="p-3"><p className="text-xs text-slate-500">Duplicates</p><p className="mt-1 text-xl font-extrabold text-amber-700">{counts.duplicates}</p></Card><Card className="p-3"><p className="text-xs text-slate-500">Warnings</p><p className="mt-1 text-xl font-extrabold text-amber-700">{counts.warnings}</p></Card></div>
        <div className="max-h-80 overflow-auto rounded-xl border border-slate-200"><table className="min-w-[900px] w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50 text-slate-500"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Medicine</th><th className="px-3 py-2">Batch</th><th className="px-3 py-2">Quantity</th><th className="px-3 py-2">Expiry</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{validation.map((row) => <tr key={row.rowNumber}><td className="px-3 py-2">{row.rowNumber}</td><td className="px-3 py-2 font-semibold">{row.data.name || "—"}</td><td className="px-3 py-2">{row.data.batch_number || "—"}</td><td className="px-3 py-2">{row.data.quantity || "—"}</td><td className="px-3 py-2">{row.data.expiry_date || "—"}</td><td className="px-3 py-2">{row.valid ? <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><CheckCircle2 size={14} />Ready</span> : <span className="inline-flex items-center gap-1 font-bold text-rose-700"><AlertTriangle size={14} />Blocked</span>}</td><td className="max-w-72 px-3 py-2 text-slate-600">{[...row.errors, ...row.warnings].join(" ") || "—"}</td></tr>)}</tbody></table></div>
        {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button variant="secondary" onClick={close}>Cancel</Button><Button loading={importing} disabled={counts.errors > 0 || counts.valid === 0} onClick={confirmImport}>Confirm import</Button></div>
      </div>}
      {step === "success" && <div className="space-y-5 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={30} /></div><h3 className="text-xl font-extrabold text-slate-900">Import successful</h3><p className="text-sm text-slate-600">{result?.imported_count || counts.valid} batches imported</p><p className="text-sm text-slate-600">{result?.transaction_count || counts.valid} purchase transactions created</p><p className="text-sm text-slate-500">No partial rows were retained.</p><Button onClick={close}>Close</Button></div>}
    </Modal>
  );
}

export default CSVImportModal;



