import re

with open('src/app/actions/scanner-actions.ts', 'r') as f:
    content = f.read()

# Add imports
imports_to_add = """import { getCustomerHistory } from "@/lib/customer-history";
import { calculateReward, RewardOutput } from "@/lib/reward-engine";
"""
content = content.replace('import { revalidatePath } from "next/cache";', 'import { revalidatePath } from "next/cache";\n' + imports_to_add)

# Update ScannerOrder type
old_type = """export type ScannerOrder = {
  id: number;
  customerName: string;
  total: string;
  dateCreated: string;
  status: string;
  lineItems: any[];
  isPickup: boolean;
  shippingAddress?: string;
  city?: string;
  phone?: string;
  notes?: string;
};"""
new_type = """export type ScannerOrder = {
  id: number;
  customerName: string;
  total: string;
  dateCreated: string;
  status: string;
  lineItems: any[];
  isPickup: boolean;
  shippingAddress?: string;
  city?: string;
  phone?: string;
  notes?: string;
  reward?: RewardOutput;
};"""
content = content.replace(old_type, new_type)

# Add logic to getOrderById
# Find the return statement
old_return = """    return {
      id: order.id,
      customerName: customerName || `הזמנה #${order.id}`,
      total: order.total || '0',
      dateCreated: order.dateCreated ? new Date(order.dateCreated).toISOString() : new Date().toISOString(),
      status: order.status || 'processing',
      lineItems,
      isPickup,
      shippingAddress: (order.billing as any)?.address_1 || '',
      city: (order.billing as any)?.city || '',
      phone: (order.billing as any)?.phone || '',
      notes: (order as any).customer_note || '',
    };"""

new_logic = """    const email = billing?.email;
    const phone = billing?.phone;
    const customerId = order.customerId;
    
    // Fetch history and calculate reward
    const history = await getCustomerHistory(email, phone, customerId || undefined);
    const reward = calculateReward(order, history);
    
    return {
      id: order.id,
      customerName: customerName || `הזמנה #${order.id}`,
      total: order.total || '0',
      dateCreated: order.dateCreated ? new Date(order.dateCreated).toISOString() : new Date().toISOString(),
      status: order.status || 'processing',
      lineItems,
      isPickup,
      shippingAddress: (order.billing as any)?.address_1 || '',
      city: (order.billing as any)?.city || '',
      phone: (order.billing as any)?.phone || '',
      notes: (order as any).customer_note || '',
      reward,
    };"""

content = content.replace(old_return, new_logic)

with open('src/app/actions/scanner-actions.ts', 'w') as f:
    f.write(content)

