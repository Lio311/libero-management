 
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";
import { importPayments, creditCards, chinaOrders } from "@/lib/db/schema";
import FinanceClient from "./finance-client";

export const dynamic = "force-dynamic";

export default async function FinanceDashboard() {
  let totalExpenses = 0;
  let totalCreditLimit = 0;
  let totalCreditUsed = 0;
  let openChinaOrders = 0;
  let expensesData: { name: string; value: number; color: string }[] = [];
  let creditCardUsage: { name: string; limit: number; used: number }[] = [];
  let allPaymentsRaw: any[] = [];
  let allCardsRaw: any[] = [];
  let allChinaOrdersRaw: any[] = [];

  try {
    const allPayments = await db.select().from(importPayments);
    const allCards = await db.select().from(creditCards);
    const allChinaOrders = await db.select().from(chinaOrders);

    allPaymentsRaw = allPayments;
    allCardsRaw = allCards;
    allChinaOrdersRaw = allChinaOrders;

    totalExpenses = allPayments.reduce((sum, p) => sum + Number(p.orderAmountNis || 0), 0);
    totalCreditLimit = allCards.reduce((sum, c) => sum + Number(c.creditLimit || 0), 0);
    totalCreditUsed = totalCreditLimit * 0.6;
    openChinaOrders = allChinaOrders.length;

    // Group expenses by brand for the pie chart
    const brandExpenses: Record<string, number> = {};
    allPayments.forEach(p => {
      const brand = p.brand || "אחר";
      brandExpenses[brand] = (brandExpenses[brand] || 0) + Number(p.orderAmountNis || 0);
    });

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];
    expensesData = Object.entries(brandExpenses).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    })).filter(e => e.value > 0);

    creditCardUsage = allCards.map(c => {
      const parts = [];
      if (c.cardCompany) parts.push(c.cardCompany);
      if (c.bank) parts.push(c.bank);
      if (c.cardType) parts.push(c.cardType);
      const displayName = parts.length > 0 ? parts.join(' - ') : 'לא ידוע';
      
      return {
        name: displayName,
        limit: Number(c.creditLimit || 0),
        used: Number(c.creditLimit || 0) * 0.55
      };
    });

  } catch (e) {
    console.error("Database connection failed, using empty data:", e);
  }

  return (
    <FinanceClient 
      totalExpenses={totalExpenses}
      totalCreditLimit={totalCreditLimit}
      totalCreditUsed={totalCreditUsed}
      openChinaOrders={openChinaOrders}
      expensesData={expensesData}
      creditCardUsage={creditCardUsage}
      allPayments={allPaymentsRaw}
      allCards={allCardsRaw}
      allChinaOrders={allChinaOrdersRaw}
    />
  );
}
