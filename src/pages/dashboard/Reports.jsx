import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import { getCurrentProfile, getSettings } from "@/services/appService";
import { getMedicines } from "@/services/inventoryService";
import { makeReport, downloadCsv } from "@/services/reportService";
import { getSales } from "@/services/salesService";
import { friendlyError } from "@/utils/errors";

const labels = { sales: "Sales report", inventory: "Inventory report", expiry: "Expiry report", "low-stock": "Low-stock report" };

function Reports() {
  const [type, setType] = useState("sales");
  const [dates, setDates] = useState({ start: "", end: "" });
  const [source, setSource] = useState({ sales: [], medicines: [], warningDays: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (dates.start && dates.end && dates.start > dates.end) {
      setError("The start date must be before the end date.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const profile = await getCurrentProfile();
      const [settings, medicines, sales] = await Promise.all([
        getSettings(profile.pharmacy_id),
        getMedicines(),
        getSales({ startDate: dates.start, endDate: dates.end }),
      ]);
      setSource({ sales, medicines, warningDays: settings?.expiry_warning_days || 30 });
    } catch (loadError) {
      setError(friendlyError(loadError, "Unable to prepare this report."));
    } finally {
      setLoading(false);
    }
  }, [dates.end, dates.start]);

  useEffect(() => { load(); }, [load]);
  const report = useMemo(() => makeReport(type, source), [source, type]);
  const filename = type + "-report-" + new Date().toISOString().slice(0, 10) + ".csv";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Reports</h2><p className="mt-1 text-sm text-slate-500">Preview structured operational data, then export it as a CSV.</p></div><Button leftIcon={<Download size={18} />} disabled={loading || !report.rows.length} onClick={() => downloadCsv(filename, report)}>Export CSV</Button></div>
      <Card className="p-4"><div className="grid gap-3 md:grid-cols-3"><label className="text-sm font-semibold text-slate-700">Report type<select value={type} onChange={(event) => setType(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-500">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-semibold text-slate-700">Start date<input type="date" value={dates.start} onChange={(event) => setDates((current) => ({ ...current, start: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-500" /></label><label className="text-sm font-semibold text-slate-700">End date<input type="date" value={dates.end} onChange={(event) => setDates((current) => ({ ...current, end: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-500" /></label></div></Card>
      {loading ? <Loader label="Preparing report preview…" /> : error ? <div className="space-y-4"><div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">{error}</div><Button onClick={load}>Try again</Button></div> : <Card className="overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><FileSpreadsheet size={20} /></span><div><h3 className="font-extrabold text-slate-900">{labels[type]}</h3><p className="text-sm text-slate-500">{report.rows.length} matching records</p></div></div>{report.rows.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{report.headers.map((header) => <th key={header} className="whitespace-nowrap px-5 py-3 font-bold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{report.rows.slice(0, 12).map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-5 py-3 text-slate-700">{cell}</td>)}</tr>)}</tbody></table></div> : <div className="p-5"><EmptyState icon={FileSpreadsheet} title="No matching report data" description="Adjust the date range or add operational records to create this report." /></div>}{report.rows.length > 12 && <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">Showing 12 rows in the preview. The CSV includes all {report.rows.length} rows.</p>}</Card>}
    </div>
  );
}

export default Reports;