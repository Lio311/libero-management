"use client";

import { useState, useEffect, useRef, use } from 'react';
import { redirect } from 'next/navigation';
import { MonthNavigator } from '@/components/MonthNavigator';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Loader2, AlertCircle, RefreshCw, ShoppingBag, Tag, ChevronDown, ChevronUp, Package, Activity, ChevronRight, User } from 'lucide-react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { influencersConfig } from '@/config/influencers';

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
    sku: string;
}

interface InfluencerOrder {
    brand: string;
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
    coupon_used: string;
}

interface Summary {
    total_orders: number;
    total_revenue: number;
    total_discount: number;
    total_items: number;
    avg_order_value: number;
    commission: number;
    base_salary?: number;
    duduar_bottles?: number;
    duduar_revenue?: number;
    duduar_commission?: number;
    brand_summaries?: Record<string, {
        total_orders: number;
        total_revenue: number;
        total_discount: number;
        total_items: number;
        avg_order_value: number;
        commission: number;
    }>;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    'completed': { label: 'הושלמה', className: 'bg-emerald-100 text-emerald-700' },
    'processing': { label: 'בטיפול', className: 'bg-blue-100 text-blue-700' },
    'on-hold': { label: 'בהמתנה', className: 'bg-amber-100 text-amber-700' },
    'cancelled': { label: 'בוטלה', className: 'bg-red-100 text-red-700' },
    'refunded': { label: 'הוחזרה', className: 'bg-gray-100 text-gray-700' },
};

const BRAND_LABELS: Record<string, string> = {
    'velour': 'וולור',
    'labura': 'לה בורה',
    'libero': 'ליברו'
};

const formatILS = (amount: number, fractionDigits = 0) => {
    return `₪${Math.abs(amount).toLocaleString('he-IL', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
};

const formatILSNeg = (amount: number, fractionDigits = 0) => {
    return `₪-${Math.abs(amount).toLocaleString('he-IL', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
};

export default function InfluencerCouponPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: influencerId } = use(params);
    
    if (influencerId === 'oded') {
        redirect('/marketing/oded');
    }

    const influencerConfig = influencersConfig[influencerId];
    const noVatAddBack = ['maayan', 'tal', 'ayala', 'gold', 'noga', 'liya', 'shaked', 'hf', 'lian', 'reut'];
    const hasVat = !noVatAddBack.includes(influencerId);
    const influencerBrands = Array.from(new Set(influencerConfig?.coupons.map(c => c.brand) || []));
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [orders, setOrders] = useState<InfluencerOrder[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [influencerName, setInfluencerName] = useState<string>(influencerConfig?.name || '');
    const [influencerImage, setInfluencerImage] = useState<string | null>(influencerConfig?.image || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null); // changed to string to accommodate brand prefix

    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [token, setToken] = useState('');
    const [authError, setAuthError] = useState<string | false>(false);
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const x = useMotionValue(0);
    const background = useTransform(
        x,
        [0, containerWidth > 0 ? containerWidth - 56 : 0],
        ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.2)']
    );

    const month = format(currentDate, 'yyyy-MM');

    useEffect(() => {
        const auth = sessionStorage.getItem(`influencer_auth_${influencerId}`);
        if (auth === 'true') {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    }, [influencerId]);

    useEffect(() => {
        if (!isAuthenticated && containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }
    }, [isAuthenticated]);

    const handleLogin = async () => {
        if (isAuthLoading || token.length < 1) return;
        setAuthError(false);
        setIsAuthLoading(true);

        await new Promise(resolve => setTimeout(resolve, 500));

        if (token === 'tal') {
            sessionStorage.setItem(`influencer_auth_${influencerId}`, 'true');
            setIsAuthenticated(true);
        } else {
            setAuthError('סיסמה שגויה');
            setToken('');
            animate(x, 0, { type: 'spring', bounce: 0.2 });
        }
        setIsAuthLoading(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleLogin();
    };

    const disabled = isAuthLoading || token.length < 1;

    const handleDragEnd = () => {
        if (x.get() > containerWidth * 0.55 && !disabled) {
            handleLogin();
            animate(x, containerWidth - 56, { type: 'spring', bounce: 0, duration: 0.3 });
        } else {
            animate(x, 0, { type: 'spring', bounce: 0.2, duration: 0.4 });
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/influencer-coupon/${influencerId}?month=${month}`);
                const text = await response.text();

                try {
                    const result = JSON.parse(text);
                    if (result.error) throw new Error(result.error);
                    setOrders(result.data || []);
                    setSummary(result.summary || null);
                    setInfluencerName(result.influencerName || 'משפיענית');
                    setInfluencerImage(result.influencerImage || null);
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
    }, [month, isAuthenticated, influencerId]);

    const toggleOrder = (orderKey: string) => {
        setExpandedOrder(prev => prev === orderKey ? null : orderKey);
    };

    if (isAuthenticated === null) return null;

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 z-[100] min-h-screen w-full bg-black flex items-center justify-center overflow-hidden" dir="ltr">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-800 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-zinc-900 rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="z-10 w-full max-w-md p-8"
                >
                    <div className="backdrop-blur-2xl bg-zinc-950/40 border border-white/10 rounded-3xl p-10 shadow-2xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div 
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-inner overflow-hidden"
                            >
                                {influencerImage ? (
                                    <Image src={influencerImage} alt={influencerName} width={64} height={64} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="text-white w-8 h-8" />
                                )}
                            </motion.div>
                            
                            <h2 className="text-white text-2xl font-bold tracking-wider mb-2 uppercase">דוח {influencerName || 'משפיענית'}</h2>
                            
                            {influencerBrands.length > 0 && (
                                <div className="flex items-center justify-center gap-3 mt-4 mb-8">
                                    {influencerBrands.map(brand => (
                                        <div key={brand} className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                                            <Image src={`/brands/${brand}.png`} alt={brand} width={48} height={48} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-zinc-400 text-sm mb-8 tracking-widest text-center w-full block uppercase">{influencerId}</p>

                            <form onSubmit={handleSubmit} className="w-full">
                                <div className="relative mb-6" dir="rtl">
                                    <input
                                        type="password"
                                        value={token}
                                        onChange={(e) => {
                                            setToken(e.target.value);
                                            setAuthError(false);
                                            animate(x, 0, { type: 'spring', bounce: 0.2 });
                                        }}
                                        className={`w-full bg-zinc-900/50 border text-center text-xl tracking-wider font-mono ${authError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-white/30'} rounded-xl py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-4 ${authError ? 'focus:ring-red-500/10' : 'focus:ring-white/5'} transition-all duration-300 backdrop-blur-md`}
                                        placeholder="סיסמה"
                                        disabled={isAuthLoading}
                                        autoFocus
                                    />
                                    {authError && <p className="text-red-400 text-sm mt-2 text-center">{authError}</p>}
                                </div>

                                <div dir="ltr" ref={containerRef} className="relative w-full h-14 bg-zinc-900/50 rounded-full overflow-hidden flex items-center justify-center border border-white/10 mt-4 backdrop-blur-md">
                                    <motion.div style={{ background }} className="absolute inset-0 z-0" />
                                    <span className="text-zinc-500 font-medium z-0 select-none text-sm tracking-wider uppercase">
                                        {isAuthLoading ? 'Unlocking...' : 'Slide to unlock'}
                                    </span>
                                    
                                    {!isAuthLoading && (
                                        <motion.div
                                            drag={disabled ? false : "x"}
                                            dragConstraints={{ left: 0, right: containerWidth > 0 ? containerWidth - 56 : 0 }}
                                            dragElastic={0.05}
                                            onDragEnd={handleDragEnd}
                                            style={{ x }}
                                            className={`absolute left-1 w-12 h-12 bg-white rounded-full z-10 flex items-center justify-center shadow-lg ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                                        >
                                            <ChevronRight className="w-5 h-5 text-black" />
                                        </motion.div>
                                    )}
                                    {isAuthLoading && (
                                        <div className="absolute right-1 w-12 h-12 bg-white rounded-full z-10 flex items-center justify-center shadow-lg">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 px-6 md:px-12 pt-8 pb-20 max-w-7xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 border-2 border-blue-400 flex-shrink-0 bg-blue-50 flex items-center justify-center">
                            {influencerImage ? (
                                <Image src={influencerImage} alt={influencerName} width={56} height={56} className="w-full h-full object-cover" />
                            ) : (
                                <User className="text-blue-500" size={32} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">דוח {influencerName || 'משפיענית'}</h1>
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
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <div className="absolute inset-0 blur-xl opacity-20 bg-blue-500 animate-pulse" />
                    </div>
                    <p className="text-[#1d1d1f] font-bold mt-8 text-lg text-center">מושך נתונים...</p>
                    <p className="text-[#6d6d6d] text-sm mt-1 text-center">מסנכרן הזמנות מהאתרים השונים</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    {summary && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                                <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                    <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">הזמנות</p>
                                    <p className="text-2xl font-black text-[#1d1d1f]">{summary.total_orders}</p>
                                </div>
                                <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                    <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">מוצרים</p>
                                    <p className="text-2xl font-black text-[#1d1d1f]">{summary.total_items}</p>
                                </div>
                                <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                    <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">סה"כ מכירות (ללא מע"מ)</p>
                                    <p className="text-2xl font-black text-[#1d1d1f]" dir="ltr">{formatILS(summary.total_revenue)}</p>
                                </div>
                                <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                    <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">ממוצע להזמנה (ללא מע"מ)</p>
                                    <p className="text-2xl font-black text-[#1d1d1f]" dir="ltr">{formatILS(summary.avg_order_value)}</p>
                                </div>
                                {summary.base_salary ? (
                                    <>
                                        <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                            <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">סה"כ עמלה {hasVat ? '(כולל מע"מ)' : ''}</p>
                                            <p className="text-2xl font-black text-[#1d1d1f]" dir="ltr">{formatILS(summary.commission)}</p>
                                        </div>
                                        <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                            <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">שכר בסיס</p>
                                            <p className="text-2xl font-black text-[#1d1d1f]" dir="ltr">{formatILS(summary.base_salary)}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-4 md:p-5 rounded-2xl shadow-lg shadow-blue-500/20">
                                            <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">סה"כ לתשלום</p>
                                            <p className="text-2xl font-black text-white" dir="ltr">{formatILS(summary.commission + summary.base_salary)}</p>
                                            {hasVat && (
                                                <p className="text-sm font-medium text-white/70 mt-1" dir="ltr">{formatILS((summary.commission + summary.base_salary) / 1.18)} לא כולל מע"מ</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-4 md:p-5 rounded-2xl shadow-lg shadow-blue-500/20">
                                        <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">סה"כ עמלה {hasVat ? '(כולל מע"מ)' : ''}</p>
                                        <p className="text-2xl font-black text-white" dir="ltr">{formatILS(summary.commission)}</p>
                                        {hasVat && (
                                            <p className="text-sm font-medium text-white/70 mt-1" dir="ltr">{formatILS(summary.commission / 1.18)} לא כולל מע"מ</p>
                                        )}
                                    </div>
                                )}
                                
                                {summary.duduar_bottles !== undefined && (
                                    <>
                                        <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                            <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">בקבוקי דודואר</p>
                                            <p className="text-2xl font-black text-[#1d1d1f]">{summary.duduar_bottles}</p>
                                        </div>
                                        <div className="bg-white p-4 md:p-5 rounded-2xl border border-black/[0.06] shadow-sm">
                                            <p className="text-xs font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">מכירות דודואר (ללא מע"מ)</p>
                                            <p className="text-2xl font-black text-[#1d1d1f]" dir="ltr">{formatILS(summary.duduar_revenue || 0)}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 md:p-5 rounded-2xl shadow-lg shadow-purple-500/20">
                                            <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">עמלת דודואר</p>
                                            <p className="text-2xl font-black text-white" dir="ltr">{formatILS(summary.duduar_commission || 0)}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Brand Summaries */}
                            {summary.brand_summaries && Object.keys(summary.brand_summaries).length > 1 && (
                                <div className="mt-8 space-y-4 pt-4 border-t border-black/[0.05]">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">פירוט לפי מותג</h3>
                                    {Object.entries(summary.brand_summaries).map(([brand, bs]) => (
                                        <div key={brand} className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center gap-6">
                                            <div className="flex items-center gap-3 md:w-48 flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                                                    <Image src={`/brands/${brand}.png`} alt={brand} width={40} height={40} className="w-full h-full object-cover" />
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-lg">{BRAND_LABELS[brand] || brand}</h4>
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                                <div className="bg-white p-3 rounded-xl border border-slate-100/50 shadow-sm">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">הזמנות</p>
                                                    <p className="text-lg font-black text-slate-800">{bs.total_orders}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100/50 shadow-sm">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">מוצרים</p>
                                                    <p className="text-lg font-black text-slate-800">{bs.total_items}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100/50 shadow-sm">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">מכירות (ללא מע"מ)</p>
                                                    <p className="text-lg font-black text-slate-800" dir="ltr">{formatILS(bs.total_revenue)}</p>
                                                </div>
                                                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 shadow-sm flex flex-col justify-center">
                                                    <p className="text-[10px] font-bold text-blue-500/80 uppercase tracking-wider mb-0.5">עמלה {hasVat ? '(כולל מע"מ)' : ''}</p>
                                                    <p className="text-lg font-black text-blue-600 leading-tight" dir="ltr">{formatILS(bs.commission)}</p>
                                                    {hasVat && (
                                                        <p className="text-[9px] font-medium text-blue-500/70 mt-0.5 leading-tight" dir="ltr">{formatILS(bs.commission / 1.18)} לא כולל מע"מ</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Orders List */}
                    {orders.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-black/[0.07] p-24 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                                <Tag className="text-slate-300" size={36} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">לא נמצאו הזמנות</h3>
                            <p className="text-slate-500 max-w-xs mt-2 font-medium">לא נמצאו הזמנות עם הקופונים המשויכים בחודש הנבחר.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-black/[0.07] shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        פירוט הזמנות — {format(currentDate, 'MMMM yyyy', { locale: he })}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-0.5">{orders.length} הזמנות</p>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {orders.map((order) => {
                                    const orderKey = `${order.brand}-${order.order_id}`;
                                    const isExpanded = expandedOrder === orderKey;
                                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, className: 'bg-gray-100 text-gray-700' };
                                    const orderDate = new Date(order.date);
                                    const brandName = BRAND_LABELS[order.brand] || order.brand;

                                    return (
                                        <div key={orderKey}>
                                            {/* Order Row */}
                                            <button
                                                onClick={() => toggleOrder(orderKey)}
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
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-purple-100 text-purple-700">
                                                                {brandName}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                                                                {order.coupon_used}
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

                                                        {/* Items List (Mobile) & Table (Desktop) */}
                                                        <div className="hidden md:block overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="border-b border-slate-100 text-slate-500">
                                                                        <th className="text-right px-5 py-2.5 font-semibold">מוצר</th>
                                                                        <th className="text-center px-3 py-2.5 font-semibold">כמות</th>
                                                                        <th className="text-center px-3 py-2.5 font-semibold">מחיר</th>
                                                                        <th className="text-center px-5 py-2.5 font-semibold">סה"כ</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50">
                                                                    {order.items.map((item, idx) => (
                                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                                            <td className="px-5 py-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Package size={14} className="text-slate-400 flex-shrink-0" />
                                                                                    <span className="font-medium text-slate-800 line-clamp-2 leading-snug">{item.name}</span>
                                                                                </div>
                                                                                {item.sku && <span className="text-xs text-slate-400 mr-6 mt-0.5 block">SKU: {item.sku}</span>}
                                                                            </td>
                                                                            <td className="text-center px-3 py-3 text-slate-600">{item.quantity}</td>
                                                                            <td className="text-center px-3 py-3 text-slate-600" dir="ltr">{formatILS(item.price)}</td>
                                                                            <td className="text-center px-5 py-3 font-semibold text-slate-800" dir="ltr">{formatILS(item.total)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Mobile Items List */}
                                                        <div className="md:hidden divide-y divide-slate-50 border-b border-slate-100">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="px-4 py-3 hover:bg-slate-50/50 flex gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="font-medium text-slate-800 text-[11px] leading-snug line-clamp-2">{item.name}</span>
                                                                        {item.sku && <span className="text-[10px] text-slate-400 mt-0.5 block">SKU: {item.sku}</span>}
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1 flex-shrink-0 pt-0.5">
                                                                        <span className="font-semibold text-slate-800 text-xs" dir="ltr">{formatILS(item.total)}</span>
                                                                        <span className="text-[10px] text-slate-500">
                                                                            {item.quantity} × <span dir="ltr">{formatILS(item.price)}</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
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
                                                            <div className="font-bold text-base md:text-lg text-blue-600 w-full sm:w-auto flex justify-between sm:justify-start border-t border-slate-200 sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0" dir="rtl">
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
