"use client";

import { useEffect, useState } from "react";

const THEME_MODE_KEY = "21st_theme_mode";

export const getStoredDarkMode = () => {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(THEME_MODE_KEY) !== "light";
};

export const setStoredDarkMode = (isDarkMode: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_MODE_KEY, isDarkMode ? "dark" : "light");
  window.dispatchEvent(new Event("theme-mode-change"));
};

export const useStoredThemeMode = () => {
  const [isDarkMode, setIsDarkModeState] = useState(true);

  useEffect(() => {
    const syncThemeMode = () => setIsDarkModeState(getStoredDarkMode());
    syncThemeMode();
    window.addEventListener("storage", syncThemeMode);
    window.addEventListener("theme-mode-change", syncThemeMode);
    return () => {
      window.removeEventListener("storage", syncThemeMode);
      window.removeEventListener("theme-mode-change", syncThemeMode);
    };
  }, []);

  const setIsDarkMode = (nextValue: boolean) => {
    setIsDarkModeState(nextValue);
    setStoredDarkMode(nextValue);
  };

  return [isDarkMode, setIsDarkMode] as const;
};
