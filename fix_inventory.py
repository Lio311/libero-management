import re

with open("src/app/qc-inventory/qc-inventory-client.tsx", "r") as f:
    content = f.read()

# Remove UI card import
content = re.sub(r'import { Card, CardContent, CardHeader } from "@/components/ui/card";\n', '', content)

# 1. Update getAgeCategory
content = re.sub(
    r'function getAgeCategory\(days: number\) \{.*?\n\}',
    '''function getAgeCategory(days: number) {
  if (days > 90) return { category: "red", label: "מעל 90 יום", bg: "bg-red-500/10 hover:bg-red-500/20", text: "text-red-300", border: "border-red-500/30", badgeBg: "bg-red-500/20" };
  if (days >= 45) return { category: "dark_orange", label: "45-90 ימים", bg: "bg-orange-500/10 hover:bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30", badgeBg: "bg-orange-500/20" };
  if (days >= 30) return { category: "orange", label: "30-45 ימים", bg: "bg-amber-500/10 hover:bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30", badgeBg: "bg-amber-500/20" };
  if (days >= 14) return { category: "yellow", label: "14-30 ימים", bg: "bg-yellow-500/10 hover:bg-yellow-500/20", text: "text-yellow-200", border: "border-yellow-500/30", badgeBg: "bg-yellow-500/20" };
  return { category: "green", label: "פחות משבועיים", bg: "bg-emerald-500/10 hover:bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30", badgeBg: "bg-emerald-500/20" };
}''',
    content,
    flags=re.DOTALL
)

# 2. Update getRatingStyle
content = re.sub(
    r'function getRatingStyle\(rating: number \| undefined\) \{.*?\n\}',
    '''function getRatingStyle(rating: number | undefined) {
  if (rating === undefined) return { text: "text-slate-400", bg: "bg-white/5 hover:bg-white/10", border: "border-r-slate-500/30" };
  if (rating >= 8.5) return { text: "text-emerald-300 font-medium", bg: "bg-emerald-500/10 hover:bg-emerald-500/20", border: "border-r-emerald-500/50" };
  if (rating >= 7) return { text: "text-green-300 font-medium", bg: "bg-green-500/10 hover:bg-green-500/20", border: "border-r-green-500/50" };
  if (rating >= 5) return { text: "text-yellow-300 font-medium", bg: "bg-yellow-500/10 hover:bg-yellow-500/20", border: "border-r-yellow-500/50" };
  if (rating >= 3.5) return { text: "text-orange-300 font-medium", bg: "bg-orange-500/10 hover:bg-orange-500/20", border: "border-r-orange-500/50" };
  if (rating >= 2) return { text: "text-red-300 font-medium", bg: "bg-red-500/10 hover:bg-red-500/20", border: "border-r-red-500/50" };
  return { text: "text-red-400 font-medium", bg: "bg-red-500/20 hover:bg-red-500/30", border: "border-r-red-500/70" };
}''',
    content,
    flags=re.DOTALL
)

# 3. Modify renderFiltersAndSearch styling
content = content.replace('bg-gray-50/50 text-right focus:outline-none', 'bg-white/5 text-right focus:outline-none text-white placeholder-slate-400')
content = content.replace('border border-gray-200 rounded-lg text-sm text-right', 'border border-white/10 rounded-lg text-sm text-right')
content = content.replace('border border-gray-200 rounded-lg text-sm text-gray-600', 'border border-white/10 rounded-lg text-sm text-slate-200 hover:bg-white/5')
content = content.replace('border-gray-200 bg-white', 'border-white/10 bg-white/5 text-white')
content = content.replace('border-gray-200 bg-white text-right', 'border-white/10 bg-white/5 text-right text-white')
content = content.replace('border border-gray-200 bg-white', 'border border-white/10 bg-white/5 text-white')
content = content.replace('bg-gray-50 border-gray-200 text-gray-700', 'bg-white/10 border-white/20 text-slate-200')
content = content.replace('bg-blue-50 border-blue-100 text-blue-700', 'bg-blue-500/20 border-blue-500/30 text-blue-200')
content = content.replace('bg-purple-50 border-purple-100 text-purple-700', 'bg-purple-500/20 border-purple-500/30 text-purple-200')
content = content.replace('bg-red-50 border-red-100 text-red-700', 'bg-red-500/20 border-red-500/30 text-red-200')
content = content.replace('hover:bg-gray-50', 'hover:bg-white/10')
content = content.replace('accent-blue-600 rounded border-gray-300', 'accent-blue-500 rounded border-white/20')
content = content.replace('text-gray-500 font-medium', 'text-slate-300 font-medium')
content = content.replace('text-xs font-medium text-gray-500', 'text-xs font-medium text-slate-300')
content = content.replace('text-gray-400', 'text-slate-400')
content = content.replace('text-gray-500', 'text-slate-300')
content = content.replace('text-gray-600', 'text-slate-200')
content = content.replace('text-gray-700', 'text-slate-200')
content = content.replace('text-gray-800', 'text-white')
content = content.replace('text-gray-900', 'text-white')
content = content.replace('border-gray-100', 'border-white/10')
content = content.replace('border-gray-50', 'border-white/5')
content = content.replace('bg-gray-100', 'bg-white/10')
content = content.replace('bg-gray-200', 'bg-white/20')

# 4. Replace the main container layout
# We will split the file by 'return (' inside QcInventoryClient
parts = content.split('  return (\n')

render_code = parts[1]

# Rebuild the render_code with Bento Grid
new_render_code = """    <div className="min-h-screen relative p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">
        {/* Header Bento */}
        <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">בקרת מלאי</h2>
              <p className="text-slate-300 mt-1 text-sm">מעקב גיל מלאי ותמחור למוצרי ליברו</p>
            </div>
          </div>
        </div>

        {/* Stats Bento Cards */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-full">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-300 font-medium">סה״כ מוצרים במלאי</p>
          <h3 className="text-xl md:text-2xl font-bold text-white">{totalInStock}</h3>
        </div>
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <div className="p-2 bg-red-500/20 text-red-300 rounded-full">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-300 font-medium">מוצרים שאזלו מהמלאי</p>
          <h3 className="text-xl md:text-2xl font-bold text-white">{outOfStock}</h3>
        </div>
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <div className="p-2 bg-orange-500/20 text-orange-300 rounded-full">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-300 font-medium">דורשים תשומת לב (דירוג &lt; 4)</p>
          <h3 className="text-xl md:text-2xl font-bold text-white">{needsAttention}</h3>
        </div>
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-2">
          <div className="p-2 bg-white/10 text-white rounded-full">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-300 font-medium">מוצרים ללא מכירות כלל</p>
          <h3 className="text-xl md:text-2xl font-bold text-white">{zeroSales}</h3>
        </div>

        {/* Filters and Search Bento */}
        <div ref={topSectionRef} className="lg:col-span-12 glass-panel rounded-3xl p-6 flex flex-col gap-4 z-20 relative">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
            <span className="font-medium text-white">דירוג:</span>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">מצוין (8.5-10)</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full">טוב (7-8.5)</span>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">בינוני (5-7)</span>
            <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">טעון שיפור (3.5-5)</span>
            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full">חלש (2-3.5)</span>
            <span className="px-2 py-1 bg-red-500/40 text-red-200 rounded-full">גרוע (1-2)</span>
          </div>
          {renderFiltersAndSearch()}
        </div>

        {/* Table Bento */}
        <div className="lg:col-span-12 glass-panel rounded-3xl p-6 overflow-hidden flex flex-col">
          <div className="text-sm text-slate-300 font-medium md:hidden mb-4">
            סה״כ מוצרים: {filteredAndSorted.length}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block pb-6 overflow-x-auto">
            <div className="relative">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className={`${thClasses} border-r-4 border-transparent w-[14%]`} style={thStyle}>שם המוצר</th>
                    <th className={`${thClasses} w-[8%]`} style={thStyle}>קטגוריה</th>
                    <th className={`${thClasses} w-[8%]`} style={thStyle}>קבוצת קומרס</th>
                    <th className={`${thClasses} text-center w-[5%]`} style={thStyle}>דירוג</th>
                    <th className={`${thClasses} text-center w-[7%] leading-tight`} style={thStyle}>מכר חודש לפני אחרון</th>
                    <th className={`${thClasses} text-center w-[7%] leading-tight`} style={thStyle}>מכר חודש אחרון</th>
                    <th className={`${thClasses} text-center w-[7%] leading-tight`} style={thStyle}>מכר שבוע אחרון</th>
                    <th className={`${thClasses} text-center w-[7%]`} style={thStyle}>כמות במלאי</th>
                    <th className={`${thClasses} text-center w-[7%]`} style={thStyle}>התקדמות</th>
                    <th className={`${thClasses} text-center w-[8%] leading-tight`} style={thStyle}>תאריך בקרת מוצר אחרון</th>
                    <th className={`${thClasses} text-center w-[7%] leading-tight`} style={thStyle}>תאריך שינוי מחיר</th>
                    <th className={`${thClasses} text-center w-[7%] leading-tight`} style={thStyle}>תאריך מכירה אחרון</th>
                    <th className={`${thClasses} text-center w-[8%] leading-tight`} style={thStyle}>זמן חיי מדף</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.length > 0 ? (
                    filteredAndSorted.map((product) => {
                      const style = getAgeCategory(product.ageDays);
                      const ratingStyle = getRatingStyle(product.rating);
                      return (
                        <tr key={product.id} className={`transition-all duration-300 [&>td]:border-b [&>td]:border-white/10 ${ratingStyle.bg}`}>
                          <td className={`py-3 px-4 text-right border-r-4 ${ratingStyle.border}`}>
                            <div className="flex items-center gap-3">
                              {product.productImage ? (
                                <img src={product.productImage} alt={product.productName} className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <a href={`https://libero-il.co.il/?p=${product.wooProductId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline truncate max-w-[200px] block">
                                  {product.productName}
                                </a>
                                {product.productSku && <p className="text-[11px] text-slate-400">מק״ט: {product.productSku}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-slate-200 text-sm">{product.categories || "—"}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-slate-200 text-sm">{product.commerceGroup || "—"}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={ratingStyle.text}>{product.rating?.toFixed(1) || "-"}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.salesMonthBeforeLast}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.salesLastMonth}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.salesLastWeek}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-white">
                            {product.currentStock}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="w-full max-w-[100px] mx-auto bg-white/20 rounded-full h-2 mb-1 relative">
                              {(() => {
                                const totalOrdered = product.currentStock + product.totalSales;
                                const progress = totalOrdered > 0 ? (product.totalSales / totalOrdered) * 100 : 0;
                                return (
                                  <div 
                                    className="bg-blue-400 h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  ></div>
                                );
                              })()}
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap" dir="ltr">
                              {product.totalSales} / {product.currentStock + product.totalSales}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.lastInspectionDate ? format(new Date(product.lastInspectionDate), "dd/MM/yyyy", { locale: he }) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.lastPriceStatusDate ? format(new Date(product.lastPriceStatusDate), "dd/MM/yyyy", { locale: he }) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-200">
                            {product.lastSaleDate ? format(new Date(product.lastSaleDate), "dd/MM/yyyy", { locale: he }) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.badgeBg} ${style.text}`}>
                                {style.label}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {format(new Date(product.dateAddedToSite), "dd/MM/yyyy", { locale: he })}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                        <p>לא נמצאו מוצרים</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden flex flex-col gap-3 pb-6">
            {filteredAndSorted.length > 0 ? (
              filteredAndSorted.map((product) => {
                const style = getAgeCategory(product.ageDays);
                const ratingStyle = getRatingStyle(product.rating);
                return (
                  <div key={`mobile-${product.id}`} className={`rounded-xl shadow-sm border border-r-4 border-white/10 ${ratingStyle.border} ${ratingStyle.bg.split(' ')[0]}`}>
                    <div className="p-3 flex items-start gap-3 border-b border-white/10">
                      {product.productImage ? (
                        <img src={product.productImage} alt={product.productName} className="w-14 h-14 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <a href={`https://libero-il.co.il/?p=${product.wooProductId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline truncate block">
                          {product.productName}
                        </a>
                        {product.productSku && <p className="text-[11px] text-slate-400 mt-0.5">מק״ט: {product.productSku}</p>}
                        {product.categories && <p className="text-[11px] text-slate-300 mt-0.5 whitespace-nowrap truncate">{product.categories}</p>}
                        {product.commerceGroup && <p className="text-[11px] text-slate-300 mt-0.5 whitespace-nowrap truncate">{product.commerceGroup}</p>}
                      </div>
                      <div className="flex flex-col items-center justify-center bg-white/5 px-3 py-1.5 rounded-lg mr-2">
                        <span className={`text-base leading-none ${ratingStyle.text}`}>{product.rating?.toFixed(1) || "-"}</span>
                        <span className="text-slate-400 text-[10px] font-medium mt-0.5">דירוג</span>
                      </div>
                    </div>
                    <div className="p-3 space-y-2 text-[12px]">
                      <div className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-400">בקרת מוצר:</span>
                        <span>{product.lastInspectionDate ? format(new Date(product.lastInspectionDate), "dd/MM/yyyy", { locale: he }) : "—"}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-400">תמחור אחרון:</span>
                        <span>{product.lastPriceStatusDate ? format(new Date(product.lastPriceStatusDate), "dd/MM/yyyy", { locale: he }) : "—"}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-white/10 text-center">
                        <div>
                          <span className="block text-slate-400 text-[10px]">חודש שעבר</span>
                          <span className="font-medium text-[13px] text-slate-200">{product.salesMonthBeforeLast}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[10px]">מכר 30 יום</span>
                          <span className="font-medium text-[13px] text-slate-200">{product.salesLastMonth}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[10px]">מכר 7 ימים</span>
                          <span className="font-medium text-[13px] text-slate-200">{product.salesLastWeek}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[10px]">במלאי</span>
                          <span className="font-medium text-[13px] text-white">{product.currentStock}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                          <span>התקדמות מכר/מלאי</span>
                          <span dir="ltr">{product.totalSales} / {product.currentStock + product.totalSales}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1.5">
                          {(() => {
                            const totalOrdered = product.currentStock + product.totalSales;
                            const progress = totalOrdered > 0 ? (product.totalSales / totalOrdered) * 100 : 0;
                            return (
                              <div 
                                className="bg-blue-400 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="text-slate-400">חיי מדף:</span>
                        <div className="flex flex-col items-end">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${style.badgeBg} ${style.text}`}>
                            {style.label}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            {format(new Date(product.dateAddedToSite), "dd/MM/yyyy", { locale: he })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p>לא נמצאו מוצרים</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"""

content = parts[0] + new_render_code

with open("src/app/qc-inventory/qc-inventory-client.tsx", "w") as f:
    f.write(content)

