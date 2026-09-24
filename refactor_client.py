import re

with open('src/app/shipping-scanner/[orderId]/scanner-client.tsx', 'r') as f:
    content = f.read()

# 1. Main wrapper
content = content.replace(
    '<div className="space-y-6 max-w-4xl mx-auto">',
    '<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">'
)

# Replace the flex col wrapper inside that holds the header and buttons
content = content.replace(
    '<div className="flex flex-col mb-8 gap-4">',
    '<div className="col-span-1 lg:col-span-5 glass-panel rounded-3xl p-6 flex flex-col gap-4">'
)

# Then we have the reward/instruction div:
# <div className="p-2 mb-6 flex flex-col sm:flex-row items-center gap-6 justify-between w-full">
# And the scanner wrapper:
# <div className="flex flex-col gap-3">
# We want to wrap BOTH of these in a new Bento card.
# The previous bento card (Header & Buttons) ends right before the reward div.
# We need to find `      {order.reward && (order.reward.gift || !store || store === 'libero') && (`

# Actually, it might be easier to use regex or string methods.
parts = content.split('<div className="flex flex-col gap-3">')
# The second part contains the camera/scanner and the grid buttons.
# Let's wrap the reward block and the scanner in another bento.

# Let's just wrap everything from {order.reward ... to the end of the grid buttons.
# Wait, it's safer to use simple string replacements.

# Let's replace the camera start button block to start a new Bento card.
# Actually, if I just replace `<div className="flex flex-col gap-3">` with `<div className="col-span-1 lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col gap-4">`
# But what about the reward block?
content = content.replace(
    '{order.reward && (order.reward.gift || !store || store === \'libero\') && (',
    '</div>\n      <div className="col-span-1 lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col gap-4">\n      {order.reward && (order.reward.gift || !store || store === \'libero\') && ('
)
# Now we opened a new Bento card for the reward and camera.
# But wait, the previous block (header & buttons) was already closed? No, I didn't add a closing div for the first block!
# By doing `</div>\n      <div className="col-span-1 lg:col-span-7 ...` I close the first block and open the second. This assumes the first block was still open, which it is!
# Wait, let's verify if the first block had a closing div.
# In the original:
# <div className="flex flex-col mb-8 gap-4">
#   ...
#   <button ... סגירת הזמנה ידנית ... </button>
# </div>
# {order.reward && ...

# Ah! The original code HAS a `</div>` for `<div className="flex flex-col mb-8 gap-4">`.
# So replacing `{order.reward && ...` with `</div>...` would add an EXTRA closing div.

# Let's check original text:
#         </div>
#       </div>
#
#       {order.reward && (order.reward.gift || !store || store === 'libero') && (

# Yes! So the first block closes properly. I just need to prepend the new Bento card opening to `{order.reward`. Wait, if `{order.reward` doesn't render, we still need the Bento card!
# The next unconditionally rendered block is `<div className="flex flex-col gap-3">`.
# If I wrap the reward and camera together:
# I can replace:
#       {order.reward && (order.reward.gift || !store || store === 'libero') && (
# with:
#       <div className="col-span-1 lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col gap-4">
#       {order.reward && (order.reward.gift || !store || store === 'libero') && (
#
# And then where does this new Bento close?
# Before the items grid!
# The items grid starts with:
#       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
# I can replace that with:
#       </div>
#       <div className="col-span-1 lg:col-span-12 glass-panel rounded-3xl p-6">
#         <h3 className="text-xl font-bold text-white mb-4">מוצרים בהזמנה</h3>
#         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

content = content.replace(
    '      {order.reward && (order.reward.gift || !store || store === \'libero\') && (',
    '      <div className="col-span-1 lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col gap-4">\n      {order.reward && (order.reward.gift || !store || store === \'libero\') && ('
)

content = content.replace(
    '      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">',
    '      </div>\n      <div className="col-span-1 lg:col-span-12 glass-panel rounded-3xl p-6">\n        <h3 className="text-xl font-bold text-white mb-4">מוצרים בהזמנה</h3>\n        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">'
)

# Ensure no bg-white or bg-card is causing solid background inside bentos.
# Not seeing bg-white or bg-card in scanner-client.tsx except maybe in some elements.
# Let's replace some text-foreground with text-white
content = content.replace('text-foreground', 'text-white')

# Also, the items card has `bg-green-500/5` or `bg-red-500/5` or `border-border/50`. We can make sure they don't have bg-white/bg-card.

# Finally, we need to add a closing div for the items bento, but wait, the items grid was originally closed at the end of the main wrapper.
# So the main wrapper `</div>` will close the items grid. We need to add one more `</div>` to close the bento!
# Wait, the end of the return statement is:
#         ))}
#       </div>
#     </div>
#   );
# If we add a bento wrapper, we need three `</div>`: one for items grid, one for bento, one for main container.
# Let's replace:
#         ))}
#       </div>
#     </div>
#   );
# with:
#         ))}
#       </div>
#       </div>
#     </div>
#   );

content = content.replace(
    '        ))}\n      </div>\n    </div>\n  );',
    '        ))}\n      </div>\n      </div>\n    </div>\n  );'
)

# And if there are any Modals at the end, they might be outside.
# Let's check the end of the file.
with open('src/app/shipping-scanner/[orderId]/scanner-client.tsx', 'w') as f:
    f.write(content)
