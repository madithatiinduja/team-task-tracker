import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { verifyOtpApi } from "../api/authApi";
import toast from "react-hot-toast";
import "../styles/Auth.css";

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY OTP PAGE — Step 2
// ─────────────────────────────────────────────────────────────────────────────
// User enters the 6-digit OTP received in email.
// Each digit has its own input box — auto-focuses next box on input.

const VerifyOtp = () => {
  const [searchParams]          = useSearchParams();
  const email                   = searchParams.get("email") || "";
  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const inputRefs               = useRef([]);
  const navigate                = useNavigate();

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Handle digit input ────────────────────────────────────────────────────
  const handleChange = (index, value) => {
    // Only allow single digit
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // take last character if multiple pasted
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ── Handle backspace ──────────────────────────────────────────────────────
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Handle paste ──────────────────────────────────────────────────────────
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    if (timeLeft <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await verifyOtpApi({ email, otp: otpString });
      toast.success("OTP verified!");
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP. Please try again.";
      toast.error(msg);
      setError(msg);
      // Clear OTP boxes on wrong entry
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-card__header">
          <div className="auth-card__logo"><span>🔐</span></div>
          <h1 className="auth-card__title">Enter OTP</h1>
          <p className="auth-card__subtitle">
            We sent a 6-digit code to<br />
            <strong>{email}</strong>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* ── OTP Input Boxes ─────────────────────────────────────── */}
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-input ${error ? "otp-input--error" : ""} ${digit ? "otp-input--filled" : ""}`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                autoFocus={index === 0}
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Error */}
          {error && <p className="field-error" role="alert" style={{ textAlign: "center" }}>{error}</p>}

          {/* Timer */}
          <div className="otp-timer">
            {timeLeft > 0 ? (
              <span className={timeLeft < 60 ? "otp-timer--urgent" : ""}>
                ⏱ OTP expires in {formatTime(timeLeft)}
              </span>
            ) : (
              <span className="otp-timer--expired">OTP expired</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full btn--lg"
            disabled={loading || otp.join("").length !== 6 || timeLeft <= 0}
          >
            {loading ? <><span className="btn-spinner" /> Verifying...</> : "Verify OTP"}
          </button>

        </form>

        <p className="auth-card__footer">
          Didn't receive OTP?{" "}
          <Link to="/forgot-password" className="auth-card__link">
            Resend
          </Link>
        </p>

      </div>
    </div>
  );
};

export default VerifyOtp;
