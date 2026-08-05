"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, Contact, CheckCircle2, Clock, AlertCircle, LayoutList, LayoutGrid } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface OperationsClientProps {
  todoTasks: { id: string; title: string; status: string; priority: string; assignee: string }[];
  inProgressTasks: { id: string; title: string; status: string; priority: string; assignee: string }[];
  doneTasks: { id: string; title: string; status: string; priority: string; assignee: string }[];
  wholesaleClients: { name: string; contact: string; totalOrders: number; revenue: number; interest: string }[];
  rawWholesaleCustomers: any[];
  rawTeamTasks: any[];
}

export default function OperationsClient({
  todoTasks,
  inProgressTasks,
  doneTasks,
  wholesaleClients,
  rawWholesaleCustomers,
  rawTeamTasks
}: OperationsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const taskStats = [
    { name: 'לביצוע', value: todoTasks.length, color: '#f3f4f6' }, // gray
    { name: 'בתהליך', value: inProgressTasks.length, color: '#bfdbfe' }, // blue
    { name: 'הושלם', value: doneTasks.length, color: '#bbf7d0' }, // green
  ];

  const allTasks = [...todoTasks.map(t => ({...t, status: 'todo'})), ...inProgressTasks.map(t => ({...t, status: 'in-progress'})), ...doneTasks.map(t => ({...t, status: 'done'}))];

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">תפעול וסיטונאות</h2>
        <p className="text-muted-foreground mt-2">בנק משימות, ניהול שוטף ולקוחות סיטונאיים.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Task Distribution Chart */}
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">התפלגות משימות</CardTitle>
          </CardHeader>
          <CardContent className="h-[120px] flex items-center justify-center">
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">לקוחות סיטונאיים במערכת</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wholesaleClients.length}</div>
            <p className="text-xs text-muted-foreground">לקוחות פוטנציאליים / פעילים</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות פתוחות לצוות</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoTasks.length + inProgressTasks.length}</div>
            <p className="text-xs text-muted-foreground">ממתינות לביצוע / בתהליך</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {/* Task Bank */}
        <Card className="col-span-2 bg-white border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle>בנק משימות לצוות</CardTitle>
              <CardDescription>משימות פנימיות ממסד הנתונים</CardDescription>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md flex items-center transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                title="תצוגת לוח"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md flex items-center transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                title="תצוגת גיליון (אקסל)"
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {viewMode === 'kanban' ? (
              <div className="grid grid-cols-3 gap-4 min-h-[400px]">
                {/* To Do Column */}
                <div className="bg-gray-100/50 p-4 rounded-lg flex flex-col gap-3">
                  <div className="font-semibold text-sm flex items-center justify-between text-gray-600 mb-2">
                    לביצוע <Badge variant="secondary">{todoTasks.length}</Badge>
                  </div>
                  {todoTasks.map(task => (
                    <div key={task.id} className="bg-white p-3 rounded shadow-sm border border-border/50 text-sm hover:border-primary cursor-pointer transition-colors">
                      <div className="font-medium mb-1">{task.title}</div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                        <span>{task.assignee}</span>
                        <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'} className="text-[10px]">
                          {task.priority === 'high' ? 'דחוף' : 'רגיל'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* In Progress Column */}
                <div className="bg-blue-50/50 p-4 rounded-lg flex flex-col gap-3">
                  <div className="font-semibold text-sm flex items-center justify-between text-blue-600 mb-2">
                    בתהליך <Badge variant="secondary" className="bg-blue-100 text-blue-700">{inProgressTasks.length}</Badge>
                  </div>
                  {inProgressTasks.map(task => (
                    <div key={task.id} className="bg-white p-3 rounded shadow-sm border border-blue-200 text-sm hover:border-blue-400 cursor-pointer transition-colors">
                      <div className="font-medium mb-1">{task.title}</div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                        <span>{task.assignee}</span>
                        <Clock className="w-3 h-3 text-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Done Column */}
                <div className="bg-green-50/50 p-4 rounded-lg flex flex-col gap-3">
                  <div className="font-semibold text-sm flex items-center justify-between text-green-600 mb-2">
                    הושלם <Badge variant="secondary" className="bg-green-100 text-green-700">{doneTasks.length}</Badge>
                  </div>
                  {doneTasks.map(task => (
                    <div key={task.id} className="bg-white p-3 rounded shadow-sm border border-green-200 text-sm hover:border-green-400 cursor-pointer transition-colors">
                      <div className="font-medium line-through text-gray-500 mb-1">{task.title}</div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                        <span>{task.assignee}</span>
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-right">
                  <thead className="bg-gray-50/80 text-muted-foreground border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 font-medium rounded-tr-md">מזהה משימה</th>
                      <th className="py-3 px-4 font-medium">תיאור המשימה</th>
                      <th className="py-3 px-4 font-medium">אחראי</th>
                      <th className="py-3 px-4 font-medium">עדיפות</th>
                      <th className="py-3 px-4 font-medium rounded-tl-md">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allTasks.map((task, i) => (
                      <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{task.id.slice(0, 8)}</td>
                        <td className={`py-3 px-4 font-medium ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</td>
                        <td className="py-3 px-4 text-gray-600">{task.assignee}</td>
                        <td className="py-3 px-4">
                          <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'} className="text-[10px] font-normal">
                            {task.priority === 'high' ? 'דחוף' : 'רגיל'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            task.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.status === 'todo' ? 'לביצוע' : task.status === 'in-progress' ? 'בתהליך' : 'הושלם'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {allTasks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          אין משימות במערכת.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wholesale Clients Cards */}
        <Card className="col-span-1 bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>לקוחות סיטונאות (B2B)</CardTitle>
            <CardDescription>רשימת לקוחות ומתעניינים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wholesaleClients.slice(0, 8).map((client, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border/50">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">{client.name}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Contact className="w-3 h-3 ml-1" />
                    {client.contact}
                  </div>
                </div>
                <div className="text-left">
                  <Badge variant="outline" className="text-[10px]">{client.interest}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Raw Wholesale Customers Table */}
      <Card className="bg-white border-none shadow-sm mt-8">
        <CardHeader>
          <CardTitle>נתוני לקוחות סיטונאיים (גולמי)</CardTitle>
          <CardDescription>טבלת לקוחות סיטונאיים מלאה כפי שהוזנה במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">שם חנות</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">עיר</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">כתובת</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">שיחת טלפון</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">ביקור</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">פוטנציאל</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">עניין</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">הערות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawWholesaleCustomers && rawWholesaleCustomers.length > 0 ? (
                  rawWholesaleCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">{customer.storeName || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{customer.city || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{customer.address || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{customer.phoneCall || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{customer.visit || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{customer.potential || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px]">{customer.interest || '-'}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{customer.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      לא נמצאו לקוחות.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Raw Team Tasks Table */}
      <Card className="bg-white border-none shadow-sm mt-8">
        <CardHeader>
          <CardTitle>משימות צוות (גולמי)</CardTitle>
          <CardDescription>פירוט משימות צוות כפי שהוזנו במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">מזהה</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">אחראי</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">תיאור משימה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawTeamTasks && rawTeamTasks.length > 0 ? (
                  rawTeamTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs whitespace-nowrap">{task.id.slice(0, 8)}</td>
                      <td className="py-3 px-4 font-medium whitespace-nowrap">{task.assignee || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{task.taskDescription || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      לא נמצאו משימות.
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
