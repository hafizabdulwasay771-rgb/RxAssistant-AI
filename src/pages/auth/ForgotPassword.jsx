import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { sendPasswordReset } from "@/services/authService";
import { friendlyError } from "@/utils/errors";
function ForgotPassword() {
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false);
  async function submit(event) { event.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Enter a valid email address."); try { setLoading(true); const { error } = await sendPasswordReset(email.trim()); if (error) throw error; setSent(true); toast.success("Password reset link sent."); } catch (error) { toast.error(friendlyError(error)); } finally { setLoading(false); } }
  return <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-10"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white"><Mail size={23} /></div><h1 className="text-2xl font-extrabold text-slate-900">Reset your password</h1><p className="mt-2 text-sm leading-6 text-slate-500">We’ll send a secure reset link to your inbox.</p></div>{sent ? <div className="rounded-2xl bg-teal-50 p-5 text-center text-sm text-teal-800">If an account exists for <strong>{email}</strong>, its password reset link is on the way.</div> : <form className="space-y-5" onSubmit={submit}><Input id="reset-email" label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@pharmacy.com" required /><Button type="submit" fullWidth loading={loading}>Send reset link</Button></form>}<p className="mt-7 text-center text-sm"><Link to="/login" className="font-bold text-teal-700 hover:underline">Back to sign in</Link></p></div>;
}
export default ForgotPassword;