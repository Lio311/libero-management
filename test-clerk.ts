import { clerkClient } from '@clerk/nextjs/server';
async function run() {
  const client = await clerkClient();
  console.log(Object.keys(client));
}
run();
