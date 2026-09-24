import re

with open("src/app/shipping-scanner/scanner-list-client.tsx", 'r') as f:
    content = f.read()

# Make sure main grid is correct
content = content.replace(
    'className="flex-1 space-y-12 p-4 md:p-8 pt-6 h-[100dvh] overflow-y-auto w-full pb-32"',
    'className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 md:p-8 pt-6 h-[100dvh] overflow-y-auto w-full pb-32"'
)

# Now, wrap the first block (header & buttons) in a glass-panel
# The header block starts with `<div className="flex flex-col gap-4">`
content = content.replace(
    '<div className="flex flex-col gap-4">',
    '<div className="col-span-1 lg:col-span-12 glass-panel rounded-3xl p-6 flex flex-col gap-4">'
)

# The search input and stats. Currently they are:
# <div className="relative max-w-2xl">
# ...
# </div>
# <div className="grid grid-cols-2 gap-4 max-w-2xl">
# Let's wrap search in one bento, and stats in another
content = content.replace(
    '<div className="relative max-w-2xl">',
    '<div className="col-span-1 lg:col-span-4 glass-panel rounded-3xl p-6 flex flex-col justify-center space-y-4">\n      <h3 className="text-lg font-medium text-white mb-2">חיפוש</h3>\n      <div className="relative w-full">'
)

content = content.replace(
    '<div className="grid grid-cols-2 gap-4 max-w-2xl">',
    '<div className="col-span-1 lg:col-span-8 glass-panel rounded-3xl p-6">\n      <div className="grid grid-cols-2 gap-4 h-full">'
)

# Fix the end tags for the wrapping
# Actually it's easier to manually replace the exact blocks.
with open("src/app/shipping-scanner/scanner-list-client.tsx", 'w') as f:
    f.write(content)
