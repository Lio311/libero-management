"use client";

import { useState, useEffect } from "react";
import { updateLaburaInventoryCount } from "./actions";
import { Printer } from "lucide-react";

type LaburaItem = {
  id: string;
  displayOrder: number;
  butterName: string;
  finishedProductUnits: number;
  cartonPackages: number;
  cartonsToOrder: number;
  bodyButtersToOrder: number;
  stickers: number;
  smallStickersForSamples: number;
};

export default function LaburaCountClient({ initialData }: { initialData: LaburaItem[] }) {
  // Use any to allow empty strings for the input fields while they are being edited
  const [data, setData] = useState<any[]>(initialData);
  const [printMode, setPrintMode] = useState<'all' | 'cartons-order' | 'body-butters-order'>('all');

  useEffect(() => {
    const handleAfterPrint = () => setPrintMode('all');
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

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
    setPrintMode('all');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintCartonsOrder = () => {
    setPrintMode('cartons-order');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintBodyButtersOrder = () => {
    setPrintMode('body-butters-order');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const displayData = printMode === 'cartons-order'
    ? data.filter(item => typeof item.cartonsToOrder === 'number' ? item.cartonsToOrder > 0 : false)
    : printMode === 'body-butters-order'
    ? data.filter(item => typeof item.bodyButtersToOrder === 'number' ? item.bodyButtersToOrder > 0 : false)
    : data;

  const totalCartonsToOrder = displayData.reduce(
    (sum, item) => sum + (typeof item.cartonsToOrder === 'number' && !isNaN(item.cartonsToOrder) ? item.cartonsToOrder : 0), 
    0
  );

  const totalBodyButtersToOrder = displayData.reduce(
    (sum, item) => sum + (typeof item.bodyButtersToOrder === 'number' && !isNaN(item.bodyButtersToOrder) ? item.bodyButtersToOrder : 0), 
    0
  );

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { background: white !important; }
          #print-area {
            overflow: visible !important;
          }
          .print-hide { display: none !important; }
          .print-show { display: inline-block !important; }
        }
      `}</style>
      
      <div className="flex justify-end gap-3 print-hide">
        <button
          onClick={handlePrintBodyButtersOrder}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-md shadow-sm hover:bg-secondary/80 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>הדפס הזמנת חמאות גוף</span>
        </button>
        <button
          onClick={handlePrintCartonsOrder}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-md shadow-sm hover:bg-secondary/80 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>הדפס הזמנת קרטונים</span>
        </button>
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
          <h2 className="text-xl font-bold">
            {printMode === 'cartons-order' ? 'הזמנת קרטונים לה בורה' 
             : printMode === 'body-butters-order' ? 'הזמנת חמאות גוף לה בורה' 
             : 'ספירת מלאי לה בורה'}
          </h2>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('he-IL')}</p>
        </div>
        <table className="w-full text-right text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-2 py-3 font-medium whitespace-nowrap">#</th>
            <th className="px-2 py-3 font-medium whitespace-nowrap">שם החמאה</th>
            {printMode === 'all' && (
              <>
                <th className="px-2 py-3 font-medium min-w-[100px] leading-tight text-center">מספר יחידות ממוצר מוגמר</th>
                <th className="px-2 py-3 font-medium min-w-[100px] leading-tight text-center">אריזות קרטון</th>
              </>
            )}
            {(printMode === 'all' || printMode === 'cartons-order') && (
              <th className="px-2 py-3 font-medium min-w-[100px] leading-tight text-center">כמות להזמנה מקרטונים</th>
            )}
            {(printMode === 'all' || printMode === 'body-butters-order') && (
              <th className="px-2 py-3 font-medium min-w-[100px] leading-tight text-center">כמות להזמנה מחמאות גוף</th>
            )}
            {printMode === 'all' && (
              <>
                <th className="px-2 py-3 font-medium min-w-[100px] leading-tight text-center">מדבקות</th>
                <th className="px-2 py-3 font-medium min-w-[100px] leading-tight text-center">מדבקות קטנות לדוגמיות</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {displayData.map((item, index) => (
            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-2 py-3 text-muted-foreground w-10 text-center">{index + 1}</td>
              <td className="px-2 py-3 font-medium min-w-[180px]">{item.butterName}</td>
              
              {printMode === 'all' && (
                <>
                  <td className="px-2 py-3 w-28">
                    <input
                      type="number"
                      value={item.finishedProductUnits}
                      onChange={(e) => handleUpdate(item.id, 'finishedProductUnits', e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full bg-transparent border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center print-hide"
                      dir="ltr"
                    />
                    <span className="hidden print-show text-center w-full">
                      {item.finishedProductUnits === "" ? "0" : item.finishedProductUnits}
                    </span>
                  </td>
                  <td className="px-2 py-3 w-28">
                    <input
                      type="number"
                      value={item.cartonPackages}
                      onChange={(e) => handleUpdate(item.id, 'cartonPackages', e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full bg-transparent border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center print-hide"
                      dir="ltr"
                    />
                    <span className="hidden print-show text-center w-full">
                      {item.cartonPackages === "" ? "0" : item.cartonPackages}
                    </span>
                  </td>
                </>
              )}

              {(printMode === 'all' || printMode === 'cartons-order') && (
                <td className="px-2 py-3 w-28">
                  <input
                    type="number"
                    value={item.cartonsToOrder}
                    onChange={(e) => handleUpdate(item.id, 'cartonsToOrder', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-transparent border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center print-hide"
                    dir="ltr"
                  />
                  <span className="hidden print-show text-center w-full">
                    {item.cartonsToOrder === "" ? "0" : item.cartonsToOrder}
                  </span>
                </td>
              )}

              {(printMode === 'all' || printMode === 'body-butters-order') && (
                <td className="px-2 py-3 w-28">
                  <input
                    type="number"
                    value={item.bodyButtersToOrder}
                    onChange={(e) => handleUpdate(item.id, 'bodyButtersToOrder', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-transparent border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center print-hide"
                    dir="ltr"
                  />
                  <span className="hidden print-show text-center w-full">
                    {item.bodyButtersToOrder === "" ? "0" : item.bodyButtersToOrder}
                  </span>
                </td>
              )}

              {printMode === 'all' && (
                <>
                  <td className="px-2 py-3 w-28">
                    <input
                      type="number"
                      value={item.stickers}
                      onChange={(e) => handleUpdate(item.id, 'stickers', e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full bg-transparent border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center print-hide"
                      dir="ltr"
                    />
                    <span className="hidden print-show text-center w-full">
                      {item.stickers === "" ? "0" : item.stickers}
                    </span>
                  </td>
                  <td className="px-2 py-3 w-28">
                    <input
                      type="number"
                      value={item.smallStickersForSamples}
                      onChange={(e) => handleUpdate(item.id, 'smallStickersForSamples', e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full bg-transparent border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center print-hide"
                      dir="ltr"
                    />
                    <span className="hidden print-show text-center w-full">
                      {item.smallStickersForSamples === "" ? "0" : item.smallStickersForSamples}
                    </span>
                  </td>
                </>
              )}
            </tr>
          ))}
          {displayData.length === 0 && (
            <tr>
              <td colSpan={printMode === 'all' ? 8 : 3} className="px-4 py-8 text-center text-muted-foreground">
                אין נתונים בטבלה
              </td>
            </tr>
          )}
        </tbody>
        {printMode === 'cartons-order' && displayData.length > 0 && (
          <tfoot className="bg-muted/10 border-t-2 border-border font-bold text-base">
            <tr>
              <td colSpan={2} className="px-4 py-4 text-left">סה״כ קרטונים להזמנה:</td>
              <td className="px-4 py-4 text-center" dir="ltr">{totalCartonsToOrder}</td>
            </tr>
          </tfoot>
        )}
        {printMode === 'body-butters-order' && displayData.length > 0 && (
          <tfoot className="bg-muted/10 border-t-2 border-border font-bold text-base">
            <tr>
              <td colSpan={2} className="px-4 py-4 text-left">סה״כ חמאות גוף להזמנה:</td>
              <td className="px-4 py-4 text-center" dir="ltr">{totalBodyButtersToOrder}</td>
            </tr>
          </tfoot>
        )}
        </table>
      </div>
    </div>
  );
}
