import { useCallback, useEffect, useState } from "react";
import { BellRing, Building2, LogOut, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import { getCurrentProfile, getSettings, saveSettings, updatePharmacy, updateProfile } from "@/services/appService";
import { friendlyError } from "@/utils/errors";
import { useAuth } from "@/hooks/useAuth";

const initialOperational = {
  currency: "PKR",
  low_stock_threshold: 10,
  expiry_warning_days: 30,
  timezone: "Asia/Karachi",
  expiry_alerts: true,
  low_stock_alerts: true,
  daily_sales_summary: false,
  weekly_business_summary: false,
  critical_alerts: true,
};

function Toggle({ id, label, hint, checked, onChange, disabled }) {
  return <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><span><span className="block font-semibold text-slate-800">{label}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{hint}</span></span><input disabled={disabled} id={id} type="checkbox" checked={checked} onChange={onChange} className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" /></label>;
}

function Settings() {
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", pharmacy_name: "" });
  const [operational, setOperational] = useState(initialOperational);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingOperational, setSavingOperational] = useState(false);
  const [error, setError] = useState("");
  const { signOut } = useAuth();
  const navigate = useNavigate(); const isAdmin = ["owner", "admin"].includes(profile?.role);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const currentProfile = await getCurrentProfile();
      const settings = await getSettings(currentProfile.pharmacy_id);
      setProfile(currentProfile);
      setProfileForm({
        full_name: currentProfile.full_name || "",
        phone: currentProfile.phone || "",
        pharmacy_name: currentProfile.pharmacy_name || "My Pharmacy",
      });
      setOperational({ ...initialOperational, ...(settings || {}) });
    } catch (loadError) {
      setError(friendlyError(loadError, "Unable to load settings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveProfile(event) {
    event.preventDefault();
    if (profileForm.full_name.trim().length < 2 || profileForm.pharmacy_name.trim().length < 2) {
      toast.error("Enter both the owner name and pharmacy name.");
      return;
    }
    try {
      setSavingProfile(true);
      const updated = await updateProfile(profileForm);
      await updatePharmacy(profile.pharmacy_id, { name: profileForm.pharmacy_name.trim() });
      setProfile(updated);
      toast.success("Pharmacy profile saved.");
    } catch (saveError) {
      toast.error(friendlyError(saveError, "Unable to save the pharmacy profile."));
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveOperational(event) { if (!isAdmin) { toast.error("Only pharmacy owners and admins can change operational settings."); return; }
    event.preventDefault();
    if (Number(operational.low_stock_threshold) < 0 || Number(operational.expiry_warning_days) < 1 || Number(operational.expiry_warning_days) > 365) {
      toast.error("Use a non-negative stock threshold and an expiry warning between 1 and 365 days.");
      return;
    }
    try {
      setSavingOperational(true);
      const saved = await saveSettings(profile.pharmacy_id, {
        ...operational,
        low_stock_threshold: Number(operational.low_stock_threshold),
        expiry_warning_days: Number(operational.expiry_warning_days),
      });
      setOperational({ ...initialOperational, ...saved });
      toast.success("Operational settings saved.");
    } catch (saveError) {
      toast.error(friendlyError(saveError, "Unable to save operational settings."));
    } finally {
      setSavingOperational(false);
    }
  }

  async function logout() {
    const { error: signOutError } = await signOut();
    if (signOutError) return toast.error("We could not sign you out.");
    navigate("/login", { replace: true });
    toast.success("Signed out.");
  }

  if (loading) return <Loader label="Loading settings…" />;
  if (error) return <div className="space-y-4"><div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">{error}</div><Button onClick={load}>Try again</Button></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Settings</h2><p className="mt-1 text-sm text-slate-500">Manage your pharmacy profile, operational thresholds, notifications, and account.</p></div>

      <Card className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Building2 size={20} /></span><div><h3 className="text-lg font-extrabold text-slate-900">Pharmacy profile</h3><p className="mt-1 text-sm text-slate-500">Core contact details for this workspace.</p></div></div><form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2"><Input id="settings-pharmacy" label="Pharmacy name" value={profileForm.pharmacy_name} onChange={(event) => setProfileForm((current) => ({ ...current, pharmacy_name: event.target.value }))} required /><Input id="settings-owner" label="Owner / admin name" value={profileForm.full_name} onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))} required /><Input id="settings-phone" label="Phone" type="tel" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Optional phone number" /><Input id="settings-email" label="Account email" value={profile.email || ""} readOnly className="bg-slate-50 text-slate-500" /><div className="sm:col-span-2 flex justify-end"><Button type="submit" loading={savingProfile} leftIcon={<Save size={17} />}>Save profile</Button></div></form></Card>

      <Card className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><SlidersHorizontal size={20} /></span><div><h3 className="text-lg font-extrabold text-slate-900">Operational settings</h3><p className="mt-1 text-sm text-slate-500">Expiry calculations and stock settings use these values across the workspace.</p>{!isAdmin && <p className="mt-2 text-xs font-semibold text-amber-700">Only owners and admins can change operational settings.</p>}</div></div><form onSubmit={saveOperational} className="mt-6 space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm font-semibold text-slate-700">Currency<select disabled={!isAdmin} value={operational.currency} onChange={(event) => setOperational((current) => ({ ...current, currency: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-normal outline-none focus:border-teal-500"><option value="PKR">PKR</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label><Input disabled={!isAdmin} id="settings-low-stock" label="Low-stock threshold" type="number" min="0" step="1" value={operational.low_stock_threshold} onChange={(event) => setOperational((current) => ({ ...current, low_stock_threshold: event.target.value }))} /><Input disabled={!isAdmin} id="settings-expiry-days" label="Expiry warning days" type="number" min="1" max="365" step="1" value={operational.expiry_warning_days} onChange={(event) => setOperational((current) => ({ ...current, expiry_warning_days: event.target.value }))} /><label className="text-sm font-semibold text-slate-700">Timezone<select disabled={!isAdmin} value={operational.timezone} onChange={(event) => setOperational((current) => ({ ...current, timezone: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-normal outline-none focus:border-teal-500"><option value="Asia/Karachi">Asia/Karachi</option><option value="UTC">UTC</option><option value="Asia/Dubai">Asia/Dubai</option></select></label></div><div className="flex justify-end"><Button type="submit" disabled={!isAdmin} loading={savingOperational} leftIcon={<Save size={17} />}>Save operational settings</Button></div></form></Card>

      <Card className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><BellRing size={20} /></span><div><h3 className="text-lg font-extrabold text-slate-900">Notification preferences</h3><p className="mt-1 text-sm text-slate-500">These settings are stored now and can be used by future n8n workflows.</p></div></div><form onSubmit={saveOperational} className="mt-6 space-y-3"><Toggle disabled={!isAdmin} id="expiry-alerts" label="Expiry alerts" hint="Notify when expiry thresholds are reached." checked={operational.expiry_alerts} onChange={(event) => setOperational((current) => ({ ...current, expiry_alerts: event.target.checked }))} /><Toggle disabled={!isAdmin} id="stock-alerts" label="Low-stock alerts" hint="Notify when inventory needs attention." checked={operational.low_stock_alerts} onChange={(event) => setOperational((current) => ({ ...current, low_stock_alerts: event.target.checked }))} /><Toggle disabled={!isAdmin} id="daily-summary" label="Daily sales summary" hint="Prepare a daily operational digest." checked={operational.daily_sales_summary} onChange={(event) => setOperational((current) => ({ ...current, daily_sales_summary: event.target.checked }))} /><Toggle disabled={!isAdmin} id="weekly-summary" label="Weekly business summary" hint="Prepare a weekly performance digest." checked={operational.weekly_business_summary} onChange={(event) => setOperational((current) => ({ ...current, weekly_business_summary: event.target.checked }))} /><Toggle disabled={!isAdmin} id="critical-alerts" label="Critical alerts" hint="Keep the most urgent operational alerts enabled." checked={operational.critical_alerts} onChange={(event) => setOperational((current) => ({ ...current, critical_alerts: event.target.checked }))} /><div className="flex justify-end pt-2"><Button type="submit" disabled={!isAdmin} loading={savingOperational} leftIcon={<Save size={17} />}>Save notifications</Button></div></form></Card>

      <Card className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><ShieldCheck size={20} /></span><div><h3 className="text-lg font-extrabold text-slate-900">Account</h3><p className="mt-1 text-sm text-slate-500">Use secure account actions when you need them.</p></div></div><div className="mt-6 flex flex-wrap gap-3"><Button as={Link} to="/forgot-password" variant="secondary">Send password reset email</Button><Button variant="danger" leftIcon={<LogOut size={17} />} onClick={logout}>Sign out</Button></div></Card>
    </div>
  );
}

export default Settings;