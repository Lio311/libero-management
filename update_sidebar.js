const fs = require('fs');

let content = fs.readFileSync('src/components/layout/sidebar.tsx', 'utf8');

// 1. Add Spacer
content = content.replace(
  '{/* Backdrop */}',
  '{/* Desktop Layout Spacer */}\n      <div className="hidden md:block w-[88px] shrink-0 pointer-events-none transition-all duration-300" />\n\n      {/* Backdrop */}'
);

// 2. Change Sidebar Classes
content = content.replace(
  '"fixed inset-y-4 right-4 z-50 flex h-[calc(100vh-2rem)] w-64 flex-col rounded-3xl glass-panel text-white shadow-xl transition-transform duration-300 md:relative md:translate-x-0 print:hidden",',
  '"fixed inset-y-4 right-4 z-50 flex h-[calc(100vh-2rem)] flex-col rounded-3xl glass-panel text-white shadow-xl transition-all duration-300 print:hidden overflow-hidden group/sidebar",\n        isOpen ? "translate-x-0 w-64" : "translate-x-[calc(100%+1rem)] md:translate-x-0 w-64 md:w-[72px] md:hover:w-64"'
);
content = content.replace(
  'isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"',
  ''
);

// 3. Logo animation
content = content.replace(
  '<div className="relative h-20 w-52 mx-auto pointer-events-none">',
  '<div className="relative h-20 w-52 md:w-12 md:group-hover/sidebar:w-52 mx-auto transition-all duration-300 pointer-events-none">'
);

// 4. Text opacity transitions
content = content.replace(
  '<span className="truncate">{item.name}</span>',
  '<span className="truncate opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">{item.name}</span>'
);
content = content.replace(
  '<span className="truncate">{item.name}</span>',
  '<span className="truncate opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">{item.name}</span>'
);
content = content.replace(
  '<span className="truncate">{subItem.name}</span>',
  '<span className="truncate opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">{subItem.name}</span>'
);
// Replace multiple times if needed:
while(content.includes('<span className="truncate">{item.name}</span>')) {
  content = content.replace(
    '<span className="truncate">{item.name}</span>',
    '<span className="truncate opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">{item.name}</span>'
  );
}
while(content.includes('<span className="truncate">{subItem.name}</span>')) {
  content = content.replace(
    '<span className="truncate">{subItem.name}</span>',
    '<span className="truncate opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">{subItem.name}</span>'
  );
}

// 5. Chevron opacity
content = content.replace(
  '<ChevronUp className="h-4 w-4" />',
  '<ChevronUp className="h-4 w-4 opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300" />'
);
content = content.replace(
  '<ChevronDown className="h-4 w-4" />',
  '<ChevronDown className="h-4 w-4 opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300" />'
);

// 6. Bottom text opacity
content = content.replace(
  '<span>ניהול עסקי - B2B/B2C</span>',
  '<span className="opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">ניהול עסקי - B2B/B2C</span>'
);

// 7. Remove `md:hidden` block that is absolutely positioned to `left-6`, we want it to fade in too
content = content.replace(
  '<div className="absolute left-6 flex items-center gap-2">',
  '<div className="absolute left-6 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300">'
);

// Write back
fs.writeFileSync('src/components/layout/sidebar.tsx', content);
console.log('Sidebar updated');
