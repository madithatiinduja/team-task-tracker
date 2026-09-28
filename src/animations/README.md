# Framer Motion Animation Guide

## 📌 Overview

This document explains the animation system implemented in the Team Task Tracker using **Framer Motion** — a modern animation library for React.

---

## 🎬 What is Framer Motion?

Framer Motion is a React animation library that makes it simple to create smooth, interactive animations. It works by replacing HTML elements with "motion" versions that understand animation props.

### Before Framer Motion (Manual CSS):
```jsx
// Requires manual CSS classes and complex state management
<div className={isAnimating ? 'fade-in' : 'fade-out'}>
  Content
</div>
```

### With Framer Motion (Simple & Declarative):
```jsx
// Animation is part of the component
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  Content
</motion.div>
```

---

## 🔑 Key Concepts

### 1. **Motion Elements**
Replace normal HTML elements with motion versions:
```jsx
<div>           → <motion.div>
<button>        → <motion.button>
<span>          → <motion.span>
```

### 2. **Animation States**
Each animation has three states:

- **`initial`** — Starting state before animation begins
- **`animate`** — Target state where animation ends
- **`exit`** — State when component unmounts (requires AnimatePresence)

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}    // Starts invisible, 20px below
  animate={{ opacity: 1, y: 0 }}     // Fades in, moves to normal position
  exit={{ opacity: 0, y: -20 }}      // Fades out, moves 20px up
  transition={{ duration: 0.3 }}     // Takes 0.3 seconds
/>
```

### 3. **Variants**
Named animation states for reusability — instead of inline objects:

```jsx
// Define variants (animation blueprints)
const pageVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.2 } },
};

// Use variants in components
<motion.div
  variants={pageVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
/>
```

### 4. **Transitions**
Control how animations move over time:

```jsx
transition={{
  duration: 0.3,        // How long (in seconds)
  delay: 0.1,           // Wait before starting
  ease: "easeOut",      // Easing function (easeIn, easeInOut, circOut, backOut)
  repeat: Infinity,     // Repeat forever
  repeatType: "mirror", // or "reverse", "loop"
}}
```

### 5. **AnimatePresence**
Intercepts component unmounting to play exit animations:

```jsx
import { AnimatePresence } from "framer-motion";

// WITHOUT AnimatePresence: component vanishes instantly (no exit animation)
<Routes>
  <Route path="/" element={<Home />} />
</Routes>

// WITH AnimatePresence: component animates out THEN unmounts
<AnimatePresence mode="wait">
  <Routes key={location.pathname}>
    <Route path="/" element={<Home />} />
  </Routes>
</AnimatePresence>
```

**Why `key={location.pathname}`?**
- When URL changes, React sees a new key
- Old component is considered "removed" → AnimatePresence plays exit animation
- Then old component unmounts and new component mounts

**What does `mode="wait"`?**
- `mode="wait"`: Exit animation finishes FIRST, then enter animation starts
- Default: Both animations play simultaneously

---

## 🎨 How Route Transitions Work

### Flow Diagram:
```
1. User clicks link
        ↓
2. URL changes → location.pathname changes
        ↓
3. React Routes key changes (because key={location.pathname})
        ↓
4. Old page detected as "leaving" → AnimatePresence intercepts
        ↓
5. Old page plays exit animation (0.2s fade out)
        ↓
6. Old page unmounts from DOM
        ↓
7. New page mounts with initial state (invisible/below)
        ↓
8. New page plays enter animation (0.35s fade in + slide up)
        ↓
9. Animation complete ✓
```

### Code Example in App.js:
```jsx
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import PageTransition from "./components/common/PageTransition";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    // mode="wait" ensures old page finishes exiting before new enters
    <AnimatePresence mode="wait">
      {/* key={location.pathname} triggers animation on URL change */}
      <Routes location={location} key={location.pathname}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} />
      </Routes>
    </AnimatePresence>
  );
};
```

---

## 🎯 Available Animations

### **Page Transitions** (in `/animations/variants.js`)

Used to wrap entire pages for smooth enter/exit when navigating.

```jsx
import { pageVariants } from "../animations/variants";
import PageTransition from "../components/common/PageTransition";

// Fade + Slide Up (default, modern)
<PageTransition variant="fadeSlideUp">
  <Dashboard />
</PageTransition>

// Simple fade (minimal)
<PageTransition variant="fadeIn">
  <Login />
</PageTransition>

// Slide from right (sidebar style)
<PageTransition variant="slideInRight">
  <Settings />
</PageTransition>

// Grow from small to full size
<PageTransition variant="scaleUp">
  <Profile />
</PageTransition>
```

**All page components already use:**
- **Dashboard**: `fadeSlideUp` ✓
- **Projects**: `fadeSlideUp` ✓
- **Tasks**: `fadeSlideUp` ✓
- **Login**: `fadeIn` ✓
- **Signup**: `fadeIn` ✓

---

### **Card Hover Animations**

Cards lift up and add shadow on hover for interactive feedback.

```jsx
// ProjectCard & TaskCard automatically animate on hover:
// - Lifts 4px higher (y: -4)
// - Shadow intensifies
// - Duration: 0.2s
```

**Code in components:**
```jsx
import { motion } from "framer-motion";

<motion.div
  whileHover={{
    y: -4,
    boxShadow: "0 12px 20px rgba(0, 0, 0, 0.12)"
  }}
  transition={{ duration: 0.2 }}
>
  {/* Card content */}
</motion.div>
```

---

### **Staggered List Animations**

Children animate one-after-another with delays:

```jsx
import { StaggerContainer, StaggerItem } from "../components/common/PageTransition";

// Container handles stagger timing
<StaggerContainer variant="stagger">
  {tasks.map(task => (
    <StaggerItem key={task.id} variant="fadeSlideUp">
      <TaskCard task={task} />
    </StaggerItem>
  ))}
</StaggerContainer>
```

**Available stagger variants:**
- `stagger` (80ms between children) — standard
- `staggerSlow` (120ms) — more dramatic
- `staggerFast` (40ms) — snappy

---

### **Loading Spinner**

Animated loading indicator with multiple styles:

```jsx
import LoadingSpinner from "../components/common/LoadingSpinner";

// Spin animation (default)
<LoadingSpinner />

// Bounce animation
<LoadingSpinner variant="bounce" size="lg" />

// Pulse animation
<LoadingSpinner variant="pulse" color="#10b981" message="Loading..." />
```

**Props:**
```jsx
<LoadingSpinner
  variant="spin"          // "spin", "bounce", "pulse"
  size="md"               // "sm", "md", "lg"
  color="#10b981"         // hex or CSS color
  message="Loading..."    // optional text below spinner
/>
```

---

### **AnimatedCard Component**

Reusable card wrapper with entrance animation + hover effects:

```jsx
import AnimatedCard from "../components/common/AnimatedCard";

{tasks.map((task, index) => (
  <AnimatedCard
    key={task.id}
    cardVariant="fadeInUp"      // entrance animation
    hoverEffect="liftUp"         // hover animation
    index={index}                // for staggered delay (index * 50ms)
  >
    <TaskCard task={task} />
  </AnimatedCard>
))}
```

**cardVariant options:**
- `fadeInScale` — fade in + slight scale up
- `fadeInUp` — fade in while sliding up

**hoverEffect options:**
- `liftUp` — lift up + shadow (most common)
- `scaleHover` — grow slightly
- `glow` — add shadow glow
- `interactive` — all combined (lift + scale + glow)

---

## 🛠️ Usage Examples

### Example 1: Page with Staggered List

```jsx
import { StaggerContainer, StaggerItem } from "../components/common/PageTransition";
import PageTransition from "../components/common/PageTransition";
import { itemVariants } from "../animations/variants";

export default function Projects() {
  const [projects, setProjects] = useState([]);

  return (
    <PageTransition variant="fadeSlideUp">
      <h1>Projects</h1>
      
      <StaggerContainer variant="stagger">
        {projects.map((project, index) => (
          <StaggerItem key={project.id} variant="fadeSlideUp">
            <ProjectCard project={project} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </PageTransition>
  );
}
```

### Example 2: Custom Animation

```jsx
import { motion } from "framer-motion";
import { pageVariants } from "../animations/variants";

export default function CustomPage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <h1>Custom Animation</h1>
    </motion.div>
  );
}
```

### Example 3: Hover + Tap Effects

```jsx
import { motion } from "framer-motion";

<motion.button
  whileHover={{ scale: 1.05 }}           // Hover
  whileTap={{ scale: 0.98 }}              // Click
  transition={{ type: "spring", stiffness: 300 }}
>
  Click Me
</motion.button>
```

---

## 🎬 Animation Timing Reference

From `animations/variants.js`:

```jsx
export const timings = {
  fast:      0.15,    // Quick (150ms)
  normal:    0.25,    // Standard (250ms)
  slow:      0.35,    // Leisurely (350ms)
  verySlow:  0.5,     // Dramatic (500ms)
};

export const easing = {
  easeOut:   "easeOut",    // Fast start, slow end
  easeIn:    "easeIn",     // Slow start, fast end
  easeInOut: "easeInOut",  // Smooth both ends
  circOut:   "circOut",    // More dramatic easeOut
  backOut:   "backOut",    // Overshoot then settle
};
```

---

## 📁 File Structure

```
frontend/src/
├── animations/
│   └── variants.js           ← All animation definitions
│
├── components/
│   ├── common/
│   │   ├── PageTransition.jsx    ← Page enter/exit wrapper
│   │   ├── AnimatedCard.jsx      ← Card with hover animation
│   │   └── LoadingSpinner.jsx    ← Loading indicator
│   │
│   ├── projects/
│   │   └── ProjectCard.jsx       ← Has whileHover animation
│   │
│   └── tasks/
│       └── TaskCard.jsx          ← Has whileHover animation
│
├── pages/
│   ├── Dashboard.jsx      ← Wrapped with PageTransition ✓
│   ├── Projects.jsx       ← Wrapped with PageTransition ✓
│   ├── Tasks.jsx          ← Wrapped with PageTransition ✓
│   ├── Login.jsx          ← Wrapped with PageTransition ✓
│   └── Signup.jsx         ← Wrapped with PageTransition ✓
│
└── App.js                 ← Has AnimatePresence + route key
```

---

## 🚀 Performance Tips

1. **Use `motion.div` sparingly** — Only animate when needed
2. **Stagger wisely** — Too many staggered items can feel slow
3. **Avoid expensive computations in exit** — Animations must complete
4. **Test on mobile** — Reduce animation duration on slow devices

```jsx
// Example: Shorter animations on mobile
const duration = window.innerWidth < 768 ? 0.2 : 0.35;

<motion.div
  transition={{ duration }}
/>
```

---

## ✨ What's Animated

### ✅ Already Animated:
- ✓ Page transitions (Dashboard, Projects, Tasks, Login, Signup)
- ✓ Card hover effects (ProjectCard, TaskCard)
- ✓ Loading spinners
- ✓ Route changes with AnimatePresence

### 🔄 Optional Enhancements:
- Form inputs focus animation
- Button click ripple effect
- Modal open/close animation
- Confirmation dialog animation
- Toast notification animation

---

## 📚 Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Variants Guide](https://www.framer.com/motion/animation/)
- [AnimatePresence](https://www.framer.com/motion/animate-presence/)
- [Gesture Animations](https://www.framer.com/motion/gestures/)

---

## 🎓 Learning Path

1. **Understand the basics**: Read "What is Framer Motion?" section ↑
2. **Study AnimatePresence**: Read "How Route Transitions Work" ↑
3. **Try the examples**: Use examples in "Usage Examples" ↑
4. **Customize animations**: Modify values in `animations/variants.js`
5. **Add new animations**: Create new variants and use them

---

## 💡 Quick Reference

### Common Props:

```jsx
<motion.div
  // State
  initial={{ opacity: 0 }}          // Starting state
  animate={{ opacity: 1 }}          // Target state
  exit={{ opacity: 0 }}             // Unmount state
  
  // Interaction
  whileHover={{ scale: 1.05 }}      // On mouse hover
  whileTap={{ scale: 0.98 }}        // On click
  
  // Timing
  transition={{
    duration: 0.3,                  // Seconds
    delay: 0.1,                     // Wait before start
    ease: "easeOut",                // Easing curve
  }}
  
  // Variants
  variants={myVariants}             // Named animations
  initial="hidden"                  // Use variant state
  animate="visible"
  exit="exit"
/>
```

---

**Happy Animating! 🎨✨**
