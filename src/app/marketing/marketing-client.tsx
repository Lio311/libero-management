"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Camera, TrendingUp, HandCoins } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">הערות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawInfluencers && rawInfluencers.length > 0 ? (
                  rawInfluencers.map((inf) => (
                    <tr key={inf.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">{inf.influencerName || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{inf.brand || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{inf.isPaid || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{inf.videoCount || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{inf.postCount || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{inf.productsGiven || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{inf.videosUploaded || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap max-w-[200px] truncate" title={inf.activities}>{inf.activities || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap max-w-[200px] truncate" title={inf.notes}>{inf.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
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
        <CardHeader>
          <CardTitle>תשלומי משפיענים (גולמי)</CardTitle>
          <CardDescription>פירוט התשלומים למשפיענים כפי שהוזנו במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">שם משפיענ/ית</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סכום</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">בוצע?</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">הערות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawPayments && rawPayments.length > 0 ? (
                  rawPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">{payment.influencerName || '-'}</td>
                      <td className="py-3 px-4 font-medium whitespace-nowrap">₪{payment.amount || '0'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${payment.isDone === 'כן' || payment.isDone === 'בוצע' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {payment.isDone || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{payment.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      לא נמצאו תשלומים.
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
