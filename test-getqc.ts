import { getQcProducts } from './src/app/actions/qc-actions';

async function main() {
  const allProducts = await getQcProducts();
  console.log('Total QC products:', allProducts.length);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentInspections = allProducts.filter(p => p.lastInspection && new Date(p.lastInspection) >= yesterday);
  console.log('Recent inspections (24h):', recentInspections.length);
}
main();
