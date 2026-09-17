import { config } from "dotenv";
config({ path: ".env.production.local" });
config({ path: ".env.production" });

import { GET } from "./src/app/api/cron/wholesale-digest/route";

async function main() {
  const req = new Request("http://localhost:3000/api/cron/wholesale-digest", {
    headers: {
      "authorization": `Bearer ${process.env.CRON_SECRET}`
    }
  });

  const res = await GET(req);
  const json = await res.json();
  console.log("Status:", res.status);
  console.log("JSON:", json);
}
main();
