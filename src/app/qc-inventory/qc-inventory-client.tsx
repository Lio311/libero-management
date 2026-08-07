"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown, ChevronUp, Filter, Package } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface InventoryProduct {
  id: string;
  wooProductId: number;
  productName: string;
  productSku: string | null;
  productImage: string | null;
  categories: string;
  lastInspectionDate: Date | null;
  lastPriceStatusDate: Date | null;
  dateAddedToSite: Date;
  ageDays: number;
  currentStock: number;
  salesLastWeek: number;
  salesLastMonth: number;
  salesMonthBeforeLast: number;
  totalSales: number;
}

type SortMode = "name_asc" | "name_desc" | "inspection_asc" | "inspection_desc" | "price_asc" | "price_desc" | "color_asc" | "color_desc";

function getAgeCategory(days: number) {
  if (days > 90) return { category: "red", label: "מעל 90 יום", bg: "bg-red-50/70 hover:bg-red-100/70", text: "text-red-700", border: "border-red-400", badgeBg: "bg-red-100" };
  if (days >= 45) return { category: "dark_orange", label: "45-90 ימים", bg: "bg-orange-50/70 hover:bg-orange-100/70", text: "text-orange-800", border: "border-orange-500", badgeBg: "bg-orange-200" };
  if (days >= 30) return { category: "orange", label: "30-45 ימים", bg: "bg-orange-50/70 hover:bg-orange-100/70", text: "text-orange-600", border: "border-orange-400", badgeBg: "bg-orange-100" };
  if (days >= 14) return { category: "yellow", label: "14-30 ימים", bg: "bg-yellow-50/70 hover:bg-yellow-100/70", text: "text-yellow-700", border: "border-yellow-400", badgeBg: "bg-yellow-100" };
  return { category: "green", label: "פחות משבועיים", bg: "bg-emerald-50/70 hover:bg-emerald-100/70", text: "text-emerald-700", border: "border-emerald-400", badgeBg: "bg-emerald-100" };
}

export default function QcInventoryClient({ products }: { products: InventoryProduct[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("color_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("in_stock");

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categories) cats.add(p.categories);
    });
    return Array.from(cats).sort();
  }, [products]);

  const colorOptions = [
    { value: "all", label: "הכל" },
    { value: "green", label: "ירוק (פחות משבועיים)" },
    { value: "yellow", label: "צהוב (14-30 ימים)" },
    { value: "orange", label: "כתום (30-45 ימים)" },
    { value: "dark_orange", label: "כתום כהה (45-90 ימים)" },
    { value: "red", label: "אדום (מעל 90 יום)" },
  ];

  const sortLabels: Record<SortMode, string> = {
    color_desc: "צבע: אדום לירוק",
    color_asc: "צבע: ירוק לאדום",
    name_asc: "שם: א ← ת",
    name_desc: "שם: ת ← א",
    inspection_asc: "תאריך בקרה: ישן ← חדש",
    inspection_desc: "תאריך בקרה: חדש ← ישן",
    price_asc: "תאריך תמחור: ישן ← חדש",
    price_desc: "תאריך תמחור: חדש ← ישן",
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          (p.productSku && p.productSku.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(p => p.categories === categoryFilter);
    }
    
    if (colorFilter !== "all") {
      result = result.filter(p => getAgeCategory(p.ageDays).category === colorFilter);
    }

    if (stockFilter === "in_stock") {
      result = result.filter(p => p.currentStock > 0);
    } else if (stockFilter === "out_of_stock") {
      result = result.filter(p => p.currentStock <= 0);
    }

    result.sort((a, b) => {
      switch (sortMode) {
        case "name_asc":
          return a.productName.localeCompare(b.productName, "he");
        case "name_desc":
          return b.productName.localeCompare(a.productName, "he");
        case "inspection_asc":
          if (!a.lastInspectionDate) return -1;
          if (!b.lastInspectionDate) return 1;
          return new Date(a.lastInspectionDate).getTime() - new Date(b.lastInspectionDate).getTime();
        case "inspection_desc":
          if (!a.lastInspectionDate) return 1;
          if (!b.lastInspectionDate) return -1;
          return new Date(b.lastInspectionDate).getTime() - new Date(a.lastInspectionDate).getTime();
        case "price_asc":
          if (!a.lastPriceStatusDate) return -1;
          if (!b.lastPriceStatusDate) return 1;
          return new Date(a.lastPriceStatusDate).getTime() - new Date(b.lastPriceStatusDate).getTime();
        case "price_desc":
          if (!a.lastPriceStatusDate) return 1;
          if (!b.lastPriceStatusDate) return -1;
          return new Date(b.lastPriceStatusDate).getTime() - new Date(a.lastPriceStatusDate).getTime();
        case "color_asc":
          if (a.ageDays !== b.ageDays) return a.ageDays - b.ageDays;
          return new Date(b.dateAddedToSite).getTime() - new Date(a.dateAddedToSite).getTime();
        case "color_desc":
          if (a.ageDays !== b.ageDays) return b.ageDays - a.ageDays;
          return new Date(a.dateAddedToSite).getTime() - new Date(b.dateAddedToSite).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchQuery, sortMode, categoryFilter, colorFilter, stockFilter]);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">בקרת מלאי</h2>
          <p className="text-muted-foreground mt-1 text-sm">מעקב גיל מלאי ותמחור למוצרי ליברו</p>
        </div>
      </div>

      <Card className="bg-white border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש מוצר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50"
                dir="rtl"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
            >
              <Filter className="w-4 h-4" />
              מיון
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <div className="hidden md:flex items-center gap-2">
              <Select value={stockFilter} onValueChange={(v) => setStockFilter(v || "all")}>
                <SelectTrigger className="w-[140px] h-10 border-gray-200 bg-white text-right" dir="rtl">
                  <SelectValue placeholder="מצב מלאי">
                    {stockFilter === 'all' ? 'הכל' : stockFilter === 'in_stock' ? 'במלאי' : 'אזל מהמלאי'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end" dir="rtl">
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="in_stock">במלאי</SelectItem>
                  <SelectItem value="out_of_stock">אזל מהמלאי</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || "all")}>
                <SelectTrigger className="w-[160px] h-10 border-gray-200 bg-white text-right" dir="rtl">
                  <SelectValue placeholder="כל הקטגוריות">
                    {categoryFilter === 'all' ? 'הכל' : categoryFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end" dir="rtl">
                  <SelectItem value="all">הכל</SelectItem>
                  {uniqueCategories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={colorFilter} onValueChange={(v) => setColorFilter(v || "all")}>
                <SelectTrigger className="w-[160px] h-10 border-gray-200 bg-white text-right" dir="rtl">
                  <SelectValue placeholder="כל הצבעים">
                    {colorOptions.find(c => c.value === colorFilter)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end" dir="rtl">
                  {colorOptions.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="w-[180px] h-10 border-gray-200 bg-white text-right" dir="rtl">
                  <SelectValue placeholder="בחר מיון">
                    {sortLabels[sortMode]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end" dir="rtl">
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`mt-3 space-y-3 ${showFilters ? "block" : "hidden md:hidden"}`}>
            <Select value={stockFilter} onValueChange={(v) => setStockFilter(v || "all")}>
              <SelectTrigger className="w-full h-10 border-gray-200 bg-white text-right" dir="rtl">
                <SelectValue placeholder="מצב מלאי">
                  {stockFilter === 'all' ? 'הכל' : stockFilter === 'in_stock' ? 'במלאי' : 'אזל מהמלאי'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="center" className="w-[calc(100vw-3rem)]" dir="rtl">
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="in_stock">במלאי</SelectItem>
                <SelectItem value="out_of_stock">אזל מהמלאי</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || "all")}>
              <SelectTrigger className="w-full h-10 border-gray-200 bg-white text-right" dir="rtl">
                <SelectValue placeholder="כל הקטגוריות">
                  {categoryFilter === 'all' ? 'הכל' : categoryFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="center" className="w-[calc(100vw-3rem)]" dir="rtl">
                <SelectItem value="all">הכל</SelectItem>
                {uniqueCategories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={colorFilter} onValueChange={(v) => setColorFilter(v || "all")}>
              <SelectTrigger className="w-full h-10 border-gray-200 bg-white text-right" dir="rtl">
                <SelectValue placeholder="כל הצבעים">
                  {colorOptions.find(c => c.value === colorFilter)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="center" className="w-[calc(100vw-3rem)]" dir="rtl">
                {colorOptions.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <SelectTrigger className="w-full h-10 border-gray-200 bg-white text-right" dir="rtl">
                <SelectValue placeholder="בחר מיון">
                  {sortLabels[sortMode]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="center" className="w-[calc(100vw-3rem)]" dir="rtl">
                {Object.entries(sortLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 md:px-6 md:pb-6">
          <div className="px-4 py-2 text-sm text-gray-500 font-medium">
            סה״כ מוצרים: {filteredAndSorted.length}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-muted-foreground hidden md:table-header-group">
                <tr>
                  <th className="py-3 px-4 font-medium text-right rounded-tr-md">שם המוצר</th>
                  <th className="py-3 px-4 font-medium text-right">קטגוריה</th>
                  <th className="py-3 px-4 font-medium text-center">מכר חודש לפני אחרון</th>
                  <th className="py-3 px-4 font-medium text-center">מכר חודש אחרון</th>
                  <th className="py-3 px-4 font-medium text-center">מכר שבוע אחרון</th>
                  <th className="py-3 px-4 font-medium text-center">התקדמות</th>
                  <th className="py-3 px-4 font-medium text-center">תאריך בקרת מוצר אחרון</th>
                  <th className="py-3 px-4 font-medium text-center">תאריך תמחור אחרון</th>
                  <th className="py-3 px-4 font-medium text-center rounded-tl-md">זמן חיי מדף</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSorted.length > 0 ? (
                  filteredAndSorted.map((product) => {
                    const style = getAgeCategory(product.ageDays);
                    return (
                      <tr key={product.id} className={`transition-all duration-300 hidden md:table-row border-r-4 ${style.border} ${style.bg}`}>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center gap-3">
                            {product.productImage ? (
                              <img src={product.productImage} alt={product.productName} className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <a href={`https://libero-il.co.il/?p=${product.wooProductId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px] block">
                                {product.productName}
                              </a>
                              {product.productSku && <p className="text-[11px] text-gray-400">מק״ט: {product.productSku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-gray-600 text-sm">{product.categories || "—"}</span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">
                          {product.salesMonthBeforeLast}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">
                          {product.salesLastMonth}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">
                          {product.salesLastWeek}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="w-full max-w-[100px] mx-auto bg-gray-200 rounded-full h-2 mb-1 relative">
                            {(() => {
                              const totalOrdered = product.currentStock + product.totalSales;
                              const progress = totalOrdered > 0 ? (product.totalSales / totalOrdered) * 100 : 0;
                              return (
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              );
                            })()}
                          </div>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap" dir="ltr">
                            {product.totalSales} / {product.currentStock + product.totalSales}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {product.lastInspectionDate ? format(new Date(product.lastInspectionDate), "dd/MM/yyyy", { locale: he }) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {product.lastPriceStatusDate ? format(new Date(product.lastPriceStatusDate), "dd/MM/yyyy", { locale: he }) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.badgeBg} ${style.text}`}>
                              {style.label}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {format(new Date(product.dateAddedToSite), "dd/MM/yyyy", { locale: he })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>לא נמצאו מוצרים</p>
                    </td>
                  </tr>
                )}
                
                {/* Mobile view lines */}
                {filteredAndSorted.map((product) => {
                  const style = getAgeCategory(product.ageDays);
                  return (
                    <tr key={`mobile-${product.id}`} className="md:hidden border-b-0">
                      <td colSpan={9} className="p-0 border-b-0">
                        <div className={`m-2 rounded-xl shadow-sm border border-r-4 ${style.border} ${style.bg.split(' ')[0]}`}>
                          <div className="p-3 flex items-start gap-3 border-b border-gray-100">
                            {product.productImage ? (
                              <img src={product.productImage} alt={product.productName} className="w-14 h-14 rounded-lg object-cover border flex-shrink-0" />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <a href={`https://libero-il.co.il/?p=${product.wooProductId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate block">
                                {product.productName}
                              </a>
                              {product.productSku && <p className="text-[11px] text-gray-400 mt-0.5">מק״ט: {product.productSku}</p>}
                              {product.categories && <p className="text-[11px] text-gray-500 mt-0.5 whitespace-nowrap truncate">{product.categories}</p>}
                            </div>
                          </div>
                          <div className="p-3 space-y-2 text-[12px]">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">בקרת מוצר:</span>
                              <span>{product.lastInspectionDate ? format(new Date(product.lastInspectionDate), "dd/MM/yyyy", { locale: he }) : "—"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">תמחור אחרון:</span>
                              <span>{product.lastPriceStatusDate ? format(new Date(product.lastPriceStatusDate), "dd/MM/yyyy", { locale: he }) : "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-50 text-center">
                              <div>
                                <span className="block text-gray-500 text-[10px]">חודש שעבר</span>
                                <span className="font-medium text-[13px]">{product.salesMonthBeforeLast}</span>
                              </div>
                              <div>
                                <span className="block text-gray-500 text-[10px]">מכר 30 יום</span>
                                <span className="font-medium text-[13px]">{product.salesLastMonth}</span>
                              </div>
                              <div>
                                <span className="block text-gray-500 text-[10px]">מכר 7 ימים</span>
                                <span className="font-medium text-[13px]">{product.salesLastWeek}</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-50">
                              <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                                <span>התקדמות מכר/מלאי</span>
                                <span dir="ltr">{product.totalSales} / {product.currentStock + product.totalSales}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                {(() => {
                                  const totalOrdered = product.currentStock + product.totalSales;
                                  const progress = totalOrdered > 0 ? (product.totalSales / totalOrdered) * 100 : 0;
                                  return (
                                    <div 
                                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    ></div>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                              <span className="text-gray-500">חיי מדף:</span>
                              <div className="flex flex-col items-end">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${style.badgeBg} ${style.text}`}>
                                  {style.label}
                                </span>
                                <span className="text-[10px] text-gray-500 mt-1">
                                  {format(new Date(product.dateAddedToSite), "dd/MM/yyyy", { locale: he })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
