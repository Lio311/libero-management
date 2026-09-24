import { getCustomerControlData } from "@/app/actions/customer-control-actions";
import CustomerControlClient from "./customer-control-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "בקרת לקוחות",
  description: "בקרת לקוחות מיוחדים ומעקב רכישות",
};

export const revalidate = 0;

export default async function CustomerControlPage() {
  const data = await getCustomerControlData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 md:p-8 rtl">
      <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
        <h1 className="text-3xl font-bold text-center text-white">בקרת לקוחות</h1>
      </div>
      <CustomerControlClient initialData={data} />
    </div>
  );
}
