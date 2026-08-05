"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, Contact, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface OperationsClientProps {
  todoTasks: { id: string; title: string; status: string; priority: string; assignee: string }[];
  inProgressTasks: { id: string; title: string; status: string; priority: string; assignee: string }[];
  doneTasks: { id: string; title: string; status: string; priority: string; assignee: string }[];
  wholesaleClients: { name: string; contact: string; totalOrders: number; revenue: number; interest: string }[];
}

export default function OperationsClient({
  todoTasks,
  inProgressTasks,
  doneTasks,
  wholesaleClients
}: OperationsClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">תפעול וסיטונאות</h2>
        <p className="text-muted-foreground mt-2">בנק משימות, ניהול שוטף ולקוחות סיטונאיים.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        {/* Kanban Board Simulation */}
        <Card className="col-span-2 bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>בנק משימות לצוות</CardTitle>
            <CardDescription>משימות פנימיות ממסד הנתונים</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 h-full">
              {/* To Do Column */}
              <div className="bg-gray-100/50 p-4 rounded-lg flex flex-col gap-3 min-h-[300px]">
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
              <div className="bg-blue-50/50 p-4 rounded-lg flex flex-col gap-3 min-h-[300px]">
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
              <div className="bg-green-50/50 p-4 rounded-lg flex flex-col gap-3 min-h-[300px]">
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
    </div>
  );
}
