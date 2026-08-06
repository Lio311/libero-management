/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, isBefore, startOfDay, differenceInMonths, isValid, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { updateMonthlyScheduleDay, toggleMonthlyScheduleStatus, deleteMonthlyScheduleAction } from '@/app/actions/monthlySchedule';
import { updateBankOfTaskAction, createBankOfTaskAction, deleteBankOfTaskAction } from '@/app/actions/bankOfTasks';

// Temporary mock data interface
interface Task {
  id: string;
  dbId?: string;
  title: string;
  category: { name: string; color: string };
  isCompleted: boolean;
  isDelayed?: boolean;
  delayMonths?: number;
  source?: 'schedule' | 'bank';
}

interface CalendarClientProps {
  scheduleData: any[];
  bankTasksData?: any[];
}

export default function CalendarPage({ scheduleData, bankTasksData = [] }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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
  const [selectedDayDetails, setSelectedDayDetails] = useState<Date | null>(null);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    const mainEl = document.querySelector('main.page-animate') as HTMLElement;
    if (!mainEl) return;
    
    if (newTaskDate || selectedDayDetails || selectedTask) {
      mainEl.style.overflow = 'hidden';
    } else {
      mainEl.style.overflow = '';
    }
    return () => {
      mainEl.style.overflow = '';
    };
  }, [newTaskDate, selectedDayDetails, selectedTask]);

  // Load monthlySchedule for the currently viewed month
  useEffect(() => {
    if (!scheduleData) return;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalTasks(prev => {
      // Create a fresh copy
      const newTasks: Record<string, Task[]> = {};
      
      // First, copy over ALL manual tasks (those without dbId)
      Object.keys(prev).forEach(dateKey => {
        const manualTasks = prev[dateKey].filter(t => !t.dbId);
        if (manualTasks.length > 0) {
          newTasks[dateKey] = manualTasks;
        }
      });
      
      // Helper to find the N-th occurrence of a day of the week in a month
      const getNthDayOfMonth = (year: number, month: number, dayOfWeek: number, n: number): Date => {
        let count = 0;
        for (let day = 1; day <= 31; day++) {
          const date = new Date(year, month, day);
          if (date.getMonth() !== month) break;
          if (date.getDay() === dayOfWeek) {
            count++;
            if (count === n) return date;
          }
        }
        return new Date(year, month, n * 7); // Fallback
      };

      // Then add the tasks from scheduleData
      scheduleData.forEach((task, idx) => {
        if (task.task && /^\d+$/.test(task.task.trim())) return;

        let taskDate: Date;
        const taskTitle = task.task || '';

        const isWeeklySummary = taskTitle.includes('פגישת סיכום שבוע');
        const isMonthlySummary = taskTitle.includes('פגישת סיכום חודש');
        const isPricingMeeting = taskTitle.includes('פגישת תמחור');

        const isMarketingMeeting = taskTitle.includes('ישיבת שיווק');
        const isScanProducts = taskTitle.includes('סריקת 100 מוצרים');
        const isInventoryMeeting = taskTitle.includes('פגישת מלאי');

        if (isWeeklySummary) {
          const firstWeeklySummaryIdx = scheduleData.findIndex(t => t.task && t.task.includes('פגישת סיכום שבוע'));
          if (idx !== firstWeeklySummaryIdx) return;

          for (let n = 1; n <= 5; n++) {
            const thursdayDate = getNthDayOfMonth(currentDate.getFullYear(), currentDate.getMonth(), 4, n);
            if (thursdayDate.getMonth() !== currentDate.getMonth()) continue;

            const today = startOfDay(new Date());
            let renderDate = thursdayDate;
            let isDelayed = false;
            let delayMonths = 0;

            let existingTask: Task | undefined;
            for (const key of Object.keys(prev)) {
              existingTask = prev[key].find(t => t.id.includes(`-thu-${n}`));
              if (existingTask) break;
            }

            const isCompleted = existingTask ? existingTask.isCompleted : (task.status === 'בוצע');

            if (!isCompleted && isBefore(thursdayDate, today)) {
              renderDate = today;
              isDelayed = true;
              delayMonths = differenceInMonths(today, thursdayDate);
            }

            if (renderDate.getDay() === 5) {
              renderDate = new Date(renderDate.getFullYear(), renderDate.getMonth(), renderDate.getDate() + 2);
            } else if (renderDate.getDay() === 6) {
              renderDate = new Date(renderDate.getFullYear(), renderDate.getMonth(), renderDate.getDate() + 1);
            }

            const dateKey = format(renderDate, 'yyyy-MM-dd');
            if (!newTasks[dateKey]) newTasks[dateKey] = [];

            let category = { name: 'משימה חודשית', color: 'bg-blue-400' };
            if (isDelayed) {
              category = { name: 'משימה בדחייה', color: 'bg-orange-400' };
            }

            newTasks[dateKey].push({
              id: existingTask ? existingTask.id : `task-weekly-summary-thu-${n}-${dateKey}`,
              dbId: task.id,
              title: 'פגישת סיכום שבוע',
              category,
              isCompleted,
              isDelayed,
              delayMonths,
              source: 'schedule'
            });
          }
          return;
        } else if (isMonthlySummary) {
          let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of month
          while (lastDay.getDay() === 5 || lastDay.getDay() === 6) {
            lastDay = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() - 1);
          }
          taskDate = lastDay;
        } else if (isInventoryMeeting) {
          let inventoryDay = 15;
          const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
          const dayOfWeek = tempDate.getDay();
          
          if (dayOfWeek === 5) {
            inventoryDay = 14; // Friday -> Thursday (14th)
          } else if (dayOfWeek === 6) {
            inventoryDay = 16; // Saturday -> Sunday (16th)
          }
          
          taskDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), inventoryDay);
        } else if (isPricingMeeting) {
          let n = 1;
          const originalDay = task.weekNumber || 1;
          if (originalDay >= 1 && originalDay <= 7) n = 1;
          else if (originalDay >= 8 && originalDay <= 14) n = 2;
          else if (originalDay >= 15 && originalDay <= 21) n = 3;
          else if (originalDay >= 22 && originalDay <= 28) n = 4;
          else if (originalDay >= 29) n = 5;

          const sundayDate = getNthDayOfMonth(currentDate.getFullYear(), currentDate.getMonth(), 0, n); // Sunday
          const wednesdayDate = getNthDayOfMonth(currentDate.getFullYear(), currentDate.getMonth(), 3, n); // Wednesday

          [sundayDate, wednesdayDate].forEach((d, i) => {
            const dateKey = format(d, 'yyyy-MM-dd');
            if (!newTasks[dateKey]) newTasks[dateKey] = [];
            
            let existingTask: Task | undefined;
            for (const key of Object.keys(prev)) {
              existingTask = prev[key].find(t => t.dbId === task.id && t.id.includes(i === 0 ? 'sun' : 'wed'));
              if (existingTask) break;
            }
            newTasks[dateKey].push({
              id: existingTask ? existingTask.id : `task-${idx}-${i === 0 ? 'sun' : 'wed'}-${dateKey}`,
              dbId: task.id,
              title: task.task,
              category: { name: 'משימה חודשית', color: 'bg-blue-400' },
              isCompleted: existingTask ? existingTask.isCompleted : (task.status === 'בוצע'),
              source: 'schedule'
            });
          });
          return; // Skip the rest for this specific task
        } else if (isWeeklySummary || isMarketingMeeting || isScanProducts) {
          // Determine week occurrence (1st, 2nd, 3rd, 4th, 5th) based on the original day of month stored in DB
          let n = 1;
          const originalDay = task.weekNumber || 1;
          if (originalDay >= 1 && originalDay <= 7) n = 1;
          else if (originalDay >= 8 && originalDay <= 14) n = 2;
          else if (originalDay >= 15 && originalDay <= 21) n = 3;
          else if (originalDay >= 22 && originalDay <= 28) n = 4;
          else if (originalDay >= 29) n = 5;

          let dayOfWeek = 4; // Default to Thursday for weekly summary
          if (isMarketingMeeting) dayOfWeek = 1; // Monday
          if (isScanProducts) dayOfWeek = 2; // Tuesday

          taskDate = getNthDayOfMonth(currentDate.getFullYear(), currentDate.getMonth(), dayOfWeek, n);
        } else {
          const dayOfMonth = task.weekNumber || 1;
          taskDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOfMonth);
        }

        if (taskDate.getDay() === 5) {
          taskDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate() + 2);
        } else if (taskDate.getDay() === 6) {
          taskDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate() + 1);
        }

        const today = startOfDay(new Date());
        let renderDate = taskDate;
        let isDelayed = false;
        let delayMonths = 0;

        // Find if this task existed in prev (so we can keep its isCompleted state)
        let existingTask: Task | undefined;
        for (const key of Object.keys(prev)) {
          existingTask = prev[key].find(t => t.dbId === task.id);
          if (existingTask) break;
        }

        const isCompleted = existingTask ? existingTask.isCompleted : (task.status === 'בוצע');

        // Delay logic: uncompleted tasks with past dates move to today
        if (!isCompleted && isBefore(taskDate, today)) {
          renderDate = today;
          isDelayed = true;
          delayMonths = differenceInMonths(today, taskDate);
        }

        // Ensure renderDate doesn't fall on Friday/Saturday
        if (renderDate.getDay() === 5) {
          renderDate = new Date(renderDate.getFullYear(), renderDate.getMonth(), renderDate.getDate() + 2);
        } else if (renderDate.getDay() === 6) {
          renderDate = new Date(renderDate.getFullYear(), renderDate.getMonth(), renderDate.getDate() + 1);
        }

        const dateKey = format(renderDate, 'yyyy-MM-dd');
        
        if (!newTasks[dateKey]) newTasks[dateKey] = [];

        let category = { name: 'משימה חודשית', color: 'bg-blue-400' };
        if (isDelayed) {
          if (delayMonths >= 1) {
            category = { name: 'עיכוב של חודש+', color: 'bg-orange-400' };
          } else {
            category = { name: 'משימה בדחייה', color: 'bg-orange-400' };
          }
        }

        newTasks[dateKey].push({
          id: existingTask ? existingTask.id : `task-${idx}-${dateKey}`,
          dbId: task.id,
          title: task.task,
          category,
          isCompleted,
          isDelayed,
          delayMonths,
          source: 'schedule'
        });
      });

      // Then add tasks from bankTasksData
      const parseDateString = (dateStr: string) => {
        if (!dateStr) return null;
        let day, month, year;
        if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts[0].length === 4) { year = parseInt(parts[0]); month = parseInt(parts[1]) - 1; day = parseInt(parts[2]); }
          else { day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]); }
        } else if (dateStr.includes('.')) {
          const parts = dateStr.split('.');
          day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
        } else if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
        } else {
          const parsed = new Date(dateStr);
          if (isValid(parsed)) return parsed;
          return null;
        }
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        if (year < 100) year += 2000;
        return new Date(year, month, day);
      };

      bankTasksData.forEach(task => {
        if (task.taskName && task.taskName.includes('ישיבת שיווק')) {
          // Render this specific bank task on every Monday of the month
          for (let n = 1; n <= 5; n++) {
            const mondayDate = getNthDayOfMonth(currentDate.getFullYear(), currentDate.getMonth(), 1, n);
            if (mondayDate.getMonth() !== currentDate.getMonth()) continue; // Skip if n=5 overflows to next month
            
            const dateKey = format(mondayDate, 'yyyy-MM-dd');
            if (!newTasks[dateKey]) newTasks[dateKey] = [];
            
            let existingTask: Task | undefined;
            for (const key of Object.keys(prev)) {
               existingTask = prev[key].find(t => t.dbId === task.id && t.id.includes(`-mon-${n}`));
               if (existingTask) break;
            }

            newTasks[dateKey].push({
              id: existingTask ? existingTask.id : `bank-${task.id}-mon-${n}`,
              dbId: task.id,
              title: task.taskName,
              category: { name: 'משימה חודשית', color: 'bg-blue-400' },
              isCompleted: existingTask ? existingTask.isCompleted : (task.status === 'בוצע'),
              source: 'bank'
            });
          }
          return; // Skip standard due-date rendering
        }

        if (!task.dueDate) return;
        const parsedDate = parseDateString(task.dueDate);
        if (parsedDate) {
           if (parsedDate.getDay() === 5) {
             parsedDate.setDate(parsedDate.getDate() + 2);
           } else if (parsedDate.getDay() === 6) {
             parsedDate.setDate(parsedDate.getDate() + 1);
           }
           const today = startOfDay(new Date());
           
           // Check if we manually toggled completion in Calendar
           let isCompleted = task.status === 'בוצע';
           let existingTask: Task | undefined;
           for (const key of Object.keys(prev)) {
             existingTask = prev[key].find(t => t.id === `bank-${task.id}`);
             if (existingTask) break;
           }
           if (existingTask) {
             isCompleted = existingTask.isCompleted;
           }

           let renderDate = parsedDate;
           let isDelayed = false;
           let delayMonths = 0;
           
           if (!isCompleted && isBefore(parsedDate, today)) {
              renderDate = today;
              isDelayed = true;
              delayMonths = differenceInMonths(today, parsedDate);
           }
           
           if (renderDate.getDay() === 5) {
             renderDate = new Date(renderDate.getFullYear(), renderDate.getMonth(), renderDate.getDate() + 2);
           } else if (renderDate.getDay() === 6) {
             renderDate = new Date(renderDate.getFullYear(), renderDate.getMonth(), renderDate.getDate() + 1);
           }
           
           const dateKey = format(renderDate, 'yyyy-MM-dd');
           if (!newTasks[dateKey]) newTasks[dateKey] = [];
           
           let category = { name: 'בנק משימות', color: 'bg-purple-400' };
           if (isDelayed) {
              category = { name: 'משימה בדחייה', color: 'bg-orange-400' };
           }

           newTasks[dateKey].push({
             id: `bank-${task.id}`,
             dbId: task.id,
             title: task.taskName,
             category,
             isCompleted,
             isDelayed,
             delayMonths,
             source: 'bank'
           });
        }
      });
      
      return newTasks;
    });
  }, [currentDate, scheduleData, bankTasksData]);

  const toggleTask = async (dateKey: string, taskId: string) => {
    const task = localTasks[dateKey]?.find(t => t.id === taskId);
    if (!task) return;

    const newIsCompleted = !task.isCompleted;

    setLocalTasks(prev => {
      const newTasks = { ...prev };
      if (newTasks[dateKey]) {
        newTasks[dateKey] = newTasks[dateKey].map(t => {
          if (t.id === taskId) {
            return { ...t, isCompleted: newIsCompleted };
          }
          return t;
        });
      }
      return newTasks;
    });

    // Fire backend update if it's a bank task or schedule task
    if (task.dbId) {
      if (task.source === 'bank') {
        await updateBankOfTaskAction(task.dbId, { status: newIsCompleted ? 'בוצע' : 'לא התחיל' });
      } else if (task.source === 'schedule') {
        await toggleMonthlyScheduleStatus(task.dbId, newIsCompleted);
      }
    }
  };

  const handleDayClick = (day: Date) => {
    setSelectedDayDetails(day);
  };

  const saveNewTask = async () => {
    if (!newTaskDate || !newTaskTitle.trim()) return;
    const taskTitle = newTaskTitle;
    
    // Close modal immediately for snappy feel
    setNewTaskDate(null);
    
    // Optimistic update
    const dateKey = format(newTaskDate, 'yyyy-MM-dd');
    const tempId = `temp-${Date.now()}`;
    setLocalTasks(prev => {
      const newTasks = { ...prev };
      if (!newTasks[dateKey]) newTasks[dateKey] = [];
      newTasks[dateKey] = [...newTasks[dateKey], {
        id: tempId,
        title: taskTitle,
        category: { name: 'בנק משימות', color: 'bg-purple-400' },
        isCompleted: false,
        source: 'bank'
      }];
      return newTasks;
    });

    // Wait for the server action and revalidatePath to update the calendar via Server Components
    const res = await createBankOfTaskAction({
      taskName: taskTitle,
      dueDate: format(newTaskDate, 'dd.MM.yyyy'), // Match the format used in tasks-client
      status: 'לא התחיל'
    });
    
    // Update temp task with real dbId if successful
    if (res?.success && res.task) {
      setLocalTasks(prev => {
        const newTasks = { ...prev };
        if (newTasks[dateKey]) {
          newTasks[dateKey] = newTasks[dateKey].map(t => 
            t.id === tempId ? { ...t, id: `bank-${res.task.id}`, dbId: res.task.id } : t
          );
        }
        return newTasks;
      });
    }
  };

  const deleteTask = async (dateKey: string, taskId: string) => {
    const taskToDelete = localTasks[dateKey]?.find(t => t.id === taskId);
    
    setLocalTasks(prev => {
      const newTasks = { ...prev };
      if (newTasks[dateKey]) {
        newTasks[dateKey] = newTasks[dateKey].filter(t => t.id !== taskId);
      }
      return newTasks;
    });
    setSelectedTask(null);
    
    if (taskToDelete?.dbId) {
      if (taskToDelete.source === 'bank') {
        await deleteBankOfTaskAction(taskToDelete.dbId);
      } else if (taskToDelete.source === 'schedule') {
        await deleteMonthlyScheduleAction(taskToDelete.dbId);
      }
    }
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
            <button onClick={prevMonth} className="p-2 md:p-3 rounded-full hover:bg-white/50 transition-colors border border-white/40 bg-white/50 shadow-sm hover-scale" title="החודש הקודם">
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            </button>
            <button onClick={nextMonth} className="p-2 md:p-3 rounded-full hover:bg-white/50 transition-colors border border-white/40 bg-white/50 shadow-sm hover-scale" title="החודש הבא">
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

                    let targetDay = day;
                    if (targetDay.getDay() === 5) {
                      targetDay = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate() + 2);
                    } else if (targetDay.getDay() === 6) {
                      targetDay = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate() + 1);
                    }
                    const targetDateKey = format(targetDay, 'yyyy-MM-dd');

                    setLocalTasks(prev => {
                      const newTasks = { ...prev };
                      if (newTasks[sourceDateKey]) {
                        newTasks[sourceDateKey] = newTasks[sourceDateKey].filter(t => t.id !== taskId);
                      }
                      if (!newTasks[targetDateKey]) newTasks[targetDateKey] = [];
                      newTasks[targetDateKey] = [...newTasks[targetDateKey], taskToMove];
                      return newTasks;
                    });

                    if (taskToMove.dbId && taskToMove.source === 'schedule') {
                      const newDay = targetDay.getDate();
                      await updateMonthlyScheduleDay(taskToMove.dbId, newDay);
                    } else if (taskToMove.source === 'bank' && taskToMove.dbId) {
                      await updateBankOfTaskAction(taskToMove.dbId, { dueDate: format(targetDay, 'dd.MM.yyyy') });
                    }
                  }}
                  className={`h-[120px] md:h-[160px] p-2 md:p-3 border-l border-b border-gray-200/30 relative group transition-colors hover:bg-white/40 cursor-pointer overflow-hidden flex flex-col
                    ${!isCurrentMonth ? 'bg-transparent opacity-60' : 'bg-transparent'}
                    ${dayIdx % 7 === 6 ? 'border-l-0' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-1 flex-shrink-0">
                    <span className={`text-sm md:text-base font-medium flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full
                      ${isTodayDate ? 'bg-[#0071E3] text-white shadow-md' : (isCurrentMonth ? 'text-gray-900' : 'text-gray-400')}
                    `}>
                      {format(day, dateFormat)}
                    </span>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewTaskDate(day);
                        setNewTaskTitle('');
                      }}
                      className="p-1 text-gray-400 hover:text-[#0071E3] transition-all bg-white/50 rounded-full hover-scale"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar pb-1">
                    <AnimatePresence>
                      {dayTasks.map(task => {
                        const isPastDate = isBefore(day, startOfDay(new Date()));
                        let titleStyle = 'text-gray-700 font-medium';
                        let dotColor = 'bg-gray-400';
                        let bgStyle = 'hover:bg-black/5';
                        
                        if (task.isCompleted) {
                          titleStyle = 'text-gray-400 line-through';
                          dotColor = 'bg-green-400';
                        } else if (task.isDelayed) {
                            titleStyle = 'text-orange-800';
                            dotColor = 'bg-orange-500';
                            bgStyle = 'bg-orange-50 hover:bg-orange-100';
                        } else if (isPastDate) {
                          titleStyle = 'text-red-800';
                          dotColor = 'bg-red-500';
                          bgStyle = 'bg-red-50 hover:bg-red-100';
                        }

                        return (
                          <motion.div 
                            key={task.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
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
                            className={`group/task flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] md:text-[11px] cursor-pointer transition-colors ${bgStyle}`}
                          >
                            <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 ${dotColor}`}></span>
                            <span className={`truncate ${titleStyle}`} title={task.title}>
                              {task.title}
                            </span>
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

        {/* Day Details Modal */}
        {selectedDayDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedDayDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="glass-panel rounded-2xl p-6 w-full max-w-lg shadow-xl border border-white/40 max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-medium">
                  משימות ל-{format(selectedDayDetails, 'd בMMM yyyy', { locale: he })}
                </h2>
                <button 
                  onClick={() => {
                    setNewTaskDate(selectedDayDetails);
                    setNewTaskTitle('');
                    setSelectedDayDetails(null);
                  }}
                  className="bg-[#0071E3] text-white p-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {(() => {
                  const dateKey = format(selectedDayDetails, 'yyyy-MM-dd');
                  const dayTasks = localTasks[dateKey] || [];
                  if (dayTasks.length === 0) {
                    return <p className="text-gray-500 text-center py-8">אין משימות ליום זה</p>;
                  }
                  return dayTasks.map(task => {
                        const isPastDate = isBefore(selectedDayDetails, startOfDay(new Date()));
                        let taskStyle = 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50';
                        let titleStyle = 'text-gray-800';
                        let iconStyle = 'text-gray-400 hover:text-gray-900';
                        
                        if (task.isCompleted) {
                          taskStyle = 'bg-green-100 border-green-300 opacity-90';
                          titleStyle = 'line-through text-green-800';
                          iconStyle = 'text-green-600 hover:text-green-800';
                        } else if (task.isDelayed) {
                            taskStyle = 'bg-orange-100 border-orange-300 hover:bg-orange-200';
                            titleStyle = 'text-orange-800';
                            iconStyle = 'text-orange-600 hover:text-orange-800';
                        } else if (isPastDate) {
                          taskStyle = 'bg-red-100 border-red-300 hover:bg-red-200';
                          titleStyle = 'text-red-800';
                          iconStyle = 'text-red-500 hover:text-red-700';
                        }

                        return (
                          <div 
                            key={task.id}
                            onClick={() => {
                              setSelectedTask({ dateKey, task });
                              setSelectedDayDetails(null);
                            }}
                            className={`flex justify-between items-center p-3 rounded-xl cursor-pointer border shadow-sm transition-all hover-scale ${taskStyle}`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <button 
                                className={`flex-shrink-0 transition-colors ${iconStyle}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTask(dateKey, task.id);
                                }}
                              >
                                {task.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                              </button>
                              <div className="flex flex-col overflow-hidden">
                                <span className={`font-medium ${titleStyle} truncate`}>{task.title}</span>
                                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${task.category.color}`}></span>
                                  {task.category.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                  });
                })()}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelectedDayDetails(null)} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium">סגור</button>
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
