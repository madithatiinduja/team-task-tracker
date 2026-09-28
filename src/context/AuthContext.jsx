import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { loginUser, registerUser, getMe } from "../api/authApi";

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT — The brain of authentication
// ─────────────────────────────────────────────────────────────────────────────
//
// WHY CONTEXT?
//   Without Context, you'd have to pass user/token as props through every
//   component: App → Layout → Navbar → UserAvatar (prop drilling — messy).
//   With Context, ANY component can call useAuth() and get the data directly.
//
// HOW TOKEN STORAGE WORKS:
//   We store the JWT in localStorage (browser's key-value storage).
//
//   localStorage.setItem("token", "eyJhbGci...")  ← save
//   localStorage.getItem("token")                 ← read
//   localStorage.removeItem("token")              ← delete
//
//   localStorage persists across page refreshes and browser restarts.
//   When the app loads, we check localStorage for a saved token.
//   If found, we verify it by calling GET /api/auth/me.
//   If the server accepts it → user is still logged in.
//   If the server rejects it (expired/invalid) → we clear it and show login.
//
// WHAT THIS CONTEXT PROVIDES:
//   user      — { _id, name, email, role } or null
//   token     — JWT string or null
//   loading   — true while verifying token on app load
//   login()   — async function, call with { email, password }
//   register()— async function, call with { name, email, password }
//   logout()  — clears everything, user goes back to login
// ─────────────────────────────────────────────────────────────────────────────

// ── Helper: decode JWT payload without a library ─────────────────────────────
// JWT = header.payload.signature (3 parts separated by dots)
// The payload is base64-encoded JSON — we can decode it to read expiry time.
// We use this to check if a stored token is already expired before making
// an API call (saves one network request on app load).

const isTokenExpired = (token) => {
  try {
    // Split the token and take the middle part (payload)
    const payload = JSON.parse(atob(token.split(".")[1]));
    // payload.exp is the expiry time in seconds since Unix epoch
    // Date.now() returns milliseconds, so we divide by 1000
    return payload.exp < Date.now() / 1000;
  } catch {
    return true; // if we can't decode it, treat it as expired
  }
};

// ── Create Context ────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider Component ────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);
  // loading = true means "we're still checking if user is logged in"
  // We show a spinner during this time to prevent a flash of the login page

  // ── Save token helper ─────────────────────────────────────────────────────
  // Centralizes token storage so we never forget to update both state + localStorage

  const saveToken = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  // ── Clear auth helper ─────────────────────────────────────────────────────

  const clearAuth = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // ── Load user on app start ────────────────────────────────────────────────
  // useCallback memoizes the function so it doesn't re-create on every render.
  // The [] dependency array means it only runs once.
  //
  // Flow:
  //   1. Check localStorage for a saved token
  //   2. If no token → not logged in → stop
  //   3. If token is expired → clear it → stop
  //   4. If token looks valid → verify with server (GET /api/auth/me)
  //   5. Server confirms → set user in state → app renders
  //   6. Server rejects → clear token → show login
  // ─────────────────────────────────────────────────────────────────────────

  const loadUser = useCallback(async () => {
    const savedToken = localStorage.getItem("token");

    // No token saved — user is not logged in
    if (!savedToken) {
      setLoading(false);
      return;
    }

    // Token exists but is already expired — no point calling the API
    if (isTokenExpired(savedToken)) {
      clearAuth();
      setLoading(false);
      return;
    }

    // Token looks valid — verify with the server
    try {
      const { data } = await getMe();
      // GET /api/auth/me returns the logged-in user's profile
      setUser(data.data);
      setToken(savedToken);
    } catch {
      // Server rejected the token (deleted user, secret changed, etc.)
      clearAuth();
    } finally {
      setLoading(false); // done checking — render the app
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ── Login ─────────────────────────────────────────────────────────────────
  // Called from Login.jsx when the form is submitted.
  // Throws on error so the calling component can catch and show the message.
  // ─────────────────────────────────────────────────────────────────────────

  const login = async (credentials) => {
    // POST /api/auth/login → { success, data: { _id, name, email, role, token } }
    const { data } = await loginUser(credentials);

    const { token: newToken, ...userData } = data.data;
    // Destructure: separate token from the rest of the user data

    saveToken(newToken);  // save to localStorage + state
    setUser(userData);    // save user profile to state

    return userData; // return so caller can use it if needed
  };

  // ── Register ──────────────────────────────────────────────────────────────
  // Called from Signup.jsx when the form is submitted.
  // ─────────────────────────────────────────────────────────────────────────

  const register = async (formData) => {
    // POST /api/auth/register → { success, data: { _id, name, email, role, token } }
    const { data } = await registerUser(formData);

    const { token: newToken, ...userData } = data.data;

    saveToken(newToken);
    setUser(userData);

    return userData;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  // Called from Sidebar.jsx when user clicks "Logout".
  // After this runs:
  //   - localStorage is cleared
  //   - user state becomes null
  //   - ProtectedRoute sees user=null → redirects to /login
  // ─────────────────────────────────────────────────────────────────────────

  const logout = () => {
    clearAuth();
    // No need to navigate here — ProtectedRoute handles the redirect
  };

  // ── Context value ─────────────────────────────────────────────────────────
  // Everything in this object is available to any component via useAuth()

  const value = {
    user,       // the logged-in user object (or null)
    token,      // the JWT string (or null)
    loading,    // true while verifying token on startup
    login,      // async (credentials) => userData
    register,   // async (formData) => userData
    logout,     // () => void
    isLoggedIn: !!user, // convenience boolean
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Custom Hook ───────────────────────────────────────────────────────────────
// Usage: const { user, login, logout } = useAuth();
// The error check ensures this hook is only used inside AuthProvider.

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};
