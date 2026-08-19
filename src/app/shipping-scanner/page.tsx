import { getProcessingOrders } from "@/app/actions/scanner-actions";
import Link from "next/link";
import { Package, CalendarIcon, User, Truck, Store } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default async function ShippingScannerPage() {
  const orders = await getProcessingOrders();
  
  const pickupOrders = orders.filter(o => o.isPickup);
  const shippingOrders = orders.filter(o => !o.isPickup);

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 h-screen overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          סריקת משלוחים
          <span className="text-sm px-3 py-1 rounded-full bg-secondary text-foreground font-medium">
            סה״כ הזמנות פתוחות: {orders.length}
          </span>
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border">
          אין הזמנות פתוחות להכנה
        </div>
      ) : (
        <>
          {pickupOrders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-orange-500">
                <Store className="w-6 h-6" />
                איסוף עצמי ({pickupOrders.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pickupOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}

          {shippingOrders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-blue-500">
                <Truck className="w-6 h-6" />
                משלוחים ({shippingOrders.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {shippingOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
  return (
    <Link href={`/shipping-scanner/${order.id}`} className="block h-full">
      <div className="glass-panel p-6 rounded-xl hover-scale cursor-pointer group hover:border-primary/50 transition-colors h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary group-hover:text-primary/80" />
            הזמנה #{order.id}
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
            בטיפול
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground flex-1">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 shrink-0" />
            <span>{format(new Date(order.dateCreated), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50 text-foreground font-medium flex justify-between items-center">
          <span>סה"כ לתשלום:</span>
          <span>₪{parseFloat(order.total).toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}
