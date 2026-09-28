import { useState } from "react";
import { motion } from "framer-motion";
import {
  MdFolder,
  MdEdit,
  MdDelete,
  MdCalendarToday,
  MdPerson,
  MdGroup,
  MdCheckCircle,
} from "react-icons/md";
import "../../styles/Projects.css";

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT CARD — Displays one project's info
// ─────────────────────────────────────────────────────────────────────────────
// Props:
//   project  — the project object from the API
//   onEdit   — function(project) called when Edit is clicked
//   onDelete — function(projectId) called after successful delete
//   isOwner  — boolean, shows edit/delete buttons only to the owner
// ─────────────────────────────────────────────────────────────────────────────

// ── Helper: is the deadline overdue? ─────────────────────────────────────────
const isOverdue = (deadline, status) => {
  if (!deadline || status === "completed") return false;
  return new Date(deadline) < new Date();
};

// ── Helper: days until deadline ──────────────────────────────────────────────
const getDaysUntil = (deadline) => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const ProjectCard = ({ project, onEdit, onDelete, isOwner }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const overdue  = isOverdue(project.deadline, project.status);
  const daysLeft = getDaysUntil(project.deadline);

  // ── Deadline display text ─────────────────────────────────────────────────
  const deadlineText = () => {
    if (!project.deadline) return null;
    if (overdue) return `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""}`;
    if (daysLeft === 0) return "Due today";
    if (daysLeft === 1) return "Due tomorrow";
    if (daysLeft <= 7)  return `Due in ${daysLeft} days`;
    return `Due ${new Date(project.deadline).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    })}`;
  };

  return (
    <motion.div
      className={`project-card ${overdue ? "project-card--overdue" : ""}`}
      whileHover={{ y: -4, boxShadow: "0 12px 20px rgba(0, 0, 0, 0.12)" }}
      transition={{ duration: 0.2 }}
    >

      {/* ── Top Row: Icon + Status Badge + Menu ──────────────────────── */}
      <div className="project-card__header">
        <div className="project-card__icon-wrap">
          <div className="project-card__icon">
            <MdFolder size={22} />
          </div>
        </div>

        <div className="project-card__header-right">
          <span className={`badge badge--status-${project.status}`}>
            {project.status}
          </span>

          {/* 3-dot menu — only shown to project owner */}
          {isOwner && (
            <div className="project-card__menu">
              <button
                className="project-card__menu-btn"
                onClick={() => setMenuOpen((p) => !p)}
                aria-label="Project options"
                aria-expanded={menuOpen}
              >
                ⋮
              </button>

              {menuOpen && (
                <>
                  {/* Invisible overlay to close menu on outside click */}
                  <div
                    className="project-card__menu-overlay"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="project-card__dropdown">
                    <button
                      className="project-card__dropdown-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(project);
                      }}
                    >
                      <MdEdit size={16} />
                      Edit Project
                    </button>
                    <button
                      className="project-card__dropdown-item project-card__dropdown-item--danger"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(project);
                      }}
                    >
                      <MdDelete size={16} />
                      Delete Project
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Title + Description ───────────────────────────────────────── */}
      <div className="project-card__body">
        <h3 className="project-card__title">{project.title}</h3>
        <p className="project-card__desc">
          {project.description || "No description provided."}
        </p>
      </div>

      {/* ── Stats Row: Members + Tasks ────────────────────────────────── */}
      <div className="project-card__stats">
        <div className="project-card__stat">
          <MdGroup size={14} />
          <span>
            {(project.members?.length || 0) + 1} member
            {(project.members?.length || 0) + 1 !== 1 ? "s" : ""}
          </span>
        </div>
        {project.taskCount !== undefined && (
          <div className="project-card__stat">
            <MdCheckCircle size={14} />
            <span>
              {project.completedTaskCount || 0}/{project.taskCount} tasks
            </span>
          </div>
        )}
      </div>

      {/* ── Footer: Owner + Deadline ──────────────────────────────────── */}
      <div className="project-card__footer">
        <div className="project-card__owner">
          <MdPerson size={13} />
          <span>{project.createdBy?.name || "Unknown"}</span>
        </div>

        {project.deadline && (
          <div className={`project-card__deadline ${overdue ? "project-card__deadline--overdue" : daysLeft <= 7 ? "project-card__deadline--soon" : ""}`}>
            <MdCalendarToday size={12} />
            <span>{deadlineText()}</span>
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default ProjectCard;
