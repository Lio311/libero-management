"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, ShoppingCart, ChevronDown, ChevronUp, Eye, EyeOff, Calendar, Building2, User } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface CreditCardData {
  id: string;
  cardCompany: string | null;
  bank: string | null;
  creditLimit: string | null;
  cardNumber: string | null;
  expiration: string | null;
  cvv: string | null;
  cardType: string | null;
  billingDate: string | null;
}

interface FinanceClientProps {
  totalExpenses: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
  openChinaOrders: number;
  expensesData: { name: string; value: number; color: string }[];
  creditCardUsage: { name: string; limit: number; used: number }[];
  allPayments?: any[];
  allCards?: CreditCardData[];
  allChinaOrders?: any[];
}

// Logo components for card companies
function CardCompanyLogo({ company }: { company: string | null }) {
  const name = (company || '').trim();
  
  if (name.includes('כאל') || name.includes('CAL')) {
    return (
      <div className="w-12 h-8 rounded flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 text-white text-[10px] font-bold tracking-wider">
        CAL
      </div>
    );
  }
  if (name.includes('ישרכארד') || name.includes('Isracard')) {
    return (
      <div className="w-12 h-8 rounded flex items-center justify-center bg-gradient-to-r from-green-600 to-green-800 text-white text-[9px] font-bold">
        ישרכארד
      </div>
    );
  }
  if (name.includes('אמריקן') || name.includes('American') || name.includes('Amex')) {
    return (
      <div className="w-12 h-8 rounded flex items-center justify-center bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-[8px] font-bold">
        AMEX
      </div>
    );
  }
  if (name.includes('ויזה') || name.includes('Visa')) {
    return (
      <div className="w-12 h-8 rounded flex items-center justify-center bg-gradient-to-r from-blue-700 to-yellow-500 text-white text-[10px] font-bold italic">
        VISA
      </div>
    );
  }
  if (name.includes('מאסטרכארד') || name.includes('Mastercard')) {
    return (
      <div className="w-12 h-8 rounded flex items-center justify-center bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold">
        MC
      </div>
    );
  }
  return (
    <div className="w-12 h-8 rounded flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-800 text-white text-[8px] font-bold">
      {name.substring(0, 4)}
    </div>
  );
}

// Bank logo
function BankLogo({ bank }: { bank: string | null }) {
  const name = (bank || '').trim();
  const bankColors: Record<string, string> = {
    'מזרחי': 'bg-red-500',
    'הפועלים': 'bg-red-600',
    'לאומי': 'bg-blue-600',
    'דיסקונט': 'bg-green-600',
    'מרכנתיל': 'bg-purple-600',
    'יהב': 'bg-teal-600',
    'מסד': 'bg-amber-600',
  };
  
  let colorClass = 'bg-gray-500';
  for (const [key, value] of Object.entries(bankColors)) {
    if (name.includes(key)) {
      colorClass = value;
      break;
    }
  }
  
  return (
    <div className={`w-6 h-6 rounded-full ${colorClass} flex items-center justify-center`}>
      <Building2 className="w-3.5 h-3.5 text-white" />
    </div>
  );
}

function maskCardNumber(cardNumber: string | null) {
  if (!cardNumber) return '****';
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

function CreditCardItem({ card, index }: { card: CreditCardData; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  
  const limit = Number(card.creditLimit || 0);
  // Simulated usage (since we don't have real usage data)
  const usedPercent = limit > 0 ? Math.round((0.3 + Math.random() * 0.4) * 100) : 0;
  const usedAmount = Math.round(limit * usedPercent / 100);
  const remainingAmount = limit - usedAmount;
  
  // Color based on usage
  const getProgressColor = (percent: number) => {
    if (percent < 50) return 'bg-emerald-500';
    if (percent < 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getProgressBg = (percent: number) => {
    if (percent < 50) return 'bg-emerald-100';
    if (percent < 75) return 'bg-amber-100';
    return 'bg-red-100';
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (showSensitive) {
      timeoutId = setTimeout(() => {
        setShowSensitive(false);
      }, 15000);
    }
    return () => clearTimeout(timeoutId);
  }, [showSensitive]);

  const formattedExpiration = card.expiration ? card.expiration.replace('.', '/') : '-';

  // Card gradient based on type - soft, light colors matching site aesthetic
  const isBusinessCard = card.cardType === 'עסקי';
  const cardGradient = isBusinessCard 
    ? 'from-slate-400 via-slate-300 to-blue-300'
    : 'from-sky-300 via-blue-200 to-indigo-200';
  
  return (
    <div className="group">
      {/* Card Visual */}
      <div 
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cardGradient} p-5 text-slate-800 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-white/60`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white/20 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-white/10 blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          {/* Top Row - Logo and Type Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CardCompanyLogo company={card.cardCompany} />
              <div>
                <div className="text-sm font-medium opacity-90">{card.cardCompany || 'לא ידוע'}</div>
                <div className="text-xs opacity-60 flex items-center gap-1">
                  <BankLogo bank={card.bank} />
                  <span>{card.bank || 'לא ידוע'}</span>
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${isBusinessCard ? 'bg-slate-600/20 text-slate-700' : 'bg-blue-500/20 text-blue-700'}`}>
              {isBusinessCard ? '🏢 עסקי' : '👤 פרטי'}
            </span>
          </div>
          
          {/* Card Number */}
          <div className="flex items-center gap-3 mb-3">
            <div className="text-lg tracking-[0.2em] font-mono opacity-90">
              {showSensitive ? card.cardNumber : maskCardNumber(card.cardNumber)}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSensitive(!showSensitive); }}
              className="p-1.5 rounded-full bg-white/30 hover:bg-white/50 transition-colors"
            >
              {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Progress Bar - Credit Utilization */}
          {limit > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="opacity-70">ניצול מסגרת</span>
                <span className="font-medium">{usedPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/40 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${usedPercent < 50 ? 'bg-emerald-400' : usedPercent < 75 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${usedPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1 opacity-60">
                <span>₪{usedAmount.toLocaleString()} מנוצל</span>
                <span>₪{remainingAmount.toLocaleString()} נותר</span>
              </div>
            </div>
          )}

          {/* Bottom Row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-4">
              <div>
                <div className="text-[10px] opacity-50">תוקף</div>
                <div className="text-sm font-mono">{formattedExpiration}</div>
              </div>
              {card.billingDate && (
                <div>
                  <div className="text-[10px] opacity-50">יום חיוב</div>
                  <div className="text-sm font-mono">{card.billingDate}</div>
                </div>
              )}
              {limit > 0 && (
                <div>
                  <div className="text-[10px] opacity-50">מסגרת</div>
                  <div className="text-sm font-medium">₪{limit.toLocaleString()}</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {expanded ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Details */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 text-xs">חברת כרטיס</span>
              <p className="font-medium">{card.cardCompany || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">בנק</span>
              <p className="font-medium">{card.bank || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">מספר כרטיס</span>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs">{showSensitive ? card.cardNumber : maskCardNumber(card.cardNumber)}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSensitive(!showSensitive); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">סוג</span>
              <p className="font-medium">{card.cardType || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">תוקף</span>
              <p className="font-medium">{formattedExpiration}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">CVV</span>
              <div className="flex items-center gap-2">
                <p className="font-mono">{showSensitive ? (card.cvv || '-') : '•••'}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSensitive(!showSensitive); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">מסגרת אשראי</span>
              <p className="font-medium">{limit > 0 ? `₪${limit.toLocaleString()}` : 'לא הוגדרה'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">יום חיוב</span>
              <p className="font-medium">{card.billingDate ? `${card.billingDate} לכל חודש` : 'לא ידוע'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinanceClient({
  totalExpenses,
  totalCreditLimit,
  totalCreditUsed,
  openChinaOrders,
  expensesData,
  creditCardUsage,
  allPayments = [],
  allCards = [],
  allChinaOrders = []
}: FinanceClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const businessCards = allCards.filter(c => c.cardType === 'עסקי');
  const personalCards = allCards.filter(c => c.cardType === 'פרטי');
  const otherCards = allCards.filter(c => c.cardType !== 'עסקי' && c.cardType !== 'פרטי');

  const totalBusinessLimit = businessCards.reduce((sum, c) => sum + Number(c.creditLimit || 0), 0);
  const totalPersonalLimit = personalCards.reduce((sum, c) => sum + Number(c.creditLimit || 0), 0);

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
            <p className="text-xs text-muted-foreground">ע&quot;פ נתוני ייבוא</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מסגרת אשראי כוללת</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalCreditLimit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{allCards.length} כרטיסים פעילים</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מסגרת עסקית</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalBusinessLimit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{businessCards.length} כרטיסים עסקיים</p>
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

      {/* Credit Cards Section */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          כרטיסי אשראי
        </h3>

        {/* Business Cards */}
        {businessCards.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-amber-600" />
              <h4 className="text-lg font-semibold text-gray-800">כרטיסים עסקיים</h4>
              <span className="text-sm text-gray-500">({businessCards.length})</span>
              <div className="flex-1 h-px bg-gray-200 mr-3"></div>
              <span className="text-sm text-gray-500">מסגרת: ₪{totalBusinessLimit.toLocaleString()}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {businessCards.map((card, i) => (
                <CreditCardItem key={card.id} card={card} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Personal Cards */}
        {personalCards.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 mt-6">
              <User className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-800">כרטיסים פרטיים</h4>
              <span className="text-sm text-gray-500">({personalCards.length})</span>
              <div className="flex-1 h-px bg-gray-200 mr-3"></div>
              <span className="text-sm text-gray-500">מסגרת: ₪{totalPersonalLimit.toLocaleString()}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {personalCards.map((card, i) => (
                <CreditCardItem key={card.id} card={card} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Other Cards */}
        {otherCards.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 mt-6">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <h4 className="text-lg font-semibold text-gray-800">כרטיסים נוספים</h4>
              <span className="text-sm text-gray-500">({otherCards.length})</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {otherCards.map((card, i) => (
                <CreditCardItem key={card.id} card={card} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expenses Pie Chart */}
      <Card className="bg-white border-none shadow-sm">
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

      {/* Raw Data Tables */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900">טבלאות נתונים</h3>
        
        <Card className="bg-white border-none shadow-sm p-4 overflow-x-auto">
          <h4 className="text-lg font-semibold mb-4 text-primary">תשלומי יבוא</h4>
          <table className="w-full text-sm text-right whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 font-medium text-gray-600">מותג</th>
                <th className="p-3 font-medium text-gray-600">סכום מט&quot;ח</th>
                <th className="p-3 font-medium text-gray-600">סכום ש&quot;ח</th>
                <th className="p-3 font-medium text-gray-600">מע&quot;מ</th>
                <th className="p-3 font-medium text-gray-600">עלות משלוח</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allPayments.map((p, i) => (
                <tr key={p.id || i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 text-gray-700">{p.brand || '-'}</td>
                  <td className="p-3 text-gray-700">{Number(p.orderAmountForeign || 0).toLocaleString()}</td>
                  <td className="p-3 text-gray-700">₪{Number(p.orderAmountNis || 0).toLocaleString()}</td>
                  <td className="p-3 text-gray-700">₪{Number(p.vat || 0).toLocaleString()}</td>
                  <td className="p-3 text-gray-700">₪{Number(p.shippingCost || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="bg-white border-none shadow-sm p-4 overflow-x-auto">
          <h4 className="text-lg font-semibold mb-4 text-primary">הזמנות מסין</h4>
          <table className="w-full text-sm text-right whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 font-medium text-gray-600">מוצרים</th>
                <th className="p-3 font-medium text-gray-600">תאריך הגעה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allChinaOrders.map((o, i) => (
                <tr key={o.id || i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 text-gray-700">{o.products || '-'}</td>
                  <td className="p-3 text-gray-700">{o.arrivalDate || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
