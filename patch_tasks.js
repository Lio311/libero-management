 
 
/* eslint-disable @typescript-eslint/no-require-imports */
 
const fs = require('fs');
const file = 'src/app/tasks/tasks-client.tsx';
let code = fs.readFileSync(file, 'utf8');

// We need to add date-fns for checking dates
if (!code.includes("import { isBefore, startOfDay, isValid }")) {
  code = code.replace(/import { Edit2, Plus, LayoutGrid, LayoutList, CheckCircle2, Check, X } from 'lucide-react';/, 
    "import { Edit2, Plus, LayoutGrid, LayoutList, CheckCircle2, Check, X } from 'lucide-react';\nimport { isBefore, startOfDay, isValid } from 'date-fns';");
}

// Add a helper function to check if overdue
const helper = `
  const isOverdue = (dueDate?: string | null) => {
    if (!dueDate) return false;
    let day, month, year;
    if (dueDate.includes('-')) {
      const parts = dueDate.split('-');
      if (parts[0].length === 4) { year = parseInt(parts[0]); month = parseInt(parts[1]) - 1; day = parseInt(parts[2]); }
      else { day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]); }
    } else if (dueDate.includes('.')) {
      const parts = dueDate.split('.');
      day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
    } else if (dueDate.includes('/')) {
      const parts = dueDate.split('/');
      day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
    } else {
      const parsed = new Date(dueDate);
      if (isValid(parsed)) return isBefore(parsed, startOfDay(new Date()));
      return false;
    }
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (year < 100) year += 2000;
    const parsedDate = new Date(year, month, day);
    return isBefore(parsedDate, startOfDay(new Date()));
  };
`;
if (!code.includes("const isOverdue = (dueDate")) {
  code = code.replace(/const getStatusIcon =/, helper + '\n  const getStatusIcon =');
}

// Update kanban todoTasks
code = code.replace(
  /\{todoTasks\.map\(task => \(\s*<div key=\{task\.id\} className="bg-background (p-4[^"]+)"\>/g,
  `{todoTasks.map(task => (
                <div key={task.id} className={\`\${isOverdue(task.dueDate) ? 'bg-red-50/50 border-red-200 text-red-900' : 'bg-background border-border/50 text-foreground'} $1\`}>`
);

// Update kanban inProgressTasks
code = code.replace(
  /\{inProgressTasks\.map\(task => \(\s*<div key=\{task\.id\} className="bg-background (p-4[^"]+)"\>/g,
  `{inProgressTasks.map(task => (
                <div key={task.id} className={\`\${isOverdue(task.dueDate) ? 'bg-red-50/50 border-red-200 text-red-900' : 'bg-background border-amber-100 text-foreground'} $1\`}>`
);

// Update Table View rows
code = code.replace(
  /\<tr key=\{task\.id\} className="hover:bg-muted\/30 transition-colors group"\>/g,
  `<tr key={task.id} className={\`hover:bg-muted/30 transition-colors group \${task.status !== 'בוצע' && isOverdue(task.dueDate) ? 'bg-red-50/30' : ''}\`}>`
);

// Write back
fs.writeFileSync(file, code);
