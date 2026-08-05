"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch, AlertTriangle, Truck, Archive } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const stockHealthData = [
  { brand: 'Libero', current: 450, target: 500, status: 'good', color: '#10b981' },
  { brand: 'Valor', current: 120, target: 300, status: 'warning', color: '#f59e0b' },
  { brand: 'La Bora', current: 45, target: 200, status: 'danger', color: '#ef4444' },
  { brand: 'Sora Dora', current: 320, target: 400, status: 'good', color: '#10b981' },
  { brand: 'KV', current: 80, target: 100, status: 'good', color: '#10b981' },
];

const lowStockItems = [
  { name: 'Dark Amber 100ml', brand: 'Comporta', current: 1, target: 117 },
  { name: 'Mallow', brand: 'Sora Dora', current: 4, target: 24 },
  { name: 'Iconic Oud 100ml', brand: 'Comporta', current: 2, target: 40 },
  { name: 'El Badia', brand: 'KV', current: 2, target: 12 },
];

export default function InventoryDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
            <div className="text-2xl font-bold">₪420,500</div>
            <p className="text-xs text-muted-foreground">מוערך לפי מחיר עלות</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פריטים בסיכון (מלאי נמוך)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">14</div>
            <p className="text-xs text-muted-foreground">מתחת ל-20% מיעד המלאי</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סחורה בדרך</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">משלוחים מסין ומאירופה</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מק"טים פעילים</CardTitle>
            <PackageSearch className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">186</div>
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
              <BarChart data={stockHealthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="brand" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
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
            <CardDescription>פריטים שדורשים הזמנה מיידית</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {lowStockItems.map((item, i) => {
              const percentage = Math.round((item.current / item.target) * 100);
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name} <span className="text-xs text-muted-foreground">({item.brand})</span></span>
                    <span className="font-bold text-red-600">{item.current} / {item.target}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
