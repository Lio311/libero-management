"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { Loader2, Printer } from "lucide-react";

interface LabelData {
  id: string;
  hebrew: string;
  english: string;
}

/**
 * Renders a single label directly onto a Canvas 2D context.
 * Canvas 2D natively supports ctx.direction = 'rtl' and correctly
 * handles Hebrew text shaping — unlike html-to-image's SVG foreignObject
 * which breaks RTL text.
 */
function renderLabelToDataUrl(label: { hebrew: string; english?: string }): string {
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

  // Hebrew text (RTL)
  ctx.fillStyle = "#000000";
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.round(10.5 * pixelRatio)}px system-ui, -apple-system, sans-serif`;

  const hebrewY = label.english ? heightPx * 0.40 : heightPx * 0.50;
  const maxTextWidth = widthPx - (4 * 3.7795 * pixelRatio); // 2mm margin on each side
  ctx.fillText(label.hebrew, widthPx / 2, hebrewY, maxTextWidth);

  // English text (LTR) if present
  if (label.english) {
    ctx.direction = "ltr";
    ctx.font = `bold ${Math.round(10.5 * pixelRatio)}px system-ui, -apple-system, sans-serif`;
    const englishY = heightPx * 0.68;
    ctx.fillText(label.english, widthPx / 2, englishY, maxTextWidth);
  }

  return canvas.toDataURL("image/png");
}

export default function ClientPrinter({ labels, orderId }: { labels: LabelData[], orderId: string | number }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (!hasGenerated && labels.length > 0) {
      setHasGenerated(true);
      setTimeout(() => {
        generatePDF();
      }, 500);
    }
  }, [labels]);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [106, 25]
      });

      for (let i = 0; i < labels.length; i += 2) {
        const dataUrl1 = renderLabelToDataUrl(labels[i]);

        if (i > 0) {
          pdf.addPage([106, 25], "landscape");
        }

        // First label on the left
        pdf.addImage(dataUrl1, 'PNG', 0, 0, 51.5, 25);

        // Second label on the right (if exists)
        if (i + 1 < labels.length) {
          const dataUrl2 = renderLabelToDataUrl(labels[i + 1]);
          pdf.addImage(dataUrl2, 'PNG', 54.5, 0, 51.5, 25);
        }
      }

      // Expose to puppeteer if printing remotely
      if (typeof window !== 'undefined' && (window as any).onPdfGeneratedBase64) {
        const b64 = pdf.output("datauristring");
        (window as any).onPdfGeneratedBase64(b64);
      } else {
        const pdfBlob = pdf.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.location.replace(pdfUrl);
      }

    } catch (e) {
      console.error(e);
      alert("אירעה שגיאה ביצירת ה-PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans" dir="rtl">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-black p-6 text-white text-center">
          <h1 className="text-2xl font-bold">הדפסת מדבקות מיני בושם</h1>
          <p className="opacity-80 mt-1">הזמנה #{orderId} • {labels.length} מדבקות</p>
        </div>
        
        <div className="p-8 space-y-6">
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl text-lg font-medium transition-all disabled:opacity-50 shadow-md"
          >
            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Printer className="w-6 h-6" />}
            {isGenerating ? "מייצר PDF מדויק..." : "הדפס מדבקות (PDF מדויק)"}
          </button>
          
          <p className="text-sm text-center text-gray-500">
            הקובץ מותאם במדויק למדפסת (רוחב 106 מ&quot;מ, גובה 25 מ&quot;מ).
          </p>
        </div>
      </div>
    </div>
  );
}
