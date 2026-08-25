import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loader from "@/components/ui/Loader";
import PublicLayout from "@/layouts/PublicLayout";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import GuestRoute from "@/routes/GuestRoute";

const Landing = lazy(() => import("@/pages/landing/Landing"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const Inventory = lazy(() => import("@/pages/dashboard/Inventory"));
const Sales = lazy(() => import("@/pages/dashboard/Sales"));
const SalesHistory = lazy(() => import("@/pages/dashboard/SalesHistory"));
const Analytics = lazy(() => import("@/pages/dashboard/Analytics"));
const Reports = lazy(() => import("@/pages/dashboard/Reports"));
const Settings = lazy(() => import("@/pages/dashboard/Settings"));
const Suppliers = lazy(() => import("@/pages/dashboard/Suppliers"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Checkout = lazy(() => import("@/pages/checkout/Checkout"));

function App() {
  return (
    <Suspense fallback={<Loader fullScreen label="Loading workspace…" />}>
      <Routes>
        <Route element={<PublicLayout />}><Route path="/" element={<Landing />} /></Route>
        <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        <Route element={<ProtectedRoute><PublicLayout /></ProtectedRoute>}><Route path="/checkout" element={<Checkout />} /></Route>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/history" element={<SalesHistory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
