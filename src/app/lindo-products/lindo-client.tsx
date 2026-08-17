"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Search } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

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
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">מוצרי לינדו (סיטונאי)</h2>
          <p className="text-muted-foreground mt-1 text-sm">המוצרים שנסרקו מהאתר הסיטונאי ונשלחו במייל</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">סה&quot;כ מוצרים שנסרקו</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-gray-900">{products.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="bg-white border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש מוצר או מותג..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50"
                dir="rtl"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-gray-600">
              <thead className="text-xs text-gray-500 bg-gray-50/80 border-b border-gray-200 uppercase font-medium">
                <tr>
                  <th scope="col" className="px-4 py-3 min-w-[200px]">מוצר</th>
                  <th scope="col" className="px-4 py-3 text-center min-w-[100px]">מותג</th>
                  <th scope="col" className="px-4 py-3 text-center min-w-[80px]">מחיר</th>
                  <th scope="col" className="px-4 py-3 text-center min-w-[80px]">מלאי</th>
                  <th scope="col" className="px-4 py-3 text-center min-w-[120px]">תאריך סריקה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="bg-white hover:bg-gray-50/80 border-r-4 border-r-gray-200 transition-colors"
                  >
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center gap-3">
                        {product.img && product.img.startsWith('http') ? (
                          <img
                            src={product.img}
                            alt={product.productName}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 block">
                          {product.productName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">{product.brand || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">{product.price ? `₪${product.price}` : "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">{product.stock || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      <ClientDate date={product.scannedAt} />
                    </td>
                  </tr>
                ))}
                
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      לא נמצאו מוצרים
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
