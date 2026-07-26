import { Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import Landing from "./pages/landing/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import Inventory from "./pages/dashboard/Inventory";
import Sales from "./pages/dashboard/Sales";
import Analytics from "./pages/dashboard/Analytics";
import Reports from "./pages/dashboard/Reports";
import Settings from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
  <Route
    path="/"
    element={<Landing />}
  />
</Route>
<Route element={<AuthLayout />}>

  <Route
    path="/login"
    element={<Login />}
  />

  <Route
    path="/register"
    element={<Register />}
  />

  <Route
    path="/forgot-password"
    element={<ForgotPassword />}
  />

</Route>

     <Route
  element={
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  }
>
  <Route
    path="/dashboard"
    element={<Dashboard />}
  />

  <Route
    path="/inventory"
    element={<Inventory />}
  />

  <Route
    path="/sales"
    element={<Sales />}
  />

  <Route
    path="/analytics"
    element={<Analytics />}
  />

  <Route
    path="/reports"
    element={<Reports />}
  />

  <Route
    path="/settings"
    element={<Settings />}
  />
</Route>

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}

export default App;