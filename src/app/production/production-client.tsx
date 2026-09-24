"use client";

import { Activity, Box, Settings, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProductionClient() {
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* Header Bento */}
        <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">ניהול ייצור</h1>
              <p className="text-slate-200 mt-1">לוח בקרה לסטטוס קווי ייצור והזמנות פעילות</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20 font-medium text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                הגדרות ייצור
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bento Cards */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <Activity className="w-8 h-8 text-blue-300 mb-2" />
          <h3 className="text-slate-300 text-sm uppercase tracking-widest font-medium">יעילות תפעולית</h3>
          <p className="text-white text-4xl font-light">94%</p>
        </div>
        
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-300 mb-2" />
          <h3 className="text-slate-300 text-sm uppercase tracking-widest font-medium">הושלמו היום</h3>
          <p className="text-white text-4xl font-light">1,240</p>
        </div>

        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <Box className="w-8 h-8 text-amber-300 mb-2" />
          <h3 className="text-slate-300 text-sm uppercase tracking-widest font-medium">ממתינים לאריזה</h3>
          <p className="text-white text-4xl font-light">342</p>
        </div>

        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-300 mb-2" />
          <h3 className="text-slate-300 text-sm uppercase tracking-widest font-medium">עיכובים</h3>
          <p className="text-white text-4xl font-light">3</p>
        </div>

        {/* Production Lines Bento */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col min-h-[400px]">
          <h2 className="text-xl font-bold text-white mb-6">קווי ייצור פעילים</h2>
          <div className="space-y-4 flex-1">
            {[1, 2, 3].map((line) => (
              <div key={line} className="bg-black/20 rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Activity className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">קו ייצור {line} - בישום</h3>
                    <p className="text-slate-300 text-sm">מנהל קו: ישראל ישראלי</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs">הספק שעתי</span>
                    <span className="text-white font-medium">145 יח׳/ש׳</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs">סטטוס</span>
                    <span className="text-emerald-300 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      פעיל
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Orders Bento */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 flex flex-col min-h-[400px]">
          <h2 className="text-xl font-bold text-white mb-6">הזמנות בעבודה</h2>
          <div className="space-y-4 flex-1">
            {[1, 2, 3, 4].map((order) => (
              <div key={order} className="bg-black/20 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">הזמנה #{2340 + order}</h3>
                  <p className="text-slate-300 text-sm">לקוח: סיטונאי {order}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-white font-medium text-sm">450 / 1000 יח׳</span>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full" 
                      style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20 font-medium text-sm">
            צפה בכל ההזמנות
          </button>
        </div>

      </div>
    </div>
  );
}
