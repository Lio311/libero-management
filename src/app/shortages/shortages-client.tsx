"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Package, Search, Store as StoreIcon, Calendar as CalendarIcon, User, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface ShortageItem {
  name: string;
  sku: string;
  expected: number;
  scanned: number;
}

interface ShortageRecord {
  orderId: number;
  store: string;
  missingItems: ShortageItem[];
  customerName: string;
  total: string;
  dateCreated: string | Date;
  status: string;
}

export default function ShortagesClient({ shortages }: { shortages: ShortageRecord[] }) {
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    let result = [...shortages];
    if (storeFilter !== "all") {
      result = result.filter(s => s.store === storeFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(s => 
        s.orderId.toString().includes(term) ||
        s.customerName.toLowerCase().includes(term) ||
        s.missingItems.some(i => i.name.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term))
      );
    }
    return result.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
  }, [shortages, storeFilter, searchTerm]);

  const totalMissingItems = filtered.reduce((sum, s) => sum + s.missingItems.length, 0);
  const storeNames: Record<string, string> = { libero: "ליברו", velour: "וולור", labura: "לה בורה" };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 w-full pb-32" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-panel rounded-3xl p-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center flex items-center justify-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            ריכוז חוסרים
          </h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{shortages.length}</div>
            <div className="text-sm text-white/70 mt-1">הזמנות עם חוסרים</div>
          </div>
          {["libero", "velour", "labura"].map(store => {
            const count = shortages.filter(s => s.store === store).length;
            return (
              <div key={store} className="glass-panel rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-white">{count}</div>
                <div className="text-sm text-white/70 mt-1">{storeNames[store]}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex bg-white/10 p-1.5 rounded-xl border border-white/10">
            {["all", "libero", "velour", "labura"].map(s => (
              <button
                key={s}
                onClick={() => setStoreFilter(s)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  storeFilter === s ? "bg-blue-600 shadow-sm text-white" : "text-white/70 hover:text-white"
                }`}
              >
                {s === "all" ? "הכל" : storeNames[s]}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/70" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי מספר הזמנה, שם לקוח, מוצר..."
              className="block w-full pl-3 pr-10 py-3 border border-white/20 rounded-xl bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
              dir="rtl"
            />
          </div>
        </div>

        {/* Shortages List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/50 text-lg">לא נמצאו חוסרים</p>
            </div>
          ) : (
            filtered.map((shortage) => (
              <div key={`${shortage.store}-${shortage.orderId}`} className="glass-panel rounded-2xl p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/20 p-2 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        הזמנה #{shortage.orderId}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                          {storeNames[shortage.store] || shortage.store}
                        </span>
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-white/60 mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {shortage.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {shortage.dateCreated ? format(new Date(shortage.dateCreated), 'dd/MM/yyyy HH:mm', { locale: he }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/shipping-scanner/${shortage.orderId}?store=${shortage.store}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    פתח הזמנה
                  </Link>
                </div>
                
                <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50">
                        <th className="text-right p-3 font-medium">מוצר</th>
                        <th className="text-right p-3 font-medium">מק"ט</th>
                        <th className="text-center p-3 font-medium">הוזמן</th>
                        <th className="text-center p-3 font-medium">נסרק</th>
                        <th className="text-center p-3 font-medium">חסר</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortage.missingItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-white/5 last:border-0">
                          <td className="p-3 text-white font-medium">{item.name}</td>
                          <td className="p-3 text-white/70 font-mono text-xs">{item.sku || '-'}</td>
                          <td className="p-3 text-center text-white/70">{item.expected}</td>
                          <td className="p-3 text-center text-white/70">{item.scanned}</td>
                          <td className="p-3 text-center">
                            <span className="text-red-400 font-bold">{item.expected - item.scanned}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
