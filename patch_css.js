const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

const oldCss = `/* 1. Turn generic light text to dark, BUT exclude elements with solid colored backgrounds (bg-blue, bg-red, etc) */
body.light-glass .glass-panel :where(.text-white, .text-white\\/70, .text-white\\/80, .text-white\\/90, .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400, .text-zinc-100, .text-zinc-200, .text-zinc-300, .text-zinc-400, .text-gray-100, .text-gray-200, .text-gray-300, .text-gray-400):not([class*="bg-blue-"]):not([class*="bg-red-"]):not([class*="bg-green-"]):not([class*="bg-emerald-"]):not([class*="bg-purple-"]):not([class*="bg-primary"]):not([class*="bg-amber-"]) {
  color: #1d1d1f !important;
}

/* Also handle when the glass-panel itself has these text classes */
body.light-glass .glass-panel:where(.text-white, .text-white\\/70, .text-slate-200, .text-slate-300) {
  color: #1d1d1f !important;
}`;

const newCss = `/* 1. Turn generic light text to dark */
body.light-glass .glass-panel .text-white,
body.light-glass .glass-panel .text-slate-100,
body.light-glass .glass-panel .text-slate-200,
body.light-glass .glass-panel .text-slate-300,
body.light-glass .glass-panel .text-slate-400 {
  color: #1d1d1f !important;
}

body.light-glass .glass-panel.text-white {
  color: #1d1d1f !important;
}`;

code = code.replace(oldCss, newCss);
fs.writeFileSync('src/app/globals.css', code);
