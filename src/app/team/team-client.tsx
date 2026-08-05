"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, LayoutList, Calendar, CheckCircle2 } from "lucide-react";

interface TeamClientProps {
  roleHolders: any[];
  monthlySchedule: any[];
  bankOfTasks: any[];
  groupedTasks: Record<string, string[]>;
}

export default function TeamClient({
  roleHolders,
  monthlySchedule,
  bankOfTasks,
  groupedTasks
}: TeamClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">בעלי תפקידים וצוות</h1>
        <p className="text-muted-foreground mt-2">צפייה בתחומי האחריות, לו"ז ומשימות של חברי הצוות.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">בעלי תפקידים במערכת</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleHolders.length}</div>
            <p className="text-xs text-muted-foreground">אנשי צוות מוגדרים</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות בבנק</CardTitle>
            <LayoutList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bankOfTasks.length}</div>
            <p className="text-xs text-muted-foreground">משימות מחכות לטיפול</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שבועות לו"ז מוגדרים</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlySchedule.length}</div>
            <p className="text-xs text-muted-foreground">משימות שבועיות</p>
          </CardContent>
        </Card>
      </div>

      {Object.keys(groupedTasks).length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground shadow-sm">
          אין נתונים על בעלי תפקידים. אנא הרץ את סקריפט הייבוא.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedTasks).map(([assignee, tasks]) => (
            <div key={assignee} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {assignee.charAt(0)}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{assignee}</h2>
              </div>
              
              <ul className="space-y-3 flex-1">
                {tasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary/60 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 leading-relaxed">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Raw Role Holders Table */}
      <Card className="bg-white border-none shadow-sm mt-8">
        <CardHeader>
          <CardTitle>בעלי תפקידים (גולמי)</CardTitle>
          <CardDescription>פירוט בעלי התפקידים כפי שהוזנו במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">שם</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">תפקיד</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roleHolders && roleHolders.length > 0 ? (
                  roleHolders.map((roleHolder) => (
                    <tr key={roleHolder.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">{roleHolder.name || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-pre-wrap">{roleHolder.role || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-muted-foreground">
                      לא נמצאו תפקידים.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Raw Monthly Schedule Table */}
      <Card className="bg-white border-none shadow-sm mt-8">
        <CardHeader>
          <CardTitle>לו"ז חודשי (גולמי)</CardTitle>
          <CardDescription>פירוט הלו"ז השבועי/חודשי</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">שבוע</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">משימה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlySchedule && monthlySchedule.length > 0 ? (
                  monthlySchedule.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">שבוע {schedule.weekNumber || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{schedule.task || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-muted-foreground">
                      לא נמצא לו"ז.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Raw Bank of Tasks Table */}
      <Card className="bg-white border-none shadow-sm mt-8">
        <CardHeader>
          <CardTitle>בנק משימות (גולמי)</CardTitle>
          <CardDescription>טבלת בנק המשימות במלואה</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">אינדקס</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">אחראי</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">משימה</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">תאריך יעד</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bankOfTasks && bankOfTasks.length > 0 ? (
                  bankOfTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{task.itemIndex || '-'}</td>
                      <td className="py-3 px-4 font-medium whitespace-nowrap">{task.assignee || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">{task.taskName || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{task.dueDate || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px]">{task.status || '-'}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      לא נמצאו משימות בבנק.
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
