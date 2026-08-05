/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Cable, Trash2, Edit2, Check, X } from "lucide-react";
import Xarrow, { Xwrapper, useXarrow } from "react-xarrows";
import { updateRoleHolder, addTeamTaskConnection, removeTeamTaskConnection, createRoleHolder, deleteRoleHolder } from "@/app/actions/team";
import { useRouter } from "next/navigation";

interface TeamClientProps {
  roleHolders: any[];
  groupedTasks: Record<string, { id: string, description: string }[]>;
  connections: any[];
}

function EditableRoleRow({ roleHolder, onDelete }: { roleHolder: any, onDelete: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: roleHolder.name || '',
    role: roleHolder.role || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = async () => {
    // We will use explicit save/cancel buttons instead of onBlur
  };

  const handleSave = async () => {
    setIsEditing(false);
    if (roleHolder.id) {
      await updateRoleHolder(roleHolder.id, {
        name: formData.name,
        role: formData.role,
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: roleHolder.name || '',
      role: roleHolder.role || '',
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <tr onClick={() => setIsEditing(true)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
        <td className="py-3 px-4 font-medium whitespace-nowrap">{formData.name || '-'}</td>
        <td className="py-3 px-4 text-muted-foreground whitespace-pre-wrap text-right">{formData.role || '-'}</td>
        <td className="py-3 px-4 w-16">
          <div className="flex gap-2 justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="ערוך"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (roleHolder.id) onDelete(roleHolder.id); }}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="מחק"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-blue-50/30 transition-colors">
      <td className="p-2">
        <input 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          autoFocus 
          className="w-full p-2 border rounded text-sm text-right" 
          dir="rtl" 
        />
      </td>
      <td className="p-2">
        <textarea 
          name="role" 
          value={formData.role} 
          onChange={handleChange} 
          className="w-full p-2 border rounded text-sm text-right min-h-[60px]" 
          dir="rtl" 
        />
      </td>
      <td className="p-2">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function TeamClient({
  roleHolders,
  groupedTasks,
  connections
}: TeamClientProps) {
  const [mounted, setMounted] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', role: '' });
  const updateXarrow = useXarrow();
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Add event listener to update arrows on window resize
    window.addEventListener('resize', updateXarrow);
    return () => window.removeEventListener('resize', updateXarrow);
  }, [updateXarrow]);

  const handleTaskClick = async (taskId: string) => {
    if (!connectMode) return;

    if (!selectedTask) {
      setSelectedTask(taskId);
    } else {
      if (selectedTask !== taskId) {
        await addTeamTaskConnection(selectedTask, taskId);
      }
      setSelectedTask(null);
    }
  };

  const handleRemoveConnection = async (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    if (confirm('האם להסיר את הקשר בין המשימות?')) {
      await removeTeamTaskConnection(connectionId);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.role) return;
    setIsAddingNew(false);
    await createRoleHolder(newRole);
    setNewRole({ name: '', role: '' });
    router.refresh();
  };

  const handleDeleteRole = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק תפקיד זה?')) {
      await deleteRoleHolder(id);
      router.refresh();
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">בעלי תפקידים וצוות</h1>
        <p className="text-muted-foreground mt-2">צפייה בתחומי האחריות ומשימות של חברי הצוות.</p>
      </div>

      <Xwrapper>
        {Object.keys(groupedTasks).length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground shadow-sm">
            אין נתונים על בעלי תפקידים.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => { setConnectMode(!connectMode); setSelectedTask(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  connectMode 
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                <Cable className="w-5 h-5" />
                {connectMode ? 'מצב חיבור פעיל (לחץ לביטול)' : 'מצב יצירת קשרים'}
              </button>
              {connectMode && (
                <p className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg animate-pulse">
                  {selectedTask ? 'בחר משימת יעד לחיבור' : 'בחר משימת מקור לחיבור'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
              {Object.entries(groupedTasks).map(([assignee, tasks]) => (
                <div key={assignee} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                      {assignee.charAt(0)}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{assignee}</h2>
                  </div>
                  
                  <ul className="space-y-3 flex-1 relative z-10">
                    {tasks.map((task) => {
                      const isSelected = selectedTask === task.id;
                      return (
                        <li 
                          key={task.id} 
                          id={`task-${task.id}`}
                          onClick={() => handleTaskClick(task.id)}
                          className={`flex items-start gap-2 p-3 rounded-lg transition-all ${
                            connectMode ? 'cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-200' : ''
                          } ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-gray-50/50'
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${connectMode ? 'text-blue-400' : 'text-gray-400'}`} />
                          <span className="text-sm text-gray-700 leading-relaxed">{task.description}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              
              {/* Render arrows */}
              {connections.map(conn => (
                 <Xarrow 
                   key={conn.id} 
                   start={`task-${conn.sourceTaskId}`} 
                   end={`task-${conn.targetTaskId}`} 
                   color="#94a3b8"
                   strokeWidth={2}
                   path="smooth"
                   dashness={connectMode ? { animation: true } : false}
                   labels={
                    connectMode ? (
                      <div 
                        onClick={(e) => handleRemoveConnection(e, conn.id)}
                        className="bg-white p-1 rounded-full shadow-sm border cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors pointer-events-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </div>
                    ) : undefined
                   }
                 />
              ))}
            </div>
          </div>
        )}
      </Xwrapper>

      {/* Raw Role Holders Table */}
      <Card className="bg-white border-none shadow-sm mt-8 relative">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>טבלת תפקידים</CardTitle>
            <CardDescription>לחץ על שורה כדי לערוך את בעל התפקיד והגדרת התפקיד שלו.</CardDescription>
          </div>
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            הוסף תפקיד חדש
          </button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap w-1/4">שם</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">תפקיד</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap w-10">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isAddingNew && (
                  <tr className="bg-blue-50/30 transition-colors">
                    <td className="p-2">
                      <input 
                        value={newRole.name} 
                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} 
                        autoFocus 
                        placeholder="שם העובד"
                        className="w-full p-2 border rounded text-sm text-right" 
                        dir="rtl" 
                      />
                    </td>
                    <td className="p-2">
                      <textarea 
                        value={newRole.role} 
                        onChange={(e) => setNewRole({ ...newRole, role: e.target.value })} 
                        placeholder="תפקיד / תחומי אחריות"
                        className="w-full p-2 border rounded text-sm text-right min-h-[60px]" 
                        dir="rtl" 
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCreateRole}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setIsAddingNew(false); setNewRole({ name: '', role: '' }); }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {roleHolders && roleHolders.length > 0 ? (
                  roleHolders.map((roleHolder) => (
                    <EditableRoleRow key={roleHolder.id} roleHolder={roleHolder} onDelete={handleDeleteRole} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      לא נמצאו תפקידים.
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
