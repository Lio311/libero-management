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
      ageBgClass = "!bg-red-50 hover:!bg-red-100 !border-red-200";
      isLightCard = true;
    } else if (daysOld >= 3) {
      ageBgClass = "!bg-orange-50 hover:!bg-orange-100 !border-orange-200";
      isLightCard = true;
    }
  } else {
    ageBgClass = "!bg-emerald-50 hover:!bg-emerald-100 !border-emerald-200";
    isLightCard = true;
  }"""

content = content.replace(old_logic, new_logic)

# Replace the class names to use conditional text colors

# 1. Customer name and date wrapper
old_customer_wrapper = """<div className="flex items-center justify-between text-sm text-white/70 flex-1 mb-1">"""
new_customer_wrapper = """<div className={`flex items-center justify-between text-sm flex-1 mb-1 ${isLightCard ? 'text-slate-600' : 'text-white/70'}`}>"""
content = content.replace(old_customer_wrapper, new_customer_wrapper)

# 2. Total price wrapper
old_total_wrapper = """<div className="mt-2 pt-2 border-t border-white/10 text-white font-medium flex justify-between items-center">"""
new_total_wrapper = """<div className={`mt-2 pt-2 border-t border-white/10 font-medium flex justify-between items-center ${isLightCard ? 'text-slate-900 border-slate-200' : 'text-white border-white/10'}`}>"""
content = content.replace(old_total_wrapper, new_total_wrapper)

# 3. h3 override via the root div (to override globals.css text-foreground)
old_root = """<div className={`glass-panel p-4 rounded-xl hover-scale cursor-pointer group transition-colors h-full flex flex-col relative ${isSelected ? 'border-purple-500 border-2' : 'hover:border-primary/50'} ${ageBgClass}`}>"""
new_root = """<div className={`glass-panel p-4 rounded-xl hover-scale cursor-pointer group transition-colors h-full flex flex-col relative ${isSelected ? 'border-purple-500 border-2' : 'hover:border-primary/50'} ${ageBgClass} ${isLightCard ? '[&_h3]:!text-slate-900 [&_svg.text-primary]:!text-blue-600' : ''}`}>"""
content = content.replace(old_root, new_root)

with open('src/app/shipping-scanner/scanner-list-client.tsx', 'w') as f:
    f.write(content)
