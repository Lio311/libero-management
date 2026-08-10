"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown, ChevronUp, Filter, Package, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
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
  if (days > 90) return { category: "red", label: "מעל 90 יום", bg: "bg-red-50/70 hover:bg-red-100/70", text: "text-red-700", border: "border-red-400", badgeBg: "bg-red-100" };
  if (days >= 45) return { category: "dark_orange", label: "45-90 ימים", bg: "bg-orange-50/70 hover:bg-orange-100/70", text: "text-orange-800", border: "border-orange-500", badgeBg: "bg-orange-200" };
  if (days >= 30) return { category: "orange", label: "30-45 ימים", bg: "bg-orange-50/70 hover:bg-orange-100/70", text: "text-orange-600", border: "border-orange-400", badgeBg: "bg-orange-100" };
  if (days >= 14) return { category: "yellow", label: "14-30 ימים", bg: "bg-yellow-50/70 hover:bg-yellow-100/70", text: "text-yellow-700", border: "border-yellow-400", badgeBg: "bg-yellow-100" };
  return { category: "green", label: "פחות משבועיים", bg: "bg-emerald-50/70 hover:bg-emerald-100/70", text: "text-emerald-700", border: "border-emerald-400", badgeBg: "bg-emerald-100" };
}

function getRatingStyle(rating: number | undefined) {
  if (rating === undefined) return { text: "text-gray-400", bg: "bg-gray-50/70 hover:bg-gray-100/70", border: "border-r-gray-200" };
  if (rating >= 8.5) return { text: "text-emerald-600 font-medium", bg: "bg-emerald-50/70 hover:bg-emerald-100/70", border: "border-r-emerald-400" };
  if (rating >= 7) return { text: "text-green-500 font-medium", bg: "bg-green-50/70 hover:bg-green-100/70", border: "border-r-green-400" };
  if (rating >= 5) return { text: "text-yellow-600 font-medium", bg: "bg-yellow-50/70 hover:bg-yellow-100/70", border: "border-r-yellow-400" };
  if (rating >= 3.5) return { text: "text-orange-500 font-medium", bg: "bg-orange-50/70 hover:bg-orange-100/70", border: "border-r-orange-400" };
  if (rating >= 2) return { text: "text-red-500 font-medium", bg: "bg-red-50/70 hover:bg-red-100/70", border: "border-r-red-400" };
  return { text: "text-red-700 font-medium", bg: "bg-red-100/70 hover:bg-red-200/70", border: "border-r-red-500" };
}

export default function QcInventoryClient({ products }: { products: InventoryProduct[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("color_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("in_stock");

  const topSectionRef = React.useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  React.useEffect(() => {
    if (!topSectionRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setHeaderHeight(entry.target.getBoundingClientRect().height);
      }
    });
    observer.observe(topSectionRef.current);
    return () => observer.disconnect();
  }, []);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categories) cats.add(p.categories);
    });
    return Array.from(cats).sort();
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
      
      const totalOrdered = p.currentStock + p.totalSales;
      const progressRatio = totalOrdered > 0 ? (p.totalSales / totalOrdered) : 0;
      
      // משקל של 2 נקודות לאחוז ההתקדמות
      const percentageScore = progressRatio * 2;
      
      // משקל של 1.5 נקודות לנפח המכירות האבסולוטי (מקסימום ניקוד למי שמכר 100 יחידות ומעלה)
      const volumeScore = Math.min(p.totalSales / 100, 1) * 1.5;
      
      rating += percentageScore + volumeScore;
      
      if (p.ageDays <= 30) rating += 3;
      else if (p.ageDays <= 90) rating += 2;
      else if (p.ageDays <= 180) rating += 1;
      
      if (p.lastSaleDate) {
        const daysSinceSale = (new Date().getTime() - new Date(p.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSale <= 7) rating += 2.5;
        else if (daysSinceSale <= 14) rating += 1.5;
        else if (daysSinceSale <= 30) rating += 0.5;
      }

      if (p.commerceGroup === "מותגי הבית" || p.categories?.includes("מותגי הבית")) {
        rating += 1;
      }
      
      rating = Math.max(1, Math.min(10, rating));
      
      return { ...p, rating };
    });
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    let result = [...processedProducts];

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
        case "last_sale_date_asc":
          if (!a.lastSaleDate) return -1;
          if (!b.lastSaleDate) return 1;
          return new Date(a.lastSaleDate).getTime() - new Date(b.lastSaleDate).getTime();
        case "last_sale_date_desc":
          if (!a.lastSaleDate) return 1;
          if (!b.lastSaleDate) return -1;
          return new Date(b.lastSaleDate).getTime() - new Date(a.lastSaleDate).getTime();
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

  // --- Summary Cards Calculations ---
  const totalInStock = processedProducts.filter(p => p.currentStock > 0).length;
  const outOfStock = processedProducts.filter(p => p.currentStock <= 0).length;
  const needsAttention = processedProducts.filter(p => p.rating && p.rating < 4).length;
  const zeroSales = processedProducts.filter(p => p.totalSales === 0).length;

  const renderFiltersAndSearch = () => (
    <div className="w-full">
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
              <SelectValue placeholder="זמן מדף">
                {ageOptions.find(c => c.value === colorFilter)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end" dir="rtl">
              {ageOptions.map(c => (
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
            <SelectValue placeholder="זמן מדף">
              {ageOptions.find(c => c.value === colorFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="center" className="w-[calc(100vw-3rem)]" dir="rtl">
            {ageOptions.map(c => (
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
    </div>
  );

  return (
    <div className="bg-gray-50/50 min-h-screen flex flex-col" dir="rtl">
      {/* Header and Stats - Not Sticky */}
      <div className="pt-4 md:pt-8 px-4 md:px-8 space-y-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">בקרת מלאי</h2>
            <p className="text-muted-foreground mt-1 text-sm mb-3">מעקב גיל מלאי ותמחור למוצרי ליברו</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-gray-500">דירוג:</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">מצוין (8.5-10)</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">טוב (7-8.5)</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">בינוני (5-7)</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">טעון שיפור (3.5-5)</span>
              <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full">חלש (2-3.5)</span>
              <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full">גרוע (1-2)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 font-medium">סה״כ מוצרים במלאי</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">{totalInStock}</h3>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 font-medium">מוצרים שאזלו (Out of Stock)</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">{outOfStock}</h3>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 font-medium">דורשים תשומת לב (דירוג &lt; 4)</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">{needsAttention}</h3>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-full">
                <Package className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 font-medium">מוצרים ללא מכירות כלל</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">{zeroSales}</h3>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Filters Section */}
      <div ref={topSectionRef} className="sticky top-0 z-[60] bg-white pb-4 pt-4 px-4 md:px-8 shadow-sm border-b border-gray-200">
        {renderFiltersAndSearch()}
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-8 pt-4 md:pt-6">
        <Card className="bg-white border-none shadow-sm overflow-visible">
          <div className="mt-4 text-sm text-gray-500 font-medium md:hidden mb-4 px-4">
            סה״כ מוצרים: {filteredAndSorted.length}
          </div>

          <CardContent className="p-0 md:px-6 md:pb-6">
            <div className="relative md:border rounded-md">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="hidden md:table-header-group">
                <tr className="bg-white [&>th]:border-b [&>th]:border-b-gray-200">
                  <th className="py-3 px-4 font-medium text-right rounded-tr-md bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>שם המוצר</th>
                  <th className="py-3 px-4 font-medium text-right bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>קטגוריה</th>
                  <th className="py-3 px-4 font-medium text-right bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>קבוצת קומרס</th>
                  <th className="py-3 px-4 font-medium text-center bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>דירוג</th>
                  <th className="py-3 px-4 font-medium text-center bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>מכר חודש לפני אחרון</th>
                  <th className="py-3 px-4 font-medium text-center bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>מכר חודש אחרון</th>
                  <th className="py-3 px-4 font-medium text-center bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>מכר שבוע אחרון</th>
                  <th className="py-3 px-4 font-medium text-center bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>התקדמות</th>
                  <th className="py-3 px-4 font-medium text-center bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>תאריך בקרת מוצר אחרון</th>
                  <th className="py-3 px-4 font-medium text-center bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>תאריך תמחור אחרון</th>
                  <th className="py-3 px-4 font-medium text-center bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>תאריך מכירה אחרון</th>
                  <th className="py-3 px-4 font-medium text-center rounded-tl-md bg-white z-40 sticky" style={{ top: `${headerHeight}px` }}>זמן חיי מדף</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.length > 0 ? (
                  filteredAndSorted.map((product) => {
                    const style = getAgeCategory(product.ageDays);
                    const ratingStyle = getRatingStyle(product.rating);
                    return (
                      <tr key={product.id} className={`transition-all duration-300 hidden md:table-row [&>td]:border-b [&>td]:border-b-gray-100 ${ratingStyle.bg}`}>
                        <td className={`py-3 px-4 text-right border-r-4 ${ratingStyle.border}`}>
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
                        <td className="py-3 px-4 text-right">
                          <span className="text-gray-600 text-sm">{product.commerceGroup || "—"}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={ratingStyle.text}>{product.rating?.toFixed(1) || "-"}</span>
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
                          {product.lastSaleDate ? format(new Date(product.lastSaleDate), "dd/MM/yyyy", { locale: he }) : <span className="text-gray-400">—</span>}
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
                    <td colSpan={12} className="py-12 text-center text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>לא נמצאו מוצרים</p>
                    </td>
                  </tr>
                )}
                
                {/* Mobile view lines */}
                {filteredAndSorted.map((product) => {
                  const style = getAgeCategory(product.ageDays);
                  const ratingStyle = getRatingStyle(product.rating);
                  return (
                    <tr key={`mobile-${product.id}`} className="md:hidden border-b-0">
                      <td colSpan={12} className="p-0 border-b-0">
                        <div className={`m-2 rounded-xl shadow-sm border border-r-4 ${ratingStyle.border} ${ratingStyle.bg.split(' ')[0]}`}>
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
                              {product.commerceGroup && <p className="text-[11px] text-gray-500 mt-0.5 whitespace-nowrap truncate">{product.commerceGroup}</p>}
                            </div>
                            <div className="flex flex-col items-center justify-center bg-gray-50/80 px-3 py-1.5 rounded-lg mr-2">
                              <span className={`text-base leading-none ${ratingStyle.text}`}>{product.rating?.toFixed(1) || "-"}</span>
                              <span className="text-gray-500 text-[10px] font-medium mt-0.5">דירוג</span>
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
    </div>
  );
}
