import re

with open('src/app/shipping-scanner/scanner-list-client.tsx', 'r') as f:
    content = f.read()

# 1. Update main container to Grid
content = content.replace(
    'className="flex-1 space-y-12 p-4 md:p-8 pt-6 h-[100dvh] overflow-y-auto w-full pb-32"',
    'className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8 pt-6 h-[100dvh] overflow-y-auto w-full pb-32"'
)

# 2. Wrap Header
header_start = '<div className="flex flex-col gap-4">'
header_end_idx = content.find('<div className="relative max-w-2xl">')
header_content = content[content.find(header_start):header_end_idx]

new_header_content = header_content.replace(
    '<div className="flex flex-col gap-4">',
    '<div className="col-span-1 lg:col-span-12 glass-panel rounded-3xl p-6 flex flex-col gap-4">'
)
content = content.replace(header_content, new_header_content)

# 3. Replace Search block
search_start = '<div className="relative max-w-2xl">'
search_end_idx = content.find('<div className="grid grid-cols-2 gap-4 max-w-2xl">')
search_content = content[content.find(search_start):search_end_idx]

# Remove background from input
new_search_content = search_content.replace(
    '<div className="relative max-w-2xl">',
    '<div className="col-span-1 lg:col-span-6 glass-panel rounded-3xl p-6 flex flex-col justify-center gap-2">\n        <h3 className="text-lg font-medium text-white mb-2">חיפוש הזמנות</h3>\n        <div className="relative w-full">'
)
new_search_content = new_search_content.replace('bg-card', 'bg-white/5')
new_search_content = new_search_content.replace('text-foreground', 'text-white')
# add closing div for the new wrapper
new_search_content = new_search_content.rstrip()
if new_search_content.endswith('</div>'):
    new_search_content += '\n      </div>\n'
else:
    new_search_content += '\n        </div>\n      </div>\n'

content = content.replace(search_content, new_search_content)

# 4. Replace Stats block
stats_start = '<div className="grid grid-cols-2 gap-4 max-w-2xl">'
stats_end_idx = content.find('{processingOrders.length === 0 ? (')
stats_content = content[content.find(stats_start):stats_end_idx]

new_stats_content = stats_content.replace(
    '<div className="grid grid-cols-2 gap-4 max-w-2xl">',
    '<div className="col-span-1 lg:col-span-6 glass-panel rounded-3xl p-6">\n        <div className="grid grid-cols-2 gap-4 h-full">'
)
new_stats_content = new_stats_content.replace('bg-card border border-border', 'bg-white/5 border border-white/10')
new_stats_content = new_stats_content.replace('text-foreground', 'text-white')
new_stats_content = new_stats_content.rstrip()
if new_stats_content.endswith('</div>'):
    new_stats_content += '\n      </div>\n'
content = content.replace(stats_content, new_stats_content)

# 5. Orders wrapper
# Orders start at {processingOrders.length === 0 ?
orders_start = '{processingOrders.length === 0 ? ('
orders_end_idx = content.find('<CreateLabelModal')
orders_content = content[content.find(orders_start):orders_end_idx]

# We need to wrap the whole orders section in a full width bento, or leave it as is if it's already full width but we should make it a bento.
new_orders_content = '<div className="col-span-1 lg:col-span-12 glass-panel rounded-3xl p-6">\n      ' + orders_content + '      </div>\n      '
new_orders_content = new_orders_content.replace('bg-card border border-border', 'bg-white/5 border border-white/10')

content = content.replace(orders_content, new_orders_content)

# 6. Update text colors in OrderCard
content = content.replace('text-foreground', 'text-white')
content = content.replace('bg-background', 'bg-white/5')
content = content.replace('bg-card', 'bg-white/5')

with open('src/app/shipping-scanner/scanner-list-client.tsx', 'w') as f:
    f.write(content)

