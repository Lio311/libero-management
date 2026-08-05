"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Camera, TrendingUp, HandCoins } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { updateInfluencer, updateInfluencerPayment } from "@/app/actions/marketing";
import { Check, X, Edit2, ChevronRight, ChevronLeft } from "lucide-react";

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
    notes: inf.notes || ''
  });

  const handleSave = async () => {
    await updateInfluencer(inf.id, data);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setData({
      influencerName: inf.influencerName || '',
      brand: inf.brand || '',
      isPaid: inf.isPaid || '',
      videoCount: inf.videoCount || '',
      postCount: inf.postCount || '',
      productsGiven: inf.productsGiven || '',
      videosUploaded: inf.videosUploaded || '',
      activities: inf.activities || '',
      notes: inf.notes || ''
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50/30 transition-colors">
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.influencerName} onChange={e => setData({...data, influencerName: e.target.value})} /></td>
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.brand} onChange={e => setData({...data, brand: e.target.value})} /></td>
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.isPaid} onChange={e => setData({...data, isPaid: e.target.value})} /></td>
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.videoCount} onChange={e => setData({...data, videoCount: e.target.value})} /></td>
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.postCount} onChange={e => setData({...data, postCount: e.target.value})} /></td>
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.productsGiven} onChange={e => setData({...data, productsGiven: e.target.value})} /></td>
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.videosUploaded} onChange={e => setData({...data, videosUploaded: e.target.value})} /></td>
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.activities} onChange={e => setData({...data, activities: e.target.value})} /></td>
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.notes} onChange={e => setData({...data, notes: e.target.value})} /></td>
        <td className="p-2">
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="h-4 w-4" /></button>
            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="h-4 w-4" /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="py-3 px-4 font-medium whitespace-nowrap">{inf.influencerName || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap">{inf.brand || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap">{inf.isPaid || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap">{inf.videoCount || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap">{inf.postCount || '-'}</td>
      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{inf.productsGiven || '-'}</td>
      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{inf.videosUploaded || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap max-w-[200px] truncate" title={inf.activities}>{inf.activities || '-'}</td>
      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap max-w-[200px] truncate" title={inf.notes}>{inf.notes || '-'}</td>
      <td className="py-3 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsEditing(true)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
          <Edit2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function EditablePaymentRow({ payment }: { payment: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState({
    influencerName: payment.influencerName || '',
    amount: payment.amount || 0,
    isDone: payment.isDone || '',
    paymentMonth: payment.paymentMonth || '',
    notes: payment.notes || ''
  });

  const handleSave = async () => {
    await updateInfluencerPayment(payment.id, {
      ...data,
      amount: data.amount.toString()
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setData({
      influencerName: payment.influencerName || '',
      amount: payment.amount || 0,
      isDone: payment.isDone || '',
      paymentMonth: payment.paymentMonth || '',
      notes: payment.notes || ''
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50/30 transition-colors">
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.influencerName} onChange={e => setData({...data, influencerName: e.target.value})} /></td>
        <td className="p-2"><input type="number" className="w-full p-1 border rounded text-sm text-right" dir="ltr" value={data.amount} onChange={e => setData({...data, amount: e.target.value})} /></td>
        <td className="p-2">
          <select 
            className="w-full p-1 border rounded text-sm text-right bg-white" 
            value={data.isDone === 'v' || data.isDone === 'V' || data.isDone === 'כן' || data.isDone === 'בוצע' ? 'בוצע' : 'לא בוצע'} 
            onChange={e => setData({...data, isDone: e.target.value})}
          >
            <option value="לא בוצע">לא בוצע</option>
            <option value="בוצע">בוצע</option>
          </select>
        </td>
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" placeholder="MM-YYYY" value={data.paymentMonth} onChange={e => setData({...data, paymentMonth: e.target.value})} /></td>
        <td className="p-2"><input className="w-full p-1 border rounded text-sm text-right" value={data.notes} onChange={e => setData({...data, notes: e.target.value})} /></td>
        <td className="p-2">
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="h-4 w-4" /></button>
            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="h-4 w-4" /></button>
          </div>
        </td>
      </tr>
    );
  }

  const isCompleted = payment.isDone === 'כן' || payment.isDone === 'בוצע' || payment.isDone?.toLowerCase() === 'v';

  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="py-3 px-4 font-medium whitespace-nowrap">{payment.influencerName || '-'}</td>
      <td className="py-3 px-4 font-medium whitespace-nowrap">₪{payment.amount || '0'}</td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {isCompleted ? 'בוצע' : 'לא בוצע'}
        </span>
      </td>
      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{payment.paymentMonth || '-'}</td>
      <td className="py-3 px-4 text-muted-foreground">{payment.notes || '-'}</td>
      <td className="py-3 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsEditing(true)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
          <Edit2 className="h-4 w-4" />
        </button>
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

  // Month navigation logic
  const allMonths = Array.from(new Set(rawPayments.map(p => p.paymentMonth).filter(Boolean))).sort();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(allMonths.length > 0 ? allMonths.length - 1 : -1);

  useEffect(() => {
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משפיענים במערכת</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInfluencers}</div>
            <p className="text-xs text-muted-foreground">רשומים בבסיס הנתונים</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הערכת חשיפה מצטברת</CardTitle>
            <Camera className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFollowersEstimate}</div>
            <p className="text-xs text-muted-foreground">עוקבים (הערכה כללית)</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מוצרים שנשלחו</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProductsGiven}</div>
            <p className="text-xs text-muted-foreground">לפי תיעוד במערכת</p>
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

      <div className="flex justify-center w-full">
        <Card className="w-full max-w-2xl bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>ביצועי קמפיינים</CardTitle>
            <CardDescription>ניתוח מדדי איכות (מבוסס תיעוד)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={influencerPerformance}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="ביצועים" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Raw Influencers Table */}
      <Card className="bg-white border-none shadow-sm mt-8">
        <CardHeader>
          <CardTitle>נתוני משפיענים (גולמי)</CardTitle>
          <CardDescription>פירוט פעילות משפיענים כפי שהוזנה במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">שם</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">מותג</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">בתשלום?</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">מספר סרטונים</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">מספר פוסטים</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">מוצרים שניתנו</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סרטונים שהועלו</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">פעילויות</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">הערות</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawInfluencers && rawInfluencers.length > 0 ? (
                  rawInfluencers.map((inf) => (
                    <EditableInfluencerRow key={inf.id} inf={inf} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-muted-foreground">
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
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">שם משפיענ/ית</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סכום</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">בוצע?</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">חודש</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">הערות</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments && filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <EditablePaymentRow key={payment.id} payment={payment} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
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
