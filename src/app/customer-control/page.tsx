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
    <div className="container mx-auto px-4 md:px-8 py-8 rtl">
      <h1 className="text-3xl font-bold text-center mb-8">בקרת לקוחות</h1>
      <CustomerControlClient initialData={data} />
    </div>
  );
}
