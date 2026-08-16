import ShiftsClient from './shifts-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShiftsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">לוח משמרות</h1>
              <p className="text-muted-foreground mt-1">ניהול משמרות עובדים שבועי</p>
            </div>
          </div>
          <ShiftsClient />
        </div>
      </div>
    </div>
  );
}
