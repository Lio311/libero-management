const fs = require('fs');

const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add deviceType state
if (!code.includes('const [deviceType, setDeviceType]')) {
  code = code.replace(
    /const \[isGeneratingPdf, setIsGeneratingPdf\] = useState\(false\);/,
    `const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);\n  const [deviceType, setDeviceType] = useState<"mobile" | "desktop" | null>(null);\n\n  useEffect(() => {\n    setDeviceType(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "desktop");\n  }, []);\n`
  );
}

// Replace the buttons section (bulk buttons)
const buttonsStart = code.indexOf('<button\n              disabled={selectedOrderIds.length === 0}');
const buttonsEnd = code.indexOf('</div>\n        </div>\n      </div>\n\n      <div className="flex-1 overflow-auto p-4 space-y-3">');

if (buttonsStart !== -1 && buttonsEnd !== -1) {
  const newButtons = `<div className="flex flex-wrap items-center gap-2">
            {deviceType === "mobile" && (
              <button
                disabled={selectedOrderIds.length === 0}
                onClick={() => {
                  window.open(\`/shipping-scanner/bulk-mini-perfume?store=\${store}&orderIds=\${selectedOrderIds.join(',')}\`, "_blank");
                  setSelectedOrderIds([]);
                }}
                className={\`px-4 py-1.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 h-fit self-center \${
                  selectedOrderIds.length > 0 
                    ? "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border border-purple-200" 
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                }\`}
              >
                {selectedOrderIds.length > 0 
                  ? \`הדפס בושם (בנייד) (\${selectedOrderIds.length})\` 
                  : "הדפס בושם (בנייד)"}
              </button>
            )}

            {deviceType === "desktop" && (
              <button
                disabled={selectedOrderIds.length === 0}
                onClick={handleRemotePrint}
                className={\`px-4 py-1.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 h-fit self-center \${
                  selectedOrderIds.length > 0 
                    ? "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border border-purple-200" 
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                }\`}
                title="הדפס בושם במחשב"
              >
                {selectedOrderIds.length > 0 
                  ? \`הדפס בושם (במחשב) (\${selectedOrderIds.length})\` 
                  : "הדפס בושם (במחשב)"}
              </button>
            )}

            {/* Note: There's no mobile bulk print for shipping labels because Lionwheel API doesn't support bulk PDF yet, 
                but we can show it anyway or just let remote print handle it. For now, we only show remote bulk for shipping */}
            {deviceType === "desktop" && (
              <button
                disabled={selectedOrderIds.length === 0}
                onClick={handleRemotePrintShipping}
                className={\`px-4 py-1.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 h-fit self-center \${
                  selectedOrderIds.length > 0 
                    ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-200" 
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                }\`}
                title="הדפס לייבלים למשלוח במחשב"
              >
                 {selectedOrderIds.length > 0 
                  ? \`הדפס לייבל (במחשב) (\${selectedOrderIds.length})\` 
                  : "הדפס לייבל (במחשב)"}
              </button>
            )}
          </div>`;
  code = code.substring(0, buttonsStart) + newButtons + code.substring(buttonsEnd);
}

fs.writeFileSync(file, code);
