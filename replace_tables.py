import os
import re

files_to_process = [
    'src/app/finance/finance-client.tsx',
    'src/app/inventory/inventory-client.tsx',
    'src/app/marketing/marketing-client.tsx',
    'src/app/operations/operations-client.tsx',
    'src/app/tasks/tasks-client.tsx'
]

for filepath in files_to_process:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    new_lines = []
    in_table = False
    
    for line in lines:
        if '<table' in line:
            in_table = True
        
        if in_table:
            # We want to replace text alignment classes in the table, th, td
            # and justify-end in divs inside td
            
            # Replace text-right and text-left with text-center
            line = re.sub(r'\btext-(right|left)\b', 'text-center', line)
            
            # Replace justify-end with justify-center for flex containers
            line = re.sub(r'\bjustify-end\b', 'justify-center', line)
            
        if '</table>' in line:
            in_table = False
            
        new_lines.append(line)
        
    with open(filepath, 'w') as f:
        f.writelines(new_lines)
