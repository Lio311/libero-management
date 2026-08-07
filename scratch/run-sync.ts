import { GET } from '../src/app/api/sync/wc-data/route';

async function runSync() {
  const req = new Request('http://localhost:3000/api/sync/wc-data?manual=true&mode=all');
  const res = await GET(req);
  const data = await res.json();
  console.log("Sync completed:", data);
}

runSync().catch(console.error);
