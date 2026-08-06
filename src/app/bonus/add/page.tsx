"use client";
import React, { useState, useRef } from 'react';
import { Camera, Upload, ArrowRight, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { useBonus } from '@/hooks/useBonus';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function AddBonusPage() {
    const router = useRouter();
    const employeeId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('userId') || '0') : 0;
    const { uploadInvoice, addBonus } = useBonus();

    const [saleDate, setSaleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isSubmitting) return;

        setIsSubmitting(true);
        try {
            let invoiceUrl = null;
            if (file) {
                invoiceUrl = await uploadInvoice(file);
                if (!invoiceUrl) {
                    setIsSubmitting(false);
                    return; // Prevent adding bonus if upload fails
                }
            }

            await addBonus({
                employee_id: employeeId,
                sale_date: saleDate,
                amount: parseFloat(amount),
                invoice_url: invoiceUrl
            });

            setSuccess(true);
            setTimeout(() => router.push('/bonus'), 2000);
        } catch (error) {
            console.error('Submission failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle2 size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">הבונוס הועלה בהצלחה!</h1>
                <p className="text-slate-500">הנתונים נשלחו לבדיקת מנהל. מעביר אותך חזרה...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8" dir="rtl">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors"
            >
                <ArrowRight size={20} />
                <span>חזרה ללוח הבונוסים</span>
            </button>

            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-dashed border-slate-200 shadow-sm">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">העלאת בונוס חדש</h1>
                    <p className="text-slate-500 mt-1">מלא את פרטי המכירה וצרף חשבונית</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        {/* Sale Date */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">תאריך מכירה</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                    className="w-full px-5 py-4 pr-12 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-medium appearance-none"
                                    required
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Clock size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">סכום המכירה (ברוטו)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-5 py-4 pl-12 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-bold"
                                    required
                                />
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₪</div>
                            </div>
                        </div>

                        {/* Invoice Attachment */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">צילום חשבונית</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer overflow-hidden"
                            >
                                {preview ? (
                                    <div className="absolute inset-0 z-10 p-2">
                                        <img src={preview} alt="חשבונית" className="w-full h-full object-contain rounded-xl" />
                                        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur rounded-lg p-2 shadow">
                                            <Camera size={16} className="text-blue-600" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            <Camera size={32} className="text-blue-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-700 font-bold">לחץ כדי לצלם או להעלות</p>
                                            <p className="text-slate-400 text-xs mt-1">תמונה, PDF או צילום מסך</p>
                                        </div>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    capture="environment" // Mobile camera trigger
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !amount}
                        className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-5 px-6 rounded-2xl text-xl font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <span>מעלה נתונים...</span>
                                <Loader2 size={24} className="animate-spin" />
                            </>
                        ) : (
                            <>
                                <span>שמור ושלח לאישור</span>
                                <Upload size={24} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
