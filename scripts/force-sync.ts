import { GET } from '../src/app/api/sync/wc-data/route';

async function run() {
  const req = new Request('http://localhost/api/sync/wc-data?manual=true');
  const res = await GET(req as any);
  const data = await res.json();
  console.log(data);
}
run();
