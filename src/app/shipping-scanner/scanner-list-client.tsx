"use client";

import Link from "next/link";
import { Package, CalendarIcon, User, Truck, Store, PlayCircle, CheckCircle2, ListTodo, Printer, Search, ChevronDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScannerOrder, createOrderLabel, getArchivedCompletedOrders } from "@/app/actions/scanner-actions";

import { useRouter } from "next/navigation";
import { CreateLabelModal } from "@/components/modals/create-label-modal";

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
  const [orders, setOrders] = useState<ScannerOrder[]>(initialOrders);
  useEffect(() => {
    setOrders(initialOrders);
    setArchivedLoaded(false);
  }, [initialOrders]);
  const [archivedLoaded, setArchivedLoaded] = useState(false);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);


  const stats = initialStats;
  const store = initialStore;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop" | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredOrders = orders.filter(o => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.id.toString().includes(term) ||
      (o.customerName || '').toLowerCase().includes(term) ||
      (o.phone || '').includes(term) ||
      (o.shippingNumber || '').toLowerCase().includes(term) ||
      (o.shippingAddress || '').toLowerCase().includes(term)
    );
  });

  const processingOrders = filteredOrders.filter(o => o.status === 'processing');
  const completedOrders = filteredOrders.filter(o => o.status === 'completed');
  
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex flex-wrap items-center gap-3">
            סריקת משלוחים
          </h2>
          <div className="flex bg-secondary/50 p-1.5 rounded-xl w-full sm:w-fit justify-between sm:justify-start border border-border/50 mx-auto sm:mx-0">
            <button 
              onClick={() => router.push("?store=libero")}
              className={`flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-lg font-medium transition-all ${store === "libero" ? "bg-blue-600 shadow-sm text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              ליברו
            </button>
            <button 
              onClick={() => router.push("?store=velour")}
              className={`flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-lg font-medium transition-all ${store === "velour" ? "bg-blue-600 shadow-sm text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              וולור
            </button>
            <button 
              onClick={() => router.push("?store=labura")}
              className={`flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-lg font-medium transition-all ${store === "labura" ? "bg-blue-600 shadow-sm text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              לה בורה
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 items-center justify-end flex-wrap w-full">
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
              className="px-4 py-3 sm:py-2.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 h-14 sm:h-12 min-w-[140px]"
            >
              סנכרן נתונים עכשיו
            </button>
          )}
          
          {isAdmin && (
            <button 
              onClick={async (e) => {
                const btn = e.currentTarget;
                const originalText = btn.innerText;
                btn.innerText = "מנקה...";
                btn.disabled = true;
                try {
                  const { clearPrintQueueAction } = await import('@/app/actions/scanner-actions');
                  const res = await clearPrintQueueAction();
                  if (res.success) {
                    toast.success("תור ההדפסות נוקה בהצלחה");
                  } else {
                    toast.error("שגיאה בניקוי התור");
                  }
                } catch (err) {
                  toast.error("שגיאה בניקוי התור");
                } finally {
                  btn.innerText = "נקה תור הדפסות";
                  btn.disabled = false;
                }
              }}
              className="px-4 py-3 sm:py-2.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 h-14 sm:h-12 min-w-[140px]"
            >
              נקה תור הדפסות
            </button>
          )}
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsLabelModalOpen(true)}
              className="order-2 sm:order-1 px-4 py-3 sm:py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 min-w-[140px] sm:h-12 h-14 bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border border-gray-200"
              title="יצירת מדבקה"
            >
              יצירת מדבקה
            </button>
            <div className="order-1 sm:order-2 flex items-center gap-2 w-full sm:w-auto">
              {store === "libero" && (
                <button
                  disabled={selectedOrderIds.length === 0}
                  onClick={handleRemotePrint}
                  className={`flex-1 sm:flex-none px-2 sm:px-4 py-3 sm:py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 sm:min-w-[140px] sm:h-12 h-14 whitespace-nowrap text-xs sm:text-sm ${
                    selectedOrderIds.length > 0 
                      ? "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border border-purple-200" 
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  }`}
                  title="הדפס מדבקות מיני בושם"
                >
                  <Printer className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  {selectedOrderIds.length > 0 
                    ? `מדבקות (${selectedOrderIds.length})` 
                    : "הדפס מדבקות"}
                </button>
              )}
              <button
                disabled={selectedOrderIds.length === 0}
                onClick={handleRemotePrintShipping}
                className={`flex-1 sm:flex-none px-2 sm:px-4 py-3 sm:py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 sm:min-w-[140px] sm:h-12 h-14 whitespace-nowrap text-xs sm:text-sm ${
                  selectedOrderIds.length > 0 
                    ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-200" 
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                }`}
                title="הדפס לייבל משלוח"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                 {selectedOrderIds.length > 0 
                  ? `לייבלים (${selectedOrderIds.length})` 
                  : "הדפס לייבל"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-2xl">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="חיפוש לפי מספר הזמנה, מספר משלוח, שם, טלפון..."
          className="block w-full pl-3 pr-10 py-3 md:py-4 border border-border rounded-xl leading-5 bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
          dir="rtl"
        />
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
          
          {!archivedLoaded ? (
            <button
              onClick={async () => {
                setIsLoadingArchived(true);
                try {
                  const archived = await getArchivedCompletedOrders(store as any, 20);
                  setOrders(prev => [...prev, ...archived]);
                  setArchivedLoaded(true);
                } catch(err) {
                  console.error(err);
                } finally {
                  setIsLoadingArchived(false);
                }
              }}
              className="mt-6 w-full py-4 bg-secondary/50 hover:bg-secondary rounded-xl border border-border/50 text-muted-foreground flex items-center justify-center gap-2 transition-all font-medium"
            >
              {isLoadingArchived ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  טוען היסטוריית הזמנות...
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  הצג את כל היסטוריית ההזמנות
                </>
              )}
            </button>
          ) : (
            <div className="mt-6 text-center text-sm text-muted-foreground pb-8">
              כל היסטוריית ההזמנות נטענה בהצלחה.
            </div>
          )}
        </div>
      )}
      <CreateLabelModal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} />
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
