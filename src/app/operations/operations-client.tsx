"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, Contact, CheckCircle2, Clock, AlertCircle, LayoutList, LayoutGrid } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface OperationsClientProps {
  wholesaleClients: { name: string; contact: string; totalOrders: number; revenue: number; interest: string }[];
  rawWholesaleCustomers: any[];
}

export default function OperationsClient({
  wholesaleClients,
  rawWholesaleCustomers
}: OperationsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">תפעול וסיטונאות</h2>
        <p className="text-muted-foreground mt-2">בנק משימות, ניהול שוטף ולקוחות סיטונאיים.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">לקוחות סיטונאיים במערכת</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wholesaleClients.length}</div>
            <p className="text-xs text-muted-foreground">לקוחות פוטנציאליים / פעילים</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {/* Wholesale Clients Cards */}
        <Card className="bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>לקוחות סיטונאות (B2B)</CardTitle>
            <CardDescription>רשימת לקוחות ומתעניינים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wholesaleClients.slice(0, 8).map((client, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border/50">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">{client.name}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Contact className="w-3 h-3 ml-1" />
                    {client.contact}
                  </div>
                </div>
                <div className="text-left">
                  <Badge variant="outline" className="text-[10px]">{client.interest}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Raw Wholesale Customers Table */}
      <Card className="bg-white border-none shadow-sm mt-8">
        <CardHeader>
          <CardTitle>נתוני לקוחות סיטונאיים (גולמי)</CardTitle>
          <CardDescription>טבלת לקוחות סיטונאיים מלאה כפי שהוזנה במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">שם חנות</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">עיר</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">כתובת</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">שיחת טלפון</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">ביקור</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">פוטנציאל</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">עניין</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">הערות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawWholesaleCustomers && rawWholesaleCustomers.length > 0 ? (
                  rawWholesaleCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">{customer.storeName || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{customer.city || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{customer.address || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{customer.phoneCall || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{customer.visit || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{customer.potential || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px]">{customer.interest || '-'}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{customer.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      לא נמצאו לקוחות.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
