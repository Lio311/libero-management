/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';

const formatCurrency = (num: number | string) => {
  const parsed = Number(num) || 0;
  const rounded = Math.round(parsed * 100) / 100;
  const parts = rounded.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};
import { Users, Camera, TrendingUp, HandCoins } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { updateInfluencer, updateInfluencerPayment, createInfluencer, deleteInfluencer, createInfluencerPayment, deleteInfluencerPayment } from "@/app/actions/marketing";
import { Check, X, Edit2, ChevronRight, ChevronLeft, Trash2, Plus, Loader2 } from "lucide-react";
import { influencersConfig } from '@/config/influencers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";

interface MarketingClientProps {
  activeInfluencers: number;
  totalFollowersEstimate: string;
  totalProductsGiven: number;
  totalInfluencerPayments: number;
  monthlyGrowth: any[];
  influencerPerformance: any[];
  rawInfluencers: any[];
  rawPayments: any[];
  uniqueBrands?: string[];
}

function EditableInfluencerRow({ inf, uniqueBrands = [] }: { inf: any, uniqueBrands?: string[] }) {
  const confirm = useConfirm();
  const [isEditing, setIsEditing] = useState(false);
  
  const config = inf.influencerId ? influencersConfig[inf.influencerId] : null;
  const actualBaseSalary = Number(inf.baseSalary) || (config?.baseSalary || 0);
  const actualBaseLibero = Number(inf.baseLibero) || (config?.baseLibero || 0);
  const actualBaseVelour = Number(inf.baseVelour) || (config?.baseVelour || 0);
  const actualBaseLabura = Number(inf.baseLabura) || (config?.baseLabura || 0);

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
    influencerId: inf.influencerId || '',
    baseSalary: actualBaseSalary as any,
    baseLibero: actualBaseLibero as any,
    baseVelour: actualBaseVelour as any,
    baseLabura: actualBaseLabura as any
  });

  const handleSave = async () => {
    const totalBase = Number(data.baseLibero || 0) + Number(data.baseVelour || 0) + Number(data.baseLabura || 0);
    const payload = {
      ...data,
      baseSalary: totalBase.toString(),
      baseLibero: data.baseLibero.toString(),
      baseVelour: data.baseVelour.toString(),
      baseLabura: data.baseLabura.toString()
    };
    if (inf.isNew) {
      await createInfluencer(payload);
      if (inf.onCancelNew) inf.onCancelNew();
    } else {
      await updateInfluencer(inf.id, payload);
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
        influencerId: inf.influencerId || '',
        baseSalary: inf.baseSalary || 0,
        baseLibero: inf.baseLibero || 0,
        baseVelour: inf.baseVelour || 0,
        baseLabura: inf.baseLabura || 0
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await confirm({ title: 'מחיקת משפיען', message: 'האם למחוק שורה זו?', confirmText: 'מחק', variant: 'destructive' })) {
      try {
        await deleteInfluencer(inf.id);
        toast.success('משפיען נמחק בהצלחה');
      } catch (err: any) {
        console.error('Delete influencer error:', err);
        toast.error('שגיאה במחיקת משפיען: ' + (err?.message || 'שגיאה לא ידועה'));
      }
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-slate-50 transition-colors flex flex-col md:table-row border-b md:border-none p-4 md:p-0 gap-2 md:gap-0 rounded-lg md:rounded-none mb-4 md:mb-0">
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-slate-700">שם</span><input className="w-full p-1 border rounded text-sm text-right" value={data.influencerName} onChange={e => setData({...data, influencerName: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1">
          <span className="md:hidden font-medium text-sm text-slate-700">מותג</span>
          <Popover>
            <PopoverTrigger dir="rtl" className="w-full p-1 border rounded text-sm text-right bg-slate-50 h-auto py-[0.4rem] min-h-[34px] flex items-center justify-between text-slate-700 hover:bg-slate-50 truncate">
              <span className="truncate">{data.brand || 'בחר מותג'}</span>
            </PopoverTrigger>
            <PopoverContent align="end" side="bottom" className="w-56 max-h-64 overflow-y-auto p-1" dir="rtl">
              <div className="flex flex-col gap-1">
                {uniqueBrands?.map((b) => {
                  const currentBrands = data.brand ? data.brand.split(',').map((br: string) => br.trim()).filter(Boolean) : [];
                  const isSelected = currentBrands.includes(b);
                  return (
                    <label key={b} className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer text-sm">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setData({ ...data, brand: currentBrands.filter((br: string) => br !== b).join(', ') });
                          } else {
                            setData({ ...data, brand: [...currentBrands, b].join(', ') });
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="truncate">{b}</span>
                    </label>
                  );
                })}
                {(!uniqueBrands || uniqueBrands.length === 0) && (
                  <div className="p-2 text-sm text-slate-700 text-center">אין מותגים</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-slate-700">בתשלום?</span><input className="w-full p-1 border rounded text-sm text-right" value={data.isPaid} onChange={e => setData({...data, isPaid: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1">
          <span className="md:hidden font-medium text-sm text-slate-700">שכר בסיס</span>
          <div className="flex flex-col gap-1 min-w-[120px]">
            <div className="flex items-center gap-1"><span className="text-[10px] w-12 text-right">ליברו:</span><input type="number" className="w-full p-1 border rounded text-xs text-center" value={data.baseLibero} onChange={e => setData({...data, baseLibero: e.target.value})} /></div>
            <div className="flex items-center gap-1"><span className="text-[10px] w-12 text-right">וולור:</span><input type="number" className="w-full p-1 border rounded text-xs text-center" value={data.baseVelour} onChange={e => setData({...data, baseVelour: e.target.value})} /></div>
            <div className="flex items-center gap-1"><span className="text-[10px] w-12 text-right">לה בורה:</span><input type="number" className="w-full p-1 border rounded text-xs text-center" value={data.baseLabura} onChange={e => setData({...data, baseLabura: e.target.value})} /></div>
          </div>
        </td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-slate-700">מספר סרטונים</span><input className="w-full p-1 border rounded text-sm text-right" value={data.videoCount} onChange={e => setData({...data, videoCount: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-slate-700">מספר פוסטים</span><input className="w-full p-1 border rounded text-sm text-right" value={data.postCount} onChange={e => setData({...data, postCount: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-slate-700">מוצרים שניתנו</span><input className="w-full p-1 border rounded text-sm text-right" value={data.productsGiven} onChange={e => setData({...data, productsGiven: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-slate-700">סרטונים שהועלו</span><input className="w-full p-1 border rounded text-sm text-right" value={data.videosUploaded} onChange={e => setData({...data, videosUploaded: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-slate-700">פעילויות</span><input className="w-full p-1 border rounded text-sm text-right" value={data.activities} onChange={e => setData({...data, activities: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-slate-700">הערות</span><input className="w-full p-1 border rounded text-sm text-right" value={data.notes} onChange={e => setData({...data, notes: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1">
          <span className="md:hidden font-medium text-sm text-slate-700">קישור למשפיען</span>
          <Select value={data.influencerId || "unlinked"} onValueChange={val => setData({...data, influencerId: val === "unlinked" ? "" : val})}>
            <SelectTrigger className="w-full p-1 border rounded text-sm text-right bg-slate-50 h-auto py-[0.4rem]">
              <SelectValue placeholder="לא מקושר" />
            </SelectTrigger>
            <SelectContent side="bottom" align="end">
              <SelectItem value="unlinked">לא מקושר</SelectItem>
              {Object.entries(influencersConfig)
                .sort(([, a], [, b]) => a.name > b.name ? 1 : -1)
                .map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="p-2 flex justify-end md:table-cell mt-2 md:mt-0">
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-1 text-green-700 hover:bg-green-200 rounded bg-green-100 md:bg-transparent"><Check className="h-5 w-5 md:h-4 md:w-4" /></button>
            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-200 rounded bg-red-100 md:bg-transparent"><X className="h-5 w-5 md:h-4 md:w-4" /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-transparent transition-colors group flex flex-col md:table-row border-b md:border-none p-4 md:p-0 gap-2 md:gap-0 bg-slate-50 md:bg-transparent rounded-lg md:rounded-none shadow-sm md:shadow-none mb-4 md:mb-0">
      <td className="py-1 md:py-3 px-2 font-medium flex justify-between items-center md:table-cell text-right">
        <span className="md:hidden text-slate-700 text-sm">שם</span>
        {inf.influencerName || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-right">
        <span className="md:hidden text-slate-700 text-sm">מותג</span>
        {inf.brand || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-slate-700 text-sm">בתשלום?</span>
        {inf.isPaid || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-slate-700 text-sm">שכר בסיס</span>
        {inf.influencerId === 'moran' ? (
          <span className="text-slate-500">-</span>
        ) : (
          <div className="flex flex-col items-center">
            <span>{actualBaseSalary ? `₪${formatCurrency(actualBaseSalary)}` : '-'}</span>
            {(actualBaseLibero > 0 || actualBaseVelour > 0 || actualBaseLabura > 0) && (
              <div className="text-[10px] text-slate-700 font-normal leading-tight mt-1 flex flex-col gap-0.5">
                {actualBaseLibero > 0 && <div className="whitespace-nowrap">ליברו: ₪{formatCurrency(actualBaseLibero)}</div>}
                {actualBaseVelour > 0 && <div className="whitespace-nowrap">וולור: ₪{formatCurrency(actualBaseVelour)}</div>}
                {actualBaseLabura > 0 && <div className="whitespace-nowrap">לה בורה: ₪{formatCurrency(actualBaseLabura)}</div>}
              </div>
            )}
          </div>
        )}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-slate-700 text-sm">סרטונים</span>
        {inf.videoCount || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-slate-700 text-sm">פוסטים</span>
        {inf.postCount || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 text-slate-700 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-slate-700 text-sm">מוצרים שניתנו</span>
        {inf.productsGiven || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 text-slate-700 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-slate-700 text-sm">סרטונים שהועלו</span>
        {inf.videosUploaded || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 max-w-[150px] truncate flex justify-between items-center md:table-cell text-right" title={inf.activities}>
        <span className="md:hidden text-slate-700 text-sm">פעילויות</span>
        {inf.activities || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 text-slate-700 max-w-[150px] truncate flex justify-between items-center md:table-cell text-right" title={inf.notes}>
        <span className="md:hidden text-slate-700 text-sm">הערות</span>
        {inf.notes || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-slate-700 text-sm">קישור למשפיען</span>
        {inf.influencerId ? (
          <a href={inf.influencerId === 'oded' ? '/marketing/oded' : `/marketing/influencers/${inf.influencerId}`} className="text-blue-600 hover:underline font-medium" target="_blank">
            {influencersConfig[inf.influencerId]?.name || inf.influencerId}
          </a>
        ) : '-'}
      </td>
      <td className="py-2 md:py-3 px-2 flex justify-end md:table-cell mt-2 md:mt-0 border-t md:border-none">
        <div className="flex gap-1 justify-end md:justify-center">
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-600 hover:bg-blue-200 rounded-md transition-colors bg-blue-100 md:bg-transparent">
            <Edit2 className="h-5 w-5 md:h-4 md:w-4" />
          </button>
          <button onClick={handleDelete} className="p-1.5 text-red-600 hover:bg-red-200 rounded-md transition-colors bg-red-100 md:bg-transparent">
            <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
// Global queue to prevent 504 errors from WooCommerce API due to too many concurrent requests
type FetchTask = () => Promise<void>;
const fetchQueue: FetchTask[] = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  while (fetchQueue.length > 0) {
    const tasks = fetchQueue.splice(0, 3); // Fetch 3 at a time max
    await Promise.allSettled(tasks.map(task => task()));
    await new Promise(r => setTimeout(r, 500)); // Delay between batches
  }
  isProcessingQueue = false;
};

function EditablePaymentRow({ payment, rawInfluencers, onTotalChange }: { payment: any, rawInfluencers: any[], onTotalChange?: (id: string, amount: number) => void }) {
  const confirm = useConfirm();
  const [isEditing, setIsEditing] = useState(false);
  const [commission, setCommission] = useState<number | null>(null);
  const [isLoadingCommission, setIsLoadingCommission] = useState(false);

  useEffect(() => {
    if (payment.influencerId && payment.paymentMonth) {
      const hebrewMonthsList = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
      ];
      const monthParam = payment.paymentMonth;
      if (monthParam && String(monthParam).match(/^\d{4}-\d{2}$/)) {
        setIsLoadingCommission(true);
        const apiUrl = payment.influencerId === 'oded' 
          ? `/api/oded-coupon?month=${monthParam}`
          : `/api/influencer-coupon/${payment.influencerId}?month=${monthParam}`;
          
        fetchQueue.push(async () => {
          try {
            const res = await fetch(apiUrl);
            if (!res.ok) {
              console.error('Fetch error for', payment.influencerId, ':', res.status);
              return;
            }
            const data = await res.json();
            if (data && data.summary && data.summary.commission !== undefined) {
               setCommission(Math.round(Number(data.summary.commission) * 100) / 100);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setIsLoadingCommission(false);
          }
        });
        processQueue();
      }
    }
  }, [payment.influencerId, payment.paymentMonth]);

  const config = payment.influencerId ? influencersConfig[payment.influencerId] : null;
  const actualBaseSalary = Number(payment.baseSalary) || (config?.baseSalary || 0);
  const actualBaseLibero = Number(payment.baseLibero) || (config?.baseLibero || 0);
  const actualBaseVelour = Number(payment.baseVelour) || (config?.baseVelour || 0);
  const actualBaseLabura = Number(payment.baseLabura) || (config?.baseLabura || 0);

  const [data, setData] = useState({
    influencerName: payment.influencerName || '',
    amount: payment.amount || 0,
    isDone: payment.isDone || '',
    paymentMonth: payment.paymentMonth || '',
    notes: payment.notes || '',
    influencerId: payment.influencerId || '',
    baseSalary: actualBaseSalary as any,
    baseLibero: actualBaseLibero as any,
    baseVelour: actualBaseVelour as any,
    baseLabura: actualBaseLabura as any,
    monthlyBonus: payment.monthlyBonus || 0
  });

  const handleSave = async () => {
    const totalBase = Number(data.baseLibero || 0) + Number(data.baseVelour || 0) + Number(data.baseLabura || 0);
    if (payment.isNew || payment.hasRealPayment === false) {
      await createInfluencerPayment({
        ...data,
        amount: data.amount.toString(),
        baseSalary: totalBase.toString(),
        baseLibero: data.baseLibero.toString(),
        baseVelour: data.baseVelour.toString(),
        baseLabura: data.baseLabura.toString(),
        monthlyBonus: data.monthlyBonus.toString(),
        paymentMonth: payment.paymentMonth || data.paymentMonth
      });
      if (payment.onCancelNew) payment.onCancelNew();
      else setIsEditing(false);
    } else {
      await updateInfluencerPayment(payment.id, {
        ...data,
        amount: data.amount.toString(),
        baseSalary: totalBase.toString(),
        baseLibero: data.baseLibero.toString(),
        baseVelour: data.baseVelour.toString(),
        baseLabura: data.baseLabura.toString(),
        monthlyBonus: data.monthlyBonus.toString()
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
        influencerId: payment.influencerId || '',
        baseSalary: payment.baseSalary || 0,
        baseLibero: payment.baseLibero || 0,
        baseVelour: payment.baseVelour || 0,
        baseLabura: payment.baseLabura || 0,
        monthlyBonus: payment.monthlyBonus || 0
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await confirm({ title: 'מחיקת תשלום', message: 'האם למחוק שורה זו?', confirmText: 'מחק', variant: 'destructive' })) {
      try {
        if (payment.hasRealPayment !== false) {
          await deleteInfluencerPayment(payment.id);
        } else if (payment.id && payment.id.startsWith('pseudo-')) {
          // pseudo row - influencer exists in config or DB but has no payment record for this month
          if (payment.influencerId && influencersConfig[payment.influencerId]) {
            toast.error('לא ניתן למחוק משפיען שמוגדר בקוד. ניתן למחוק רק משפיענים שנוספו ידנית.');
          } else if (payment.dbId) {
            await deleteInfluencer(payment.dbId);
            toast.success('משפיען נמחק בהצלחה');
          } else {
            toast.error('לא ניתן למחוק שורה זו - לא נמצא מזהה בבסיס הנתונים.');
          }
        }
      } catch (err: any) {
        console.error('Delete error:', err);
        toast.error('שגיאה במחיקה: ' + (err?.message || 'שגיאה לא ידועה'));
      }
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-slate-50 transition-colors flex flex-col md:table-row border-b md:border-none p-4 md:p-0 gap-2 md:gap-0 rounded-lg md:rounded-none mb-4 md:mb-0">
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-slate-700">שם משפיענ/ית</span><input className="w-full p-1 border rounded text-sm text-right" value={data.influencerName} onChange={e => setData({...data, influencerName: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1 text-center text-slate-700"><span className="md:hidden font-medium text-sm text-slate-700">עמלת קופונים</span>-</td>
        <td className="p-2 flex flex-col md:table-cell gap-1">
          <span className="md:hidden font-medium text-sm text-slate-700">שכר בסיס</span>
          <div className="flex flex-col gap-1 min-w-[120px]">
            <div className="flex items-center gap-1"><span className="text-[10px] w-12 text-right">ליברו:</span><input type="number" className="w-full p-1 border rounded text-xs text-center" value={data.baseLibero} onChange={e => setData({...data, baseLibero: e.target.value})} /></div>
            <div className="flex items-center gap-1"><span className="text-[10px] w-12 text-right">וולור:</span><input type="number" className="w-full p-1 border rounded text-xs text-center" value={data.baseVelour} onChange={e => setData({...data, baseVelour: e.target.value})} /></div>
            <div className="flex items-center gap-1"><span className="text-[10px] w-12 text-right">לה בורה:</span><input type="number" className="w-full p-1 border rounded text-xs text-center" value={data.baseLabura} onChange={e => setData({...data, baseLabura: e.target.value})} /></div>
          </div>
        </td>
        <td className="p-2 flex flex-col md:table-cell gap-1">
          <span className="md:hidden font-medium text-sm text-slate-700">תוספת חודשית</span>
          <input type="number" className="w-full p-1 border rounded text-sm text-center" value={data.monthlyBonus || ''} onChange={e => setData({...data, monthlyBonus: e.target.value})} />
        </td>
        <td className="p-2 flex flex-col md:table-cell gap-1 text-center text-slate-700"><span className="md:hidden font-medium text-sm text-slate-700">סה"כ לתשלום</span>-</td>
        <td className="p-2 flex flex-col md:table-cell gap-1">
          <span className="md:hidden font-medium text-sm text-slate-700">בוצע?</span>
          <Select 
            value={data.isDone === 'v' || data.isDone === 'V' || data.isDone === 'כן' || data.isDone === 'בוצע' ? 'בוצע' : 'לא בוצע'} 
            onValueChange={val => setData({...data, isDone: val})}
          >
            <SelectTrigger className="w-full p-1 border rounded text-sm text-right bg-slate-50 h-auto py-[0.4rem]">
              <SelectValue placeholder="לא בוצע" />
            </SelectTrigger>
            <SelectContent side="bottom" align="end">
              <SelectItem value="לא בוצע">לא בוצע</SelectItem>
              <SelectItem value="בוצע">בוצע</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-sm text-slate-700">הערות</span><input className="w-full p-1 border rounded text-sm text-right" value={data.notes} onChange={e => setData({...data, notes: e.target.value})} /></td>
        <td className="p-2 flex flex-col md:table-cell gap-1">
          <span className="md:hidden font-medium text-sm text-slate-700">קישור למשפיען</span>
          <Select value={data.influencerId || "unlinked"} onValueChange={val => setData({...data, influencerId: val === "unlinked" ? "" : val})}>
            <SelectTrigger className="w-full p-1 border rounded text-sm text-right bg-slate-50 h-auto py-[0.4rem]">
              <SelectValue placeholder="לא מקושר" />
            </SelectTrigger>
            <SelectContent side="bottom" align="end">
              <SelectItem value="unlinked">לא מקושר</SelectItem>
              {Object.entries(influencersConfig)
                .sort(([, a], [, b]) => a.name > b.name ? 1 : -1)
                .map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="p-2 flex justify-end md:table-cell mt-2 md:mt-0">
          <div className="flex gap-2 justify-end">
            <button onClick={handleSave} className="p-1 text-green-700 hover:bg-green-200 rounded bg-green-100 md:bg-transparent"><Check className="h-5 w-5 md:h-4 md:w-4" /></button>
            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-200 rounded bg-red-100 md:bg-transparent"><X className="h-5 w-5 md:h-4 md:w-4" /></button>
          </div>
        </td>
      </tr>
    );
  }

  const isCompleted = payment.isDone === 'כן' || payment.isDone === 'בוצע' || payment.isDone?.toLowerCase() === 'v';
  
  const currentInfluencerId = data.influencerId || payment.influencerId;
  const selectedInfluencer = rawInfluencers?.find((i: any) => i.influencerId === currentInfluencerId);
  const monthlyBonus = Number(payment.monthlyBonus || 0);
  const totalPayment = (commission || 0) + actualBaseSalary + monthlyBonus;
  const isMoran = currentInfluencerId === 'moran';

  useEffect(() => {
    if (onTotalChange && payment.id && !payment.isNew && !isMoran) {
      onTotalChange(payment.id, totalPayment);
    }
  }, [totalPayment, payment.id, payment.isNew, isMoran, onTotalChange]);


  return (
    <tr className="hover:bg-transparent transition-colors group flex flex-col md:table-row border-b md:border-none p-4 md:p-0 gap-2 md:gap-0 bg-slate-50 md:bg-transparent rounded-lg md:rounded-none shadow-sm md:shadow-none mb-4 md:mb-0">
      <td className="py-1 md:py-3 px-2 font-medium flex justify-between items-center md:table-cell text-right">
        <span className="md:hidden text-slate-700 text-sm">שם משפיענ/ית</span>
        {payment.influencerId ? (
          <a href={payment.influencerId === 'oded' ? '/marketing/oded' : `/marketing/influencers/${payment.influencerId}`} className="hover:underline text-blue-600 transition-colors" target="_blank" title={`למעבר לעמוד של ${payment.influencerName}`}>
            {payment.influencerName || '-'}
          </a>
        ) : (
          payment.influencerName || '-'
        )}
      </td>
      <td className="py-1 md:py-3 px-2 font-medium flex justify-between items-center md:table-cell text-center text-blue-600">
        <span className="md:hidden text-slate-700 text-sm">עמלת קופונים</span>
        {isMoran ? (
           <span className="text-slate-500">-</span>
        ) : isLoadingCommission ? (
           <Loader2 className="animate-spin inline-block w-4 h-4 text-blue-600" />
        ) : (
           <span dir="ltr">₪{commission ? formatCurrency(commission) : '0'}</span>
        )}
      </td>
      <td className="py-1 md:py-3 px-2 font-medium flex justify-between items-center md:table-cell text-center text-purple-600">
        <span className="md:hidden text-slate-700 text-sm">שכר בסיס</span>
        {isMoran ? (
          <span className="text-slate-500">-</span>
        ) : (
          <div className="flex flex-col items-center">
            <span dir="ltr">₪{formatCurrency(actualBaseSalary)}</span>
            {(actualBaseLibero > 0 || actualBaseVelour > 0 || actualBaseLabura > 0) && (
              <div className="text-[10px] text-slate-700 font-normal leading-tight mt-1 flex flex-col gap-0.5">
                {actualBaseLibero > 0 && <div className="whitespace-nowrap">ליברו: ₪{formatCurrency(actualBaseLibero)}</div>}
                {actualBaseVelour > 0 && <div className="whitespace-nowrap">וולור: ₪{formatCurrency(actualBaseVelour)}</div>}
                {actualBaseLabura > 0 && <div className="whitespace-nowrap">לה בורה: ₪{formatCurrency(actualBaseLabura)}</div>}
              </div>
            )}
          </div>
        )}
      </td>
      <td className="py-1 md:py-3 px-2 font-medium flex justify-between items-center md:table-cell text-center text-pink-600">
        <span className="md:hidden text-slate-700 text-sm">תוספת חודשית</span>
        {isMoran ? <span className="text-slate-500">-</span> : <span dir="ltr">₪{formatCurrency(monthlyBonus)}</span>}
      </td>
      <td className="py-1 md:py-3 px-2 font-bold flex justify-between items-center md:table-cell text-center text-emerald-600">
        <span className="md:hidden text-slate-700 text-sm">סה"כ לתשלום</span>
        {isMoran ? <span className="text-slate-500">-</span> : <span dir="ltr">₪{formatCurrency(totalPayment)}</span>}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-slate-700 text-sm">בוצע?</span>
        {totalPayment === 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-900">
            אין צורך
          </span>
        ) : (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-800 ' : 'bg-yellow-100 text-yellow-800 '}`}>
            {isCompleted ? 'בוצע' : 'לא בוצע'}
          </span>
        )}
      </td>
      <td className="py-1 md:py-3 px-2 text-slate-700 flex justify-between items-center md:table-cell text-right max-w-[200px] truncate" title={payment.notes}>
        <span className="md:hidden text-slate-700 text-sm">הערות</span>
        {payment.notes || '-'}
      </td>
      <td className="py-1 md:py-3 px-2 flex justify-between items-center md:table-cell text-center">
        <span className="md:hidden text-slate-700 text-sm">קישור למשפיען</span>
        {payment.influencerId ? (
          <a href={payment.influencerId === 'oded' ? '/marketing/oded' : `/marketing/influencers/${payment.influencerId}`} className="text-blue-600 hover:underline font-medium" target="_blank">
            {influencersConfig[payment.influencerId]?.name || payment.influencerId}
          </a>
        ) : '-'}
      </td>
      <td className="py-2 md:py-3 px-2 flex justify-end md:table-cell mt-2 md:mt-0 border-t md:border-none">
        <div className="flex gap-1 justify-end md:justify-center">
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-600 hover:bg-blue-200 rounded-md transition-colors bg-blue-100 md:bg-transparent">
            <Edit2 className="h-5 w-5 md:h-4 md:w-4" />
          </button>
          <button onClick={handleDelete} className="p-1.5 text-red-600 hover:bg-red-200 rounded-md transition-colors bg-red-100 md:bg-transparent">
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
  rawPayments,
  uniqueBrands
}: MarketingClientProps) {
  const [mounted, setMounted] = useState(false);

  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  const formatMonthName = (monthStr: string) => {
    if(!monthStr) return '';
    const match = String(monthStr).match(/^(\d{4})-(\d{2})$/);
    if (match) {
      return `${hebrewMonths[parseInt(match[2], 10) - 1]} ${match[1]}`;
    }
    return monthStr;
  };

  const getMonthWeight = (monthStr: string) => {
    if (!monthStr) return -1;
    const match = String(monthStr).match(/^(\d{4})-(\d{2})$/);
    if (match) {
      return parseInt(match[1], 10) * 100 + parseInt(match[2], 10);
    }
    return 0;
  };

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const allMonths = Array.from(new Set([
    ...rawPayments.map(p => p.paymentMonth).filter(Boolean),
    currentMonthStr
  ])).sort((a, b) => {
    const weightA = getMonthWeight(String(a));
    const weightB = getMonthWeight(String(b));
    if (weightA !== 0 && weightB !== 0 && weightA !== weightB) {
      return weightA - weightB;
    }
    return String(a) > String(b) ? 1 : -1;
  });
  const [currentMonthIndex, setCurrentMonthIndex] = useState(allMonths.length - 1);

  const [isAddingInfluencer, setIsAddingInfluencer] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [rowTotals, setRowTotals] = useState<Record<string, number>>({});
  
  const handleRowTotalChange = React.useCallback((id: string, amount: number) => {
    setRowTotals(prev => {
      if (prev[id] === amount) return prev;
      return { ...prev, [id]: amount };
    });
  }, []);
  
  const currentMonth = currentMonthIndex >= 0 && currentMonthIndex < allMonths.length ? allMonths[currentMonthIndex] : '';

  useEffect(() => {
    setRowTotals({});
  }, [currentMonth]);

  const handleExportExcel = async () => {
    if (!currentMonth) {
      toast.error("אנא בחר חודש לייצוא");
      return;
    }
    setIsExporting(true);
    try {
      const res = await fetch(`/api/marketing/export-salaries?month=${currentMonth}`);
      if (!res.ok) throw new Error("Failed to export");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salaries-${currentMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("אירעה שגיאה בהורדת הקובץ");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (currentMonthIndex === -1 && allMonths.length > 0) {
      setCurrentMonthIndex(allMonths.length - 1);
    }
  }, [allMonths.length, currentMonthIndex]);

  if (!mounted) {
    return (
      <div className="p-8 space-y-8 bg-transparent min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredPayments = currentMonth ? rawPayments.filter(p => p.paymentMonth === currentMonth) : rawPayments;

  const combinedPayments = currentMonth ? (() => {
    const influencerMap = new Map<string, { influencerId?: string; influencerName: string; baseSalary: number; baseLibero: number; baseVelour: number; baseLabura: number; dbId?: string }>();

    // From influencersConfig
    Object.entries(influencersConfig).forEach(([key, config]) => {
      influencerMap.set(key, {
        influencerId: key,
        influencerName: config.name,
        baseSalary: config.baseSalary || 0,
        baseLibero: config.baseLibero || 0,
        baseVelour: config.baseVelour || 0,
        baseLabura: config.baseLabura || 0
      });
    });

    // From rawInfluencers (top table)
    (rawInfluencers || []).forEach(inf => {
      const key = inf.influencerId || inf.influencerName || inf.id;
      if (!influencerMap.has(key)) {
        influencerMap.set(key, {
          influencerId: inf.influencerId || undefined,
          influencerName: inf.influencerName || '',
          baseSalary: Number(inf.baseSalary) || 0,
          baseLibero: Number(inf.baseLibero) || 0,
          baseVelour: Number(inf.baseVelour) || 0,
          baseLabura: Number(inf.baseLabura) || 0,
          dbId: inf.id // the actual UUID from the influencers table
        });
      } else {
        const current = influencerMap.get(key)!;
        current.baseSalary = Number(inf.baseSalary) || current.baseSalary;
        current.baseLibero = Number(inf.baseLibero) || current.baseLibero;
        current.baseVelour = Number(inf.baseVelour) || current.baseVelour;
        current.baseLabura = Number(inf.baseLabura) || current.baseLabura;
        current.dbId = inf.id || current.dbId;
      }
    });

    const currentMonthWeight = getMonthWeight(currentMonth);

    // From rawPayments (payment records)
    const sortedPayments = [...(rawPayments || [])].sort((a, b) => getMonthWeight(String(a.paymentMonth)) - getMonthWeight(String(b.paymentMonth)));
    
    sortedPayments.forEach(p => {
      const pWeight = getMonthWeight(String(p.paymentMonth));
      if (pWeight <= currentMonthWeight) {
        const key = p.influencerId || p.influencerName || p.id;
        if (!influencerMap.has(key)) {
          influencerMap.set(key, {
            influencerId: p.influencerId || undefined,
            influencerName: p.influencerName || '',
            baseSalary: Number(p.baseSalary) || 0,
            baseLibero: Number(p.baseLibero) || 0,
            baseVelour: Number(p.baseVelour) || 0,
            baseLabura: Number(p.baseLabura) || 0,
            dbId: p.id // the actual UUID from the influencer_payments table
          });
        } else {
          const current = influencerMap.get(key)!;
          if (p.baseSalary !== undefined && p.baseSalary !== null) {
            current.baseSalary = Number(p.baseSalary) || 0;
            current.baseLibero = Number(p.baseLibero) || 0;
            current.baseVelour = Number(p.baseVelour) || 0;
            current.baseLabura = Number(p.baseLabura) || 0;
          }
        }
      }
    });

    const resultRows: any[] = [];
    const processedPaymentIds = new Set<string>();

    influencerMap.forEach((infInfo, key) => {
      const existingPayment = filteredPayments.find(p => 
        (p.influencerId && p.influencerId === infInfo.influencerId) ||
        (p.influencerName && p.influencerName === infInfo.influencerName)
      );

      if (existingPayment) {
        processedPaymentIds.add(existingPayment.id);
        resultRows.push({
          ...existingPayment,
          influencerName: infInfo.influencerName || existingPayment.influencerName,
          baseSalary: existingPayment.baseSalary || 0,
          hasRealPayment: true
        });
      } else {
        resultRows.push({
          id: `pseudo-${key}-${currentMonth}`,
          pseudoKey: key,
          dbId: infInfo.dbId,
          influencerId: infInfo.influencerId,
          influencerName: infInfo.influencerName,
          amount: 0,
          isDone: 'לא בוצע',
          paymentMonth: currentMonth,
          notes: '',
          baseSalary: infInfo.baseSalary,
          baseLibero: infInfo.baseLibero,
          baseVelour: infInfo.baseVelour,
          baseLabura: infInfo.baseLabura,
          hasRealPayment: false
        });
      }
    });

    filteredPayments.forEach(p => {
      if (!processedPaymentIds.has(p.id)) {
        resultRows.push({
          ...p,
          baseSalary: p.baseSalary || 0,
          hasRealPayment: true
        });
      }
    });

    return resultRows;
  })() : rawPayments.map(p => ({ ...p, baseSalary: p.baseSalary || 0, hasRealPayment: true }));

  const totalInfluencersInSystemCount = (() => {
    const keys = new Set<string>();
    Object.keys(influencersConfig).forEach(k => keys.add(k));
    (rawInfluencers || []).forEach(i => keys.add(i.influencerName || i.id));
    (rawPayments || []).forEach(p => keys.add(p.influencerName || p.id));
    return keys.size;
  })();

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) setCurrentMonthIndex(currentMonthIndex - 1);
  };
  const handleNextMonth = () => {
    if (currentMonthIndex < allMonths.length - 1) setCurrentMonthIndex(currentMonthIndex + 1);
  };

  const displayedTotal = Object.values(rowTotals).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            <h3 className="text-xl font-medium text-slate-900">מכין את קובץ האקסל...</h3>
            <p className="text-slate-500 text-sm">זה עשוי לקחת מספר שניות, אנא המתן.</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">שיווק ומשפיענים</h2>
        <p className="text-slate-600 mt-2">מעקב קמפיינים, משפיענים, והחזר השקעה.</p>
      </div>

      <div className="lg:col-span-6 glass-panel rounded-3xl p-6 flex flex-col justify-center">
        <div className="flex items-center justify-between pb-2">
          <div className="text-sm font-medium text-slate-600">משפיענים במערכת</div>
          <Users className="h-4 w-4 text-slate-600" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{totalInfluencersInSystemCount}</div>
        <p className="text-xs text-slate-600">משפיענים פעילים במערכת</p>
      </div>

      <div className="lg:col-span-6 glass-panel rounded-3xl p-6 flex flex-col justify-center">
        <div className="flex items-center justify-between pb-2">
          <div className="text-sm font-medium text-slate-600">תשלומים למשפיענים</div>
          <HandCoins className="h-4 w-4 text-slate-600" />
        </div>
        <div className="text-2xl font-bold text-slate-900">₪{formatCurrency(displayedTotal)}</div>
        <p className="text-xs text-slate-600">סך תשלומים מתועדים</p>
      </div>


      <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
        <div className="flex flex-row items-center justify-between pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">נתוני משפיענים (גולמי)</h3>
            <p className="text-sm text-slate-600">פירוט פעילות משפיענים כפי שהוזנה במערכת</p>
          </div>
          <button onClick={() => setIsAddingInfluencer(true)} className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
            <Plus className="w-4 h-4" /> הוסף חדש
          </button>
        </div>
        <div>
          <div className="md:overflow-x-auto pb-2">
            <table className="w-full text-sm text-center">
              <thead className="bg-slate-50/80 text-slate-700 hidden md:table-header-group text-xs md:text-sm">
                <tr>
                  <th className="py-3 px-2 font-medium rounded-tr-md rounded-br-md text-right">שם</th>
                  <th className="py-3 px-2 font-medium text-right">מותג</th>
                  <th className="py-3 px-2 font-medium text-center">בתשלום?</th>
                  <th className="py-3 px-2 font-medium text-center">שכר בסיס</th>
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
              <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0 divide-y-0 md:divide-y divide-gray-100" suppressHydrationWarning>
                {isAddingInfluencer && <EditableInfluencerRow inf={{ isNew: true, onCancelNew: () => setIsAddingInfluencer(false) }} uniqueBrands={uniqueBrands} />}
                {rawInfluencers && rawInfluencers.length > 0 ? (
                  [...rawInfluencers]
                    .sort((a, b) => (a.influencerName || '') > (b.influencerName || '') ? 1 : -1)
                    .map((inf) => (
                    <EditableInfluencerRow key={inf.id} inf={inf} uniqueBrands={uniqueBrands} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-700">
                      לא נמצאו משפיענים.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Raw Influencer Payments Table */}
      <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
        <div className="flex flex-row items-center justify-between pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">תשלומי משפיענים (גולמי)</h3>
            <p className="text-sm text-slate-600">פירוט התשלומים למשפיענים כפי שהוזנו במערכת</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleExportExcel} disabled={isExporting} className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              הורד אקסל
            </button>
            <button onClick={() => setIsAddingPayment(true)} className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
              <Plus className="w-4 h-4" /> הוסף חדש
            </button>
            {allMonths.length > 0 && (
              <div className="flex items-center gap-4 bg-slate-100 rounded-lg p-1 border border-slate-200">
                <button 
                  onClick={handlePrevMonth} 
                  disabled={currentMonthIndex === 0}
                  className="p-2 hover:bg-slate-200 text-slate-900 rounded-md disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="font-medium min-w-[80px] text-center text-sm text-slate-900" suppressHydrationWarning>{currentMonth || 'הכל'}</span>
                <button 
                  onClick={handleNextMonth} 
                  disabled={currentMonthIndex === allMonths.length - 1}
                  className="p-2 hover:bg-slate-200 text-slate-900 rounded-md disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="md:overflow-x-auto pb-2">
            <table className="w-full text-sm text-center">
              <thead className="bg-slate-50/80 text-slate-700 hidden md:table-header-group text-xs md:text-sm">
                <tr>
                  <th className="py-3 px-2 font-medium rounded-tr-md rounded-br-md text-right">שם משפיענ/ית</th>
                  <th className="py-3 px-2 font-medium text-center">עמלת קופונים</th>
                  <th className="py-3 px-2 font-medium text-center">שכר בסיס</th>
                  <th className="py-3 px-2 font-medium text-center">תוספת חודשית</th>
                  <th className="py-3 px-2 font-medium text-center">סה"כ לתשלום</th>
                  <th className="py-3 px-2 font-medium text-center">בוצע?</th>
                  <th className="py-3 px-2 font-medium text-right">הערות</th>
                  <th className="py-3 px-2 font-medium text-center">קישור למשפיען</th>
                  <th className="py-3 px-2 font-medium rounded-tl-md rounded-bl-md text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0 divide-y-0 md:divide-y divide-gray-100" suppressHydrationWarning>
                {isAddingPayment && <EditablePaymentRow payment={{ isNew: true, paymentMonth: currentMonth, onCancelNew: () => setIsAddingPayment(false) }} rawInfluencers={rawInfluencers} />}
                {combinedPayments && combinedPayments.length > 0 ? (
                  [...combinedPayments]
                    .sort((a, b) => (a.influencerName || '') > (b.influencerName || '') ? 1 : -1)
                    .map((payment) => (
                    <EditablePaymentRow key={payment.id} payment={payment} rawInfluencers={rawInfluencers} onTotalChange={handleRowTotalChange} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-700">
                      לא נמצאו תשלומים או משפיענים לחודש זה.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
