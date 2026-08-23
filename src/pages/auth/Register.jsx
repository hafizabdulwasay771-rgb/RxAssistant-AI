import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { registerUser } from "@/services/authService";
import { friendlyError } from "@/utils/errors";

function Register() {
  const [form, setForm] = useState({ fullName: "", pharmacyName: "", email: "", password: "", confirmPassword: "", terms: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (form.fullName.trim().length < 2) return toast.error("Enter your full name.");
    if (form.pharmacyName.trim().length < 2) return toast.error("Enter your pharmacy name.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Enter a valid email address.");
    if (form.password.length < 8) return toast.error("Use a password of at least 8 characters.");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match.");
    if (!form.terms) return toast.error("Please accept the terms to continue.");

    try {
      setLoading(true);
      const { data, error } = await registerUser({ email: form.email.trim(), password: form.password, fullName: form.fullName.trim(), pharmacyName: form.pharmacyName.trim() });
      if (error) throw error;
      if (data.session) {
        toast.success("Your account is ready.");
        navigate("/dashboard", { replace: true });
      } else {
        toast.success("Check your email to confirm your account, then sign in.");
        navigate("/login", { replace: true });
      }
    } catch (registerError) {
      toast.error(friendlyError(registerError));
    } finally {
      setLoading(false);
    }
  }

  return <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-10"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-lg font-bold text-white">Rx</div><h1 className="text-2xl font-extrabold text-slate-900">Set up your pharmacy</h1><p className="mt-2 text-sm text-slate-500">Create your secure Rx Assistant AI workspace.</p></div><form onSubmit={submit} className="space-y-4"><Input id="register-name" label="Full name" name="fullName" value={form.fullName} onChange={update} autoComplete="name" placeholder="Ayesha Khan" required /><Input id="register-pharmacy" label="Pharmacy name" name="pharmacyName" value={form.pharmacyName} onChange={update} placeholder="Care Pharmacy" required /><Input id="register-email" label="Email address" name="email" type="email" value={form.email} onChange={update} autoComplete="email" placeholder="you@pharmacy.com" required /><div className="relative"><Input id="register-password" label="Password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={update} autoComplete="new-password" placeholder="At least 8 characters" minLength="8" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute bottom-2.5 right-3 rounded p-1 text-slate-400 hover:text-teal-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><Input id="register-confirm" label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={update} autoComplete="new-password" placeholder="Repeat your password" required /><label className="flex items-start gap-2 text-sm text-slate-600"><input name="terms" type="checkbox" checked={form.terms} onChange={update} className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />I agree to the Terms of Service and Privacy Policy.</label><Button type="submit" fullWidth loading={loading} leftIcon={<UserPlus size={17} />}>Create account</Button></form><p className="mt-7 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-bold text-teal-700 hover:underline">Sign in</Link></p></div>;
}

export default Register;