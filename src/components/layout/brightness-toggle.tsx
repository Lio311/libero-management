"use client";

import { Sun, Moon } from "lucide-react";
import { useBrightness } from "@/context/brightness-context";

export function BrightnessToggle() {
  const { toggle, isLight } = useBrightness();

  return (
    <button
      onClick={toggle}
      className={`
        p-2 rounded-xl transition-all duration-300 hover-scale shrink-0
        ${isLight
          ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
          : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
        }
      `}
      title={isLight ? "עבור לזכוכית כהה" : "עבור לזכוכית בהירה"}
      aria-label={isLight ? "Dark glass mode" : "Light glass mode"}
    >
      {isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
