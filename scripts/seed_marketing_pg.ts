import * as xlsx from 'xlsx';
import path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { influencers, influencerPayments, wholesaleCustomers } from '../src/lib/db/schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seedMarketing() {
  const filePath = path.join(process.cwd(), 'ליברו.xlsx');
  const workbook = xlsx.readFile(filePath);

  // 1. שיווק (Marketing)
  const marketSheet = workbook.Sheets['שיווק'];
  if (marketSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(marketSheet, { header: 1, defval: null });
    const parsed = [];
    for (let i = 4; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(c => c === null || c === '')) continue;
      if (row[9] === 'מותג' || row[3] === 'שם משפיענית') continue;

      parsed.push({
        brand: row[9] ? String(row[9]) : null,
        isPaid: row[8] ? String(row[8]) : null,
        videoCount: row[7] ? String(row[7]) : null,
        postCount: row[6] ? String(row[6]) : null,
        activities: row[5] ? String(row[5]) : null,
        influencerName: row[3] ? String(row[3]) : null,
        productsGiven: row[2] ? String(row[2]) : null,
        videosUploaded: row[1] ? String(row[1]) : null,
        notes: row[0] ? String(row[0]) : null,
      });
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} influencers...`);
      await db.delete(influencers);
      await db.insert(influencers).values(parsed);
    }
  }

  // 2. תשלום משפיענים (Influencer Payments)
  const paySheet = workbook.Sheets['תשלום משפיענים'];
  if (paySheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(paySheet, { header: 1, defval: null });
    const parsed = [];
    for (let i = 3; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(c => c === null || c === '')) continue;
      
      if (row[10] && row[10] !== 'שם משפיענית') {
        const amtStr = String(row[2]).replace(/[^0-9.]/g, '');
        const amt = parseFloat(amtStr);
        parsed.push({
          influencerName: String(row[10]),
          amount: isNaN(amt) ? null : String(amt),
          isDone: row[1] ? String(row[1]) : null,
        });
      }
      if (row[14] && row[14] !== 'שם משפיענית') {
        const amtStr = String(row[13]).replace(/[^0-9.]/g, '');
        const amt = parseFloat(amtStr);
        parsed.push({
          influencerName: String(row[14]),
          amount: isNaN(amt) ? null : String(amt),
          isDone: row[12] ? String(row[12]) : null,
        });
      }
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} influencer payments...`);
      await db.delete(influencerPayments);
      await db.insert(influencerPayments).values(parsed);
    }
  }

  // 3. סיטונאות (Wholesale)
  const wholesaleSheet = workbook.Sheets['סיטונאות'];
  if (wholesaleSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(wholesaleSheet, { header: 1, defval: null });
    const parsed = [];
    for (let i = 4; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(c => c === null || c === '')) continue;
      if (row[7] === 'שם החנות') continue;
      
      parsed.push({
        storeName: row[7] ? String(row[7]) : null,
        city: row[6] ? String(row[6]) : null,
        address: row[5] ? String(row[5]) : null,
        phoneCall: row[4] ? String(row[4]) : null,
        visit: row[3] ? String(row[3]) : null,
        potential: row[2] ? String(row[2]) : null,
        interest: row[1] ? String(row[1]) : null,
        notes: row[0] ? String(row[0]) : null,
      });
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} wholesale customers...`);
      await db.delete(wholesaleCustomers);
      await db.insert(wholesaleCustomers).values(parsed);
    }
  }

  console.log("Marketing & Wholesale Seed Complete!");
  await pool.end();
}

seedMarketing().catch(console.error).then(() => process.exit(0));
