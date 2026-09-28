import { useState } from "react";
import { MdEdit, MdDelete, MdUnfoldMore } from "react-icons/md";
import { updateTaskStatus } from "../../api/taskApi";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// TASK TABLE — Displays tasks in a sortable table (list view)
// ─────────────────────────────────────────────────────────────────────────────
// Props:
//   tasks          — array of task objects
//   onEdit         — fn(task)
//   onDelete       — fn(task)
//   onStatusChange — fn(taskId, newStatus)
// ─────────────────────────────────────────────────────────────────────────────

// ── Status dropdown cell ──────────────────────────────────────────────────────
const StatusCell = ({ task, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    setLoading(true);
    try {
      await updateTaskStatus(task._id, newStatus);
      onStatusChange(task._id, newStatus);
      toast.success(`Status → ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      className={`task-table__status-select status-select--${task.status}`}
      value={task.status}
      onChange={handleChange}
      disabled={loading}
    >
      <option value="todo">Todo</option>
      <option value="in-progress">In Progress</option>
      <option value="review">Review</option>
      <option value="done">Done</option>
    </select>
  );
};

// ── Main Table ────────────────────────────────────────────────────────────────
const TaskTable = ({ tasks, onEdit, onDelete, onStatusChange }) => {
  // ── Sorting state ─────────────────────────────────────────────────────────
  // sortField — which column to sort by
  // sortDir   — "asc" (A→Z, oldest first) or "desc" (Z→A, newest first)
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir]     = useState("desc");

  // ── Handle column header click ────────────────────────────────────────────
  // If clicking the same column → toggle direction
  // If clicking a new column → sort ascending by default
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ── Sort tasks ────────────────────────────────────────────────────────────
  // We sort a COPY of the array (spread [...tasks]) so we don't mutate the
  // original array in the parent component's state.
  const sortedTasks = [...tasks].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // Handle nested fields (e.g. project.title)
    if (sortField === "project") {
      valA = a.project?.title || "";
      valB = b.project?.title || "";
    }

    // Handle dates
    if (sortField === "dueDate" || sortField === "createdAt") {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    }

    // String comparison
    if (typeof valA === "string") {
      valA = valA.toLowerCase();
      valB = (valB || "").toLowerCase();
    }

    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // ── Sort indicator ────────────────────────────────────────────────────────
  const SortIcon = ({ field }) => (
    <span className={`sort-icon ${sortField === field ? "sort-icon--active" : ""}`}>
      {sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : <MdUnfoldMore size={14} />}
    </span>
  );

  // ── Due date display ──────────────────────────────────────────────────────
  const formatDueDate = (dueDate, status) => {
    if (!dueDate) return <span className="text-muted">—</span>;

    const due      = new Date(dueDate);
    const diffDays = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0 && status !== "done";

    return (
      <span className={isOverdue ? "text-danger" : diffDays <= 3 && status !== "done" ? "text-warning" : ""}>
        {due.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        {isOverdue && <span className="table-overdue-badge"> ⚠</span>}
      </span>
    );
  };

  return (
    <div className="task-table-wrapper">
      <table className="task-table">
        <thead>
          <tr>
            <th className="task-table__th task-table__th--sortable" onClick={() => handleSort("title")}>
              Title <SortIcon field="title" />
            </th>
            <th className="task-table__th task-table__th--sortable" onClick={() => handleSort("project")}>
              Project <SortIcon field="project" />
            </th>
            <th className="task-table__th task-table__th--sortable" onClick={() => handleSort("priority")}>
              Priority <SortIcon field="priority" />
            </th>
            <th className="task-table__th">Status</th>
            <th className="task-table__th task-table__th--sortable" onClick={() => handleSort("dueDate")}>
              Due Date <SortIcon field="dueDate" />
            </th>
            <th className="task-table__th">Assigned</th>
            <th className="task-table__th task-table__th--actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task) => (
            <tr
              key={task._id}
              className={`task-table__row ${task.status === "done" ? "task-table__row--done" : ""}`}
            >
              {/* Title */}
              <td className="task-table__td task-table__td--title">
                <div className="task-table__title-cell">
                  <span className={task.status === "done" ? "text-strikethrough" : ""}>
                    {task.title}
                  </span>
                  {task.description && (
                    <span className="task-table__desc">{task.description}</span>
                  )}
                </div>
              </td>

              {/* Project */}
              <td className="task-table__td">
                <span className="task-table__project">
                  {task.project?.title || "—"}
                </span>
              </td>

              {/* Priority */}
              <td className="task-table__td">
                <span className={`badge badge--priority-${task.priority}`}>
                  {task.priority}
                </span>
              </td>

              {/* Status — inline dropdown */}
              <td className="task-table__td">
                <StatusCell task={task} onStatusChange={onStatusChange} />
              </td>

              {/* Due Date */}
              <td className="task-table__td">
                {formatDueDate(task.dueDate, task.status)}
              </td>

              {/* Assigned To */}
              <td className="task-table__td">
                {task.assignedTo ? (
                  <div className="task-table__assignee">
                    <div className="task-table__avatar">
                      {task.assignedTo.name?.charAt(0).toUpperCase()}
                    </div>
                    <span>{task.assignedTo.name}</span>
                  </div>
                ) : (
                  <span className="text-muted">Unassigned</span>
                )}
              </td>

              {/* Actions */}
              <td className="task-table__td task-table__td--actions">
                <button
                  className="task-card__action-btn task-card__action-btn--edit"
                  onClick={() => onEdit(task)}
                  aria-label="Edit task"
                  title="Edit"
                >
                  <MdEdit size={15} />
                </button>
                <button
                  className="task-card__action-btn task-card__action-btn--delete"
                  onClick={() => onDelete(task)}
                  aria-label="Delete task"
                  title="Delete"
                >
                  <MdDelete size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
