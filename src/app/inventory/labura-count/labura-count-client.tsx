"use client";

import { useState, useRef } from "react";
import { updateLaburaInventoryCount } from "./actions";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FileText } from "lucide-react";

type LaburaItem = {
  id: string;
  displayOrder: number;
  butterName: string;
  finishedProductUnits: number;
  cartonPackages: number;
  stickers: number;
  smallStickersForSamples: number;
};

export default function LaburaCountClient({ initialData }: { initialData: LaburaItem[] }) {
  const [data, setData] = useState<LaburaItem[]>(initialData);
  const [isExporting, setIsExporting] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleUpdate = async (id: string, field: keyof LaburaItem, value: string) => {
    // Parse integer, allow empty string
    let numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) numericValue = 0;

    // Optimistically update UI
    setData(prev => 
      prev.map(item => item.id === id ? { ...item, [field]: numericValue } : item)
    );

    // Call server action
    await updateLaburaInventoryCount(id, field, numericValue);
  };

  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    setIsExporting(true);
    
    try {
      // Small delay to ensure any UI states are stable
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`labura-inventory-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <FileText className="w-4 h-4" />
          <span>{isExporting ? "מפיק דוח..." : "ייצא כ-PDF"}</span>
        </button>
      </div>
      
      <div 
        ref={tableRef}
        className="bg-card rounded-xl border shadow-sm overflow-hidden overflow-x-auto p-2 sm:p-4"
      >
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold">ספירת מלאי לה בורה</h2>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('he-IL')}</p>
        </div>
        <table className="w-full text-right text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium whitespace-nowrap">#</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">שם החמאה</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">מספר יחידות ממוצר מוגמר</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">אריזות קרטון</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">מדבקות</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">מדבקות קטנות לדוגמיות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item, index) => (
            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-muted-foreground w-12">{index + 1}</td>
              <td className="px-4 py-3 font-medium min-w-[200px]">{item.butterName}</td>
              <td className="px-4 py-3 w-40">
                <input
                  type="number"
                  value={item.finishedProductUnits === 0 ? "" : item.finishedProductUnits}
                  onChange={(e) => handleUpdate(item.id, 'finishedProductUnits', e.target.value)}
                  className="w-full bg-transparent border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left"
                  dir="ltr"
                />
              </td>
              <td className="px-4 py-3 w-40">
                <input
                  type="number"
                  value={item.cartonPackages === 0 ? "" : item.cartonPackages}
                  onChange={(e) => handleUpdate(item.id, 'cartonPackages', e.target.value)}
                  className="w-full bg-transparent border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left"
                  dir="ltr"
                />
              </td>
              <td className="px-4 py-3 w-40">
                <input
                  type="number"
                  value={item.stickers === 0 ? "" : item.stickers}
                  onChange={(e) => handleUpdate(item.id, 'stickers', e.target.value)}
                  className="w-full bg-transparent border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left"
                  dir="ltr"
                />
              </td>
              <td className="px-4 py-3 w-40">
                <input
                  type="number"
                  value={item.smallStickersForSamples === 0 ? "" : item.smallStickersForSamples}
                  onChange={(e) => handleUpdate(item.id, 'smallStickersForSamples', e.target.value)}
                  className="w-full bg-transparent border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left"
                  dir="ltr"
                />
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                אין נתונים בטבלה
              </td>
            </tr>
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}
