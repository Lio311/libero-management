 
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";
import { wholesaleCustomers } from "@/lib/db/schema";
import OperationsClient from "./operations-client";

export const dynamic = "force-dynamic";

export default async function OperationsDashboard() {
  let wholesaleClients: { name: string; contact: string; totalOrders: number; revenue: number; interest: string }[] = [];
  let clients: any[] = [];

  try {
    clients = await db.select().from(wholesaleCustomers);

    wholesaleClients = clients.map(c => ({
      name: c.storeName || 'ללא שם',
      contact: c.city || 'לא ידוע', // City acts as contact area
      totalOrders: 0,
      revenue: 0,
      interest: c.interest || 'לא צוין'
    }));

  } catch (e) {
    console.error("Database connection failed, using empty data:", e);
  }

  return (
    <OperationsClient 
      wholesaleClients={wholesaleClients}
      rawWholesaleCustomers={clients}
    />
  );
}
