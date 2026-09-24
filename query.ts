import 'dotenv/config'; // Add this line
import { getCustomerHistory } from './src/lib/customer-history';

async function run() {
  const history = await getCustomerHistory('iv64674@gmail.com', '0542378236', 0);
  console.log("History orders:", history.pastOrders.map(o => ({ id: o.id, date: o.dateCreated, status: o.status })));
  process.exit(0);
}
run();
