/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, Contact, CheckCircle2, Clock, AlertCircle, LayoutList, LayoutGrid, Check, X, Edit2 } from "lucide-react";
import { updateWholesaleCustomer, createWholesaleCustomer, deleteWholesaleCustomer } from "@/app/actions/operations";
import { Trash2, Plus } from "lucide-react";

interface OperationsClientProps {
  wholesaleClients: { name: string; contact: string; totalOrders: number; revenue: number; interest: string }[];
  rawWholesaleCustomers: any[];
}


function EditableWholesaleRow({ customer, onCancelNew }: { customer: any, onCancelNew?: () => void }) {
  const [isEditing, setIsEditing] = useState(customer.isNew || false);
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState({
    storeName: customer.storeName || '',
    city: customer.city || '',
    address: customer.address || '',
    phoneCall: customer.phoneCall || '',
    visit: customer.visit || '',
    potential: customer.potential || '',
    interest: customer.interest || '',
    notes: customer.notes || ''
  });

  const handleSave = () => {
    startTransition(async () => {
      if (customer.isNew) {
        await createWholesaleCustomer(data);
        if (onCancelNew) onCancelNew();
      } else {
        await updateWholesaleCustomer(customer.id, data);
        setIsEditing(false);
      }
    });
  };

  const handleCancel = () => {
    if (customer.isNew && onCancelNew) {
      onCancelNew();
    } else {
      setData({
        storeName: customer.storeName || '',
        city: customer.city || '',
        address: customer.address || '',
        phoneCall: customer.phoneCall || '',
        visit: customer.visit || '',
        potential: customer.potential || '',
        interest: customer.interest || '',
        notes: customer.notes || ''
      });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק שורה זו?')) {
      startTransition(async () => {
        await deleteWholesaleCustomer(customer.id);
      });
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50/30 transition-colors flex flex-col md:table-row border border-blue-100 md:border-none p-4 md:p-0 gap-3 md:gap-0 rounded-xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none">
        <td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">שם חנות</span><input className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.storeName} onChange={(e) => setData({ ...data, storeName: e.target.value })} autoFocus /></td>
        <td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">עיר</span><input className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} /></td>
        <td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">כתובת</span><input className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} /></td>
        <td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">שיחת טלפון</span><input className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.phoneCall} onChange={(e) => setData({ ...data, phoneCall: e.target.value })} /></td>
        <td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">ביקור</span><input className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.visit} onChange={(e) => setData({ ...data, visit: e.target.value })} /></td>
        <td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">פוטנציאל</span><input className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.potential} onChange={(e) => setData({ ...data, potential: e.target.value })} /></td>
        <td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">עניין</span><input className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.interest} onChange={(e) => setData({ ...data, interest: e.target.value })} /></td>
        <td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">הערות</span><input className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} /></td>
        <td className="p-0 md:p-2 flex justify-end md:table-cell mt-2 md:mt-0 pt-3 md:pt-0 border-t border-blue-200/50 md:border-none">
          <div className="flex gap-2 justify-end w-full md:w-auto">
            <button onClick={handleSave} disabled={isPending} className="flex-1 md:flex-none flex justify-center items-center p-2 md:p-1 text-green-700 bg-green-100 hover:bg-green-200 rounded-lg md:rounded md:bg-transparent transition-colors"><Check className="h-5 w-5 md:h-4 md:w-4" /></button>
            <button onClick={handleCancel} disabled={isPending} className="flex-1 md:flex-none flex justify-center items-center p-2 md:p-1 text-red-700 bg-red-100 hover:bg-red-200 rounded-lg md:rounded md:bg-transparent transition-colors"><X className="h-5 w-5 md:h-4 md:w-4" /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-white md:bg-transparent border border-gray-100 md:border-none rounded-2xl md:rounded-none shadow-sm md:shadow-none mb-4 md:mb-0 flex flex-col md:table-row overflow-hidden hover:bg-gray-50/80 transition-all">
      <td className="p-4 md:py-3 md:px-4 flex flex-col md:table-cell gap-1 bg-gray-50/50 md:bg-transparent border-b border-gray-50 md:border-none">
        <div className="flex justify-between items-start md:items-center w-full">
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-gray-900 md:font-medium md:text-sm">{customer.storeName || '-'}</span>
            <span className="text-sm text-gray-500 md:hidden mt-0.5">{customer.city || '-'} • {customer.phoneCall || '-'}</span>
          </div>
          <Badge variant="outline" className="text-[10px] md:hidden shadow-sm bg-white">{customer.interest || '-'}</Badge>
        </div>
      </td>
      <td className="hidden md:table-cell py-3 px-4">{customer.city || '-'}</td>
      <td className="py-2 px-4 md:py-3 flex justify-between items-center md:table-cell text-sm border-b border-gray-50 md:border-none">
        <span className="md:hidden text-gray-500 text-xs uppercase tracking-wider">כתובת</span>
        <span className="font-medium md:font-normal text-gray-700 md:text-inherit">{customer.address || '-'}</span>
      </td>
      <td className="hidden md:table-cell py-3 px-4">{customer.phoneCall || '-'}</td>
      <td className="py-2 px-4 md:py-3 flex justify-between items-center md:table-cell text-sm border-b border-gray-50 md:border-none">
        <span className="md:hidden text-gray-500 text-xs uppercase tracking-wider">ביקור</span>
        <span className="font-medium md:font-normal text-gray-700 md:text-inherit">{customer.visit || '-'}</span>
      </td>
      <td className="py-2 px-4 md:py-3 flex justify-between items-center md:table-cell text-sm border-b border-gray-50 md:border-none">
        <span className="md:hidden text-gray-500 text-xs uppercase tracking-wider">פוטנציאל</span>
        <span className="font-medium md:font-normal text-gray-700 md:text-inherit">{customer.potential || '-'}</span>
      </td>
      <td className="hidden md:table-cell py-3 px-4">
        <Badge variant="outline" className="text-[10px]">{customer.interest || '-'}</Badge>
      </td>
      <td className="py-2 px-4 md:py-3 flex justify-between items-center md:table-cell text-sm">
        <span className="md:hidden text-gray-500 text-xs uppercase tracking-wider">הערות</span>
        <span className="text-gray-600 truncate max-w-[200px] text-left md:text-right" dir="auto">{customer.notes || '-'}</span>
      </td>
      <td className="p-3 md:py-3 md:px-4 flex justify-end md:table-cell border-t border-gray-50 md:border-none bg-gray-50/30 md:bg-transparent">
        <div className="flex gap-2 justify-end w-full md:w-auto">
          <button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none flex justify-center items-center p-2.5 md:p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg md:rounded-md transition-colors bg-blue-50/50 md:bg-transparent border border-blue-100 md:border-transparent">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={handleDelete} className="flex-1 md:flex-none flex justify-center items-center p-2.5 md:p-1.5 text-red-600 hover:bg-red-50 rounded-lg md:rounded-md transition-colors bg-red-50/50 md:bg-transparent border border-red-100 md:border-transparent">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function OperationsClient({
  wholesaleClients,
  rawWholesaleCustomers
}: OperationsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
          <div className="flex items-center justify-between">
            <CardTitle>נתוני לקוחות סיטונאיים (גולמי)</CardTitle>
            <button onClick={() => setIsAddingCustomer(true)} className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
              <Plus className="w-4 h-4" /> הוסף חדש
            </button>
          </div>
          <CardDescription>טבלת לקוחות סיטונאיים מלאה כפי שהוזנה במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground hidden md:table-header-group">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">שם חנות</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">עיר</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">כתובת</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">שיחת טלפון</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">ביקור</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">פוטנציאל</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">עניין</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">הערות</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isAddingCustomer && <EditableWholesaleRow customer={{ isNew: true }} onCancelNew={() => setIsAddingCustomer(false)} />}
                {rawWholesaleCustomers && rawWholesaleCustomers.length > 0 ? (
                  rawWholesaleCustomers.map((customer) => (
                    <EditableWholesaleRow key={customer.id} customer={customer} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
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
