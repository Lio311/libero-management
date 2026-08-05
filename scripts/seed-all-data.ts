import { db } from '../src/lib/db';
import { 
  influencers,
  influencerPayments,
  wholesaleCustomers,
  suppliers,
  importPayments,
  creditCards,
  roleHolders,
  monthlySchedule,
  bankOfTasks
} from '../src/lib/db/schema';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("Reading parsed_all_data.json...");
  const dataPath = path.join(__dirname, '../parsed_all_data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  // influencers
  if (data.influencers && data.influencers.length > 0) {
    console.log("Seeding influencers...");
    await db.delete(influencers);
    await db.insert(influencers).values(data.influencers.map((i: any) => ({
      brand: i.brand,
      isPaid: i.isPaid,
      videoCount: i.videoCount,
      postCount: i.postCount,
      activities: i.activities,
      influencerName: i.influencerName,
      productsGiven: i.productsGiven,
      videosUploaded: i.videosUploaded,
      notes: i.notes
    })));
  }

  // influencerPayments
  if (data.influencerPayments && data.influencerPayments.length > 0) {
    console.log("Seeding influencerPayments...");
    await db.delete(influencerPayments);
    await db.insert(influencerPayments).values(data.influencerPayments.map((p: any) => ({
      influencerName: p.influencerName,
      amount: isNaN(parseFloat(p.amount)) ? null : parseFloat(p.amount).toString(),
      isDone: p.isDone,
      notes: p.notes
    })));
  }

  // wholesaleCustomers
  if (data.wholesaleCustomers && data.wholesaleCustomers.length > 0) {
    console.log("Seeding wholesaleCustomers...");
    await db.delete(wholesaleCustomers);
    await db.insert(wholesaleCustomers).values(data.wholesaleCustomers);
  }

  // suppliers
  if (data.suppliers && data.suppliers.length > 0) {
    console.log("Seeding suppliers...");
    await db.delete(suppliers);
    await db.insert(suppliers).values(data.suppliers);
  }

  // importPayments
  if (data.importPayments && data.importPayments.length > 0) {
    console.log("Seeding importPayments...");
    await db.delete(importPayments);
    await db.insert(importPayments).values(data.importPayments.map((ip: any) => ({
      brand: ip.brand,
      orderAmountForeign: isNaN(parseFloat(ip.orderAmountForeign)) ? null : parseFloat(ip.orderAmountForeign).toString(),
      orderAmountNis: isNaN(parseFloat(ip.orderAmountNis)) ? null : parseFloat(ip.orderAmountNis).toString(),
      vat: isNaN(parseFloat(ip.vat)) ? null : parseFloat(ip.vat).toString(),
      shippingCost: isNaN(parseFloat(ip.shippingCost)) ? null : parseFloat(ip.shippingCost).toString()
    })));
  }

  // creditCards (now includes billingDate)
  if (data.creditCards && data.creditCards.length > 0) {
    console.log("Seeding creditCards...");
    await db.delete(creditCards);
    await db.insert(creditCards).values(data.creditCards.map((cc: any) => ({
      cardCompany: cc.cardCompany,
      bank: cc.bank,
      creditLimit: isNaN(parseFloat(cc.creditLimit)) ? null : parseFloat(cc.creditLimit).toString(),
      cardNumber: cc.cardNumber,
      expiration: cc.expiration,
      cvv: cc.cvv,
      cardType: cc.cardType,
      billingDate: cc.billingDate
    })));
  }

  // roleHolders
  if (data.roleHolders && data.roleHolders.length > 0) {
    console.log("Seeding roleHolders...");
    await db.delete(roleHolders);
    await db.insert(roleHolders).values(data.roleHolders);
  }

  // monthlySchedule
  if (data.monthlySchedule && data.monthlySchedule.length > 0) {
    console.log("Seeding monthlySchedule...");
    await db.delete(monthlySchedule);
    await db.insert(monthlySchedule).values(data.monthlySchedule.map((ms: any) => ({
      weekNumber: isNaN(parseInt(ms.weekNumber)) ? null : parseInt(ms.weekNumber),
      task: ms.task
    })));
  }

  // bankOfTasks
  if (data.bankOfTasks && data.bankOfTasks.length > 0) {
    console.log("Seeding bankOfTasks...");
    await db.delete(bankOfTasks);
    await db.insert(bankOfTasks).values(data.bankOfTasks.map((bt: any) => ({
      assignee: bt.responsible,
      status: bt.status,
      taskName: bt.taskName,
      dueDate: bt.date,
      itemIndex: isNaN(parseInt(bt.taskNumber)) ? null : parseInt(bt.taskNumber),
    })));
  }

  console.log("Done seeding all data!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});
