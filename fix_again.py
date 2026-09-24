with open("src/app/qc-inventory/qc-inventory-client.tsx", "r") as f:
    content = f.read()

content = content.replace('  const thStyle = { top: `${Math.max(0, headerHeight)}px`, backgroundClip: "padding-box" };\n\n    <div className="min-h-screen relative p-4 md:p-6 lg:p-8" dir="rtl">',
'  const thStyle = { top: `${Math.max(0, headerHeight)}px`, backgroundClip: "padding-box" };\n\n  return (\n    <div className="min-h-screen relative p-4 md:p-6 lg:p-8" dir="rtl">')

with open("src/app/qc-inventory/qc-inventory-client.tsx", "w") as f:
    f.write(content)

# Now fix tasks-client.tsx
with open("src/app/tasks/tasks-client.tsx", "r") as f:
    tasks_content = f.read()

# Error:
#   566 |           </table>
#   567 |         </div>
# > 568 |         )}
#       |          ^
#   569 |       </div>
#   570 |   );
#   571 | }
# Looks like there is a missing { before `filteredTasks.length > 0 ?` or similar? Wait, the error is an unmatched `)}`.

import re
# Let's just find and remove the unmatched )} if it's there, but usually it's closing a condition. Let's see.
