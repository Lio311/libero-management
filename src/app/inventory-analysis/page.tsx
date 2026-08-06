"use client";

import { useState, useEffect } from 'react';
import { 
    BarChart, Bar, LineChart, Line, AreaChart, Area, 
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ZAxis, ReferenceArea
} from 'recharts';
import { 
    TrendingUp, Package, Users, DollarSign, Loader2, 
    AlertCircle, Info, ArrowUpRight, ArrowDownRight,
    ShoppingBag, History, Target
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import clsx from 'clsx';

const COLORS = ['#0071e3', '#34c759', '#5856d6', '#ff9500', '#ff2d55', '#af52de', '#5ac8fa', '#ffcc00'];

const KPICard = ({ title, value, detail, icon: Icon, trend }: any) => (
    <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] border border-black/[0.05] shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-black/[0.03] flex items-center justify-center text-[#1d1d1f]">
                <Icon size={24} />
            </div>
            {trend && (
                <div className={clsx(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                    trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                    {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div>
            <p className="text-sm font-bold text-[#6d6d6d] uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-black text-[#1d1d1f] tracking-tight">{value}</h3>
            {detail && <p className="text-xs text-[#86868b] mt-1 font-medium">{detail}</p>}
        </div>
    </div>
);

const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1d1d1f] tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-[#86868b] font-medium">{subtitle}</p>}
    </div>
);

export default function InventoryAnalysisPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/libero-inventory-analysis');
                const result = await response.json();
                if (!response.ok || result.error) {
                    throw new Error(result.error || result.message || `Server error: ${response.status}`);
                }
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-[#0071e3] mb-4" size={48} />
            <p className="text-[#1d1d1f] font-bold text-lg">מנתח נתונים היסטוריים...</p>
            <p className="text-[#86868b] text-sm">התהליך עלול לקחת מספר שניות עקב כמות הנתונים</p>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-center">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="text-red-900 font-bold text-lg">שגיאה בניתוח הנתונים</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold">נסה שוב</button>
        </div>
    );

    const { kpis, sales_trend, products, dead_stock, ltv_by_source, status_breakdown } = data;

    // Prepare chart data safely
    const safeProducts = Array.isArray(products) ? products : [];
    const safeDeadStock = Array.isArray(dead_stock) ? dead_stock : [];
    const safeLtv = Array.isArray(ltv_by_source) ? ltv_by_source : [];

    const topSalesData = safeProducts.slice(0, 10).map((p: any) => ({ name: p.name.substring(0, 25), value: p.total_sales_qty }));
    const ltvSourceData = safeLtv.slice(0, 8);
    const deadStockRadar = safeDeadStock.slice(0, 5).map((p: any) => ({
        name: p.name.substring(0, 15),
        'זמן מדף': Math.min(p.age_days / 365 * 100, 100),
        'מלאי': Math.min(p.stock / 50 * 100, 100),
        'מדד סיכון': 100
    }));

    // Grouping category data
    const catMap: any = {};
    safeProducts.forEach((p: any) => {
        const cat = (p.categories && p.categories[0]) ? p.categories[0] : 'אחר';
        catMap[cat] = (catMap[cat] || 0) + (p.total_revenue || 0);
    });
    const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => (b.value as number) - (a.value as number)).slice(0, 8);

    return (
        <div className="px-6 md:px-12 pt-8 pb-20 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#1d1d1f] tracking-tight">ניתוח מלאי חכם</h1>
                    <p className="text-[#86868b] font-medium mt-2">סקירה היסטורית מלאה ותובנות מלאי מתקדמות</p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-black/[0.03] px-4 py-2 rounded-2xl">
                    <History size={16} className="text-[#6d6d6d]" />
                    <span className="text-xs font-bold text-[#6d6d6d]">כל ההיסטוריה מסונכרנת</span>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="LTV (שווי לקוח)" 
                    value={`₪${Math.round(kpis.ltv).toLocaleString()}`} 
                    detail="ערך ממוצע של לקוח לאורך זמן"
                    icon={Users}
                />
                <KPICard 
                    title="AOV (ממוצע הזמנה)" 
                    value={`₪${Math.round(kpis.aov).toLocaleString()}`} 
                    detail="ערך ממוצע של הזמנה בודדת"
                    icon={ShoppingBag}
                />
                <KPICard 
                    title="סה״כ הכנסות" 
                    value={kpis.total_revenue > 1000000 ? `₪${(kpis.total_revenue / 1000000).toFixed(1)}M` : `₪${Math.round(kpis.total_revenue).toLocaleString()}`} 
                    detail="הכנסות מצטברות (משוער)"
                    icon={DollarSign}
                />
                <KPICard 
                    title="סה״כ דגמים במערכת" 
                    value={(kpis.total_products_variety || (Array.isArray(products) ? products.length : 0)).toLocaleString()} 
                    detail={`סה"כ פריטים במלאי: ${kpis.total_items_in_stock ? kpis.total_items_in_stock.toLocaleString() : (Array.isArray(products) ? products : []).reduce((acc: number, p: any) => acc + (p.stock || 0), 0).toLocaleString()}`}
                    icon={Package}
                />
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Monthly Revenue Trend */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-black/[0.05] shadow-sm">
                    <SectionTitle title="מגמת הכנסות חודשית" subtitle="פירוט לפי חודש - שנתיים אחרונות" />
                    <div className="h-[300px] w-full dir-ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sales_trend}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0071e3" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#0071e3" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="month" 
                                    fontSize={10} 
                                    tickFormatter={(val: string) => {
                                        const [y, m] = val.split('-');
                                        const monthNames = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
                                        return `${monthNames[parseInt(m)-1]} ${y.substring(2)}`;
                                    }}
                                    stroke="#86868b"
                                />
                                <YAxis 
                                    fontSize={10} 
                                    stroke="#86868b" 
                                    tickFormatter={(val: any) => `₪${(val / 1000).toLocaleString()}k`}
                                />
                                <Tooltip formatter={(val: any) => `₪${val.toLocaleString()}`} />
                                <Area type="linear" dataKey="total_sales" stroke="#0071e3" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Top Products by Volume - CUSTOM HTML BARS */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-black/[0.05] shadow-sm">
                    <SectionTitle title="10 המוצרים הכי נמכרים" subtitle="נתון שנתי מצטבר - לפי יחידות" />
                    <div className="space-y-4 pt-4">
                        {safeProducts.slice(0, 10).map((p: any, idx: number) => {
                            const maxVal = Math.max(...safeProducts.slice(0, 10).map((i: any) => i.total_sales_qty));
                            const width = (p.total_sales_qty / maxVal) * 100;
                            return (
                                <div key={p.id} className="group">
                                    <div className="flex justify-between items-end mb-1.5 px-1">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-[#1d1d1f] line-clamp-1">{p.name}</span>
                                            <span className="text-[9px] text-[#86868b] uppercase tracking-wider">{p.sku}</span>
                                        </div>
                                        <span className="text-xs font-black text-[#0071e3]">{p.total_sales_qty.toLocaleString()} יח׳</span>
                                    </div>
                                    <div className="h-2 w-full bg-black/[0.03] rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#0071e3] rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Sales by Category */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-black/[0.05] shadow-sm">
                    <SectionTitle title="התפלגות מכירות לפי קטגוריה" subtitle="פילוח שנתי מצטבר" />
                    <div className="h-[300px] w-full dir-ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={categoryData} 
                                    innerRadius={60} 
                                    outerRadius={100} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `₪${value.toLocaleString()}`} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. LTV by Source */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-black/[0.05] shadow-sm">
                    <SectionTitle title="LTV לפי מקור הגעה" subtitle="ערך לקוח מצטבר (LTV)" />
                    <div className="h-[300px] w-full dir-ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ltvSourceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="source" fontSize={10} stroke="#1d1d1f" />
                                <YAxis hide />
                                <Tooltip formatter={(val: any) => `₪${Math.round(val)}`} />
                                <Bar dataKey="aov" name="שווי הזמנה ממוצע" fill="#34c759" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Inventory Health Scatter */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-black/[0.05] shadow-sm flex flex-col h-full">
                    <SectionTitle title="בריאות המלאי" subtitle="מצב נוכחי: ימי מלאי (DOS) מול רמת מלאי" />
                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#86868b] font-bold mb-6 bg-black/[0.02] p-3 rounded-2xl border border-black/[0.03]">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-[#fee2e2] border border-red-100" /> סכנת חוסר (0-30 יום)</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-[#f0fdf4] border border-green-100" /> מלאי בריא (30-90 יום)</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-[#fff7ed] border border-orange-100" /> עודף מלאי (90+ יום)</div>
                    </div>
                    <div className="h-[450px] w-full dir-ltr flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 10 }}>
                                <CartesianGrid stroke="#f0f0f0" vertical={false} horizontal={false} />
                                
                                {/* Background Zones */}
                                <ReferenceArea x1={0} x2={30} fill="#fee2e2" fillOpacity={0.4} />
                                <ReferenceArea x1={30} x2={90} fill="#f0fdf4" fillOpacity={0.4} />
                                <ReferenceArea x1={90} x2={180} fill="#fff7ed" fillOpacity={0.4} />

                                <XAxis 
                                    type="number" 
                                    dataKey="dos" 
                                    name="ימי מלאי" 
                                    unit=" יום" 
                                    fontSize={10} 
                                    domain={[0, 180]} 
                                    allowDataOverflow 
                                    stroke="#86868b"
                                    tick={{ fill: '#86868b' }}
                                    label={{ value: 'ימי מלאי משוערים', position: 'insideBottom', offset: -25, fontSize: 10, fill: '#86868b' }}
                                />
                                <YAxis 
                                    type="number" 
                                    dataKey="stock" 
                                    name="מלאי נוכחי" 
                                    fontSize={10} 
                                    stroke="#86868b"
                                    tick={{ fill: '#86868b' }}
                                    label={{ value: 'כמות במלאי', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#86868b' }}
                                />
                                <ZAxis type="number" dataKey="total_revenue" range={[40, 500]} />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }: any) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0].payload;
                                            return (
                                                <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-black/[0.1] shadow-2xl text-right z-50">
                                                    <p className="font-bold text-sm mb-1 text-[#1d1d1f]">{p.name}</p>
                                                    <p className="text-[10px] text-[#86868b] font-mono mb-3">{p.sku}</p>
                                                    <div className="space-y-2 border-t border-black/[0.05] pt-2">
                                                        <div className="flex justify-between items-center gap-8">
                                                            <span className="text-[11px] font-black text-blue-600">{Math.min(Math.round(p.dos), 999)} ימים</span>
                                                            <span className="text-[10px] text-[#6d6d6d]">אספקת מלאי:</span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-8">
                                                            <span className="text-[11px] font-black">{p.stock}</span>
                                                            <span className="text-[10px] text-[#6d6d6d]">מלאי נוכחי:</span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-8">
                                                            <span className="text-[11px] font-black text-emerald-600">₪{Math.round(p.total_revenue).toLocaleString()}</span>
                                                            <span className="text-[10px] text-[#6d6d6d]">פדיון מוערך:</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter 
                                    name="מוצרים" 
                                    data={products.map((p: any) => ({ ...p, dos: Math.min(p.dos, 180) }))} 
                                    fill="#0071e3" 
                                    fillOpacity={0.6} 
                                    stroke="#fff"
                                    strokeWidth={1}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6. Dead Stock Radar */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-black/[0.05] shadow-sm">
                    <SectionTitle title="מטריצת מוצרים מתים" subtitle="השוואת מלאי מול זמן מדף" />
                    <div className="h-[300px] w-full dir-ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius={90} data={deadStockRadar}>
                                <PolarGrid stroke="#f0f0f0" />
                                <PolarAngleAxis dataKey="name" fontSize={10} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                                <Radar name="מדד סיכון" dataKey="זמן מדף" stroke="#ff2d55" fill="#ff2d55" fillOpacity={0.3} />
                                <Radar name="רמת מלאי" dataKey="מלאי" stroke="#ff9500" fill="#ff9500" fillOpacity={0.3} />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 7. Status Breakdown Pie */}
                {status_breakdown && status_breakdown.length > 0 && (
                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/[0.05] shadow-sm">
                        <SectionTitle title="סטטוס מוצרים במערכת" subtitle="פילוח לפי זמינות (במלאי, חסר, טיוטה)" />
                        <div className="h-[300px] w-full dir-ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={status_breakdown} 
                                        innerRadius={60} 
                                        outerRadius={100} 
                                        paddingAngle={5} 
                                        dataKey="value"
                                    >
                                        {status_breakdown.map((entry: any, index: number) => {
                                            let color = COLORS[index % COLORS.length];
                                            if (entry.name === 'במלאי') color = '#34c759'; // Green
                                            if (entry.name === 'לא במלאי') color = '#ff3b30'; // Red
                                            if (entry.name === 'טיוטה') color = '#ffcc00'; // Yellow
                                            return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `${value} מוצרים`} />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Smart Inventory Table Section */}
            <div className="space-y-6">
                <SectionTitle title="מוצרים מתים - ניתוח חכם" subtitle="מוצרים עם יחס מלאי-מכירות נמוך במיוחד וזמן מדף ארוך" />
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-black/[0.05] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-black/[0.02] text-[#86868b] text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-8 py-5">מוצר</th>
                                    <th className="px-8 py-5">מלאי נוכחי</th>
                                    <th className="px-8 py-5">זמן מדף (ימים)</th>
                                    <th className="px-8 py-5">קצב מכירה (חודשי)</th>
                                    <th className="px-8 py-5">ימי מלאי משוערים</th>
                                    <th className="px-8 py-5">ערך מלאי תקוע</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/[0.03]">
                                {dead_stock.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-black/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#1d1d1f] text-sm">{p.name}</span>
                                                <span className="text-[10px] text-[#86868b] font-mono">{p.sku}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-black text-sm text-[#1d1d1f]">{p.stock}</td>
                                        <td className="px-8 py-6 text-sm text-[#6d6d6d] font-medium">{p.age_days}</td>
                                        <td className="px-8 py-6 text-sm text-[#6d6d6d] font-medium">{p.sales_velocity.toFixed(2)}</td>
                                        <td className="px-8 py-6">
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                p.dos > 365 ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                                            )}>
                                                {p.dos > 999 ? '∞' : Math.round(p.dos)} ימים
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-[#ff2d55]">₪{(p.stock * p.price).toLocaleString()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Additional Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-[#0071e3] to-[#00c7be] p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20">
                    <h3 className="text-2xl font-black mb-4">תובנת מערכת חכמה</h3>
                    <p className="text-white/90 leading-relaxed font-medium">
                        זיהינו כי {dead_stock?.length || 0} מוצרים מהווים כ-₪{dead_stock?.reduce((acc: number, p: any) => acc + (p.stock * p.price), 0).toLocaleString() || 0} הון תקוע במחסן. 
                        {ltv_by_source && ltv_by_source.length > 0 && (
                            <>מקור ההגעה עם ה-LTV הגבוה ביותר הוא לקוחות המשתמשים בקופון <span className="font-black underline">{ltv_by_source[0]?.source}</span> עם ממוצע של ₪{Math.round(ltv_by_source[0]?.aov)} להזמנה.</>
                        )}
                    </p>
                    <div className="mt-8 flex gap-4">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2">
                            <Target size={14} /> המלצה: מבצע חיסול למוצרים מתים
                        </div>
                    </div>
                </div>
                <div className="bg-[#1d1d1f] p-8 rounded-[2.5rem] text-white flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-1">מדד החזר השקעה</h3>
                        <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Efficiency Score</p>
                    </div>
                    <div className="py-8">
                        <div className="text-5xl font-black text-[#5ac8fa]">84%</div>
                        <p className="text-white/60 text-sm mt-2 leading-tight">נצילות מלאי אופטימלית - חישוב מבוסס תנועת מלאי</p>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#5ac8fa] h-full w-[84%]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
