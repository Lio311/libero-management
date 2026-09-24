"use client";

import React, { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, ChevronDown, ChevronUp, Filter, Package, AlertTriangle, AlertCircle, CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface InventoryProduct {
  id: string;
  wooProductId: number;
  productName: string;
  productSku: string | null;
  productImage: string | null;
  categories: string;
  commerceGroup: string;
  status: string;
  lastInspectionDate: Date | null;
  lastPriceStatusDate: Date | null;
  dateAddedToSite: Date;
  ageDays: number;
  currentStock: number;
  salesLastWeek: number;
  salesLastMonth: number;
  salesMonthBeforeLast: number;
  totalSales: number;
  lastSaleDate?: Date | null;
  rating?: number;
}

type SortMode = "name_asc" | "name_desc" | "inspection_asc" | "inspection_desc" | "price_asc" | "price_desc" | "color_asc" | "color_desc" | "last_sale_date_asc" | "last_sale_date_desc" | "rating_asc" | "rating_desc";

function getAgeCategory(days: number) {
  if (days > 90) return { category: "red", label: "מעל 90 יום", bg: "bg-red-500/10 hover:bg-red-500/20", text: "text-red-300", border: "border-red-500/30", badgeBg: "bg-red-500/20" };
  if (days >= 45) return { category: "dark_orange", label: "45-90 ימים", bg: "bg-orange-500/10 hover:bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30", badgeBg: "bg-orange-500/20" };
  if (days >= 30) return { category: "orange", label: "30-45 ימים", bg: "bg-amber-500/10 hover:bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30", badgeBg: "bg-amber-500/20" };
  if (days >= 14) return { category: "yellow", label: "14-30 ימים", bg: "bg-yellow-500/10 hover:bg-yellow-500/20", text: "text-yellow-200", border: "border-yellow-500/30", badgeBg: "bg-yellow-500/20" };
  return { category: "green", label: "פחות משבועיים", bg: "bg-emerald-500/10 hover:bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30", badgeBg: "bg-emerald-500/20" };
}

function getRatingStyle(rating: number | undefined) {
  if (rating === undefined) return { text: "text-slate-400", bg: "bg-white/5 hover:bg-white/10", border: "border-r-slate-500/30" };
  if (rating >= 8.5) return { text: "text-emerald-300 font-medium", bg: "bg-emerald-500/10 hover:bg-emerald-500/20", border: "border-r-emerald-500/50" };
  if (rating >= 7) return { text: "text-green-300 font-medium", bg: "bg-green-500/10 hover:bg-green-500/20", border: "border-r-green-500/50" };
  if (rating >= 5) return { text: "text-yellow-300 font-medium", bg: "bg-yellow-500/10 hover:bg-yellow-500/20", border: "border-r-yellow-500/50" };
  if (rating >= 3.5) return { text: "text-orange-300 font-medium", bg: "bg-orange-500/10 hover:bg-orange-500/20", border: "border-r-orange-500/50" };
  if (rating >= 2) return { text: "text-red-300 font-medium", bg: "bg-red-500/10 hover:bg-red-500/20", border: "border-r-red-500/50" };
  return { text: "text-red-400 font-medium", bg: "bg-red-500/20 hover:bg-red-500/30", border: "border-r-red-500/70" };
}

const stockFilterLabels: Record<string, string> = {
  all: "כל מצבי המלאי",
  in_stock: "במלאי",
  out_of_stock: "אזל מהמלאי",
};

export default function QcInventoryClient({ products }: { products: InventoryProduct[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("color_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [colorFilter, setColorFilter] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<string>("in_stock");
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleFilter = (setState: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setState(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const [headerHeight, setHeaderHeight] = useState(0);
  const observerRef = React.useRef<ResizeObserver | null>(null);

  const topSectionRef = React.useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      observerRef.current = new ResizeObserver(() => {
        setHeaderHeight(node.getBoundingClientRect().height);
      });
      observerRef.current.observe(node);
      setHeaderHeight(node.getBoundingClientRect().height);
    }
  }, []);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      const catStr = String(p.categories || "");
      if (catStr) {
        catStr.split(',').forEach(c => cats.add(c.trim()));
      }
    });
    return Array.from(cats).filter(Boolean).sort();
  }, [products]);

  const ageOptions = [
    { value: "all", label: "כל זמני המדף" },
    { value: "green", label: "פחות משבועיים" },
    { value: "yellow", label: "14-30 ימים" },
    { value: "orange", label: "30-45 ימים" },
    { value: "dark_orange", label: "45-90 ימים" },
    { value: "red", label: "מעל 90 יום" },
  ];

  const sortLabels: Record<SortMode, string> = {
    color_desc: "זמן מדף: ישן לחדש",
    color_asc: "זמן מדף: חדש לישן",
    name_asc: "שם: א ← ת",
    name_desc: "שם: ת ← א",
    inspection_asc: "תאריך בקרה: ישן ← חדש",
    inspection_desc: "תאריך בקרה: חדש ← ישן",
    price_asc: "תאריך תמחור: ישן ← חדש",
    price_desc: "תאריך תמחור: חדש ← ישן",
    last_sale_date_desc: "תאריך מכירה: חדש ← ישן",
    last_sale_date_asc: "תאריך מכירה: ישן ← חדש",
    rating_desc: "דירוג: גבוה לנמוך",
    rating_asc: "דירוג: נמוך לגבוה",
  };

  const processedProducts = useMemo(() => {
    return products.map(p => {
      let rating = 0;
      
      const currentStock = Number(p.currentStock) || 0;
      const totalSales = Number(p.totalSales) || 0;
      const ageDays = Number(p.ageDays) || 0;
      
      const totalOrdered = currentStock + totalSales;
      const progressRatio = totalOrdered > 0 ? (totalSales / totalOrdered) : 0;
      
      // משקל של 2 נקודות לאחוז ההתקדמות
      const percentageScore = progressRatio * 2;
      
      // משקל של 1.5 נקודות לנפח המכירות האבסולוטי (מקסימום ניקוד למי שמכר 100 יחידות ומעלה)
      const volumeScore = Math.min(totalSales / 100, 1) * 1.5;
      
      rating += percentageScore + volumeScore;
      
      if (ageDays <= 30) rating += 3;
      else if (ageDays <= 90) rating += 2;
      else if (ageDays <= 180) rating += 1;
      
      if (p.lastSaleDate) {
        const daysSinceSale = (new Date().getTime() - new Date(p.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSale <= 7) rating += 2.5;
        else if (daysSinceSale <= 14) rating += 1.5;
        else if (daysSinceSale <= 30) rating += 0.5;
      }

      const catStr = String(p.categories || "");
      if (p.commerceGroup === "מותגי הבית" || catStr.includes("מותגי הבית")) {
        rating += 1;
      }
      
      rating = Math.max(1, Math.min(10, rating));
      
      return { ...p, rating, catStr, currentStock, totalSales, ageDays };
    });
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    let result = [...processedProducts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          String(p.productName || "").toLowerCase().includes(q) ||
          String(p.productSku || "").toLowerCase().includes(q)
      );
    }

    if (categoryFilter.length > 0) {
      result = result.filter(p => {
        if (!p.catStr) return false;
        const pCats = p.catStr.split(',').map(c => c.trim());
        return pCats.some(c => categoryFilter.includes(c));
      });
    }

    if (colorFilter.length > 0) {
      result = result.filter(p => colorFilter.includes(getAgeCategory(p.ageDays).category));
    }

    if (stockFilter !== "all") {
      result = result.filter(p => {
        const inStock = p.currentStock > 0;
        if (stockFilter === "in_stock") return inStock;
        if (stockFilter === "out_of_stock") return !inStock;
        return true;
      });
    }

    result.sort((a, b) => {
      switch (sortMode) {
        case "name_asc":
          return String(a.productName || "").localeCompare(String(b.productName || ""), "he");
        case "name_desc":
          return String(b.productName || "").localeCompare(String(a.productName || ""), "he");
        case "inspection_asc":
          return new Date(a.lastInspectionDate || 0).getTime() - new Date(b.lastInspectionDate || 0).getTime();
        case "inspection_desc":
          return new Date(b.lastInspectionDate || 0).getTime() - new Date(a.lastInspectionDate || 0).getTime();
        case "price_asc":
          return new Date(a.lastPriceStatusDate || 0).getTime() - new Date(b.lastPriceStatusDate || 0).getTime();
        case "price_desc":
          return new Date(b.lastPriceStatusDate || 0).getTime() - new Date(a.lastPriceStatusDate || 0).getTime();
        case "color_asc":
          if (a.ageDays !== b.ageDays) return a.ageDays - b.ageDays;
          return new Date(b.dateAddedToSite || 0).getTime() - new Date(a.dateAddedToSite || 0).getTime();
        case "color_desc":
          if (a.ageDays !== b.ageDays) return b.ageDays - a.ageDays;
          return new Date(a.dateAddedToSite || 0).getTime() - new Date(b.dateAddedToSite || 0).getTime();
        case "last_sale_date_asc":
          return new Date(a.lastSaleDate || 0).getTime() - new Date(b.lastSaleDate || 0).getTime();
        case "last_sale_date_desc":
          return new Date(b.lastSaleDate || 0).getTime() - new Date(a.lastSaleDate || 0).getTime();
        case "rating_asc":
          return (a.rating || 0) - (b.rating || 0);
        case "rating_desc":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [processedProducts, searchQuery, sortMode, categoryFilter, colorFilter, stockFilter]);

  // --- Count per age category (considering stock filter) ---
  const ageCategoryCounts = useMemo(() => {
    const stockFiltered = stockFilter === "all" 
      ? processedProducts 
      : processedProducts.filter(p => stockFilter === "in_stock" ? p.currentStock > 0 : p.currentStock <= 0);
    const counts: Record<string, number> = {};
    for (const opt of ageOptions.slice(1)) {
      counts[opt.value] = stockFiltered.filter(p => getAgeCategory(p.ageDays).category === opt.value).length;
    }
    return counts;
  }, [processedProducts, stockFilter]);

  // --- Summary Cards Calculations ---
  const totalInStock = processedProducts.filter(p => p.currentStock > 0).length;
  const outOfStock = processedProducts.filter(p => p.currentStock <= 0).length;
  const needsAttention = processedProducts.filter(p => p.rating && p.rating < 4).length;
  const zeroSales = processedProducts.filter(p => p.totalSales === 0).length;

  const renderFiltersAndSearch = () => (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="חיפוש מוצר..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 border border-white/10 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50"
            dir="rtl"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 border border-white/10 rounded-lg text-sm text-slate-200 hover:bg-white/5"
        >
          <Filter className="w-4 h-4" />
          מיון
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <div className="hidden md:flex items-center gap-2">
          <Select value={stockFilter} onValueChange={(v) => setStockFilter(v || "in_stock")}>
            <SelectTrigger className="w-[140px] h-10 border-white/10 bg-white/5 text-white text-right" dir="rtl">
              <SelectValue placeholder="מצב מלאי">{stockFilterLabels[stockFilter] || "מצב מלאי"}</SelectValue>
            </SelectTrigger>
            <SelectContent align="end" dir="rtl">
              <SelectItem value="all">כל מצבי המלאי</SelectItem>
              <SelectItem value="in_stock">במלאי</SelectItem>
              <SelectItem value="out_of_stock">אזל מהמלאי</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger className="flex w-[160px] h-10 items-center justify-between rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" dir="rtl">
                <span className="truncate">
                  {categoryFilter.length === 0 ? 'כל הקטגוריות' : categoryFilter.length === 1 ? categoryFilter[0] : `${categoryFilter.length} קטגוריות`}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="end" dir="rtl">
              <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
                {uniqueCategories.map(c => (
                  <label key={c} className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded cursor-pointer">
                    <input type="checkbox" checked={categoryFilter.includes(c)} onChange={() => toggleFilter(setCategoryFilter, c)} className="w-4 h-4 accent-blue-500 rounded border-white/20" />
                    <span className="text-sm">{c}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger className="flex w-[160px] h-10 items-center justify-between rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" dir="rtl">
                <span className="truncate">
                  {colorFilter.length === 0 ? 'כל זמני המדף' : colorFilter.length === 1 ? ageOptions.find(o => o.value === colorFilter[0])?.label : `${colorFilter.length} זמני מדף`}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="end" dir="rtl">
              <div className="flex flex-col gap-1">
                {ageOptions.slice(1).map(c => (
                  <label key={c.value} className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded cursor-pointer">
                    <input type="checkbox" checked={colorFilter.includes(c.value)} onChange={() => toggleFilter(setColorFilter, c.value)} className="w-4 h-4 accent-blue-500 rounded border-white/20" />
                    <span className="text-sm flex-1">{c.label}</span>
                    <span className="text-xs text-slate-400">{ageCategoryCounts[c.value] || 0}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[180px] h-10 border-white/10 bg-white/5 text-white text-right" dir="rtl">
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
        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v || "in_stock")}>
          <SelectTrigger className="w-full h-10 border-white/10 bg-white/5 text-white text-right" dir="rtl">
            <SelectValue placeholder="מצב מלאי">{stockFilterLabels[stockFilter] || "מצב מלאי"}</SelectValue>
          </SelectTrigger>
          <SelectContent align="center" className="w-[calc(100vw-3rem)]" dir="rtl">
            <SelectItem value="all">כל מצבי המלאי</SelectItem>
            <SelectItem value="in_stock">במלאי</SelectItem>
            <SelectItem value="out_of_stock">אזל מהמלאי</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger className="flex w-full h-10 items-center justify-between rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" dir="rtl">
              <span className="truncate">
                {categoryFilter.length === 0 ? 'כל הקטגוריות' : categoryFilter.length === 1 ? categoryFilter[0] : `${categoryFilter.length} קטגוריות`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
          </PopoverTrigger>
          <PopoverContent align="center" className="w-[calc(100vw-3rem)] p-2" dir="rtl">
            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
              {uniqueCategories.map(c => (
                <label key={c} className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded cursor-pointer">
                  <input type="checkbox" checked={categoryFilter.includes(c)} onChange={() => toggleFilter(setCategoryFilter, c)} className="w-4 h-4 accent-blue-500 rounded border-white/20" />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger className="flex w-full h-10 items-center justify-between rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" dir="rtl">
              <span className="truncate">
                {colorFilter.length === 0 ? 'כל זמני המדף' : colorFilter.length === 1 ? ageOptions.find(o => o.value === colorFilter[0])?.label : `${colorFilter.length} זמני מדף`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
          </PopoverTrigger>
          <PopoverContent align="center" className="w-[calc(100vw-3rem)] p-2" dir="rtl">
            <div className="flex flex-col gap-1">
              {ageOptions.slice(1).map(c => (
                <label key={c.value} className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded cursor-pointer">
                  <input type="checkbox" checked={colorFilter.includes(c.value)} onChange={() => toggleFilter(setColorFilter, c.value)} className="w-4 h-4 accent-blue-500 rounded border-white/20" />
                  <span className="text-sm flex-1">{c.label}</span>
                  <span className="text-xs text-slate-400">{ageCategoryCounts[c.value] || 0}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <SelectTrigger className="w-full h-10 border-white/10 bg-white/5 text-white text-right" dir="rtl">
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
      {/* Active Filters Display */}
      {(categoryFilter.length > 0 || colorFilter.length > 0 || stockFilter !== "in_stock") && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10">
          <span className="text-xs font-medium text-slate-300">מסננים פעילים:</span>
          {categoryFilter.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-md text-xs transition-colors">
              {c}
              <button onClick={() => toggleFilter(setCategoryFilter, c)} className="hover:text-blue-900 focus:outline-none"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {colorFilter.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-md text-xs transition-colors">
              {ageOptions.find(o => o.value === c)?.label}
              <button onClick={() => toggleFilter(setColorFilter, c)} className="hover:text-purple-900 focus:outline-none"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {stockFilter !== "in_stock" && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 border rounded-md text-xs transition-colors ${stockFilter === "out_of_stock" ? "bg-red-500/20 border-red-500/30 text-red-200" : "bg-white/10 border-white/20 text-slate-200"}`}>
              {stockFilter === "out_of_stock" ? "אזל מהמלאי" : "כל מצבי המלאי"}
              <button onClick={() => setStockFilter("in_stock")} className="hover:opacity-70 focus:outline-none"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(categoryFilter.length > 0 || colorFilter.length > 0 || stockFilter !== "in_stock") && (
            <button onClick={() => { setCategoryFilter([]); setColorFilter([]); setStockFilter("in_stock"); }} className="text-xs text-slate-300 hover:text-white underline mr-auto px-2">
              נקה הכל
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (!isMounted) {
    return null;
  }

  const thClasses = "py-3 px-4 font-medium text-right bg-white border-b border-gray-200 sticky z-20";
  const thStyle = { top: `${Math.max(0, headerHeight)}px`, backgroundClip: "padding-box" };

  return (
    <div className="min-h-screen relative p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">
        {/* Header Bento */}
        <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">בקרת מלאי</h2>
              <p className="text-slate-300 mt-1 text-sm">מעקב גיל מלאי ותמחור למוצרי ליברו</p>
            </div>
          </div>
        </div>

        {/* Stats Bento Cards */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-full">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-300 font-medium">סה״כ מוצרים במלאי</p>
          <h3 className="text-xl md:text-2xl font-bold text-white">{totalInStock}</h3>
        </div>
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <div className="p-2 bg-red-500/20 text-red-300 rounded-full">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-300 font-medium">מוצרים שאזלו מהמלאי</p>
          <h3 className="text-xl md:text-2xl font-bold text-white">{outOfStock}</h3>
        </div>
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <div className="p-2 bg-orange-500/20 text-orange-300 rounded-full">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-300 font-medium">דורשים תשומת לב (דירוג &lt; 4)</p>
          <h3 className="text-xl md:text-2xl font-bold text-white">{needsAttention}</h3>
        </div>
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <div className="p-2 bg-white/10 text-white rounded-full">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-300 font-medium">מוצרים ללא מכירות כלל</p>
          <h3 className="text-xl md:text-2xl font-bold text-white">{zeroSales}</h3>
        </div>

        {/* Filters and Search Bento */}
        <div ref={topSectionRef} className="lg:col-span-12 glass-panel rounded-3xl p-6 flex flex-col gap-4 z-20 relative">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
            <span className="font-medium text-white">דירוג:</span>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">מצוין (8.5-10)</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full">טוב (7-8.5)</span>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">בינוני (5-7)</span>
            <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">טעון שיפור (3.5-5)</span>
            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full">חלש (2-3.5)</span>
            <span className="px-2 py-1 bg-red-500/40 text-red-200 rounded-full">גרוע (1-2)</span>
          </div>
          {renderFiltersAndSearch()}
        </div>

        {/* Table Bento */}
        <div className="lg:col-span-12 glass-panel rounded-3xl p-6 overflow-hidden flex flex-col">
          <div className="text-sm text-slate-300 font-medium md:hidden mb-4">
            סה״כ מוצרים: {filteredAndSorted.length}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block pb-6 overflow-x-auto">
            <div className="relative">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className={`${thClasses} border-r-4 border-transparent w-[14%]`} style={thStyle}>שם המוצר</th>
                    <th className={`${thClasses} w-[8%]`} style={thStyle}>קטגוריה</th>
                    <th className={`${thClasses} w-[8%]`} style={thStyle}>קבוצת קומרס</th>
                    <th className={`${thClasses} text-center w-[5%]`} style={thStyle}>דירוג</th>
                    <th className={`${thClasses} text-center w-[7%] leading-tight`} style={thStyle}>מכר חודש לפני אחרון</th>
                    <th className={`${thClasses} text-center w-[7%] leading-tight`} style={thStyle}>מכר חודש אחרון</th>
                    <th className={`${thClasses} text-center w-[7%] leading-tight`} style={thStyle}>מכר שבוע אחרון</th>
                    <th className={`${thClasses} text-center w-[7%]`} style={thStyle}>כמות במלאי</th>
                    <th className={`${thClasses} text-center w-[7%]`} style={thStyle}>התקדמות</th>
                    <th className={`${thClasses} text-center w-[8%] leading-tight`} style={thStyle}>תאריך בקרת מוצר אחרון</th>
                    <th className={`${thClasses} text-center w-[7%] leading-tight`} style={thStyle}>תאריך שינוי מחיר</th>
                    <th className={`${thClasses} text-center w-[7%] leading-tight`} style={thStyle}>תאריך מכירה אחרון</th>
                    <th className={`${thClasses} text-center w-[8%] leading-tight`} style={thStyle}>זמן חיי מדף</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.length > 0 ? (
                    filteredAndSorted.map((product) => {
                      const style = getAgeCategory(product.ageDays);
                      const ratingStyle = getRatingStyle(product.rating);
                      return (
                        <tr key={product.id} className={`transition-all duration-300 [&>td]:border-b [&>td]:border-white/10 ${ratingStyle.bg}`}>
                          <td className={`py-3 px-4 text-right border-r-4 ${ratingStyle.border}`}>
                            <div className="flex items-center gap-3">
                              {product.productImage ? (
                                <img src={product.productImage} alt={product.productName} className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <a href={`https://libero-il.co.il/?p=${product.wooProductId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline truncate max-w-[200px] block">
                                  {product.productName}
                                </a>
                                {product.productSku && <p className="text-[11px] text-slate-400">מק״ט: {product.productSku}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-slate-200 text-sm">{product.categories || "—"}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-slate-200 text-sm">{product.commerceGroup || "—"}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={ratingStyle.text}>{product.rating?.toFixed(1) || "-"}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.salesMonthBeforeLast}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.salesLastMonth}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.salesLastWeek}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-white">
                            {product.currentStock}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="w-full max-w-[100px] mx-auto bg-white/20 rounded-full h-2 mb-1 relative">
                              {(() => {
                                const totalOrdered = product.currentStock + product.totalSales;
                                const progress = totalOrdered > 0 ? (product.totalSales / totalOrdered) * 100 : 0;
                                return (
                                  <div 
                                    className="bg-blue-400 h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  ></div>
                                );
                              })()}
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap" dir="ltr">
                              {product.totalSales} / {product.currentStock + product.totalSales}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.lastInspectionDate ? format(new Date(product.lastInspectionDate), "dd/MM/yyyy", { locale: he }) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.lastPriceStatusDate ? format(new Date(product.lastPriceStatusDate), "dd/MM/yyyy", { locale: he }) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.lastSaleDate ? format(new Date(product.lastSaleDate), "dd/MM/yyyy", { locale: he }) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.badgeBg} ${style.text}`}>
                                {style.label}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {format(new Date(product.dateAddedToSite), "dd/MM/yyyy", { locale: he })}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                        <p>לא נמצאו מוצרים</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden flex flex-col gap-3 pb-6">
            {filteredAndSorted.length > 0 ? (
              filteredAndSorted.map((product) => {
                const style = getAgeCategory(product.ageDays);
                const ratingStyle = getRatingStyle(product.rating);
                return (
                  <div key={`mobile-${product.id}`} className={`rounded-xl shadow-sm border border-r-4 border-white/10 ${ratingStyle.border} ${ratingStyle.bg.split(' ')[0]}`}>
                    <div className="p-3 flex items-start gap-3 border-b border-white/10">
                      {product.productImage ? (
                        <img src={product.productImage} alt={product.productName} className="w-14 h-14 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <a href={`https://libero-il.co.il/?p=${product.wooProductId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline truncate block">
                          {product.productName}
                        </a>
                        {product.productSku && <p className="text-[11px] text-slate-400 mt-0.5">מק״ט: {product.productSku}</p>}
                        {product.categories && <p className="text-[11px] text-slate-300 mt-0.5 whitespace-nowrap truncate">{product.categories}</p>}
                        {product.commerceGroup && <p className="text-[11px] text-slate-300 mt-0.5 whitespace-nowrap truncate">{product.commerceGroup}</p>}
                      </div>
                      <div className="flex flex-col items-center justify-center bg-white/5 px-3 py-1.5 rounded-lg mr-2">
                        <span className={`text-base leading-none ${ratingStyle.text}`}>{product.rating?.toFixed(1) || "-"}</span>
                        <span className="text-slate-400 text-[10px] font-medium mt-0.5">דירוג</span>
                      </div>
                    </div>
                    <div className="p-3 space-y-2 text-[12px]">
                      <div className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-400">בקרת מוצר:</span>
                        <span>{product.lastInspectionDate ? format(new Date(product.lastInspectionDate), "dd/MM/yyyy", { locale: he }) : "—"}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-400">תמחור אחרון:</span>
                        <span>{product.lastPriceStatusDate ? format(new Date(product.lastPriceStatusDate), "dd/MM/yyyy", { locale: he }) : "—"}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-white/10 text-center">
                        <div>
                          <span className="block text-slate-400 text-[10px]">חודש שעבר</span>
                          <span className="font-medium text-[13px] text-slate-200">{product.salesMonthBeforeLast}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[10px]">מכר 30 יום</span>
                          <span className="font-medium text-[13px] text-slate-200">{product.salesLastMonth}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[10px]">מכר 7 ימים</span>
                          <span className="font-medium text-[13px] text-slate-200">{product.salesLastWeek}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[10px]">במלאי</span>
                          <span className="font-medium text-[13px] text-white">{product.currentStock}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                          <span>התקדמות מכר/מלאי</span>
                          <span dir="ltr">{product.totalSales} / {product.currentStock + product.totalSales}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1.5">
                          {(() => {
                            const totalOrdered = product.currentStock + product.totalSales;
                            const progress = totalOrdered > 0 ? (product.totalSales / totalOrdered) * 100 : 0;
                            return (
                              <div 
                                className="bg-blue-400 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="text-slate-400">חיי מדף:</span>
                        <div className="flex flex-col items-end">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${style.badgeBg} ${style.text}`}>
                            {style.label}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            {format(new Date(product.dateAddedToSite), "dd/MM/yyyy", { locale: he })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p>לא נמצאו מוצרים</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
