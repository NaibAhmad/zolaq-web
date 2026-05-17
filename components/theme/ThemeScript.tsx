"use client";

import { useEffect } from "react";

const STORAGE_KEY = "zlq.theme";

type Theme = "light" | "dark";

function resolveInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable; fall through to system preference.
  }
  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export function ThemeScript() {
  useEffect(() => {
    const theme = resolveInitialTheme();
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, []);
  return null;
}
