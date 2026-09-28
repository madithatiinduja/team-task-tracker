import { motion } from "framer-motion";
import { pageVariants, containerVariants, itemVariants } from "../../animations/variants";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * FRAMER MOTION EXPLAINED
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * WHAT IT DOES:
 *   Framer Motion is a React animation library that makes it easy to create
 *   smooth animations. It replaces HTML elements with "motion" versions:
 *     <div>    →  <motion.div>
 *     <button> →  <motion.button>
 * 
 * HOW TO USE:
 *   You pass animation properties to motion elements:
 *   
 *     <motion.div
 *       initial={{ opacity: 0, y: 20 }}     ← starting state before animation
 *       animate={{ opacity: 1, y: 0 }}      ← target state after animation
 *       exit={{ opacity: 0, y: -20 }}       ← state when unmounting
 *       transition={{ duration: 0.3 }}      ← animation timing
 *     />
 * 
 * KEY CONCEPTS:
 * 
 *   1. VARIANTS:
 *      Instead of inline objects, you define named states for reusability:
 *        hidden:  { opacity: 0, y: 20 }     ← initial state
 *        visible: { opacity: 1, y: 0 }      ← animated state
 *        exit:    { opacity: 0, y: -20 }    ← exit state
 *      
 *      Then use them:
 *        <motion.div variants={myVariant} initial="hidden" animate="visible" />
 * 
 *   2. ANIMATEPRESENCE:
 *      React removes components from the DOM instantly. AnimatePresence
 *      intercepts this and lets the "exit" animation play first.
 *      
 *      WITHOUT AnimatePresence: component vanishes instantly
 *      WITH AnimatePresence:    component animates out, THEN unmounts
 *      
 *      Used in App.js to wrap Routes:
 *        <AnimatePresence mode="wait">
 *          <Routes key={location.pathname} />
 *        </AnimatePresence>
 *      
 *      mode="wait" means: finish exit animation → then start enter animation
 * 
 *   3. ROUTE TRANSITIONS:
 *      The flow when navigating:
 *        1. User clicks link → URL changes
 *        2. location.pathname changes → Routes key changes
 *        3. Old page component starts "exit" animation
 *        4. AnimatePresence waits for exit to finish
 *        5. Old component unmounts
 *        6. New component mounts with "initial" state
 *        7. New component animates from "initial" to "animate"
 * 
 *   4. STAGGERING:
 *      Animate multiple children one-after-another with delays:
 *        <motion.div variants={containerVariants.stagger} initial="hidden" animate="visible">
 *          {items.map(item => (
 *            <motion.div key={item} variants={itemVariants.fadeSlideUp}>
 *              {item}
 *            </motion.div>
 *          ))}
 *        </motion.div>
 * 
 *   5. HOVER EFFECTS:
 *      Use whileHover for interactive feedback:
 *        <motion.div whileHover={{ scale: 1.05, y: -4 }} />
 * 
 * ═════════════════════════════════════════════════════════════════════════════
 */

/**
 * PageTransition Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Wrap any page component to add fade + slide animation on mount/unmount.
 * Used at the top level of each page.
 * 
 * USAGE:
 *   import PageTransition from "../components/common/PageTransition";
 *   const Dashboard = () => wrap page content with PageTransition
 *   Pass variant prop: "fadeSlideUp", "fadeIn", "slideInRight", etc.
 *   Component automatically animates on mount/unmount.
 * 
 * VARIANTS AVAILABLE:
 *   "fadeSlideUp"  — fade in + slide up (default, modern)
 *   "fadeIn"       — simple fade (minimal)
 *   "slideInRight" — slide in from right (sidebar style)
 *   "slideInLeft"  — slide in from left
 *   "scaleUp"      — grows from small to full size
 */
const PageTransition = ({ children, variant = "fadeSlideUp" }) => {
  const variants = pageVariants;

  return (
    <motion.div
      variants={variants[variant]}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerContainer Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps multiple child elements to stagger their animations.
 * Each child animates one-after-another with a delay between them.
 * 
 * USAGE:
 *   <StaggerContainer variant="stagger">
 *     {tasks.map(task => (
 *       <motion.div key={task.id} variants={itemVariants.fadeSlideUp}>
 *         <TaskCard task={task} />
 *       </motion.div>
 *     ))}
 *   </StaggerContainer>
 * 
 * VARIANTS AVAILABLE:
 *   "stagger"     — standard stagger (80ms between children)
 *   "staggerSlow" — slower stagger (120ms between children)
 *   "staggerFast" — faster stagger (40ms between children)
 */
export const StaggerContainer = ({ children, variant = "stagger" }) => {
  return (
    <motion.div
      variants={containerVariants[variant]}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerItem Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Individual item inside a StaggerContainer.
 * Automatically inherits stagger timing from parent.
 * 
 * USAGE:
 *   <StaggerContainer>
 *     {tasks.map(task => (
 *       <StaggerItem key={task.id}>
 *         <TaskCard task={task} />
 *       </StaggerItem>
 *     ))}
 *   </StaggerContainer>
 * 
 * VARIANTS AVAILABLE:
 *   "fadeIn"        — simple fade
 *   "fadeSlideUp"   — fade + slide up
 *   "fadeSlideLeft" — fade + slide left
 */
export const StaggerItem = ({ children, variant = "fadeSlideUp" }) => {
  return (
    <motion.div variants={itemVariants[variant]}>
      {children}
    </motion.div>
  );
};

export default PageTransition;
