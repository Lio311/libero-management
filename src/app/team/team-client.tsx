/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Cable, Trash2, Edit2, Check, X, Plus } from "lucide-react";
import Xarrow, { Xwrapper, useXarrow } from "react-xarrows";
import { updateRoleHolder, addTeamTaskConnection, removeTeamTaskConnection, createRoleHolder, deleteRoleHolder, createTeamTask, updateTeamTask, deleteTeamTask } from "@/app/actions/team";
import { useRouter } from "next/navigation";

interface TeamClientProps {
  roleHolders: any[];
  groupedTasks: Record<string, { id: string, description: string }[]>;
  connections: any[];
}

function EmployeeCard({ 
  roleHolder, 
  tasks, 
  connectMode, 
  selectedTask, 
  handleTaskClick, 
  onDelete,
  onUpdate,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete
}: {
  roleHolder: any;
  tasks: { id: string, description: string }[];
  connectMode: boolean;
  selectedTask: string | null;
  handleTaskClick: (taskId: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => void;
  onTaskCreate: (assignee: string, description: string) => void;
  onTaskUpdate: (id: string, description: string) => void;
  onTaskDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: roleHolder.name || '', role: roleHolder.role || '' });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEditValue, setTaskEditValue] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskValue, setNewTaskValue] = useState('');

  const handleSave = async () => {
    await onUpdate(roleHolder.id, formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({ name: roleHolder.name || '', role: roleHolder.role || '' });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col h-full group">
      <div className="flex flex-col h-full relative">
      {isEditing ? (
        <div className="mb-6 space-y-3 relative z-30">
          <input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            className="w-full p-2 border rounded font-semibold bg-blue-50/50" 
            placeholder="שם עובד"
            autoFocus
          />
          <textarea 
            value={formData.role} 
            onChange={e => setFormData({...formData, role: e.target.value})} 
            className="w-full p-2 border rounded text-sm min-h-[60px] bg-blue-50/50" 
            placeholder="תפקיד / תחומי אחריות"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={handleSave} className="text-green-600 p-1.5 bg-green-50 rounded hover:bg-green-100"><Check className="w-4 h-4"/></button>
            <button onClick={handleCancel} className="text-red-600 p-1.5 bg-red-50 rounded hover:bg-red-100"><X className="w-4 h-4"/></button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col mb-6 relative z-30">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                {roleHolder.name ? roleHolder.name.charAt(0) : '?'}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{roleHolder.name}</h2>
            </div>
            {!roleHolder.isTemp && (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="ערוך"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { if(confirm('האם למחוק איש צוות?')) onDelete(roleHolder.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="מחק"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          {roleHolder.role && (
            <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap hidden">{roleHolder.role}</p>
          )}
        </div>
      )}
      <ul className="grid grid-cols-2 gap-3 flex-1 relative">
        {tasks.map((task) => {
          const isSelected = selectedTask === task.id;
          const isEditingTask = editingTaskId === task.id;
          return (
            <li 
              key={task.id} 
              id={`task-${task.id}`}
              onClick={() => handleTaskClick(task.id)}
              className={`flex items-start gap-2 p-3 rounded-lg relative group/task ${
                connectMode ? 'cursor-pointer' : ''
              }`}
            >
              {/* Background layer */}
              <div className={`absolute inset-0 rounded-lg z-0 ${
                connectMode ? 'group-hover/task:bg-blue-50 border border-transparent group-hover/task:border-blue-200' : ''
              } ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50'
              }`} />

              {isEditingTask ? (
                <div className="flex flex-col gap-2 w-full z-20 relative">
                   <textarea 
                     value={taskEditValue} 
                     onChange={e => setTaskEditValue(e.target.value)} 
                     className="w-full p-2 border rounded text-sm min-h-[40px]"
                     autoFocus
                   />
                   <div className="flex gap-2 justify-end">
                     <button onClick={(e) => { e.stopPropagation(); onTaskUpdate(task.id, taskEditValue); setEditingTaskId(null); }} className="text-green-600 p-1 bg-green-50 rounded"><Check className="w-4 h-4"/></button>
                     <button onClick={(e) => { e.stopPropagation(); setEditingTaskId(null); }} className="text-red-600 p-1 bg-red-50 rounded"><X className="w-4 h-4"/></button>
                   </div>
                </div>
              ) : (
                <>
                  <div id={`task-icon-${task.id}`} className="flex-shrink-0 mt-0.5 relative z-20 rounded-full bg-white">
                    <CheckCircle2 className={`w-4 h-4 ${connectMode ? 'text-blue-400' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-sm text-gray-700 leading-relaxed relative z-20 font-medium px-1 rounded ${
                    connectMode ? 'group-hover/task:bg-blue-50' : ''
                  } ${
                    isSelected ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>{task.description}</span>
                  
                  {!connectMode && (
                    <div className="absolute left-2 top-2 z-30 flex gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setTaskEditValue(task.description); setEditingTaskId(task.id); }} className="p-1 text-blue-600 hover:bg-blue-100 rounded bg-white/80" title="ערוך משימה"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); if(confirm('האם למחוק משימה זו?')) onTaskDelete(task.id); }} className="p-1 text-red-600 hover:bg-red-100 rounded bg-white/80" title="מחק משימה"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      
      {!roleHolder.isTemp && (
        <div className="mt-4 relative z-30">
          {isAddingTask ? (
             <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
               <textarea 
                 value={newTaskValue} 
                 onChange={e => setNewTaskValue(e.target.value)} 
                 className="w-full p-2 border rounded text-sm min-h-[40px] bg-white"
                 placeholder="תיאור משימה חדשה..."
                 autoFocus
               />
               <div className="flex gap-2 justify-end">
                 <button onClick={() => { if(newTaskValue) { onTaskCreate(roleHolder.name, newTaskValue); setIsAddingTask(false); setNewTaskValue(''); } }} className="text-green-600 p-1 bg-green-50 rounded"><Check className="w-4 h-4"/></button>
                 <button onClick={() => { setIsAddingTask(false); setNewTaskValue(''); }} className="text-red-600 p-1 bg-red-50 rounded"><X className="w-4 h-4"/></button>
               </div>
             </div>
          ) : (
             <button onClick={() => setIsAddingTask(true)} className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full py-2 rounded-lg font-medium transition-colors">
               <Plus className="w-4 h-4" /> הוסף משימה
             </button>
          )}
        </div>
      )}
      </div>
    </div>
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
    await deleteRoleHolder(id);
    router.refresh();
  };

  const handleUpdateRole = async (id: string, data: { name: string, role: string }) => {
    await updateRoleHolder(id, data);
    router.refresh();
  };

  const handleCreateTask = async (assignee: string, description: string) => {
    await createTeamTask({ assignee, taskDescription: description });
    router.refresh();
  };

  const handleUpdateTask = async (id: string, description: string) => {
    await updateTeamTask(id, { taskDescription: description });
    router.refresh();
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTeamTask(id);
    router.refresh();
  };

  if (!mounted) return null;

  const normalizedGroupedTasks: Record<string, { id: string, description: string }[]> = {};
  const originalNameMap: Record<string, string> = {};

  for (const [key, tasks] of Object.entries(groupedTasks)) {
    const normKey = key.trim().toLowerCase();
    if (!normalizedGroupedTasks[normKey]) {
      normalizedGroupedTasks[normKey] = [];
      originalNameMap[normKey] = key.trim();
    }
    normalizedGroupedTasks[normKey].push(...tasks);
  }

  const normalizedRoleHolders: any[] = [];
  const seenNames = new Set<string>();

  for (const r of roleHolders) {
    const normName = (r.name || '').trim().toLowerCase();
    if (!seenNames.has(normName)) {
      seenNames.add(normName);
      normalizedRoleHolders.push({ ...r, name: r.name?.trim() || '' });
    }
  }

  const assigneesWithoutRole = Object.keys(normalizedGroupedTasks).filter(normName => !seenNames.has(normName));

  const allCards = [
    ...normalizedRoleHolders,
    ...assigneesWithoutRole.map(normName => ({ id: `temp-${normName}`, name: originalNameMap[normName], role: '', isTemp: true }))
  ];

  // Map task IDs to assignee normalized names
  const taskIdToAssignee: Record<string, string> = {};
  for (const [assignee, tasks] of Object.entries(normalizedGroupedTasks)) {
    for (const task of tasks) {
      taskIdToAssignee[task.id] = assignee;
    }
  }

  // Calculate connection weights between assignees
  const connectivity: Record<string, Record<string, number>> = {};
  for (const card of allCards) {
    const normName = (card.name || '').trim().toLowerCase();
    connectivity[normName] = {};
  }
  
  for (const conn of connections) {
    const sourceAssignee = taskIdToAssignee[conn.sourceTaskId];
    const targetAssignee = taskIdToAssignee[conn.targetTaskId];
    
    if (sourceAssignee && targetAssignee && sourceAssignee !== targetAssignee) {
      connectivity[sourceAssignee][targetAssignee] = (connectivity[sourceAssignee][targetAssignee] || 0) + 1;
      connectivity[targetAssignee][sourceAssignee] = (connectivity[targetAssignee][sourceAssignee] || 0) + 1;
    }
  }

  // Greedy sorting to keep connected assignees together
  const sortedCards = [];
  const unplaced = new Set(allCards);
  
  if (allCards.length > 0) {
    // Start with the one that has the most total connections
    let currentCard = [...unplaced].sort((a, b) => {
      const aName = (a.name || '').trim().toLowerCase();
      const bName = (b.name || '').trim().toLowerCase();
      const aTotal = Object.values(connectivity[aName] || {}).reduce((sum, val) => sum + val, 0);
      const bTotal = Object.values(connectivity[bName] || {}).reduce((sum, val) => sum + val, 0);
      return bTotal - aTotal; // descending
    })[0];
    
    sortedCards.push(currentCard);
    unplaced.delete(currentCard);
    
    while (unplaced.size > 0) {
      const currentName = (currentCard.name || '').trim().toLowerCase();
      
      // Find the unplaced card with the most connections to currentCard
      let nextCard: any = null;
      let maxConns = -1;
      
      for (const card of unplaced) {
        const name = (card.name || '').trim().toLowerCase();
        const conns = (connectivity[currentName] && connectivity[currentName][name]) || 0;
        
        if (conns > maxConns) {
          maxConns = conns;
          nextCard = card;
        }
      }
      
      currentCard = nextCard!;
      sortedCards.push(currentCard);
      unplaced.delete(currentCard);
    }
  }

  // Swap ישראל and רותי if they both exist
  const israelIndex = sortedCards.findIndex(c => (c.name || '').trim() === 'ישראל');
  const rutiIndex = sortedCards.findIndex(c => (c.name || '').trim() === 'רותי');
  
  if (israelIndex !== -1 && rutiIndex !== -1) {
    const temp = sortedCards[israelIndex];
    sortedCards[israelIndex] = sortedCards[rutiIndex];
    sortedCards[rutiIndex] = temp;
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">בעלי תפקידים וצוות</h1>
        <p className="text-muted-foreground mt-2">צפייה בתחומי האחריות ומשימות של חברי הצוות.</p>
      </div>

      <Xwrapper>
        {allCards.length === 0 && !isAddingNew ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground shadow-sm">
            <p>אין נתונים על בעלי תפקידים.</p>
            <button
                onClick={() => setIsAddingNew(true)}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                הוסף תפקיד ראשון
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
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
              
              {!isAddingNew && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full md:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  הוסף תפקיד חדש
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
              {sortedCards.map(roleHolder => {
                const normName = (roleHolder.name || '').trim().toLowerCase();
                return (
                  <EmployeeCard
                    key={roleHolder.id}
                    roleHolder={roleHolder}
                    tasks={normalizedGroupedTasks[normName] || []}
                    connectMode={connectMode}
                    selectedTask={selectedTask}
                    handleTaskClick={handleTaskClick}
                    onDelete={handleDeleteRole}
                    onUpdate={handleUpdateRole}
                    onTaskCreate={handleCreateTask}
                    onTaskUpdate={handleUpdateTask}
                    onTaskDelete={handleDeleteTask}
                  />
                );
              })}

              {isAddingNew && (
                <div className="bg-white rounded-xl border-2 border-dashed border-blue-300 shadow-sm p-6 flex flex-col h-full bg-blue-50/20">
                  <div className="mb-6 space-y-3 relative z-30">
                    <input 
                      value={newRole.name} 
                      onChange={e => setNewRole({...newRole, name: e.target.value})} 
                      className="w-full p-2 border rounded font-semibold bg-white" 
                      placeholder="שם עובד"
                      autoFocus
                    />
                    <textarea 
                      value={newRole.role} 
                      onChange={e => setNewRole({...newRole, role: e.target.value})} 
                      className="w-full p-2 border rounded text-sm min-h-[60px] bg-white" 
                      placeholder="תפקיד / תחומי אחריות"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={handleCreateRole} className="text-green-600 p-2 bg-green-50 rounded hover:bg-green-100"><Check className="w-5 h-5"/></button>
                      <button onClick={() => { setIsAddingNew(false); setNewRole({name:'', role:''}); }} className="text-red-600 p-2 bg-red-50 rounded hover:bg-red-100"><X className="w-5 h-5"/></button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Render arrows - hidden on mobile via hidden md:block */}
              <div className="hidden md:block absolute inset-0 z-10 pointer-events-none">
                {connections
                  .filter((conn, index, self) => 
                    index === self.findIndex(c => 
                      c.sourceTaskId === conn.sourceTaskId && c.targetTaskId === conn.targetTaskId
                    )
                  )
                  .map(conn => (
                    <Xarrow 
                      key={conn.id} 
                      start={`task-icon-${conn.sourceTaskId}`} 
                      end={`task-icon-${conn.targetTaskId}`} 
                      color="#94a3b8"
                      strokeWidth={2}
                      path="smooth"
                      dashness={connectMode ? { animation: true } : true}
                      startAnchor="auto"
                      endAnchor="auto"
                      zIndex={10}
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
          </div>
        )}
      </Xwrapper>
    </div>
  );
}
