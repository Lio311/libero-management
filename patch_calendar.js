 
 
/* eslint-disable @typescript-eslint/no-require-imports */
 
const fs = require('fs');
const file = 'src/app/calendar-client.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove optimistic update from onDrop
code = code.replace(/setLocalTasks\(prev => \{\s*const newTasks = \{ \.\.\.prev \};\s*newTasks\[sourceDateKey\] = newTasks\[sourceDateKey\]\.filter\(t => t\.id !== taskId\);\s*if \(\!newTasks\[dateKey\]\) newTasks\[dateKey\] = \[\];\s*newTasks\[dateKey\] = \[\.\.\.newTasks\[dateKey\], taskToMove\];\s*return newTasks;\s*\}\);/g, '');

// Save the file
fs.writeFileSync(file, code);
