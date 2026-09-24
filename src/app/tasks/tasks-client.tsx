/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import { Plus, Search, CheckCircle2, Circle, Clock, Check, Edit2, X, Trash2, LayoutGrid, LayoutList, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateBankOfTaskAction, createBankOfTaskAction, deleteBankOfTaskAction } from "../actions/bankOfTasks";
import { isValid, isBefore, startOfDay, format } from 'date-fns';
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/hooks/useConfirm";

type Task = {
  id: string;
  assignee: string | null;
  status: string | null;
  taskName: string | null;
  dueDate: string | null;
  itemIndex: number | null;
};

export default function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const confirm = useConfirm();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [isPending, startTransition] = useTransition();

  const filteredTasks = tasks.filter((task) =>
    (task.taskName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (task.assignee?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const formatDateForInput = (dateStr?: string | null) => {
    if (!dateStr) return "";
    let day, month, year;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) return dateStr;
      day = parts[0]; month = parts[1]; year = parts[2];
    } else if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      day = parts[0]; month = parts[1]; year = parts[2];
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      day = parts[0]; month = parts[1]; year = parts[2];
    } else {
      return "";
    }
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const formatDateForOutput = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    if (!day || !month || !year) return dateStr;
    return `${day}.${month}.${year}`;
  };

  
  const isOverdue = (dueDate?: string | null) => {
    if (!dueDate) return false;
    let day, month, year;
    if (dueDate.includes('-')) {
      const parts = dueDate.split('-');
      if (parts[0].length === 4) { year = parseInt(parts[0]); month = parseInt(parts[1]) - 1; day = parseInt(parts[2]); }
      else { day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]); }
    } else if (dueDate.includes('.')) {
      const parts = dueDate.split('.');
      day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
    } else if (dueDate.includes('/')) {
      const parts = dueDate.split('/');
      day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
    } else {
      const parsed = new Date(dueDate);
      if (isValid(parsed)) return isBefore(parsed, startOfDay(new Date()));
      return false;
    }
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (year < 100) year += 2000;
    const parsedDate = new Date(year, month, day);
    return isBefore(parsedDate, startOfDay(new Date()));
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "בוצע":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "בתהליך":
        return <Clock className="h-4 w-4 text-amber-400" />;
      case "לא התחיל":
      default:
        return <Circle className="h-4 w-4 text-slate-300" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "בוצע":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-400/50";
      case "בתהליך":
        return "bg-amber-500/20 text-amber-300 border-amber-400/50";
      case "לא התחיל":
      default:
        return "bg-white/10 text-slate-200 border-white/20";
    }
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditForm(task);
  };

  const cancelEditing = () => {
    if (editingId?.startsWith('temp-')) {
      setTasks(tasks.filter(t => t.id !== editingId));
    }
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (!editingId) return;
    
    startTransition(async () => {
      const currentEditForm = editForm;
      const currentEditingId = editingId;
      
      // Optimistic update
      setTasks(tasks.map(t => t.id === currentEditingId ? { ...t, ...currentEditForm } as Task : t));
      
      setEditingId(null);
      setEditForm({});

      if (currentEditingId.startsWith('temp-')) {
        const res = await createBankOfTaskAction(currentEditForm);
        if (res.success && res.task) {
          // Replace temp task with real task
          setTasks(prev => prev.map(t => t.id === currentEditingId ? res.task : t));
        } else {
          console.error("Failed to create");
          // Revert on fail
          setTasks(prev => prev.filter(t => t.id !== currentEditingId));
        }
      } else {
        const res = await updateBankOfTaskAction(currentEditingId, currentEditForm);
        if (!res.success) {
          console.error("Failed to save");
        }
      }
    });
  };

  const handleAddNew = () => {
    const tempId = `temp-${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      assignee: null,
      status: "לא התחיל",
      taskName: "",
      dueDate: null,
      itemIndex: tasks.length > 0 ? (tasks[tasks.length - 1].itemIndex || tasks.length) + 1 : 1
    };
    
    setTasks([...tasks, newTask]);
    setSearchQuery(""); // Clear search so they can see the new row at the bottom
    startEditing(newTask);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ title: 'מחיקת משימה', message: "האם אתה בטוח שברצונך למחוק משימה זו?", confirmText: 'מחק', variant: 'destructive' });
    if (!isConfirmed) return;
    
    startTransition(async () => {
      // Optimistic delete
      setTasks(tasks.filter(t => t.id !== id));
      const res = await deleteBankOfTaskAction(id);
      if (!res.success) {
        console.error("Failed to delete");
      }
    });
  };

  const handleMarkAsDone = (id: string, currentTask: Task) => {
    startTransition(async () => {
      // Optimistic update
      setTasks(tasks.map(t => t.id === id ? { ...t, status: "בוצע" } : t));
      await updateBankOfTaskAction(id, { ...currentTask, status: "בוצע" });
    });
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    startTransition(async () => {
      // Optimistic update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await updateBankOfTaskAction(taskId, { ...task, status: newStatus });
    });
  };

  const handleEditChange = (field: keyof Task, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const todoTasks = filteredTasks.filter(t => !t.status || t.status === 'לא התחיל');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'בתהליך');
  const doneTasks = filteredTasks.filter(t => t.status === 'בוצע');

  return (
    <div className="contents">
      <div className="col-span-1 lg:col-span-12 glass-panel rounded-3xl p-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="חיפוש משימות או אחראים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
            dir="rtl"
          />
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex bg-black/20 rounded-xl p-1 border border-white/10" dir="ltr">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg flex items-center transition-colors ${viewMode === 'kanban' ? 'bg-white/20 shadow-sm text-white' : 'text-slate-400 hover:text-white'}`}
              title="תצוגת לוח"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg flex items-center transition-colors ${viewMode === 'table' ? 'bg-white/20 shadow-sm text-white' : 'text-slate-400 hover:text-white'}`}
              title="תצוגת גיליון (אקסל)"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
          <button onClick={handleAddNew} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors hover-scale">
            <Plus className="h-4 w-4" />
            משימה חדשה
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <>
          {/* To Do Column */}
          <div 
            className="col-span-1 lg:col-span-4 glass-panel rounded-3xl p-6 flex flex-col gap-3 min-h-[400px]"
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => handleDrop(e, "לא התחיל")}
          >
            <div className="font-semibold text-lg flex items-center justify-between text-white mb-4">
              לא התחיל <Badge variant="secondary" className="bg-white/20 text-white border-none">{todoTasks.length}</Badge>
            </div>
            {todoTasks.map(task => (
              <div 
                key={task.id} 
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.setData('taskId', task.id); }}
                className={`${isOverdue(task.dueDate) ? 'bg-red-500/20 border-red-400 text-red-100' : 'bg-white/10 border-white/20 text-white'} p-4 rounded-xl shadow-sm border text-sm hover:border-white/40 cursor-pointer transition-all hover:shadow-md group`}
              >
                <div className="font-medium mb-1 text-white leading-snug">{task.taskName}</div>
                <div className="flex items-center justify-between text-xs text-slate-300 mt-4">
                  <div className="flex items-center gap-2">
                    {task.assignee && task.assignee !== 'Unassigned' ? (
                      <>
                        <div className="h-5 w-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">
                          {task.assignee.charAt(0)}
                        </div>
                        <span>{task.assignee}</span>
                      </>
                    ) : (
                      <span className="italic">לא הוקצה</span>
                    )}
                  </div>
                  {task.dueDate && <span className="opacity-70">{task.dueDate}</span>}
                </div>
                <div className="mt-3 flex justify-end transition-opacity gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleMarkAsDone(task.id, task); }} title="סמן כבוצע" className="p-1 text-emerald-400 hover:bg-white/10 rounded">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); startEditing(task); setViewMode('table'); }} title="ערוך" className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} title="מחק" className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* In Progress Column */}
          <div 
            className="col-span-1 lg:col-span-4 glass-panel rounded-3xl p-6 flex flex-col gap-3 min-h-[400px]"
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => handleDrop(e, "בתהליך")}
          >
            <div className="font-semibold text-lg flex items-center justify-between text-amber-400 mb-4">
              בתהליך <Badge variant="secondary" className="bg-amber-500/20 text-amber-200 border-none">{inProgressTasks.length}</Badge>
            </div>
            {inProgressTasks.map(task => (
              <div 
                key={task.id} 
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.setData('taskId', task.id); }}
                className={`${isOverdue(task.dueDate) ? 'bg-red-500/20 border-red-400 text-red-100' : 'bg-white/10 border-amber-400/30 text-white'} p-4 rounded-xl shadow-sm border text-sm hover:border-amber-400/50 cursor-pointer transition-all hover:shadow-md group`}
              >
                <div className="font-medium mb-1 text-white leading-snug">{task.taskName}</div>
                <div className="flex items-center justify-between text-xs text-slate-300 mt-4">
                  <div className="flex items-center gap-2">
                    {task.assignee && task.assignee !== 'Unassigned' ? (
                      <>
                        <div className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-200 flex items-center justify-center text-[10px] font-bold">
                          {task.assignee.charAt(0)}
                        </div>
                        <span>{task.assignee}</span>
                      </>
                    ) : (
                      <span className="italic">לא הוקצה</span>
                    )}
                  </div>
                  {task.dueDate && <span className="opacity-70">{task.dueDate}</span>}
                </div>
                <div className="mt-3 flex justify-end transition-opacity gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleMarkAsDone(task.id, task); }} title="סמן כבוצע" className="p-1 text-emerald-400 hover:bg-white/10 rounded">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); startEditing(task); setViewMode('table'); }} title="ערוך" className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} title="מחק" className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Done Column */}
          <div 
            className="col-span-1 lg:col-span-4 glass-panel rounded-3xl p-6 flex flex-col gap-3 min-h-[400px]"
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => handleDrop(e, "בוצע")}
          >
            <div className="font-semibold text-lg flex items-center justify-between text-emerald-400 mb-4">
              בוצע <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-200 border-none">{doneTasks.length}</Badge>
            </div>
            {doneTasks.map(task => (
              <div 
                key={task.id} 
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.setData('taskId', task.id); }}
                className="bg-black/20 p-4 rounded-xl shadow-sm border border-emerald-500/20 text-sm hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-md group opacity-80 hover:opacity-100"
              >
                <div className="font-medium mb-1 text-slate-400 line-through leading-snug">{task.taskName}</div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
                  <div className="flex items-center gap-2">
                    {task.assignee && task.assignee !== 'Unassigned' ? (
                      <>
                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                          {task.assignee.charAt(0)}
                        </div>
                        <span>{task.assignee}</span>
                      </>
                    ) : (
                      <span className="italic">לא הוקצה</span>
                    )}
                  </div>
                  {task.dueDate && <span className="opacity-70">{task.dueDate}</span>}
                </div>
                <div className="mt-3 flex justify-end transition-opacity gap-1">
                  <button onClick={(e) => { e.stopPropagation(); startEditing(task); setViewMode('table'); }} title="ערוך" className="p-1 text-slate-500 hover:text-white hover:bg-white/10 rounded">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} title="מחק" className="p-1 text-slate-500 hover:text-rose-400 hover:bg-white/10 rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
        ) : (
        <div className="col-span-1 lg:col-span-12 glass-panel rounded-3xl p-6 overflow-x-auto">
          <table className="w-full text-center text-white" dir="rtl">
            <thead className="hidden md:table-header-group">
              <tr className="border-b border-white/20 bg-white/5">
                <th className="px-6 py-4 text-sm font-medium text-slate-300 w-16">#</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-300">משימה</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-300 w-48">אחראי</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-300 w-40">סטטוס ביצוע</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-300 w-40">תאריך</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-300 w-24">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    לא נמצאו משימות.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, idx) => {
                  const isEditing = editingId === task.id;
                  
                  return (
                    <tr key={task.id} className={`hover:bg-white/5 transition-colors group flex flex-col md:table-row border-b border-white/10 md:border-none p-4 md:p-0 gap-2 md:gap-0 bg-transparent rounded-lg md:rounded-none shadow-sm md:shadow-none mb-4 md:mb-0 ${task.status !== 'בוצע' && isOverdue(task.dueDate) ? 'bg-red-500/10' : ''}`}>
                      <td className="px-2 py-1 md:px-6 md:py-4 text-sm text-slate-300 flex justify-between items-center md:table-cell">
                        <span className="md:hidden font-medium text-slate-400 text-sm">#</span>
                        {task.itemIndex || idx + 1}
                      </td>
                      <td className="px-2 py-1 md:px-6 md:py-4 flex justify-between items-center md:table-cell">
                        <span className="md:hidden font-medium text-sm text-slate-400">משימה</span>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editForm.taskName || ""}
                            onChange={(e) => handleEditChange("taskName", e.target.value)}
                            className="w-full p-2 border border-white/20 rounded-md text-sm bg-black/20 text-white text-center focus:outline-none focus:border-white/40"
                          />
                        ) : (
                          <span className="font-medium text-white">{task.taskName}</span>
                        )}
                      </td>
                      <td className="px-2 py-1 md:px-6 md:py-4 flex justify-between items-center md:table-cell">
                        <span className="md:hidden font-medium text-sm text-slate-400">אחראי</span>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editForm.assignee || ""}
                            onChange={(e) => handleEditChange("assignee", e.target.value)}
                            className="w-full p-2 border border-white/20 rounded-md text-sm bg-black/20 text-white text-center focus:outline-none focus:border-white/40"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            {task.assignee && task.assignee !== 'Unassigned' ? (
                              <>
                                <div className="h-6 w-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">
                                  {task.assignee.charAt(0)}
                                </div>
                                <span className="text-sm text-slate-300">{task.assignee}</span>
                              </>
                            ) : (
                              <span className="text-sm text-slate-400 italic">לא הוקצה</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1 md:px-6 md:py-4 flex justify-between items-center md:table-cell">
                        <span className="md:hidden font-medium text-sm text-slate-400">סטטוס ביצוע</span>
                        {isEditing ? (
                          <Select 
                            value={editForm.status || "לא התחיל"}
                            onValueChange={(value) => handleEditChange("status", value)}
                          >
                            <SelectTrigger className="w-full p-2 border border-white/20 rounded-md text-sm bg-black/20 text-white text-center focus:outline-none focus:border-white/40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="center" className="bg-slate-900 border-white/20 text-white">
                              <SelectItem value="בוצע">בוצע</SelectItem>
                              <SelectItem value="בתהליך">בתהליך</SelectItem>
                              <SelectItem value="לא התחיל">לא התחיל</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusBadge(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {task.status || "לא התחיל"}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1 md:px-6 md:py-4 flex justify-between items-center md:table-cell">
                        <span className="md:hidden font-medium text-sm text-slate-400">תאריך</span>
                        {isEditing ? (
                          <Popover>
                            <PopoverTrigger
                              className={cn(
                                "w-full flex justify-between items-center p-2 border border-white/20 rounded-md text-sm bg-black/20 text-right focus:outline-none focus:border-white/40",
                                !editForm.dueDate && "text-slate-400"
                              )}
                            >
                              {editForm.dueDate ? editForm.dueDate : <span>בחר תאריך</span>}
                              <CalendarIcon className="h-4 w-4 mr-2 opacity-50" />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-slate-900 border-white/20 text-white" align="start" dir="rtl">
                              <Calendar
                                mode="single"
                                selected={
                                  editForm.dueDate
                                    ? (() => {
                                        const [day, month, year] = editForm.dueDate.split(/[\.\-\/]/);
                                        const parsed = new Date(parseInt(year.length === 2 ? `20${year}` : year), parseInt(month) - 1, parseInt(day));
                                        return isValid(parsed) ? parsed : undefined;
                                      })()
                                    : undefined
                                }
                                onSelect={(date) => {
                                  handleEditChange("dueDate", date ? format(date, "dd.MM.yyyy") : null);
                                }}
                                locale={he}
                                className="bg-slate-900 text-white"
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-sm text-slate-300">{task.dueDate || "-"}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 mt-2 md:mt-0 md:px-6 md:py-4 flex justify-center items-center md:table-cell border-t border-white/10 md:border-none">
                        <div className="flex items-center justify-center gap-2 transition-opacity">
                          {isEditing ? (
                            <>
                              <button onClick={saveEditing} className="p-1.5 text-emerald-400 hover:bg-white/10 rounded-md hover-scale">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={cancelEditing} className="p-1.5 text-rose-400 hover:bg-white/10 rounded-md hover-scale">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {task.status !== "בוצע" && (
                                <button onClick={() => handleMarkAsDone(task.id, task)} title="סמן כבוצע" className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-white/10 rounded-md hover-scale bg-white/5 md:bg-transparent">
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              )}
                              <button onClick={() => startEditing(task)} title="ערוך" className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md hover-scale bg-white/5 md:bg-transparent">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(task.id)} title="מחק" className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-white/10 rounded-md hover-scale bg-white/5 md:bg-transparent">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
    </div>
  );
}
