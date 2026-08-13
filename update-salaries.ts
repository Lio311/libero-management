import 'dotenv/config';
import { db } from './src/lib/db';
import { influencerPayments } from './src/lib/db/schema';
import { eq, or, ilike } from 'drizzle-orm';

async function run() {
  const mapping: Record<string, string> = {
    'נועה בן דוד': 'noa',
    'איילה אריאל': 'ayala',
    'ליה מזרחי': 'liya',
    'שוהם ביטון': 'shoam',
    'ראות סטרולוביץ': 'reut',
    'נגה אינגר': 'noga',
    'נוגה': 'noga',
    'עמית טראש': 'amit',
    'שקד לנקרי': 'shaked',
    'ניצן גולדשמיט': 'gold',
    'טל אוד קולקשיין': 'tal'
  };

  const allPayments = await db.select().from(influencerPayments);
  
  for (const p of allPayments) {
    const match = mapping[p.influencerName || ''];
    if (match) {
      await db.update(influencerPayments)
        .set({ influencerId: match })
        .where(eq(influencerPayments.id, p.id));
      console.log(`Updated ${p.influencerName} -> ${match}`);
    }
  }

  // Add Oded for August if not exists
  const odedRows = await db.select().from(influencerPayments).where(
    or(
      ilike(influencerPayments.influencerName, '%עודד%'),
      eq(influencerPayments.influencerName, 'עודד')
    )
  );
  
  const odedAugust = odedRows.find(r => r.paymentMonth === 'אוגוסט');
  if (!odedAugust) {
    await db.insert(influencerPayments).values({
      influencerName: 'עודד',
      amount: '11000',
      paymentMonth: 'אוגוסט',
      notes: 'שכר בסיס',
      isDone: 'לא בוצע'
    });
    console.log('Added Oded for August with 11000');
  } else {
    await db.update(influencerPayments)
      .set({ amount: '11000' })
      .where(eq(influencerPayments.id, odedAugust.id));
    console.log('Updated Oded for August to 11000');
  }

  console.log('Done');
}

run().catch(console.error);
