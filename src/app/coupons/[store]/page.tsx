"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Table } from '@/components/Table';
import { MonthNavigator } from '@/components/MonthNavigator';
import { format } from 'date-fns';
import { Loader2, AlertCircle, RefreshCw, Ticket } from 'lucide-react';
import { he } from 'date-fns/locale';

const STORE_CONFIG = {
    'libero': {
        title: 'סיכום קופונים ליברו',
        apiEndpoint: '/api/libero-coupons',
    },
    'velour': {
        title: 'סיכום קופונים וולור',
        apiEndpoint: '/api/velour-coupons',
    },
    'labura': {
        title: 'סיכום קופונים לה בורה',
        apiEndpoint: '/api/labura-coupons',
    }
} as const;

export default function CouponSummaryPage() {
    const params = useParams();
    const storeKey = params.store as keyof typeof STORE_CONFIG;
    const config = STORE_CONFIG[storeKey];

    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const month = format(currentDate, 'yyyy-MM');

    useEffect(() => {
        if (!config) return;
        
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${config.apiEndpoint}?month=${month}`);
                const text = await response.text();
                
                try {
                    const result = JSON.parse(text);
                    if (result.error) throw new Error(result.error);
                    setData(result.data || []);
                } catch (jsonErr) {
                    console.error('Invalid JSON response:', text);
                    if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
                        throw new Error('שגיאת שרת: התקבלה תשובת HTML במקום JSON. כנראה שהפונקציה לא הוגדרה נכון.');
                    }
                    throw new Error(`שגיאת פענוח: ${text.substring(0, 50)}...`);
                }
            } catch (err: any) {
                console.error('Fetch error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [month, config?.apiEndpoint]);

    if (!config) {
        return <div className="p-8 text-center text-red-500 font-bold">חנות לא נמצאה</div>;
    }

    const columns: any[] = [
        { 
            header: 'קוד קופון', 
            accessor: (row: any) => (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Ticket size={16} />
                    </div>
                    <span className="font-bold text-[#1d1d1f] tracking-wide uppercase">{row.code}</span>
                </div>
            ),
            align: 'center' as const,
            className: 'min-w-[120px] md:min-w-[150px]'
        },
        { 
            header: 'כמות מימושים', 
            accessor: (row: any) => (
                <div className="flex items-center justify-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                        {row.count}
                    </span>
                </div>
            ),
            align: 'center' as const 
        },
        { 
            header: 'סה"כ מכירות נטו', 
            accessor: (row: any) => (
                <span className="font-semibold text-[#1d1d1f]">
                    ₪{Number(row.total_sales).toLocaleString('he-IL')}
                </span>
            ),
            align: 'center' as const
        },
        { 
            header: 'עמלה נטו (מכירות / 1.18 * 10%)', 
            accessor: (row: any) => {
                const commission = (row.total_sales / 1.18) * 0.1;
                return (
                    <div className="flex flex-col items-center justify-center">
                        <span className="font-bold text-[#0071e3] text-base">
                            ₪{commission.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                );
            },
            align: 'center' as const,
            className: 'bg-[#0071e3]/[0.02] border-r border-[#0071e3]/10'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{config.title}</h1>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-sm font-medium text-[#6d6d6d]">נתוני אמת מ-WooCommerce</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            setLoading(true);
                            setError(null);
                            // We can just trigger a re-render by doing nothing, but better to re-fetch manually.
                            // But since fetch is inside useEffect, we can't easily trigger it.
                            // A simple hack is to change a state variable like `refreshKey` or reload window.
                            window.location.reload();
                        }}
                        disabled={loading}
                        className="p-2.5 text-[#6d6d6d] hover:bg-black/[0.04] active:bg-black/[0.08] rounded-xl transition-all border border-black/[0.06] bg-white shadow-sm disabled:opacity-50"
                        title="רענן נתונים"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <MonthNavigator currentDate={currentDate} onDateChange={setCurrentDate} />
                </div>
            </div>

            {error ? (
                <div className="bg-white rounded-3xl border border-red-100 p-12 flex flex-col items-center justify-center text-center shadow-xl shadow-red-500/5">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
                        <AlertCircle className="text-red-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-red-900">אופס! משהו השתבש</h3>
                    <p className="text-red-600/70 max-w-md mt-2 font-medium">{error}</p>
                    <div className="flex gap-3 mt-8">
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                        >
                            נסה שוב
                        </button>
                    </div>
                </div>
            ) : loading ? (
                <div className="bg-white rounded-3xl border border-black/[0.07] p-32 flex flex-col items-center justify-center shadow-sm">
                    <div className="relative">
                        <Loader2 className="animate-spin text-[#0071e3]" size={48} />
                        <div className="absolute inset-0 blur-xl opacity-20 bg-[#0071e3] animate-pulse" />
                    </div>
                    <p className="text-[#1d1d1f] font-bold mt-8 text-lg">מושך נתונים...</p>
                    <p className="text-[#6d6d6d] text-sm mt-1">אנא המתינו בזמן שאנו מתחברים ל-WooCommerce</p>
                </div>
            ) : data.length === 0 ? (
                <div className="bg-white rounded-3xl border border-black/[0.07] p-24 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                        <Ticket className="text-slate-300" size={36} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">לא נמצאו קופונים</h3>
                    <p className="text-slate-500 max-w-xs mt-2 font-medium">לא נמצאו הזמנות עם קופונים בחודש הנבחר.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-sm">
                            <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">סה"כ עמלה נטו</p>
                            <p className="text-2xl font-black text-[#0071e3]">
                                ₪{data.reduce((acc, curr) => acc + (curr.total_sales / 1.18 * 0.1), 0).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-sm">
                            <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">סה"כ מכירות נטו</p>
                            <p className="text-2xl font-black text-[#1d1d1f]">
                                ₪{data.reduce((acc, curr) => acc + curr.total_sales, 0).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-sm">
                            <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">כמות שימושים כוללת</p>
                            <p className="text-2xl font-black text-[#1d1d1f]">
                                {data.reduce((acc, curr) => acc + curr.count, 0).toLocaleString('he-IL')}
                            </p>
                        </div>
                    </div>
                    <Table
                        data={data.map((item, idx) => ({ ...item, id: idx }))}
                        columns={columns}
                        title={`פירוט שימוש בקופונים - ${format(currentDate, 'MMMM yyyy', { locale: he })}`}

                    />
                </div>
            )}
        </div>
    );
}
