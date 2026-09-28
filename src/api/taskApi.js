import API from "./axios";

// ─────────────────────────────────────────────────────────────────────────────
// TASK API CALLS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/tasks  (supports ?projectId=&status=&priority=&search=&page=&limit=)
export const getTasks = (params) => API.get("/tasks", { params });

// GET /api/tasks/:id
export const getTaskById = (id) => API.get(`/tasks/${id}`);

// POST /api/tasks
export const createTask = (data) => API.post("/tasks", data);

// PUT /api/tasks/:id
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);

// PATCH /api/tasks/:id/status
export const updateTaskStatus = (id, status) =>
  API.patch(`/tasks/${id}/status`, { status });

// DELETE /api/tasks/:id
export const deleteTask = (id) => API.delete(`/tasks/${id}`);
