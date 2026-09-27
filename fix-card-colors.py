import re

with open('src/app/shipping-scanner/scanner-list-client.tsx', 'r') as f:
    content = f.read()

# Replace the logic block
old_logic = """  let ageBgClass = "";
  if (order.status !== 'completed') {
    if (daysOld >= 5) {
      ageBgClass = "!bg-red-400 hover:!bg-red-500 !border-red-500";
    } else if (daysOld >= 3) {
      ageBgClass = "!bg-orange-400 hover:!bg-orange-500 !border-orange-500";
    }
  } else {
    ageBgClass = "!bg-emerald-500 hover:!bg-emerald-600 !border-emerald-500";
  }"""

new_logic = """  let ageBgClass = "";
  let isLightCard = false;
  if (order.status !== 'completed') {
    if (daysOld >= 5) {
      ageBgClass = "!bg-red-100 hover:!bg-red-200 !border-red-300";
      isLightCard = true;
    } else if (daysOld >= 3) {
      ageBgClass = "!bg-orange-100 hover:!bg-orange-200 !border-orange-300";
      isLightCard = true;
    }
  } else {
    ageBgClass = "!bg-emerald-100 hover:!bg-emerald-200 !border-emerald-300";
    isLightCard = true;
  }"""

content = content.replace(old_logic, new_logic)

# Add conditional class to root div
old_root = """<div className={`glass-panel p-4 rounded-xl hover-scale cursor-pointer group transition-colors h-full flex flex-col relative ${isSelected ? 'border-purple-500 border-2' : 'hover:border-primary/50'} ${ageBgClass}`}>"""
new_root = """<div className={`glass-panel p-4 rounded-xl hover-scale cursor-pointer group transition-colors h-full flex flex-col relative ${isSelected ? 'border-purple-500 border-2' : 'hover:border-primary/50'} ${ageBgClass} ${isLightCard ? '[&_*]:!text-slate-900' : ''}`}>"""
content = content.replace(old_root, new_root)

with open('src/app/shipping-scanner/scanner-list-client.tsx', 'w') as f:
    f.write(content)
