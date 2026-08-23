import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { loginUser } from "@/services/authService";
import { friendlyError } from "@/utils/errors";

function AuthBrand({ title, children }) {
  return <div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-lg font-bold text-white shadow-lg shadow-teal-600/20">Rx</div><h1 className="text-2xl font-extrabold text-slate-900">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{children}</p></div>;
}

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (!form.email.trim() || !form.password) return toast.error("Enter your email address and password.");
    try {
      setLoading(true);
      const { error } = await loginUser(form.email.trim(), form.password);
      if (error) throw error;
      toast.success("Welcome back.");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (loginError) {
      toast.error(friendlyError(loginError));
    } finally {
      setLoading(false);
    }
  }

  return <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-10"><AuthBrand title="Welcome back">Sign in to manage your pharmacy with <span className="font-semibold text-teal-600">Rx Assistant AI</span>.</AuthBrand><form className="space-y-5" onSubmit={submit}><Input id="login-email" label="Email address" name="email" type="email" autoComplete="email" value={form.email} onChange={update} placeholder="you@pharmacy.com" required /><div className="relative"><Input id="login-password" label="Password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={update} placeholder="Enter your password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute bottom-2.5 right-3 rounded p-1 text-slate-400 hover:text-teal-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><div className="flex justify-end"><Link to="/forgot-password" className="text-sm font-semibold text-teal-700 hover:underline">Forgot password?</Link></div><Button type="submit" fullWidth loading={loading} leftIcon={<LockKeyhole size={17} />}>Sign in</Button></form><p className="mt-7 text-center text-sm text-slate-600">New to Rx Assistant? <Link to="/register" className="font-bold text-teal-700 hover:underline">Create an account</Link></p></div>;
}

export default Login;