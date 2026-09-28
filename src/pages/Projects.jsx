import { useState, useEffect, useCallback, useRef } from "react";
import { getProjects, createProject, updateProject, deleteProject } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/common/PageTransition";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectForm from "../components/projects/ProjectForm";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { MdAdd, MdFolder, MdSearch, MdFilterList, MdRefresh } from "react-icons/md";
import toast from "react-hot-toast";
import "../styles/Projects.css";

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
//
// STATE MANAGEMENT EXPLAINED:
// ─────────────────────────────────────────────────────────────────────────────
// This component manages several pieces of state. Here's what each one does:
//
//   projects      — array of project objects fetched from the API
//                   Updated when: page loads, project created/edited/deleted
//
//   loading       — true while the API call is in progress
//                   Used to show a spinner instead of empty content
//
//   error         — string error message if the API call fails
//                   Used to show an error state with a retry button
//
//   search        — current search input value
//                   Passed to the API as ?search=keyword
//
//   statusFilter  — current status dropdown value ("" | "active" | etc.)
//                   Passed to the API as ?status=active
//
//   showCreateModal — boolean, controls Create modal visibility
//   editingProject  — project object being edited (null = not editing)
//   deletingProject — project object being deleted (null = not deleting)
//   deleteLoading   — true while delete API call is in progress
//   createLoading   — true while create API call is in progress
//   editLoading     — true while edit API call is in progress
//
// API INTEGRATION EXPLAINED:
// ─────────────────────────────────────────────────────────────────────────────
// All API calls go through projectApi.js which uses the axios instance.
// The axios instance automatically attaches the JWT token to every request.
//
// Flow for fetching:
//   1. Component mounts → useEffect runs → fetchProjects() called
//   2. search or statusFilter changes → useEffect re-runs → fetchProjects() called
//   3. fetchProjects() calls getProjects({ search, status }) → API responds
//   4. setProjects(data.data) → React re-renders with new data
//
// Flow for creating:
//   1. User fills form → clicks Submit → handleCreate() called
//   2. createProject(payload) → API creates project → returns new project
//   3. setProjects(prev => [newProject, ...prev]) → add to top of list
//   4. No need to re-fetch — we already have the new data from the response
//
// Flow for editing:
//   1. User clicks Edit → setEditingProject(project) → modal opens with data
//   2. User changes fields → clicks Save → handleEdit() called
//   3. updateProject(id, payload) → API updates → returns updated project
//   4. setProjects(prev => prev.map(p => p._id === id ? updated : p))
//      → replace the old project in the array with the updated one
//
// Flow for deleting:
//   1. User clicks Delete → setDeletingProject(project) → confirm dialog opens
//   2. User confirms → handleDelete() called
//   3. deleteProject(id) → API deletes → 200 OK
//   4. setProjects(prev => prev.filter(p => p._id !== id)) → remove from array
// ─────────────────────────────────────────────────────────────────────────────

const Projects = () => {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Modal state ────────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject]   = useState(null); // project obj or null
  const [deletingProject, setDeletingProject] = useState(null); // project obj or null

  // ── Loading state for each operation ──────────────────────────────────────
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading]     = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { user } = useAuth();

  // ── Debounce ref for search ────────────────────────────────────────────────
  // Debouncing means: wait 400ms after the user stops typing before calling API.
  // Without debounce: API fires on EVERY keystroke (too many requests).
  // With debounce: API fires only after user pauses typing.
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // When search changes, wait 400ms then update debouncedSearch
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    // Cleanup: cancel the timer if user types again before 400ms
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // ── Fetch Projects ─────────────────────────────────────────────────────────
  // useCallback memoizes this function.
  // Without useCallback, a new function reference is created on every render,
  // which would cause the useEffect below to run infinitely.
  // ─────────────────────────────────────────────────────────────────────────

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null); // clear previous errors

    try {
      // Build query params — only include non-empty values
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter)    params.status = statusFilter;

      const { data } = await getProjects(params);
      setProjects(data.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load projects";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);
  // ↑ Re-run fetchProjects whenever search or filter changes

  // Run fetchProjects on mount and whenever dependencies change
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Create Project ─────────────────────────────────────────────────────────

  const handleCreate = async (formData) => {
    setCreateLoading(true);
    try {
      const { data } = await createProject(formData);
      const newProject = data.data;

      // Add new project to the TOP of the list (newest first)
      // This is an optimistic update — no need to re-fetch
      setProjects((prev) => [newProject, ...prev]);

      toast.success(`"${newProject.title}" created!`);
      setShowCreateModal(false);
    } catch (err) {
      // Handle validation errors array from backend
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || "Failed to create project");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit Project ───────────────────────────────────────────────────────────

  const handleEdit = async (formData) => {
    if (!editingProject) return;
    setEditLoading(true);

    try {
      const { data } = await updateProject(editingProject._id, formData);
      const updatedProject = data.data;

      // Replace the old project in the array with the updated one
      // .map() creates a new array — React detects the change and re-renders
      setProjects((prev) =>
        prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
      );

      toast.success(`"${updatedProject.title}" updated!`);
      setEditingProject(null); // close modal
    } catch (err) {
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || "Failed to update project");
      }
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete Project ─────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingProject) return;
    setDeleteLoading(true);

    try {
      await deleteProject(deletingProject._id);

      // Remove the deleted project from the array
      setProjects((prev) => prev.filter((p) => p._id !== deletingProject._id));

      toast.success(`"${deletingProject.title}" deleted`);
      setDeletingProject(null); // close confirm dialog
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete project");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Check if current user is the project owner ────────────────────────────
  const isProjectOwner = (project) =>
    project.createdBy?._id === user?._id ||
    project.createdBy === user?._id;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageTransition variant="fadeSlideUp">
      <div className="projects-page">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="projects-page__header">
        <div>
          <h2 className="projects-page__title">Projects</h2>
          <p className="projects-page__subtitle">
            {loading ? "Loading..." : `${projects.length} project${projects.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setShowCreateModal(true)}
        >
          <MdAdd size={18} />
          New Project
        </button>
      </div>

      {/* ── Toolbar: Search + Filters ─────────────────────────────────── */}
      <div className="page-toolbar">

        {/* Search input */}
        <div className="page-toolbar__search">
          <MdSearch size={18} className="page-toolbar__search-icon" />
          <input
            type="text"
            className="page-toolbar__search-input"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search projects"
          />
          {/* Show spinner inside search while debounce is pending */}
          {search !== debouncedSearch && (
            <span className="page-toolbar__search-spinner" />
          )}
        </div>

        {/* Status filter */}
        <div className="page-toolbar__filters">
          <MdFilterList size={18} className="page-toolbar__filter-icon" />
          <select
            className="form-input form-input--sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          className="btn btn--secondary btn--icon"
          onClick={fetchProjects}
          aria-label="Refresh projects"
          title="Refresh"
        >
          <MdRefresh size={18} />
        </button>

      </div>

      {/* ── Content Area ─────────────────────────────────────────────── */}

      {/* Loading state */}
      {loading && (
        <div className="page-loading">
          <div className="spinner" />
          <p>Loading projects...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="error-state">
          <p className="error-state__message">⚠️ {error}</p>
          <button className="btn btn--primary" onClick={fetchProjects}>
            <MdRefresh size={16} /> Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && projects.length === 0 && (
        <div className="empty-page">
          <MdFolder size={64} className="empty-page__icon" />
          <h3>
            {debouncedSearch || statusFilter
              ? "No projects match your filters"
              : "No projects yet"}
          </h3>
          <p>
            {debouncedSearch || statusFilter
              ? "Try adjusting your search or filter."
              : "Create your first project to get started."}
          </p>
          {!debouncedSearch && !statusFilter && (
            <button
              className="btn btn--primary"
              onClick={() => setShowCreateModal(true)}
            >
              <MdAdd size={18} /> Create Project
            </button>
          )}
        </div>
      )}

      {/* Projects grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              isOwner={isProjectOwner(project)}
              onEdit={(proj) => setEditingProject(proj)}
              onDelete={(proj) => setDeletingProject(proj)}
            />
          ))}
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__header-left">
                <div className="modal__icon modal__icon--create">
                  <MdFolder size={20} />
                </div>
                <h3 className="modal__title">New Project</h3>
              </div>
              <button
                className="modal__close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <ProjectForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateModal(false)}
              loading={createLoading}
              submitLabel="Create Project"
            />
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────── */}
      {editingProject && (
        <div className="modal-overlay" onClick={() => setEditingProject(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__header-left">
                <div className="modal__icon modal__icon--edit">
                  <MdFolder size={20} />
                </div>
                <h3 className="modal__title">Edit Project</h3>
              </div>
              <button
                className="modal__close"
                onClick={() => setEditingProject(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <ProjectForm
              initialData={editingProject}
              onSubmit={handleEdit}
              onCancel={() => setEditingProject(null)}
              loading={editLoading}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deletingProject}
        title="Delete Project?"
        message={`Are you sure you want to delete "${deletingProject?.title}"? This will permanently delete the project and ALL its tasks. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingProject(null)}
        loading={deleteLoading}
        confirmText="Delete Project"
        confirmColor="danger"
      />

      </div>
    </PageTransition>
  );
};

export default Projects;
