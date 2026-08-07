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
import { Button } from "@/components/ui/button";

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
    <TableHead className="text-right whitespace-nowrap px-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort(key)}>
      <div className="flex items-center justify-start gap-2">
        <ArrowUpDown className={`h-4 w-4 ${sortKey === key ? "text-indigo-600" : "text-slate-400"}`} />
        <span className={sortKey === key ? "font-bold text-indigo-700" : ""}>{label}</span>
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
        
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="חיפוש לפי שם, אימייל, או טלפון..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 border-slate-200 bg-white/80 focus-visible:ring-indigo-500 shadow-sm"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <SortHeader label="שם מלא" sortKey="fullName" />
              <TableHead className="text-right font-semibold text-slate-700 px-4 whitespace-nowrap">אימייל</TableHead>
              <TableHead className="text-right font-semibold text-slate-700 px-4 whitespace-nowrap">טלפון</TableHead>
              <SortHeader label='מותגי הבית (חודש אחרון)' sortKey="homeBrandsLastMonth" />
              <SortHeader label='מותגי הבית (שנה אחרונה)' sortKey="homeBrandsLastYear" />
              <SortHeader label="רכישות (חודש אחרון)" sortKey="totalLastMonth" />
              <SortHeader label="רכישות (שנה אחרונה)" sortKey="totalLastYear" />
              <SortHeader label="רכישות (כל הזמן)" sortKey="totalAllTime" />
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
                <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                  <TableCell className="px-4 font-medium text-slate-800 whitespace-nowrap">{customer.fullName}</TableCell>
                  <TableCell className="px-4 text-slate-600 whitespace-nowrap">{customer.email}</TableCell>
                  <TableCell className="px-4 text-slate-600 whitespace-nowrap" dir="ltr">{customer.phone}</TableCell>
                  <TableCell className="px-4 font-semibold text-emerald-600">{formatCurrency(customer.homeBrandsLastMonth)}</TableCell>
                  <TableCell className="px-4 text-slate-700">{formatCurrency(customer.homeBrandsLastYear)}</TableCell>
                  <TableCell className="px-4 font-semibold text-indigo-600">{formatCurrency(customer.totalLastMonth)}</TableCell>
                  <TableCell className="px-4 text-slate-700">{formatCurrency(customer.totalLastYear)}</TableCell>
                  <TableCell className="px-4 text-slate-700">{formatCurrency(customer.totalAllTime)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
