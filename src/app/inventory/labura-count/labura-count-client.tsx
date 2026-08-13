"use client";

import { useState } from "react";
import { updateLaburaInventoryCount } from "./actions";

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

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden overflow-x-auto">
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
  );
}
