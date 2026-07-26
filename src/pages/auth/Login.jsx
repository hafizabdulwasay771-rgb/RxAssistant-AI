import { useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useState } from "react";
import { loginUser } from "../../services/authService";
import { Eye, EyeOff } from "lucide-react";
function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
  email: "",
  password: "",
});

const [loading, setLoading] = useState(false);
const navigate = useNavigate();
function handleChange(e) {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value,
  });
}
async function handleSubmit(e) {
  e.preventDefault();

  if (!formData.email.trim()) {
    alert("Please enter your email.");
    return;
  }

  if (!formData.password.trim()) {
    alert("Please enter your password.");
    return;
  }

  try {
    setLoading(true);

    const { data, error } = await loginUser(
      formData.email,
      formData.password
    );

    if (error) {
      alert(error.message);
      return;
    }

    console.log(data);

   navigate("/dashboard");

  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  } finally {
    setLoading(false);
  }
}
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10">

      {/* Header */}

<div className="text-center mb-10">

  <div className="flex justify-center mb-5">

    <div className="h-16 w-16 rounded-2xl bg-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
      Rx
    </div>

  </div>

  <h1 className="text-3xl font-bold text-slate-900">
    Welcome Back
  </h1>

  <p className="mt-3 text-slate-500 leading-relaxed">
    Sign in to manage your pharmacy with
    <span className="font-semibold text-teal-600">
      {" "}Rx Assistant AI
    </span>
  </p>

</div>

      <form
  className="space-y-6"
  onSubmit={handleSubmit}
>

  <div>
    <label className="block mb-2 text-sm font-medium text-slate-700">
      Email Address
    </label>
<Input
  name="email"
  type="email"
  value={formData.email}
  onChange={handleChange}
  placeholder="Enter your email"
/>
  </div>

  <div>
    <label className="block mb-2 text-sm font-medium text-slate-700">
      Password
    </label>

    <div className="relative">
<Input
  name="password"
  type={showPassword ? "text" : "password"}
  value={formData.password}
  onChange={handleChange}
  placeholder="Enter your password"
/>

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-teal-600 font-medium"
  >
    {showPassword ? (
  <EyeOff size={18} />
) : (
  <Eye size={18} />
)}
  </button>

</div>
  </div>

  <div className="flex items-center justify-between">

    <label className="flex items-center gap-2 text-sm text-slate-600">

      <input
        type="checkbox"
        className="rounded border-slate-300"
      />

      Remember Me

    </label>

    <a
      href="/forgot-password"
      className="text-sm font-medium text-teal-600 hover:underline"
    >
      Forgot Password?
    </a>

  </div>

  <Button
  fullWidth
  loading={loading}
  type="submit"
>
  Sign In
</Button>

</form>
      {/* Footer */}

      <div className="mt-8 text-center text-sm text-slate-600">

        Don't have an account?{" "}

        <a
          href="/register"
          className="text-teal-600 font-semibold hover:underline"
        >
          Create Account
        </a>

      </div>

    </div>
  );
}

export default Login;