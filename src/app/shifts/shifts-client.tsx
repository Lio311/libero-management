/* eslint-disable */
"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from "date-fns";
import { he } from "date-fns/locale";
import { ChevronRight, ChevronLeft, Plus, X, Trash2, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getShifts, addShift, deleteShift, updateShift, copyPreviousWeekShifts } from "@/app/actions/shifts";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";
import { HebrewCalendar, HDate, flags } from "@hebcal/core";

const DEPARTMENTS = ["משרד", "הנהלה", "חנות", "מחסן", "חופשות"];
const EMPLOYEES = ["ליאור", "רותי", "אור דוד", "צדוק", "אבישי", "אריאל", "ישראל", "טל", "יוליה", "דניאל"];

const EMPLOYEE_COLORS: Record<string, string> = {
  "ליאור": "bg-emerald-500/20 text-emerald-100 border border-emerald-500/30",
  "רותי": "bg-pink-500/20 text-pink-100 border border-pink-500/30",
  "אור דוד": "bg-blue-500/20 text-blue-100 border border-blue-500/30",
  "צדוק": "bg-amber-500/20 text-amber-100 border border-amber-500/30",
  "אבישי": "bg-purple-500/20 text-purple-100 border border-purple-500/30",
  "אריאל": "bg-cyan-500/20 text-cyan-100 border border-cyan-500/30",
  "ישראל": "bg-indigo-500/20 text-indigo-100 border border-indigo-500/30",
  "טל": "bg-rose-500/20 text-rose-100 border border-rose-500/30",
  "יוליה": "bg-orange-500/20 text-orange-100 border border-orange-500/30",
  "דניאל": "bg-teal-500/20 text-teal-100 border border-teal-500/30",
};

type Shift = {
  id: string;
  date: string;
  employeeName: string;
  department: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
};

const getHolidayInfo = (date: Date) => {
  const hdate = new HDate(date);
  const events = HebrewCalendar.getHolidaysOnDate(hdate, true) || [];
  let isNoWork = false;
  let isShabbat = date.getDay() === 6;
  let label = "";

  for (const ev of events) {
    const desc = ev.render('he');
    const evFlags = ev.getFlags();
    
    // Remove niqqud for string matching and display
    const cleanDesc = desc.replace(/[\u0591-\u05C7]/g, '');

    if ((evFlags & flags.CHAG) !== 0 || cleanDesc.includes("עצמאות")) {
      isNoWork = true;
      if (!label) label = cleanDesc;
    } else if ((evFlags & flags.EREV) !== 0 || (evFlags & flags.CHOL_HAMOED) !== 0) {
      if (!label) label = cleanDesc;
    } else if (cleanDesc.includes("פורים") || cleanDesc.includes("חנוכה")) {
      if (!label) label = cleanDesc;
    }
  }

  if (isShabbat) {
    isNoWork = true;
    if (!label) label = "שבת";
    else label = `שבת, ${label}`;
  }

  return { isNoWork, label };
};

export default function ShiftsClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [endDateRange, setEndDateRange] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  
  // Form state
  const [employeeName, setEmployeeName] = useState(EMPLOYEES[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirm = useConfirm();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [additionalDates, setAdditionalDates] = useState<string[]>([]);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    const result = await getShifts(weekStartStr, weekEndStr);
    if (result.success && result.data) {
      setShifts(result.data as Shift[]);
    } else {
      toast.error("שגיאה בטעינת משמרות");
    }
    setLoading(false);
  }, [weekStartStr, weekEndStr]);

  useEffect(() => {
    if (mounted) {
      fetchShifts();
    }
  }, [mounted, fetchShifts]);

  const handleDragStart = (e: React.DragEvent, shiftId: string) => {
    e.dataTransfer.setData("shiftId", shiftId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent, targetDate: string, targetDept: string) => {
    e.preventDefault();
    const shiftId = e.dataTransfer.getData("shiftId");
    if (!shiftId) return;
    
    // Find the shift being dragged
    const shiftToMove = shifts.find(s => s.id === shiftId);
    if (!shiftToMove) return;
    
    const isCopy = e.altKey || e.ctrlKey || e.metaKey;

    // If it's dropped in the exact same spot and not copying, do nothing
    if (!isCopy && shiftToMove.date === targetDate && shiftToMove.department === targetDept) return;

    if (isCopy) {
      // Create a temporary ID for optimistic UI
      const tempId = "temp-" + Date.now();
      const newShift = { ...shiftToMove, id: tempId, date: targetDate, department: targetDept };
      setShifts(prev => [...prev, newShift]);
      
      const result = await addShift({
        date: targetDate, 
        department: targetDept,
        employeeName: shiftToMove.employeeName,
        startTime: targetDept === "חופשות" ? "" : (shiftToMove.startTime || ""),
        endTime: targetDept === "חופשות" ? "" : (shiftToMove.endTime || ""),
        notes: shiftToMove.notes || ""
      });
      
      if (!result.success) {
        toast.error("שגיאה בשכפול המשמרת");
      }
      // Always re-fetch to get the real ID from DB
      fetchShifts();
    } else {
      // Optimistically update the UI
      setShifts(prev => prev.map(s => s.id === shiftId ? { 
        ...s, 
        date: targetDate, 
        department: targetDept,
        startTime: targetDept === "חופשות" ? "" : s.startTime,
        endTime: targetDept === "חופשות" ? "" : s.endTime 
      } : s));
      
      // Send update to server
      const result = await updateShift(shiftId, { 
        date: targetDate, 
        department: targetDept,
        employeeName: shiftToMove.employeeName,
        startTime: targetDept === "חופשות" ? "" : (shiftToMove.startTime || ""),
        endTime: targetDept === "חופשות" ? "" : (shiftToMove.endTime || ""),
        notes: shiftToMove.notes || ""
      });
      
      if (!result.success) {
        toast.error("שגיאה בהעברת המשמרת");
        fetchShifts(); // Revert optimistic UI update
      }
    }
  };

  if (!mounted) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleCopyPreviousWeek = async () => {
    const isConfirmed = await confirm({
      title: "שכפול שבוע קודם",
      message: "האם אתה בטוח שברצונך להעתיק את כל המשמרות מהשבוע הקודם לשבוע הנוכחי? (פעולה זו לא תמחק משמרות קיימות אלא תוסיף עליהן)",
      confirmText: "העתק",
      cancelText: "ביטול"
    });
    if (!isConfirmed) return;

    setIsSubmitting(true);
    const result = await copyPreviousWeekShifts(weekStartStr, weekEndStr);
    if (result.success) {
      toast.success(`הועתקו ${result.count} משמרות בהצלחה`);
      fetchShifts();
    } else {
      toast.error(result.error || "שגיאה בהעתקת משמרות");
    }
    setIsSubmitting(false);
  };

  const openAddModal = (dateStr: string, dept: string) => {
    setEditingShiftId(null);
    setSelectedDate(dateStr);
    setEndDateRange("");
    setAdditionalDates([]);
    setSelectedDept(dept);
    setEmployeeName(EMPLOYEES[0]);
    setStartTime("");
    setEndTime("");
    setNotes("");
    setIsModalOpen(true);
  };

  const openEditModal = (shift: Shift) => {
    setEditingShiftId(shift.id);
    setSelectedDate(shift.date);
    setEndDateRange("");
    setAdditionalDates([]);
    setSelectedDept(shift.department);
    setEmployeeName(shift.employeeName);
    setStartTime(shift.startTime || "");
    setEndTime(shift.endTime || "");
    setNotes(shift.notes || "");
    setIsModalOpen(true);
  };

  const openDuplicateModal = (shift: Shift) => {
    setEditingShiftId(null); // Add mode, not edit
    setSelectedDate(shift.date);
    setEndDateRange("");
    setAdditionalDates([]);
    setSelectedDept(shift.department);
    setEmployeeName(shift.employeeName);
    setStartTime(shift.startTime || "");
    setEndTime(shift.endTime || "");
    setNotes(shift.notes || "");
    setIsModalOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payloadTemplate = {
      department: selectedDept,
      employeeName,
      startTime: selectedDept === "חופשות" ? "" : startTime,
      endTime: selectedDept === "חופשות" ? "" : endTime,
      notes,
    };

    let datesToProcess: string[] = [];
    if (endDateRange && new Date(endDateRange) >= new Date(selectedDate)) {
      try {
        const daysInRange = eachDayOfInterval({ start: new Date(selectedDate), end: new Date(endDateRange) });
        datesToProcess = daysInRange.map(d => format(d, "yyyy-MM-dd"));
      } catch (e) {
        datesToProcess = [selectedDate];
      }
    } else {
      datesToProcess = [selectedDate];
    }
    
    // Combine with manually checked additional dates and remove duplicates
    const allDates = Array.from(new Set([...datesToProcess, ...additionalDates]));
    const extraDatesToAdd = allDates.filter(d => d !== selectedDate);

    if (editingShiftId) {
      const result = await updateShift(editingShiftId, { ...payloadTemplate, date: selectedDate });
      let allSuccess = result.success;
      
      for (const d of extraDatesToAdd) {
        const addResult = await addShift({ ...payloadTemplate, date: d });
        if (!addResult.success) allSuccess = false;
      }
      
      if (allSuccess) {
        toast.success("המשמרת עודכנה ונשמרה בהצלחה");
        setIsModalOpen(false);
        fetchShifts();
      } else {
        toast.error("חלק מהמשמרות לא נשמרו, אנא נסה שוב");
      }
    } else {
      let allSuccess = true;
      for (const d of allDates) {
        const result = await addShift({ ...payloadTemplate, date: d });
        if (!result.success) allSuccess = false;
      }
      if (allSuccess) {
        toast.success("המשמרת נוספה בהצלחה");
        setIsModalOpen(false);
        fetchShifts();
      } else {
        toast.error("חלק מהמשמרות לא נשמרו, אנא נסה שוב");
      }
    }
    
    setIsSubmitting(false);
  };

  const handleDeleteShift = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isConfirmed = await confirm({
      title: "מחיקת משמרת",
      message: "האם אתה בטוח שברצונך למחוק משמרת זו?",
      confirmText: "מחק",
      cancelText: "ביטול"
    });
    
    if (isConfirmed) {
      const result = await deleteShift(id);
      if (result.success) {
        toast.success("המשמרת נמחקה");
        fetchShifts();
      } else {
        toast.error("שגיאה במחיקת המשמרת");
      }
    }
  };

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between glass-panel p-6 rounded-3xl print:hidden text-white gap-4">
        <div className="text-lg font-semibold">
          {format(weekStart, "dd/MM/yyyy")} - {format(weekEnd, "dd/MM/yyyy")}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Button variant="outline" onClick={handleCopyPreviousWeek} disabled={isSubmitting} className="mr-2 gap-2 bg-white/10 text-white border-0 hover:bg-white/20 hover:text-white">
            <Copy className="h-4 w-4" />
            שכפל שבוע קודם
          </Button>
          <Button variant="secondary" onClick={() => window.print()} className="mr-4 gap-2 bg-white/20 text-white border-0 hover:bg-white/30 hover:text-white">
            שמור כ-PDF / הדפס
          </Button>
          <Button variant="outline" onClick={handleToday} className="bg-white/10 text-white border-0 hover:bg-white/20 hover:text-white">
            היום
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevWeek} className="bg-white/10 text-white border-0 hover:bg-white/20 hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek} className="bg-white/10 text-white border-0 hover:bg-white/20 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-2 text-center">
        <h1 className="text-2xl font-bold">לוח משמרות שבועי</h1>
        <p className="text-lg">
          {format(weekStart, "dd/MM/yyyy")} - {format(weekEnd, "dd/MM/yyyy")}
        </p>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto print:overflow-visible glass-panel rounded-3xl p-6 text-white">
        <div className="min-w-[800px] print:min-w-0 rounded-xl overflow-hidden border border-white/10">
          {/* Header Row (Days) */}
          <div className="grid grid-cols-8 border-b border-white/10 bg-white/5">
            <div className="p-3 print:p-1 font-semibold flex items-center justify-center border-l border-white/10 print:text-sm text-slate-200">
              אגף
            </div>
            {days.map((day) => {
              const { isNoWork, label } = getHolidayInfo(day);
              const isCurrentDay = isToday(day);
              
              return (
              <div key={day.toISOString()} className={`p-3 print:p-1 text-center font-medium border-l border-white/10 last:border-0 flex flex-col items-center justify-center relative ${isNoWork ? 'bg-white/10' : ''} ${isCurrentDay ? 'bg-white/10' : ''}`}>
                {isCurrentDay && <div className="absolute top-0 left-0 right-0 h-1 bg-white print:hidden"></div>}
                <div className={isNoWork ? 'text-primary print:text-sm text-blue-300' : (isCurrentDay ? 'text-white font-bold print:text-sm' : 'text-slate-200 print:text-sm')}>{format(day, "EEEE", { locale: he })}</div>
                <div className={`text-sm print:text-xs ${isNoWork ? 'text-primary/80 text-blue-300' : (isCurrentDay ? 'text-white font-bold' : 'text-slate-300')}`}>{format(day, "dd/MM")}</div>
                {label && <div className="text-xs text-blue-200 font-bold mt-1 bg-blue-500/20 px-2 py-0.5 rounded-full">{label}</div>}
              </div>
            )})}
          </div>

          {/* Body Rows (Departments) */}
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : (
            DEPARTMENTS.map((dept) => (
              <div key={dept} className="grid grid-cols-8 border-b border-white/10 last:border-0">
                {/* Department Name */}
                <div className="p-3 print:p-1 font-semibold flex items-center justify-center border-l border-white/10 bg-white/5 print:text-sm text-slate-200">
                  {dept}
                </div>
                
                {/* Days Cells */}
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayShifts = shifts.filter(
                    (s) => s.date === dateStr && s.department === dept
                  );
                  const { isNoWork } = getHolidayInfo(day);
                  const isCellBlocked = isNoWork && dept !== "חופשות";
                  const isCurrentDay = isToday(day);
                  
                  return (
                    <div 
                      key={dateStr} 
                      className={`p-2 print:p-1 border-l border-white/10 last:border-0 min-h-[100px] print:min-h-0 relative group ${isNoWork ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_20px)]' : ''} ${isCurrentDay ? 'bg-white/5' : ''}`}
                      onDragOver={isCellBlocked ? undefined : handleDragOver}
                      onDrop={isCellBlocked ? undefined : ((e) => handleDrop(e, dateStr, dept))}
                    >
                      <div className="space-y-2 print:space-y-1 mb-6 print:mb-0">
                        {dayShifts.map(shift => {
                          const employeeColor = EMPLOYEE_COLORS[shift.employeeName] || "bg-white/10 text-white border border-white/20";
                          return (
                          <div 
                            key={shift.id}
                            draggable={!isCellBlocked}
                            onDragStart={isCellBlocked ? undefined : ((e) => handleDragStart(e, shift.id))}
                            onClick={() => openEditModal(shift)}
                            className={`p-2 print:p-1 rounded text-sm print:text-xs relative group/shift cursor-pointer shadow-sm ${employeeColor} hover:opacity-90 active:scale-95 transition-all`}
                          >
                            <div className="font-semibold">{shift.employeeName}</div>
                            {(shift.startTime || shift.endTime) && (
                              <div className="text-xs opacity-90"><span dir="ltr">{shift.startTime} - {shift.endTime}</span></div>
                            )}
                            {shift.notes && (
                              <div className="text-xs mt-1 truncate opacity-80">{shift.notes}</div>
                            )}
                            
                            {/* Duplicate Button */}
                            {!isCellBlocked && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openDuplicateModal(shift); }}
                                className="absolute top-1 left-7 p-1 bg-black/40 rounded opacity-0 group-hover/shift:opacity-100 transition-opacity hover:text-blue-300 print:hidden text-white"
                                title="שכפל משמרת"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={(e) => handleDeleteShift(shift.id, e)}
                              className="absolute top-1 left-1 p-1 bg-black/40 rounded opacity-0 group-hover/shift:opacity-100 transition-opacity hover:text-red-400 print:hidden text-white"
                              title="מחק משמרת"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )})}
                      </div>
                      
                      {/* Add Button */}
                      {!isCellBlocked && (
                        <button
                          onClick={() => openAddModal(dateStr, dept)}
                          className="absolute bottom-2 right-2 left-2 flex items-center justify-center py-1 rounded bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30 print:hidden"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl text-white border-0 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="font-semibold text-xl">
                {editingShiftId ? "עריכת משמרת" : "הוספת משמרת"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveShift} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">מתאריך</label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 text-white [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">עד תאריך (לרצף ימים)</label>
                    <input 
                      type="date"
                      value={endDateRange}
                      onChange={(e) => setEndDateRange(e.target.value)}
                      min={selectedDate}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 text-white [color-scheme:dark]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">אגף</label>
                    <select 
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 text-white [&>option]:bg-slate-800"
                      required
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">עובד/ת</label>
                    <select 
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 text-white [&>option]:bg-slate-800"
                      required
                    >
                      {EMPLOYEES.map(emp => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">החל גם על ימים נוספים (לשבוע הנוכחי)</label>
                  <div className="flex flex-wrap gap-2">
                    {days.map(day => {
                       const dStr = format(day, "yyyy-MM-dd");
                       if (dStr === selectedDate) return null;
                       return (
                         <label key={dStr} className="flex items-center gap-1.5 bg-white/5 px-2 py-1.5 rounded cursor-pointer hover:bg-white/10 transition-colors border border-white/10">
                           <input 
                             type="checkbox" 
                             checked={additionalDates.includes(dStr)}
                             onChange={(e) => {
                               if (e.target.checked) setAdditionalDates([...additionalDates, dStr]);
                               else setAdditionalDates(additionalDates.filter(d => d !== dStr));
                             }}
                             className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                           />
                           <span className="text-sm text-slate-200">{format(day, "EEEE", { locale: he })}</span>
                         </label>
                       )
                    })}
                  </div>
                </div>
                
                {selectedDept !== "חופשות" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-200">שעת התחלה</label>
                      <input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 text-white [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-200">שעת סיום</label>
                      <input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 text-white [color-scheme:dark]"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">הערות (אופציונלי)</label>
                  <input 
                    placeholder="טקסט חופשי..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="pt-6 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="bg-white/5 text-white border-white/10 hover:bg-white/10 hover:text-white">
                    ביטול
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
                    {isSubmitting ? "שומר..." : "שמור משמרת"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
