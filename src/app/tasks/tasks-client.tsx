"use client";

import { useState, useTransition } from "react";
import { Plus, Search, CheckCircle2, Circle, Clock, Check, Edit2, X, Trash2 } from "lucide-react";
import { updateBankOfTaskAction, createBankOfTaskAction, deleteBankOfTaskAction } from "../actions/bankOfTasks";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [isPending, startTransition] = useTransition();

  const filteredTasks = tasks.filter((task) =>
    (task.taskName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (task.assignee?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-sm">
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
        
        <button onClick={handleAddNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          משימה חדשה
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
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
                    <tr key={task.id} className="hover:bg-muted/30 transition-colors group">
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
                              <button onClick={saveEditing} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={cancelEditing} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {task.status !== "בוצע" && (
                                <button onClick={() => handleMarkAsDone(task.id, task)} title="סמן כבוצע" className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors">
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              )}
                              <button onClick={() => startEditing(task)} title="ערוך" className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(task.id)} title="מחק" className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
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
      </div>
    </div>
  );
}
