"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isBefore, isToday, startOfDay, differenceInMonths, isValid } from "date-fns";
import { he } from "date-fns/locale";
import { usePushNotifications } from "@/hooks/usePushNotifications";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NotificationsBell({ scheduleData, bankTasksData }: { scheduleData: any[], bankTasksData: any[] }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasShownPush, setHasShownPush] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  usePushNotifications();

  const currentDate = useMemo(() => new Date(), []); // Or just use startOfDay(new Date())

  const activeNotifications = useMemo(() => {
    const today = startOfDay(new Date());
    const notifications: { dateKey: string; task: Task }[] = [];
    const localTasks: Record<string, Task[]> = {};

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

    scheduleData.forEach(task => {
      if (task.task && /^\d+$/.test(task.task.trim())) return;
      const dayOfMonth = task.weekNumber || 1;
      const taskDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOfMonth);
      const dateKey = format(taskDate, 'yyyy-MM-dd');
      
      if (!localTasks[dateKey]) localTasks[dateKey] = [];
      localTasks[dateKey].push({
        id: `schedule-${task.id}`,
        dbId: task.id,
        title: task.task,
        category: { name: 'Monthly Task', color: 'bg-blue-400' },
        isCompleted: false, // We don't have isCompleted for schedule in DB, assume false if it's there
        source: 'schedule'
      });
    });

    bankTasksData.forEach(task => {
      if (!task.dueDate) return;
      const parsedDate = parseDateString(task.dueDate);
      if (parsedDate) {
        let renderDate = parsedDate;
        let isDelayed = false;
        let delayMonths = 0;
        
        if (task.status !== 'בוצע' && isBefore(parsedDate, today)) {
          renderDate = today;
          isDelayed = true;
          delayMonths = differenceInMonths(today, parsedDate);
        }
        
        const dateKey = format(renderDate, 'yyyy-MM-dd');
        if (!localTasks[dateKey]) localTasks[dateKey] = [];
        
        let category = { name: 'בנק משימות', color: 'bg-purple-400' };
        if (isDelayed) {
          if (delayMonths >= 1) {
            category = { name: 'עיכוב של חודש+', color: 'bg-orange-400' };
          } else {
            category = { name: 'משימה בדחייה', color: 'bg-yellow-400' };
          }
        }

        localTasks[dateKey].push({
          id: `bank-${task.id}`,
          dbId: task.id,
          title: task.taskName,
          category,
          isCompleted: task.status === 'בוצע',
          isDelayed,
          delayMonths,
          source: 'bank'
        });
      }
    });

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
  }, [scheduleData, bankTasksData, currentDate]);

  useEffect(() => {
    const showPush = async () => {
      if (activeNotifications.length > 0 && !hasShownPush && typeof window !== 'undefined' && 'Notification' in window) {
        try {
          if (Notification.permission === 'granted') {
            const body = `יש לך ${activeNotifications.length} משימות לביצוע שלא הושלמו.`;
            let shown = false;
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration();
              if (reg && reg.showNotification) {
                await reg.showNotification('משימות לביצוע', { body });
                shown = true;
              }
            }
            if (!shown) {
              new Notification('משימות לביצוע', { body });
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHasShownPush(true);
          }
        } catch (e) {
          console.error('Failed to show push notification', e);
        }
      }
    };
    showPush();
  }, [activeNotifications, hasShownPush]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // We don't need this if it's a fixed modal, but keeping it safe
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // No overflow changes needed for dropdown
  }, [showNotifications]);

  return (
    <div className="relative z-30" ref={notificationsRef}>
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors relative"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {activeNotifications.length > 0 && (
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-right max-h-[80vh] flex flex-col"
            dir="rtl"
          >
            <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-xs text-gray-500 flex justify-between items-center">
              <span>התראות לביצוע</span>
              <div className="flex items-center gap-3">
                {activeNotifications.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                    {activeNotifications.length} משימות
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px]">
              {activeNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  הכל מעודכן! אין משימות.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activeNotifications.map(({ dateKey, task }) => (
                    <div 
                      key={task.id} 
                      className="p-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                          <Bell className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                          <p className="text-[10px] text-gray-400 mt-1">מתוכנן לתאריך: {format(new Date(dateKey), 'd בMMM', { locale: he })}</p>
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
  );
}
