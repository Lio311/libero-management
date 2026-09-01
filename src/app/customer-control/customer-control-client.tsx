"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import { CustomerControlData, toggleCustomerVip, addManualCustomer, deleteManualCustomer } from "@/app/actions/customer-control-actions";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, Search, Users, UserCheck, ShoppingCart, TrendingUp, Loader2, Star, UserPlus, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalLastMonth");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false);
  const [vipLoading, setVipLoading] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Local VIP state for optimistic updates
  const [localVipOverrides, setLocalVipOverrides] = useState<Map<string, boolean>>(new Map());

  // Form state for adding manual customer
  const [newCustomer, setNewCustomer] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
    isVip: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Merge local VIP overrides with server data
  const dataWithVip = useMemo(() => {
    return initialData.map(c => ({
      ...c,
      isVip: localVipOverrides.has(c.id) ? localVipOverrides.get(c.id)! : c.isVip,
    }));
  }, [initialData, localVipOverrides]);


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

  const handleToggleVip = async (customerId: string, currentVip: boolean) => {
    // Optimistic update
    setLocalVipOverrides(prev => {
      const next = new Map(prev);
      next.set(customerId, !currentVip);
      return next;
    });
    setVipLoading(prev => new Set(prev).add(customerId));

    try {
      await toggleCustomerVip(customerId, !currentVip);
      toast.success(!currentVip ? "לקוח סומן כ-VIP ⭐" : "סימון VIP הוסר");
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      // Revert optimistic update
      setLocalVipOverrides(prev => {
        const next = new Map(prev);
        next.delete(customerId);
        return next;
      });
      toast.error("שגיאה בעדכון סטטוס VIP");
    } finally {
      setVipLoading(prev => {
        const next = new Set(prev);
        next.delete(customerId);
        return next;
      });
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.fullName.trim()) {
      toast.error("שם מלא הוא שדה חובה");
      return;
    }

    try {
      await addManualCustomer({
        fullName: newCustomer.fullName.trim(),
        email: newCustomer.email.trim() || undefined,
        phone: newCustomer.phone.trim() || undefined,
        city: newCustomer.city.trim() || undefined,
        address: newCustomer.address.trim() || undefined,
        notes: newCustomer.notes.trim() || undefined,
        isVip: newCustomer.isVip,
      });
      toast.success("לקוח חנות נוסף בהצלחה!");
      setAddDialogOpen(false);
      setNewCustomer({ fullName: "", email: "", phone: "", city: "", address: "", notes: "", isVip: false });
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      toast.error("שגיאה בהוספת לקוח");
    }
  };

  const handleDeleteManualCustomer = async (customerId: string) => {
    if (!confirm("בטוח שברצונך למחוק לקוח זה?")) return;
    
    try {
      await deleteManualCustomer(customerId);
      toast.success("לקוח נמחק בהצלחה");
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      toast.error("שגיאה במחיקת לקוח");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...dataWithVip];

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
      // VIP customers always come first
      if (a.isVip !== b.isVip) {
        return a.isVip ? -1 : 1;
      }

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
  }, [dataWithVip, searchQuery, sortKey, sortOrder]);

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
      
      if (!res.ok || !data.allSuccessful) {
        toast.error("חלק מהמשלוחים או כולם נכשלו. אנא בדוק בקונסול או במערכת LionWheel.");
        console.error("LionWheel results:", data);
      } else {
        toast.success("משלוחים נוצרו בהצלחה ב-LionWheel!");
        setSelectedCustomerIds(new Set()); // Clear selection on success
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בתקשורת עם השרת.");
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
  const vipCount = dataWithVip.filter(c => c.isVip).length;

  const SortHeader = ({ label, sortKey: key, className }: { label: string, sortKey: SortKey, className?: string }) => (
    <TableHead className={`text-center px-0.5 cursor-pointer hover:bg-slate-100/50 transition-colors ${className || ''}`} onClick={() => handleSort(key)}>
      <div className="flex flex-col items-center justify-center gap-0.5 text-[11px]">
        <span className={sortKey === key ? "font-bold text-indigo-700 leading-tight" : "leading-tight"}>{label}</span>
        <ArrowUpDown className={`h-2.5 w-2.5 ${sortKey === key ? "text-indigo-600" : "text-slate-400"}`} />
      </div>
    </TableHead>
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 md:hidden">מאגר לקוחות</h2>
          <div className="flex flex-wrap gap-2 text-xs mt-3">
            <span className="font-medium px-2 py-1">מקרא זמן מאז רכישה אחרונה:</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">ירוק: עד 3 חודשים</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">צהוב: 3-6 חודשים</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">כתום: 6-9 חודשים</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">אדום: מעל 9 חודשים</span>
            <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-200">⭐ = לקוח VIP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card className="bg-amber-50/80 backdrop-blur-xl border-amber-200/60 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <p className="text-xs text-amber-700 font-medium">לקוחות VIP</p>
            <h3 className="text-xl md:text-2xl font-bold text-amber-800">{vipCount}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-6">
        <div>
          <p className="text-sm text-slate-500 mt-1">סה״כ: {filteredAndSorted.length} לקוחות</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
          {/* Add Manual Customer Button + Dialog */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-10 px-4 shadow-sm" dir="rtl">
              <Store className="ml-2 h-4 w-4" />
              <span>הוספת לקוח חנות</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-xl">הוספת לקוח חנות חדש</DialogTitle>
                <DialogDescription>
                  הוספת לקוח שקנה בחנות הפיזית ולא קיים במערכת האונליין
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fullName" className="text-right font-medium">שם מלא *</Label>
                  <Input
                    id="fullName"
                    value={newCustomer.fullName}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, fullName: e.target.value }))}
                    className="col-span-3"
                    placeholder="שם פרטי ומשפחה"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right font-medium">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right font-medium">טלפון</Label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    className="col-span-3"
                    placeholder="050-0000000"
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="city" className="text-right font-medium">עיר</Label>
                  <Input
                    id="city"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                    className="col-span-3"
                    placeholder="תל אביב"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right font-medium">כתובת</Label>
                  <Input
                    id="address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                    className="col-span-3"
                    placeholder="רחוב ומספר"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right font-medium">הערות</Label>
                  <Input
                    id="notes"
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                    className="col-span-3"
                    placeholder="הערות נוספות..."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">לקוח VIP</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCustomer(prev => ({ ...prev, isVip: !prev.isVip }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: newCustomer.isVip ? '#fffbeb' : 'white',
                        borderColor: newCustomer.isVip ? '#f59e0b' : '#e2e8f0',
                      }}
                    >
                      <Star className={`w-5 h-5 transition-colors ${newCustomer.isVip ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      <span className={`text-sm font-medium ${newCustomer.isVip ? 'text-amber-700' : 'text-slate-500'}`}>
                        {newCustomer.isVip ? 'לקוח VIP ⭐' : 'לחץ לסימון VIP'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  ביטול
                </Button>
                <Button 
                  onClick={handleAddCustomer}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                  הוספת לקוח
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
              <TableHead className="w-[36px] text-center px-0.5 text-[11px]">
                <Star className="w-3.5 h-3.5 mx-auto text-amber-400 fill-amber-400" />
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
              <TableHead className="w-[36px] text-center px-0.5 text-[11px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="h-32 text-center text-slate-500">
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
                  <TableCell className="px-0.5 text-center w-[36px]">
                    <button
                      onClick={() => handleToggleVip(customer.id, customer.isVip)}
                      disabled={vipLoading.has(customer.id)}
                      className="p-0.5 rounded-full hover:bg-amber-100/80 transition-all disabled:opacity-50"
                      title={customer.isVip ? "הסר סימון VIP" : "סמן כ-VIP"}
                    >
                      {vipLoading.has(customer.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      ) : (
                        <Star className={`w-4 h-4 transition-colors ${
                          customer.isVip 
                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm' 
                            : 'text-slate-300 hover:text-amber-300'
                        }`} />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-0.5 text-center font-medium text-slate-800 text-[11px] max-w-[70px] truncate" title={customer.fullName}>
                    <div className="flex items-center justify-center gap-1">
                      {customer.source === "manual" && (
                        <span title="לקוח חנות">
                          <Store className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        </span>
                      )}
                      <span>{customer.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-0.5 text-center text-slate-600 text-[10px] truncate max-w-[80px]" title={customer.email}>{customer.email}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-600 text-[11px] truncate max-w-[80px]" dir="ltr" title={customer.phone}>{customer.phone}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-500 whitespace-nowrap text-[11px]">
                    {customer.source === "manual" ? <span className="text-emerald-600 text-[10px]">לקוח חנות</span> : formatDate(customer.lastPurchaseDate)}
                  </TableCell>
                  <TableCell className="px-0.5 text-center font-semibold text-violet-600 whitespace-nowrap text-[11px]">{formatCurrency(customer.averageCartValue)}</TableCell>
                  <TableCell className="px-0.5 text-center font-semibold text-slate-700 whitespace-nowrap text-[11px]">{customer.orderCount}</TableCell>
                  <TableCell className="px-0.5 text-center font-semibold text-emerald-600 whitespace-nowrap text-[11px]">{formatCurrency(customer.homeBrandsLastMonth)}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-700 whitespace-nowrap text-[11px]">{formatCurrency(customer.homeBrandsLastYear)}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-700 whitespace-nowrap text-[11px]">{formatCurrency(customer.homeBrandsAllTime)}</TableCell>
                  <TableCell className="px-0.5 text-center font-semibold text-indigo-600 whitespace-nowrap text-[11px]">{formatCurrency(customer.totalLastMonth)}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-700 whitespace-nowrap text-[11px]">{formatCurrency(customer.totalLastYear)}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-700 whitespace-nowrap text-[11px]">{formatCurrency(customer.totalAllTime)}</TableCell>
                  <TableCell className="px-0.5 text-center w-[36px]">
                    {customer.source === "manual" && (
                      <button
                        onClick={() => handleDeleteManualCustomer(customer.id)}
                        className="p-0.5 rounded-full hover:bg-red-100/80 transition-all text-slate-300 hover:text-red-500"
                        title="מחק לקוח"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </TableCell>
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
