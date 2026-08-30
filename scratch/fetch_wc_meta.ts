import { fetchFromWooCommerce } from "../src/lib/wc-config";
async function run() {
  const orders = await fetchFromWooCommerce("orders", "per_page=1", "velour");
  console.log(JSON.stringify(orders[0].meta_data, null, 2));
}
run();
