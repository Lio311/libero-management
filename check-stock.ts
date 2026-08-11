import { db } from './src/lib/db';
import { wcProducts, qcProducts } from './src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function main() {
  const result = await db
    .select({
      count: sql`count(*)`,
    })
    .from(qcProducts)
    .innerJoin(wcProducts, eq(qcProducts.wooProductId, wcProducts.id))
    .where(sql`${wcProducts.stockQuantity} > 0`);
  
  console.log("Number of qcProducts with stock > 0:", result[0].count);
  
  const sumResult = await db
    .select({
      sum: sql`sum(${wcProducts.stockQuantity})`,
    })
    .from(qcProducts)
    .innerJoin(wcProducts, eq(qcProducts.wooProductId, wcProducts.id));
    
  console.log("Sum of all qcProducts stock:", sumResult[0].sum);

  const maxResult = await db
    .select({
      max: sql`max(${wcProducts.stockQuantity})`,
    })
    .from(qcProducts)
    .innerJoin(wcProducts, eq(qcProducts.wooProductId, wcProducts.id));

  console.log("Max stock of any single qcProduct:", maxResult[0].max);

  const allResult = await db
    .select({
      count: sql`count(*)`,
    })
    .from(qcProducts);
    
  console.log("Total qcProducts:", allResult[0].count);
  
  process.exit(0);
}

main().catch(console.error);
