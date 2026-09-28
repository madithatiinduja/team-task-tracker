import { motion } from "framer-motion";
import { loadingVariants } from "../../animations/variants";

/**
 * LoadingSpinner Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Animated spinner for loading states with multiple animation styles.
 * 
 * USAGE:
 *   <LoadingSpinner />
 *   <LoadingSpinner variant="bounce" size="lg" />
 * 
 * PROPS:
 *   variant — animation type: "spin" (default), "bounce", "pulse"
 *   size    — "sm", "md" (default), "lg"
 *   color   — hex color or CSS color (default: #10b981 - emerald)
 *   message — optional text below spinner
 */
const LoadingSpinner = ({
  variant = "spin",
  size = "md",
  color = "#10b981",
  message = "",
}) => {
  const sizes = {
    sm: { width: 24, height: 24 },
    md: { width: 40, height: 40 },
    lg: { width: 56, height: 56 },
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
      }}
    >
      {variant === "spin" && (
        <motion.div
          animate={loadingVariants.spin}
          style={{
            ...sizes[size],
            borderRadius: "50%",
            border: `3px solid ${color}33`,
            borderTop: `3px solid ${color}`,
          }}
        />
      )}

      {variant === "bounce" && (
        <motion.div
          animate={loadingVariants.bounce}
          style={{
            ...sizes[size],
            borderRadius: "50%",
            backgroundColor: color,
          }}
        />
      )}

      {variant === "pulse" && (
        <motion.div
          animate={loadingVariants.pulse}
          style={{
            ...sizes[size],
            borderRadius: "50%",
            backgroundColor: color,
          }}
        />
      )}

      {message && (
        <p
          style={{
            margin: 0,
            color: "#6b7280",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
