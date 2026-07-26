import { useState } from "react";
import { registerUser } from "../../services/authService";
import { Eye, EyeOff } from "lucide-react";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
const [formData, setFormData] = useState({
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const [loading, setLoading] = useState(false);
function handleChange(e) {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value,
  });
}
async function handleSubmit(e) {
  e.preventDefault();

  if (!formData.fullName.trim()) {
    alert("Please enter your full name.");
    return;
  }

  if (!formData.email.trim()) {
    alert("Please enter your email.");
    return;
  }

  if (!formData.password.trim()) {
    alert("Please enter a password.");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    setLoading(true);

    const { data, error } = await registerUser(
      formData.email,
      formData.password
    );

    if (error) {
      alert(error.message);
      return;
    }

    alert("Registration successful! Please check your email.");

    console.log(data);

  } catch (err) {
    alert("Something went wrong.");
    console.error(err);
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
          Create Account
        </h1>

        <p className="mt-3 text-slate-500">
          Start managing your pharmacy with
          <span className="font-semibold text-teal-600">
            {" "}Rx Assistant AI
          </span>
        </p>

      </div>

      {/* Form */}

      <form
  className="space-y-6"
  onSubmit={handleSubmit}
>

        <div>
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Full Name
          </label>

          <Input
  name="fullName"
  value={formData.fullName}
  onChange={handleChange}
  placeholder="Enter your full name"
/>
        </div>

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
  placeholder="Create password"
/>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-600"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>

          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Confirm Password
          </label>

          <Input
  name="confirmPassword"
  type="password"
  value={formData.confirmPassword}
  onChange={handleChange}
  placeholder="Confirm password"
/>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">

          <input type="checkbox" />

          I agree to the Terms & Conditions

        </label>

        <Button
  fullWidth
  loading={loading}
  type="submit"
>
  Create Account
</Button>

      </form>

      {/* Footer */}

      <div className="mt-8 text-center text-sm text-slate-600">

        Already have an account?{" "}

        <a
          href="/login"
          className="text-teal-600 font-semibold hover:underline"
        >
          Sign In
        </a>

      </div>

    </div>
  );
}

export default Register;