import Button from "@/components/ui/Button";
import { PlayCircle } from "lucide-react";
import DashboardPreview from "./DashboardPreview";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section
      id="home"
      className="bg-gradient-to-b from-slate-50 via-white to-cyan-50"
    >
      <div className="max-w-7xl mx-auto px-8 min-h-[90vh] grid lg:grid-cols-2 items-center gap-16">

        {/* Left */}

        <div>

          <span className="inline-flex items-center rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-700">
            AI Powered Pharmacy Management
          </span>

          <h1 className="mt-8 text-6xl lg:text-7xl font-extrabold leading-tight text-slate-900">

            Smarter Pharmacy.
            <br />

            <span className="text-teal-600">
              Powered by AI.
            </span>

          </h1>

          <p className="mt-8 text-xl leading-9 text-slate-600 max-w-xl">

            Manage medicines, monitor inventory,
            predict demand, reduce expiry losses,
            and grow your pharmacy using one
            intelligent platform.

          </p>

          <div className="mt-12 flex gap-5">

            <div className="mt-12 flex flex-wrap gap-5">

  <Button size="lg">
    Start Free Trial
  </Button>

  <Button
    variant="secondary"
    size="lg"
    leftIcon={<PlayCircle size={20} />}
  >
    Watch Demo
  </Button>

</div>

          </div>

        </div>

        {/* Right */}

        <div>

         <DashboardPreview />

        </div>

      </div>
    </section>
  );
}

export default Hero;