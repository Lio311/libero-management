"use client";

import { useState } from "react";
import { Loader2, Printer, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";

interface CreateLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateLabelModal({ isOpen, onClose }: CreateLabelModalProps) {
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copies, setCopies] = useState(1);

  if (!isOpen) return null;

  const generatePDF = async () => {
    if (!line1.trim() && !line2.trim()) {
      toast.error("יש להזין לפחות שורה אחת");
      return;
    }

    setIsGenerating(true);
    try {
      const data = {
        line1: line1.trim() || line2.trim(),
        line2: line1.trim() ? line2.trim() : "",
        copies: copies
      };
      
      const b64Data = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      const orderIdStr = `custom:${b64Data}`;

      const res = await fetch("/api/remote-print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          store: "libero", 
          orderIds: [orderIdStr],
          jobType: 'mini-perfume'
        })
      });

      if (res.ok) {
        toast.success("פקודת ההדפסה נשלחה בהצלחה למחשב!");
        setLine1("");
        setLine2("");
        setCopies(1);
        onClose();
      } else {
        toast.error("שגיאה בשליחת פקודת הדפסה");
      }
    } catch (e) {
      console.error(e);
      toast.error("אירעה שגיאה בשליחת הבקשה");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">יצירת מדבקה מותאמת אישית</h2>
            <p className="text-sm text-gray-500 mt-1">הזן טקסט והדפס מדבקה באופן מיידי</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">שורה 1</label>
              <Input
                placeholder="הזן טקסט לשורה הראשונה..."
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                maxLength={40}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">שורה 2 (אופציונלי)</label>
              <Input
                placeholder="הזן טקסט לשורה השנייה..."
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                maxLength={40}
              />
            </div>

            <div className="space-y-2 flex flex-col pt-2">
              <label className="text-sm font-medium">כמות להדפסה</label>
              <div className="flex gap-4">
                <Button 
                  variant={copies === 1 ? "default" : "outline"}
                  onClick={() => setCopies(1)}
                  className="flex-1"
                >
                  עותק 1
                </Button>
                <Button 
                  variant={copies === 2 ? "default" : "outline"}
                  onClick={() => setCopies(2)}
                  className="flex-1"
                >
                  2 עותקים (שורה מלאה)
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 border rounded-lg p-4 bg-gray-50 flex items-center justify-center min-h-[150px]">
            <div 
              className="bg-white border-2 border-dashed border-gray-300 shadow-sm rounded flex flex-col items-center justify-center text-center px-4 relative overflow-hidden"
              style={{ width: "250px", height: "121px" }}
            >
              <div className="w-full break-words">
                <span className="block font-bold text-xl text-black" style={{ direction: 'rtl' }}>
                  {line1 || "שורה 1"}
                </span>
                {line2 && (
                  <span className="block font-bold text-lg text-black mt-1" style={{ direction: /^[a-zA-Z0-9\s.,!?-]+$/.test(line2) ? 'ltr' : 'rtl' }}>
                    {line2}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            ביטול
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isGenerating || (!line1.trim() && !line2.trim())}
            className="flex-1 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Printer className="w-4 h-4 ml-2" />}
            {isGenerating ? "מייצר מדבקה..." : "הדפס מדבקה"}
          </Button>
        </div>
      </div>
    </div>
  );
}
