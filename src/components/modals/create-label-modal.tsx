"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import { Loader2, Printer, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function renderLabelToDataUrl(label: { line1: string; line2?: string }): string {
  const pixelRatio = 4;
  // 1mm ≈ 3.7795px at 96 DPI
  const widthPx = Math.round(51.5 * 3.7795 * pixelRatio);
  const heightPx = Math.round(25 * 3.7795 * pixelRatio);

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthPx, heightPx);

  // Line 1 text
  ctx.fillStyle = "#000000";
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.round(10.5 * pixelRatio)}px system-ui, -apple-system, sans-serif`;

  const line1Y = label.line2 ? heightPx * 0.40 : heightPx * 0.50;
  const maxTextWidth = widthPx - (4 * 3.7795 * pixelRatio); // 2mm margin on each side
  ctx.fillText(label.line1, widthPx / 2, line1Y, maxTextWidth);

  // Line 2 text if present
  if (label.line2) {
    ctx.direction = "rtl";
    if (/^[a-zA-Z0-9\s.,!?-]+$/.test(label.line2)) {
      ctx.direction = "ltr";
    }
    
    ctx.font = `bold ${Math.round(8.5 * pixelRatio)}px system-ui, -apple-system, sans-serif`;
    const line2Y = heightPx * 0.68;
    ctx.fillText(label.line2, widthPx / 2, line2Y, maxTextWidth);
  }

  return canvas.toDataURL("image/png");
}

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
      alert("יש להזין לפחות שורה אחת");
      return;
    }

    setIsGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [106, 25]
      });

      const labelData = { 
        line1: line1.trim() || line2.trim(), 
        line2: line1.trim() ? line2.trim() : "" 
      };
      const dataUrl = renderLabelToDataUrl(labelData);

      // Print left side
      pdf.addImage(dataUrl, 'PNG', 0, 0, 51.5, 25);
      
      // If copies = 2, print right side too
      if (copies === 2) {
        pdf.addImage(dataUrl, 'PNG', 54.5, 0, 51.5, 25);
      }

      if (typeof window !== 'undefined' && 'onPdfGeneratedBase64' in window) {
        const b64 = pdf.output("datauristring");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).onPdfGeneratedBase64(b64);
      } else {
        const pdfBlob = pdf.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, "_blank");
      }

      onClose();
    } catch (e) {
      console.error(e);
      alert("אירעה שגיאה ביצירת ה-PDF");
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
