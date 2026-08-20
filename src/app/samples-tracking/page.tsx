import { db } from '@/lib/db';
import { monthlyTierSamples } from '@/lib/db/schema';
import SamplesTrackingClient from './samples-tracking-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const allData = await db.select().from(monthlyTierSamples);
  
  return (
    <div className="flex-1 overflow-auto bg-background/50 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
        <SamplesTrackingClient initialData={allData} />
      </div>
    </div>
  );
}
