"use client";

import { useState, useEffect, useRef } from "react";
import { ScannerOrder } from "@/app/actions/scanner-actions";
import { ArrowRight, Check, X, AlertTriangle, ScanLine, Pause, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ScannerClientProps {
  order: ScannerOrder;
}

type ItemStatus = {
  id: number; // line item id
  sku: string;
  name: string;
  expected: number;
  scanned: number;
  isMini: boolean;
  isMissing: boolean;
};

export default function ScannerClient({ order }: ScannerClientProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ItemStatus[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [localOrderStatus, setLocalOrderStatus] = useState<"processing" | "on_hold" | "completed">("processing");
  const [missingMode, setMissingMode] = useState(false);
  const [selectedForMissing, setSelectedForMissing] = useState<number[]>([]);

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
  }, [order]);

  const initFromOrder = () => {
    const initialItems = order.lineItems.map((item: any) => ({
      id: item.id,
      sku: item.sku || "",
      name: item.name || "",
      expected: item.quantity || 1,
      scanned: 0,
      isMini: (item.name || "").includes("מיני"),
      isMissing: false,
    }));
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

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const sku = scanInput.trim();
    if (!sku) return;

    if (localOrderStatus !== "processing") {
      toast.error(`ההזמנה בסטטוס ${localOrderStatus === 'on_hold' ? 'מושהה' : 'הושלם'} ואינה ניתנת לסריקה`);
      setScanInput("");
      return;
    }

    const itemIndex = items.findIndex(item => item.sku.toLowerCase() === sku.toLowerCase() && !item.isMini);
    
    if (itemIndex === -1) {
      // Check if it's a mini item
      const miniIndex = items.findIndex(item => item.sku.toLowerCase() === sku.toLowerCase() && item.isMini);
      if (miniIndex !== -1) {
        toast.info("מוצר מיני בושם - יש לאשר ידנית עם כפתור ה-V");
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
    
    setScanInput("");
    if (inputRef.current) inputRef.current.focus();
  };

  const markMiniAsScanned = (id: number) => {
    const newItems = items.map(item => {
      if (item.id === id && item.isMini) {
        return { ...item, scanned: item.expected };
      }
      return item;
    });
    setItems(newItems);
    toast.success("מוצר סומן כנאסף");
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
        setLocalOrderStatus("completed");
        toast.success("כל הפריטים נסרקו! ההזמנה הושלמה.");
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
    if (confirm("האם לאפס את כל התקדמות הסריקה בהזמנה זו?")) {
      initFromOrder();
      setLocalOrderStatus("processing");
      toast.info("ההזמנה אופסה");
    }
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
              <CheckCircle2 className="w-4 h-4" /> סריקה הושלמה
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center bg-card p-4 rounded-xl shadow-sm border border-border/50">
        <form onSubmit={handleScan} className="flex-1 max-w-sm relative">
          <input
            ref={inputRef}
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="סרוק מקט..."
            className="w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
            disabled={localOrderStatus !== "processing" || missingMode}
            autoFocus
          />
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </form>

        <div className="flex gap-2">
          {!missingMode ? (
            <button
              onClick={() => setMissingMode(true)}
              disabled={localOrderStatus !== "processing"}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              סימון חסר פריט
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setMissingMode(false);
                  setSelectedForMissing([]);
                }}
                className="px-4 py-2 bg-ghost text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={submitMissing}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors"
              >
                אישור חסרים ({selectedForMissing.length})
              </button>
            </>
          )}
          
          <button
            onClick={resetOrder}
            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
          >
            איפוס סריקה
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isDone = item.scanned >= item.expected;
          const isMissingSelected = selectedForMissing.includes(item.id);
          
          return (
            <div 
              key={item.id} 
              className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                item.isMissing 
                  ? 'bg-destructive/5 border-destructive/20' 
                  : isDone 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : isMissingSelected
                      ? 'bg-orange-500/10 border-orange-500/50'
                      : 'bg-card border-border/50'
              }`}
              onClick={() => {
                if (missingMode && !isDone && !item.isMissing) {
                  toggleMissingSelection(item.id);
                }
              }}
            >
              <div className="flex items-center gap-4">
                {missingMode && !isDone && !item.isMissing && (
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${isMissingSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-input'}`}>
                    {isMissingSelected && <Check className="w-3 h-3" />}
                  </div>
                )}
                
                <div>
                  <h4 className={`font-medium ${isDone ? 'text-green-500' : item.isMissing ? 'text-destructive line-through' : ''}`}>
                    {item.name}
                  </h4>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    {item.sku || 'ללא מק"ט'} {item.isMini && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full mr-2">מוצר מיני</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">כמות</div>
                  <div className="font-semibold text-lg">
                    {item.isMissing ? (
                      <span className="text-destructive"><AlertTriangle className="w-5 h-5 inline mr-1" /> חסר</span>
                    ) : (
                      <span className={isDone ? 'text-green-500' : ''}>
                        {item.scanned} / {item.expected}
                      </span>
                    )}
                  </div>
                </div>

                {item.isMini && !isDone && !item.isMissing && localOrderStatus === "processing" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markMiniAsScanned(item.id);
                    }}
                    className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white flex items-center justify-center transition-colors"
                    title="אשר איסוף מיני בושם"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
                
                {isDone && !item.isMissing && (
                  <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                
                {item.isMissing && (
                  <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
