const fs = require('fs');
let code = fs.readFileSync('src/app/calendar-client.tsx', 'utf8');

const oldModalTask = `                        let taskStyle = 'bg-white/10 border-white/20 hover:border-white/40 hover:bg-white/20';
                        let titleStyle = 'text-foreground';
                        let iconStyle = 'text-muted-foreground hover:text-foreground';
                        
                        if (task.isCompleted) {
                          taskStyle = 'bg-green-100 border-green-300 opacity-90';
                          titleStyle = 'line-through text-green-800';
                          iconStyle = 'text-green-600 hover:text-green-800';
                        } else if (task.isDelayed) {
                            taskStyle = 'bg-orange-100 border-orange-300 hover:bg-orange-200';
                            titleStyle = 'text-orange-200';
                            iconStyle = 'text-orange-600 hover:text-orange-800';
                        } else if (isPastDate) {
                          taskStyle = 'bg-red-100 border-red-300 hover:bg-red-200';
                          titleStyle = 'text-red-200';
                          iconStyle = 'text-red-500 hover:text-red-700';
                        }`;

const newModalTask = `                        let taskStyle = isLight ? 'bg-black/5 border-black/5 hover:border-black/10 hover:bg-black/10' : 'bg-white/10 border-white/20 hover:border-white/40 hover:bg-white/20';
                        let titleStyle = isLight ? 'text-[#1d1d1f]' : 'text-[#fff]';
                        let iconStyle = isLight ? 'text-[#86868b] hover:text-[#1d1d1f]' : 'text-slate-400 hover:text-[#fff]';
                        
                        if (task.isCompleted) {
                          taskStyle = 'bg-green-100 border-green-300 opacity-90';
                          titleStyle = 'text-green-800 line-through';
                          iconStyle = 'text-green-600 hover:text-green-800';
                        } else if (task.isDelayed) {
                          taskStyle = 'bg-orange-100 border-orange-300 hover:bg-orange-200';
                          titleStyle = 'text-orange-900';
                          iconStyle = 'text-orange-500 hover:text-orange-700';
                        } else if (isPastDate) {
                          taskStyle = 'bg-red-100 border-red-300 hover:bg-red-200';
                          titleStyle = 'text-red-900';
                          iconStyle = 'text-red-500 hover:text-red-700';
                        }`;

code = code.replace(oldModalTask, newModalTask);
fs.writeFileSync('src/app/calendar-client.tsx', code);
