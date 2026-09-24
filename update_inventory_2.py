import re

with open('src/app/inventory/inventory-client.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Main container
content = content.replace(
    '<div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">',
    '<div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-screen" dir="rtl">'
)

# 2. Extract Title and Filters into their own Bento boxes
title_old = """      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">הזמנות וספקים</h2>
        <p className="text-muted-foreground mt-2 mb-3">בריאות המלאי, פריטים חסרים והזמנות רכש.</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="font-medium px-2 py-1">מקרא רמת מלאי:</span>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">ירוק: מעל 70%</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">צהוב: 20% - 70%</span>
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">אדום: מתחת ל-20%</span>
        </div>
      </div>"""

title_new = """      <div className="lg:col-span-12 glass-panel p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">הזמנות וספקים</h2>
          <p className="text-white/80 mt-1">בריאות המלאי, פריטים חסרים והזמנות רכש.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="font-medium px-2 py-1 text-white">מקרא רמת מלאי:</span>
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded-full">ירוק: מעל 70%</span>
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 rounded-full">צהוב: 20% - 70%</span>
          <span className="px-2 py-1 bg-red-500/20 text-red-200 border border-red-500/30 rounded-full">אדום: מתחת ל-20%</span>
        </div>
      </div>"""

content = content.replace(title_old, title_new)

# 3. Quick Stats Cards container
content = content.replace(
    '<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">',
    '<div className="lg:col-span-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">'
)
# Quick Stats Cards Classes
content = content.replace(
    '<Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">',
    '<Card className="glass-panel border-none shadow-sm">'
)

# 4. Charts Container
content = content.replace(
    '<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">',
    '<div className="lg:col-span-12 grid gap-6 md:grid-cols-2 lg:grid-cols-7">'
)
content = content.replace(
    '<Card className="col-span-4 bg-white border-none shadow-sm">',
    '<Card className="col-span-4 glass-panel border-none shadow-sm text-white">'
)
content = content.replace(
    '<Card className="col-span-3 bg-white border-none shadow-sm">',
    '<Card className="col-span-3 glass-panel border-none shadow-sm text-white">'
)

# Change text inside cards to white
content = content.replace('text-muted-foreground', 'text-white/70')
content = content.replace('text-gray-500', 'text-white/70')
content = content.replace('text-gray-900', 'text-white')
content = content.replace('text-gray-600', 'text-white/80')
content = content.replace('text-gray-800', 'text-white')
content = content.replace('bg-gray-100', 'bg-white/10')
content = content.replace('hover:bg-gray-200', 'hover:bg-white/20')
content = content.replace('bg-gray-50', 'bg-white/5')
content = content.replace('hover:bg-gray-50', 'hover:bg-white/10')
content = content.replace('divide-gray-100', 'divide-white/10')
content = content.replace('bg-gray-50/80', 'bg-white/10')

# Table specific text color fixes
content = content.replace('text-red-600', 'text-red-400')
content = content.replace('text-red-500', 'text-red-400')
content = content.replace('text-blue-600', 'text-blue-400')
content = content.replace('text-green-600', 'text-green-400')
content = content.replace('bg-red-50', 'bg-red-500/20')
content = content.replace('bg-blue-50', 'bg-blue-500/20')
content = content.replace('bg-green-50', 'bg-green-500/20')

# 5. Inventory Table
content = content.replace(
    '{/* Inventory Table */}\n      <Card className="glass-panel border-none shadow-sm">',
    '{/* Inventory Table */}\n      <Card className="lg:col-span-12 glass-panel border-none shadow-sm text-white">'
)
content = content.replace(
    '{/* Inventory Table */}\n      <Card className="bg-white/10 border-none shadow-sm">',
    '{/* Inventory Table */}\n      <Card className="lg:col-span-12 glass-panel border-none shadow-sm text-white">'
)
content = content.replace(
    '<Card className="bg-white border-none shadow-sm">',
    '<Card className="lg:col-span-12 glass-panel border-none shadow-sm text-white">'
)

content = content.replace(
    '{/* Suppliers Table */}\n      <Card className="bg-white border-none shadow-sm mt-8">',
    '{/* Suppliers Table */}\n      <Card className="lg:col-span-12 glass-panel border-none shadow-sm text-white">'
)

# Replace the input background for Search
search_old = 'className="pl-3 pr-9 py-2 border rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20"'
search_new = 'className="pl-3 pr-9 py-2 bg-black/20 border border-white/10 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-white/50"'
content = content.replace(search_old, search_new)

# Table background items
content = content.replace('bg-white rounded-lg shadow-sm border', 'bg-black/20 rounded-lg shadow-sm border border-white/10')
content = content.replace('border-b', 'border-white/10')
content = content.replace('border-t', 'border-white/10')
content = content.replace('border', 'border border-white/10')

# Dropdowns in mobile editable supplier row
content = content.replace('bg-white', 'bg-black/40')

with open('src/app/inventory/inventory-client.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
