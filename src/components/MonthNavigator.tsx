"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';

interface MonthNavigatorProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

export const MonthNavigator = ({ currentDate, onDateChange }: MonthNavigatorProps) => {
    return (
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <button
                onClick={() => onDateChange(subMonths(currentDate, 1))}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            <div className="font-bold text-slate-700 min-w-[120px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: he })}
            </div>

            <button
                onClick={() => onDateChange(addMonths(currentDate, 1))}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                disabled={false}
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
        </div>
    );
};
