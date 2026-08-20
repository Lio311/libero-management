import { db } from './src/lib/db';
import { rewardBrandRules } from './src/lib/db/schema';
async function main() {
  const rules = await db.select().from(rewardBrandRules);
  console.log(rules);
  process.exit(0);
}
main().catch(console.error);
