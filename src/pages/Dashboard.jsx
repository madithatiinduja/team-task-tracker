import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDashboardStats, getActivityStats, getOverdueTasks } from "../api/dashboardApi";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/common/PageTransition";
import {
  MdCheckCircle, MdPending, MdWarning, MdFolder,
  MdArrowForward, MdRefresh, MdAssignment,
  MdTrendingUp, MdCalendarToday, MdPerson,
} from "react-icons/md";
import toast from "react-hot-toast";
import "../styles/Dashboard.css";

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────
//
// DATA FLOW EXPLAINED:
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. Component mounts → useEffect runs → 3 API calls fire in PARALLEL
//    (Promise.all — all 3 run at the same time, not one after another)
//
// 2. APIs called:
//    GET /api/dashboard         → summary stats + recent tasks/projects
//    GET /api/dashboard/activity → 7-day task creation/completion data
//    GET /api/dashboard/overdue  → list of overdue tasks
//
// 3. Data stored in state:
//    stats    → { summary, tasksByStatus, tasksByPriority, recentTasks, recentProjects }
//    activity → { activity: [{date, created, completed}], period: {...} }
//    overdue  → [{ _id, title, dueDate, daysOverdue, project, priority }]
//
// 4. React re-renders with the data → components display it
//
// COMPONENT STRUCTURE:
//   Dashboard (main)
//   ├── StatCard          ← one number + icon + label
//   ├── CompletionRing    ← circular progress (pure CSS)
//   ├── BreakdownBar      ← horizontal bar chart (pure CSS)
//   ├── ActivityChart     ← 7-day bar chart (pure CSS)
//   ├── RecentList        ← recent tasks / projects
//   ├── OverdueList       ← overdue tasks with days count
//   ├── ProjectProgress   ← per-project task completion bar
//   └── SkeletonCard      ← loading placeholder
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Skeleton Card — shown while loading ──────────────────────────────────────
// Skeleton loading is better UX than a spinner because:
//   - User sees the layout before data arrives (no layout shift)
//   - Feels faster even if it takes the same time
const SkeletonCard = ({ height = 100 }) => (
  <div className="skeleton-card" style={{ height }} />
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
// Shows one key metric with icon, value, label, tooltip on hover
const StatCard = ({ label, value, icon, color, to, subtitle, tooltip }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`stat-card stat-card--${color} ${to ? "stat-card--clickable" : ""}`}
      onClick={() => to && navigate(to)}
      role={to ? "button" : undefined}
      tabIndex={to ? 0 : undefined}
      // HTML title attribute — browser shows native tooltip on hover
      title={tooltip || label}
      data-tooltip={tooltip}
    >
      <div className={`stat-card__icon-wrap stat-card__icon-wrap--${color}`}>
        {icon}
      </div>
      <div className="stat-card__body">
        <p className="stat-card__value">
          {value ?? <span className="stat-card__dash">—</span>}
        </p>
        <p className="stat-card__label">{label}</p>
        {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
      </div>
      {to && (
        <MdArrowForward size={16} className="stat-card__arrow" />
      )}
    </div>
  );
};

// ── Completion Ring — circular progress (pure CSS) ────────────────────────────
// Shows completion rate as a circle.
// Uses CSS conic-gradient — no SVG or canvas needed.
const CompletionRing = ({ percentage = 0 }) => {
  const pct = Math.min(100, Math.max(0, percentage));

  return (
    <div className="completion-ring">
      <div
        className="completion-ring__circle"
        style={{
          // conic-gradient draws a pie chart from 0° to (pct * 3.6)°
          background: `conic-gradient(
            var(--color-primary) 0% ${pct}%,
            var(--color-border)  ${pct}% 100%
          )`,
        }}
      >
        <div className="completion-ring__inner">
          <span className="completion-ring__value">{pct}%</span>
          <span className="completion-ring__label">Done</span>
        </div>
      </div>
    </div>
  );
};

// ── Breakdown Bar — horizontal bar chart (pure CSS) ───────────────────────────
const BreakdownBar = ({ items, total, type = "task" }) => {
  if (!items || total === 0) {
    return <p className="empty-state">No data yet</p>;
  }

  return (
    <div className="breakdown-bars">
      {items.map(({ key, label, count, color }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        // Tooltip text — tells user exactly what this bar means
        const tooltipText = `${count} ${type}${count !== 1 ? "s" : ""} with ${label} ${type === "task" ? "status" : "priority"} (${pct}% of total)`;

        return (
          <div key={key} className="breakdown-bar" title={tooltipText}>
            <div className="breakdown-bar__header">
              <div className="breakdown-bar__left">
                <span className={`breakdown-dot breakdown-dot--${key}`} />
                <span className="breakdown-bar__label">{label}</span>
              </div>
              <div className="breakdown-bar__right">
                <span className="breakdown-bar__count">{count}</span>
                <span className="breakdown-bar__pct">{pct}%</span>
              </div>
            </div>
            <div className="breakdown-bar__track">
              <div
                className="breakdown-bar__fill"
                style={{
                  width: `${pct}%`,
                  background: color,
                  transition: "width 0.8s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Activity Chart — 7-day bar chart (pure CSS) ───────────────────────────────
// Shows tasks created vs completed per day as vertical bars.
// Bar height is set via inline style — no chart library needed.
const ActivityChart = ({ activity }) => {
  if (!activity || activity.length === 0) {
    return <p className="empty-state">No activity data yet</p>;
  }

  // Find the max value to scale bars relative to it
  const maxVal = Math.max(
    ...activity.map((d) => Math.max(d.created, d.completed)),
    1 // prevent division by zero
  );

  return (
    <div className="activity-chart">
      {/* Legend */}
      <div className="activity-chart__legend">
        <div className="activity-chart__legend-item">
          <span className="activity-chart__legend-dot activity-chart__legend-dot--created" />
          <span>Created</span>
        </div>
        <div className="activity-chart__legend-item">
          <span className="activity-chart__legend-dot activity-chart__legend-dot--completed" />
          <span>Completed</span>
        </div>
      </div>

      {/* Bars */}
      <div className="activity-chart__bars">
        {activity.map((day) => {
          const createdH   = (day.created   / maxVal) * 100;
          const completedH = (day.completed / maxVal) * 100;
          // Format date: "May 23" → "23"
          const dayLabel = new Date(day.date).toLocaleDateString("en-IN", {
            day: "numeric",
          });
          const monthLabel = new Date(day.date).toLocaleDateString("en-IN", {
            month: "short",
          });

          return (
            <div key={day.date} className="activity-chart__day">
              {/* Bar group */}
              <div className="activity-chart__bar-group">
                {/* Created bar */}
                <div className="activity-chart__bar-wrap" title={`Created: ${day.created}`}>
                  <div
                    className="activity-chart__bar activity-chart__bar--created"
                    style={{ height: `${createdH}%` }}
                  />
                </div>
                {/* Completed bar */}
                <div className="activity-chart__bar-wrap" title={`Completed: ${day.completed}`}>
                  <div
                    className="activity-chart__bar activity-chart__bar--completed"
                    style={{ height: `${completedH}%` }}
                  />
                </div>
              </div>
              {/* Date label */}
              <div className="activity-chart__date">
                <span>{dayLabel}</span>
                <span className="activity-chart__month">{monthLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Project Progress Card ─────────────────────────────────────────────────────
const ProjectProgressCard = ({ project }) => {
  const pct = project.taskCount > 0
    ? Math.round((project.completedTaskCount / project.taskCount) * 100)
    : 0;

  return (
    <div className="project-progress">
      <div className="project-progress__header">
        <div className="project-progress__info">
          <p className="project-progress__title">{project.title}</p>
          <span className={`badge badge--status-${project.status}`}>
            {project.status}
          </span>
        </div>
        <span className="project-progress__pct">{pct}%</span>
      </div>
      {/* Progress bar */}
      <div className="project-progress__track">
        <div
          className="project-progress__fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="project-progress__meta">
        {project.completedTaskCount} / {project.taskCount} tasks completed
      </p>
    </div>
  );
};

// ── Overdue Task Item ─────────────────────────────────────────────────────────
const OverdueItem = ({ task }) => (
  <div className="overdue-item">
    <div className="overdue-item__left">
      <div className={`overdue-item__priority overdue-item__priority--${task.priority}`} />
      <div className="overdue-item__info">
        <p className="overdue-item__title">{task.title}</p>
        <p className="overdue-item__project">
          {task.project?.title || "No project"}
        </p>
      </div>
    </div>
    <div className="overdue-item__right">
      <span className="overdue-item__days">
        {task.daysOverdue}d overdue
      </span>
      <span className={`badge badge--priority-${task.priority}`}>
        {task.priority}
      </span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [stats, setStats]       = useState(null);
  const [activity, setActivity] = useState(null);
  const [overdue, setOverdue]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const { user }                = useAuth();

  // ── Fetch all dashboard data ────────────────────────────────────────────
  // Promise.all fires all 3 API calls at the same time.
  // Total wait time = slowest single call (not sum of all calls).
  // Sequential: 300ms + 200ms + 250ms = 750ms
  // Parallel:   max(300ms, 200ms, 250ms) = 300ms  ← much faster

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, activityRes, overdueRes] = await Promise.all([
        getDashboardStats(),
        getActivityStats(),
        getOverdueTasks(),
      ]);

      setStats(statsRes.data.data);
      setActivity(activityRes.data.data);
      setOverdue(overdueRes.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load dashboard";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Greeting based on time of day ─────────────────────────────────────────
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // ── Build breakdown items for BreakdownBar ────────────────────────────────
  const statusItems = stats?.tasksByStatus
    ? [
        { key: "todo",        label: "Todo",        count: stats.tasksByStatus.todo        || 0, color: "#94a3b8" },
        { key: "in-progress", label: "In Progress", count: stats.tasksByStatus["in-progress"] || 0, color: "#f59e0b" },
        { key: "review",      label: "Review",      count: stats.tasksByStatus.review      || 0, color: "#8b5cf6" },
        { key: "done",        label: "Done",        count: stats.tasksByStatus.done        || 0, color: "#10b981" },
      ]
    : [];

  const priorityItems = stats?.tasksByPriority
    ? [
        { key: "high",   label: "High",   count: stats.tasksByPriority.high   || 0, color: "#ef4444" },
        { key: "medium", label: "Medium", count: stats.tasksByPriority.medium || 0, color: "#f59e0b" },
        { key: "low",    label: "Low",    count: stats.tasksByPriority.low    || 0, color: "#10b981" },
      ]
    : [];

  const totalTasks = stats?.summary?.totalTasks || 0;

  // ── Loading state — skeleton cards ────────────────────────────────────────
  if (loading) {
    return (
      <div className="dashboard">
        {/* Welcome skeleton */}
        <SkeletonCard height={80} />
        {/* Stat cards skeleton */}
        <div className="stat-cards-grid">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} height={100} />)}
        </div>
        {/* Row skeleton */}
        <div className="dashboard__row">
          <SkeletonCard height={280} />
          <SkeletonCard height={280} />
        </div>
        <div className="dashboard__row">
          <SkeletonCard height={240} />
          <SkeletonCard height={240} />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__error">
          <div className="dashboard__error-icon">⚠️</div>
          <h3>Failed to load dashboard</h3>
          <p>{error}</p>
          <button className="btn btn--primary" onClick={fetchAll}>
            <MdRefresh size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const { summary, recentTasks, recentProjects, projectsWithTaskCount } = stats || {};

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageTransition variant="fadeSlideUp">
      <div className="dashboard">

      {/* ── Welcome Banner ───────────────────────────────────────────── */}
      <div className="dashboard__welcome">
        <div className="dashboard__welcome-left">
          <h2 className="dashboard__welcome-title">
            {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="dashboard__welcome-sub">
            Here's your work summary for today.
          </p>
        </div>
        <div className="dashboard__welcome-actions">
          <button
            className="btn btn--secondary btn--icon"
            onClick={fetchAll}
            title="Refresh dashboard"
            aria-label="Refresh"
          >
            <MdRefresh size={18} />
          </button>
          <Link to="/tasks" className="btn btn--primary">
            <MdAssignment size={16} /> New Task
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────── */}
      {/*
        Each card links to the relevant filtered page.
        Clicking "Overdue" → /tasks?priority=high (example)
        This makes the dashboard interactive, not just informational.
      */}
      <div className="stat-cards-grid">
        <StatCard
          label="Total Tasks"
          value={summary?.totalTasks}
          icon={<MdAssignment size={26} />}
          color="blue"
          to="/tasks"
          subtitle="All tasks"
          tooltip="Total number of tasks you created or are assigned to"
        />
        <StatCard
          label="Completed"
          value={summary?.completedTasks}
          icon={<MdCheckCircle size={26} />}
          color="green"
          to="/tasks"
          subtitle="Done"
          tooltip="Tasks marked as Done"
        />
        <StatCard
          label="Pending"
          value={summary?.pendingTasks}
          icon={<MdPending size={26} />}
          color="yellow"
          to="/tasks"
          subtitle="Not done"
          tooltip="Tasks that are Todo, In Progress, or In Review"
        />
        <StatCard
          label="Overdue"
          value={summary?.overdueTasks}
          icon={<MdWarning size={26} />}
          color="red"
          to="/tasks"
          subtitle="Past due"
          tooltip="Tasks whose due date has passed and are not yet completed"
        />
        <StatCard
          label="Projects"
          value={summary?.totalProjects}
          icon={<MdFolder size={26} />}
          color="purple"
          to="/projects"
          subtitle="Total"
          tooltip="Total projects you own or are a member of"
        />
      </div>

      {/* ── Completion Rate + Activity Chart ─────────────────────────── */}
      <div className="dashboard__row dashboard__row--3-1">

        {/* Activity Chart — 7-day bar chart */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-header-left">
              <MdTrendingUp size={18} className="dashboard__card-icon" />
              <h3 className="dashboard__card-title">7-Day Activity</h3>
            </div>
            {activity?.period && (
              <span className="dashboard__card-meta">
                {activity.period.totalCreated} created · {activity.period.totalCompleted} completed
              </span>
            )}
          </div>
          <ActivityChart activity={activity?.activity} />
        </div>

        {/* Completion Ring */}
        <div className="dashboard__card dashboard__card--center">
          <h3 className="dashboard__card-title">Completion</h3>
          <CompletionRing percentage={summary?.completionRate ?? 0} />
          <p className="dashboard__card-meta-center">
            {summary?.completedTasks} of {summary?.totalTasks} tasks done
          </p>
        </div>

      </div>

      {/* ── Status + Priority Breakdown ──────────────────────────────── */}
      <div className="dashboard__row">

        {/* Tasks by Status */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-header-left">
              <MdAssignment size={18} className="dashboard__card-icon" />
              <h3 className="dashboard__card-title">Tasks by Status</h3>
            </div>
            <span className="dashboard__card-meta">{totalTasks} total</span>
          </div>
          <BreakdownBar items={statusItems} total={totalTasks} />
        </div>

        {/* Tasks by Priority */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-header-left">
              <MdWarning size={18} className="dashboard__card-icon" />
              <h3 className="dashboard__card-title">Tasks by Priority</h3>
            </div>
            <span className="dashboard__card-meta">{totalTasks} total</span>
          </div>
          <BreakdownBar items={priorityItems} total={totalTasks} />
        </div>

      </div>

      {/* ── Overdue Tasks + Project Progress ─────────────────────────── */}
      <div className="dashboard__row">

        {/* Overdue Tasks */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-header-left">
              <MdCalendarToday size={18} className="dashboard__card-icon dashboard__card-icon--danger" />
              <h3 className="dashboard__card-title">Overdue Tasks</h3>
            </div>
            {overdue.length > 0 && (
              <span className="dashboard__card-badge dashboard__card-badge--danger">
                {overdue.length}
              </span>
            )}
          </div>
          {overdue.length === 0 ? (
            <div className="dashboard__empty">
              <MdCheckCircle size={32} className="dashboard__empty-icon" />
              <p>No overdue tasks. Great work!</p>
            </div>
          ) : (
            <div className="overdue-list">
              {overdue.slice(0, 5).map((task) => (
                <OverdueItem key={task._id} task={task} />
              ))}
              {overdue.length > 5 && (
                <Link to="/tasks" className="dashboard__see-more">
                  +{overdue.length - 5} more overdue tasks
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Project Progress */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-header-left">
              <MdFolder size={18} className="dashboard__card-icon" />
              <h3 className="dashboard__card-title">Project Progress</h3>
            </div>
            <Link to="/projects" className="dashboard__card-link">
              View all <MdArrowForward size={14} />
            </Link>
          </div>
          {!projectsWithTaskCount || projectsWithTaskCount.length === 0 ? (
            <div className="dashboard__empty">
              <MdFolder size={32} className="dashboard__empty-icon" />
              <p>No projects yet.</p>
            </div>
          ) : (
            <div className="project-progress-list">
              {projectsWithTaskCount.map((project) => (
                <ProjectProgressCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Recent Tasks + Recent Projects ───────────────────────────── */}
      <div className="dashboard__row">

        {/* Recent Tasks */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-header-left">
              <MdAssignment size={18} className="dashboard__card-icon" />
              <h3 className="dashboard__card-title">Recent Tasks</h3>
            </div>
            <Link to="/tasks" className="dashboard__card-link">
              View all <MdArrowForward size={14} />
            </Link>
          </div>
          {!recentTasks || recentTasks.length === 0 ? (
            <div className="dashboard__empty">
              <p>No tasks yet.</p>
              <Link to="/tasks" className="btn btn--primary btn--sm">
                Create Task
              </Link>
            </div>
          ) : (
            <ul className="recent-list">
              {recentTasks.map((task) => (
                <li key={task._id} className="recent-list__item">
                  <div className="recent-list__info">
                    <p className={`recent-list__title ${task.status === "done" ? "recent-list__title--done" : ""}`}>
                      {task.title}
                    </p>
                    <p className="recent-list__sub">
                      <MdFolder size={11} /> {task.project?.title || "No project"}
                    </p>
                  </div>
                  <div className="recent-list__badges">
                    <span className={`badge badge--priority-${task.priority}`}>
                      {task.priority}
                    </span>
                    <span className={`badge badge--status-${task.status}`}>
                      {task.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Projects */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-header-left">
              <MdFolder size={18} className="dashboard__card-icon" />
              <h3 className="dashboard__card-title">Recent Projects</h3>
            </div>
            <Link to="/projects" className="dashboard__card-link">
              View all <MdArrowForward size={14} />
            </Link>
          </div>
          {!recentProjects || recentProjects.length === 0 ? (
            <div className="dashboard__empty">
              <p>No projects yet.</p>
              <Link to="/projects" className="btn btn--primary btn--sm">
                Create Project
              </Link>
            </div>
          ) : (
            <ul className="recent-list">
              {recentProjects.map((project) => (
                <li key={project._id} className="recent-list__item">
                  <div className="recent-list__info">
                    <p className="recent-list__title">{project.title}</p>
                    <p className="recent-list__sub">
                      <MdPerson size={11} /> {project.createdBy?.name || "Unknown"}
                      {project.deadline && (
                        <> · Due {new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>
                      )}
                    </p>
                  </div>
                  <span className={`badge badge--status-${project.status}`}>
                    {project.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      </div>
    </PageTransition>
  );
};

export default Dashboard;
