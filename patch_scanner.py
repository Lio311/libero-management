import re

with open("src/app/shipping-scanner/[orderId]/scanner-client.tsx", "r") as f:
    content = f.read()

# 1. Add refs
refs_code = """  const [selectedForMissing, setSelectedForMissing] = useState<number[]>([]);

  // Refs for global keydown scanner
  const scanBuffer = useRef("");
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);"""
content = content.replace('  const [selectedForMissing, setSelectedForMissing] = useState<number[]>([]);', refs_code)

# 2. Add global keydown listener and extract processBarcode
handle_scan_code = """  const processBarcode = (sku: string) => {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore typing if they are somehow focused on a real input (though we made ours readOnly)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (!e.target.readOnly) return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (scanBuffer.current.trim()) {
          processBarcode(scanBuffer.current.trim());
          setScanInput(scanBuffer.current.trim());
          setTimeout(() => setScanInput(""), 1000); // clear UI after 1s
          scanBuffer.current = "";
        }
      } else if (e.key.length === 1) {
        scanBuffer.current += e.key;
        
        if (scanTimeout.current) clearTimeout(scanTimeout.current);
        scanTimeout.current = setTimeout(() => {
          scanBuffer.current = "";
        }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, localOrderStatus, missingMode]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    // This is just a fallback for manual submit button (if any)
    const sku = scanInput.trim();
    processBarcode(sku);
    setScanInput("");
  };"""

# Replace old handleScan
old_handle_scan_pattern = re.compile(r'  const handleScan = \(e: React\.FormEvent\) => \{.*?    \}\n  \};\n', re.DOTALL)
content = old_handle_scan_pattern.sub(handle_scan_code + '\n', content)

# 3. Add readOnly to input and remove autoFocus
# The input: 
#             ref={inputRef}
#             autoFocus
#             type="text"
#             value={scanInput}
old_input = """            ref={inputRef}
            autoFocus
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}"""
new_input = """            ref={inputRef}
            type="text"
            readOnly
            value={scanInput}
            onChange={() => {}}"""
content = content.replace(old_input, new_input)

# Remove the focus traps
content = re.sub(r'  useEffect\(\(\) => \{\n    const focusInput = \(\) => \{\n      if \(!missingMode && inputRef\.current\) \{\n        inputRef\.current\.focus\(\);\n      \}\n    \};\n    focusInput\(\);\n    window\.addEventListener\("click", focusInput\);\n    return \(\) => window\.removeEventListener\("click", focusInput\);\n  \}, \[missingMode\]\);\n', '', content)

with open("src/app/shipping-scanner/[orderId]/scanner-client.tsx", "w") as f:
    f.write(content)
