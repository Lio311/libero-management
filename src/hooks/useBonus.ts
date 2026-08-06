import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Bonus {
    id: number;
    employee_id: number;
    sale_date: string;
    amount: number;
    invoice_url: string | null;
    status: 'pending' | 'approved' | 'paid';
    created_at: string;
    bonus_employees?: {
        full_name: string;
        username: string;
    };
}

export interface BonusEmployee {
    id: number;
    username: string;
    full_name: string;
    password?: string;
    created_at: string;
}

export function useBonus() {
    const [bonuses, setBonuses] = useState<Bonus[]>([]);
    const [employees, setEmployees] = useState<BonusEmployee[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch bonuses for a specific employee
    const fetchEmployeeBonuses = async (employeeId: number) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bonuses')
            .select('*')
            .eq('employee_id', employeeId)
            .order('sale_date', { ascending: false });

        if (!error && data) setBonuses(data);
        setLoading(false);
    };

    // Fetch all bonuses (Admin)
    const fetchAllBonuses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bonuses')
            .select('*, bonus_employees(full_name, username)')
            .order('created_at', { ascending: false });

        if (!error && data) setBonuses(data);
        setLoading(false);
    };

    // Add new bonus
    const addBonus = async (bonus: Omit<Bonus, 'id' | 'created_at' | 'status'>) => {
        const { data, error } = await supabase
            .from('bonuses')
            .insert([{ ...bonus, status: 'pending' }])
            .select();
        
        if (!error && data) {
            setBonuses(prev => [data[0], ...prev]);
            return data[0];
        }
        return null;
    };

    // Update bonus (General)
    const updateBonus = async (id: number, updates: Partial<Bonus>) => {
        const { data, error } = await supabase
            .from('bonuses')
            .update(updates)
            .eq('id', id)
            .select();
        
        if (!error && data) {
            setBonuses(prev => prev.map(b => b.id === id ? data[0] : b));
            return data[0];
        }
        return null;
    };

    // Delete bonus
    const deleteBonus = async (id: number) => {
        const { error } = await supabase
            .from('bonuses')
            .delete()
            .eq('id', id);
        
        if (!error) {
            setBonuses(prev => prev.filter(b => b.id !== id));
            return true;
        }
        return false;
    };

    // Manage Employees (Admin)
    const fetchEmployees = async () => {
        const { data, error } = await supabase
            .from('bonus_employees')
            .select('*')
            .order('full_name');
        
        if (!error && data) setEmployees(data);
    };

    const addEmployee = async (employee: Omit<BonusEmployee, 'id' | 'created_at'>) => {
        const { data, error } = await supabase
            .from('bonus_employees')
            .insert([employee])
            .select();
        
        if (!error && data) {
            setEmployees(prev => [...prev, data[0]]);
            return data[0];
        }
        return null;
    };

    const updateEmployee = async (id: number, employee: Partial<BonusEmployee>) => {
        const { data, error } = await supabase
            .from('bonus_employees')
            .update(employee)
            .eq('id', id)
            .select();
        
        if (!error && data) {
            setEmployees(prev => prev.map(e => e.id === id ? data[0] : e));
            return data[0];
        }
        return null;
    };

    const deleteEmployee = async (id: number) => {
        const { error } = await supabase
            .from('bonus_employees')
            .delete()
            .eq('id', id);
        
        if (!error) {
            setEmployees(prev => prev.filter(e => e.id !== id));
            return true;
        }
        return false;
    };

    // Storage Upload
    const uploadInvoice = async (file: File) => {
        try {
            // Create a safe filename to avoid encoding issues (e.g., Hebrew characters)
            const fileExt = file.name.split('.').pop() || 'png';
            const safeRandomName = Math.random().toString(36).substring(2, 10);
            const fileName = `${Date.now()}-${safeRandomName}.${fileExt}`;
            
            const { data, error } = await supabase.storage
                .from('bonus-invoices')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) {
                console.error('Upload error (Make sure "bonus-invoices" bucket exists and is public!):', error);
                alert("שגיאה בהעלאת התמונה. ייתכן שתיקיית האחסון לא הוגדרה כראוי ב-Supabase.");
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('bonus-invoices')
                .getPublicUrl(fileName);
            
            return publicUrl;
        } catch (err) {
            console.error('Unexpected upload error:', err);
            return null;
        }
    };

    return {
        bonuses,
        employees,
        loading,
        fetchEmployeeBonuses,
        fetchAllBonuses,
        addBonus,
        updateBonus,
        deleteBonus,
        fetchEmployees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        uploadInvoice
    };
}
