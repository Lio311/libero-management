import ShiftsClient from './shifts-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShiftsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="glass-panel rounded-3xl p-6 lg:col-span-12">
              <h1 className="text-3xl font-bold tracking-tight text-white">לוח משמרות</h1>
              <p className="text-slate-200 mt-1">ניהול משמרות עובדים שבועי</p>
            </div>
            <div className="lg:col-span-12">
              <ShiftsClient />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
