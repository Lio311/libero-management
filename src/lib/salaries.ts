import { db } from "@/lib/db";
import { influencerPayments } from "@/lib/db/schema";
import { influencersConfig } from "@/config/influencers";
import * as xlsx from "xlsx";
import { eq, and } from "drizzle-orm";

export const INFLUENCERS_EXPORT_LIST = [
  { name: "איילה אריאל", idNum: "", account: "252324120", bank: "11", branch: "302", configId: "ayala" },
  { name: "אור מלקנדוב", idNum: "", account: "172069302", bank: "11", branch: "151", configId: "orika" },
  { name: "ליה מזרחי", idNum: "", account: "234153", bank: "14", branch: "317", configId: "liya" },
  { name: "מעיין פלאח", idNum: "", account: "078336/23", bank: "10", branch: "680", configId: "maayan" },
  { name: "נוגה אינגר", idNum: "", account: "673140", bank: "31", branch: "035", configId: "noga" },
  { name: "נועה בן דוד", idNum: "", account: "099188246098", bank: "11", branch: "099", configId: "noa" },
  { name: "ניצן גולדנשמיט", idNum: "", account: "47034/07", bank: "10", branch: "678", configId: "gold" },
  { name: "הדר פדידה", idNum: "", account: "39403", bank: "12", branch: "714", configId: "hf" },
  { name: "רעות סטורלוביץ", idNum: "", account: "127034", bank: "14", branch: "398", configId: "reut" },
  { name: "עמית טרנצקו", idNum: "", account: "161439162", bank: "11", branch: "110", configId: "amit" },
  { name: "שוהם ביטון", idNum: "", account: "225366", bank: "12", branch: "766", configId: "shoam" },
  { name: "שקד לנקרי", idNum: "", account: "25240330", bank: "11", branch: "109", configId: "shaked" }
];

export async function generateSalariesExcel(month: string, baseUrl: string) {
  const payments = await db.select().from(influencerPayments);
  const monthPayments = payments.filter(p => p.paymentMonth === month);

  const data = [];

  for (const inf of INFLUENCERS_EXPORT_LIST) {
    let commission = 0;
    try {
      const url = new URL(`/api/influencer-coupon/${inf.configId}?month=${month}`, baseUrl);
      const res = await fetch(url.toString(), {
        headers: {
          'cookie': 'placeholder' // In case it requires auth, but usually API routes here don't for these endpoints
        }
      });
      if (res.ok) {
        const json = await res.json();
        commission = json?.summary?.commission || 0;
      }
    } catch (err) {
      console.error(`Error fetching commission for ${inf.configId}:`, err);
    }

    const paymentRecord = monthPayments.find(p => p.influencerId === inf.configId);
    
    let baseSalary = influencersConfig[inf.configId]?.baseSalary || 0;
    let baseLibero = influencersConfig[inf.configId]?.baseLibero || 0;
    let baseVelour = influencersConfig[inf.configId]?.baseVelour || 0;
    let baseLabura = influencersConfig[inf.configId]?.baseLabura || 0;
    
    if (paymentRecord) {
      if (paymentRecord.baseSalary !== null && paymentRecord.baseSalary !== undefined) {
         // paymentRecord overrides if it exists
         baseSalary = Number(paymentRecord.baseSalary) || 0;
      }
    } else {
         baseSalary = baseSalary + baseLibero + baseVelour + baseLabura;
    }
    
    const monthlyBonus = paymentRecord ? (Number(paymentRecord.monthlyBonus) || 0) : 0;

    const totalAmount = commission + baseSalary + monthlyBonus;

    data.push({
      "שם המוטב": inf.name,
      "מזהה מוטב": inf.idNum,
      "מספר החשבון": inf.account,
      "בנק": inf.bank,
      "סניף": inf.branch,
      "סכום": Math.round(totalAmount * 100) / 100,
      "הערה": `משכורת ${month}`
    });
  }

  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  worksheet["!views"] = [{ rightToLeft: true }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Salaries");
  
  // Convert to buffer
  const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return excelBuffer;
}
