import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 w-fit rounded-3xl bg-teal-100 p-5 text-teal-700"><SearchX size={36} /></div>
        <p className="text-sm font-bold tracking-[0.2em] text-teal-600">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">This page is unavailable</h1>
        <p className="mt-3 text-slate-500">The link may be out of date, or the page has moved.</p>
        <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700">
          <ArrowLeft size={17} />Return home
        </Link>
      </div>
    </main>
  );
}

export default NotFound;