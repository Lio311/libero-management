import { getOrderById } from "./src/app/actions/scanner-actions";
async function main() {
  const order = await getOrderById(54278, "libero");
  console.log(JSON.stringify(order?.lineItems, null, 2));
}
main();
