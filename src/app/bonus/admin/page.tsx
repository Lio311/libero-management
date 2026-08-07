"use client";
import React, { useEffect, useState, useRef } from 'react';
import { 
    Users, 
    CreditCard, 
    CheckCircle2, 
    Clock, 
    Search, 
    Plus, 
    MoreVertical, 
    Trash2, 
    Edit, 
    ExternalLink,
    Filter,
    UserPlus,
    X,
    Image as ImageIcon
} from 'lucide-react';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useBonus } from '@/hooks/useBonus';
import type { Bonus, BonusEmployee } from '@/hooks/useBonus';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function AdminBonusPage() {
    const { 
        bonuses, 
        employees, 
        loading, 
        fetchAllBonuses, 
        updateBonus, 
        deleteBonus,
        uploadInvoice,
        fetchEmployees, 
        addEmployee, 
        updateEmployee,
        deleteEmployee 
    } = useBonus();
    
    const [activeTab, setActiveTab] = useState<'review' | 'employees'>('review');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Modal states
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<BonusEmployee | null>(null);
    const [employeeForm, setEmployeeForm] = useState({ username: '', full_name: '', password: '' });
    
    
    // Bonus delete/edit states
    const [bonusToDelete, setBonusToDelete] = useState<number | null>(null);
    const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);
    const [editForm, setEditForm] = useState({ sale_date: '', amount: '' });
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editPreview, setEditPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchAllBonuses();
        fetchEmployees();
    }, []);

    const filteredBonuses = bonuses.filter(b => {
        const matchesSearch = b.bonus_employees?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             b.bonus_employees?.username.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: Bonus['status']) => {
        switch (status) {
            case 'pending':
                return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"><Clock size={12} /> ממתין לאישור</span>;
            case 'approved':
                return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"><CheckCircle2 size={12} /> ממתין לתשלום</span>;
            case 'paid':
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"><CreditCard size={12} /> שולם</span>;
        }
    };

    const handleSaveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEmployee) {
            const success = await updateEmployee(editingEmployee.id, employeeForm);
            if (success) {
                setShowAddEmployee(false);
                setEditingEmployee(null);
                setEmployeeForm({ username: '', full_name: '', password: '' });
            }
        } else {
            const success = await addEmployee(employeeForm);
            if (success) {
                setShowAddEmployee(false);
                setEmployeeForm({ username: '', full_name: '', password: '' });
            }
        }
    };

    const openEditModal = (emp: BonusEmployee) => {
        setEditingEmployee(emp);
        setEmployeeForm({ 
            username: emp.username, 
            full_name: emp.full_name, 
            password: emp.password || '' 
        });
        setShowAddEmployee(true);
    };

    const calculateEmployeeTotal = (empId: number) => {
        return bonuses
            .filter(b => b.employee_id === empId && b.status === 'paid')
            .reduce((sum, b) => sum + Number(b.amount), 0);
    };

    const handleDeleteBonus = async () => {
        if (!bonusToDelete) return;
        const success = await deleteBonus(bonusToDelete);
        if (success) {
            setBonusToDelete(null);
        }
    };

    const handleEditBonusClick = (bonus: Bonus) => {
        setEditingBonus(bonus);
        setEditForm({
            sale_date: bonus.sale_date,
            amount: bonus.amount.toString()
        });
        setEditPreview(bonus.invoice_url);
        setEditFile(null);
    };

    const handleBonusFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setEditFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setEditPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpdateBonus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBonus || isSubmitting) return;

        setIsSubmitting(true);
        try {
            let invoiceUrl = editingBonus.invoice_url;
            if (editFile) {
                // @ts-ignore
                const uploadedUrl = await uploadInvoice(editFile);
                if (uploadedUrl) invoiceUrl = uploadedUrl;
            }

            const success = await updateBonus(editingBonus.id, {
                sale_date: editForm.sale_date,
                amount: parseFloat(editForm.amount),
                invoice_url: invoiceUrl
            });
            
            if (success) {
                setEditingBonus(null);
            }
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">ניהול בונוסים עובדים</h1>
                    <p className="text-slate-500 mt-2">מעקב, אישור וניהול תשלומי בונוס לכלל הצוות</p>
                </div>
                
                <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200 w-fit">
                    <button
                        onClick={() => setActiveTab('review')}
                        className={clsx(
                            "px-6 py-2.5 rounded-xl transition-all text-sm font-semibold flex items-center gap-2",
                            activeTab === 'review' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <CreditCard size={18} />
                        סקירת בונוסים
                    </button>
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={clsx(
                            "px-6 py-2.5 rounded-xl transition-all text-sm font-semibold flex items-center gap-2",
                            activeTab === 'employees' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Users size={18} />
                        ניהול עובדים
                    </button>
                </div>
            </div>

            {activeTab === 'review' ? (
                /* Review Tab Content */
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex-1 relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="חפש לפי שם עובד..."
                                className="w-full pr-12 pl-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-slate-400" />
                            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                                <SelectTrigger className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none min-w-[140px]">
                                    <SelectValue placeholder="כל הסטטוסים" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="all">כל הסטטוסים</SelectItem>
                                    <SelectItem value="pending">ממתין לאישור</SelectItem>
                                    <SelectItem value="approved">ממתין לתשלום</SelectItem>
                                    <SelectItem value="paid">שולם</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-right border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                        <th className="px-6 py-4">עובד</th>
                                        <th className="px-6 py-4">תאריך מכירה</th>
                                        <th className="px-6 py-4">סכום</th>
                                        <th className="px-6 py-4">חשבונית</th>
                                        <th className="px-6 py-4 text-center">סטטוס ופעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredBonuses.map((bonus) => (
                                        <tr key={bonus.id} className="hover:bg-slate-50/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                                        {bonus.bonus_employees?.full_name.charAt(0)}
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900">{bonus.bonus_employees?.full_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{format(new Date(bonus.sale_date), 'dd/MM/yyyy')}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">₪{Number(bonus.amount).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                {bonus.invoice_url && (
                                                    <a href={bonus.invoice_url} target="_blank" rel="noopener noreferrer" 
                                                       className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm">
                                                        <ImageIcon size={14} /> צפה
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-4">
                                                    <Select
                                                        value={bonus.status}
                                                        onValueChange={(val) => updateBonus(bonus.id, { status: val as Bonus['status'] })}
                                                    >
                                                        <SelectTrigger
                                                            className={clsx(
                                                                "border text-sm font-semibold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none w-32 cursor-pointer transition-colors text-center shadow-sm",
                                                                bonus.status === 'pending' ? "bg-amber-50 border-amber-200 text-amber-700 font-bold" :
                                                                bonus.status === 'approved' ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" :
                                                                "bg-blue-50 border-blue-200 text-blue-700 font-bold"
                                                            )}
                                                        >
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent align="center">
                                                            <SelectItem value="pending">ממתין לאישור</SelectItem>
                                                            <SelectItem value="approved">ממתין לתשלום</SelectItem>
                                                            <SelectItem value="paid">שולם</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    
                                                    <div className="flex items-center gap-1 border-r border-slate-100 pr-4">
                                                        <button
                                                            onClick={() => handleEditBonusClick(bonus)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                                            title="ערוך בונוס"
                                                        >
                                                            <Edit size={16} />
                                                            <span className="text-xs font-semibold">ערוך</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setBonusToDelete(bonus.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 ml-2"
                                                            title="מחק בונוס"
                                                        >
                                                            <Trash2 size={16} />
                                                            <span className="text-xs font-semibold">מחק</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Action column removed and merged into status above */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {filteredBonuses.map((bonus) => (
                                <div key={bonus.id} className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                                {bonus.bonus_employees?.full_name.charAt(0)}
                                            </div>
                                            <div className="text-sm font-semibold text-slate-900">{bonus.bonus_employees?.full_name}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <span>תאריך: {format(new Date(bonus.sale_date), 'dd/MM/yyyy')}</span>
                                        <span className="font-bold text-slate-900">₪{Number(bonus.amount).toLocaleString()}</span>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        {bonus.invoice_url && (
                                            <a href={bonus.invoice_url} target="_blank" rel="noopener noreferrer" 
                                               className="flex-1 bg-slate-50 text-slate-600 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                                                <ImageIcon size={16} /> שובר
                                            </a>
                                        )}
                                        <div className="flex items-center gap-2 flex-1">
                                            <Select
                                                value={bonus.status}
                                                onValueChange={(val) => updateBonus(bonus.id, { status: val as Bonus['status'] })}
                                            >
                                                <SelectTrigger
                                                    className={clsx(
                                                        "border text-sm font-semibold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-colors w-full",
                                                        bonus.status === 'pending' ? "bg-amber-50 border-amber-200 text-amber-700" :
                                                        bonus.status === 'approved' ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                                        "bg-blue-50 border-blue-200 text-blue-700"
                                                    )}
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent align="center">
                                                    <SelectItem value="pending">ממתין לאישור</SelectItem>
                                                    <SelectItem value="approved">ממתין לתשלום</SelectItem>
                                                    <SelectItem value="paid">שולם</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditBonusClick(bonus)}
                                                className="p-2.5 text-blue-500 bg-blue-50 rounded-xl active:scale-95 transition-all"
                                                title="ערוך בונוס"
                                            >
                                                <Edit size={20} />
                                            </button>
                                            <button
                                                onClick={() => setBonusToDelete(bonus.id)}
                                                className="p-2.5 text-red-500 bg-red-50 rounded-xl active:scale-95 transition-all"
                                                title="מחק בונוס"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* Employees Tab Content */
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setShowAddEmployee(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
                        >
                            <UserPlus size={18} /> הוספת עובד חדש
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {employees.map((emp) => (
                            <div key={emp.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-semibold shadow-inner">
                                        {emp.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">{emp.full_name}</h3>
                                        <p className="text-sm text-slate-500 italic">@{emp.username}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="text-slate-500 text-xs font-medium uppercase">סה"כ שולם:</div>
                                    <div className="text-xl font-bold text-emerald-600">₪{calculateEmployeeTotal(emp.id).toLocaleString()}</div>
                                </div>
                                <div className="absolute top-4 left-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => openEditModal(emp)}
                                        className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50"
                                        title="ערוך פרטי עובד"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteEmployee(emp.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                                        title="מחק עובד"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Employee Modal */}
            {showAddEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" dir="rtl">
                        <div className="px-8 pt-8 pb-4">
                            <h2 className="text-2xl font-bold text-slate-900">{editingEmployee ? 'עריכת עובד' : 'הוספת עובד'}</h2>
                            <p className="text-slate-500 text-sm mt-1">
                                {editingEmployee ? 'עדכן את פרטי הגישה של העובד' : 'צור חשבון חדש לעובד למערכת הבונוסים'}
                            </p>
                        </div>
                        <form onSubmit={handleSaveEmployee} className="p-8 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 mr-1">שם מלא</label>
                                <input
                                    type="text"
                                    required
                                    value={employeeForm.full_name}
                                    onChange={e => setEmployeeForm({...employeeForm, full_name: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="ישראל ישראלי"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 mr-1">שם משתמש</label>
                                <input
                                    type="text"
                                    required
                                    value={employeeForm.username}
                                    onChange={e => setEmployeeForm({...employeeForm, username: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="israel123"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 mr-1">סיסמה</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={employeeForm.password}
                                        onChange={e => setEmployeeForm({...employeeForm, password: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowAddEmployee(false);
                                        setEditingEmployee(null);
                                        setEmployeeForm({ username: '', full_name: '', password: '' });
                                    }} 
                                    className="flex-1 px-4 py-3 font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    ביטול
                                </button>
                                <button type="submit" className="flex-1 px-4 py-3 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                    {editingEmployee ? 'עדכן עובד' : 'הוסף עובד'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bonus Delete Confirmation Modal */}
            {bonusToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" dir="rtl">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">מחיקת בונוס</h2>
                            <p className="text-slate-500">האם אתה בטוח שברצונך למחוק את הבונוס הזה? פעולה זו אינה ניתנת לביטול.</p>
                            
                            <div className="flex gap-3 mt-8">
                                <button 
                                    onClick={() => setBonusToDelete(null)}
                                    className="flex-1 px-4 py-3 font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    ביטול
                                </button>
                                <button 
                                    onClick={handleDeleteBonus}
                                    className="flex-1 px-4 py-3 font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                >
                                    מחק לצמיתות
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Bonus Modal */}
            {editingBonus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" dir="rtl">
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">עריכת בונוס</h2>
                                <p className="text-slate-500 text-sm mt-1">עדכן את פרטי המכירה והחשבונית עבור {editingBonus.bonus_employees?.full_name}</p>
                            </div>
                            <button onClick={() => setEditingBonus(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateBonus} className="p-8 space-y-6 overflow-y-auto">
                            <div className="space-y-4">
                                {/* Sale Date */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 mr-1">תאריך מכירה</label>
                                    <input
                                        type="date"
                                        required
                                        value={editForm.sale_date}
                                        onChange={e => setEditForm({...editForm, sale_date: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    />
                                </div>

                                {/* Amount */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 mr-1">סכום המכירה (₪)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={editForm.amount}
                                        onChange={e => setEditForm({...editForm, amount: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* Invoice Upload */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 mr-1">חשבונית / שובר</label>
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer overflow-hidden min-h-[150px]"
                                    >
                                        {editPreview ? (
                                            <div className="w-full h-32 relative text-center">
                                                <img src={editPreview} alt="Preview" className="h-full mx-auto object-contain rounded-lg shadow-sm" />
                                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                                    <Plus size={24} className="text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <ImageIcon size={32} className="text-slate-300" />
                                                <p className="text-sm text-slate-500 font-medium">לחץ להחלפת התמונה</p>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleBonusFileChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-50">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingBonus(null)} 
                                    className="flex-1 px-4 py-3 font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    ביטול
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
                                    <span>שמור שינויים</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
