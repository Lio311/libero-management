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
}

export default function MarketingClient({
  activeInfluencers,
  totalFollowersEstimate,
  totalProductsGiven,
  totalInfluencerPayments,
  monthlyGrowth,
  influencerPerformance
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>צמיחה מדווחת מול הוצאות</CardTitle>
            <CardDescription>מגמות לאורך חציון אחרון (המחשה)</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[450px]">
            <div dir="ltr" className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyGrowth} margin={{ top: 20, right: 60, left: 60, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} width={100} tickMargin={10} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} width={100} tickMargin={10} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} verticalAlign="bottom" />
                <Line yAxisId="left" type="monotone" dataKey="followers" name="עוקבים" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="הוצאות/הכנסות (₪)" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>ביצועי קמפיינים</CardTitle>
            <CardDescription>ניתוח מדדי איכות (המחשה מבוססת תיעוד)</CardDescription>
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
    </div>
  );
}
