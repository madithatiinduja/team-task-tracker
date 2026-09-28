import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/common/PageTransition";
import toast from "react-hot-toast";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import "../styles/Auth.css";

const Login = () => {
  const [formData, setFormData]         = useState({ email: "", password: "" });
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(formData);
      toast.success("Welcome back! 👋");
      navigate("/dashboard");
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed. Please try again.";
      toast.error(msg);
      if (error.response?.status === 401) {
        setErrors({ password: "Invalid email or password" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition variant="fadeIn">
      <div className="auth-page">
        <div className="auth-card">

        <div className="auth-card__header">
          <div className="auth-card__logo"><span>✓</span></div>
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__subtitle">Sign in to your account to continue</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              className={`form-input ${errors.email ? "form-input--error" : ""}`}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="field-error" role="alert">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">Password</label>
              <Link to="/forgot-password" className="auth-card__link" style={{ fontSize: "0.8125rem" }}>
                Forgot Password?
              </Link>
            </div>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                className={`form-input form-input--icon-right ${errors.password ? "form-input--error" : ""}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
              />
              {/* Only show/hide eye icon — no lock icon */}
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="field-error" role="alert">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full btn--lg"
            disabled={loading}
          >
            {loading ? <><span className="btn-spinner" /> Signing in...</> : "Sign In"}
          </button>

        </form>

        <p className="auth-card__footer">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-card__link">Sign Up</Link>
        </p>

        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
