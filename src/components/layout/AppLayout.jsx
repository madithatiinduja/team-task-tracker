import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../../styles/AppLayout.css";

// ─────────────────────────────────────────────────────────────────────────────
// APP LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
// The shell that wraps every protected page.
// Structure:
//   ┌──────────────────────────────────────┐
//   │  Sidebar  │  Navbar (top)            │
//   │           │──────────────────────────│
//   │           │  <Outlet /> (page content)│
//   └──────────────────────────────────────┘
//
// <Outlet /> is where React Router renders the current page component.
// For example, when the URL is /dashboard, <Dashboard /> renders here.
//
// The sidebar open/close state lives here so both Navbar and Sidebar
// can share it without prop drilling through multiple levels.
// ─────────────────────────────────────────────────────────────────────────────

// Map routes to page titles for the Navbar
const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/projects":  "Projects",
  "/tasks":     "Tasks",
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Get the title for the current route
  // Falls back to "Team Task Tracker" if route not in the map
  const pageTitle =
    PAGE_TITLES[location.pathname] ||
    PAGE_TITLES[`/${location.pathname.split("/")[1]}`] ||
    "Team Task Tracker";

  return (
    <div className="app-layout">

      {/* Sidebar — always rendered, visibility controlled by CSS + isOpen prop */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area — everything to the right of the sidebar */}
      <div className="app-layout__main">

        {/* Top navbar */}
        <Navbar
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          title={pageTitle}
        />

        {/* Page content — React Router renders the matched page here */}
        <main className="app-layout__content">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default AppLayout;
