import re

with open('src/app/shipping-scanner/scanner-list-client.tsx', 'r') as f:
    content = f.read()

# Replace red
content = re.sub(
    r'!bg-red-500 hover:!bg-red-600 !border-red-600',
    r'!bg-red-400 hover:!bg-red-500 !border-red-500',
    content
)

# Replace orange
content = re.sub(
    r'!bg-orange-500 hover:!bg-orange-600 !border-orange-600',
    r'!bg-orange-400 hover:!bg-orange-500 !border-orange-500',
    content
)

# Add green for completed
# We will find the logic block and replace it
old_logic = """  let ageBgClass = "";
  if (order.status !== 'completed') {
    if (daysOld >= 5) {
      ageBgClass = "!bg-red-400 hover:!bg-red-500 !border-red-500";
    } else if (daysOld >= 3) {
      ageBgClass = "!bg-orange-400 hover:!bg-orange-500 !border-orange-500";
    }
  }"""

new_logic = """  let ageBgClass = "";
  if (order.status !== 'completed') {
    if (daysOld >= 5) {
      ageBgClass = "!bg-red-400 hover:!bg-red-500 !border-red-500";
    } else if (daysOld >= 3) {
      ageBgClass = "!bg-orange-400 hover:!bg-orange-500 !border-orange-500";
    }
  } else {
    ageBgClass = "!bg-emerald-500 hover:!bg-emerald-600 !border-emerald-500";
  }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
else:
    print("Logic not found!")

with open('src/app/shipping-scanner/scanner-list-client.tsx', 'w') as f:
    f.write(content)
