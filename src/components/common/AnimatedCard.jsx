import { motion } from "framer-motion";
import { cardVariants, cardHoverVariants } from "../../animations/variants";

/**
 * AnimatedCard Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps any card/list item to add entrance animation and hover effects.
 * 
 * USAGE:
 *   <AnimatedCard hoverEffect="liftUp">
 *     <ProjectCard project={project} />
 *   </AnimatedCard>
 * 
 * PROPS:
 *   children       — content to wrap
 *   cardVariant    — entrance animation:
 *                    "fadeInScale" (default), "fadeInUp"
 *   hoverEffect    — hover animation:
 *                    "liftUp" (lift + shadow), "scaleHover" (scale),
 *                    "glow" (glow effect), "interactive" (all combined)
 *   index          — optional, for staggered lists (adds delay)
 *   className      — optional CSS class
 * 
 * EXAMPLE WITH STAGGERED LIST:
 *   {tasks.map((task, index) => (
 *     <AnimatedCard key={task.id} cardVariant="fadeInUp" hoverEffect="liftUp" index={index}>
 *       <TaskCard task={task} />
 *     </AnimatedCard>
 *   ))}
 */
const AnimatedCard = ({
  children,
  cardVariant = "fadeInScale",
  hoverEffect = "liftUp",
  index = 0,
  className = "",
}) => {
  const hoverConfig = cardHoverVariants[hoverEffect];

  return (
    <motion.div
      variants={cardVariants[cardVariant]}
      initial="hidden"
      animate="visible"
      transition={{
        delay: index * 0.05, // stagger by 50ms per item
      }}
      whileHover={hoverConfig.hover}
      className={className}
      style={{
        ...hoverConfig.initial,
        borderRadius: "8px",
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
