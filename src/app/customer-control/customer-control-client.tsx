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
import { ArrowUpDown, Search } from "lucide-react";

type SortKey = 
  | "totalAllTime" 
  | "totalLastYear" 
  | "totalLastMonth" 
  | "homeBrandsAllTime"
  | "homeBrandsLastYear" 
  | "homeBrandsLastMonth"
  | "lastPurchaseDate"
  | "fullName";

export default function CustomerControlClient({ initialData }: { initialData: CustomerControlData[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalLastMonth");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");


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

  const SortHeader = ({ label, sortKey: key, className }: { label: string, sortKey: SortKey, className?: string }) => (
    <TableHead className={`text-center px-0.5 cursor-pointer hover:bg-slate-100/50 transition-colors ${className || ''}`} onClick={() => handleSort(key)}>
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
              <SortHeader label="שם מלא" sortKey="fullName" className="w-[70px]" />
              <TableHead className="text-center font-semibold text-slate-700 px-0.5 text-[11px] align-middle">אימייל</TableHead>
              <TableHead className="text-center font-semibold text-slate-700 px-0.5 text-[11px] align-middle">טלפון</TableHead>
              <SortHeader label="רכישה אחרונה" sortKey="lastPurchaseDate" />
              <SortHeader label="מותגי הבית(חודש)" sortKey="homeBrandsLastMonth" />
              <SortHeader label="מותגי הבית(שנה)" sortKey="homeBrandsLastYear" />
              <SortHeader label="מותגי הבית(הכל)" sortKey="homeBrandsAllTime" />
              <SortHeader label="רכישות באתר(חודש)" sortKey="totalLastMonth" />
              <SortHeader label="רכישות באתר(שנה)" sortKey="totalLastYear" />
              <SortHeader label="רכישות באתר(הכל)" sortKey="totalAllTime" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                  לא נמצאו לקוחות.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors group text-xs">
                  <TableCell className="px-0.5 text-center font-medium text-slate-800 text-[11px] max-w-[70px] truncate" title={customer.fullName}>{customer.fullName}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-600 text-[10px] truncate max-w-[80px]" title={customer.email}>{customer.email}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-600 text-[11px] truncate max-w-[80px]" dir="ltr" title={customer.phone}>{customer.phone}</TableCell>
                  <TableCell className="px-0.5 text-center text-slate-500 whitespace-nowrap text-[11px]">{formatDate(customer.lastPurchaseDate)}</TableCell>
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
  );
}
