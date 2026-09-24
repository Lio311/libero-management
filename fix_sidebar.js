const fs = require('fs');

let content = fs.readFileSync('src/components/layout/sidebar.tsx', 'utf8');

// 1. Remove children from the top
content = content.replace(
  '<div className="hidden md:block">{children}</div>',
  ''
);

// 2. Add children to the bottom
// Current bottom:
// <div className={cn(
//   "p-4 border-t border-border/50",
//   !isAuthenticated && "blur-sm opacity-50"
// )}>
//   <div className="flex items-center px-3 py-2 text-xs text-slate-200">
//     <span className="opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">ניהול עסקי - B2B/B2C</span>
//   </div>
// </div>

const currentBottom = `<div className={cn(
          "p-4 border-t border-border/50",
          !isAuthenticated && "blur-sm opacity-50"
        )}>
          <div className="flex items-center px-3 py-2 text-xs text-slate-200">
            <span className="opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">ניהול עסקי - B2B/B2C</span>
          </div>
        </div>`;

const newBottom = `<div className={cn(
          "p-4 border-t border-border/50 flex flex-col gap-2",
          !isAuthenticated && "blur-sm opacity-50"
        )}>
          <div className="flex items-center justify-center gap-2">
            <div className="opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300">
              {children}
            </div>
          </div>
          <div className="flex items-center justify-center px-3 text-xs text-slate-200">
            <span className="opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">ניהול עסקי - B2B/B2C</span>
          </div>
        </div>`;

content = content.replace(currentBottom, newBottom);

// Since the `children` on mobile was also placed at the top (absolute left-4), let's remove it from there too.
// `<div className="absolute left-4 z-10">{children}</div>`
content = content.replace(
  '<div className="absolute left-4 z-10">{children}</div>',
  ''
);

fs.writeFileSync('src/components/layout/sidebar.tsx', content);
console.log('Sidebar fixed');
