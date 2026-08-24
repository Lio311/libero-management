const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

const newButtons = `          <div className="flex flex-wrap items-center gap-2">
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
                  ? \`הדפס בושם בנייד (\${selectedOrderIds.length})\` 
                  : "הדפס בושם בנייד"}
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
                  ? \`הדפס בושם במחשב (\${selectedOrderIds.length})\` 
                  : "הדפס בושם במחשב"}
              </button>
            )}

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
                  ? \`הדפס משלוח במחשב (\${selectedOrderIds.length})\` 
                  : "הדפס משלוח במחשב"}
              </button>
            )}
          </div>`;

const startStr = `<button
              disabled={selectedOrderIds.length === 0}
              onClick={() => {
                window.open(\`/shipping-scanner/bulk-mini-perfume`;
const endStr = `title="הדפס לייבלים למשלוח"
            >
              הדפס לייבל משלוח
            </button>`;

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newButtons + code.substring(endIndex + endStr.length);
  // Remove the old `<> ... </>` wrapping
  code = code.replace(/<>\n\s*<div className="flex flex-wrap items-center gap-2">/, '<div className="flex flex-wrap items-center gap-2">');
  code = code.replace(/<\/div>\n\s*<\/>/, '</div>');
} else {
  console.log("Could not find boundaries");
}

fs.writeFileSync(file, code);
