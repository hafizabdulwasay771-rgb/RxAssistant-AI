import { Navigate, useLocation } from "react-router-dom";
import Loader from "@/components/ui/Loader";
import { useAuth } from "@/hooks/useAuth";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullScreen label="Restoring your session…" />;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return children;
}

export default ProtectedRoute;