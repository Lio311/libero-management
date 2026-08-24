"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Download, Loader2, Printer } from "lucide-react";

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
        format: [50, 25]
      });

      for (let i = 0; i < labelElements.length; i++) {
        const el = labelElements[i];
        
        // Wait a small tick to ensure DOM is fully rendered
        await new Promise(r => setTimeout(r, 50));

        const dataUrl = await toPng(el, {
          quality: 1,
          pixelRatio: 4, 
          style: { margin: '0', padding: '2mm', background: 'white' }
        });

        if (i > 0) {
          pdf.addPage([50, 25], "landscape");
        }
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, 50, 25);
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

  const downloadEzpx = () => {
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<PrintJob>
  <QLabelSDKVersion>1.0</QLabelSDKVersion>
  <LabelSetup>
    <Width>50</Width>
    <Height>25</Height>
    <MarginLeft>0</MarginLeft>
    <MarginTop>0</MarginTop>
  </LabelSetup>
  <Pages>
`;

    labels.forEach((label, index) => {
      xml += `    <Page>
      <Objects>
        <Text>
          <X>25</X>
          <Y>8</Y>
          <FontFamily>Arial</FontFamily>
          <FontSize>12</FontSize>
          <Alignment>Center</Alignment>
          <Content>${label.hebrew}</Content>
        </Text>
        <Text>
          <X>25</X>
          <Y>16</Y>
          <FontFamily>Arial</FontFamily>
          <FontSize>10</FontSize>
          <Alignment>Center</Alignment>
          <Content>${label.english}</Content>
        </Text>
      </Objects>
    </Page>\n`;
    });

    xml += `  </Pages>
</PrintJob>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order_${orderId}_labels.ezpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            {isGenerating ? "מייצר PDF מדויק..." : "הדפס כ-PDF מדויק (מומלץ)"}
          </button>
          
          <p className="text-sm text-center text-gray-500">
            אפשרות זו תפתח קובץ PDF המותאם בדיוק למדפסת (50x25 מ"מ) וללא שוליים או כותרות.
          </p>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-400">או עבודה בשיטה הישנה</span>
            </div>
          </div>

          <button
            onClick={downloadEzpx}
            className="w-full flex items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 text-gray-700 py-4 px-6 rounded-xl text-lg font-medium border border-gray-300 transition-all"
          >
            <Download className="w-6 h-6" />
            הורד קובץ EZPX (לפתיחה ב-GoLabel)
          </button>
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
                width: "50mm",
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
