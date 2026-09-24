"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type BrightnessMode = "dark" | "light";

type BrightnessContextType = {
  mode: BrightnessMode;
  toggle: () => void;
  isLight: boolean;
};

const BrightnessContext = createContext<BrightnessContextType | undefined>(undefined);

const STORAGE_KEY = "libero-glass-brightness";

export function BrightnessProvider({ children, isAdmin }: { children: ReactNode; isAdmin: boolean }) {
  const [mode, setMode] = useState<BrightnessMode>("dark");

  // קריאה מ-localStorage בטעינה ראשונה
  useEffect(() => {
    if (!isAdmin) return;
    const stored = localStorage.getItem(STORAGE_KEY) as BrightnessMode | null;
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    }
  }, [isAdmin]);

  // סנכרון class על body
  useEffect(() => {
    if (!isAdmin) {
      document.body.classList.remove("light-glass");
      return;
    }
    if (mode === "light") {
      document.body.classList.add("light-glass");
    } else {
      document.body.classList.remove("light-glass");
    }
  }, [mode, isAdmin]);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <BrightnessContext.Provider value={{ mode, toggle, isLight: mode === "light" }}>
      {children}
    </BrightnessContext.Provider>
  );
}

export function useBrightness() {
  const context = useContext(BrightnessContext);
  if (!context) {
    throw new Error("useBrightness must be used within BrightnessProvider");
  }
  return context;
}
