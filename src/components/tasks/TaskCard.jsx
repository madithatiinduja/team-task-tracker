import { useState } from "react";
import { motion } from "framer-motion";
import {
  MdEdit,
  MdDelete,
  MdCalendarToday,
  MdFolder,
  MdPerson,
} from "react-icons/md";
import { updateTaskStatus } from "../../api/taskApi";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// TASK CARD — Displays one task in grid view
// ─────────────────────────────────────────────────────────────────────────────
// Props:
//   task           — task object from API
//   onEdit         — fn(task) called when Edit is clicked
//   onDelete       — fn(task) called when Delete is clicked
//   onStatusChange — fn(taskId, newStatus) called after status update
// ─────────────────────────────────────────────────────────────────────────────

// ── Due date helpers ──────────────────────────────────────────────────────────

const getDueDateInfo = (dueDate, status) => {
  if (!dueDate) return null;

  const due   = new Date(dueDate);
  const now   = new Date();
  const diffMs = due - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (status === "done") {
    return {
      label: `Due ${due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
      type:  "done",
    };
  }

  if (diffDays < 0) {
    return {
      label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""}`,
      type:  "overdue",
    };
  }
  if (diffDays === 0) return { label: "Due today",     type: "today"  };
  if (diffDays === 1) return { label: "Due tomorrow",  type: "soon"   };
  if (diffDays <= 3)  return { label: `Due in ${diffDays} days`, type: "soon" };

  return {
    label: due.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    type:  "normal",
  };
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "todo",        label: "Todo"        },
  { value: "in-progress", label: "In Progress" },
  { value: "review",      label: "Review"      },
  { value: "done",        label: "Done"        },
];

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const [statusLoading, setStatusLoading] = useState(false);

  const dueDateInfo = getDueDateInfo(task.dueDate, task.status);
  const isOverdue   = dueDateInfo?.type === "overdue";

  // ── Inline status update ──────────────────────────────────────────────────
  // When user changes the dropdown, we immediately call the API.
  // We also update the local state optimistically via onStatusChange callback
  // so the UI updates instantly without waiting for a re-fetch.

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatusLoading(true);

    try {
      await updateTaskStatus(task._id, newStatus);
      onStatusChange(task._id, newStatus); // update parent state
      toast.success(`Status → ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <motion.div
      className={[
        "task-card",
        isOverdue          ? "task-card--overdue"  : "",
        task.status === "done" ? "task-card--done" : "",
      ].filter(Boolean).join(" ")}
      whileHover={{ y: -4, boxShadow: "0 12px 20px rgba(0, 0, 0, 0.12)" }}
      transition={{ duration: 0.2 }}
    >
      {/* ── Top: Priority + Overdue badge ────────────────────────────── */}
      <div className="task-card__header">
        <span className={`badge badge--priority-${task.priority}`}>
          {task.priority}
        </span>
        {isOverdue && (
          <span className="badge badge--overdue">⚠ Overdue</span>
        )}
        {task.status === "done" && (
          <span className="badge badge--status-done">✓ Done</span>
        )}
      </div>

      {/* ── Title ────────────────────────────────────────────────────── */}
      <h4 className={`task-card__title ${task.status === "done" ? "task-card__title--done" : ""}`}>
        {task.title}
      </h4>

      {/* ── Description ──────────────────────────────────────────────── */}
      {task.description && (
        <p className="task-card__desc">{task.description}</p>
      )}

      {/* ── Meta: Project + Assignee + Due Date ──────────────────────── */}
      <div className="task-card__meta">
        {task.project && (
          <div className="task-card__meta-item">
            <MdFolder size={13} />
            <span>{task.project.title}</span>
          </div>
        )}
        {task.assignedTo && (
          <div className="task-card__meta-item">
            <MdPerson size={13} />
            <span>{task.assignedTo.name}</span>
          </div>
        )}
        {dueDateInfo && (
          <div className={`task-card__meta-item task-card__due task-card__due--${dueDateInfo.type}`}>
            <MdCalendarToday size={13} />
            <span>{dueDateInfo.label}</span>
          </div>
        )}
      </div>

      {/* ── Footer: Status dropdown + Actions ────────────────────────── */}
      <div className="task-card__footer">
        {/* Status dropdown — inline quick update */}
        <div className="task-card__status-wrap">
          {statusLoading && <span className="task-card__status-spinner" />}
          <select
            className={`task-card__status-select status-select--${task.status}`}
            value={task.status}
            onChange={handleStatusChange}
            disabled={statusLoading}
            aria-label="Update task status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Edit + Delete buttons */}
        <div className="task-card__actions">
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
        </div>
      </div>

    </motion.div>
  );
};

export default TaskCard;
