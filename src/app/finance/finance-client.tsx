"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, ShoppingCart } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinanceClientProps {
  totalExpenses: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
  openChinaOrders: number;
  expensesData: { name: string; value: number; color: string }[];
  creditCardUsage: { name: string; limit: number; used: number }[];
}

export default function FinanceClient({
  totalExpenses,
  totalCreditLimit,
  totalCreditUsed,
  openChinaOrders,
  expensesData,
  creditCardUsage
}: FinanceClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">כספים</h2>
        <p className="text-muted-foreground mt-2">סקירה פיננסית, כרטיסי אשראי והוצאות רכש.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך הכל הוצאות (יבוא)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">ע"פ נתוני ייבוא</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מסגרת אשראי כוללת</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalCreditLimit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">לכל כרטיסי החברה</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מסגרת מנוצלת משוערת</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalCreditUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">הערכה כללית</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הזמנות פתוחות (סין)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openChinaOrders}</div>
            <p className="text-xs text-muted-foreground">רשומות במעקב</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>ניצול מסגרות אשראי (המחשה)</CardTitle>
            <CardDescription>מסגרת לעומת ניצול חלקי משוער לכל כרטיס</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={creditCardUsage} margin={{ top: 20, right: 60, left: 60, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={25} angle={-35} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis width={120} axisLine={false} tickLine={false} tickFormatter={(value) => `₪${value.toLocaleString()}`} orientation="right" tickMargin={10} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="used" name="מנוצל (הערכה)" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="limit" name="מסגרת כוללת" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>פילוג תשלומים</CardTitle>
            <CardDescription>סך תשלומים לפי מותג/סוג</CardDescription>
          </CardHeader>
          <CardContent className="h-[450px] flex flex-col items-center justify-center pb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                <Pie
                  data={expensesData}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expensesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => `₪${value?.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '30px', fontSize: '12px', lineHeight: '24px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
