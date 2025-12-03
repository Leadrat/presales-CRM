"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";
import { getThemePreference, setThemePreference, type ThemePreference } from "@/lib/api/themePreferenceClient";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function shouldUseBackendForTheme() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  // Avoid calling the protected API from auth pages to prevent redirect loops
  if (path.startsWith("/login") || path.startsWith("/signup")) return false;
  return true;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const resolveTheme = async () => {
      let backendTheme: ThemePreference | null = null;

      if (shouldUseBackendForTheme()) {
        backendTheme = await getThemePreference();
      }

      const storedTheme = (window.localStorage.getItem("theme") as Theme | null) ?? null;
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

      const finalTheme: Theme = (backendTheme as Theme | null) ?? storedTheme ?? (prefersDark ? "dark" : "light");

      if (!cancelled) {
        setTheme(finalTheme);
        setIsInitialized(true);
        applyThemeClass(finalTheme);
        window.localStorage.setItem("theme", finalTheme);
      }
    };

    resolveTheme();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
    applyThemeClass(theme);

    if (shouldUseBackendForTheme()) {
      // Best-effort sync to backend; errors are ignored so UX remains smooth.
      void setThemePreference(theme);
    }
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
