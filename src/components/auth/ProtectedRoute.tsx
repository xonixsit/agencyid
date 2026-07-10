import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>;
  }
  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
