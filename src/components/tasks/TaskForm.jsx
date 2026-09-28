import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TASK FORM — Reusable for both Create and Edit
// ─────────────────────────────────────────────────────────────────────────────
// Props:
//   initialData  — task object for edit mode (null = create mode)
//   projects     — array of projects for the dropdown
//   onSubmit     — async fn called with form data
//   onCancel     — fn called on Cancel click
//   loading      — disables submit button during API call
//   submitLabel  — button text (default: "Save")
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title:       "",
  description: "",
  project:     "",
  priority:    "medium",
  status:      "todo",
  dueDate:     "",
};

// Format ISO date string → "YYYY-MM-DD" for <input type="date">
const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

const TaskForm = ({
  initialData  = null,
  projects     = [],
  onSubmit,
  onCancel,
  loading      = false,
  submitLabel  = "Save",
}) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});

  // ── Populate form when editing ────────────────────────────────────────────
  useEffect(() => {
    if (initialData) {
      setFormData({
        title:       initialData.title       || "",
        description: initialData.description || "",
        // project can be an object (populated) or a string ID
        project:     initialData.project?._id || initialData.project || "",
        priority:    initialData.priority    || "medium",
        status:      initialData.status      || "todo",
        dueDate:     formatDateForInput(initialData.dueDate),
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setErrors({});
  }, [initialData]);

  // ── Handle change ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.trim().length > 150) {
      newErrors.title = "Title cannot exceed 150 characters";
    }

    if (!formData.project) {
      newErrors.project = "Please select a project";
    }

    if (formData.description.length > 1000) {
      newErrors.description = "Description cannot exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      title:       formData.title.trim(),
      description: formData.description.trim(),
      dueDate:     formData.dueDate || undefined,
    };

    await onSubmit(payload);
  };

  const descLength = formData.description.length;

  // ── Priority options with colors ──────────────────────────────────────────
  const priorityOptions = [
    { value: "low",    label: "🟢 Low"    },
    { value: "medium", label: "🟡 Medium" },
    { value: "high",   label: "🔴 High"   },
  ];

  const statusOptions = [
    { value: "todo",        label: "📋 Todo"        },
    { value: "in-progress", label: "⚡ In Progress" },
    { value: "review",      label: "👀 Review"      },
    { value: "done",        label: "✅ Done"        },
  ];

  return (
    <form onSubmit={handleSubmit} className="modal__form" noValidate>

      {/* Title */}
      <div className="form-group">
        <label htmlFor="task-title" className="form-label">
          Task Title <span className="form-required">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          name="title"
          className={`form-input ${errors.title ? "form-input--error" : ""}`}
          placeholder="e.g. Fix login bug"
          value={formData.title}
          onChange={handleChange}
          maxLength={150}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="field-error" role="alert">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="form-group">
        <div className="form-label-row">
          <label htmlFor="task-desc" className="form-label">Description</label>
          <span className={`char-count ${descLength > 900 ? "char-count--warn" : ""}`}>
            {descLength}/1000
          </span>
        </div>
        <textarea
          id="task-desc"
          name="description"
          className={`form-input form-textarea ${errors.description ? "form-input--error" : ""}`}
          placeholder="What needs to be done? (optional)"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          maxLength={1000}
        />
        {errors.description && (
          <p className="field-error" role="alert">{errors.description}</p>
        )}
      </div>

      {/* Project */}
      <div className="form-group">
        <label htmlFor="task-project" className="form-label">
          Project <span className="form-required">*</span>
        </label>
        <select
          id="task-project"
          name="project"
          className={`form-input ${errors.project ? "form-input--error" : ""}`}
          value={formData.project}
          onChange={handleChange}
          aria-invalid={!!errors.project}
        >
          <option value="">— Select a project —</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
        {errors.project && (
          <p className="field-error" role="alert">{errors.project}</p>
        )}
        {projects.length === 0 && (
          <p className="field-hint">
            No projects found. Create a project first.
          </p>
        )}
      </div>

      {/* Priority + Status */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="task-priority" className="form-label">Priority</label>
          <select
            id="task-priority"
            name="priority"
            className="form-input"
            value={formData.priority}
            onChange={handleChange}
          >
            {priorityOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="task-status" className="form-label">Status</label>
          <select
            id="task-status"
            name="status"
            className="form-input"
            value={formData.status}
            onChange={handleChange}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Due Date */}
      <div className="form-group">
        <label htmlFor="task-due" className="form-label">Due Date</label>
        <div className="date-input-wrap">
          <input
            id="task-due"
            type="date"
            name="dueDate"
            className="form-input date-input"
            value={formData.dueDate}
            onChange={handleChange}
            min="2020-01-01"
            max="2099-12-31"
          />
          {formData.dueDate && (
            <button
              type="button"
              className="date-clear-btn"
              onClick={() => setFormData((prev) => ({ ...prev, dueDate: "" }))}
              aria-label="Clear due date"
              title="Clear date"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="modal__actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading}
        >
          {loading ? (
            <><span className="btn-spinner" /> Saving...</>
          ) : submitLabel}
        </button>
      </div>

    </form>
  );
};

export default TaskForm;
