import API from "./axios";

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT API CALLS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/projects  (supports ?status=active&search=keyword)
export const getProjects = (params) => API.get("/projects", { params });

// GET /api/projects/:id
export const getProjectById = (id) => API.get(`/projects/${id}`);

// POST /api/projects
export const createProject = (data) => API.post("/projects", data);

// PUT /api/projects/:id
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);

// DELETE /api/projects/:id
export const deleteProject = (id) => API.delete(`/projects/${id}`);
