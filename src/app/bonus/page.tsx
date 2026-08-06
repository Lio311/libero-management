"use client";
import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle2, Clock, CreditCard, ChevronLeft, Image as ImageIcon, Edit, Trash2, X, Camera, Upload, Loader2 } from 'lucide-react';
import { useBonus } from '@/hooks/useBonus';
import type { Bonus } from '@/hooks/useBonus';
import { format } from 'date-fns';
import Link from 'next/link';
import clsx from 'clsx';
import { useRef } from 'react';

export default function BonusDashboard() {
    const employeeId = parseInt(localStorage.getItem('userId') || '0');
    const userName = localStorage.getItem('userName') || 'משתמש';
    const { bonuses, loading, fetchEmployeeBonuses, updateBonus, deleteBonus, uploadInvoice } = useBonus();
    
    // Edit Modal State
    const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);
    const [editForm, setEditForm] = useState({ sale_date: '', amount: '', invoice_url: '' as string | null });
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editPreview, setEditPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Delete Confirmation State
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        if (employeeId) {
            fetchEmployeeBonuses(employeeId);
        }
    }, [employeeId]);

    const stats = {
        paid: bonuses.reduce((acc, b) => acc + (b.status === 'paid' ? b.amount : 0), 0),
        pendingPayment: bonuses.reduce((acc, b) => acc + (b.status === 'approved' ? b.amount : 0), 0),
        pendingApproval: bonuses.reduce((acc, b) => acc + (b.status === 'pending' ? b.amount : 0), 0),
        count: bonuses.length
    };

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

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEditClick = (bonus: Bonus) => {
        setEditingBonus(bonus);
        setEditForm({
            sale_date: bonus.sale_date,
            amount: bonus.amount.toString(),
            invoice_url: bonus.invoice_url
        });
        setEditPreview(bonus.invoice_url);
        setEditFile(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setEditFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setEditPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBonus || isSubmitting) return;

        setIsSubmitting(true);
        try {
            let invoiceUrl = editForm.invoice_url;
            if (editFile) {
                const uploadedUrl = await uploadInvoice(editFile);
                if (uploadedUrl) invoiceUrl = uploadedUrl;
            }

            await updateBonus(editingBonus.id, {
                sale_date: editForm.sale_date,
                amount: parseFloat(editForm.amount),
                invoice_url: invoiceUrl
            });
            setEditingBonus(null);
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        await deleteBonus(deletingId);
        setDeletingId(null);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 leading-tight">בונוסים שלי</h1>
                    <p className="text-slate-500 mt-1">שלום {userName}, עקוב אחר הבונוסים שצברת</p>
                </div>
                <Link
                    href="/bonus/add"
                    className="inline-flex items-center justify-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white px-6 py-3 rounded-2xl font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    <span>העלאת בונוס חדש</span>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Paid */}
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <CreditCard size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">סה"כ שולם</p>
                        <p className="text-2xl font-bold text-slate-900">₪{stats.paid.toLocaleString()}</p>
                    </div>
                </div>

                {/* Pending Payment */}
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">ממתין לתשלום</p>
                        <p className="text-2xl font-bold text-slate-900">₪{stats.pendingPayment.toLocaleString()}</p>
                    </div>
                </div>

                {/* Pending Approval */}
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">ממתין לאישור</p>
                        <p className="text-2xl font-bold text-slate-900">₪{stats.pendingApproval.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50">
                    <h2 className="text-lg font-semibold text-slate-900">היסטוריית בונוסים</h2>
                </div>
                
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : bonuses.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <p>עדיין לא העלית בונוסים.</p>
                    </div>
                ) : (
                    <div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                        <th className="px-6 py-4 text-right">תאריך מכירה</th>
                                        <th className="px-6 py-4 text-right">סכום</th>
                                        <th className="px-6 py-4 text-right">חשבונית</th>
                                        <th className="px-6 py-4 text-right">סטטוס</th>
                                        <th className="px-6 py-4 text-left">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {bonuses.map((bonus) => (
                                        <tr key={bonus.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                                                {format(new Date(bonus.sale_date), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                                ₪{Number(bonus.amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {bonus.invoice_url ? (
                                                    <a
                                                        href={bonus.invoice_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm font-medium"
                                                    >
                                                        <ImageIcon size={14} />
                                                        צפה בחשבונית
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-300 text-xs italic">לא צורפה</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(bonus.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {bonus.status === 'pending' && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(bonus)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="עריכה"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingId(bonus.id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="מחיקה"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {bonuses.map((bonus) => (
                                <div key={bonus.id} className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium text-slate-500">
                                            {format(new Date(bonus.sale_date), 'dd/MM/yyyy')}
                                        </div>
                                        {getStatusBadge(bonus.status)}
                                    </div>
                                    <div className="flex items-end justify-between border-t border-slate-50 pt-4">
                                        <div>
                                            <div className="text-xs text-slate-400 mb-1 font-medium">סכום המכירה</div>
                                            <div className="text-xl font-bold text-slate-900">₪{Number(bonus.amount).toLocaleString()}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {bonus.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEditClick(bonus)}
                                                        className="p-3 text-blue-600 bg-blue-50 rounded-xl active:scale-95 transition-all"
                                                    >
                                                        <Edit size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingId(bonus.id)}
                                                        className="p-3 text-red-600 bg-red-50 rounded-xl active:scale-95 transition-all"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </>
                                            )}
                                            {bonus.invoice_url && (
                                                <a
                                                    href={bonus.invoice_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-slate-100 text-slate-600 p-3 rounded-xl active:scale-95 transition-all"
                                                >
                                                    <ImageIcon size={20} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingBonus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" dir="rtl">
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">עריכת בונוס</h2>
                                <p className="text-slate-500 text-sm mt-1">עדכן את פרטי המכירה והחשבונית</p>
                            </div>
                            <button onClick={() => setEditingBonus(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdate} className="p-8 space-y-6 overflow-y-auto">
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
                                            <div className="w-full h-32 relative">
                                                <img src={editPreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <Camera size={24} className="text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Camera size={32} className="text-slate-300" />
                                                <p className="text-sm text-slate-500 font-medium">לחץ להחלפת התמונה</p>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
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
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                    <span>שמור שינויים</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 text-center" dir="rtl">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">מחיקת בונוס?</h2>
                        <p className="text-slate-500 text-sm mb-8">האם אתה בטוח שברצונך למחוק את הבונוס הזה? פעולה זו אינה ניתנת לביטול.</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setDeletingId(null)} 
                                className="px-4 py-3 font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                ביטול
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="px-4 py-3 font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                            >
                                מחק לצמיתות
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
