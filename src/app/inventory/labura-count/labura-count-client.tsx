"use client";

import { useState } from "react";
import { updateLaburaInventoryCount } from "./actions";
import { Printer } from "lucide-react";

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
  // Use any to allow empty strings for the input fields while they are being edited
  const [data, setData] = useState<any[]>(initialData);

  const handleUpdate = async (id: string, field: keyof LaburaItem, value: string) => {
    let newLocalValue: number | "" = value === "" ? "" : parseInt(value, 10);
    if (typeof newLocalValue === "number" && isNaN(newLocalValue)) newLocalValue = 0;

    // Optimistically update UI
    setData(prev => 
      prev.map(item => item.id === id ? { ...item, [field]: newLocalValue } : item)
    );

    // Call server action
    const numericValue = newLocalValue === "" ? 0 : newLocalValue;
    await updateLaburaInventoryCount(id, field, numericValue);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: white !important; }
          #print-area {
            overflow: visible !important;
          }
          .print-hide { display: none !important; }
          .print-show { display: inline-block !important; }
        }
      `}</style>
      
      <div className="flex justify-end print-hide">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>הדפס / שמור כ-PDF</span>
        </button>
      </div>
      
      <div 
        id="print-area"
        className="bg-card rounded-xl border shadow-sm overflow-hidden overflow-x-auto print:overflow-visible print:border-none print:shadow-none p-2 sm:p-4"
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
                  value={item.finishedProductUnits}
                  onChange={(e) => handleUpdate(item.id, 'finishedProductUnits', e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full bg-transparent border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left print-hide"
                  dir="ltr"
                />
                <span className="hidden print-show text-left w-full">
                  {item.finishedProductUnits === "" ? "0" : item.finishedProductUnits}
                </span>
              </td>
              <td className="px-4 py-3 w-40">
                <input
                  type="number"
                  value={item.cartonPackages}
                  onChange={(e) => handleUpdate(item.id, 'cartonPackages', e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full bg-transparent border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left print-hide"
                  dir="ltr"
                />
                <span className="hidden print-show text-left w-full">
                  {item.cartonPackages === "" ? "0" : item.cartonPackages}
                </span>
              </td>
              <td className="px-4 py-3 w-40">
                <input
                  type="number"
                  value={item.stickers}
                  onChange={(e) => handleUpdate(item.id, 'stickers', e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full bg-transparent border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left print-hide"
                  dir="ltr"
                />
                <span className="hidden print-show text-left w-full">
                  {item.stickers === "" ? "0" : item.stickers}
                </span>
              </td>
              <td className="px-4 py-3 w-40">
                <input
                  type="number"
                  value={item.smallStickersForSamples}
                  onChange={(e) => handleUpdate(item.id, 'smallStickersForSamples', e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full bg-transparent border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left print-hide"
                  dir="ltr"
                />
                <span className="hidden print-show text-left w-full">
                  {item.smallStickersForSamples === "" ? "0" : item.smallStickersForSamples}
                </span>
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
