'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Bell, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, isBefore, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { updateMonthlyScheduleDay } from '@/app/actions/monthlySchedule';

// Temporary mock data interface
interface Task {
  id: string;
  dbId?: string;
  title: string;
  category: { name: string; color: string };
  isCompleted: boolean;
}

interface CalendarClientProps {
  scheduleData: any[];
}

export default function CalendarPage({ scheduleData }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  usePushNotifications(); // This triggers the prompt on load

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const [localTasks, setLocalTasks] = useState<Record<string, Task[]>>({});
  
  // Modal states
  const [newTaskDate, setNewTaskDate] = useState<Date | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState<{ dateKey: string, task: Task } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasShownPush, setHasShownPush] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Compute active notifications
  const activeNotifications = useMemo(() => {
    const today = startOfDay(new Date());
    const notifications: { dateKey: string; task: Task }[] = [];
    
    Object.keys(localTasks).forEach(dateKey => {
      const date = new Date(dateKey);
      if (isBefore(date, today) || isToday(date)) {
        localTasks[dateKey].forEach(task => {
          if (!task.isCompleted) {
            notifications.push({ dateKey, task });
          }
        });
      }
    });
    
    return notifications.sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());
  }, [localTasks]);

  // Handle push notification
  useEffect(() => {
    if (activeNotifications.length > 0 && !hasShownPush && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('משימות לביצוע', {
          body: `יש לך ${activeNotifications.length} משימות לביצוע שלא הושלמו.`,
        });
        setHasShownPush(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('משימות לביצוע', {
              body: `יש לך ${activeNotifications.length} משימות לביצוע שלא הושלמו.`,
            });
            setHasShownPush(true);
          }
        });
      }
    }
  }, [activeNotifications, hasShownPush]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load monthlySchedule for the currently viewed month
  useEffect(() => {
    if (!scheduleData || scheduleData.length === 0) return;
    
    setLocalTasks(prev => {
      const newTasks = { ...prev };
      let hasChanges = false;
      
      scheduleData.forEach((task, idx) => {
        // Skip tasks that are just numbers (these are likely date headers imported from Excel by mistake)
        if (task.task && /^\d+$/.test(task.task.trim())) {
          return;
        }

        // The database field 'weekNumber' actually contains the day of the month
        const dayOfMonth = task.weekNumber || 1;
        const taskDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOfMonth);
        const dateKey = format(taskDate, 'yyyy-MM-dd');
        
        if (!newTasks[dateKey]) {
          newTasks[dateKey] = [];
        }
        
        // Ensure we don't add duplicates if it already exists for this specific day
        const taskId = `task-${idx}-${dateKey}`;
        const exists = newTasks[dateKey].some(t => (task.id && t.dbId === task.id) || t.id === taskId);
        
        if (!exists) {
          newTasks[dateKey].push({
            id: taskId,
            dbId: task.id,
            title: task.task,
            category: { name: 'Monthly Task', color: 'bg-blue-400' },
            isCompleted: false
          });
          hasChanges = true;
        }
      });
      
      return hasChanges ? newTasks : prev;
    });
  }, [currentDate, scheduleData]);

  const toggleTask = (dateKey: string, taskId: string) => {
    setLocalTasks(prev => {
      const newTasks = { ...prev };
      if (newTasks[dateKey]) {
        newTasks[dateKey] = newTasks[dateKey].map(t => 
          t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
        );
      }
      return newTasks;
    });
  };

  const handleDayClick = (day: Date) => {
    setNewTaskDate(day);
    setNewTaskTitle('');
  };

  const saveNewTask = () => {
    if (!newTaskDate || !newTaskTitle.trim()) return;
    const dateKey = format(newTaskDate, 'yyyy-MM-dd');
    setLocalTasks(prev => {
      const newTasks = { ...prev };
      if (!newTasks[dateKey]) newTasks[dateKey] = [];
      newTasks[dateKey] = [
        ...newTasks[dateKey],
        {
          id: `task-${Date.now()}`,
          title: newTaskTitle,
          category: { name: 'Manual Task', color: 'bg-green-400' },
          isCompleted: false
        }
      ];
      return newTasks;
    });
    setNewTaskDate(null);
  };

  const deleteTask = (dateKey: string, taskId: string) => {
    setLocalTasks(prev => {
      const newTasks = { ...prev };
      if (newTasks[dateKey]) {
        newTasks[dateKey] = newTasks[dateKey].filter(t => t.id !== taskId);
      }
      return newTasks;
    });
    setSelectedTask(null);
  };

  // Calendar events (mock arrival for now, inventory items don't have arrivalDate)
  // But we can add them to localTasks if needed. For now we just use the monthly schedule.

  return (
    <div dir="rtl" className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] selection:bg-[#0071E3]/30 font-sans pb-20 md:pb-0 page-animate">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center border border-white/40 shadow-sm">
            <CalendarIcon className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-wide">בנק משימות</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">ניהול שוטף</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full hover:bg-white/50 flex items-center justify-center transition-colors relative hover-scale"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {activeNotifications.length > 0 && (
                <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#F5F5F7]"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-12 left-0 w-80 bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl overflow-hidden z-50 origin-top-left"
                >
                  <div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-white/50">
                    <h3 className="font-medium text-gray-900">התראות</h3>
                    {activeNotifications.length > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                        {activeNotifications.length} משימות
                      </span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {activeNotifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                        <p>הכל מעודכן! אין משימות לביצוע.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50/50">
                        {activeNotifications.map(({ dateKey, task }) => (
                          <div 
                            key={task.id} 
                            className="p-4 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                            onClick={() => {
                              setSelectedTask({ dateKey, task });
                              setShowNotifications(false);
                            }}
                          >
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                                <Bell className="w-4 h-4 text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0 text-right">
                                <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                                <p className="text-xs text-gray-500 mt-1">מתוכנן לתאריך: {format(new Date(dateKey), 'd בMMM', { locale: he })}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => setNewTaskDate(new Date())} className="bg-[#0071E3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 hover-scale shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">משימה חדשה</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <h2 className="text-3xl md:text-5xl font-light flex gap-3 items-baseline text-gray-900">
            {format(currentDate, 'MMMM', { locale: he })} <span className="text-gray-400 font-serif italic text-2xl md:text-4xl">{format(currentDate, 'yyyy')}</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={nextMonth} className="p-2 md:p-3 rounded-full hover:bg-white/50 transition-colors border border-white/40 bg-white/50 shadow-sm hover-scale" title="החודש הבא">
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            </button>
            <button onClick={prevMonth} className="p-2 md:p-3 rounded-full hover:bg-white/50 transition-colors border border-white/40 bg-white/50 shadow-sm hover-scale" title="החודש הקודם">
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="glass-panel rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-white/40">
          {/* Days of week */}
          <div className="grid grid-cols-7 border-b border-gray-200/50 bg-white/30">
            {weekDays.map(day => (
              <div key={day} className="py-4 text-center text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, dayIdx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayTasks = localTasks[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);

              return (
                <div 
                  key={day.toString()} 
                  onClick={() => handleDayClick(day)}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const taskId = e.dataTransfer.getData('taskId');
                    const sourceDateKey = e.dataTransfer.getData('sourceDateKey');
                    if (!taskId || !sourceDateKey || sourceDateKey === dateKey) return;
                    
                    const sourceTasks = localTasks[sourceDateKey] || [];
                    const taskToMove = sourceTasks.find(t => t.id === taskId);
                    if (!taskToMove) return;

                    setLocalTasks(prev => {
                      const newTasks = { ...prev };
                      newTasks[sourceDateKey] = newTasks[sourceDateKey].filter(t => t.id !== taskId);
                      if (!newTasks[dateKey]) newTasks[dateKey] = [];
                      newTasks[dateKey] = [...newTasks[dateKey], taskToMove];
                      return newTasks;
                    });

                    if (taskToMove.dbId) {
                      const newDay = day.getDate();
                      await updateMonthlyScheduleDay(taskToMove.dbId, newDay);
                    }
                  }}
                  className={`min-h-[120px] md:min-h-[160px] p-2 md:p-3 border-l border-b border-gray-200/30 relative group transition-colors hover:bg-white/40 cursor-pointer
                    ${!isCurrentMonth ? 'bg-transparent opacity-60' : 'bg-transparent'}
                    ${dayIdx % 7 === 6 ? 'border-l-0' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm md:text-base font-medium flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full
                      ${isTodayDate ? 'bg-[#0071E3] text-white shadow-md' : (isCurrentMonth ? 'text-gray-900' : 'text-gray-400')}
                    `}>
                      {format(day, dateFormat)}
                    </span>
                    
                    <button className="p-1 text-gray-400 hover:text-[#0071E3] transition-all bg-white/50 rounded-full hover-scale">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 md:space-y-2 mt-1">
                    <AnimatePresence>
                      {dayTasks.map(task => {
                        const isPastDate = isBefore(day, startOfDay(new Date()));
                        let taskStyle = 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50';
                        let titleStyle = 'text-gray-800';
                        let iconStyle = 'text-gray-400 hover:text-gray-900';
                        
                        if (task.isCompleted) {
                          taskStyle = 'bg-green-50 border-green-200 opacity-90';
                          titleStyle = 'line-through text-green-700';
                          iconStyle = 'text-green-600 hover:text-green-700';
                        } else if (isPastDate) {
                          taskStyle = 'bg-red-50 border-red-200 hover:bg-red-100';
                          titleStyle = 'text-red-700';
                          iconStyle = 'text-red-500 hover:text-red-600';
                        }

                        return (
                          <motion.div 
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask({ dateKey, task });
                            }}
                            draggable
                            onDragStart={(e: any) => {
                              e.dataTransfer.setData('taskId', task.id);
                              e.dataTransfer.setData('sourceDateKey', dateKey);
                              e.stopPropagation();
                            }}
                            className={`group/task flex items-start gap-2 p-1.5 md:p-2 rounded-lg text-xs cursor-pointer border shadow-sm transition-all hover-scale ${taskStyle}`}
                          >
                            <button 
                              className={`flex-shrink-0 mt-0.5 transition-colors ${iconStyle}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTask(dateKey, task.id);
                              }}
                            >
                              {task.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            </button>
                            <div className="flex flex-col gap-1 overflow-hidden">
                              <span className={`truncate ${titleStyle}`}>
                                {task.title}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${task.category.color}`}></span>
                                <span className="text-[10px] text-gray-500 truncate">{task.category.name}</span>
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* New Task Modal */}
      <AnimatePresence>
        {newTaskDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setNewTaskDate(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="glass-panel rounded-2xl p-6 w-full max-w-md shadow-xl border border-white/40"
            >
              <h2 className="text-xl font-medium mb-4">משימה חדשה לתאריך {format(newTaskDate, 'd בMMM yyyy', { locale: he })}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כותרת המשימה</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#0071E3] focus:border-transparent outline-none backdrop-blur-md"
                    placeholder="הכנס כותרת..."
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setNewTaskDate(null)} className="px-4 py-2 text-gray-600 hover:bg-white/50 rounded-xl transition-colors hover-scale">ביטול</button>
                  <button onClick={saveNewTask} className="px-4 py-2 bg-[#0071E3] text-white rounded-xl hover:bg-blue-600 transition-colors shadow-sm hover-scale">שמור משימה</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="glass-panel rounded-2xl p-6 w-full max-w-md shadow-xl border border-white/40"
            >
              <h2 className="text-xl font-medium mb-2">{selectedTask.task.title}</h2>
              <p className="text-sm text-gray-500 mb-6">מתוכנן לתאריך {selectedTask.dateKey}</p>
              
              <div className="flex justify-between items-center mt-6">
                <button 
                  onClick={() => deleteTask(selectedTask.dateKey, selectedTask.task.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50/50 rounded-xl transition-colors hover-scale"
                >
                  מחק משימה
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedTask(null)} className="px-4 py-2 text-gray-600 hover:bg-white/50 rounded-xl transition-colors hover-scale">סגור</button>
                  <button 
                    onClick={() => {
                      toggleTask(selectedTask.dateKey, selectedTask.task.id);
                      setSelectedTask(null);
                    }}
                    className={`px-4 py-2 text-white rounded-xl transition-colors shadow-sm hover-scale ${selectedTask.task.isCompleted ? 'bg-gray-500 hover:bg-gray-600' : 'bg-[#0071E3] hover:bg-blue-600'}`}
                  >
                    {selectedTask.task.isCompleted ? 'סמן כלא בוצע' : 'סמן כבוצע'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
