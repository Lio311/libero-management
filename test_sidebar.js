const fs = require('fs');

let content = fs.readFileSync('src/components/layout/sidebar.tsx', 'utf8');

// The sidebar currently uses this classes for the desktop part:
// "fixed inset-y-4 right-4 z-50 flex h-[calc(100vh-2rem)] w-64 flex-col rounded-3xl glass-panel text-white shadow-xl transition-transform duration-300 md:relative md:translate-x-0 print:hidden",
// isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"

// We want to make it:
// 1. md:fixed md:w-[80px] hover:md:w-[260px] group overflow-hidden transition-all duration-300
// 2. Hide text until hovered or isOpen

// Let's replace the main sidebar classes:
content = content.replace(
  /"fixed inset-y-4 right-4 z-50 flex h-\[calc\(100vh-2rem\)\] w-64 flex-col rounded-3xl glass-panel text-white shadow-xl transition-transform duration-300 md:relative md:translate-x-0 print:hidden"/g,
  '"fixed inset-y-4 right-4 z-50 flex h-[calc(100vh-2rem)] flex-col rounded-3xl glass-panel text-white shadow-xl transition-all duration-300 print:hidden overflow-hidden group " + (isOpen ? "w-64" : "w-64 md:w-[80px] md:hover:w-64")'
);

// Note: since it's now fixed on desktop too, we must add a spacer for the layout to push the main content, OR let the main content span under it.
// Actually, `LayoutWrapper` in layout.tsx has `p-4 md:p-8`. If sidebar is fixed, main needs right margin/padding.
