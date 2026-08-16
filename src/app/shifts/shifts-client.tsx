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
const EMPLOYEES = ["ליאור", "רותי", "אור דוד", "צדוק", "אבישי", "אריאל", "ישראל", "טל", "יוליה"];

const EMPLOYEE_COLORS: Record<string, string> = {
  "ליאור": "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  "רותי": "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  "אור דוד": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  "צדוק": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  "אבישי": "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  "אריאל": "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  "ישראל": "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  "טל": "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  "יוליה": "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
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
      <div className="flex items-center justify-between glass-panel p-4 rounded-xl print:hidden">
        <div className="text-lg font-semibold">
          {format(weekStart, "dd/MM/yyyy")} - {format(weekEnd, "dd/MM/yyyy")}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCopyPreviousWeek} disabled={isSubmitting} className="mr-2 gap-2">
            <Copy className="h-4 w-4" />
            שכפל שבוע קודם
          </Button>
          <Button variant="secondary" onClick={() => window.print()} className="mr-4 gap-2">
            שמור כ-PDF / הדפס
          </Button>
          <Button variant="outline" onClick={handleToday}>
            היום
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block mb-4 text-center">
        <h2 className="text-2xl font-bold">לוח משמרות שבועי</h2>
        <p className="text-lg">
          {format(weekStart, "dd/MM/yyyy")} - {format(weekEnd, "dd/MM/yyyy")}
        </p>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto print:overflow-visible">
        <div className="min-w-[800px] print:min-w-0 border rounded-xl overflow-hidden bg-card text-card-foreground">
          {/* Header Row (Days) */}
          <div className="grid grid-cols-8 border-b bg-muted/50 print:bg-gray-100">
            <div className="p-3 font-semibold flex items-center justify-center border-l">
              אגף
            </div>
            {days.map((day) => {
              const { isNoWork, label } = getHolidayInfo(day);
              const isCurrentDay = isToday(day);
              
              return (
              <div key={day.toISOString()} className={`p-3 text-center font-medium border-l last:border-0 flex flex-col items-center justify-center relative ${isNoWork ? 'bg-muted/80 dark:bg-muted/40' : ''} ${isCurrentDay ? 'bg-foreground/5' : ''}`}>
                {isCurrentDay && <div className="absolute top-0 left-0 right-0 h-1 bg-foreground"></div>}
                <div className={isNoWork ? 'text-primary' : (isCurrentDay ? 'text-foreground font-bold' : '')}>{format(day, "EEEE", { locale: he })}</div>
                <div className={`text-sm ${isNoWork ? 'text-primary/80' : (isCurrentDay ? 'text-foreground font-bold' : 'text-muted-foreground')}`}>{format(day, "dd/MM")}</div>
                {label && <div className="text-xs text-primary font-bold mt-1 bg-primary/10 px-2 py-0.5 rounded-full">{label}</div>}
              </div>
            )})}
          </div>

          {/* Body Rows (Departments) */}
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            DEPARTMENTS.map((dept) => (
              <div key={dept} className="grid grid-cols-8 border-b last:border-0">
                {/* Department Name */}
                <div className="p-3 font-semibold flex items-center justify-center border-l bg-muted/20">
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
                      className={`p-2 border-l last:border-0 min-h-[100px] relative group ${isNoWork ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_20px)]' : ''} ${isCurrentDay ? 'bg-foreground/5 ring-1 ring-inset ring-foreground/20' : ''}`}
                      onDragOver={isCellBlocked ? undefined : handleDragOver}
                      onDrop={isCellBlocked ? undefined : ((e) => handleDrop(e, dateStr, dept))}
                    >
                      <div className="space-y-2 mb-6">
                        {dayShifts.map(shift => {
                          const employeeColor = EMPLOYEE_COLORS[shift.employeeName] || "bg-muted text-foreground";
                          return (
                          <div 
                            key={shift.id}
                            draggable={!isCellBlocked}
                            onDragStart={isCellBlocked ? undefined : ((e) => handleDragStart(e, shift.id))}
                            onClick={() => openEditModal(shift)}
                            className={`p-2 rounded text-sm relative group/shift cursor-pointer shadow-sm ${employeeColor} hover:opacity-90 active:scale-95 transition-all`}
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
                                className="absolute top-1 left-7 p-1 bg-background/80 rounded opacity-0 group-hover/shift:opacity-100 transition-opacity hover:text-primary print:hidden"
                                title="שכפל משמרת"
                              >
                                <Copy className="h-3 w-3 text-foreground" />
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={(e) => handleDeleteShift(shift.id, e)}
                              className="absolute top-1 left-1 p-1 bg-background/80 rounded opacity-0 group-hover/shift:opacity-100 transition-opacity hover:text-destructive print:hidden"
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
                          className="absolute bottom-2 right-2 left-2 flex items-center justify-center py-1 rounded bg-secondary/50 text-secondary-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary print:hidden"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-lg border-0">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">
                {editingShiftId ? "עריכת משמרת" : "הוספת משמרת"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-muted rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardContent className="p-4">
              <form onSubmit={handleSaveShift} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">מתאריך</label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">עד תאריך (לרצף ימים)</label>
                    <input 
                      type="date"
                      value={endDateRange}
                      onChange={(e) => setEndDateRange(e.target.value)}
                      min={selectedDate}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">אגף</label>
                    <select 
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">עובד/ת</label>
                    <select 
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      {EMPLOYEES.map(emp => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">החל גם על ימים נוספים (לשבוע הנוכחי)</label>
                  <div className="flex flex-wrap gap-2">
                    {days.map(day => {
                       const dStr = format(day, "yyyy-MM-dd");
                       if (dStr === selectedDate) return null;
                       return (
                         <label key={dStr} className="flex items-center gap-1.5 bg-muted/50 px-2 py-1.5 rounded cursor-pointer hover:bg-muted transition-colors border">
                           <input 
                             type="checkbox" 
                             checked={additionalDates.includes(dStr)}
                             onChange={(e) => {
                               if (e.target.checked) setAdditionalDates([...additionalDates, dStr]);
                               else setAdditionalDates(additionalDates.filter(d => d !== dStr));
                             }}
                             className="rounded border-input text-primary focus:ring-primary"
                           />
                           <span className="text-sm">{format(day, "EEEE", { locale: he })}</span>
                         </label>
                       )
                    })}
                  </div>
                </div>
                
                {selectedDept !== "חופשות" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">שעת התחלה</label>
                      <Input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">שעת סיום</label>
                      <Input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">הערות (אופציונלי)</label>
                  <Input 
                    placeholder="טקסט חופשי..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    ביטול
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "שומר..." : "שמור משמרת"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
