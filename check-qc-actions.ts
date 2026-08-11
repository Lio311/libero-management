import { getQcProducts } from './src/app/actions/qc-actions';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function main() {
  const products = await getQcProducts();
  console.log("Total products returned:", products.length);
  
  let inStockCount = 0;
  for (const p of products) {
    if ((p.currentStock || 0) > 0) {
      inStockCount++;
    }
  }
  console.log("Products in stock according to frontend logic:", inStockCount);
  console.log("First 5 products stock:");
  console.log(products.slice(0, 5).map(p => ({ id: p.wooProductId, name: p.productName, stock: p.currentStock })));
  
  process.exit(0);
}

main().catch(console.error);
