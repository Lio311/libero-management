"use client";

import React, { useState, useMemo } from "react";
import { CustomerControlData } from "@/app/actions/customer-control-actions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowUpDown, Search, Users, UserCheck, ShoppingCart, TrendingUp, Loader2 } from "lucide-react";

type SortKey = 
  | "totalAllTime" 
  | "totalLastYear" 
  | "totalLastMonth" 
  | "homeBrandsAllTime"
  | "homeBrandsLastYear" 
  | "homeBrandsLastMonth"
  | "lastPurchaseDate"
  | "averageCartValue"
  | "orderCount"
  | "fullName";

export default function CustomerControlClient({ initialData }: { initialData: CustomerControlData[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalLastMonth");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false);
  const [generatedLabels, setGeneratedLabels] = useState<{name: string, url: string}[]>([]);


  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit"
    }).format(date);
  };

  const getRowColorClass = (date: Date | null) => {
    if (!date) return "hover:bg-slate-50/80 transition-colors group text-xs";
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
    
    if (diffMonths >= 9) {
      return "bg-red-100/60 hover:bg-red-100 transition-colors group text-xs";
    } else if (diffMonths >= 6) {
      return "bg-orange-100/60 hover:bg-orange-100 transition-colors group text-xs";
    } else if (diffMonths >= 3) {
      return "bg-yellow-100/60 hover:bg-yellow-100 transition-colors group text-xs";
    }
    return "bg-green-100/60 hover:bg-green-100 transition-colors group text-xs";
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...initialData];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        c => 
          c.fullName.toLowerCase().includes(q) || 
          c.email.toLowerCase().includes(q) || 
          c.phone.includes(q)
      );
    }

    result.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA instanceof Date || valB instanceof Date) {
        const timeA = valA instanceof Date ? valA.getTime() : 0;
        const timeB = valB instanceof Date ? valB.getTime() : 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" 
          ? valA.localeCompare(valB, 'he') 
          : valB.localeCompare(valA, 'he');
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      return 0;
    });

    return result;
  }, [initialData, searchQuery, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage, itemsPerPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allVisibleIds = paginatedData.map(c => c.id);
      setSelectedCustomerIds(new Set([...selectedCustomerIds, ...allVisibleIds]));
    } else {
      const newSelected = new Set(selectedCustomerIds);
      paginatedData.forEach(c => newSelected.delete(c.id));
      setSelectedCustomerIds(newSelected);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedCustomerIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCustomerIds(newSelected);
  };

  const isAllVisibleSelected = paginatedData.length > 0 && paginatedData.every(c => selectedCustomerIds.has(c.id));
  const isSomeVisibleSelected = paginatedData.some(c => selectedCustomerIds.has(c.id)) && !isAllVisibleSelected;

  const handleGenerateLabels = async () => {
    if (selectedCustomerIds.size === 0) return;
    
    setIsGeneratingLabels(true);
    try {
      const selectedCustomers = initialData.filter(c => selectedCustomerIds.has(c.id));
      const res = await fetch('/api/lionwheel/create-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: selectedCustomers })
      });
      
      const data = await res.json();
      
      const labels: {name: string, url: string}[] = [];
      if (data.results) {
        data.results.forEach((r: any) => {
          if (r.success && r.data?.label) {
            const cust = selectedCustomers.find(c => c.id === r.customerId);
            labels.push({ name: cust?.fullName || "לקוח", url: r.data.label });
          }
        });
      }
      
      if (labels.length > 0) {
        setGeneratedLabels(labels);
      }
      
      if (!res.ok || !data.allSuccessful) {
        alert("חלק מהמשלוחים או כולם נכשלו. אנא בדוק בקונסול או במערכת LionWheel.");
        console.error("LionWheel results:", data);
      } else {
        alert("משלוחים נוצרו בהצלחה ב-LionWheel!");
        setSelectedCustomerIds(new Set()); // Clear selection on success
      }
    } catch (err) {
      console.error(err);
      alert("שגיאה בתקשורת עם השרת.");
    } finally {
      setIsGeneratingLabels(false);
    }
  };

  // --- Summary Cards Calculations ---
  const now = new Date();
  const totalCustomers = initialData.length;
  const activeCustomers = initialData.filter(c => {
    if (!c.lastPurchaseDate) return false;
    return (now.getTime() - c.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44) <= 3;
  }).length;
  const avgCartValueTotal = totalCustomers > 0 
    ? initialData.reduce((acc, c) => acc + c.averageCartValue, 0) / totalCustomers 
    : 0;
  const totalLastMonthRevenue = initialData.reduce((acc, c) => acc + c.totalLastMonth, 0);

  const SortHeader = ({ label, sortKey: key, className }: { label: string, sortKey: SortKey, className?: string }) => (
    <TableHead className={`text-center px-0.5 cursor-pointer hover:bg-slate-100/50 transition-colors ${className || ''}`} onClick={() => handleSort(key)}>
      <div className="flex flex-col items-center justify-center gap-0.5 text-[11px]">
        <span className={sortKey === key ? "font-bold text-indigo-700 leading-tight" : "leading-tight"}>{label}</span>
        <ArrowUpDown className={`h-2.5 w-2.5 ${sortKey === key ? "text-indigo-600" : "text-slate-400"}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 md:hidden">בקרת לקוחות</h2>
          <div className="flex flex-wrap gap-2 text-xs mt-3">
            <span className="font-medium px-2 py-1">מקרא זמן מאז רכישה אחרונה:</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">ירוק: עד 3 חודשים</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">צהוב: 3-6 חודשים</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">כתום: 6-9 חודשים</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">אדום: מעל 9 חודשים</span>
          </div>
        </div>
      </div>

      {generatedLabels.length > 0 && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-green-800 font-bold text-lg">משלוחים נוצרו בהצלחה! להלן המדבקות (PDF):</h3>
            <Button variant="ghost" size="sm" onClick={() => setGeneratedLabels([])} className="text-slate-500 hover:text-slate-700 h-8">
              סגור
            </Button>
          </div>
          <ul className="flex flex-wrap gap-3">
            {generatedLabels.map((lbl, idx) => (
              <li key={idx}>
                <a 
                  href={lbl.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-green-200 hover:border-green-400 hover:shadow-sm transition-all text-indigo-600 hover:text-indigo-700 font-medium rounded-lg text-sm"
                >
                  📄 מדבקה - {lbl.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">סה״כ לקוחות רשומים</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800">{totalCustomers}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-full">
              <UserCheck className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">לקוחות פעילים (עד 3 חודשים)</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800">{activeCustomers}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
            <div className="p-2 bg-violet-100 text-violet-600 rounded-full">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">ממוצע שווי סל כללי</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800">{formatCurrency(avgCartValueTotal)}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">הכנסות בחודש האחרון</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800">{formatCurrency(totalLastMonthRevenue)}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-6">
        <div>
          <p className="text-sm text-slate-500 mt-1">סה״כ: {filteredAndSorted.length} לקוחות</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
          {selectedCustomerIds.size > 0 && (
            <Button
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm h-10 px-4"
              onClick={handleGenerateLabels}
              disabled={isGeneratingLabels}
              dir="rtl"
            >
              {isGeneratingLabels ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : null}
              <span>יצירת משלוחים ({selectedCustomerIds.size})</span>
            </Button>
          )}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1 shadow-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 h-8 text-xs font-medium"
            >
              הקודם
            </Button>
            <div className="text-xs font-medium text-slate-500 px-2 min-w-[70px] text-center" dir="rtl">
              עמוד {currentPage} מתוך {totalPages || 1}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="px-3 h-8 text-xs font-medium"
            >
              הבא
            </Button>
          </div>

          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(val) => {
              setItemsPerPage(Number(val));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[120px] h-10 bg-white/80 border-slate-200 shadow-sm text-sm" dir="rtl">
              <SelectValue placeholder="תוצאות..." />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="50">50 בעמוד</SelectItem>
              <SelectItem value="100">100 בעמוד</SelectItem>
              <SelectItem value="200">200 בעמוד</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="חיפוש לפי שם, אימייל, או טלפון..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-4 pr-10 border-slate-200 bg-white/80 focus-visible:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px] text-center px-1">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer align-middle" 
                  checked={isAllVisibleSelected}
                  ref={input => {
                    if (input) input.indeterminate = isSomeVisibleSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableHead>
              <SortHeader label="שם מלא" sortKey="fullName" className="w-[70px]" />
              <TableHead className="text-center font-semibold text-slate-700 px-0.5 text-[11px] align-middle">אימייל</TableHead>
              <TableHead className="text-center font-semibold text-slate-700 px-0.5 text-[11px] align-middle">טלפון</TableHead>
              <SortHeader label="רכישה אחרונה" sortKey="lastPurchaseDate" />
              <SortHeader label="ערך סל ממוצע" sortKey="averageCartValue" />
              <SortHeader label="כמות הזמנות" sortKey="orderCount" />
              <SortHeader label="מותגי הבית(חודש)" sortKey="homeBrandsLastMonth" />
              <SortHeader label="מותגי הבית(שנה)" sortKey="homeBrandsLastYear" />
              <SortHeader label="מותגי הבית(הכל)" sortKey="homeBrandsAllTime" />
              <SortHeader label="רכישות באתר(חודש)" sortKey="totalLastMonth" />
              <SortHeader label="רכישות באתר(שנה)" sortKey="totalLastYear" />
              <SortHeader label="רכישות באתר(הכל)" sortKey="totalAllTime" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="h-32 text-center text-slate-500">
                  לא נמצאו לקוחות.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((customer) => (
                <TableRow key={customer.id} className={getRowColorClass(customer.lastPurchaseDate)}>
                  <TableCell className="px-1 text-center w-[40px]">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      checked={selectedCustomerIds.has(customer.id)}
                      onChange={(e) => handleSelectOne(customer.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="px-0.5 text-center font-medium text-slate-800 text-[11px] max-w-[70px] truncate" title={customer.fullName}>{customer.fullName}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-600 text-[10px] truncate max-w-[80px]" title={customer.email}>{customer.email}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-600 text-[11px] truncate max-w-[80px]" dir="ltr" title={customer.phone}>{customer.phone}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-500 whitespace-nowrap text-[11px]">{formatDate(customer.lastPurchaseDate)}</TableCell>
                  <TableCell className="px-0.5 text-center font-semibold text-violet-600 whitespace-nowrap text-[11px]">{formatCurrency(customer.averageCartValue)}</TableCell>
                  <TableCell className="px-0.5 text-center font-semibold text-slate-700 whitespace-nowrap text-[11px]">{customer.orderCount}</TableCell>
                  <TableCell className="px-0.5 text-center font-semibold text-emerald-600 whitespace-nowrap text-[11px]">{formatCurrency(customer.homeBrandsLastMonth)}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-700 whitespace-nowrap text-[11px]">{formatCurrency(customer.homeBrandsLastYear)}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-700 whitespace-nowrap text-[11px]">{formatCurrency(customer.homeBrandsAllTime)}</TableCell>
                  <TableCell className="px-0.5 text-center font-semibold text-indigo-600 whitespace-nowrap text-[11px]">{formatCurrency(customer.totalLastMonth)}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-700 whitespace-nowrap text-[11px]">{formatCurrency(customer.totalLastYear)}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-700 whitespace-nowrap text-[11px]">{formatCurrency(customer.totalAllTime)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </div>
  );
}
