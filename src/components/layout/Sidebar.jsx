import { NavLink, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdFolder,
  MdCheckBox,
  MdLogout,
  MdClose,
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "../../styles/Sidebar.css";

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
// The main navigation panel on the left side of the app.
// On mobile, it slides in/out based on the isOpen prop.
//
// Props:
//   isOpen    — boolean, controls mobile visibility
//   onClose   — function, called when user taps the close button on mobile
// ─────────────────────────────────────────────────────────────────────────────

const navItems = [
  { to: "/dashboard", icon: <MdDashboard size={20} />, label: "Dashboard" },
  { to: "/projects",  icon: <MdFolder size={20} />,    label: "Projects"  },
  { to: "/tasks",     icon: <MdCheckBox size={20} />,  label: "Tasks"     },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <>
      {/* Overlay — clicking it closes sidebar on mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <span className="sidebar__logo-icon">✓</span>
            <span className="sidebar__logo-text">TaskTracker</span>
          </div>
          {/* Close button — only visible on mobile */}
          <button className="sidebar__close" onClick={onClose} aria-label="Close sidebar">
            <MdClose size={22} />
          </button>
        </div>

        {/* ── Navigation Links ────────────────────────────────────────── */}
        <nav className="sidebar__nav">
          <ul className="sidebar__nav-list">
            {navItems.map(({ to, icon, label }) => (
              <li key={to}>
                {/* NavLink automatically adds "active" class to the current route */}
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `sidebar__nav-link ${isActive ? "sidebar__nav-link--active" : ""}`
                  }
                  onClick={onClose} // close sidebar on mobile after navigation
                >
                  <span className="sidebar__nav-icon">{icon}</span>
                  <span className="sidebar__nav-label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── User Info + Logout ──────────────────────────────────────── */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {/* Show first letter of user's name as avatar */}
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{user?.name}</p>
              <p className="sidebar__user-role">{user?.role}</p>
            </div>
          </div>
          <button
            className="sidebar__logout"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <MdLogout size={18} />
            <span>Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
