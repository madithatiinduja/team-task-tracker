import API from "./axios";

// POST /api/auth/register
export const registerUser = (data) => API.post("/auth/register", data);

// POST /api/auth/login
export const loginUser = (data) => API.post("/auth/login", data);

// GET /api/auth/me
export const getMe = () => API.get("/auth/me");

// PUT /api/auth/me
export const updateProfile = (data) => API.put("/auth/me", data);

// POST /api/auth/forgot-password
export const forgotPasswordApi = (data) => API.post("/auth/forgot-password", data);

// POST /api/auth/verify-otp
export const verifyOtpApi = (data) => API.post("/auth/verify-otp", data);

// POST /api/auth/reset-password
export const resetPasswordApi = (data) => API.post("/auth/reset-password", data);
