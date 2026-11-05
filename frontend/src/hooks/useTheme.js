import { useContext } from "react";
import { ThemeContext } from "../contexts/themeContext";

// Custom hook: components call useTheme() to get { theme, toggleTheme }
export default function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return context;
}