"use client";

import { useState, useEffect } from 'react';
import { MonthNavigator } from '@/components/MonthNavigator';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Loader2, AlertCircle, RefreshCw, ShoppingBag, Tag, ChevronDown, ChevronUp, Package } from 'lucide-react';
import Image from 'next/image';

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
    sku: string;
}

interface OdedOrder {
    order_id: number;
    order_number: string;
    date: string;
    status: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    items: OrderItem[];
    items_count: number;
    subtotal: number;
    discount_amount: number;
    total: number;
    payment_method: string;
    shipping_city: string;
}

interface Summary {
    total_orders: number;
    total_revenue: number;
    house_brand_revenue: number;
    other_brand_revenue: number;
    total_discount: number;
    total_items: number;
    avg_order_value: number;
    commission: number;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    'completed': { label: 'הושלמה', className: 'bg-emerald-100 text-emerald-700' },
    'processing': { label: 'בטיפול', className: 'bg-blue-100 text-blue-700' },
    'on-hold': { label: 'בהמתנה', className: 'bg-amber-100 text-amber-700' },
    'cancelled': { label: 'בוטלה', className: 'bg-red-100 text-red-700' },
    'refunded': { label: 'הוחזרה', className: 'bg-gray-100 text-gray-700' },
};

// Helper: format currency with ₪ sign properly in LTR context
const formatILS = (amount: number, fractionDigits = 0) => {
    return `₪${Math.abs(amount).toLocaleString('he-IL', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
};

const formatILSNeg = (amount: number, fractionDigits = 0) => {
    return `₪-${Math.abs(amount).toLocaleString('he-IL', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
};

export default function OdedCouponPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [orders, setOrders] = useState<OdedOrder[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

    const month = format(currentDate, 'yyyy-MM');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/oded-coupon?month=${month}`);
                const text = await response.text();

                try {
                    const result = JSON.parse(text);
                    if (result.error) throw new Error(result.error);
                    setOrders(result.data || []);
                    setSummary(result.summary || null);
                } catch (jsonErr) {
                    if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
                        throw new Error('שגיאת שרת: התקבלה תשובת HTML במקום JSON.');
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
    }, [month]);

    const toggleOrder = (orderId: number) => {
        setExpandedOrder(prev => prev === orderId ? null : orderId);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 px-6 md:px-12 pt-8 pb-20 max-w-7xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-purple-500/20 border-2 border-purple-400 flex-shrink-0">
                            <Image src="/oded.png" alt="עודד" width={56} height={56} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">דוח עודד — קופון OSVR10</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-sm font-medium text-[#6d6d6d]">פירוט רכישות מלא מ-WooCommerce</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
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
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                    >
                        נסה שוב
                    </button>
                </div>
            ) : loading ? (
                <div className="bg-white rounded-3xl border border-black/[0.07] p-32 flex flex-col items-center justify-center shadow-sm">
                    <div className="relative">
                        <Loader2 className="animate-spin text-purple-500" size={48} />
                        <div className="absolute inset-0 blur-xl opacity-20 bg-purple-500 animate-pulse" />
                    </div>
                    <p className="text-[#1d1d1f] font-bold mt-8 text-lg text-center">מושך נתונים...</p>
                    <p className="text-[#6d6d6d] text-sm mt-1 text-center">מחפש הזמנות עם קופון OSVR10</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">הזמנות</p>
                                <p className="text-2xl font-black text-[#1d1d1f]">{summary.total_orders}</p>
                            </div>
                            <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">מוצרים</p>
                                <p className="text-2xl font-black text-[#1d1d1f]">{summary.total_items}</p>
                            </div>
                            <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">מכירות מותגי הבית</p>
                                <p className="text-2xl font-black text-[#1d1d1f]" dir="ltr">{formatILS(summary.house_brand_revenue)}</p>
                            </div>
                            <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">מכירות שאר המוצרים</p>
                                <p className="text-2xl font-black text-[#1d1d1f]" dir="ltr">{formatILS(summary.other_brand_revenue)}</p>
                            </div>
                            <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">סה"כ מכירות</p>
                                <p className="text-2xl font-black text-[#1d1d1f]" dir="ltr">{formatILS(summary.total_revenue)}</p>
                            </div>
                            <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">סה"כ הנחות</p>
                                <p className="text-2xl font-black text-red-500" dir="ltr">{formatILSNeg(summary.total_discount)}</p>
                            </div>
                            <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">ממוצע להזמנה</p>
                                <p className="text-2xl font-black text-[#1d1d1f]" dir="ltr">{formatILS(summary.avg_order_value)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 md:p-5 rounded-2xl shadow-lg shadow-purple-500/20">
                                <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">עמלה נטו</p>
                                <p className="text-2xl font-black text-white" dir="ltr">{formatILS(summary.commission)}</p>
                            </div>
                        </div>
                    )}

                    {/* Orders List */}
                    {orders.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-black/[0.07] p-24 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                                <Tag className="text-slate-300" size={36} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">לא נמצאו הזמנות</h3>
                            <p className="text-slate-500 max-w-xs mt-2 font-medium">לא נמצאו הזמנות עם קופון OSVR10 בחודש הנבחר.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-black/[0.07] shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900">
                                    פירוט הזמנות — {format(currentDate, 'MMMM yyyy', { locale: he })}
                                </h2>
                                <p className="text-sm text-slate-500 mt-0.5">{orders.length} הזמנות עם קופון OSVR10</p>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {orders.map((order) => {
                                    const isExpanded = expandedOrder === order.order_id;
                                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, className: 'bg-gray-100 text-gray-700' };
                                    const orderDate = new Date(order.date);

                                    return (
                                        <div key={order.order_id}>
                                            {/* Order Row */}
                                            <button
                                                onClick={() => toggleOrder(order.order_id)}
                                                className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-right gap-2"
                                            >
                                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                                    <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-100 items-center justify-center flex-shrink-0">
                                                        <ShoppingBag size={18} className="text-slate-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-slate-900 text-sm md:text-base">#{order.order_number}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold ${statusInfo.className}`}>
                                                                {statusInfo.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] md:text-sm text-slate-500 mt-1">
                                                            <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-none">{order.customer_name || 'אורח'}</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="whitespace-nowrap">{format(orderDate, 'dd/MM/yy HH:mm')}</span>
                                                            {order.shipping_city && (
                                                                <>
                                                                    <span className="text-slate-300">•</span>
                                                                    <span className="truncate max-w-[60px] sm:max-w-[100px] md:max-w-none">{order.shipping_city}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                                                    <div className="text-left">
                                                        <div className="font-bold text-slate-900 text-sm md:text-base" dir="ltr">
                                                            {formatILS(order.subtotal)}
                                                        </div>
                                                        <div className="text-[10px] md:text-xs text-red-500 font-medium" dir="ltr">
                                                            {formatILSNeg(order.discount_amount)} הנחה
                                                        </div>
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronUp size={18} className="text-slate-400" />
                                                    ) : (
                                                        <ChevronDown size={18} className="text-slate-400" />
                                                    )}
                                                </div>
                                            </button>

                                            {/* Expanded Details */}
                                            {isExpanded && (
                                                <div className="px-3 md:px-6 pb-5 bg-slate-50/50">
                                                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                                                        {/* Customer Info */}
                                                        <div className="px-4 md:px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-x-4 md:gap-x-6 gap-y-1.5 text-xs md:text-sm">
                                                            {order.customer_email && (
                                                                <span className="text-slate-600 break-all">
                                                                    <span className="font-semibold text-slate-800">אימייל:</span> {order.customer_email}
                                                                </span>
                                                            )}
                                                            {order.customer_phone && (
                                                                <span className="text-slate-600">
                                                                    <span className="font-semibold text-slate-800">טלפון:</span> {order.customer_phone}
                                                                </span>
                                                            )}
                                                            {order.payment_method && (
                                                                <span className="text-slate-600">
                                                                    <span className="font-semibold text-slate-800">תשלום:</span> {order.payment_method}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Items Table */}
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs md:text-sm min-w-[400px]">
                                                                <thead>
                                                                    <tr className="border-b border-slate-100 text-slate-500">
                                                                        <th className="text-right px-4 md:px-5 py-2.5 font-semibold">מוצר</th>
                                                                        <th className="text-center px-2 md:px-3 py-2.5 font-semibold">כמות</th>
                                                                        <th className="text-center px-2 md:px-3 py-2.5 font-semibold">מחיר</th>
                                                                        <th className="text-center px-4 md:px-5 py-2.5 font-semibold">סה"כ</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50">
                                                                    {order.items.map((item, idx) => (
                                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                                            <td className="px-4 md:px-5 py-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Package size={14} className="text-slate-400 flex-shrink-0 hidden md:block" />
                                                                                    <span className="font-medium text-slate-800 line-clamp-2 leading-snug">{item.name}</span>
                                                                                </div>
                                                                                {item.sku && <span className="text-[10px] md:text-xs text-slate-400 mr-0 md:mr-6 mt-0.5 block">SKU: {item.sku}</span>}
                                                                            </td>
                                                                            <td className="text-center px-2 md:px-3 py-3 text-slate-600">{item.quantity}</td>
                                                                            <td className="text-center px-2 md:px-3 py-3 text-slate-600" dir="ltr">{formatILS(item.price)}</td>
                                                                            <td className="text-center px-4 md:px-5 py-3 font-semibold text-slate-800" dir="ltr">{formatILS(item.total)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Order Totals */}
                                                        <div className="px-4 md:px-5 py-3 md:py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-6 text-xs md:text-sm w-full sm:w-auto">
                                                                <span className="text-slate-600 flex justify-between sm:justify-start">
                                                                    <span>סה"כ מוצרים:</span>
                                                                    <span className="font-bold text-slate-800 sm:mr-2" dir="ltr">{formatILS(order.subtotal, 2)}</span>
                                                                </span>
                                                                <span className="text-red-500 flex justify-between sm:justify-start">
                                                                    <span>הנחת קופון:</span>
                                                                    <span className="font-bold sm:mr-2" dir="ltr">{formatILSNeg(order.discount_amount, 2)}</span>
                                                                </span>
                                                            </div>
                                                            <div className="font-bold text-base md:text-lg text-purple-600 w-full sm:w-auto flex justify-between sm:justify-start border-t border-slate-200 sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0" dir="rtl">
                                                                <span>סה"כ:</span>
                                                                <span className="mr-2" dir="ltr">{formatILS(order.total, 2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
