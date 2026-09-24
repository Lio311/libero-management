"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { toggleGlassThemeAction } from "@/app/actions/settings";

type BrightnessMode = "dark" | "light";

type BrightnessContextType = {
  mode: BrightnessMode;
  toggle: () => void;
  isLight: boolean;
};

const BrightnessContext = createContext<BrightnessContextType | undefined>(undefined);

export function BrightnessProvider({ 
  children, 
  isAdmin,
  initialTheme
}: { 
  children: ReactNode; 
  isAdmin: boolean;
  initialTheme: BrightnessMode;
}) {
  const [mode, setMode] = useState<BrightnessMode>(initialTheme);

  // סנכרון למקרה שההגדרה התעדכנה בשרת ונדחפה ללקוח
  useEffect(() => {
    setMode(initialTheme);
  }, [initialTheme]);

  // סנכרון ה-class על ה-body עכשיו פועל לכל המשתמשים
  useEffect(() => {
    if (mode === "light") {
      document.body.classList.add("light-glass");
    } else {
      document.body.classList.remove("light-glass");
    }
  }, [mode]);

  const toggle = useCallback(async () => {
    if (!isAdmin) return;
    
    const next = mode === "dark" ? "light" : "dark";
    setMode(next); // Optimistic UI update
    
    try {
      await toggleGlassThemeAction(next);
    } catch (e) {
      console.error("Failed to save theme to DB", e);
      setMode(mode); // Rollback on error
    }
  }, [mode, isAdmin]);

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
