import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { updatePassword } from "@/services/authService";
import { friendlyError } from "@/utils/errors";

function ResetPassword() {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    if (form.password.length < 8) return toast.error("Use a password of at least 8 characters.");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match.");
    try {
      setLoading(true);
      const { error } = await updatePassword(form.password);
      if (error) throw error;
      toast.success("Your password has been updated.");
      navigate("/dashboard", { replace: true });
    } catch (updateError) {
      toast.error(friendlyError(updateError, "This reset link is invalid or has expired. Request a new one."));
    } finally {
      setLoading(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-10"><div className="mb-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal-600 text-white"><KeyRound size={23} /></div><h1 className="text-2xl font-extrabold text-slate-900">Choose a new password</h1><p className="mt-2 text-sm leading-6 text-slate-500">Use a password with at least eight characters.</p></div><form onSubmit={submit} className="space-y-4"><Input id="reset-password" label="New password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" minLength="8" required /><Input id="reset-confirm-password" label="Confirm new password" type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} autoComplete="new-password" minLength="8" required /><Button type="submit" fullWidth loading={loading}>Update password</Button></form><p className="mt-7 text-center text-sm"><Link to="/login" className="font-bold text-teal-700 hover:underline">Back to sign in</Link></p></div></main>;
}

export default ResetPassword;