"use client";

import { useState } from "react";
import { saveScannerSettings } from "@/app/actions/scanner-actions";
import { toast } from "sonner";
import { X, Plus, Save, Settings } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SettingsClientProps {
  initialKeywords: string[];
}

export default function SettingsClient({ initialKeywords }: SettingsClientProps) {
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [newKeyword, setNewKeyword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newKeyword.trim();
    if (!val) return;
    
    if (keywords.includes(val)) {
      toast.error("מילת המפתח כבר קיימת");
      return;
    }
    
    setKeywords([...keywords, val]);
    setNewKeyword("");
  };

  const handleRemove = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveScannerSettings(keywords);
      toast.success("הגדרות נשמרו בהצלחה");
    } catch (e: any) {
      toast.error(e.message || "שגיאה בשמירת הגדרות");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/shipping-scanner" className="p-2 hover:bg-secondary rounded-full transition-colors">
          <ArrowRight className="w-6 h-6" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            הגדרות סריקה (מנהל)
          </h2>
          <p className="text-muted-foreground mt-1">
            הגדר מילות מפתח בשם המוצר אשר יסמנו את המוצר ככזה שאין לו ברקוד (כמו מיני בושם).
            מוצרים אלו לא ידרשו סריקה אלא יאושרו בלחיצת כפתור V.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-xl space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">מילות מפתח ללא ברקוד</h3>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {keywords.length === 0 ? (
              <span className="text-sm text-muted-foreground">לא הוגדרו מילות מפתח</span>
            ) : (
              keywords.map(kw => (
                <div key={kw} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
                  {kw}
                  <button onClick={() => handleRemove(kw)} className="hover:bg-background/50 rounded-full p-0.5 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              placeholder="לדוגמה: מיני בושם"
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newKeyword.trim()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              הוסף
            </button>
          </form>
        </div>

        <div className="pt-6 border-t border-border flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "שומר..." : "שמור הגדרות"}
          </button>
        </div>
      </div>
    </div>
  );
}
