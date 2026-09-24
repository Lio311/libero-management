with open("src/app/shipping-scanner/[orderId]/scanner-client.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Change main container
    if 'className="space-y-6 max-w-4xl mx-auto"' in line:
        line = line.replace('space-y-6 max-w-4xl mx-auto', 'grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto')
    
    # Header Bento opening
    elif '<div className="flex flex-col mb-8 gap-4">' in line:
        line = line.replace('<div className="flex flex-col mb-8 gap-4">', '<div className="col-span-1 lg:col-span-5 glass-panel rounded-3xl p-6 flex flex-col gap-4">')
    
    # Scanner + Reward Bento opening
    elif "{order.reward && (order.reward.gift || !store || store === 'libero') && (" in line:
        if i > 0 and 'glass-panel' not in lines[i-1]:
            new_lines.append('      <div className="col-span-1 lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col gap-4">\n')
    
    # Scanner + Reward Bento closing & Items Bento opening
    elif '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">' in line:
        new_lines.append('      </div>\n')
        new_lines.append('      <div className="col-span-1 lg:col-span-12 glass-panel rounded-3xl p-6">\n')
        new_lines.append('        <h3 className="text-xl font-bold text-white mb-4">מוצרים בהזמנה</h3>\n')

    # General replacements
    line = line.replace('text-foreground', 'text-white')
    line = line.replace('bg-card', 'bg-white/5')
    line = line.replace('bg-background', 'bg-white/5')

    new_lines.append(line)
    
    # Items Bento closing
    if '))} ' in line or '))}' in line:
        # Check if next lines are closing the main container.
        # Actually it's easier to find:
        #         ))}
        #       </div>
        #     </div>
        pass

# Fix items bento closing manually by replacing the end
content = "".join(new_lines)
content = content.replace('        ))}\n      </div>\n    </div>', '        ))}\n      </div>\n      </div>\n    </div>')

with open("src/app/shipping-scanner/[orderId]/scanner-client.tsx", "w") as f:
    f.write(content)
