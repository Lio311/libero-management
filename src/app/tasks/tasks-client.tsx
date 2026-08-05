"use client";

import { useState, useTransition } from "react";
import { Plus, Search, CheckCircle2, Circle, Clock, Check, Edit2, X, Trash2, LayoutGrid, LayoutList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateBankOfTaskAction, createBankOfTaskAction, deleteBankOfTaskAction } from "../actions/bankOfTasks";
import { isValid, isBefore, startOfDay } from 'date-fns';

type Task = {
  id: string;
  assignee: string | null;
  status: string | null;
  taskName: string | null;
  dueDate: string | null;
  itemIndex: number | null;
};

export default function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
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
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "בתהליך":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "לא התחיל":
      default:
        return <Circle className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "בוצע":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "בתהליך":
        return "bg-amber-500/10 text-amber-600 border-amber-200";
      case "לא התחיל":
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
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

  const handleDelete = (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק משימה זו?")) return;
    
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

  const handleEditChange = (field: keyof Task, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const todoTasks = filteredTasks.filter(t => !t.status || t.status === 'לא התחיל');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'בתהליך');
  const doneTasks = filteredTasks.filter(t => t.status === 'בוצע');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center glass-panel p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="חיפוש משימות או אחראים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            dir="rtl"
          />
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex bg-muted/50 rounded-lg p-1" dir="ltr">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md flex items-center transition-colors ${viewMode === 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="תצוגת לוח"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md flex items-center transition-colors ${viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="תצוגת גיליון (אקסל)"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
          <button onClick={handleAddNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors hover-scale">
            <Plus className="h-4 w-4" />
            משימה חדשה
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl shadow-sm overflow-hidden">
        {viewMode === 'kanban' ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[400px]">
            {/* To Do Column */}
            <div className="bg-slate-50/50 p-4 rounded-xl flex flex-col gap-3">
              <div className="font-semibold text-sm flex items-center justify-between text-slate-600 mb-2">
                לא התחיל <Badge variant="secondary" className="bg-slate-200/50 text-slate-700">{todoTasks.length}</Badge>
              </div>
              {todoTasks.map(task => (
                <div key={task.id} className={`${isOverdue(task.dueDate) ? 'bg-red-50/50 border-red-200 text-red-900' : 'bg-background border-border/50 text-foreground'} p-4 rounded-xl shadow-sm border border-border/50 text-sm hover:border-primary/50 cursor-pointer transition-all hover:shadow-md group`}>
                  <div className="font-medium mb-1 text-foreground leading-snug">{task.taskName}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                    <div className="flex items-center gap-2">
                      {task.assignee && task.assignee !== 'Unassigned' ? (
                        <>
                          <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
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
                  <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleMarkAsDone(task.id, task); }} title="סמן כבוצע" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); startEditing(task); setViewMode('table'); }} title="ערוך" className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* In Progress Column */}
            <div className="bg-amber-50/30 p-4 rounded-xl flex flex-col gap-3">
              <div className="font-semibold text-sm flex items-center justify-between text-amber-600 mb-2">
                בתהליך <Badge variant="secondary" className="bg-amber-100/50 text-amber-700">{inProgressTasks.length}</Badge>
              </div>
              {inProgressTasks.map(task => (
                <div key={task.id} className={`${isOverdue(task.dueDate) ? 'bg-red-50/50 border-red-200 text-red-900' : 'bg-background border-amber-100 text-foreground'} p-4 rounded-xl shadow-sm border border-amber-100 text-sm hover:border-amber-300 cursor-pointer transition-all hover:shadow-md group`}>
                  <div className="font-medium mb-1 text-foreground leading-snug">{task.taskName}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                    <div className="flex items-center gap-2">
                      {task.assignee && task.assignee !== 'Unassigned' ? (
                        <>
                          <div className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-[10px] font-bold">
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
                  <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleMarkAsDone(task.id, task); }} title="סמן כבוצע" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); startEditing(task); setViewMode('table'); }} title="ערוך" className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Done Column */}
            <div className="bg-emerald-50/30 p-4 rounded-xl flex flex-col gap-3">
              <div className="font-semibold text-sm flex items-center justify-between text-emerald-600 mb-2">
                בוצע <Badge variant="secondary" className="bg-emerald-100/50 text-emerald-700">{doneTasks.length}</Badge>
              </div>
              {doneTasks.map(task => (
                <div key={task.id} className="bg-background p-4 rounded-xl shadow-sm border border-emerald-100 text-sm hover:border-emerald-300 cursor-pointer transition-all hover:shadow-md group opacity-80 hover:opacity-100">
                  <div className="font-medium mb-1 text-muted-foreground line-through leading-snug">{task.taskName}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                    <div className="flex items-center gap-2">
                      {task.assignee && task.assignee !== 'Unassigned' ? (
                        <>
                          <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
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
                  <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button onClick={(e) => { e.stopPropagation(); startEditing(task); setViewMode('table'); }} title="ערוך" className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right" dir="rtl">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground w-16">#</th>
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground">משימה</th>
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground w-48">אחראי</th>
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground w-40">סטטוס ביצוע</th>
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground w-40">תאריך</th>
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground w-24">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    לא נמצאו משימות.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, idx) => {
                  const isEditing = editingId === task.id;
                  
                  return (
                    <tr key={task.id} className={`hover:bg-muted/30 transition-colors group ${task.status !== 'בוצע' && isOverdue(task.dueDate) ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {task.itemIndex || idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editForm.taskName || ""}
                            onChange={(e) => handleEditChange("taskName", e.target.value)}
                            className="w-full p-2 border border-border rounded-md text-sm bg-background"
                          />
                        ) : (
                          <span className="font-medium text-foreground">{task.taskName}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editForm.assignee || ""}
                            onChange={(e) => handleEditChange("assignee", e.target.value)}
                            className="w-full p-2 border border-border rounded-md text-sm bg-background"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            {task.assignee && task.assignee !== 'Unassigned' ? (
                              <>
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                  {task.assignee.charAt(0)}
                                </div>
                                <span className="text-sm text-muted-foreground">{task.assignee}</span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">לא הוקצה</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <select 
                            value={editForm.status || "לא התחיל"}
                            onChange={(e) => handleEditChange("status", e.target.value)}
                            className="w-full p-2 border border-border rounded-md text-sm bg-background"
                          >
                            <option value="בוצע">בוצע</option>
                            <option value="בתהליך">בתהליך</option>
                            <option value="לא התחיל">לא התחיל</option>
                          </select>
                        ) : (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusBadge(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {task.status || "לא התחיל"}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editForm.dueDate || ""}
                            onChange={(e) => handleEditChange("dueDate", e.target.value)}
                            className="w-full p-2 border border-border rounded-md text-sm bg-background"
                            placeholder="DD.MM.YYYY"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{task.dueDate || "-"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          {isEditing ? (
                            <>
                              <button onClick={saveEditing} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md hover-scale">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={cancelEditing} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md hover-scale">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {task.status !== "בוצע" && (
                                <button onClick={() => handleMarkAsDone(task.id, task)} title="סמן כבוצע" className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md hover-scale">
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              )}
                              <button onClick={() => startEditing(task)} title="ערוך" className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md hover-scale">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(task.id)} title="מחק" className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-md hover-scale">
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
        </div>
        )}
      </div>
    </div>
  );
}
