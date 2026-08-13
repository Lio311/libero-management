import { getLaburaInventoryCounts } from "./actions";
import LaburaCountClient from "./labura-count-client";

export const dynamic = "force-dynamic";

export default async function LaburaInventoryCountPage() {
  const initialData = await getLaburaInventoryCounts();

  return (
    <div className="max-w-[1400px] mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6 pt-[calc(3rem_+_env(safe-area-inset-top))] md:pt-8 pb-20 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 print:hidden">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground/90">
          ספירת מלאי - לה בורה
        </h1>
        <p className="text-muted-foreground">
          טבלת ספירת מלאי מפורטת. כל שינוי נשמר אוטומטית.
        </p>
      </div>

      <LaburaCountClient initialData={initialData} />
    </div>
  );
}
