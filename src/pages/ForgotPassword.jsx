import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../api/authApi";
import toast from "react-hot-toast";
import "../styles/Auth.css";

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD PAGE — Step 1
// ─────────────────────────────────────────────────────────────────────────────
// User enters their email → backend generates OTP → sends email
// On success → show success message with link to verify OTP page

const ForgotPassword = () => {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const validate = () => {
    if (!email.trim()) { setError("Email is required"); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Please enter a valid email"); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");

    try {
      await forgotPasswordApi({ email: email.toLowerCase().trim() });
      setSent(true);
      toast.success("OTP sent! Check your email.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP. Try again.";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-card__header">
          <div className="auth-card__logo"><span>🔑</span></div>
          <h1 className="auth-card__title">Forgot Password?</h1>
          <p className="auth-card__subtitle">
            Enter your email and we'll send you a 6-digit OTP
          </p>
        </div>

        {/* ── Success State ─────────────────────────────────────────── */}
        {sent ? (
          <div className="otp-success">
            <div className="otp-success__icon">📧</div>
            <h3 className="otp-success__title">OTP Sent!</h3>
            <p className="otp-success__text">
              We've sent a 6-digit OTP to <strong>{email}</strong>.
              Check your inbox (and spam folder).
            </p>
            <Link
              to={`/verify-otp?email=${encodeURIComponent(email)}`}
              className="btn btn--primary btn--full btn--lg"
              style={{ marginTop: "16px", justifyContent: "center" }}
            >
              Enter OTP →
            </Link>
            <button
              className="otp-resend-btn"
              onClick={() => { setSent(false); }}
            >
              Didn't receive it? Try again
            </button>
          </div>
        ) : (
          /* ── Form ─────────────────────────────────────────────────── */
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                className={`form-input ${error ? "form-input--error" : ""}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                autoComplete="email"
              />
              {error && <p className="field-error" role="alert">{error}</p>}
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--full btn--lg"
              disabled={loading}
            >
              {loading ? <><span className="btn-spinner" /> Sending OTP...</> : "Send OTP"}
            </button>
          </form>
        )}

        <p className="auth-card__footer">
          Remember your password?{" "}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>

      </div>
    </div>
  );
};

export default ForgotPassword;
