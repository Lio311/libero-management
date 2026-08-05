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

const mockTasks: Record<string, Task[]> = {
  // Add some mock tasks keyed by YYYY-MM-DD
  [format(new Date(), 'yyyy-MM-dd')]: [
    { id: '1', title: 'Inventory Check', category: { name: 'Operations', color: 'bg-blue-500' }, isCompleted: true },
    { id: '2', title: 'Update Pricing', category: { name: 'Finance', color: 'bg-green-500' }, isCompleted: false },
  ],
};

export default function CalendarPage() {
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white/30 font-sans pb-20 md:pb-0">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-light tracking-wide">Monthly Schedule</h1>
            <p className="text-xs text-zinc-400 uppercase tracking-widest">Libero Management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors relative">
            <Bell className="w-5 h-5 text-zinc-300" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>
          <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <h2 className="text-3xl md:text-5xl font-light flex gap-3 items-baseline">
            {format(currentDate, 'MMMM')} <span className="text-zinc-500 font-serif italic text-2xl md:text-4xl">{format(currentDate, 'yyyy')}</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 md:p-3 rounded-full hover:bg-white/10 transition-colors border border-white/5">
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button onClick={nextMonth} className="p-2 md:p-3 rounded-full hover:bg-white/10 transition-colors border border-white/5">
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-zinc-900/40 rounded-2xl md:rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Days of week */}
          <div className="grid grid-cols-7 border-b border-white/10 bg-zinc-950/50">
            {weekDays.map(day => (
              <div key={day} className="py-4 text-center text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, dayIdx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayTasks = mockTasks[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);

              return (
                <div 
                  key={day.toString()} 
                  className={`min-h-[120px] md:min-h-[160px] p-2 md:p-3 border-r border-b border-white/5 relative group transition-colors hover:bg-white/[0.02]
                    ${!isCurrentMonth ? 'bg-zinc-950/30' : ''}
                    ${dayIdx % 7 === 6 ? 'border-r-0' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm md:text-base font-medium flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full
                      ${isTodayDate ? 'bg-white text-black' : (isCurrentMonth ? 'text-zinc-200' : 'text-zinc-700')}
                    `}>
                      {format(day, dateFormat)}
                    </span>
                    
                    <button className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-all">
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
                          className={`group/task flex items-start gap-2 p-1.5 md:p-2 rounded-lg text-xs cursor-pointer border
                            ${task.isCompleted ? 'bg-zinc-900/50 border-white/5 opacity-50' : 'bg-zinc-800/50 border-white/10 hover:border-white/20 hover:bg-zinc-800'}
                            transition-all
                          `}
                        >
                          <button className="flex-shrink-0 mt-0.5 text-zinc-500 hover:text-white transition-colors">
                            {task.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          </button>
                          <div className="flex flex-col gap-1 overflow-hidden">
                            <span className={`truncate ${task.isCompleted ? 'line-through' : ''}`}>
                              {task.title}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${task.category.color}`}></span>
                              <span className="text-[10px] text-zinc-500 truncate">{task.category.name}</span>
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
      </main>
    </div>
  );
}
