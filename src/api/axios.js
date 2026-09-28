import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds — handles Render free tier cold start delay
});

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────────────────
// Auto-attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────────────
// Handle 401 errors — BUT only redirect if:
//   1. User has a token stored (they were logged in)
//   2. The request was NOT to an auth endpoint (login/register/forgot-password etc.)
//
// This prevents the login page from redirecting to itself when
// the user enters wrong credentials (which also returns 401).
// ─────────────────────────────────────────────────────────────────────────────

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register") ||
      error.config?.url?.includes("/auth/forgot-password") ||
      error.config?.url?.includes("/auth/verify-otp") ||
      error.config?.url?.includes("/auth/reset-password");

    // Only auto-redirect if:
    // - Status is 401
    // - NOT an auth endpoint (login failure should NOT redirect)
    // - User has a token (meaning session expired, not wrong password)
    if (
      error.response?.status === 401 &&
      !isAuthEndpoint &&
      localStorage.getItem("token")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default API;
