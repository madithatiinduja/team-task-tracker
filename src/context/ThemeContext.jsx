import { createContext, useContext, useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// THEME CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
// Manages dark/light mode across the entire app.
//
// How it works:
//   1. On load → check localStorage for saved theme
//   2. Apply "dark" class to <html> element
//   3. CSS variables change based on that class
//   4. Toggle button in Navbar calls toggleTheme()
//   5. New preference saved to localStorage
// ─────────────────────────────────────────────────────────────────────────────

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Read saved theme from localStorage, default to "light"
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  // Apply theme class to <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement; // <html> element
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
};
