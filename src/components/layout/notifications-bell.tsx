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

export function NotificationsBell({ scheduleData, bankTasksData }: { scheduleData: any[], bankTasksData: any[] }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasShownPush, setHasShownPush] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  usePushNotifications();

  const currentDate = new Date(); // Or just use startOfDay(new Date())

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

    scheduleData.forEach((task, idx) => {
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
  }, [scheduleData, bankTasksData]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // We don't need this if it's a fixed modal, but keeping it safe
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        // setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showNotifications) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showNotifications]);

  return (
    <div className="relative" ref={notificationsRef}>
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors relative hover-scale"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {activeNotifications.length > 0 && (
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#F5F5F7]"></span>
        )}
      </button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNotifications(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                <h3 className="font-medium text-gray-900">משימות לביצוע</h3>
                <div className="flex items-center gap-3">
                  {activeNotifications.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                      {activeNotifications.length} משימות
                    </span>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeNotifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                    <p>הכל מעודכן! אין משימות לביצוע.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {activeNotifications.map(({ dateKey, task }) => (
                      <div 
                        key={task.id} 
                        className="p-4 hover:bg-blue-50 transition-colors cursor-pointer group"
                        onClick={() => setShowNotifications(false)}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
