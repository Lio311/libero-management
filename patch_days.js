const fs = require('fs');
let code = fs.readFileSync('src/app/calendar-client.tsx', 'utf8');

const oldBlock = `                  className={\`min-h-[100px] p-1.5 md:p-2 border-b border-l border-white/10 relative transition-colors group
                    \${!isCurrentMonth ? 'opacity-40 bg-black/10' : 'hover:bg-white/5'}
                    \${dayIdx % 7 === 6 ? 'border-l-0' : ''}
                  \`}`;

const newBlock = `                  className={\`min-h-[100px] p-1.5 md:p-2 border-b border-l \${isLight ? 'border-black/5' : 'border-white/10'} relative transition-colors group
                    \${!isCurrentMonth ? (isLight ? 'opacity-40 bg-black/5' : 'opacity-40 bg-black/10') : (isLight ? 'hover:bg-white/60' : 'hover:bg-white/5')}
                    \${dayIdx % 7 === 6 ? 'border-l-0' : ''}
                  \`}`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('src/app/calendar-client.tsx', code);
