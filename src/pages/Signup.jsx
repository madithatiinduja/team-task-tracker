import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/common/PageTransition";
import toast from "react-hot-toast";
import { MdVisibility, MdVisibilityOff, MdCheckCircle, MdCancel } from "react-icons/md";
import "../styles/Auth.css";

// Password strength calculator
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6)              score++;
  if (password.length >= 10)             score++;
  if (/[A-Z]/.test(password))            score++;
  if (/\d/.test(password))               score++;
  if (/[^A-Za-z0-9]/.test(password))    score++;
  const capped = Math.min(score, 4);
  const levels = [
    { label: "",       color: "" },
    { label: "Weak",   color: "#ef4444" },
    { label: "Fair",   color: "#f59e0b" },
    { label: "Good",   color: "#3b82f6" },
    { label: "Strong", color: "#10b981" },
  ];
  return { score: capped, ...levels[capped] };
};

const PasswordRequirement = ({ met, text }) => (
  <li className={`pwd-req ${met ? "pwd-req--met" : "pwd-req--unmet"}`}>
    {met
      ? <MdCheckCircle size={14} className="pwd-req__icon pwd-req__icon--met" />
      : <MdCancel size={14} className="pwd-req__icon pwd-req__icon--unmet" />
    }
    <span>{text}</span>
  </li>
);

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors]                   = useState({});
  const [loading, setLoading]                 = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const strength     = getPasswordStrength(formData.password);
  const requirements = [
    { met: formData.password.length >= 6,           text: "At least 6 characters"          },
    { met: /[A-Z]/.test(formData.password),         text: "One uppercase letter"            },
    { met: /\d/.test(formData.password),            text: "One number"                      },
    { met: /[^A-Za-z0-9]/.test(formData.password), text: "One special character (optional)" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim())                        newErrors.name = "Full name is required";
    else if (formData.name.trim().length < 2)         newErrors.name = "Name must be at least 2 characters";
    if (!formData.email.trim())                       newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Please enter a valid email address";
    if (!formData.password)                           newErrors.password = "Password is required";
    else if (formData.password.length < 6)            newErrors.password = "Password must be at least 6 characters";
    else if (!/\d/.test(formData.password))           newErrors.password = "Password must contain at least one number";
    if (!formData.confirmPassword)                    newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      await register(submitData);
      toast.success("Account created! Welcome 🎉");
      navigate("/dashboard");
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err) => toast.error(err));
      } else {
        toast.error(error.response?.data?.message || "Signup failed. Please try again.");
        if (error.response?.status === 400) {
          setErrors({ email: "An account with this email already exists" });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition variant="fadeIn">
      <div className="auth-page">
        <div className="auth-card auth-card--wide">

        <div className="auth-card__header">
          <div className="auth-card__logo"><span>✓</span></div>
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__subtitle">Start tracking your team's work today</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name" type="text" name="name"
              className={`form-input ${errors.name ? "form-input--error" : ""}`}
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
            />
            {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email" type="email" name="email"
              className={`form-input ${errors.email ? "form-input--error" : ""}`}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                className={`form-input form-input--icon-right ${errors.password ? "form-input--error" : ""}`}
                placeholder="Min. 6 chars with a number"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                autoComplete="new-password"
              />
              <button type="button" className="input-icon-right"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
            {errors.password && <p className="field-error" role="alert">{errors.password}</p>}

            {/* Strength bar */}
            {formData.password && (
              <div className="pwd-strength">
                <div className="pwd-strength__bar">
                  {[1,2,3,4].map((level) => (
                    <div key={level} className="pwd-strength__segment"
                      style={{ background: strength.score >= level ? strength.color : "#e2e8f0" }} />
                  ))}
                </div>
                {strength.label && (
                  <span className="pwd-strength__label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                )}
              </div>
            )}

            {/* Requirements */}
            {(passwordFocused || formData.password) && (
              <ul className="pwd-requirements">
                {requirements.map((req, i) => (
                  <PasswordRequirement key={i} met={req.met} text={req.text} />
                ))}
              </ul>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className={`input-wrapper ${
              errors.confirmPassword ? "input-wrapper--error" :
              formData.confirmPassword && formData.password === formData.confirmPassword
                ? "input-wrapper--success" : ""}`}>
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
                onClick={() => setShowConfirm((p) => !p)}
                aria-label={showConfirm ? "Hide password" : "Show password"}>
                {showConfirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="field-error" role="alert">{errors.confirmPassword}</p>}
            {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
              <p className="field-success">✓ Passwords match</p>
            )}
          </div>

          <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Creating account...</> : "Create Account"}
          </button>

        </form>

        <p className="auth-card__footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>

        </div>
      </div>
    </PageTransition>
  );
};

export default Signup;
