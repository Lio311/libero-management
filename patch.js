const fs = require('fs');
const file = '/Users/liorzafrir/.gemini/antigravity/scratch/libero-management/src/app/qc-inventory/qc-inventory-client.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Import X from lucide-react
code = code.replace(/import \{ Search, ChevronDown, ChevronUp, Filter, Package, AlertTriangle, AlertCircle, CheckCircle2 \} from "lucide-react";/, 
'import { Search, ChevronDown, ChevronUp, Filter, Package, AlertTriangle, AlertCircle, CheckCircle2, X } from "lucide-react";');

// 2. Change stockFilter state
code = code.replace(/const \[stockFilter, setStockFilter\] = useState<string\[\]>\(\["in_stock"\]\);/, 
'const [stockFilter, setStockFilter] = useState<string>("in_stock");');

// 3. Update stockFilter logic in filteredAndSorted
code = code.replace(/    if \(stockFilter\.length > 0\) \{\n      result = result\.filter\(p => \{\n        const inStock = p\.currentStock > 0;\n        if \(inStock && stockFilter\.includes\("in_stock"\)\) return true;\n        if \(!inStock && stockFilter\.includes\("out_of_stock"\)\) return true;\n        return false;\n      \}\);\n    \}/, 
`    if (stockFilter !== "all") {
      result = result.filter(p => {
        const inStock = p.currentStock > 0;
        if (stockFilter === "in_stock") return inStock;
        if (stockFilter === "out_of_stock") return !inStock;
        return true;
      });
    }`);

// 4. Update renderFiltersAndSearch
// Desktop stockFilter Popover -> Select
code = code.replace(/<Popover>\s*<PopoverTrigger className="flex w-\[140px\] h-10 items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" dir="rtl">\s*<span className="truncate">\s*\{stockFilter\.length === 0 \|\| stockFilter\.length === 2 \? 'כל מצבי המלאי' : stockFilter\.includes\('in_stock'\) \? 'במלאי' : 'אזל מהמלאי'\}\s*<\/span>\s*<ChevronDown className="h-4 w-4 opacity-50" \/>\s*<\/PopoverTrigger>\s*<PopoverContent className="w-\[180px\] p-2" align="end" dir="rtl">\s*<div className="flex flex-col gap-1">\s*<label className="flex items-center gap-2 p-1\.5 hover:bg-gray-50 rounded cursor-pointer">\s*<input type="checkbox" checked=\{stockFilter\.includes\("in_stock"\)\} onChange=\{\(\) => toggleFilter\(setStockFilter, "in_stock"\)\} className="w-4 h-4 accent-blue-600 rounded border-gray-300" \/>\s*<span className="text-sm">במלאי<\/span>\s*<\/label>\s*<label className="flex items-center gap-2 p-1\.5 hover:bg-gray-50 rounded cursor-pointer">\s*<input type="checkbox" checked=\{stockFilter\.includes\("out_of_stock"\)\} onChange=\{\(\) => toggleFilter\(setStockFilter, "out_of_stock"\)\} className="w-4 h-4 accent-blue-600 rounded border-gray-300" \/>\s*<span className="text-sm">אזל מהמלאי<\/span>\s*<\/label>\s*<\/div>\s*<\/PopoverContent>\s*<\/Popover>/, 
`<Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[140px] h-10 border-gray-200 bg-white text-right" dir="rtl">
              <SelectValue placeholder="מצב מלאי" />
            </SelectTrigger>
            <SelectContent align="end" dir="rtl">
              <SelectItem value="all">כל מצבי המלאי</SelectItem>
              <SelectItem value="in_stock">במלאי</SelectItem>
              <SelectItem value="out_of_stock">אזל מהמלאי</SelectItem>
            </SelectContent>
          </Select>`);

// Mobile stockFilter Popover -> Select
code = code.replace(/<Popover>\s*<PopoverTrigger className="flex w-full h-10 items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" dir="rtl">\s*<span className="truncate">\s*\{stockFilter\.length === 0 \|\| stockFilter\.length === 2 \? 'כל מצבי המלאי' : stockFilter\.includes\('in_stock'\) \? 'במלאי' : 'אזל מהמלאי'\}\s*<\/span>\s*<ChevronDown className="h-4 w-4 opacity-50" \/>\s*<\/PopoverTrigger>\s*<PopoverContent align="center" className="w-\[calc\(100vw-3rem\)\] p-2" dir="rtl">\s*<div className="flex flex-col gap-1">\s*<label className="flex items-center gap-2 p-1\.5 hover:bg-gray-50 rounded cursor-pointer">\s*<input type="checkbox" checked=\{stockFilter\.includes\("in_stock"\)\} onChange=\{\(\) => toggleFilter\(setStockFilter, "in_stock"\)\} className="w-4 h-4 accent-blue-600 rounded border-gray-300" \/>\s*<span className="text-sm">במלאי<\/span>\s*<\/label>\s*<label className="flex items-center gap-2 p-1\.5 hover:bg-gray-50 rounded cursor-pointer">\s*<input type="checkbox" checked=\{stockFilter\.includes\("out_of_stock"\)\} onChange=\{\(\) => toggleFilter\(setStockFilter, "out_of_stock"\)\} className="w-4 h-4 accent-blue-600 rounded border-gray-300" \/>\s*<span className="text-sm">אזל מהמלאי<\/span>\s*<\/label>\s*<\/div>\s*<\/PopoverContent>\s*<\/Popover>/, 
`<Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full h-10 border-gray-200 bg-white text-right" dir="rtl">
            <SelectValue placeholder="מצב מלאי" />
          </SelectTrigger>
          <SelectContent align="center" className="w-[calc(100vw-3rem)]" dir="rtl">
            <SelectItem value="all">כל מצבי המלאי</SelectItem>
            <SelectItem value="in_stock">במלאי</SelectItem>
            <SelectItem value="out_of_stock">אזל מהמלאי</SelectItem>
          </SelectContent>
        </Select>`);

// 5. Add Active Filters section right before the end of renderFiltersAndSearch
code = code.replace(/    <\/div>\n  \);\n\n  if \(!isMounted\)/, 
`      {/* Active Filters Display */}
      {(categoryFilter.length > 0 || colorFilter.length > 0 || stockFilter !== "in_stock") && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-500">מסננים פעילים:</span>
          {categoryFilter.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-md text-xs transition-colors">
              {c}
              <button onClick={() => toggleFilter(setCategoryFilter, c)} className="hover:text-blue-900 focus:outline-none"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {colorFilter.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-md text-xs transition-colors">
              {ageOptions.find(o => o.value === c)?.label}
              <button onClick={() => toggleFilter(setColorFilter, c)} className="hover:text-purple-900 focus:outline-none"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {stockFilter !== "in_stock" && (
            <span className={\`inline-flex items-center gap-1 px-2 py-1 border rounded-md text-xs transition-colors \${stockFilter === "out_of_stock" ? "bg-red-50 border-red-100 text-red-700" : "bg-gray-50 border-gray-200 text-gray-700"}\`}>
              {stockFilter === "out_of_stock" ? "אזל מהמלאי" : "כל מצבי המלאי"}
              <button onClick={() => setStockFilter("in_stock")} className="hover:opacity-70 focus:outline-none"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(categoryFilter.length > 0 || colorFilter.length > 0 || stockFilter !== "in_stock") && (
            <button onClick={() => { setCategoryFilter([]); setColorFilter([]); setStockFilter("in_stock"); }} className="text-xs text-gray-500 hover:text-gray-900 underline mr-auto px-2">
              נקה הכל
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (!isMounted)`);

fs.writeFileSync(file, code);
