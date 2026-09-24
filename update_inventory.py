import re

with open('src/app/inventory/inventory-client.tsx', 'r') as f:
    content = f.read()

# 1. Main container
content = content.replace(
    '<div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">',
    '<div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-screen" dir="rtl">'
)

# 2. Title Block
# Change text colors
content = content.replace('text-gray-900', 'text-white')
content = content.replace('text-muted-foreground', 'text-white/70')

# Wrap the first div (title) in a glass-panel and span full width
content = content.replace(
    '''      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">הזמנות וספקים</h2>
        <p className="text-white/70 mt-2 mb-3">בריאות המלאי, פריטים חסרים והזמנות רכש.</p>
        <div className="flex flex-wrap gap-2 text-xs">''',
    '''      <div className="lg:col-span-12 glass-panel p-6">
        <h2 className="text-3xl font-bold tracking-tight text-white">הזמנות וספקים</h2>
        <p className="text-white/70 mt-2 mb-3">בריאות המלאי, פריטים חסרים והזמנות רכש.</p>
        <div className="flex flex-wrap gap-2 text-xs">'''
)

# 3. Quick Stats wrapper
content = content.replace(
    '<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">',
    '<div className="lg:col-span-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">'
)

# 4. Charts wrapper
content = content.replace(
    '<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">',
    '<div className="lg:col-span-12 grid gap-4 md:grid-cols-2 lg:grid-cols-7">'
)

# 5. Tables wrappers (already Cards, just need col-span-12)
# Re-wrap Inventory Table Card
content = content.replace(
    '{/* Inventory Table */}\n      <Card className="bg-white border-none shadow-sm">',
    '{/* Inventory Table */}\n      <Card className="lg:col-span-12 glass-panel border-none shadow-sm">'
)
content = content.replace(
    '{/* Suppliers Table */}\n      <Card className="bg-white border-none shadow-sm mt-8">',
    '{/* Suppliers Table */}\n      <Card className="lg:col-span-12 glass-panel border-none shadow-sm">'
)

# 6. Change all Cards background
content = content.replace('bg-white border-none shadow-sm', 'glass-panel border-none shadow-sm')

# 7. Make text light inside the tables and cards.
# Wait, replacing bg-white with glass-panel takes care of most of it.
content = content.replace('bg-gray-50/80', 'bg-white/10')
content = content.replace('divide-gray-100', 'divide-white/10')
content = content.replace('bg-gray-100', 'bg-white/10')
content = content.replace('text-gray-600', 'text-white/80')
content = content.replace('text-gray-500', 'text-white/70')

# Also, the Select / Input / Buttons might need transparent backgrounds or text-white
# Let's write the file back
with open('src/app/inventory/inventory-client.tsx', 'w') as f:
    f.write(content)
