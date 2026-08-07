/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useTransition, useMemo } from "react";
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
}

interface QcStats {
  total: number;
  inspected: number;
  needsReinspection: number;
  neverInspected: number;
  pending: number;
}

type FilterMode = "all" | "not_inspected" | "inspected" | "needs_reinspection";
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          תקין
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
          <AlertTriangle className="w-3 h-3" />
          דורש בקרה חוזרת
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
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
            <div className="min-w-0">
              <a 
                href={`https://libero-il.co.il/?p=${product.wooProductId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px] block"
              >
                {product.productName}
              </a>
              {product.productSku && (
                <p className="text-[11px] text-gray-400">מק״ט: {product.productSku}</p>
              )}
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="py-3 px-4 text-center">
          {getStatusBadge(status)}
        </td>

        {/* Inspect Button */}
        <td className="py-3 px-4 text-center">
          <button
            onClick={handleInspect}
            disabled={isPending || justInspected || status === "ok"}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
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
        <td className="py-3 px-4 text-center">
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
        <td className="py-3 px-4 text-center">
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
              <SelectTrigger className="w-[140px] mx-auto h-8 text-xs bg-white border-gray-200 focus:ring-0 focus:ring-offset-0">
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
        <td className="py-3 px-4 text-right">
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
            <div className="flex items-center gap-1 group cursor-pointer" onClick={() => setIsEditingNotes(true)}>
              <span className="text-sm text-gray-600 truncate max-w-[200px]">{product.notes || "—"}</span>
              <Edit2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </div>
          )}
        </td>
      </tr>

      {/* Desktop History Row */}
      {showHistory && (
        <tr className="hidden md:table-row">
          <td colSpan={5} className="px-4 py-2 bg-gray-50/50">
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
        <td colSpan={5} className="p-0">
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
                <div className="mt-1.5">{getStatusBadge(status)}</div>
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
                  <input value={notesValue} onChange={(e) => setNotesValue(e.target.value)} className="flex-1 text-sm border rounded-md px-2 py-1 text-right" autoFocus dir="rtl" />
                  <button onClick={handleSaveNotes} disabled={isSavingNotes} className="p-1 text-emerald-600"><Check className="w-4 h-4" /></button>
                  <button onClick={() => { setIsEditingNotes(false); setNotesValue(product.notes || ""); }} className="p-1 text-red-500"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer" onClick={() => setIsEditingNotes(true)}>
                  <span className="truncate">{product.notes || "לחץ להוספת הערה"}</span>
                  <Edit2 className="w-3 h-3 text-gray-300 flex-shrink-0" />
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
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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

  const filteredAndSorted = useMemo(() => {
    let result = [...products];

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
        result = result.filter((p) => !p.lastInspection);
        break;
      case "inspected":
        result = result.filter((p) => p.lastInspection && new Date(p.lastInspection) >= threeMonthsAgo);
        break;
      case "needs_reinspection":
        result = result.filter((p) => p.lastInspection && new Date(p.lastInspection) < threeMonthsAgo);
        break;
    }

    // Sort
    switch (sortMode) {
      case "last_inspection_asc":
        result.sort((a, b) => {
          if (!a.lastInspection && !b.lastInspection) return 0;
          if (!a.lastInspection) return -1;
          if (!b.lastInspection) return 1;
          return new Date(a.lastInspection).getTime() - new Date(b.lastInspection).getTime();
        });
        break;
      case "last_inspection_desc":
        result.sort((a, b) => {
          if (!a.lastInspection && !b.lastInspection) return 0;
          if (!a.lastInspection) return 1;
          if (!b.lastInspection) return -1;
          return new Date(b.lastInspection).getTime() - new Date(a.lastInspection).getTime();
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
          const statusA = getProductStatus(a);
          const statusB = getProductStatus(b);
          const order = { never: 0, warning: 1, ok: 2 };
          if (order[statusA] !== order[statusB]) return order[statusA] - order[statusB];
          if (!a.lastInspection && !b.lastInspection) return a.productName.localeCompare(b.productName, "he");
          if (!a.lastInspection) return -1;
          if (!b.lastInspection) return 1;
          return new Date(a.lastInspection).getTime() - new Date(b.lastInspection).getTime();
        });
    }

    return result;
  }, [products, searchQuery, filterMode, sortMode]);

  const todayInspectedCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return products.filter((p) =>
      p.inspections.some((i) => new Date(i.inspectedAt) >= today)
    ).length;
  }, [products]);

  const filterOptions: { key: FilterMode; label: string; count: number }[] = [
    { key: "all", label: "הכל", count: products.length },
    { key: "not_inspected", label: "לא נבדקו", count: stats.neverInspected },
    { key: "needs_reinspection", label: "דורשים בקרה חוזרת", count: stats.needsReinspection },
    { key: "inspected", label: "תקינים", count: stats.inspected },
  ];

  const sortLabels: Record<SortMode, string> = {
    default: "ברירת מחדל",
    last_inspection_asc: "תאריך בקרה: ישן ← חדש",
    last_inspection_desc: "תאריך בקרה: חדש ← ישן",
    name_asc: "שם: א ← ת",
    name_desc: "שם: ת ← א",
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">בקרת מוצרים</h2>
          <p className="text-muted-foreground mt-1 text-sm">מעקב ובקרת איכות למוצרי ליברו</p>
        </div>
        <div className="flex items-center gap-2">
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
            <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">עברו בקרה</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-emerald-600">{stats.inspected}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">ממתינים</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-amber-600">{stats.pending}</div>
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
                : "linear-gradient(90deg, #3b82f6, #2563eb)",
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
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 md:px-6 md:pb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-muted-foreground hidden md:table-header-group">
                <tr>
                  <th className="py-3 px-4 font-medium text-right rounded-tr-md">שם המוצר</th>
                  <th className="py-3 px-4 font-medium text-center">סטטוס</th>
                  <th className="py-3 px-4 font-medium text-center">בקרה</th>
                  <th className="py-3 px-4 font-medium text-center">תאריך בקרה אחרון</th>
                  <th className="py-3 px-4 font-medium text-center">תמחור</th>
                  <th className="py-3 px-4 font-medium text-right rounded-tl-md">הערות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSorted.length > 0 ? (
                  filteredAndSorted.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
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
  );
}
