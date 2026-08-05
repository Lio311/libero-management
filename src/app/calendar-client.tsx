'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Bell, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Temporary mock data interface
interface Task {
  id: string;
  title: string;
  category: { name: string; color: string };
  isCompleted: boolean;
}

interface CalendarClientProps {
  scheduleData: any[];
  ordersData: any[];
}

export default function CalendarPage({ scheduleData, ordersData }: CalendarClientProps) {
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map monthlySchedule to calendar days
  const dynamicTasks: Record<string, Task[]> = {};
  
  if (scheduleData && scheduleData.length > 0) {
    scheduleData.forEach((task, idx) => {
      // Approximate date based on week number
      const weekNum = task.weekNumber || 1;
      const dayOffset = (weekNum - 1) * 7;
      const approximateDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1 + dayOffset);
      const dateKey = format(approximateDate, 'yyyy-MM-dd');
      
      if (!dynamicTasks[dateKey]) {
        dynamicTasks[dateKey] = [];
      }
      dynamicTasks[dateKey].push({
        id: `task-${idx}`,
        title: task.task,
        category: { name: 'Monthly Task', color: 'bg-blue-400' },
        isCompleted: false
      });
    });
  }

  // Add orders as calendar events if they have an arrival date
  if (ordersData && ordersData.length > 0) {
    ordersData.forEach((order, idx) => {
      if (order.arrivalDate) {
        try {
          // Parse "DD.MM.YYYY"
          const parts = order.arrivalDate.split('.');
          if (parts.length === 3) {
            const dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            const dateKey = format(dateObj, 'yyyy-MM-dd');
            if (!dynamicTasks[dateKey]) {
              dynamicTasks[dateKey] = [];
            }
            dynamicTasks[dateKey].push({
              id: `order-${idx}`,
              title: `Arrival: ${order.products}`,
              category: { name: 'Order', color: 'bg-emerald-500' },
              isCompleted: false
            });
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-500/30 font-sans pb-20 md:pb-0" dir="ltr">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
            <CalendarIcon className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h1 className="text-xl font-light tracking-wide">Monthly Schedule</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Libero Management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>
          <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <h2 className="text-3xl md:text-5xl font-light flex gap-3 items-baseline text-gray-900">
            {format(currentDate, 'MMMM')} <span className="text-gray-400 font-serif italic text-2xl md:text-4xl">{format(currentDate, 'yyyy')}</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 md:p-3 rounded-full hover:bg-gray-200 transition-colors border border-gray-200 bg-white shadow-sm">
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            </button>
            <button onClick={nextMonth} className="p-2 md:p-3 rounded-full hover:bg-gray-200 transition-colors border border-gray-200 bg-white shadow-sm">
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-200 overflow-hidden shadow-lg backdrop-blur-sm">
          {/* Days of week */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
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
              const dayTasks = dynamicTasks[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);

              return (
                <div 
                  key={day.toString()} 
                  className={`min-h-[120px] md:min-h-[160px] p-2 md:p-3 border-r border-b border-gray-100 relative group transition-colors hover:bg-gray-50/80
                    ${!isCurrentMonth ? 'bg-gray-50/20' : 'bg-white'}
                    ${dayIdx % 7 === 6 ? 'border-r-0' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm md:text-base font-medium flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full
                      ${isTodayDate ? 'bg-gray-900 text-white shadow-md' : (isCurrentMonth ? 'text-gray-900' : 'text-gray-400')}
                    `}>
                      {format(day, dateFormat)}
                    </span>
                    
                    <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-900 transition-all bg-gray-100 rounded-full">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 md:space-y-2 mt-1">
                    <AnimatePresence>
                      {dayTasks.map(task => (
                        <motion.div 
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`group/task flex items-start gap-2 p-1.5 md:p-2 rounded-lg text-xs cursor-pointer border shadow-sm
                            ${task.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                            transition-all
                          `}
                        >
                          <button className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-gray-900 transition-colors">
                            {task.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-gray-600" /> : <Circle className="w-3.5 h-3.5" />}
                          </button>
                          <div className="flex flex-col gap-1 overflow-hidden">
                            <span className={`truncate ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                              {task.title}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${task.category.color}`}></span>
                              <span className="text-[10px] text-gray-500 truncate">{task.category.name}</span>
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Libero Orders Table */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm" dir="rtl">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-xl font-medium text-gray-900">הזמנות ליברו (China Orders)</h3>
            <p className="text-sm text-gray-500">מעקב אחר משלוחים עתידיים</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-gray-500">
                <tr>
                  <th className="py-3 px-6 font-medium">מוצרים</th>
                  <th className="py-3 px-6 font-medium">תאריך הגעה משוער</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordersData && ordersData.length > 0 ? (
                  ordersData.map((order, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-6 font-medium text-gray-900">{order.products}</td>
                      <td className="py-3 px-6 text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {order.arrivalDate || 'לא הוגדר'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-gray-500">אין הזמנות פתוחות</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
