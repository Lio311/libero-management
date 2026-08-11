/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useTransition, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  Package,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  SortAsc,
  SortDesc,
  Edit2,
  Check,
  X,
  Loader2,
  Printer,
} from "lucide-react";
import { markProductInspected, updateProductNotes, updateProductPriceStatus } from "@/app/actions/qc-actions";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface QcProduct {
  id: string;
  wooProductId: number;
  productName: string;
  productSku: string | null;
  productImage: string | null;
  notes: string | null;
  priceStatus: string | null;
  priceStatusDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  inspections: { id: string; inspectedAt: Date; inspectedBy: string | null }[];
  lastInspection: Date | null;
  currentStock: number;
  categories?: string;
  commerceGroup?: string;
  dateAddedToSite?: Date | null;
  ageDays?: number | null;
  salesLastWeek?: number | null;
  salesLastMonth?: number | null;
  salesMonthBeforeLast?: number | null;
  totalSales?: number | null;
  lastSaleDate?: Date | null;
  rating?: number;
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

interface QcStats {
  total: number;
  inspected: number;
  needsReinspection: number;
  neverInspected: number;
  pending: number;
}

type FilterMode = "all" | "not_inspected" | "inspected" | "needs_reinspection";
type StockFilterMode = "in_stock" | "out_of_stock" | "all";
type SortMode = "default" | "last_inspection_asc" | "last_inspection_desc" | "name_asc" | "name_desc";

function getProductStatus(product: QcProduct): "never" | "ok" | "warning" {
  if (!product.lastInspection) return "never";
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return new Date(product.lastInspection) < threeMonthsAgo ? "warning" : "ok";
}

function getRowClassName(status: "never" | "ok" | "warning") {
  switch (status) {
    case "ok":
      return "bg-emerald-50/70 hover:bg-emerald-100/70 border-r-4 border-r-emerald-400";
    case "warning":
      return "bg-amber-50/70 hover:bg-amber-100/70 border-r-4 border-r-amber-400";
    default:
      return "bg-white hover:bg-gray-50/80 border-r-4 border-r-gray-200";
  }
}

function getStatusBadge(status: "never" | "ok" | "warning") {
  switch (status) {
    case "ok":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3" />
          תקין
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 whitespace-nowrap">
          <AlertTriangle className="w-3 h-3" />
          דורש בקרה חוזרת
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
          <Clock className="w-3 h-3" />
          לא נבדק
        </span>
      );
  }
}

function ProductRow({ product }: { product: QcProduct }) {
  const [isPending, startTransition] = useTransition();
  const [showHistory, setShowHistory] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(product.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [justInspected, setJustInspected] = useState(false);

  const status = justInspected ? "ok" : getProductStatus(product);
  const ratingStyle = getRatingStyle(product.rating);

  const handleInspect = () => {
    startTransition(async () => {
      await markProductInspected(product.id);
      setJustInspected(true);
    });
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateProductNotes(product.id, notesValue);
      setIsEditingNotes(false);
    } catch (e) {
      console.error(e);
    }
    setIsSavingNotes(false);
  };

  return (
    <>
      {/* Desktop Row */}
      <tr
        className={`transition-all duration-300 ${getRowClassName(status)} hidden md:table-row`}
      >
        {/* Product Name */}
        <td className="py-3 px-4 text-right">
          <div className="flex items-center gap-3">
            {product.productImage ? (
              <img
                src={product.productImage}
                alt={product.productName}
                className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <a 
                href={`https://libero-il.co.il/?p=${product.wooProductId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline line-clamp-2 block"
              >
                {product.productName}
              </a>
              {product.productSku && (
                <p className="text-[11px] text-gray-400">מק״ט: {product.productSku}</p>
              )}
            </div>
          </div>
        </td>

        {/* Rating */}
        <td className="py-3 px-4 text-center whitespace-nowrap">
          <span className={ratingStyle.text}>{product.rating?.toFixed(1) || "-"}</span>
        </td>

        {/* Stock */}
        <td className="py-3 px-4 text-center font-medium text-gray-900 whitespace-nowrap">
          {product.currentStock || 0}
        </td>

        {/* Status */}
        <td className="py-3 px-4 text-center whitespace-nowrap">
          {getStatusBadge(status)}
        </td>

        {/* Inspect Button */}
        <td className="py-3 px-4 text-center whitespace-nowrap">
          <button
            onClick={handleInspect}
            disabled={isPending || justInspected || status === "ok"}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              isPending
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : justInspected || status === "ok"
                ? "bg-green-100 text-green-700 cursor-default shadow-inner"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow active:scale-95"
            }`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : justInspected || status === "ok" ? (
              <>
                <CheckCircle2 className={`w-4 h-4 ${justInspected ? "animate-in zoom-in spin-in-180" : ""}`} />
                <span className={justInspected ? "animate-in fade-in slide-in-from-right-2" : ""}>בוצע</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                בצע בקרה
              </>
            )}
          </button>
        </td>

        {/* Last Inspection */}
        <td className="py-3 px-4 text-center whitespace-nowrap">
          <div className="flex flex-col items-center gap-1">
            {justInspected ? (
              <span className="text-sm text-emerald-600 font-medium">עכשיו</span>
            ) : product.lastInspection ? (
              <span className="text-sm text-gray-700">
                {format(new Date(product.lastInspection), "dd/MM/yyyy", { locale: he })}
              </span>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
            {product.inspections.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-0.5 text-[11px] text-blue-500 hover:text-blue-700 transition-colors"
              >
                {product.inspections.length} בקרות
                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </td>

        {/* Price Status */}
        <td className="py-3 px-4 text-center whitespace-nowrap">
          <div className="flex flex-col items-center gap-1">
            <Select
              value={product.priceStatus || "טרם נבדק"}
              onValueChange={(val) => {
                const newStatus = val === "טרם נבדק" ? null : val;
                startTransition(async () => {
                  await updateProductPriceStatus(product.id, newStatus);
                });
              }}
              disabled={isPending}
            >
              <SelectTrigger className="w-[130px] mx-auto h-8 text-xs bg-white border-gray-200 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="טרם נבדק">טרם נבדק</SelectItem>
                <SelectItem value="בוצע שינוי תמחור">בוצע שינוי תמחור</SelectItem>
                <SelectItem value="לא בוצע שינוי תמחור">לא בוצע שינוי תמחור</SelectItem>
                <SelectItem value="המחיר הושאר זהה">המחיר הושאר זהה</SelectItem>
              </SelectContent>
            </Select>
            {product.priceStatusDate && (
              <span className="text-[10px] text-gray-400">
                {format(new Date(product.priceStatusDate), "dd/MM/yy HH:mm", { locale: he })}
              </span>
            )}
          </div>
        </td>

        {/* Notes */}
        <td className="py-3 px-4 text-right min-w-[200px]">
          {isEditingNotes ? (
            <div className="flex items-center gap-1">
              <input
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                className="flex-1 text-sm border rounded-md px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                dir="rtl"
              />
              <button onClick={handleSaveNotes} disabled={isSavingNotes} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                {isSavingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => { setIsEditingNotes(false); setNotesValue(product.notes || ""); }} className="p-1 text-red-500 hover:bg-red-50 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-1 group cursor-pointer" onClick={() => setIsEditingNotes(true)}>
              <span className="flex-1 min-w-0 text-sm text-gray-600 whitespace-normal break-words leading-tight">{product.notes || "—"}</span>
              <Edit2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
            </div>
          )}
        </td>
      </tr>

      {/* Desktop History Row */}
      {showHistory && (
        <tr className="hidden md:table-row">
          <td colSpan={8} className="px-4 py-2 bg-gray-50/50">
            <div className="flex flex-wrap gap-2 pr-14">
              {product.inspections.map((insp) => (
                <span
                  key={insp.id}
                  className="inline-flex items-center px-2 py-0.5 text-[11px] bg-blue-50 text-blue-600 rounded-full"
                >
                  {format(new Date(insp.inspectedAt), "dd/MM/yyyy HH:mm", { locale: he })}
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}

      {/* Mobile Card */}
      <tr className="md:hidden">
        <td colSpan={8} className="p-0">
          <div className={`m-2 rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${
            status === "ok" ? "border-emerald-200 bg-emerald-50/50" :
            status === "warning" ? "border-amber-200 bg-amber-50/50" :
            "border-gray-200 bg-white"
          }`}>
            <div className="p-3 flex items-start gap-3">
              {product.productImage ? (
                <img src={product.productImage} alt={product.productName} className="w-14 h-14 rounded-lg object-cover border flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <a 
                  href={`https://libero-il.co.il/?p=${product.wooProductId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate block"
                >
                  {product.productName}
                </a>
                {product.productSku && <p className="text-[11px] text-gray-400 mt-0.5">מק״ט: {product.productSku}</p>}
                <div className="mt-1.5 flex flex-wrap gap-2 items-center">
                  {getStatusBadge(status)}
                  <span className="text-[11px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">מלאי: {product.currentStock || 0}</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-gray-50/80 px-3 py-1.5 rounded-lg mr-2">
                <span className={`text-base leading-none ${ratingStyle.text}`}>{product.rating?.toFixed(1) || "-"}</span>
                <span className="text-gray-500 text-[10px] font-medium mt-0.5">דירוג</span>
              </div>
            </div>

            <div className="px-3 pb-2 flex items-center justify-between gap-2 border-t border-gray-100/50 pt-2">
              <div className="text-[11px] text-gray-500">
                {justInspected ? (
                  <span className="text-emerald-600 font-medium">עכשיו</span>
                ) : product.lastInspection ? (
                  <>בקרה אחרונה: {format(new Date(product.lastInspection), "dd/MM/yy", { locale: he })}</>
                ) : (
                  "לא נבדק"
                )}
              </div>
              <button
                onClick={handleInspect}
                disabled={isPending || justInspected}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  justInspected
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-600 text-white active:scale-95"
                }`}
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : justInspected ? <CheckCircle2 className="w-3 h-3" /> : <ClipboardCheck className="w-3 h-3" />}
                {justInspected ? "בוצע!" : "בצע בקרה"}
              </button>
            </div>

            {/* Mobile Price Status */}
            <div className="px-3 pb-2 pt-2 border-t border-gray-100/50 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-500 font-medium">תמחור:</span>
                <Select
                  value={product.priceStatus || "טרם נבדק"}
                  onValueChange={(val) => {
                    const newStatus = val === "טרם נבדק" ? null : val;
                    startTransition(async () => {
                      await updateProductPriceStatus(product.id, newStatus);
                    });
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-[140px] h-7 text-[11px] bg-white border-gray-200 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="טרם נבדק">טרם נבדק</SelectItem>
                    <SelectItem value="בוצע שינוי תמחור">בוצע שינוי תמחור</SelectItem>
                    <SelectItem value="לא בוצע שינוי תמחור">לא בוצע שינוי תמחור</SelectItem>
                    <SelectItem value="המחיר הושאר זהה">המחיר הושאר זהה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {product.priceStatusDate && (
                <div className="text-[10px] text-gray-400 text-left">
                  עודכן: {format(new Date(product.priceStatusDate), "dd/MM/yy HH:mm", { locale: he })}
                </div>
              )}
            </div>

            {/* Mobile Notes */}
            <div className="px-3 pb-3 pt-1">
              {isEditingNotes ? (
                <div className="flex items-center gap-1">
                  <input value={notesValue} onChange={(e) => setNotesValue(e.target.value)} className="flex-1 min-w-0 text-sm border rounded-md px-2 py-1 text-right" autoFocus dir="rtl" />
                  <button onClick={handleSaveNotes} disabled={isSavingNotes} className="p-1 text-emerald-600 flex-shrink-0"><Check className="w-4 h-4" /></button>
                  <button onClick={() => { setIsEditingNotes(false); setNotesValue(product.notes || ""); }} className="p-1 text-red-500 flex-shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-start gap-1 text-[11px] text-gray-500 cursor-pointer" onClick={() => setIsEditingNotes(true)}>
                  <span className="whitespace-normal break-words leading-tight flex-1">{product.notes || "לחץ להוספת הערה"}</span>
                  <Edit2 className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" />
                </div>
              )}
            </div>

            {/* Mobile History */}
            {product.inspections.length > 0 && (
              <div className="px-3 pb-3">
                <button onClick={() => setShowHistory(!showHistory)} className="text-[11px] text-blue-500 flex items-center gap-0.5">
                  היסטוריית {product.inspections.length} בקרות
                  {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showHistory && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {product.inspections.map((insp) => (
                      <span key={insp.id} className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded-full">
                        {format(new Date(insp.inspectedAt), "dd/MM/yy HH:mm", { locale: he })}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}

export default function QcClient({ products, stats }: { products: QcProduct[]; stats: QcStats }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [stockFilterMode, setStockFilterMode] = useState<StockFilterMode>("in_stock");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const initialInspectionRef = useRef<Map<string, Date | null>>(new Map());

  useMemo(() => {
    products.forEach(p => {
      if (!initialInspectionRef.current.has(p.id)) {
        initialInspectionRef.current.set(p.id, p.lastInspection);
      }
    });
  }, [products]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/qc-sync?manual=true");
      const data = await res.json();
      if (data.success) {
        setSyncResult(`סונכרנו ${data.added} מוצרים חדשים (${data.total} סה"כ ב-WooCommerce)`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setSyncResult(`שגיאה: ${data.error}`);
      }
    } catch (e: any) {
      setSyncResult(`שגיאה: ${e.message}`);
    }
    setIsSyncing(false);
  };

  const processedProducts = useMemo(() => {
    return products.map(p => {
      let rating = 0;
      
      const currentStock = Number(p.currentStock) || 0;
      const totalSales = Number(p.totalSales) || 0;
      const ageDays = Number(p.ageDays) || 0;
      
      const totalOrdered = currentStock + totalSales;
      const progressRatio = totalOrdered > 0 ? (totalSales / totalOrdered) : 0;
      
      const percentageScore = progressRatio * 2;
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
      
      return { ...p, rating };
    });
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    let result = [...processedProducts];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          (p.productSku && p.productSku.toLowerCase().includes(q))
      );
    }

    // Filter
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    switch (filterMode) {
      case "not_inspected":
        result = result.filter((p) => {
          const last = initialInspectionRef.current.has(p.id) ? initialInspectionRef.current.get(p.id) : p.lastInspection;
          return !last;
        });
        break;
      case "inspected":
        result = result.filter((p) => {
          const last = initialInspectionRef.current.has(p.id) ? initialInspectionRef.current.get(p.id) : p.lastInspection;
          return last && new Date(last) >= threeMonthsAgo;
        });
        break;
      case "needs_reinspection":
        result = result.filter((p) => {
          const last = initialInspectionRef.current.has(p.id) ? initialInspectionRef.current.get(p.id) : p.lastInspection;
          return last && new Date(last) < threeMonthsAgo;
        });
        break;
    }

    // Stock Filter
    if (stockFilterMode !== "all") {
      result = result.filter(p => {
        const inStock = (p.currentStock || 0) > 0;
        return stockFilterMode === "in_stock" ? inStock : !inStock;
      });
    }

    // Sort
    switch (sortMode) {
      case "last_inspection_asc":
        result.sort((a, b) => {
          const aLast = initialInspectionRef.current.has(a.id) ? initialInspectionRef.current.get(a.id) : a.lastInspection;
          const bLast = initialInspectionRef.current.has(b.id) ? initialInspectionRef.current.get(b.id) : b.lastInspection;
          if (!aLast && !bLast) return 0;
          if (!aLast) return -1;
          if (!bLast) return 1;
          return new Date(aLast).getTime() - new Date(bLast).getTime();
        });
        break;
      case "last_inspection_desc":
        result.sort((a, b) => {
          const aLast = initialInspectionRef.current.has(a.id) ? initialInspectionRef.current.get(a.id) : a.lastInspection;
          const bLast = initialInspectionRef.current.has(b.id) ? initialInspectionRef.current.get(b.id) : b.lastInspection;
          if (!aLast && !bLast) return 0;
          if (!aLast) return 1;
          if (!bLast) return -1;
          return new Date(bLast).getTime() - new Date(aLast).getTime();
        });
        break;
      case "name_asc":
        result.sort((a, b) => a.productName.localeCompare(b.productName, "he"));
        break;
      case "name_desc":
        result.sort((a, b) => b.productName.localeCompare(a.productName, "he"));
        break;
      default:
        // Default: never inspected first, then needs reinspection (oldest first), then recently inspected
        result.sort((a, b) => {
          const aLast = initialInspectionRef.current.has(a.id) ? initialInspectionRef.current.get(a.id) : a.lastInspection;
          const bLast = initialInspectionRef.current.has(b.id) ? initialInspectionRef.current.get(b.id) : b.lastInspection;
          
          const getStatus = (last: Date | null | undefined) => {
            if (!last) return "never";
            const threeMonthsAgoDate = new Date();
            threeMonthsAgoDate.setMonth(threeMonthsAgoDate.getMonth() - 3);
            return new Date(last) < threeMonthsAgoDate ? "warning" : "ok";
          };

          const statusA = getStatus(aLast);
          const statusB = getStatus(bLast);
          const order = { never: 0, warning: 1, ok: 2 };
          if (order[statusA] !== order[statusB]) return order[statusA] - order[statusB];
          if (!aLast && !bLast) return a.productName.localeCompare(b.productName, "he");
          if (!aLast) return -1;
          if (!bLast) return 1;
          return new Date(aLast).getTime() - new Date(bLast).getTime();
        });
    }

    return result;
  }, [products, searchQuery, filterMode, sortMode, stockFilterMode]);

  const todayInspectedCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return products.filter((p) =>
      p.inspections.some((i) => new Date(i.inspectedAt) >= today)
    ).length;
  }, [products]);

  const dynamicStats = useMemo(() => {
    let baseProducts = products;
    if (stockFilterMode !== "all") {
      baseProducts = baseProducts.filter(p => {
        const inStock = (p.currentStock || 0) > 0;
        return stockFilterMode === "in_stock" ? inStock : !inStock;
      });
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    let inspected = 0;
    let needsReinspection = 0;
    let neverInspected = 0;

    for (const p of baseProducts) {
      if (!p.lastInspection) {
        neverInspected++;
      } else if (new Date(p.lastInspection) < threeMonthsAgo) {
        needsReinspection++;
      } else {
        inspected++;
      }
    }

    return {
      total: baseProducts.length,
      inspected,
      needsReinspection,
      neverInspected,
      pending: neverInspected + needsReinspection,
    };
  }, [products, stockFilterMode]);

  const filterOptions: { key: FilterMode; label: string; count: number }[] = [
    { key: "all", label: "הכל", count: dynamicStats.total },
    { key: "not_inspected", label: "לא נבדקו", count: dynamicStats.neverInspected },
    { key: "needs_reinspection", label: "דורשים בקרה חוזרת", count: dynamicStats.needsReinspection },
    { key: "inspected", label: "תקינים", count: dynamicStats.inspected },
  ];

  const sortLabels: Record<SortMode, string> = {
    default: "ברירת מחדל",
    last_inspection_asc: "תאריך בקרה: ישן ← חדש",
    last_inspection_desc: "תאריך בקרה: חדש ← ישן",
    name_asc: "שם: א ← ת",
    name_desc: "שם: ת ← א",
  };

  const stockFilterLabels: Record<StockFilterMode, string> = {
    in_stock: "במלאי",
    out_of_stock: "אזל מהמלאי",
    all: "כל מצבי המלאי",
  };

  return (
    <>
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen print:hidden" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">בקרת מוצרים</h2>
          <p className="text-muted-foreground mt-1 text-sm">מעקב ובקרת איכות למוצרי ליברו</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const printWindow = window.open('', '', 'width=800,height=600');
              if (!printWindow) return;
              
              const html = `
                <html dir="rtl" lang="he">
                  <head>
                    <title>דוח בקרת מוצרים</title>
                    <style>
                      body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
                      table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                      th, td { border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 14px; }
                      th { background-color: #f8f9fa; font-weight: bold; }
                      a { color: #2563eb; text-decoration: underline; }
                      h1 { font-size: 24px; margin-bottom: 20px; text-align: center; }
                      .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 500; }
                      .badge-ok { background-color: #d1fae5; color: #047857; }
                      .badge-warning { background-color: #fef3c7; color: #b45309; }
                      .badge-never { background-color: #f3f4f6; color: #4b5563; }
                      @media print {
                        body { padding: 0; }
                        button { display: none; }
                      }
                    </style>
                  </head>
                  <body>
                    <h1>דוח בקרת מוצרים</h1>
                    <table>
                      <thead>
                        <tr>
                          <th>שם המוצר</th>
                          <th>דירוג</th>
                          <th>במלאי</th>
                          <th>סטטוס</th>
                          <th>תאריך בקרה אחרון</th>
                          <th>תמחור</th>
                          <th>הערות</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredAndSorted.map(p => {
                          const status = p.lastInspection 
                            ? (new Date(p.lastInspection) < new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) ? 'warning' : 'ok') 
                            : 'never';
                          const statusText = status === 'ok' ? 'תקין' : status === 'warning' ? 'דורש בקרה חוזרת' : 'לא נבדק';
                          const lastInsp = p.lastInspection ? new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(p.lastInspection)) : '-';
                          const priceDate = p.priceStatusDate ? new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(p.priceStatusDate)) : '';
                          
                          return `
                          <tr>
                            <td>
                              <strong><a href="https://libero-il.co.il/?p=${p.wooProductId}" target="_blank">${p.productName}</a></strong>
                              ${p.productSku ? '<br><small style="color: #666" dir="ltr">' + p.productSku + '</small>' : ''}
                            </td>
                            <td style="text-align: center">${p.rating?.toFixed(1) || '-'}</td>
                            <td style="text-align: center">${p.currentStock || 0}</td>
                            <td style="text-align: center"><span class="badge badge-${status}">${statusText}</span></td>
                            <td style="text-align: center">${lastInsp}</td>
                            <td style="text-align: center">${p.priceStatus || 'טרם נבדק'}${priceDate ? '<br><small style="color: #666">' + priceDate + '</small>' : ''}</td>
                            <td>${p.notes || ''}</td>
                          </tr>
                        `}).join('')}
                      </tbody>
                    </table>
                    <script>
                      window.onload = () => {
                        window.print();
                        setTimeout(() => window.close(), 500);
                      };
                    </script>
                  </body>
                </html>
              `;
              printWindow.document.write(html);
              printWindow.document.close();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4" />
            דוח PDF
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "מסנכרן..." : "סנכרון מוצרים"}
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={`p-3 rounded-lg text-sm ${syncResult.includes("שגיאה") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {syncResult}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">סה&quot;כ מוצרים</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-gray-900">{dynamicStats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">עברו בקרה</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-emerald-600">{dynamicStats.inspected}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">ממתינים</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-amber-600">{dynamicStats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">בקרות היום</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-blue-600">
              {todayInspectedCount}
              <span className="text-sm font-normal text-gray-400">/100</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">התקדמות בקרה יומית</span>
          <span className="text-sm text-gray-500">{todayInspectedCount}/100</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min((todayInspectedCount / 100) * 100, 100)}%`,
              background: todayInspectedCount >= 100
                ? "linear-gradient(90deg, #10b981, #059669)"
                : todayInspectedCount >= 70
                ? "linear-gradient(90deg, #3b82f6, #2563eb)"
                : todayInspectedCount >= 30
                ? "linear-gradient(90deg, #f59e0b, #d97706)"
                : "linear-gradient(90deg, #ef4444, #dc2626)",
            }}
          />
        </div>
      </div>

      {/* Table Card */}
      <Card className="bg-white border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
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

            {/* Filters Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
            >
              <Filter className="w-4 h-4" />
              סינון ומיון
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Sort (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="w-[200px] h-10 border-gray-200 bg-white">
                  <SelectValue placeholder="בחר מיון">
                    {sortLabels[sortMode]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="default">ברירת מחדל</SelectItem>
                  <SelectItem value="last_inspection_asc">תאריך בקרה: ישן ← חדש</SelectItem>
                  <SelectItem value="last_inspection_desc">תאריך בקרה: חדש ← ישן</SelectItem>
                  <SelectItem value="name_asc">שם: א ← ת</SelectItem>
                  <SelectItem value="name_desc">שם: ת ← א</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={stockFilterMode} onValueChange={(v) => setStockFilterMode(v as StockFilterMode)}>
                <SelectTrigger className="w-[140px] h-10 border-gray-200 bg-white">
                  <SelectValue placeholder="מלאי">
                    {stockFilterLabels[stockFilterMode]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="in_stock">במלאי</SelectItem>
                  <SelectItem value="out_of_stock">אזל מהמלאי</SelectItem>
                  <SelectItem value="all">הכל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Pills + Mobile Sort */}
          <div className={`flex flex-col gap-3 mt-3 ${showFilters ? "block" : "hidden md:block"}`}>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilterMode(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    filterMode === key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    filterMode === key ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Mobile Sort */}
            <div className="md:hidden">
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="w-full h-10 border-gray-200 bg-white">
                  <SelectValue placeholder="בחר מיון">
                    {sortLabels[sortMode]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="center" className="w-[calc(100vw-3rem)]">
                  <SelectItem value="default">ברירת מחדל</SelectItem>
                  <SelectItem value="last_inspection_asc">תאריך בקרה: ישן ← חדש</SelectItem>
                  <SelectItem value="last_inspection_desc">תאריך בקרה: חדש ← ישן</SelectItem>
                  <SelectItem value="name_asc">שם: א ← ת</SelectItem>
                  <SelectItem value="name_desc">שם: ת ← א</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2" />
              <Select value={stockFilterMode} onValueChange={(v) => setStockFilterMode(v as StockFilterMode)}>
                <SelectTrigger className="w-full h-10 border-gray-200 bg-white">
                  <SelectValue placeholder="מלאי">
                    {stockFilterLabels[stockFilterMode]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="center" className="w-[calc(100vw-3rem)]">
                  <SelectItem value="in_stock">במלאי</SelectItem>
                  <SelectItem value="out_of_stock">אזל מהמלאי</SelectItem>
                  <SelectItem value="all">הכל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 md:px-6 md:pb-6">
          <div className="w-full">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/90 text-muted-foreground hidden md:table-header-group sticky top-0 z-20 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="py-3 px-4 font-medium text-right rounded-tr-md min-w-[150px] w-1/4">שם המוצר</th>
                  <th className="py-3 px-4 font-medium text-center whitespace-nowrap">דירוג</th>
                  <th className="py-3 px-4 font-medium text-center whitespace-nowrap">כמות במלאי</th>
                  <th className="py-3 px-4 font-medium text-center whitespace-nowrap">סטטוס</th>
                  <th className="py-3 px-4 font-medium text-center whitespace-nowrap">בקרה</th>
                  <th className="py-3 px-4 font-medium text-center whitespace-nowrap">תאריך בקרה אחרון</th>
                  <th className="py-3 px-4 font-medium text-center whitespace-nowrap">תמחור</th>
                  <th className="py-3 px-4 font-medium text-right rounded-tl-md min-w-[200px] w-1/4">הערות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSorted.length > 0 ? (
                  filteredAndSorted.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>לא נמצאו מוצרים</p>
                      <p className="text-xs mt-1">נסה לסנכרן מוצרים מ-WooCommerce</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Results count */}
          {filteredAndSorted.length > 0 && (
            <div className="text-center py-3 text-xs text-gray-400 border-t border-gray-100 mt-2">
              מציג {filteredAndSorted.length} מתוך {products.length} מוצרים
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    
    {/* Print Report */}
    <div className="hidden print:block p-8 bg-white" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">דוח הערות - בקרת איכות</h1>
        <p className="text-gray-500">תאריך הפקה: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: he })}</p>
      </div>
      
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="py-2 px-4 font-bold text-gray-900 w-1/3">שם המוצר</th>
            <th className="py-2 px-4 font-bold text-gray-900 w-1/4">קישור</th>
            <th className="py-2 px-4 font-bold text-gray-900 w-5/12">הערות</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSorted
            .filter(p => p.notes && p.notes.trim().length > 0)
            .map((p, idx) => (
            <tr key={p.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="py-3 px-4 border-b border-gray-200">
                <span className="font-medium text-gray-900">{p.productName}</span>
                {p.productSku && <div className="text-sm text-gray-500">מק״ט: {p.productSku}</div>}
              </td>
              <td className="py-3 px-4 border-b border-gray-200">
                <a 
                  href={`https://libero-il.co.il/?p=${p.wooProductId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  קישור למוצר
                </a>
              </td>
              <td className="py-3 px-4 border-b border-gray-200 text-gray-700 whitespace-pre-wrap">
                {p.notes}
              </td>
            </tr>
          ))}
          {filteredAndSorted.filter(p => p.notes && p.notes.trim().length > 0).length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-gray-500 italic">
                אין מוצרים עם הערות בסינון הנוכחי.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </>
  );
}
