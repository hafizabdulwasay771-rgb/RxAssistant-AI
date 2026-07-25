import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">

        {/* Logo */}

        <Link
          to="/"
          className="text-3xl font-extrabold text-teal-600 tracking-tight"
        >
          Rx Assistant AI
        </Link>

        {/* Navigation */}

        <nav className="hidden md:flex items-center gap-10 text-slate-700 font-medium">

          <a href="#home" className="hover:text-teal-600 transition">
            Home
          </a>

          <a href="#features" className="hover:text-teal-600 transition">
            Features
          </a>

          <a href="#ai" className="hover:text-teal-600 transition">
            AI
          </a>

          <a href="#pricing" className="hover:text-teal-600 transition">
            Pricing
          </a>

          <a href="#contact" className="hover:text-teal-600 transition">
            Contact
          </a>

        </nav>

        {/* Right Side */}

        <div className="flex items-center gap-4">

          <Link
            to="/login"
            className="font-semibold text-slate-700 hover:text-teal-600 transition"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-teal-600 px-6 py-3 text-white font-semibold hover:bg-teal-700 transition"
          >
            Get Started
          </Link>

        </div>

      </div>
    </header>
  );
}

export default Navbar;