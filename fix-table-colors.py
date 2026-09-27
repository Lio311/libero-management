import re

with open('src/app/marketing/marketing-client.tsx', 'r') as f:
    content = f.read()

replacements = {
    r'\btext-white\b': 'text-slate-900',
    r'\btext-slate-200\b': 'text-slate-600',
    r'\btext-slate-300\b': 'text-slate-700',
    r'\btext-slate-400\b': 'text-slate-500',
    r'\btext-blue-300\b': 'text-blue-600',
    r'\btext-blue-400\b': 'text-blue-600',
    r'\bbg-blue-500/20\b': 'bg-blue-100',
    r'\btext-emerald-300\b': 'text-emerald-600',
    r'\btext-purple-300\b': 'text-purple-600',
    r'\btext-pink-300\b': 'text-pink-600',
    r'\btext-yellow-200\b': 'text-yellow-800',
    r'\bbg-yellow-500/20\b': 'bg-yellow-100',
    r'\btext-green-200\b': 'text-green-800',
    r'\bbg-green-500/20\b': 'bg-green-100',
    r'\btext-green-300\b': 'text-green-700',
    r'\btext-red-300\b': 'text-red-600',
    r'\bbg-red-500/20\b': 'bg-red-100',
    r'\bbg-white/5\b': 'bg-slate-50',
    r'\bbg-white/10\b': 'bg-slate-100',
    r'\bbg-white/20\b': 'bg-slate-200',
    # For the popup, it used bg-[#1a1f2e] and text-white. 
    # Because we replace text-white with text-slate-900 globally, we should change the popup bg too:
    r'bg-\[\#1a1f2e\] border border-white/10': 'bg-white border border-slate-200'
}

for old, new in replacements.items():
    content = re.sub(old, new, content)

# But wait, there are hover states like hover:bg-white/20 which become hover:bg-slate-200.
# hover:bg-red-500/300/20 -> wait, there is a typo in the original code! hover:bg-red-500/300/20
content = content.replace("hover:bg-red-500/300/20", "hover:bg-red-200")
content = content.replace("hover:bg-blue-500/300/20", "hover:bg-blue-200")
content = content.replace("hover:bg-green-500/300/20", "hover:bg-green-200")
content = content.replace("text-slate-900 text-slate-900", "text-slate-900") # in case of double replacement

with open('src/app/marketing/marketing-client.tsx', 'w') as f:
    f.write(content)
