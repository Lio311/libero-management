import { getLindoProducts } from "@/app/actions/lindo-actions";
import LindoClient from "./lindo-client";

export default async function LindoProductsPage() {
  const products = await getLindoProducts();

  return <LindoClient products={products} />;
}
