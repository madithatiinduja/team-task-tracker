import { MdMenu, MdDarkMode, MdLightMode, MdArrowBack } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Navbar.css";

const Navbar = ({ onMenuClick, title }) => {
  const { user }               = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate               = useNavigate();
  const location               = useLocation();

  // Back button sirf tab dikhao jab history mein kuch ho
  // Dashboard pe back button nahi dikhega
  const showBack = location.pathname !== "/dashboard";

  return (
    <header className="navbar">

      {/* ── Left ─────────────────────────────────────────────────────── */}
      <div className="navbar__left">
        <button
          className="navbar__menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <MdMenu size={24} />
        </button>

        {/* Back button */}
        {showBack && (
          <button
            className="navbar__back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back"
          >
            <MdArrowBack size={20} />
          </button>
        )}

        <h1 className="navbar__title">{title}</h1>
      </div>

      {/* ── Right ────────────────────────────────────────────────────── */}
      <div className="navbar__right">

        {/* Dark / Light toggle */}
        <button
          className="navbar__theme-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark"
            ? <MdLightMode size={20} />
            : <MdDarkMode  size={20} />
          }
        </button>

        {/* User avatar + greeting */}
        <div className="navbar__user">
          <div className="navbar__avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="navbar__greeting">
            Hi, {user?.name?.split(" ")[0]}
          </span>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
