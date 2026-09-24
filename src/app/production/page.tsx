import ProductionClient from "./production-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "ניהול ייצור | Libero",
};

export default async function ProductionPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <ProductionClient />
      </div>
    </div>
  );
}
