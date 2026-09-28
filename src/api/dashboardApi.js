import API from "./axios";

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD API CALLS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/dashboard
export const getDashboardStats = () => API.get("/dashboard");

// GET /api/dashboard/activity
export const getActivityStats = () => API.get("/dashboard/activity");

// GET /api/dashboard/overdue
export const getOverdueTasks = () => API.get("/dashboard/overdue");
