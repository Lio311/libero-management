"use client";

import React, { useState, useMemo } from "react";
import { Package, Search } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import { isHotProduct } from "@/config/wholesale";

function ClientDate({ date }: { date: Date | string }) {
  const [mounted, setMounted] = useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <>{format(new Date(date), "dd/MM/yyyy HH:mm", { locale: he })}</>;
}

interface ScannedProduct {
  id: number;
  productName: string;
  brand: string | null;
  img: string | null;
  price: string | null;
  stock: string | null;
  scannedAt: Date;
}

export default function LindoClient({ products }: { products: ScannedProduct[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }
    return result;
  }, [products, searchQuery]);

  return (
    <div className="p-4 md:p-8 min-h-screen" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Header Bento */}
      <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">מוצרי לינדו (סיטונאי)</h2>
            <p className="text-gray-200 mt-1 text-sm">המוצרים שנסרקו מהאתר הסיטונאי ונשלחו במייל</p>
          </div>
        </div>
      </div>

      {/* Stats Bento */}
      <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="text-xs md:text-sm font-medium text-gray-200">סה&quot;כ מוצרים שנסרקו</h3>
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="text-xl md:text-2xl font-bold text-white">{products.length}</div>
      </div>

      {/* Table Bento */}
      <div className="lg:col-span-12 glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="חיפוש מוצר או מותג..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-white/20 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 text-white placeholder:text-gray-300"
              dir="rtl"
            />
          </div>
        </div>
        
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-white">
              <thead className="text-xs text-gray-200 bg-white/10 border-b border-white/20 uppercase font-medium">
                <tr>
                  <th scope="col" className="px-4 py-3 min-w-[200px]">מוצר</th>
                  <th scope="col" className="px-4 py-3 text-center min-w-[100px]">מותג</th>
                  <th scope="col" className="px-4 py-3 text-center min-w-[80px]">מחיר</th>
                  <th scope="col" className="px-4 py-3 text-center min-w-[80px]">מלאי</th>
                  <th scope="col" className="px-4 py-3 text-center min-w-[120px]">תאריך סריקה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-transparent">
                {filteredProducts.map((product) => {
                  const isHot = isHotProduct(product.brand, product.productName);
                  return (
                  <tr
                    key={product.id}
                    className={`${isHot ? 'bg-red-900/20 hover:bg-red-900/30 border-r-red-400' : 'bg-transparent hover:bg-white/5 border-r-transparent'} border-r-4 transition-colors`}
                  >
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${isHot ? 'text-red-200' : 'text-white'} block`}>
                        {isHot && <span className="ml-1">🔥</span>}
                        {product.productName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-300">{product.brand || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-300">{product.price ? `₪${product.price}` : "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-300">{product.stock || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-400">
                      <ClientDate date={product.scannedAt} />
                    </td>
                  </tr>
                  );
                })}
                
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      לא נמצאו מוצרים
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
