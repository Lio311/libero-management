import re

with open("src/app/qc-inventory/page.tsx", "r") as f:
    page_content = f.read()

page_content = page_content.replace('text-blue-500', 'text-white')
with open("src/app/qc-inventory/page.tsx", "w") as f:
    f.write(page_content)

with open("src/app/qc-inventory/qc-inventory-client.tsx", "r") as f:
    client_content = f.read()

# Remove UI card import
client_content = re.sub(r'import { Card, CardContent, CardHeader } from "@/components/ui/card";\n', '', client_content)

# Update getAgeCategory
client_content = re.sub(
    r'function getAgeCategory\(days: number\) \{.*?\n\}',
    '''function getAgeCategory(days: number) {
  if (days > 90) return { category: "red", label: "מעל 90 יום", bg: "bg-red-500/10 hover:bg-red-500/20", text: "text-red-300", border: "border-red-500/30", badgeBg: "bg-red-500/20" };
  if (days >= 45) return { category: "dark_orange", label: "45-90 ימים", bg: "bg-orange-500/10 hover:bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30", badgeBg: "bg-orange-500/20" };
  if (days >= 30) return { category: "orange", label: "30-45 ימים", bg: "bg-amber-500/10 hover:bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30", badgeBg: "bg-amber-500/20" };
  if (days >= 14) return { category: "yellow", label: "14-30 ימים", bg: "bg-yellow-500/10 hover:bg-yellow-500/20", text: "text-yellow-200", border: "border-yellow-500/30", badgeBg: "bg-yellow-500/20" };
  return { category: "green", label: "פחות משבועיים", bg: "bg-emerald-500/10 hover:bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30", badgeBg: "bg-emerald-500/20" };
}''',
    client_content,
    flags=re.DOTALL
)

# Update getRatingStyle
client_content = re.sub(
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
    client_content,
    flags=re.DOTALL
)

# Replace table styles
client_content = client_content.replace(
    'const thClasses = "py-3 px-4 font-medium text-right bg-white border-b border-gray-200 sticky z-20";',
    'const thClasses = "py-3 px-4 font-medium text-right text-slate-300 border-b border-white/10 sticky z-20 bg-black/20 backdrop-blur-md";'
)
client_content = client_content.replace(
    'bg-gray-50/50',
    ''
)

# Search input styling
client_content = client_content.replace(
    'border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50',
    'border border-white/10 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/5 text-white placeholder-slate-400'
)

# Filter button
client_content = client_content.replace(
    'border border-gray-200 rounded-lg text-sm text-gray-600',
    'border border-white/10 rounded-lg text-sm text-slate-200 hover:bg-white/5'
)

# SelectTriggers and PopoverTriggers
client_content = client_content.replace(
    'border-gray-200 bg-white',
    'border-white/10 bg-white/5 text-white'
)
client_content = client_content.replace(
    'bg-gray-50',
    'bg-white/10'
)
client_content = client_content.replace(
    'text-gray-900',
    'text-white'
)
client_content = client_content.replace(
    'text-gray-800',
    'text-white'
)
client_content = client_content.replace(
    'text-gray-700',
    'text-slate-200'
)
client_content = client_content.replace(
    'text-gray-600',
    'text-slate-300'
)
client_content = client_content.replace(
    'text-gray-500',
    'text-slate-400'
)
client_content = client_content.replace(
    'text-gray-400',
    'text-slate-500'
)
client_content = client_content.replace(
    'border-gray-100',
    'border-white/10'
)
client_content = client_content.replace(
    'border-gray-200',
    'border-white/10'
)
client_content = client_content.replace(
    'border-gray-300',
    'border-white/20'
)
client_content = client_content.replace(
    'bg-gray-100',
    'bg-white/10'
)
client_content = client_content.replace(
    'bg-gray-200',
    'bg-white/20'
)

# Layout replacement
old_layout = """    <div className=" min-h-screen relative" dir="rtl">
      {/* Header and Stats - Not Sticky */}
      <div className="pt-4 md:pt-8 px-4 md:px-8 space-y-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">בקרת מלאי</h2>
            <p className="text-muted-foreground mt-1 text-sm mb-3">מעקב גיל מלאי ותמחור למוצרי ליברו</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400 font-medium">סה״כ מוצרים במלאי</p>
              <h3 className="text-xl md:text-2xl font-bold text-white">{totalInStock}</h3>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400 font-medium">מוצרים שאזלו מהמלאי</p>
              <h3 className="text-xl md:text-2xl font-bold text-white">{outOfStock}</h3>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400 font-medium">דורשים תשומת לב (דירוג &lt; 4)</p>
              <h3 className="text-xl md:text-2xl font-bold text-white">{needsAttention}</h3>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
              <div className="p-2 bg-white/10 text-slate-300 rounded-full">
                <Package className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400 font-medium">מוצרים ללא מכירות כלל</p>
              <h3 className="text-xl md:text-2xl font-bold text-white">{zeroSales}</h3>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-8 pb-8">
        {/* Sticky Header - ratings + filters - direct child of scroll flow */}
        <div ref={topSectionRef} className="sticky top-0 z-30 bg-white/10 p-4 md:p-6 border border-white/10 border-b-0 rounded-t-xl shadow-sm flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-slate-400">דירוג:</span>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">מצוין (8.5-10)</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">טוב (7-8.5)</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">בינוני (5-7)</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">טעון שיפור (3.5-5)</span>
            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full">חלש (2-3.5)</span>
            <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full">גרוע (1-2)</span>
          </div>
          {renderFiltersAndSearch()}
        </div>

        <div className="bg-white/10 border border-white/10 border-t-0 rounded-b-xl shadow-sm">
          <div className="mt-4 text-sm text-slate-400 font-medium md:hidden mb-2 px-4">"""

new_layout = """    <div className="min-h-screen relative p-4 md:p-6 lg:p-8" dir="rtl">
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
          <p className="text-xs text-slate-300 font-medium">דורשים תשומת לב (דירוג < 4)</p>
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
        <div ref={topSectionRef} className="lg:col-span-12 glass-panel rounded-3xl p-6 flex flex-col gap-4">
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
        <div className="lg:col-span-12 glass-panel rounded-3xl p-6 overflow-hidden">
          <div className="mt-4 text-sm text-slate-300 font-medium md:hidden mb-2 px-4">"""

# Replace in string by regex (because exact match might fail due to previous replaces)
# Instead of doing that, I will just construct the new client_content from the original string manually via regex or string manipulation.

