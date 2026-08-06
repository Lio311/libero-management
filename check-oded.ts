import { db } from './src/lib/db';
import { influencers, influencerPayments } from './src/lib/db/schema';
import { ilike } from 'drizzle-orm';

async function check() {
  const infs = await db.select().from(influencers).where(ilike(influencers.influencerName, '%עודד%'));
  console.log('Influencers:', infs);
  
  const pays = await db.select().from(influencerPayments).where(ilike(influencerPayments.influencerName, '%עודד%'));
  console.log('Payments:', pays);
  
  process.exit(0);
}
check();
