import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

// Context
import { AuthProvider }  from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Route Guards
import ProtectedRoute from "./components/routing/ProtectedRoute";
import PublicRoute    from "./components/routing/PublicRoute";

// Layout
import AppLayout from "./components/layout/AppLayout";

// Pages
import Login         from "./pages/Login";
import Signup        from "./pages/Signup";
import Dashboard     from "./pages/Dashboard";
import Projects      from "./pages/Projects";
import Tasks         from "./pages/Tasks";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp     from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";

// Global styles
import "./styles/index.css";

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedRoutes — separate component because useLocation must be inside Router
// ─────────────────────────────────────────────────────────────────────────────
// WHY separate component?
//   AnimatePresence needs to detect when a route changes.
//   It does this by watching the "key" prop on Routes.
//   useLocation() gives us the current URL path.
//   When path changes → key changes → AnimatePresence plays exit + enter animations.
//
// mode="wait" means:
//   Old page finishes exit animation FIRST, then new page starts entering.
//   Without it: both animations play at the same time (can look messy).
// ─────────────────────────────────────────────────────────────────────────────

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {/*
        key={location.pathname} is CRITICAL.
        When the URL changes, React sees a new key → unmounts old Routes → mounts new.
        AnimatePresence intercepts the unmount and plays the exit animation first.
      */}
      <Routes location={location} key={location.pathname}>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login"           element={<Login />} />
          <Route path="/signup"          element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp"      element={<VerifyOtp />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects"  element={<Projects />} />
            <Route path="/tasks"     element={<Tasks />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP — Root component
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: "8px", fontSize: "0.875rem" },
              success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />

          <AnimatedRoutes />

        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
