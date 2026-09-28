import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTE
// ─────────────────────────────────────────────────────────────────────────────
// Guards private pages (Dashboard, Projects, Tasks).
// If the user is NOT logged in, they are redirected to /login.
// If they ARE logged in, the page renders normally via <Outlet />.
//
// How React Router's <Outlet /> works:
//   <Route element={<ProtectedRoute />}>
//     <Route path="/dashboard" element={<Dashboard />} />  ← rendered via Outlet
//   </Route>
//
// The "replace" prop on <Navigate> replaces the current history entry
// so the user can't click "back" to get to the protected page.
// ─────────────────────────────────────────────────────────────────────────────

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // While checking localStorage / fetching user, show nothing
  // This prevents a flash of the login page on refresh
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → render the child route
  return <Outlet />;
};

export default ProtectedRoute;
