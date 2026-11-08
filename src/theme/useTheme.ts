import { useLayoutEffect, useState } from "react";

const storageKey = "agent-workspace-theme";
type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The current window can still switch themes when storage is unavailable.
    }
  }

  return { theme, toggleTheme };
}
