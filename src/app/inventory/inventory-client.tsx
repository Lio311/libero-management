"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch, AlertTriangle, Truck, Archive, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface InventoryClientProps {
  totalInventoryValue: number;
  itemsAtRisk: number;
  goodsOnTheWay: number;
  activeSkus: number;
  stockHealthData: { brand: string; current: number; target: number; status: string; color: string }[];
  lowStockItems: { name: string; brand: string; current: number; target: number }[];
  inventoryItems: any[];
}

export default function InventoryClient({
  totalInventoryValue,
  itemsAtRisk,
  goodsOnTheWay,
  activeSkus,
  stockHealthData,
  lowStockItems,
  inventoryItems
}: InventoryClientProps) {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Extract unique brands for the filter
  const uniqueBrands = Array.from(new Set(inventoryItems.map(i => i.brand))).filter(Boolean);

  // Filter items
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = (item.modelName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === "all" || item.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">מלאי וספקים</h2>
        <p className="text-muted-foreground mt-2">בריאות המלאי, פריטים חסרים והזמנות רכש.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ערך מלאי נוכחי</CardTitle>
            <Archive className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">מוערך לפי מחיר עלות</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פריטים בסיכון (מלאי נמוך)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{itemsAtRisk}</div>
            <p className="text-xs text-muted-foreground">מתחת ל-20% מיעד המלאי</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פריטים בדרך / הוזמנו</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goodsOnTheWay}</div>
            <p className="text-xs text-muted-foreground">יחידות בסטטוס הזמנה</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מק"טים פעילים</CardTitle>
            <PackageSearch className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSkus}</div>
            <p className="text-xs text-muted-foreground">מנוהלים במערכת</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>בריאות מלאי לפי מותג</CardTitle>
            <CardDescription>מלאי קיים לעומת יעד (Target Stock Level)</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockHealthData} margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="brand" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={60} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="current" name="מלאי נוכחי" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {stockHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="w-5 h-5 ml-2" />
              התראות חוסר מלאי
            </CardTitle>
            <CardDescription>פריטים שדורשים הזמנה מיידית (טופ 5)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">אין חוסרים קריטיים במלאי</p>
            ) : (
              lowStockItems.map((item, i) => {
                const target = item.target || 1;
                const percentage = Math.min(100, Math.round((item.current / target) * 100));
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name} <span className="text-xs text-muted-foreground">({item.brand})</span></span>
                      <span className="font-bold text-red-600">{item.current} / {item.target}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="bg-white border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>טבלת מלאי (הזמנות ליברו ועוד)</CardTitle>
              <CardDescription>רשימה מפורטת של כל הפריטים במערכת</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="חיפוש דגם..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-3 pr-9 py-2 border rounded-md text-sm w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">כל המותגים / קטגוריות</option>
                {uniqueBrands.map((b, i) => (
                  <option key={i} value={b as string}>{b as string}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md">מזהה (Index)</th>
                  <th className="py-3 px-4 font-medium">שם הדגם</th>
                  <th className="py-3 px-4 font-medium">מותג / קטגוריה</th>
                  <th className="py-3 px-4 font-medium">מלאי נוכחי</th>
                  <th className="py-3 px-4 font-medium">הוזמנו</th>
                  <th className="py-3 px-4 font-medium">יעד מלאי</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md">מחיר עלות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.slice(0, 100).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">{item.itemIndex || '-'}</td>
                    <td className="py-3 px-4 font-medium">{item.modelName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {item.brand}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{item.currentStock || '0'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.orderedQuantity || '0'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.targetStockLevel || '0'}</td>
                    <td className="py-3 px-4 font-medium">₪{item.costPrice || '0'}</td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      לא נמצאו פריטים.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredItems.length > 100 && (
              <div className="py-4 text-center text-xs text-muted-foreground bg-gray-50/50 border-t">
                מציג 100 תוצאות ראשונות (מתוך {filteredItems.length})
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
