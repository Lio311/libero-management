import { getProcessingOrders } from "@/app/actions/scanner-actions";
import Link from "next/link";
import { Package, CalendarIcon, User } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default async function ShippingScannerPage() {
  const orders = await getProcessingOrders();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 h-screen overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">סריקת משלוחים</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            אין הזמנות פתוחות להכנה
          </div>
        ) : (
          orders.map((order) => (
            <Link 
              key={order.id} 
              href={`/shipping-scanner/${order.id}`}
              className="block"
            >
              <div className="glass-panel p-6 rounded-xl hover-scale cursor-pointer group hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary group-hover:text-primary/80" />
                    הזמנה #{order.id}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    בטיפול
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{format(new Date(order.dateCreated), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 text-foreground font-medium flex justify-between">
                    <span>סה"כ לתשלום:</span>
                    <span>₪{parseFloat(order.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
