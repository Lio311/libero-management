import { useState } from 'react';
import { 
    getBonuses, 
    getEmployeeBonuses, 
    addBonus as addBonusAction, 
    updateBonus as updateBonusAction, 
    deleteBonus as deleteBonusAction,
    getBonusEmployees,
    addBonusEmployee as addBonusEmployeeAction,
    updateBonusEmployee as updateBonusEmployeeAction,
    deleteBonusEmployee as deleteBonusEmployeeAction,
    uploadInvoiceServer
} from '@/app/actions/bonus';

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
        try {
            // Server actions return plain objects, but Date objects need to be converted to strings
            // if we are typing them as string in the client interface.
            const data = await getEmployeeBonuses(employeeId);
            setBonuses(data.map((b: any) => ({
                id: b.id,
                employee_id: b.employeeId,
                sale_date: b.saleDate,
                amount: Number(b.amount),
                invoice_url: b.invoiceUrl,
                status: b.status,
                created_at: b.createdAt.toISOString()
            })));
        } catch (error) {
            console.error("Error fetching employee bonuses:", error);
        }
        setLoading(false);
    };

    // Fetch all bonuses (Admin)
    const fetchAllBonuses = async () => {
        setLoading(true);
        try {
            const data = await getBonuses();
            setBonuses(data.map((b: any) => ({
                id: b.id,
                employee_id: b.employeeId,
                sale_date: b.saleDate,
                amount: Number(b.amount),
                invoice_url: b.invoiceUrl,
                status: b.status,
                created_at: b.createdAt.toISOString(),
                bonus_employees: b.bonus_employees
            })));
        } catch (error) {
            console.error("Error fetching all bonuses:", error);
        }
        setLoading(false);
    };

    // Add new bonus
    const addBonus = async (bonus: Omit<Bonus, 'id' | 'created_at' | 'status'>) => {
        try {
            const newBonus = await addBonusAction(bonus);
            if (newBonus) {
                const formattedBonus = {
                    id: newBonus.id,
                    employee_id: newBonus.employeeId,
                    sale_date: newBonus.saleDate,
                    amount: Number(newBonus.amount),
                    invoice_url: newBonus.invoiceUrl,
                    status: newBonus.status,
                    created_at: newBonus.createdAt.toISOString()
                } as Bonus;
                setBonuses(prev => [formattedBonus, ...prev]);
                return formattedBonus;
            }
        } catch (error) {
            console.error("Error adding bonus:", error);
        }
        return null;
    };

    // Update bonus (General)
    const updateBonus = async (id: number, updates: Partial<Bonus>) => {
        try {
            const updated = await updateBonusAction(id, updates);
            if (updated) {
                const formattedBonus = {
                    id: updated.id,
                    employee_id: updated.employeeId,
                    sale_date: updated.saleDate,
                    amount: Number(updated.amount),
                    invoice_url: updated.invoiceUrl,
                    status: updated.status,
                    created_at: updated.createdAt.toISOString()
                } as Bonus;
                // Preserve the bonus_employees nested object if it exists in the current state
                setBonuses(prev => prev.map(b => b.id === id ? { ...formattedBonus, bonus_employees: b.bonus_employees } : b));
                return formattedBonus;
            }
        } catch (error) {
            console.error("Error updating bonus:", error);
        }
        return null;
    };

    // Delete bonus
    const deleteBonus = async (id: number) => {
        try {
            await deleteBonusAction(id);
            setBonuses(prev => prev.filter(b => b.id !== id));
            return true;
        } catch (error) {
            console.error("Error deleting bonus:", error);
            return false;
        }
    };

    // Manage Employees (Admin)
    const fetchEmployees = async () => {
        try {
            const data = await getBonusEmployees();
            setEmployees(data);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const addEmployee = async (employee: Omit<BonusEmployee, 'id' | 'created_at'>) => {
        try {
            const newEmployee = await addBonusEmployeeAction(employee);
            if (newEmployee) {
                setEmployees(prev => [...prev, newEmployee]);
                return newEmployee;
            }
        } catch (error) {
            console.error("Error adding employee:", error);
        }
        return null;
    };

    const updateEmployee = async (id: number, employee: Partial<BonusEmployee>) => {
        try {
            const updated = await updateBonusEmployeeAction(id, employee);
            if (updated) {
                setEmployees(prev => prev.map(e => e.id === id ? updated : e));
                return updated;
            }
        } catch (error) {
            console.error("Error updating employee:", error);
        }
        return null;
    };

    const deleteEmployee = async (id: number) => {
        try {
            await deleteBonusEmployeeAction(id);
            setEmployees(prev => prev.filter(e => e.id !== id));
            return true;
        } catch (error) {
            console.error("Error deleting employee:", error);
            return false;
        }
    };

    // Storage Upload
    const uploadInvoice = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const url = await uploadInvoiceServer(formData);
            return url;
        } catch (err) {
            console.error('Unexpected upload error:', err);
            alert("שגיאה בהעלאת התמונה. ודא שמשתני הסביבה של Vercel Blob מוגדרים.");
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
