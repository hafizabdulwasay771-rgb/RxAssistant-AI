import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

function ForgotPassword() {
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
          Forgot Password
        </h1>

        <p className="mt-3 text-slate-500">
          Enter your email address and we'll send you a password reset link.
        </p>

      </div>

      {/* Form */}

      <form className="space-y-6">

        <div>

          <label className="block mb-2 text-sm font-medium text-slate-700">
            Email Address
          </label>

          <Input
            type="email"
            placeholder="Enter your email"
          />

        </div>

        <Button fullWidth>
          Send Reset Link
        </Button>

      </form>

      {/* Footer */}

      <div className="mt-8 text-center text-sm text-slate-600">

        <a
          href="/login"
          className="text-teal-600 font-semibold hover:underline"
        >
          Back to Login
        </a>

      </div>

    </div>
  );
}

export default ForgotPassword;