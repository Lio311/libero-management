"use client";

import Link from "next/link";
import { Package, CalendarIcon, User, Truck, Store, PlayCircle, CheckCircle2, ListTodo } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScannerOrder, createOrderLabel } from "@/app/actions/scanner-actions";

import { useRouter } from "next/navigation";

export default function ScannerListClient({ 
  initialOrders,
  initialStats,
  initialStore,
  isAdmin
}: { 
  initialOrders: ScannerOrder[];
  initialStats: { completedToday: number; remainingToProcess: number };
  initialStore: "libero" | "velour" | "labura";
  isAdmin?: boolean;
}) {
  const orders = initialOrders;
  const stats = initialStats;
  const store = initialStore;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop" | null>(null);

  useEffect(() => {
    setDeviceType(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "desktop");
  }, []);

  const [partiallyScannedIds, setPartiallyScannedIds] = useState<number[]>([]);
  const [readyIds, setReadyIds] = useState<number[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

  const toggleSelection = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  
  const handleRemotePrintShipping = async () => {
    if (selectedOrderIds.length === 0) return;
    try {
      let successCount = 0;
      toast.info(`שולח ${selectedOrderIds.length} מדבקות למדפסת...`);
      
      for (const orderId of selectedOrderIds) {
        const res = await createOrderLabel(orderId, (store || "libero") as "libero" | "velour" | "labura");
        if (res.success && res.labelUrl) {
          const printRes = await fetch("/api/remote-print", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              store, 
              orderIds: [orderId],
              jobType: 'shipping-label',
              metadata: { url: res.labelUrl }
            })
          });
          if (printRes.ok) successCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} מדבקות משלוח נשלחו למדפסת!`);
        setSelectedOrderIds([]);
      } else {
        toast.error("שגיאה ביצירת מדבקות משלוח");
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בתקשורת");
    }
  };

  const handleRemotePrint = async () => {
    if (selectedOrderIds.length === 0) return;
    try {
      const res = await fetch("/api/remote-print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store, orderIds: selectedOrderIds })
      });
      if (res.ok) {
        toast.success("פקודת ההדפסה נשלחה בהצלחה למחשב!");
        setSelectedOrderIds([]);
      } else {
        toast.error("שגיאה בשליחת פקודת הדפסה");
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בתקשורת");
    }
  };

  useEffect(() => {
    const partials: number[] = [];
    const readys: number[] = [];
    orders.forEach(o => {
      if (o.status === 'processing') {
        let saved = localStorage.getItem(`scanner_order_${store}_${o.id}`);
        if (!saved && store === "libero") saved = localStorage.getItem(`scanner_order_${o.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.status === 'ready') {
              readys.push(o.id);
            } else if (parsed.status !== 'completed' && parsed.items?.some((i: any) => i.scanned > 0 || i.isMissing)) {
              partials.push(o.id);
            }
          } catch (e) {}
        }
      }
    });
    setPartiallyScannedIds(partials);
    setReadyIds(readys);
    setMounted(true);
  }, [orders]);

  const processingOrders = orders.filter(o => o.status === 'processing');
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const readyOrders = processingOrders.filter(o => readyIds.includes(o.id));
  const partialOrders = processingOrders.filter(o => partiallyScannedIds.includes(o.id) && !readyIds.includes(o.id));
  const pickupOrders = processingOrders.filter(o => o.isPickup && !partiallyScannedIds.includes(o.id) && !readyIds.includes(o.id));
  const allShippingOrders = processingOrders.filter(o => !o.isPickup && !partiallyScannedIds.includes(o.id) && !readyIds.includes(o.id));

  const isLibero = store === 'libero';
  const hasMiniPerfumes = (order: any) => order.lineItems.some((i: any) => (i.name || "").includes("מיני בושם"));
  const hasOnlyMiniPerfumes = (order: any) => order.lineItems.every((i: any) => (i.name || "").includes("מיני בושם"));

  const liberoShippingOnlyMini = isLibero ? allShippingOrders.filter(o => o.lineItems.length > 0 && hasOnlyMiniPerfumes(o)) : [];
  const liberoShippingMixed = isLibero ? allShippingOrders.filter(o => o.lineItems.length > 0 && hasMiniPerfumes(o) && !hasOnlyMiniPerfumes(o)) : [];
  const shippingOrders = isLibero ? allShippingOrders.filter(o => !hasMiniPerfumes(o) || o.lineItems.length === 0) : allShippingOrders;

  return (
    <div className="flex-1 space-y-12 p-4 md:p-8 pt-6 h-screen overflow-y-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex flex-wrap items-center gap-3">
          סריקת משלוחים
        </h2>
      <div className="flex gap-2 items-center justify-center flex-wrap w-full sm:w-auto">
        <div className="flex bg-secondary/50 p-1.5 rounded-xl w-fit border border-border/50">
          <button 
            onClick={() => router.push("?store=libero")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${store === "libero" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            ליברו
          </button>
          <button 
            onClick={() => router.push("?store=velour")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${store === "velour" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            וולור
          </button>
          <button 
            onClick={() => router.push("?store=labura")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${store === "labura" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            לה בורה
          </button>
        </div>
        
        {isAdmin && (
          <button 
            onClick={async (e) => {
              const btn = e.currentTarget;
              btn.innerText = "מסנכרן...";
              btn.disabled = true;
              try {
                const res = await fetch(`/api/sync/wc-data?store=${store}`);
                if (res.ok) {
                  router.refresh();
                } else {
                  toast.error("שגיאה בסנכרון");
                }
              } catch (err) {
                toast.error("שגיאה בסנכרון");
              } finally {
                btn.innerText = "סנכרן נתונים עכשיו";
                btn.disabled = false;
              }
            }}
            className="px-4 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg font-medium text-sm transition-all flex items-center gap-2 h-fit self-center"
          >
            סנכרן נתונים עכשיו
          </button>
        )}
        
        <div className="flex items-center gap-3">
          {store === "libero" && (
            <button
              disabled={selectedOrderIds.length === 0}
              onClick={handleRemotePrint}
              className={`px-4 py-3 sm:py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 min-w-[140px] sm:h-12 h-14 ${
                selectedOrderIds.length > 0 
                  ? "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border border-purple-200" 
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              }`}
              title="הדפס מדבקות מיני בושם"
            >
              {selectedOrderIds.length > 0 
                ? `הדפס מדבקות מיני בושם (${selectedOrderIds.length})` 
                : "הדפס מדבקות מיני בושם"}
            </button>
          )}

          <button
            disabled={selectedOrderIds.length === 0}
            onClick={handleRemotePrintShipping}
            className={`px-4 py-3 sm:py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 min-w-[140px] sm:h-12 h-14 ${
              selectedOrderIds.length > 0 
                ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-200" 
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            }`}
            title="הדפס לייבל משלוח"
          >
             {selectedOrderIds.length > 0 
              ? `הדפס לייבל משלוח (${selectedOrderIds.length})` 
              : "הדפס לייבל משלוח"}
          </button>
        </div>
      </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-medium text-sm">הושלמו היום</span>
          </div>
          <span className="text-3xl font-bold text-foreground">{stats.completedToday}</span>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ListTodo className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-sm">נשארו לביצוע</span>
          </div>
          <span className="text-3xl font-bold text-foreground">{stats.remainingToProcess}</span>
        </div>
      </div>

      {processingOrders.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border">
          אין הזמנות פתוחות להכנה
        </div>
      ) : (
        <div className="space-y-8">
          {mounted && readyOrders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-green-500">
                <PlayCircle className="w-6 h-6" />
                כל המוצרים נסרקו - ממתין לסגירה ({readyOrders.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {readyOrders.map(order => (
                  <OrderCard store={store} key={order.id} order={order} statusLabel="ממתין לסגירה" statusColor="green" isSelected={selectedOrderIds.includes(order.id)} onToggle={(e) => toggleSelection(e, order.id)} showCheckbox={true} />
                ))}
              </div>
            </div>
          )}

          {mounted && partialOrders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-purple-500">
                <PlayCircle className="w-6 h-6" />
                בהכנה ({partialOrders.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {partialOrders.map(order => (
                  <OrderCard store={store} key={order.id} order={order} statusLabel="בתהליך סריקה" statusColor="purple" isSelected={selectedOrderIds.includes(order.id)} onToggle={(e) => toggleSelection(e, order.id)} showCheckbox={true} />
                ))}
              </div>
            </div>
          )}

          {pickupOrders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-orange-500">
                <Store className="w-6 h-6" />
                איסוף עצמי ממתין לסריקה ({pickupOrders.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pickupOrders.map(order => (
                  <OrderCard store={store} key={order.id} order={order} statusLabel="בטיפול" statusColor="blue" isSelected={selectedOrderIds.includes(order.id)} onToggle={(e) => toggleSelection(e, order.id)} showCheckbox={true} />
                ))}
              </div>
            </div>
          )}

          {liberoShippingOnlyMini.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-purple-500">
                <Truck className="w-6 h-6" />
                משלוחים - רק מיני בושם ({liberoShippingOnlyMini.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liberoShippingOnlyMini.map(order => (
                  <OrderCard store={store} key={order.id} order={order} statusLabel="בטיפול" statusColor="blue" isSelected={selectedOrderIds.includes(order.id)} onToggle={(e) => toggleSelection(e, order.id)} showCheckbox={true} />
                ))}
              </div>
            </div>
          )}

          {liberoShippingMixed.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-pink-500">
                <Truck className="w-6 h-6" />
                משלוחים - הזמנות מעורבות (עם מיני בושם) ({liberoShippingMixed.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liberoShippingMixed.map(order => (
                  <OrderCard store={store} key={order.id} order={order} statusLabel="בטיפול" statusColor="blue" isSelected={selectedOrderIds.includes(order.id)} onToggle={(e) => toggleSelection(e, order.id)} showCheckbox={true} />
                ))}
              </div>
            </div>
          )}

          {shippingOrders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-blue-500">
                <Truck className="w-6 h-6" />
                {isLibero ? `משלוחים - רגיל (ללא מיני בושם) (${shippingOrders.length})` : `משלוחים ממתינים לסריקה (${shippingOrders.length})`}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {shippingOrders.map(order => (
                  <OrderCard store={store} key={order.id} order={order} statusLabel="בטיפול" statusColor="blue" isSelected={selectedOrderIds.includes(order.id)} onToggle={(e) => toggleSelection(e, order.id)} showCheckbox={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {completedOrders.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-green-500">
            <Package className="w-6 h-6" />
            הזמנות שהושלמו לאחרונה ({completedOrders.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-75">
            {completedOrders.map(order => (
              <OrderCard store={store} key={order.id} order={order} statusLabel="הושלם" statusColor="green" isSelected={selectedOrderIds.includes(order.id)} onToggle={(e) => toggleSelection(e, order.id)} showCheckbox={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, statusLabel, statusColor, store, isSelected, onToggle, showCheckbox }: { order: any, statusLabel: string, statusColor: 'blue' | 'purple' | 'green', store: string, isSelected?: boolean, onToggle?: (e: React.MouseEvent) => void, showCheckbox?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    green: "bg-green-500/10 text-green-500 border-green-500/20"
  };

  return (
    <div className="relative h-full">
      {showCheckbox && (
        <div className="absolute -right-3 -top-3 z-20 cursor-pointer" onClick={onToggle}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-muted-foreground/30 hover:border-purple-500/50 bg-background'}`}>
            {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
          </div>
        </div>
      )}
      <Link href={`/shipping-scanner/${order.id}?store=${store}`} className="block h-full">
        <div className={`glass-panel p-6 rounded-xl hover-scale cursor-pointer group transition-colors h-full flex flex-col relative ${isSelected ? 'border-purple-500 border-2' : 'hover:border-primary/50'}`}>
          <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary group-hover:text-primary/80" />
            הזמנה #{order.id}
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 ${colorClasses[statusColor]}`}>
            {statusLabel}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground flex-1">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 shrink-0" />
            <span>{mounted ? format(new Date(order.dateCreated), 'dd/MM/yyyy HH:mm', { locale: he }) : ''}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50 text-foreground font-medium flex justify-between items-center">
          <span>סה"כ לתשלום:</span>
          <span>₪{parseFloat(order.total).toFixed(2)}</span>
        </div>
      </div>
    </Link>
    </div>
  );
}
