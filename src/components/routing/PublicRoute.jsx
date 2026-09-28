import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTE
// ─────────────────────────────────────────────────────────────────────────────
// Guards public-only pages (Login, Signup).
// If the user IS already logged in, redirect them to /dashboard.
// This prevents a logged-in user from seeing the login page again.
// ─────────────────────────────────────────────────────────────────────────────

const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  // Already logged in → redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not logged in → show the public page (Login / Signup)
  return <Outlet />;
};

export default PublicRoute;
