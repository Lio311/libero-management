"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { Trash2, Plus, Loader2, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    render?: (row: T) => React.ReactNode;
    className?: string;
    editable?: boolean;
    type?: 'text' | 'select' | 'multiselect' | 'date' | 'number' | 'toggle';
    options?: string[];
    align?: 'right' | 'center' | 'left';
    shouldDisable?: (row: any) => boolean;
    optionIcons?: Record<string, React.ReactNode>;
}

interface TableProps<T> {
    title?: string;
    data: T[];
    columns: Column<T>[];
    rowClassName?: (row: T) => string;
    onSave?: (newData: T[]) => Promise<void> | void;
    onAdd?: () => Promise<void> | void;
    onDelete?: (id: number | string) => void;
    onRowClick?: (row: T) => void;
    headerExtra?: React.ReactNode;
    onDataChange?: (newData: T[]) => void;
}

// Format ISO date string (YYYY-MM-DD) to DD/MM/YYYY for display
const formatDateDisplay = (val: string) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return val;
};

// Multi-select dropdown cell
const MultiSelectCell = ({ value, options, onChange, inputBase, iconMap }: {
    value: string; options: string[]; onChange: (val: string) => void; inputBase: string;
    iconMap?: Record<string, React.ReactNode>;
}) => {
    const [open, setOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggle = (opt: string) => {
        const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
        onChange(next.join(', '));
    };

    const handleToggleOpen = () => {
        if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setOpenUpward(window.innerHeight - rect.bottom < 220);
        }
        setOpen(o => !o);
    };

    return (
        <div ref={ref} className={`relative ${iconMap ? 'min-w-[70px]' : 'min-w-[140px]'}`}>
            <button
                type="button"
                onClick={handleToggleOpen}
                className={clsx(inputBase, 'flex items-center justify-between gap-1 text-right')}
            >
                {iconMap ? (
                    <span className="flex items-center gap-0.5 flex-wrap">
                        {selected.length === 0
                            ? <span className="text-gray-400 text-xs">בחר</span>
                            : selected.map((s, i) => <span key={i}>{iconMap[s] ?? <span className="text-xs">{s}</span>}</span>)
                        }
                    </span>
                ) : (
                    <span className="truncate text-right flex-1">
                        {selected.length === 0 ? <span className="text-gray-400">בחר...</span> : selected.join(', ')}
                    </span>
                )}
                <ChevronDown size={13} className={clsx('flex-shrink-0 text-gray-400 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className={clsx(
                    "absolute z-50 right-0 bg-white border border-[#d1d5db] rounded-xl shadow-lg py-1 min-w-full",
                    openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                )}>
                    {options.map(opt => (
                        <label key={opt} className="flex items-center gap-2 px-3 py-2 hover:bg-[#f5f5f7] cursor-pointer text-sm">
                            <input
                                type="checkbox"
                                checked={selected.includes(opt)}
                                onChange={() => toggle(opt)}
                                className="accent-[#0071e3] w-3.5 h-3.5"
                            />
                            {iconMap && <span>{iconMap[opt]}</span>}
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

// Toggle switch cell
const ToggleCell = ({ value, options, onChange }: {
    value: string; options: string[]; onChange: (val: string) => void;
}) => {
    const isFirst = value === options[0];
    const toggle = () => onChange(isFirst ? options[1] : options[0]);

    return (
        <div className="flex justify-center min-w-[80px]">
            <button
                type="button"
                onClick={toggle}
                className={clsx(
                    "relative inline-flex h-5.5 w-[86px] items-center rounded-full transition-all focus:outline-none",
                    isFirst ? "bg-[#0071e3]" : "bg-slate-200"
                )}
            >
                <div
                    className={clsx(
                        "absolute h-4.5 w-4.5 transform rounded-full bg-white transition-all shadow-sm z-10",
                        isFirst ? "right-0.5" : "right-[calc(100%-1.125rem-0.125rem)]"
                    )}
                />
                <span className={clsx(
                    "absolute w-full px-1.5 text-[9px] font-bold transition-all text-center pointer-events-none select-none",
                    isFirst ? "text-white text-right pr-5" : "text-slate-600 text-left pl-5"
                )}>
                    {value}
                </span>
            </button>
        </div>
    );
};

export const Table = <T extends { id: number | string }>({
    title, data, columns, rowClassName, onSave, onAdd, onDelete, onRowClick, headerExtra, onDataChange
}: TableProps<T>) => {
    const [localData, setLocalData] = useState<T[]>(data);
    const [saving, setSaving] = useState(false);
    const [pendingEdit, setPendingEdit] = useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Always-current refs — safe to read from cleanup/unmount without stale closures
    const latestLocalData = useRef<T[]>(data);
    const latestOnSave = useRef(onSave);
    useEffect(() => { latestLocalData.current = localData; }, [localData]);
    useEffect(() => { latestOnSave.current = onSave; }, [onSave]);

    // Flush any pending save on unmount (tab switch, SPA navigation, etc.)
    useEffect(() => {
        return () => {
            if (saveTimerRef.current && latestOnSave.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
                latestOnSave.current(latestLocalData.current);
            }
        };
    }, []); // empty deps — runs once on mount, cleanup runs on unmount

    const [prevData, setPrevData] = useState(data);

    if (data !== prevData) {
        setPrevData(data);
        setLocalData(data);
        if (pendingEdit) {
            setPendingEdit(false);
        }
    }

    const triggerAutoSave = useCallback((newData: T[]) => {
        if (!onSave) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            setSaving(true);
            await onSave(newData);
            setSaving(false);
        }, 800);
    }, [onSave]);

    const handleChange = (id: number | string, field: keyof T, value: string) => {
        const newData = localData.map(row => row.id === id ? { ...row, [field]: value } : row);
        setLocalData(newData);
        onDataChange?.(newData);
        triggerAutoSave(newData);
    };

    // Flush immediately (e.g. on blur) — cancels the debounce timer and saves now
    const flushSave = useCallback(async () => {
        if (!onSave) return;
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        setSaving(true);
        await onSave(localData);
        setSaving(false);
    }, [onSave, localData]);

    const handleAddClick = async () => {
        if (onAdd) {
            setPendingEdit(true);
            await onAdd();
        }
    };

    const inputBase = "w-full bg-[#f5f5f7] border border-[#d1d5db] rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] outline-none transition-all";

    return (
        <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 24px rgba(0,0,0,0.04)' }}>
            {(title || onAdd || headerExtra) && (
                <div className="px-4 py-3 border-b border-black/[0.06] flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex items-center gap-2">
                        {title && <h2 className="text-sm font-semibold text-[#1d1d1f]">{title}</h2>}
                        {saving && (
                            <span className="flex items-center gap-1 text-xs text-[#6d6d6d]">
                                <Loader2 size={12} className="animate-spin" />
                                שומר...
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {headerExtra}
                        {onAdd && (
                            <button onClick={handleAddClick} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0071e3] bg-[#0071e3]/8 hover:bg-[#0071e3]/14 rounded-lg transition-colors">
                                <Plus size={13} /> הוסף
                            </button>
                        )}
                    </div>
                </div>
            )}
            <div className="overflow-x-auto min-h-[350px]">
                <table className="w-full text-sm text-right min-w-[320px] md:min-w-[600px]">
                    <thead>
                        <tr className="border-b border-black/[0.06]">
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={clsx(
                                        "px-3 md:px-4 py-3 text-[10px] md:text-xs font-semibold md:font-medium text-[#6d6d6d] bg-[#fafafa]",
                                        col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right',
                                        col.className
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {onDelete && <th className="px-3 py-3 bg-[#fafafa] w-10" />}
                        </tr>
                    </thead>
                    <tbody className="">
                        {localData.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick?.(row)}
                                className={clsx(
                                    "border-b border-black/[0.04] transition-colors last:border-0",
                                    "hover:bg-[#f5f5f7]/70",
                                    rowClassName?.(row),
                                    onRowClick && "cursor-pointer"
                                )}
                            >
                                {columns.map((col, j) => (
                                    <td
                                        key={j}
                                        className={clsx(
                                            "px-2 md:px-4 py-2.5 text-[#1d1d1f]",
                                            col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : '',
                                            col.className
                                        )}
                                    >
                                        {col.editable && typeof col.accessor === 'string' && !col.shouldDisable?.(row) ? (
                                            col.type === 'select' ? (
                                                <Select
                                                    value={String(row[col.accessor as keyof T] ?? '')}
                                                    onValueChange={(val) => handleChange(row.id, col.accessor as keyof T, val || '')}
                                                >
                                                    <SelectTrigger className={inputBase} onBlur={flushSave}>
                                                        <SelectValue placeholder="בחר..." />
                                                    </SelectTrigger>
                                                    <SelectContent alignItemWithTrigger={false}>
                                                        {col.options?.map(opt => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : col.type === 'multiselect' ? (
                                                <MultiSelectCell
                                                    value={String(row[col.accessor as keyof T] ?? '')}
                                                    options={col.options ?? []}
                                                    onChange={(val) => { handleChange(row.id, col.accessor as keyof T, val); }}
                                                    inputBase={inputBase}
                                                    iconMap={col.optionIcons}
                                                />
                                            ) : col.type === 'toggle' ? (
                                                <ToggleCell
                                                    value={String(row[col.accessor as keyof T] ?? '')}
                                                    options={col.options ?? []}
                                                    onChange={(val) => {
                                                        const newData = localData.map(r => r.id === row.id ? { ...r, [col.accessor as string]: val } : r);
                                                        setLocalData(newData);
                                                        onDataChange?.(newData);
                                                        // Save immediately with fresh newData (avoids stale closure in flushSave)
                                                        if (onSave) {
                                                            if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
                                                            setSaving(true);
                                                            Promise.resolve(onSave(newData)).finally(() => setSaving(false));
                                                        }
                                                    }}
                                                />
                                            ) : col.type === 'date' ? (
                                                <div
                                                    className="relative min-w-[110px] cursor-pointer"
                                                    onClick={(e) => {
                                                        const inp = (e.currentTarget as HTMLElement).querySelector('input[type="date"]') as HTMLInputElement & { showPicker?: () => void };
                                                        inp?.showPicker ? inp.showPicker() : inp?.click();
                                                    }}
                                                >
                                                    <div className={clsx(inputBase, "text-center pointer-events-none select-none")}>
                                                        {formatDateDisplay(String(row[col.accessor as keyof T] ?? '')) || <span className="text-gray-400">dd/mm/yyyy</span>}
                                                    </div>
                                                    <input
                                                        type="date"
                                                        value={String(row[col.accessor as keyof T] ?? '')}
                                                        onChange={(e) => handleChange(row.id, col.accessor as keyof T, e.target.value)}
                                                        onBlur={flushSave}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                                </div>
                                            ) : (
                                                <input
                                                    type={col.type === 'number' ? 'number' : 'text'}
                                                    value={String(row[col.accessor as keyof T] ?? '')}
                                                    onChange={(e) => handleChange(row.id, col.accessor as keyof T, e.target.value)}
                                                    onBlur={flushSave}
                                                    className={inputBase}
                                                />
                                            )
                                        ) : col.editable && typeof col.accessor === 'string' && col.shouldDisable?.(row) ? (
                                            <span className="text-gray-300 select-none">—</span>
                                        ) : (
                                            col.render
                                                ? col.render(row)
                                                : typeof col.accessor === 'function'
                                                    ? col.accessor(row)
                                                    : row[col.accessor] as React.ReactNode
                                        )}
                                    </td>
                                ))}
                                {onDelete && (
                                    <td className="px-3 py-2.5 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('האם אתה בטוח שברצונך למחוק שורה זו?')) onDelete(row.id);
                                            }}
                                            className="text-[#1d1d1f]/20 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
