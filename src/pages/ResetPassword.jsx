import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordApi } from "../api/authApi";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import toast from "react-hot-toast";
import "../styles/Auth.css";

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD PAGE — Step 3
// ─────────────────────────────────────────────────────────────────────────────

const ResetPassword = () => {
  const [searchParams]                    = useSearchParams();
  const email                             = searchParams.get("email") || "";
  const [formData, setFormData]           = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors]               = useState({});
  const [loading, setLoading]             = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [success, setSuccess]             = useState(false);
  const navigate                          = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.newPassword)                    newErrors.newPassword = "Password is required";
    else if (formData.newPassword.length < 6)     newErrors.newPassword = "Password must be at least 6 characters";
    else if (!/\d/.test(formData.newPassword))    newErrors.newPassword = "Password must contain at least one number";
    if (!formData.confirmPassword)                newErrors.confirmPassword = "Please confirm your password";
    else if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      await resetPasswordApi({ email, newPassword: formData.newPassword });
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reset password.";
      toast.error(msg);
      setErrors({ newPassword: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-card__header">
          <div className="auth-card__logo"><span>🔒</span></div>
          <h1 className="auth-card__title">New Password</h1>
          <p className="auth-card__subtitle">
            Create a strong new password for your account
          </p>
        </div>

        {/* ── Success State ─────────────────────────────────────────── */}
        {success ? (
          <div className="otp-success">
            <div className="otp-success__icon">✅</div>
            <h3 className="otp-success__title">Password Reset!</h3>
            <p className="otp-success__text">
              Your password has been reset successfully.
              Redirecting to login...
            </p>
            <Link to="/login" className="btn btn--primary btn--full btn--lg"
              style={{ marginTop: "16px", justifyContent: "center" }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* New Password */}
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <div className="input-wrapper">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  className={`form-input form-input--icon-right ${errors.newPassword ? "form-input--error" : ""}`}
                  placeholder="Min. 6 chars with a number"
                  value={formData.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button type="button" className="input-icon-right"
                  onClick={() => setShowPassword((p) => !p)}>
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
              {errors.newPassword && <p className="field-error" role="alert">{errors.newPassword}</p>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  className={`form-input form-input--icon-right ${errors.confirmPassword ? "form-input--error" : ""}`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button type="button" className="input-icon-right"
                  onClick={() => setShowConfirm((p) => !p)}>
                  {showConfirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="field-error" role="alert">{errors.confirmPassword}</p>}
              {formData.confirmPassword && formData.newPassword === formData.confirmPassword && !errors.confirmPassword && (
                <p className="field-success">✓ Passwords match</p>
              )}
            </div>

            <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading}>
              {loading ? <><span className="btn-spinner" /> Resetting...</> : "Reset Password"}
            </button>

          </form>
        )}

        <p className="auth-card__footer">
          <Link to="/login" className="auth-card__link">← Back to Login</Link>
        </p>

      </div>
    </div>
  );
};

export default ResetPassword;
