import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT FORM — Reusable form for both Create and Edit
// ─────────────────────────────────────────────────────────────────────────────
// Why one form for both operations?
//   Create and Edit need the exact same fields.
//   Instead of duplicating code, we pass an "initialData" prop.
//   If initialData is provided → Edit mode (fields pre-filled).
//   If not → Create mode (fields empty).
//
// Props:
//   initialData  — project object for edit mode (optional)
//   onSubmit     — async function called with form data on submit
//   onCancel     — function called when Cancel is clicked
//   loading      — boolean, disables submit button during API call
//   submitLabel  — string, button text (default: "Save")
// ─────────────────────────────────────────────────────────────────────────────

// ── Default empty form state ──────────────────────────────────────────────────
const EMPTY_FORM = {
  title:       "",
  description: "",
  status:      "active",
  deadline:    "",
};

// ── Helper: format Date object to "YYYY-MM-DD" for <input type="date"> ────────
// HTML date inputs require the value in "YYYY-MM-DD" format.
// MongoDB returns dates as ISO strings like "2025-12-31T00:00:00.000Z".
// We strip the time part to get just the date.

const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

const ProjectForm = ({
  initialData  = null,
  onSubmit,
  onCancel,
  loading      = false,
  submitLabel  = "Save",
}) => {
  // ── State ─────────────────────────────────────────────────────────────────
  // Initialize with initialData (edit mode) or empty form (create mode)
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});

  // ── Populate form when editing ────────────────────────────────────────────
  // useEffect runs when initialData changes.
  // This handles the case where the modal opens with existing project data.

  useEffect(() => {
    if (initialData) {
      setFormData({
        title:       initialData.title       || "",
        description: initialData.description || "",
        status:      initialData.status      || "active",
        deadline:    formatDateForInput(initialData.deadline),
      });
    } else {
      setFormData(EMPTY_FORM); // reset for create mode
    }
  }, [initialData]);

  // ── Handle Input Change ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Project title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.trim().length > 100) {
      newErrors.title = "Title cannot exceed 100 characters";
    }

    if (formData.description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }

    if (formData.deadline) {
      const selectedDate = new Date(formData.deadline);
      const today        = new Date();
      today.setHours(0, 0, 0, 0); // compare dates only, not times
      // Only warn for new projects — editing an old deadline is fine
      if (!initialData && selectedDate < today) {
        newErrors.deadline = "Deadline cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Build payload — omit deadline if empty (don't send empty string to API)
    const payload = {
      ...formData,
      title:       formData.title.trim(),
      description: formData.description.trim(),
      deadline:    formData.deadline || undefined,
    };

    await onSubmit(payload); // parent handles the actual API call
  };

  // ── Character counter for description ────────────────────────────────────
  const descLength = formData.description.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="modal__form" noValidate>

      {/* Title */}
      <div className="form-group">
        <label htmlFor="proj-title" className="form-label">
          Project Title <span className="form-required">*</span>
        </label>
        <input
          id="proj-title"
          type="text"
          name="title"
          className={`form-input ${errors.title ? "form-input--error" : ""}`}
          placeholder="e.g. Website Redesign"
          value={formData.title}
          onChange={handleChange}
          maxLength={100}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="field-error" role="alert">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="form-group">
        <div className="form-label-row">
          <label htmlFor="proj-desc" className="form-label">Description</label>
          {/* Character counter — turns red when near limit */}
          <span className={`char-count ${descLength > 450 ? "char-count--warn" : ""}`}>
            {descLength}/500
          </span>
        </div>
        <textarea
          id="proj-desc"
          name="description"
          className={`form-input form-textarea ${errors.description ? "form-input--error" : ""}`}
          placeholder="What is this project about? (optional)"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          maxLength={500}
        />
        {errors.description && (
          <p className="field-error" role="alert">{errors.description}</p>
        )}
      </div>

      {/* Status + Deadline side by side */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="proj-status" className="form-label">Status</label>
          <select
            id="proj-status"
            name="status"
            className="form-input"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">🟢 Active</option>
            <option value="completed">🔵 Completed</option>
            <option value="archived">⚫ Archived</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="proj-deadline" className="form-label">Deadline</label>
          {/* 
            type="date" allows calendar picker.
            User can ALSO directly type in the field — click on mm/dd/yyyy
            and type the date manually using keyboard.
            Placeholder shown via CSS trick below.
          */}
          <div className="date-input-wrap">
            <input
              id="proj-deadline"
              type="date"
              name="deadline"
              className={`form-input date-input ${errors.deadline ? "form-input--error" : ""}`}
              value={formData.deadline}
              onChange={handleChange}
              min="2020-01-01"
              max="2099-12-31"
            />
            {formData.deadline && (
              <button
                type="button"
                className="date-clear-btn"
                onClick={() => setFormData((prev) => ({ ...prev, deadline: "" }))}
                aria-label="Clear deadline"
                title="Clear date"
              >
                ✕
              </button>
            )}
          </div>
          {errors.deadline && (
            <p className="field-error" role="alert">{errors.deadline}</p>
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
            <>
              <span className="btn-spinner" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>

    </form>
  );
};

export default ProjectForm;
