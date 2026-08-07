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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type SortKey = 
  | "totalAllTime" 
  | "totalLastYear" 
  | "totalLastMonth" 
  | "homeBrandsLastYear" 
  | "homeBrandsLastMonth"
  | "fullName";

export default function CustomerControlClient({ initialData }: { initialData: CustomerControlData[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalLastMonth");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync/wc-data?manual=true&mode=incremental');
      router.refresh();
    } catch (error) {
      console.error('Failed to sync', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFullSync = async () => {
    setIsFullSyncing(true);
    try {
      await fetch('/api/sync/wc-data?manual=true&mode=full');
      router.refresh();
    } catch (error) {
      console.error('Failed to full sync', error);
    } finally {
      setIsFullSyncing(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
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

  const SortHeader = ({ label, sortKey: key }: { label: string, sortKey: SortKey }) => (
    <TableHead className="text-center px-0.5 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort(key)}>
      <div className="flex flex-col items-center justify-center gap-0.5 text-[11px]">
        <span className={sortKey === key ? "font-bold text-indigo-700 leading-tight" : "leading-tight"}>{label}</span>
        <ArrowUpDown className={`h-2.5 w-2.5 ${sortKey === key ? "text-indigo-600" : "text-slate-400"}`} />
      </div>
    </TableHead>
  );

  return (
    <Card className="w-full bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-6">
        <div>
          <CardTitle className="text-2xl font-bold text-slate-800">לקוחות מיוחדים</CardTitle>
          <p className="text-sm text-slate-500 mt-1">סה״כ: {filteredAndSorted.length} לקוחות</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <Button 
            onClick={handleFullSync} 
            disabled={isFullSyncing || isSyncing}
            variant="default" 
            className="w-full md:w-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFullSyncing ? "animate-spin" : ""}`} />
            {isFullSyncing ? "מושך..." : "סנכרון מלא (שנתיים)"}
          </Button>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing || isFullSyncing}
            variant="outline" 
            className="w-full md:w-auto bg-white/50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "מסנכרן..." : "סנכרון מהיר (שבוע)"}
          </Button>
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="חיפוש לפי שם, אימייל, או טלפון..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 border-slate-200 bg-white/80 focus-visible:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <SortHeader label="שם מלא" sortKey="fullName" />
              <TableHead className="text-center font-semibold text-slate-700 px-0.5 text-[11px] align-middle">אימייל</TableHead>
              <TableHead className="text-center font-semibold text-slate-700 px-0.5 text-[11px] align-middle">טלפון</TableHead>
              <SortHeader label="בית(חודש)" sortKey="homeBrandsLastMonth" />
              <SortHeader label="בית(שנה)" sortKey="homeBrandsLastYear" />
              <SortHeader label="קניות(חודש)" sortKey="totalLastMonth" />
              <SortHeader label="קניות(שנה)" sortKey="totalLastYear" />
              <SortHeader label="קניות(הכל)" sortKey="totalAllTime" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  לא נמצאו לקוחות.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors group text-xs">
                  <TableCell className="px-0.5 text-center font-medium text-slate-800 text-[11px] whitespace-nowrap">{customer.fullName}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-600 text-[10px] break-words max-w-[100px]">{customer.email}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-600 whitespace-nowrap text-[11px]" dir="ltr">{customer.phone}</TableCell>
                  <TableCell className="px-0.5 text-center font-semibold text-emerald-600 whitespace-nowrap text-[11px]">{formatCurrency(customer.homeBrandsLastMonth)}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-700 whitespace-nowrap text-[11px]">{formatCurrency(customer.homeBrandsLastYear)}</TableCell>
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
  );
}
