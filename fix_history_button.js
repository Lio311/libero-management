const fs = require('fs');

let content = fs.readFileSync('src/app/shipping-scanner/scanner-list-client.tsx', 'utf8');

// Replace button classes
const oldClasses = '"mt-6 w-full py-4 bg-white/10 hover:bg-white/10 rounded-xl border border-white/10 text-white/70 flex items-center justify-center gap-2 transition-all font-medium"';
const newClasses = '"mt-6 w-full py-4 glass-panel hover:bg-black/60 rounded-xl border border-white/20 text-white flex items-center justify-center gap-2 transition-all font-semibold shadow-md"';

content = content.replace(oldClasses, newClasses);

// Replace arrow position
const oldArrow = `<ChevronDown className="w-5 h-5" />
                  הצג את כל היסטוריית ההזמנות`;
const newArrow = `הצג את כל היסטוריית ההזמנות
                  <ChevronDown className="w-5 h-5" />`;

content = content.replace(oldArrow, newArrow);

// Also replace loader position just in case
const oldLoader = `<Loader2 className="w-5 h-5 animate-spin" />
                  טוען היסטוריית הזמנות...`;
const newLoader = `טוען היסטוריית הזמנות...
                  <Loader2 className="w-5 h-5 animate-spin" />`;
                  
content = content.replace(oldLoader, newLoader);

fs.writeFileSync('src/app/shipping-scanner/scanner-list-client.tsx', content);
console.log('Button updated');
