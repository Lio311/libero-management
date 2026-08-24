"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Loader2, Printer } from "lucide-react";

interface LabelData {
  id: string;
  hebrew: string;
  english: string;
}

export default function ClientPrinter({ labels, orderId }: { labels: LabelData[], orderId: string | number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!containerRef.current) return;
    setIsGenerating(true);
    try {
      const labelElements = Array.from(containerRef.current.querySelectorAll('.label-render-node')) as HTMLElement[];
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [106, 25] // Full width of the roll (106mm)
      });

      for (let i = 0; i < labelElements.length; i += 2) {
        // First label in the row
        const el1 = labelElements[i];
        await new Promise(r => setTimeout(r, 50));
        const dataUrl1 = await toPng(el1, {
          quality: 1,
          pixelRatio: 4, 
          style: { margin: '0', padding: '2mm', background: 'white' }
        });

        if (i > 0) {
          pdf.addPage([106, 25], "landscape");
        }
        
        // Add first label on the left (x=0, width=51.5)
        pdf.addImage(dataUrl1, 'PNG', 0, 0, 51.5, 25);

        // If there is a second label for this row, add it on the right
        if (i + 1 < labelElements.length) {
          const el2 = labelElements[i + 1];
          const dataUrl2 = await toPng(el2, {
            quality: 1,
            pixelRatio: 4, 
            style: { margin: '0', padding: '2mm', background: 'white' }
          });
          // Add second label on the right (x=54.5, width=51.5)
          pdf.addImage(dataUrl2, 'PNG', 54.5, 0, 51.5, 25);
        }
      }

      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
      
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
            הקובץ מותאם במדויק למדפסת (רוחב 106 מ"מ, גובה 25 מ"מ).
          </p>
        </div>
      </div>

      {/* Hidden container for rendering labels into canvas */}
      <div className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none">
        <div ref={containerRef} className="flex flex-col gap-10">
          {labels.map((label, idx) => (
            <div
              key={idx}
              className="label-render-node bg-white flex flex-col justify-center items-center text-center overflow-hidden"
              style={{
                width: "51.5mm", // Exact width of one label
                height: "25mm",
                padding: "2mm",
                boxSizing: "border-box",
              }}
            >
              <div 
                className="font-bold leading-tight w-full"
                style={{ 
                  fontSize: "13px", 
                  direction: "rtl",
                  fontFamily: "system-ui, -apple-system, sans-serif"
                }}
              >
                {label.hebrew}
              </div>
              {label.english && (
                <div 
                  className="font-bold leading-tight w-full mt-[2px]"
                  style={{ 
                    fontSize: "11px", 
                    direction: "ltr",
                    fontFamily: "system-ui, -apple-system, sans-serif"
                  }}
                >
                  {label.english}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
