import re

with open('src/app/finance/finance-client.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Main container
content = content.replace(
    '<div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">',
    '<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 md:p-8 min-h-screen" dir="rtl">'
)
content = content.replace(
    '<h2 className="text-3xl font-bold tracking-tight text-gray-900">כספים</h2>',
    '<h2 className="text-3xl font-bold tracking-tight text-white">כספים</h2>'
)
content = content.replace(
    '<p className="text-muted-foreground mt-2">סקירה פיננסית, כרטיסי אשראי והוצאות רכש.</p>',
    '<p className="text-slate-300 mt-2">סקירה פיננסית, כרטיסי אשראי והוצאות רכש.</p>'
)

# Replace the first `<div>` child of main container
content = content.replace(
    '      <div>\n        <h2 className="text-3xl font-bold tracking-tight text-white">כספים</h2>',
    '      <div className="lg:col-span-12 mb-4">\n        <h2 className="text-3xl font-bold tracking-tight text-white">כספים</h2>'
)

# 2. Metrics cards
# They are in a grid
content = content.replace(
    '<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">',
    '<div className="lg:col-span-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">'
)

def replace_metric_card(match):
    title = match.group(1)
    icon = match.group(2)
    value = match.group(3)
    subtitle = match.group(4)
    
    # Adjust icons
    icon = icon.replace('text-primary', 'text-white')

    return f"""<div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="text-sm font-medium text-slate-200">{title}</div>
            {icon}
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>"""

content = re.sub(
    r'<Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">\s*<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">\s*<CardTitle className="text-sm font-medium">(.*?)</CardTitle>\s*(<.*?className=".*?text-primary".*?>)\s*</CardHeader>\s*<CardContent>\s*<div className="text-2xl font-bold">(.*?)</div>\s*<p className="text-xs text-muted-foreground">(.*?)</p>\s*</CardContent>\s*</Card>',
    replace_metric_card,
    content,
    flags=re.DOTALL
)

# 3. Credit Cards Section
content = content.replace(
    '<div className="space-y-6">',
    '<div className="lg:col-span-8 glass-panel rounded-3xl p-6 flex flex-col gap-6">'
)
content = content.replace(
    '<h3 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">',
    '<h3 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">'
)
content = content.replace(
    '<CreditCard className="h-6 w-6 text-primary" />',
    '<CreditCard className="h-6 w-6 text-white" />'
)
content = content.replace('text-gray-800', 'text-white')
content = content.replace('text-gray-500', 'text-slate-400')
content = content.replace('text-gray-600', 'text-slate-300')
content = content.replace('text-gray-400', 'text-slate-500')
content = content.replace('bg-gray-200', 'bg-white/10')
content = content.replace('border-gray-100', 'border-white/10')
content = content.replace('border-gray-50', 'border-white/10')

# Card expanded details
content = content.replace(
    '<div className="bg-white rounded-xl border border-white/10 p-4 space-y-3 shadow-sm">',
    '<div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3 shadow-sm text-white">'
)
content = content.replace('text-gray-900', 'text-white')
content = content.replace('text-gray-700', 'text-slate-300')

# 4. Expenses Pie Chart
content = re.sub(
    r'<Card className="bg-white border-none shadow-sm">\s*<CardHeader>\s*<CardTitle>פילוג תשלומים</CardTitle>\s*<CardDescription>סך תשלומים לפי מותג/סוג</CardDescription>\s*</CardHeader>\s*<CardContent className="h-\[500px\] flex flex-col items-center justify-center pb-8">',
    r"""<div className="lg:col-span-4 glass-panel rounded-3xl p-6 flex flex-col">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-white">פילוג תשלומים</h3>
          <p className="text-sm text-slate-300">סך תשלומים לפי מותג/סוג</p>
        </div>
        <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center pb-8">""",
    content
)
content = content.replace('</CardContent>\s*</Card>', '</div>\n      </div>')
content = re.sub(
    r'</CardContent>\s*</Card>',
    r'</div>\n      </div>',
    content
)

content = content.replace(
    "boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}",
    "boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'rgba(15,23,42,0.9)', color: '#fff' }} itemStyle={{ color: '#fff' }}"
)

# 5. Raw Data Tables
content = content.replace(
    '<div className="space-y-8">',
    '<div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-4">'
)
content = content.replace(
    '<h3 className="text-2xl font-bold tracking-tight text-white">טבלאות נתונים</h3>',
    ''
)
content = content.replace(
    '<Card className="bg-white border-none shadow-sm p-4">',
    '<div className="glass-panel rounded-3xl p-6">'
)
content = content.replace(
    '<h4 className="text-lg font-semibold text-primary">תשלומי יבוא</h4>',
    '<h4 className="text-lg font-semibold text-white">תשלומי יבוא</h4>'
)
content = content.replace(
    '<h4 className="text-lg font-semibold text-primary">הזמנות מסין</h4>',
    '<h4 className="text-lg font-semibold text-white">הזמנות מסין</h4>'
)

# Buttons
content = content.replace('bg-primary text-primary-foreground', 'bg-white/10 text-white hover:bg-white/20 border border-white/20')
content = content.replace('text-blue-600', 'text-blue-400')
content = content.replace('bg-blue-50/50', 'bg-blue-500/10')
content = content.replace('hover:bg-blue-100', 'hover:bg-blue-500/20')
content = content.replace('text-red-600', 'text-red-400')
content = content.replace('bg-red-50/50', 'bg-red-500/10')
content = content.replace('hover:bg-red-100', 'hover:bg-red-500/20')
content = content.replace('bg-gray-50/50', 'bg-white/5')
content = content.replace('bg-gray-50/80', 'bg-white/5')
content = content.replace('bg-gray-50', 'bg-white/5')

content = content.replace('bg-white', 'bg-transparent')
content = content.replace('bg-white/50', 'bg-white/10')

# Table rows hover
content = content.replace('hover:bg-transparent/5', 'hover:bg-white/5')

with open('src/app/finance/finance-client.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

