import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Loader from "@/components/ui/Loader";

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullScreen label="Restoring your session…" />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default GuestRoute;