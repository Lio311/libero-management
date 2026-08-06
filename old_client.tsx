/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Camera, TrendingUp, HandCoins } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { updateInfluencer, updateInfluencerPayment, createInfluencer, deleteInfluencer, createInfluencerPayment, deleteInfluencerPayment } from "@/app/actions/marketing";
import { Check, X, Edit2, ChevronRight, ChevronLeft, Trash2, Plus, Loader2 } from "lucide-react";
import { influencersConfig } from '@/config/influencers';

interface MarketingClientProps {
  activeInfluencers: number;
  totalFollowersEstimate: string;
  totalProductsGiven: number;
  totalInfluencerPayments: number;
  monthlyGrowth: any[];
  influencerPerformance: any[];
  rawInfluencers: any[];
  rawPayments: any[];
}

function EditableInfluencerRow({ inf }: { inf: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState({
    influencerName: inf.influencerName || '',
    brand: inf.brand || '',
    isPaid: inf.isPaid || '',
    videoCount: inf.videoCount || '',
    postCount: inf.postCount || '',
    productsGiven: inf.productsGiven || '',
    videosUploaded: inf.videosUploaded || '',
    activities: inf.activities || '',
    notes: inf.notes || '',
    influencerId: inf.influencerId || ''
  });

  const handleSave = async () => {
    if (inf.isNew) {
      await createInfluencer(data);
      if (inf.onCancelNew) inf.onCancelNew();
    } else {
      await updateInfluencer(inf.id, data);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (inf.isNew && inf.onCancelNew) {
      inf.onCancelNew();
    } else {
      setData({
        influencerName: inf.influencerName || '',
        brand: inf.brand || '',
        isPaid: inf.isPaid || '',
        videoCount: inf.videoCount || '',
        postCount: inf.postCount || '',
        productsGiven: inf.productsGiven || '',
        videosUploaded: inf.videosUploaded || '',
        activities: inf.activities || '',
        notes: inf.notes || '',
        influencerId: inf.influencerId || ''
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('האם למחוק שורה זו?')) {
      await deleteInfluencer(inf.id);
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50/30 transition-colors flex flex-col md:table-row border-b md:border-none p-4 md:p-0 gap-2 md:gap-0 rounded-lg md:rounded-none mb-4 md:mb-0">
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">שם</span><input className="w-full p-1 border rounded text-sm text-right" value={data.influencerName} onChange={e => setData({...data, influencerName: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">מותג</span><input className="w-full p-1 border rounded text-sm text-right" value={data.brand} onChange={e => setData({...data, brand: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">בתשלום?</span><input className="w-full p-1 border rounded text-sm text-right" value={data.isPaid} onChange={e => setData({...data, isPaid: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">מספר סרטונים</span><input className="w-full p-1 border rounded text-sm text-right" value={data.videoCount} onChange={e => setData({...data, videoCount: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">מספר פוסטים</span><input className="w-full p-1 border rounded text-sm text-right" value={data.postCount} onChange={e => setData({...data, postCount: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">מוצרים שניתנו</span><input className="w-full p-1 border rounded text-sm text-right" value={data.productsGiven} onChange={e => setData({...data, productsGiven: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">סרטונים שהועלו</span><input className="w-full p-1 border rounded text-sm text-right" value={data.videosUploaded} onChange={e => setData({...data, videosUploaded: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">פעילויות</span><input className="w-full p-1 border rounded text-sm text-right" value={data.activities} onChange={e => setData({...data, activities: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">הערות</span><input className="w-full p-1 border rounded text-sm text-right" value={data.notes} onChange={e => setData({...data, notes: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1">
          <span className="md:hidden font-medium text-sm text-gray-500">קישור למשפיען</span>
          <select className="w-full p-1 border rounded text-sm text-right bg-white" value={data.influencerId} onChange={e => setData({...data, influencerId: e.target.value})}>
            <option value="">לא מקושר</option>
            {Object.entries(influencersConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>
        </td>
        <td className="p-2 flex justify-end md:table-cell mt-2 md:mt-0">
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded bg-green-50 md:bg-transparent"><Check className="h-5 w-5 md:h-4 md:w-4" /></button>
            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded bg-red-50 md:bg-transparent"><X className="h-5 w-5 md:h-4 md:w-4" /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50/50 transition-colors group flex flex-col md:table-row border-b md:border-none p-4 md:p-0 gap-2 md:gap-0 bg-white md:bg-transparent rounded-lg md:rounded-none shadow-sm md:shadow-none mb-4 md:mb-0">
      <td className="py-1 md:py-3 px-2 font-medium flex justify-between items-center md:table-cell text-right">
        <span className="md:hidden text-gray-500 text-sm">שם</span>
        {inf.influencerName || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-right">
        <span className="md:hidden text-gray-500 text-sm">מותג</span>
        {inf.brand || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-gray-500 text-sm">בתשלום?</span>
        {inf.isPaid || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-gray-500 text-sm">סרטונים</span>
        {inf.videoCount || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-gray-500 text-sm">פוסטים</span>
        {inf.postCount || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 text-muted-foreground flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-gray-500 text-sm">מוצרים שניתנו</span>
        {inf.productsGiven || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 text-muted-foreground flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-gray-500 text-sm">סרטונים שהועלו</span>
        {inf.videosUploaded || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 max-w-[150px] truncate flex justify-between items-center md:table-cell text-right" title={inf.activities}>
        <span className="md:hidden text-gray-500 text-sm">פעילויות</span>
        {inf.activities || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 text-muted-foreground max-w-[150px] truncate flex justify-between items-center md:table-cell text-right" title={inf.notes}>
        <span className="md:hidden text-gray-500 text-sm">הערות</span>
        {inf.notes || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-gray-500 text-sm">קישור למשפיען</span>
        {inf.influencerId ? (influencersConfig[inf.influencerId]?.name || inf.influencerId) : '-'}
      </td>
      <td className="py-2 md:py-3 px-2 flex justify-end md:table-cell mt-2 md:mt-0 border-t md:border-none">
        <div className="flex gap-1 justify-end md:justify-center">
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors bg-blue-50 md:bg-transparent">
            <Edit2 className="h-5 w-5 md:h-4 md:w-4" />
          </button>
          <button onClick={handleDelete} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors bg-red-50 md:bg-transparent">
            <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function EditablePaymentRow({ payment }: { payment: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [commission, setCommission] = useState<number | null>(null);
  const [isLoadingCommission, setIsLoadingCommission] = useState(false);

  useEffect(() => {
    if (payment.influencerId && payment.paymentMonth) {
      const hebrewMonthsList = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
      ];
      const match = String(payment.paymentMonth).match(/\d{4}/);
      const year = match ? match[0] : new Date().getFullYear().toString();
      let monthIndex = -1;
      for (let i = 0; i < hebrewMonthsList.length; i++) {
        if (String(payment.paymentMonth).includes(hebrewMonthsList[i])) {
          monthIndex = i + 1;
          break;
        }
      }
      
      if (monthIndex > 0) {
        const monthParam = `${year}-${monthIndex.toString().padStart(2, '0')}`;
        setIsLoadingCommission(true);
        const apiUrl = payment.influencerId === 'oded' 
          ? `/api/oded-coupon?month=${monthParam}`
          : `/api/influencer-coupon/${payment.influencerId}?month=${monthParam}`;
          
        fetch(apiUrl)
          .then(res => res.json())
          .then(data => {
            if (data && data.summary && data.summary.commission !== undefined) {
               setCommission(data.summary.commission);
            }
          })
          .catch(console.error)
          .finally(() => setIsLoadingCommission(false));
      }
    }
  }, [payment.influencerId, payment.paymentMonth]);

  const [data, setData] = useState({
    influencerName: payment.influencerName || '',
    amount: payment.amount || 0,
    isDone: payment.isDone || '',
    paymentMonth: payment.paymentMonth || '',
    notes: payment.notes || '',
    influencerId: payment.influencerId || ''
  });

  const handleSave = async () => {
    if (payment.isNew) {
      await createInfluencerPayment({
        ...data,
        amount: data.amount.toString()
      });
      if (payment.onCancelNew) payment.onCancelNew();
    } else {
      await updateInfluencerPayment(payment.id, {
        ...data,
        amount: data.amount.toString()
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (payment.isNew && payment.onCancelNew) {
      payment.onCancelNew();
    } else {
      setData({
        influencerName: payment.influencerName || '',
        amount: payment.amount || 0,
        isDone: payment.isDone || '',
        paymentMonth: payment.paymentMonth || '',
        notes: payment.notes || '',
        influencerId: payment.influencerId || ''
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('האם למחוק שורה זו?')) {
      await deleteInfluencerPayment(payment.id);
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50/30 transition-colors flex flex-col md:table-row border-b md:border-none p-4 md:p-0 gap-2 md:gap-0 rounded-lg md:rounded-none mb-4 md:mb-0">
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">שם משפיענ/ית</span><input className="w-full p-1 border rounded text-sm text-right" value={data.influencerName} onChange={e => setData({...data, influencerName: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">שכר בסיס</span><input type="number" className="w-full p-1 border rounded text-sm text-right" dir="ltr" value={data.amount} onChange={e => setData({...data, amount: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1 text-center text-muted-foreground"><span className="md:hidden font-medium text-sm text-gray-500">עמלת קופונים</span>-</td>
        <td className="p-2 flex flex-col md:table-cell gap-1 text-center text-muted-foreground"><span className="md:hidden font-medium text-sm text-gray-500">סה"כ לתשלום</span>-</td>
        <td className="p-2 flex flex-col md:table-cell gap-1">
          <span className="md:hidden font-medium text-sm text-gray-500">בוצע?</span>
          <select 
            className="w-full p-1 border rounded text-sm text-right bg-white" 
            value={data.isDone === 'v' || data.isDone === 'V' || data.isDone === 'כן' || data.isDone === 'בוצע' ? 'בוצע' : 'לא בוצע'} 
            onChange={e => setData({...data, isDone: e.target.value})}
          >
            <option value="לא בוצע">לא בוצע</option>
            <option value="בוצע">בוצע</option>
          </select>
        </td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-gray-500">הערות</span><input className="w-full p-1 border rounded text-sm text-right" value={data.notes} onChange={e => setData({...data, notes: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1">
          <span className="md:hidden font-medium text-sm text-gray-500">קישור למשפיען</span>
          <select className="w-full p-1 border rounded text-sm text-right bg-white" value={data.influencerId} onChange={e => setData({...data, influencerId: e.target.value})}>
            <option value="">לא מקושר</option>
            {Object.entries(influencersConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>
        </td>
        <td className="p-2 flex justify-end md:table-cell mt-2 md:mt-0">
          <div className="flex gap-2 justify-end">
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded bg-green-50 md:bg-transparent"><Check className="h-5 w-5 md:h-4 md:w-4" /></button>
            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded bg-red-50 md:bg-transparent"><X className="h-5 w-5 md:h-4 md:w-4" /></button>
          </div>
        </td>
      </tr>
    );
  }

  const isCompleted = payment.isDone === 'כן' || payment.isDone === 'בוצע' || payment.isDone?.toLowerCase() === 'v';
  const totalPayment = (Number(payment.amount) || 0) + (commission || 0);

  return (
    <tr className="hover:bg-gray-50/50 transition-colors group flex flex-col md:table-row border-b md:border-none p-4 md:p-0 gap-2 md:gap-0 bg-white md:bg-transparent rounded-lg md:rounded-none shadow-sm md:shadow-none mb-4 md:mb-0">
      <td className="py-1 md:py-3 px-2 font-medium flex justify-between items-center md:table-cell text-right">
        <span className="md:hidden text-gray-500 text-sm">שם משפיענ/ית</span>
        {payment.influencerName || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 font-medium flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-gray-500 text-sm">שכר בסיס</span>
        <span dir="ltr">₪{payment.amount || '0'}</span>
      </td>
      <td className="py-1 md:py-3 px-2 font-medium flex justify-between items-center md:table-cell text-center text-blue-600">
        <span className="md:hidden text-gray-500 text-sm">עמלת קופונים</span>
        {isLoadingCommission ? (
           <Loader2 className="animate-spin inline-block w-4 h-4 text-blue-400" />
        ) : (
           <span dir="ltr">₪{commission ? commission.toLocaleString('he-IL', { maximumFractionDigits: 0 }) : '0'}</span>
        )}
      </td>
      <td className="py-1 md:py-3 px-2 font-bold flex justify-between items-center md:table-cell text-center text-emerald-600">
        <span className="md:hidden text-gray-500 text-sm">סה"כ לתשלום</span>
        <span dir="ltr">₪{totalPayment.toLocaleString('he-IL', { maximumFractionDigits: 0 })}</span>
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-gray-500 text-sm">בוצע?</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {isCompleted ? 'בוצע' : 'לא בוצע'}
        </span>
      </td>
      <td className="py-1 md:py-3 px-2 text-muted-foreground flex justify-between items-center md:table-cell text-right max-w-[200px] truncate" title={payment.notes}>
        <span className="md:hidden text-gray-500 text-sm">הערות</span>
        {payment.notes || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-gray-500 text-sm">קישור למשפיען</span>
        {payment.influencerId ? (
          <a href={`/marketing/influencers/${payment.influencerId}`} className="text-blue-600 hover:underline font-medium" target="_blank">
            {influencersConfig[payment.influencerId]?.name || payment.influencerId}
          </a>
        ) : '-'}
      </td>
      <td className="py-2 md:py-3 px-2 flex justify-end md:table-cell mt-2 md:mt-0 border-t md:border-none">
        <div className="flex gap-1 justify-end md:justify-center">
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors bg-blue-50 md:bg-transparent">
            <Edit2 className="h-5 w-5 md:h-4 md:w-4" />
          </button>
          <button onClick={handleDelete} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors bg-red-50 md:bg-transparent">
            <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function MarketingClient({
  activeInfluencers,
  totalFollowersEstimate,
  totalProductsGiven,
  totalInfluencerPayments,
  monthlyGrowth,
  influencerPerformance,
  rawInfluencers,
  rawPayments
}: MarketingClientProps) {
  const [mounted, setMounted] = useState(false);

  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const getMonthWeight = (monthStr: string) => {
    if (!monthStr) return -1;
    for (let i = 0; i < hebrewMonths.length; i++) {
      if (monthStr.includes(hebrewMonths[i])) {
        const match = monthStr.match(/\d{4}/);
        const year = match ? parseInt(match[0], 10) : 0;
        return year * 100 + i;
      }
    }
    const dateMatch = monthStr.match(/(\d{1,2})[./-](\d{2,4})/);
    if (dateMatch) {
      const m = parseInt(dateMatch[1], 10);
      let y = parseInt(dateMatch[2], 10);
      if (y < 100) y += 2000;
      return y * 100 + m;
    }
    return 0; // fallback
  };

  const allMonths = Array.from(new Set(rawPayments.map(p => p.paymentMonth).filter(Boolean))).sort((a, b) => {
    const weightA = getMonthWeight(String(a));
    const weightB = getMonthWeight(String(b));
    if (weightA !== 0 && weightB !== 0 && weightA !== weightB) {
      return weightA - weightB;
    }
    return String(a).localeCompare(String(b));
  });
  const [currentMonthIndex, setCurrentMonthIndex] = useState(allMonths.length > 0 ? allMonths.length - 1 : -1);

  const [isAddingInfluencer, setIsAddingInfluencer] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentMonth = currentMonthIndex >= 0 ? allMonths[currentMonthIndex] : '';
  const filteredPayments = currentMonth ? rawPayments.filter(p => p.paymentMonth === currentMonth) : rawPayments;

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) setCurrentMonthIndex(currentMonthIndex - 1);
  };
  const handleNextMonth = () => {
    if (currentMonthIndex < allMonths.length - 1) setCurrentMonthIndex(currentMonthIndex + 1);
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">שיווק ומשפיענים</h2>
        <p className="text-muted-foreground mt-2">מעקב קמפיינים, משפיענים, והחזר השקעה.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משפיענים במערכת</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(filteredPayments.map(p => p.influencerName || p.influencerId)).size}</div>
            <p className="text-xs text-muted-foreground">משפיענים בטבלת התשלומים החודש</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">תשלומים למשפיענים</CardTitle>
            <HandCoins className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalInfluencerPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">סך תשלומים מתועדים</p>
          </CardContent>
        </Card>
      </div>


      <Card className="bg-white border-none shadow-sm mt-8">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>נתוני משפיענים (גולמי)</CardTitle>
            <CardDescription>פירוט פעילות משפיענים כפי שהוזנה במערכת</CardDescription>
          </div>
          <button onClick={() => setIsAddingInfluencer(true)} className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
            <Plus className="w-4 h-4" /> הוסף חדש
          </button>
        </CardHeader>
        <CardContent>
          <div className="md:overflow-x-auto pb-2">
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-50/80 text-muted-foreground hidden md:table-header-group text-xs md:text-sm">
                <tr>
                  <th className="py-3 px-2 font-medium rounded-tr-md rounded-br-md text-right">שם</th>
                  <th className="py-3 px-2 font-medium text-right">מותג</th>
                  <th className="py-3 px-2 font-medium text-center">בתשלום?</th>
                  <th className="py-3 px-2 font-medium text-center">סרטונים<br/>שסוכמו</th>
                  <th className="py-3 px-2 font-medium text-center">פוסטים<br/>שסוכמו</th>
                  <th className="py-3 px-2 font-medium text-center">מוצרים<br/>שניתנו</th>
                  <th className="py-3 px-2 font-medium text-center">סרטונים<br/>שהועלו</th>
                  <th className="py-3 px-2 font-medium text-right">פעילויות</th>
                  <th className="py-3 px-2 font-medium text-right">הערות</th>
                  <th className="py-3 px-2 font-medium text-center">קישור למשפיען</th>
                  <th className="py-3 px-2 font-medium rounded-tl-md rounded-bl-md text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0 divide-y-0 md:divide-y divide-gray-100">
                {isAddingInfluencer && <EditableInfluencerRow inf={{ isNew: true, onCancelNew: () => setIsAddingInfluencer(false) }} />}
                {rawInfluencers && rawInfluencers.length > 0 ? (
                  rawInfluencers.map((inf) => (
                    <EditableInfluencerRow key={inf.id} inf={inf} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                      לא נמצאו משפיענים.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Raw Influencer Payments Table */}
      <Card className="bg-white border-none shadow-sm mt-8">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>תשלומי משפיענים (גולמי)</CardTitle>
            <CardDescription>פירוט התשלומים למשפיענים כפי שהוזנו במערכת</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsAddingPayment(true)} className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
              <Plus className="w-4 h-4" /> הוסף חדש
            </button>
            {allMonths.length > 0 && (
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-1 border">
                <button 
                  onClick={handlePrevMonth} 
                  disabled={currentMonthIndex === 0}
                  className="p-2 hover:bg-white rounded-md disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="font-medium min-w-[80px] text-center text-sm">{currentMonth || 'הכל'}</span>
                <button 
                  onClick={handleNextMonth} 
                  disabled={currentMonthIndex === allMonths.length - 1}
                  className="p-2 hover:bg-white rounded-md disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="md:overflow-x-auto pb-2">
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-50/80 text-muted-foreground hidden md:table-header-group text-xs md:text-sm">
                <tr>
                  <th className="py-3 px-2 font-medium rounded-tr-md rounded-br-md text-right">שם משפיענ/ית</th>
                  <th className="py-3 px-2 font-medium text-center">שכר בסיס</th>
                  <th className="py-3 px-2 font-medium text-center">עמלת קופונים</th>
                  <th className="py-3 px-2 font-medium text-center">סה"כ לתשלום</th>
                  <th className="py-3 px-2 font-medium text-center">בוצע?</th>
                  <th className="py-3 px-2 font-medium text-right">הערות</th>
                  <th className="py-3 px-2 font-medium text-center">קישור למשפיען</th>
                  <th className="py-3 px-2 font-medium rounded-tl-md rounded-bl-md text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0 divide-y-0 md:divide-y divide-gray-100">
                {isAddingPayment && <EditablePaymentRow payment={{ isNew: true, paymentMonth: currentMonth, onCancelNew: () => setIsAddingPayment(false) }} />}
                {filteredPayments && filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <EditablePaymentRow key={payment.id} payment={payment} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      לא נמצאו תשלומים לחודש זה.
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
