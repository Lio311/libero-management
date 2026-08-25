"use client";

import { useState, useEffect, useRef } from "react";
import { ScannerOrder, markOrderCompleted, reportMissingItemsAction, createOrderLabel } from "@/app/actions/scanner-actions";
import { ArrowRight, Check, X, AlertTriangle, ScanLine, Pause, CheckCircle2, Package, Printer, Camera } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ScannerClientProps {
  order: ScannerOrder;
  manualKeywords: string[];
  store?: string;
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

export default function ScannerClient({ order, manualKeywords, store = "libero" }: ScannerClientProps) {
  const router = useRouter();
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [items, setItems] = useState<ItemStatus[]>([]);
    const [localOrderStatus, setLocalOrderStatus] = useState<"processing" | "ready" | "on_hold" | "completed">("processing");
  const [missingMode, setMissingMode] = useState(false);
  const [selectedForMissing, setSelectedForMissing] = useState<number[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [labelCopies, setLabelCopies] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop" | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    setDeviceType(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "desktop");
    setMounted(true);
  }, []);


  const hasMiniPerfumes = order.lineItems?.some(item => (item.name || "").includes("מיני בושם"));
  const showMiniPerfumeBtn = store === "libero" && hasMiniPerfumes;


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
        router.push(`/shipping-scanner?store=${store}`);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);


    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  // Initialize state from local storage or order
  useEffect(() => {
    const storageKey = `scanner_order_${store}_${order.id}`;
    let saved = localStorage.getItem(storageKey);
    if (!saved && store === "libero") saved = localStorage.getItem(`scanner_order_${order.id}`);
    
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
      const storageKey = `scanner_order_${store}_${order.id}`;
      localStorage.setItem(storageKey, JSON.stringify({ items, status: localOrderStatus }));
    }
  }, [items, localOrderStatus, order.id]);



  const processBarcode = (sku: string) => {
    if (!sku) return;

    if (localOrderStatus !== "processing") {
      toast.error(`ההזמנה בסטטוס ${localOrderStatus === 'on_hold' ? 'מושהה' : 'הושלם'} ואינה ניתנת לסריקה`);
      setScanError(`ההזמנה ${localOrderStatus === 'on_hold' ? 'מושהית' : 'הושלמה'}`);
      return;
    }

    const normalizedScanned = sku.toLowerCase().replace(/^0+/, '');
    
    let itemIndex = items.findIndex(item => String(item.sku).trim().toLowerCase() === sku.toLowerCase() && !item.isManual);
    if (itemIndex === -1) {
      // Fallback: Try matching without leading zeros
      itemIndex = items.findIndex(item => String(item.sku).trim().toLowerCase().replace(/^0+/, '') === normalizedScanned && !item.isManual);
    }
    
    if (itemIndex === -1) {
      let manualIndex = items.findIndex(item => String(item.sku).trim().toLowerCase() === sku.toLowerCase() && item.isManual);
      if (manualIndex === -1) {
        manualIndex = items.findIndex(item => String(item.sku).trim().toLowerCase().replace(/^0+/, '') === normalizedScanned && item.isManual);
      }
      if (manualIndex !== -1) {
        toast.info("מוצר ללא ברקוד - יש לאשר ידנית עם כפתור ה-סמן ידנית");
        setScanError("מוצר ללא ברקוד - יש לאשר ידנית");
      } else {
        toast.error(`מק"ט לא חוקי: ${sku} לא נמצא בהזמנה זו!`);
        setScanError(`מק"ט שגוי: ${sku} לא נמצא בהזמנה`);
      }
    } else {
      const item = items[itemIndex];
      if (item.scanned >= item.expected) {
        toast.error(`כבר נסרקו כל הפריטים מסוג זה (${item.name})`);
        setScanError(`כבר נסרק במלואו: ${item.name}`);
      } else {
        const newItems = [...items];
        newItems[itemIndex].scanned += 1;
        setItems(newItems);
        const isAllDone = newItems.every(i => i.scanned >= i.expected || i.isMissing);
        if (!isAllDone) {
          toast.success(`נסרק בהצלחה: ${item.name}`, { id: `scan_${item.id}_${newItems[itemIndex].scanned}` });
        }
        checkCompletion(newItems);
      }
    }
  };

  const processBarcodeRef = useRef(processBarcode);
  useEffect(() => {
    processBarcodeRef.current = processBarcode;
  }, [processBarcode]);

  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (isCameraOpen) {
      // Ensure element exists before starting
      const readerElement = document.getElementById("reader");
      if (!readerElement) return;

      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;
      
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 75 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          if (!isProcessingRef.current) {
             isProcessingRef.current = true;
             processBarcodeRef.current(decodedText.trim());
             
             // Optionally vibrate on successful scan
             if (navigator.vibrate) {
                navigator.vibrate(100);
             }

             setTimeout(() => {
                isProcessingRef.current = false;
             }, 1200);
          }
        },
        (errorMessage) => {
          // ignore
        }
      ).catch((err) => {
        console.error("Camera start failed:", err);
        toast.error("שגיאה בהפעלת המצלמה. ודא שניתנו הרשאות מתאימות.");
        setIsCameraOpen(false);
      });
    } else {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current?.clear();
            html5QrCodeRef.current = null;
          }).catch(err => console.error("Error stopping camera async", err));
        } catch (err) {
          console.error("Error stopping camera sync", err);
          try { html5QrCodeRef.current?.clear(); } catch(e) {}
          html5QrCodeRef.current = null;
        }
      }
    }
    
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current?.clear();
          }).catch(e => console.error("Async stop error unmount", e));
        } catch (e) {
          console.error("Sync stop error unmount", e);
          try { html5QrCodeRef.current?.clear(); } catch(e2) {}
        }
      }
    }
  }, [isCameraOpen]);



  const markItemAsScanned = (id: number) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, scanned: Math.min(item.expected, item.scanned + 1) };
      }
      return item;
    });
    setItems(newItems);
    const isAllDone = newItems.every(i => i.scanned >= i.expected || i.isMissing);
    if (!isAllDone) {
      toast.success("מוצר סומן בהצלחה", { id: `manual_scan_${id}` });
    }
    checkCompletion(newItems);
  };

  const checkCompletion = (currentItems: ItemStatus[]) => {
    const allDone = currentItems.every(item => item.scanned >= item.expected || item.isMissing);
    const hasMissing = currentItems.some(item => item.isMissing);
    
    if (allDone) {
      if (hasMissing) {
        setLocalOrderStatus("on_hold");
        toast.warning("סריקה הסתיימה, אך יש פריטים חסרים. הסטטוס שונה למושהה.", { id: "all_done_missing" });
      } else {
        setLocalOrderStatus("ready");
        setShowCompletionModal(true);
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

  const submitMissing = async () => {
    if (selectedForMissing.length === 0) {
      setMissingMode(false);
      return;
    }

    const newlyMissingItems = items.filter(item => selectedForMissing.includes(item.id));

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

    try {
      await reportMissingItemsAction({
        orderId: order.id,
        store: store || "libero",
        customerName: order.customerName,
        missingItems: newlyMissingItems.map(item => ({
          sku: item.sku,
          name: item.name,
          expected: item.expected,
          scanned: item.scanned
        }))
      });
      toast.success("נשלח דיווח אוטומטי למנהל המערכת על החוסרים");
    } catch (e) {
      console.error(e);
    }
  };

  
  const handlePrintLabel = async () => {
    setIsPrinting(true);
    try {
      toast.info("מייצר מדבקת משלוח...");
      const res = await createOrderLabel(order.id, (store || "libero") as "libero" | "velour" | "labura");
      if (res.success && res.labelUrl) {
        toast.success("מדבקה נוצרה בהצלחה! פותח להדפסה...");
        
        // On mobile, use server-side proxy that extracts the real PDF
        // so Android shows it inline with a print button instead of a download screen
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          window.open(`/api/lionwheel/proxy-pdf?url=${encodeURIComponent(res.labelUrl)}`, '_blank');
        } else {
          window.open(res.labelUrl, '_blank');
        }
      } else {
        toast.error("שגיאה ביצירת המדבקה: " + (res.error || "לא ידוע"));
      }
    } catch (e) {
      toast.error("שגיאה בתקשורת עם השרת");
    } finally {
      setIsPrinting(false);
    }
  };

  
  const handleRemotePrintLabel = async () => {
    setIsPrinting(true);
    try {
      toast.info("מייצר מדבקת משלוח...");
      const res = await createOrderLabel(order.id, (store || "libero") as "libero" | "velour" | "labura");
      if (res.success && res.labelUrl) {
        
        const printRes = await fetch("/api/remote-print", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              store: store || "libero", 
              orderIds: [order.id],
              jobType: 'shipping-label',
              metadata: { url: res.labelUrl, copies: labelCopies }
            })
        });

        if (printRes.ok) {
          toast.success("פקודת ההדפסה נשלחה בהצלחה למחשב!");
        } else {
          toast.error("שגיאה בשליחת פקודת הדפסה למחשב");
        }
      } else {
        toast.error("שגיאה ביצירת המדבקה: " + (res.error || "לא ידוע"));
      }
    } catch (e) {
      toast.error("שגיאה בתקשורת עם השרת");
    } finally {
      setIsPrinting(false);
    }
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
      {order.reward?.requiresManagerReview && (
        <div className="bg-red-500/10 border-2 border-red-500 p-4 rounded-xl flex items-center gap-4 animate-pulse shadow-lg">
          <AlertTriangle className="w-10 h-10 text-red-600" />
          <div>
            <h3 className="text-xl font-bold text-red-700">הזמנה מיוחדת - חובה אישור מנהל!</h3>
            <p className="text-red-600/80 font-medium">
              הזמנה זו דורשת התערבות מנהל (מעל 2,500₪ או שרוב ההזמנה מכילה מותגי בית). נא לא לארוז ללא אישור.
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col mb-8 gap-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/shipping-scanner?store=${store}`} className="p-2 hover:bg-secondary rounded-full transition-colors shrink-0">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">הזמנה #{order.id}</h2>
            <p className="text-muted-foreground">{order.customerName}</p>
          </div>
        </div>
        
        {/* Status */}
        <div className="w-full">
          {localOrderStatus === "processing" && (
            <span className="w-full justify-center px-4 py-3 rounded-xl font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-2">
              <ScanLine className="w-5 h-5" /> בתהליך סריקה
            </span>
          )}
          {localOrderStatus === "on_hold" && (
            <span className="w-full justify-center px-4 py-3 rounded-xl font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center gap-2">
              <Pause className="w-5 h-5" /> מושהה (חוסרים)
            </span>
          )}
          {localOrderStatus === "completed" && (
            <span className="w-full justify-center px-4 py-3 rounded-xl font-bold bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> כלל המוצרים בהזמנה נסרקו
            </span>
          )}
        </div>
        
        {/* Print Buttons */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 w-full">
            {showMiniPerfumeBtn && (
              <button 
                onClick={async () => {
                  toast.info("שולח בקשה להדפסת בושם...");
                  try {
                    const res = await fetch("/api/remote-print", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ store: store || "libero", orderIds: [order.id] })
                    });
                    if (res.ok) toast.success("נשלח למדפסת הבושם!");
                    else toast.error("שגיאה בשליחת פקודת הדפסה");
                  } catch (e) {
                    toast.error("שגיאת תקשורת");
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-2 py-3 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 rounded-xl font-bold transition-colors h-14 border border-purple-200 flex-1 whitespace-nowrap text-xs sm:text-sm"
              >
                <Printer className="w-4 h-4 shrink-0" />
                הדפס מדבקות
              </button>
            )}

            <button 
              onClick={handleRemotePrintLabel}
              disabled={isPrinting}
              className="flex items-center justify-center gap-1.5 px-2 py-3 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-xl font-bold transition-colors disabled:opacity-50 h-14 border border-blue-200 flex-1 whitespace-nowrap text-xs sm:text-sm"
            >
              <Printer className="w-4 h-4 shrink-0" />
              {isPrinting ? "מפיק..." : `הדפס לייבל${labelCopies > 1 ? ` (×${labelCopies})` : ""}`}
            </button>

            {/* Copies selector */}
            <div className="flex items-center h-14 rounded-xl border border-border bg-card overflow-hidden shrink-0">
              <button
                onClick={() => setLabelCopies(Math.max(1, labelCopies - 1))}
                className="px-3 h-full text-lg font-bold hover:bg-secondary transition-colors text-muted-foreground"
              >
                −
              </button>
              <span className="px-2 text-base font-bold min-w-[28px] text-center">{labelCopies}</span>
              <button
                onClick={() => setLabelCopies(Math.min(10, labelCopies + 1))}
                className="px-3 h-full text-lg font-bold hover:bg-secondary transition-colors text-muted-foreground"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {order.reward && (order.reward.gift || !store || store === 'libero') && (
        <div className="p-2 mb-6 flex flex-col sm:flex-row items-center gap-6 justify-between w-full">
            <div className="flex flex-col gap-3 flex-1">
              {order.reward.gift && (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-foreground">
                      הוראות למחסן
                    </h3>
                  </div>
                  <div className="flex flex-wrap sm:flex-row gap-3 sm:gap-6">
                    <div className="flex items-center gap-2 bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-500/20">
                      <span className="text-xl">🎁</span>
                      <span className="font-bold text-pink-700">מתנה: {order.reward.gift}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {order.gender === 'male' && (
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm" title="גבר">
                  <span className="text-3xl font-black leading-none mb-1">♂</span>
                </div>
              )}
              {order.gender === 'female' && (
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20 shadow-sm" title="אישה">
                  <span className="text-3xl font-black leading-none mb-1">♀</span>
                </div>
              )}
              {(!store || store === 'libero') && (
                <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 shrink-0">
                  <span className="text-4xl font-black">{order.reward.score}</span>
                  <span className="text-xs font-medium opacity-80 uppercase tracking-widest">ציון לקוח</span>
                </div>
              )}
            </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        
        {!isCameraOpen ? (
          <button
            onClick={() => {
              setScanError(null);
              setIsCameraOpen(true);
            }}
            disabled={localOrderStatus !== "processing" || missingMode}
            className="w-full px-4 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-3 shadow-md border border-blue-500/50"
          >
            <Camera className="w-8 h-8" />
            <span>פתח מצלמה לסריקה</span>
          </button>
        ) : (
          <div className="w-full flex flex-col gap-2 relative">
            <button 
              onClick={() => setIsCameraOpen(false)}
              className="absolute top-2 left-2 z-10 bg-red-500/80 text-white p-2 rounded-lg backdrop-blur-sm shadow hover:bg-red-600 transition-colors"
              title="סגור מצלמה"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-[150px] mx-auto overflow-hidden rounded-xl shadow-inner bg-black flex items-center justify-center">
              <div id="reader" className="w-full shrink-0"></div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              סריקה אוטומטית - מקם את הברקוד באמצע
            </p>
          </div>
        )}

        {scanError && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-center font-bold text-lg animate-in fade-in slide-in-from-top-2 border border-red-200 shadow-sm flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{scanError}</span>
          </div>
        )}

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
              onClick={async (e) => {
                const btn = e.currentTarget;
                btn.disabled = true;
                btn.innerText = "סוגר...";
                const success = await markOrderCompleted(order.id, (store || "libero") as "libero" | "velour" | "labura");
                if (success) {
                  setLocalOrderStatus("completed");
                  toast.success("ההזמנה נסגרה בהצלחה ובאתר!");
                  router.push(`/shipping-scanner?store=${store}`);
                } else {
                  toast.error("שגיאה בסגירת ההזמנה באתר");
                  btn.disabled = false;
                  btn.innerText = "סגירת הזמנה";
                }
              }}
              className="px-4 py-3 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors font-medium h-full flex items-center justify-center disabled:opacity-50"
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

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card border border-border p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">כל הפריטים נסרקו!</h2>
            <p className="text-muted-foreground text-lg">מה תרצה לעשות כעת?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <button
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  btn.disabled = true;
                  btn.innerHTML = "סוגר הזמנה...";
                  const success = await markOrderCompleted(order.id, (store || "libero") as "libero" | "velour" | "labura");
                  if (success) {
                    setLocalOrderStatus("completed");
                    setShowCompletionModal(false);
                    toast.success("ההזמנה נסגרה בהצלחה ובאתר!");
                    router.push(`/shipping-scanner?store=${store}`);
                  } else {
                    toast.error("שגיאה בסגירת ההזמנה באתר, נסה שוב");
                    btn.disabled = false;
                    btn.innerHTML = "<svg class='w-5 h-5 mr-2 inline' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/></svg> סגירת הזמנה";
                  }
                }}
                className="px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                סגירת הזמנה
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  router.push(`/shipping-scanner?store=${store}`);
                }}
                className="px-6 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                חזרה להזמנות
              </button>
            </div>
            <button 
              onClick={() => setShowCompletionModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
