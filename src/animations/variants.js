/**
 * ═════════════════════════════════════════════════════════════════════════════
 * ANIMATION VARIANTS
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Reusable Framer Motion animation definitions for consistent animations across
 * the entire app. Each variant defines three states:
 *   • hidden  — initial state before animation
 *   • visible — target state after animation
 *   • exit    — state when component unmounts (used with AnimatePresence)
 * 
 * IMPORT USAGE:
 *   import { pageVariants, cardHoverVariants } from "../animations/variants";
 *   
 *   <motion.div variants={pageVariants.fadeSlideUp} initial="hidden" animate="visible" exit="exit">
 *     Content
 *   </motion.div>
 * 
 * ═════════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ANIMATIONS — for route transitions
// ─────────────────────────────────────────────────────────────────────────────

export const pageVariants = {
  // Fade + Slide Up: default page transition (modern, subtle)
  fadeSlideUp: {
    hidden: {
      opacity: 0,
      y: 24,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -16,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  },

  // Fade In: simple fade (minimal)
  fadeIn: {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  },

  // Slide In Right: for sidebar navigation
  slideInRight: {
    hidden: {
      opacity: 0,
      x: 40,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      x: -40,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  },

  // Slide In Left: alternative direction
  slideInLeft: {
    hidden: {
      opacity: 0,
      x: -40,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      x: 40,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  },

  // Scale Up: grows from small to full size
  scaleUp: {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CARD ANIMATIONS — for list items and cards
// ─────────────────────────────────────────────────────────────────────────────

export const cardVariants = {
  // Card fade in with slight scale
  fadeInScale: {
    hidden: {
      opacity: 0,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: "easeOut",
      },
    },
  },

  // Card fade in from bottom
  fadeInUp: {
    hidden: {
      opacity: 0,
      y: 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: "easeOut",
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CARD HOVER ANIMATIONS — for interactive feedback
// ─────────────────────────────────────────────────────────────────────────────

export const cardHoverVariants = {
  // Lift up on hover (shadow + translate)
  liftUp: {
    initial: {
      y: 0,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
    },
    hover: {
      y: -4,
      boxShadow: "0 12px 20px rgba(0, 0, 0, 0.12)",
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  },

  // Scale on hover
  scaleHover: {
    initial: {
      scale: 1,
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  },

  // Glow on hover (using shadow)
  glow: {
    initial: {
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
    },
    hover: {
      boxShadow: "0 8px 12px rgba(16, 185, 129, 0.15)",
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  },

  // Combined: lift + scale + glow
  interactive: {
    initial: {
      y: 0,
      scale: 1,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
    },
    hover: {
      y: -4,
      scale: 1.01,
      boxShadow: "0 12px 20px rgba(16, 185, 129, 0.12)",
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER ANIMATIONS — for staggering children
// ─────────────────────────────────────────────────────────────────────────────

export const containerVariants = {
  // Stagger children animations
  stagger: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,    // 80ms delay between each child
        delayChildren: 0.1,        // delay before first child starts
      },
    },
  },

  // Stagger with slower delays (for more dramatic effect)
  staggerSlow: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15,
      },
    },
  },

  // Stagger with fast delays (for snappy feel)
  staggerFast: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05,
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ITEM ANIMATIONS — for staggered children
// ─────────────────────────────────────────────────────────────────────────────

export const itemVariants = {
  // Fade in
  fadeIn: {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.25,
      },
    },
  },

  // Fade + slide up
  fadeSlideUp: {
    hidden: {
      opacity: 0,
      y: 12,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: "easeOut",
      },
    },
  },

  // Fade + slide left
  fadeSlideLeft: {
    hidden: {
      opacity: 0,
      x: 12,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.25,
        ease: "easeOut",
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOADING ANIMATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const loadingVariants = {
  // Pulsing animation (used for skeleton)
  pulse: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },

  // Spinner rotation
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },

  // Scale bounce
  bounce: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DIALOG ANIMATIONS — for modals and confirmations
// ─────────────────────────────────────────────────────────────────────────────

export const dialogVariants = {
  // Backdrop fade
  backdrop: {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.15,
      },
    },
  },

  // Dialog scale + fade
  dialog: {
    hidden: {
      opacity: 0,
      scale: 0.92,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.92,
      transition: {
        duration: 0.15,
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION TIMINGS — for consistent duration across the app
// ─────────────────────────────────────────────────────────────────────────────

export const timings = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  verySlow: 0.5,
};

// ─────────────────────────────────────────────────────────────────────────────
// EASING FUNCTIONS — predefined easing curves
// ─────────────────────────────────────────────────────────────────────────────

export const easing = {
  easeOut: "easeOut",
  easeIn: "easeIn",
  easeInOut: "easeInOut",
  circOut: "circOut",
  backOut: "backOut",
};
