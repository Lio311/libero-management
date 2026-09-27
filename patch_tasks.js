const fs = require('fs');
let code = fs.readFileSync('src/app/calendar-client.tsx', 'utf8');

const oldBlock = `                        let titleStyle = 'text-slate-200';
                        let dotColor = 'bg-blue-400';
                        let bgStyle = 'hover:bg-white/10';
                        
                        if (task.isCompleted) {
                          titleStyle = 'text-muted-foreground line-through';
                          dotColor = 'bg-green-400';
                        } else if (task.isDelayed) {
                            titleStyle = 'text-orange-200';
                            dotColor = 'bg-orange-400';
                            bgStyle = 'bg-orange-500/10 hover:bg-orange-500/20';
                        } else if (task.isImportant) {
                          titleStyle = 'text-red-200';
                          dotColor = 'bg-red-500';
                          bgStyle = 'bg-red-500/20 hover:bg-red-500/30';
                        }`;

const newBlock = `                        let titleStyle = isLight ? 'text-slate-700' : 'text-slate-200';
                        let dotColor = 'bg-blue-400';
                        let bgStyle = isLight ? 'hover:bg-black/5' : 'hover:bg-white/10';
                        
                        if (task.isCompleted) {
                          titleStyle = (isLight ? 'text-slate-400' : 'text-slate-400') + ' line-through';
                          dotColor = 'bg-green-400';
                        } else if (task.isDelayed) {
                            titleStyle = isLight ? 'text-orange-700' : 'text-orange-200';
                            dotColor = 'bg-orange-400';
                            bgStyle = isLight ? 'bg-orange-500/20 hover:bg-orange-500/30' : 'bg-orange-500/10 hover:bg-orange-500/20';
                        } else if (task.isImportant) {
                          titleStyle = isLight ? 'text-red-700' : 'text-red-200';
                          dotColor = 'bg-red-500';
                          bgStyle = isLight ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-red-500/20 hover:bg-red-500/30';
                        }`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('src/app/calendar-client.tsx', code);
