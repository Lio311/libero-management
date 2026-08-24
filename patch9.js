const fs = require('fs');

const file = 'src/app/shipping-scanner/[orderId]/scanner-client.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add deviceType state
if (!code.includes('const [deviceType, setDeviceType]')) {
  code = code.replace(
    /const \[isPrinting, setIsPrinting\] = useState\(false\);/,
    `const [isPrinting, setIsPrinting] = useState(false);\n  const [deviceType, setDeviceType] = useState<"mobile" | "desktop" | null>(null);\n\n  useEffect(() => {\n    setDeviceType(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "desktop");\n  }, []);\n`
  );
}

// Replace the buttons
// We will find the buttons section and rewrite it
const buttonsStart = code.indexOf('<div className="flex flex-row items-center gap-3">');
const buttonsEnd = code.indexOf('<div className="flex items-center gap-3 h-10">');
if (buttonsStart !== -1 && buttonsEnd !== -1) {
  const newButtons = `<div className="flex flex-row flex-wrap items-center gap-3">
          {showMiniPerfumeBtn && deviceType === "mobile" && (
            <button 
              onClick={() => window.open(\`/shipping-scanner/\${order.id}/mini-perfume?store=\${store}\`, '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 rounded-xl font-medium transition-colors h-10 border border-purple-200"
            >
              <Printer className="w-5 h-5" />
              הדפס דוגמיות (בנייד)
            </button>
          )}

          {showMiniPerfumeBtn && deviceType === "desktop" && (
            <button 
              onClick={async () => {
                toast.info("שולח בקשה להדפסת בושם במחשב...");
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 rounded-xl font-medium transition-colors h-10 border border-purple-200"
            >
              <Printer className="w-5 h-5" />
              הדפס דוגמיות (במחשב)
            </button>
          )}

          {deviceType === "mobile" && (
            <button 
              onClick={handlePrintLabel}
              disabled={isPrinting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 rounded-xl font-medium transition-colors disabled:opacity-50 h-10 border border-indigo-200"
            >
              <Printer className="w-5 h-5" />
              {isPrinting ? "מפיק מדבקה..." : "הדפס לייבל (בנייד)"}
            </button>
          )}

          {deviceType === "desktop" && (
            <button 
              onClick={handleRemotePrintLabel}
              disabled={isPrinting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-xl font-medium transition-colors disabled:opacity-50 h-10 border border-blue-200"
            >
              <Printer className="w-5 h-5" />
              {isPrinting ? "מפיק מדבקה..." : "הדפס לייבל (במחשב)"}
            </button>
          )}

          
          `;
  code = code.substring(0, buttonsStart) + newButtons + code.substring(buttonsEnd);
}

fs.writeFileSync(file, code);
