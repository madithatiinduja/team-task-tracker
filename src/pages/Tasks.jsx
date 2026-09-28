import { useState, useEffect, useCallback, useRef } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "../api/taskApi";
import { getProjects } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/common/PageTransition";
import TaskCard   from "../components/tasks/TaskCard";
import TaskTable  from "../components/tasks/TaskTable";
import TaskForm   from "../components/tasks/TaskForm";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  MdAdd, MdSearch, MdFilterList, MdRefresh,
  MdGridView, MdTableRows, MdCheckCircle,
  MdPending, MdWarning, MdAssignment,
} from "react-icons/md";
import toast from "react-hot-toast";
import "../styles/Tasks.css";

// ─────────────────────────────────────────────────────────────────────────────
// TASKS PAGE
// ─────────────────────────────────────────────────────────────────────────────
//
// STATE MANAGEMENT EXPLAINED:
// ─────────────────────────────────────────────────────────────────────────────
//
// tasks[]         — all task objects fetched from API
// loading         — true while API call is running → shows spinner
// error           — error message string → shows retry button
//
// FILTER STATE (3 filters work together):
//   search          → user types → debounced 400ms → sent to API as ?search=
//   statusFilter    → dropdown → sent as ?status=
//   priorityFilter  → dropdown → sent as ?priority=
//   projectFilter   → dropdown → sent as ?projectId=
//
// FILTERING LOGIC:
//   All filters are sent to the BACKEND as query params.
//   Backend does the actual filtering in MongoDB.
//   Frontend just passes the params and displays results.
//
//   Why backend filtering instead of frontend?
//   - Works with large datasets (thousands of tasks)
//   - No need to load all tasks into memory
//   - Single source of truth
//
// VIEW STATE:
//   viewMode — "grid" (cards) or "table" (rows)
//   User can toggle between views. Preference saved in localStorage.
//
// MODAL STATE:
//   showCreateModal  — Create modal open/close
//   editingTask      — task object being edited (null = not editing)
//   deletingTask     — task object being deleted (null = not deleting)
// ─────────────────────────────────────────────────────────────────────────────

// ── Summary Bar ───────────────────────────────────────────────────────────────
// Shows quick counts at the top of the page.
// Computed from the current tasks array — no extra API call needed.

const SummaryBar = ({ tasks }) => {
  const total    = tasks.length;
  const todo     = tasks.filter((t) => t.status === "todo").length;
  const inProg   = tasks.filter((t) => t.status === "in-progress").length;
  const done     = tasks.filter((t) => t.status === "done").length;
  const overdue  = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
  ).length;

  const items = [
    { label: "Total",       value: total,  icon: <MdAssignment size={16} />,   color: "blue"   },
    { label: "Todo",        value: todo,   icon: <MdPending size={16} />,      color: "gray"   },
    { label: "In Progress", value: inProg, icon: <MdPending size={16} />,      color: "yellow" },
    { label: "Done",        value: done,   icon: <MdCheckCircle size={16} />,  color: "green"  },
    { label: "Overdue",     value: overdue,icon: <MdWarning size={16} />,      color: "red"    },
  ];

  return (
    <div className="tasks-summary">
      {items.map((item) => (
        <div key={item.label} className={`tasks-summary__item tasks-summary__item--${item.color}`}>
          <span className="tasks-summary__icon">{item.icon}</span>
          <span className="tasks-summary__value">{item.value}</span>
          <span className="tasks-summary__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Tasks = () => {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [tasks, setTasks]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [search, setSearch]                   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]       = useState("");
  const [priorityFilter, setPriorityFilter]   = useState("");
  const [projectFilter, setProjectFilter]     = useState("");

  // ── View mode — grid or table ──────────────────────────────────────────────
  // Read from localStorage so preference persists across page refreshes
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("tasks-view") || "grid"
  );

  // ── Modal state ────────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask]         = useState(null);
  const [deletingTask, setDeletingTask]       = useState(null);

  // ── Loading per operation ──────────────────────────────────────────────────
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading]     = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { user } = useAuth(); // eslint-disable-line no-unused-vars

  // ── Debounce search ────────────────────────────────────────────────────────
  // Wait 400ms after user stops typing before sending API request.
  // This prevents firing an API call on every single keystroke.
  //
  // Example without debounce: user types "login" → 5 API calls (l, lo, log, logi, login)
  // Example with debounce:    user types "login" → 1 API call  (login, after 400ms pause)

  const searchTimer = useRef(null);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // ── Save view mode to localStorage ────────────────────────────────────────
  const handleViewChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("tasks-view", mode);
  };

  // ── Fetch projects for dropdown ────────────────────────────────────────────
  useEffect(() => {
    getProjects()
      .then(({ data }) => setProjects(data.data))
      .catch(() => {});
  }, []);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  // useCallback ensures fetchTasks is only re-created when filters change.
  // Without useCallback, a new function is created on every render,
  // causing the useEffect below to run in an infinite loop.

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build params object — only include non-empty values
      // This maps to: GET /api/tasks?status=todo&priority=high&search=login
      const params = {};
      if (debouncedSearch) params.search    = debouncedSearch;
      if (statusFilter)    params.status    = statusFilter;
      if (priorityFilter)  params.priority  = priorityFilter;
      if (projectFilter)   params.projectId = projectFilter;

      const { data } = await getTasks(params);
      setTasks(data.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load tasks";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, projectFilter]);

  // Re-fetch whenever any filter changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Clear all filters ──────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setProjectFilter("");
  };

  const hasActiveFilters = search || statusFilter || priorityFilter || projectFilter;

  // ── Create task ────────────────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    setCreateLoading(true);
    try {
      const { data } = await createTask(formData);
      const newTask  = data.data;

      // Add to top of list — no need to re-fetch
      setTasks((prev) => [newTask, ...prev]);
      toast.success(`"${newTask.title}" created!`);
      setShowCreateModal(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || "Failed to create task");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit task ──────────────────────────────────────────────────────────────
  // STATE UPDATE EXPLAINED:
  // After a successful edit, we replace the old task in the array.
  // .map() creates a NEW array — React sees a new reference and re-renders.
  // We never mutate the existing array directly (that won't trigger re-render).

  const handleEdit = async (formData) => {
    if (!editingTask) return;
    setEditLoading(true);

    try {
      const { data }      = await updateTask(editingTask._id, formData);
      const updatedTask   = data.data;

      // Replace old task with updated task in the array
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );

      toast.success(`"${updatedTask.title}" updated!`);
      setEditingTask(null);
    } catch (err) {
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || "Failed to update task");
      }
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete task ────────────────────────────────────────────────────────────
  // STATE UPDATE EXPLAINED:
  // .filter() creates a NEW array excluding the deleted task.
  // React sees the new array reference and re-renders the list.

  const handleDelete = async () => {
    if (!deletingTask) return;
    setDeleteLoading(true);

    try {
      await deleteTask(deletingTask._id);

      // Remove deleted task from array
      setTasks((prev) => prev.filter((t) => t._id !== deletingTask._id));
      toast.success(`"${deletingTask.title}" deleted`);
      setDeletingTask(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Status change (from card/table inline dropdown) ────────────────────────
  // STATE UPDATE EXPLAINED:
  // The TaskCard/TaskTable already called the API.
  // We just update the local state to reflect the change immediately.
  // This is called "optimistic update" — UI updates before server confirms.

  const handleStatusChange = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageTransition variant="fadeSlideUp">
      <div className="tasks-page">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="tasks-page__header">
        <div>
          <h2 className="tasks-page__title">Tasks</h2>
          <p className="tasks-page__subtitle">
            {loading
              ? "Loading..."
              : `${tasks.length} task${tasks.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setShowCreateModal(true)}
        >
          <MdAdd size={18} /> New Task
        </button>
      </div>

      {/* ── Summary Bar ──────────────────────────────────────────────── */}
      {!loading && tasks.length > 0 && <SummaryBar tasks={tasks} />}

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="tasks-toolbar">

        {/* Search */}
        <div className="page-toolbar__search">
          <MdSearch size={18} className="page-toolbar__search-icon" />
          <input
            type="text"
            className="page-toolbar__search-input"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tasks"
          />
          {search !== debouncedSearch && (
            <span className="page-toolbar__search-spinner" />
          )}
        </div>

        {/* Filters */}
        <div className="tasks-toolbar__filters">
          <MdFilterList size={16} className="tasks-toolbar__filter-icon" />

          {/* Status filter */}
          <select
            className="form-input form-input--sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>

          {/* Priority filter */}
          <select
            className="form-input form-input--sm"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {/* Project filter */}
          <select
            className="form-input form-input--sm"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            aria-label="Filter by project"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>

          {/* Clear filters button — only shown when a filter is active */}
          {hasActiveFilters && (
            <button
              className="btn btn--secondary btn--sm"
              onClick={clearFilters}
              title="Clear all filters"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Right side: Refresh + View toggle */}
        <div className="tasks-toolbar__right">
          <button
            className="btn btn--secondary btn--icon"
            onClick={fetchTasks}
            aria-label="Refresh"
            title="Refresh"
          >
            <MdRefresh size={18} />
          </button>

          {/* View toggle: Grid / Table */}
          <div className="view-toggle">
            <button
              className={`view-toggle__btn ${viewMode === "grid" ? "view-toggle__btn--active" : ""}`}
              onClick={() => handleViewChange("grid")}
              aria-label="Grid view"
              title="Grid view"
            >
              <MdGridView size={18} />
            </button>
            <button
              className={`view-toggle__btn ${viewMode === "table" ? "view-toggle__btn--active" : ""}`}
              onClick={() => handleViewChange("table")}
              aria-label="Table view"
              title="Table view"
            >
              <MdTableRows size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}

      {/* Loading */}
      {loading && (
        <div className="page-loading">
          <div className="spinner" />
          <p>Loading tasks...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="error-state">
          <p className="error-state__message">⚠️ {error}</p>
          <button className="btn btn--primary" onClick={fetchTasks}>
            <MdRefresh size={16} /> Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && tasks.length === 0 && (
        <div className="empty-page">
          <MdAssignment size={64} className="empty-page__icon" />
          <h3>
            {hasActiveFilters ? "No tasks match your filters" : "No tasks yet"}
          </h3>
          <p>
            {hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Create your first task to get started."}
          </p>
          {hasActiveFilters ? (
            <button className="btn btn--secondary" onClick={clearFilters}>
              ✕ Clear Filters
            </button>
          ) : (
            <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
              <MdAdd size={18} /> Create Task
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!loading && !error && tasks.length > 0 && viewMode === "grid" && (
        <div className="tasks-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={(t) => setEditingTask(t)}
              onDelete={(t) => setDeletingTask(t)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && !error && tasks.length > 0 && viewMode === "table" && (
        <TaskTable
          tasks={tasks}
          onEdit={(t) => setEditingTask(t)}
          onDelete={(t) => setDeletingTask(t)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* ── Create Modal ─────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__header-left">
                <div className="modal__icon modal__icon--create">
                  <MdAssignment size={18} />
                </div>
                <h3 className="modal__title">New Task</h3>
              </div>
              <button className="modal__close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <TaskForm
              projects={projects}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateModal(false)}
              loading={createLoading}
              submitLabel="Create Task"
            />
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────── */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__header-left">
                <div className="modal__icon modal__icon--edit">
                  <MdAssignment size={18} />
                </div>
                <h3 className="modal__title">Edit Task</h3>
              </div>
              <button className="modal__close" onClick={() => setEditingTask(null)}>✕</button>
            </div>
            <TaskForm
              initialData={editingTask}
              projects={projects}
              onSubmit={handleEdit}
              onCancel={() => setEditingTask(null)}
              loading={editLoading}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deletingTask}
        title="Delete Task?"
        message={`Are you sure you want to delete "${deletingTask?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTask(null)}
        loading={deleteLoading}
        confirmText="Delete Task"
        confirmColor="danger"
      />

      </div>
    </PageTransition>
  );
};

export default Tasks;
