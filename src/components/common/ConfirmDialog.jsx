import { MdWarning } from "react-icons/md";
import "../../styles/ConfirmDialog.css";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM DIALOG — Reusable confirmation modal
// ─────────────────────────────────────────────────────────────────────────────
// Replaces window.confirm() with a proper styled modal.
// window.confirm() is ugly, blocks the browser thread, and can't be styled.
//
// Props:
//   isOpen    — boolean, controls visibility
//   title     — string, dialog heading
//   message   — string, description text
//   onConfirm — function, called when user clicks "Confirm"
//   onCancel  — function, called when user clicks "Cancel" or overlay
//   loading   — boolean, shows spinner on confirm button while deleting
//   confirmText — string, label for confirm button (default: "Delete")
//   confirmColor — "danger" | "primary" (default: "danger")
// ─────────────────────────────────────────────────────────────────────────────

const ConfirmDialog = ({
  isOpen,
  title       = "Are you sure?",
  message     = "This action cannot be undone.",
  onConfirm,
  onCancel,
  loading     = false,
  confirmText = "Delete",
  confirmColor = "danger",
}) => {
  if (!isOpen) return null;

  return (
    // Clicking the overlay cancels the dialog
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()} // prevent overlay click
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        {/* Warning icon */}
        <div className={`confirm-dialog__icon confirm-dialog__icon--${confirmColor}`}>
          <MdWarning size={28} />
        </div>

        {/* Text */}
        <h3 className="confirm-dialog__title" id="confirm-title">
          {title}
        </h3>
        <p className="confirm-dialog__message" id="confirm-message">
          {message}
        </p>

        {/* Actions */}
        <div className="confirm-dialog__actions">
          <button
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`btn btn--${confirmColor}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner btn-spinner--sm" />
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
