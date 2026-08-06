"use server";

import { db } from "@/lib/db";
import { bonuses, bonusEmployees } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

export async function getBonuses() {
    try {
        const data = await db.query.bonuses.findMany({
            orderBy: [desc(bonuses.createdAt)],
            with: {
                employee: {
                    columns: {
                        fullName: true,
                        username: true,
                    },
                },
            },
        });
        
        // Transform the result slightly to match what the client expects (bonus_employees -> employee)
        // Since we named the relation "employee", the data is nested under .employee
        // We map it to .bonus_employees to keep backward compatibility with the old client code
        // Or better yet, we just change the client to read from .employee
        return data.map(bonus => ({
            ...bonus,
            bonus_employees: bonus.employee ? {
                full_name: bonus.employee.fullName,
                username: bonus.employee.username
            } : undefined
        }));
    } catch (error) {
        console.error("Failed to fetch bonuses:", error);
        throw new Error("Failed to fetch bonuses");
    }
}

export async function getEmployeeBonuses(employeeId: number) {
    try {
        return await db.query.bonuses.findMany({
            where: eq(bonuses.employeeId, employeeId),
            orderBy: [desc(bonuses.saleDate)],
        });
    } catch (error) {
        console.error("Failed to fetch employee bonuses:", error);
        throw new Error("Failed to fetch employee bonuses");
    }
}

export async function addBonus(bonusData: any) {
    try {
        const result = await db.insert(bonuses).values({
            employeeId: bonusData.employee_id,
            saleDate: bonusData.sale_date,
            amount: bonusData.amount,
            invoiceUrl: bonusData.invoice_url,
            status: "pending",
        }).returning();
        
        revalidatePath("/bonus");
        revalidatePath("/bonus/admin");
        return result[0];
    } catch (error) {
        console.error("Failed to add bonus:", error);
        throw new Error("Failed to add bonus");
    }
}

export async function updateBonus(id: number, updates: any) {
    try {
        const dbUpdates: any = {};
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
        if (updates.invoice_url !== undefined) dbUpdates.invoiceUrl = updates.invoice_url;
        
        const result = await db.update(bonuses)
            .set(dbUpdates)
            .where(eq(bonuses.id, id))
            .returning();
            
        revalidatePath("/bonus/admin");
        return result[0];
    } catch (error) {
        console.error("Failed to update bonus:", error);
        throw new Error("Failed to update bonus");
    }
}

export async function deleteBonus(id: number) {
    try {
        await db.delete(bonuses).where(eq(bonuses.id, id));
        revalidatePath("/bonus");
        revalidatePath("/bonus/admin");
        return true;
    } catch (error) {
        console.error("Failed to delete bonus:", error);
        throw new Error("Failed to delete bonus");
    }
}

// ----------------------------------------------------
// Employees
// ----------------------------------------------------

export async function getBonusEmployees() {
    try {
        const data = await db.query.bonusEmployees.findMany({
            orderBy: (employees, { asc }) => [asc(employees.fullName)],
        });
        
        // Transform camelCase back to snake_case for the frontend compatibility
        return data.map(emp => ({
            id: emp.id,
            username: emp.username,
            full_name: emp.fullName,
            password: emp.password,
            created_at: emp.createdAt.toISOString()
        }));
    } catch (error) {
        console.error("Failed to fetch employees:", error);
        throw new Error("Failed to fetch employees");
    }
}

export async function addBonusEmployee(employee: any) {
    try {
        const result = await db.insert(bonusEmployees).values({
            username: employee.username,
            fullName: employee.full_name,
            password: employee.password,
        }).returning();
        
        revalidatePath("/bonus/admin");
        return {
            id: result[0].id,
            username: result[0].username,
            full_name: result[0].fullName,
            password: result[0].password,
            created_at: result[0].createdAt.toISOString()
        };
    } catch (error) {
        console.error("Failed to add employee:", error);
        throw new Error("Failed to add employee");
    }
}

export async function updateBonusEmployee(id: number, employeeUpdates: any) {
    try {
        const dbUpdates: any = {};
        if (employeeUpdates.username !== undefined) dbUpdates.username = employeeUpdates.username;
        if (employeeUpdates.full_name !== undefined) dbUpdates.fullName = employeeUpdates.full_name;
        if (employeeUpdates.password !== undefined) dbUpdates.password = employeeUpdates.password;
        
        const result = await db.update(bonusEmployees)
            .set(dbUpdates)
            .where(eq(bonusEmployees.id, id))
            .returning();
            
        revalidatePath("/bonus/admin");
        return {
            id: result[0].id,
            username: result[0].username,
            full_name: result[0].fullName,
            password: result[0].password,
            created_at: result[0].createdAt.toISOString()
        };
    } catch (error) {
        console.error("Failed to update employee:", error);
        throw new Error("Failed to update employee");
    }
}

export async function deleteBonusEmployee(id: number) {
    try {
        await db.delete(bonusEmployees).where(eq(bonusEmployees.id, id));
        revalidatePath("/bonus/admin");
        return true;
    } catch (error) {
        console.error("Failed to delete employee:", error);
        throw new Error("Failed to delete employee");
    }
}

// ----------------------------------------------------
// Storage
// ----------------------------------------------------

export async function uploadInvoiceServer(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            throw new Error("No file uploaded");
        }

        // Create a safe filename
        const fileExt = file.name.split('.').pop() || 'png';
        const safeRandomName = Math.random().toString(36).substring(2, 10);
        const fileName = `${Date.now()}-${safeRandomName}.${fileExt}`;

        // Upload to Vercel Blob
        const blob = await put(`bonus-invoices/${fileName}`, file, {
            access: 'public',
        });

        return blob.url;
    } catch (error) {
        console.error("Failed to upload invoice:", error);
        throw new Error("Failed to upload invoice");
    }
}
