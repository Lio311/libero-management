"use client";

import { useState, useEffect, useRef } from "react";
import { ScannerOrder } from "@/app/actions/scanner-actions";
import { ArrowRight, Check, X, AlertTriangle, ScanLine, Pause, CheckCircle2, Package } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ScannerClientProps {
  order: ScannerOrder;
  manualKeywords: string[];
}

type ItemStatus = {
  id: number; // line item id
  sku: string;
  name: string;
  expected: number;
  scanned: number;
  isManual: boolean;
  isMissing: boolean;
  imageUrl?: string;
};

export default function ScannerClient({ order, manualKeywords }: ScannerClientProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ItemStatus[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [localOrderStatus, setLocalOrderStatus] = useState<"processing" | "ready" | "on_hold" | "completed">("processing");
  const [missingMode, setMissingMode] = useState(false);
  const [selectedForMissing, setSelectedForMissing] = useState<number[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Refs for global keydown scanner
  const scanBuffer = useRef("");
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  // Swipe to go back gesture (pulling from right edge)
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Start near right edge (> innerWidth - 50px) and swipe left (deltaX < -70px)
      if (touchStartX > window.innerWidth - 50 && deltaX < -70 && Math.abs(deltaY) < 50) {
        router.push("/shipping-scanner");
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    // Initial focus
    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  // Initialize state from local storage or order
  useEffect(() => {
    const storageKey = `scanner_order_${order.id}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed.items);
        if (parsed.status) setLocalOrderStatus(parsed.status);
      } catch (e) {
        initFromOrder();
      }
    } else {
      initFromOrder();
    }
  }, [order, manualKeywords]);

  const initFromOrder = () => {
    const initialItems = order.lineItems.map((item: any) => {
      const name = item.name || "";
      const isManual = manualKeywords.some(kw => name.includes(kw));
      // Extract image URL from WooCommerce item format if available
      const imageUrl = item.image?.src || (item.meta_data?.find((m: any) => m.key === '_image_url')?.value) || undefined;
      return {
        id: item.id,
        sku: item.sku || "",
        name: name,
        expected: item.quantity || 1,
        scanned: 0,
        isManual,
        isMissing: false,
        imageUrl,
      };
    });
    setItems(initialItems);
  };

  // Save to local storage on change
  useEffect(() => {
    if (items.length > 0) {
      const storageKey = `scanner_order_${order.id}`;
      localStorage.setItem(storageKey, JSON.stringify({ items, status: localOrderStatus }));
    }
  }, [items, localOrderStatus, order.id]);

  // Keep focus on input
  useEffect(() => {
    const focusInput = () => {
      if (!missingMode && inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    focusInput();
    window.addEventListener("click", focusInput);
    return () => window.removeEventListener("click", focusInput);
  }, [missingMode]);

  const processBarcode = (sku: string) => {
    if (!sku) return;

    if (localOrderStatus !== "processing") {
      toast.error(`ההזמנה בסטטוס ${localOrderStatus === 'on_hold' ? 'מושהה' : 'הושלם'} ואינה ניתנת לסריקה`);
      return;
    }

    const itemIndex = items.findIndex(item => item.sku.toLowerCase() === sku.toLowerCase() && !item.isManual);
    
    if (itemIndex === -1) {
      const manualIndex = items.findIndex(item => item.sku.toLowerCase() === sku.toLowerCase() && item.isManual);
      if (manualIndex !== -1) {
        toast.info("מוצר ללא ברקוד - יש לאשר ידנית עם כפתור ה-סמן ידנית");
      } else {
        toast.error(`מק"ט לא חוקי: ${sku} לא נמצא בהזמנה זו!`);
      }
    } else {
      const item = items[itemIndex];
      if (item.scanned >= item.expected) {
        toast.error(`כבר נסרקו כל הפריטים מסוג זה (${item.name})`);
      } else {
        const newItems = [...items];
        newItems[itemIndex].scanned += 1;
        setItems(newItems);
        toast.success(`נסרק בהצלחה: ${item.name}`);
        checkCompletion(newItems);
      }
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const sku = scanInput.trim();
    if (sku) {
      processBarcode(sku);
      setScanInput("");
    }
  };

  const markItemAsScanned = (id: number) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, scanned: item.expected };
      }
      return item;
    });
    setItems(newItems);
    toast.success("מוצר סומן בהצלחה");
    checkCompletion(newItems);
  };

  const checkCompletion = (currentItems: ItemStatus[]) => {
    const allDone = currentItems.every(item => item.scanned >= item.expected || item.isMissing);
    const hasMissing = currentItems.some(item => item.isMissing);
    
    if (allDone) {
      if (hasMissing) {
        setLocalOrderStatus("on_hold");
        toast.warning("סריקה הסתיימה, אך יש פריטים חסרים. הסטטוס שונה למושהה.");
      } else {
        setLocalOrderStatus("ready");
        toast.success("כל הפריטים נסרקו! יש לסגור את ההזמנה ידנית.");
      }
    }
  };

  const toggleMissingSelection = (id: number) => {
    if (selectedForMissing.includes(id)) {
      setSelectedForMissing(selectedForMissing.filter(i => i !== id));
    } else {
      setSelectedForMissing([...selectedForMissing, id]);
    }
  };

  const submitMissing = () => {
    if (selectedForMissing.length === 0) {
      setMissingMode(false);
      return;
    }

    const newItems = items.map(item => {
      if (selectedForMissing.includes(item.id)) {
        return { ...item, isMissing: true };
      }
      return item;
    });

    setItems(newItems);
    setSelectedForMissing([]);
    setMissingMode(false);
    
    // Changing order status to on_hold due to missing items
    setLocalOrderStatus("on_hold");
    toast.warning("פריטים סומנו כחסרים. ההזמנה הועברה לסטטוס מושהה.");
    checkCompletion(newItems);
  };

  const resetOrder = () => {
    toast.error("האם לאפס את כל התקדמות הסריקה בהזמנה זו?", {
      action: {
        label: "כן, אפס",
        onClick: () => {
          initFromOrder();
          setLocalOrderStatus("processing");
          toast.info("ההזמנה אופסה");
        }
      },
      cancel: {
        label: "ביטול",
        onClick: () => {}
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/shipping-scanner" className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">הזמנה #{order.id}</h2>
            <p className="text-muted-foreground">{order.customerName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {localOrderStatus === "processing" && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-2">
              <ScanLine className="w-4 h-4" /> בתהליך סריקה
            </span>
          )}
          {localOrderStatus === "on_hold" && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center gap-2">
              <Pause className="w-4 h-4" /> מושהה (חוסרים)
            </span>
          )}
          {localOrderStatus === "completed" && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> כלל המוצרים בהזמנה נסרקו
            </span>
          )}
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl shadow-sm border border-border/50 flex flex-col gap-4">
        <form onSubmit={handleScan} className="w-full relative">
          <input
            ref={inputRef}
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="סרוק מוצר או הזן ברקוד..."
            className="w-full px-4 py-3 pl-10 bg-background border border-border rounded-lg text-lg focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
            disabled={localOrderStatus !== "processing" || missingMode}
          />
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {!missingMode ? (
            <button
              onClick={() => setMissingMode(true)}
              disabled={localOrderStatus !== "processing"}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 text-sm h-full flex items-center justify-center"
            >
              סימון חסר
            </button>
          ) : (
            <>
              <button
                onClick={submitMissing}
                className="px-2 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors text-sm h-full flex items-center justify-center"
              >
                אישור ({selectedForMissing.length})
              </button>
              <button
                onClick={() => {
                  setMissingMode(false);
                  setSelectedForMissing([]);
                }}
                className="px-2 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors text-sm h-full flex items-center justify-center"
              >
                ביטול חסר
              </button>
            </>
          )}
          
          {localOrderStatus === "completed" && (
            <button
              onClick={() => {
                setLocalOrderStatus("ready");
                toast.info("ההזמנה חזרה למצב מוכן לסגירה");
              }}
              className="px-4 py-3 border border-border rounded-lg text-sm hover:bg-secondary transition-colors font-medium h-full flex items-center justify-center"
            >
              ביטול סגירה
            </button>
          )}

          {localOrderStatus === "ready" && (
            <button
              onClick={() => {
                setLocalOrderStatus("completed");
                toast.success("ההזמנה נסגרה בהצלחה!");
              }}
              className="px-4 py-3 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors font-medium h-full flex items-center justify-center"
            >
              סגירת הזמנה
            </button>
          )}

          <button
            onClick={resetOrder}
            className="px-4 py-3 border border-border rounded-lg text-sm hover:bg-secondary transition-colors font-medium h-full flex items-center justify-center"
          >
            איפוס סריקה
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const isDone = item.scanned >= item.expected;
          const isMissingSelected = selectedForMissing.includes(item.id);
          
          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${
                isDone 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : item.isMissing 
                    ? 'bg-red-500/5 border-red-500/20 opacity-75' 
                    : isMissingSelected
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-card border-border/50'
              }`}
              onClick={() => {
                if (missingMode && !isDone && !item.isMissing) {
                  toggleMissingSelection(item.id);
                }
              }}
            >
              <div className="flex items-start gap-3 w-full relative">
                {/* Checkbox for Missing Mode */}
                {missingMode && !isDone && !item.isMissing && (
                  <div className="absolute -right-2 -top-2">
                    <div className={`w-6 h-6 rounded-full border shadow-sm flex items-center justify-center shrink-0 ${isMissingSelected ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-input'}`}>
                      {isMissingSelected && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                )}
                
                {/* Image */}
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-16 h-16 rounded-md object-cover border border-border shrink-0 cursor-pointer" 
                    onClick={() => setZoomedImage(item.imageUrl!)}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm leading-tight mb-1 ${isDone ? 'text-green-500' : item.isMissing ? 'text-destructive line-through' : ''}`}>
                    {item.name}
                  </h4>
                  <p className="text-sm text-muted-foreground font-mono">
                    <span className="font-bold text-foreground">{item.sku || 'ללא מק"ט'}</span>
                  </p>
                  {item.isManual && (
                    <span className="inline-block mt-1 text-xs bg-secondary px-2 py-0.5 rounded-full font-sans">
                      אישור ידני
                    </span>
                  )}
                </div>
              </div>

              {/* Actions and Progress Bottom Bar */}
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/50">
                <div className="flex items-center gap-2">
                  {!isDone && !item.isMissing && localOrderStatus === "processing" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markItemAsScanned(item.id);
                      }}
                      className="h-10 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center gap-2 transition-colors font-medium text-sm"
                    >
                      סמן ידנית
                    </button>
                  )}
                  {isDone && !item.isMissing && (
                    <div className="h-10 px-3 rounded-lg bg-green-500/10 text-green-500 flex items-center gap-1 font-medium text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      נסרק
                    </div>
                  )}
                </div>

                <div className="text-left">
                  <div className="text-[10px] text-muted-foreground mb-0.5">נסרקו / סה״כ</div>
                  <div className="font-semibold text-base whitespace-nowrap">
                    {item.isMissing ? (
                      <span className="text-destructive"><AlertTriangle className="w-4 h-4 inline mr-1" /> חסר</span>
                    ) : (
                      <span className={isDone ? 'text-green-500' : item.scanned > 0 ? 'text-orange-500' : 'text-red-500'}>
                        {item.scanned} מתוך {item.expected}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Zoom Overlay */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
            onClick={(e) => {
              e.stopPropagation();
              setZoomedImage(null);
            }}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed product" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
