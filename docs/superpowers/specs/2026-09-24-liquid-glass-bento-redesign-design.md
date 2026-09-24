# Liquid Glass & Bento Box Redesign Spec

**Goal:** Redesign the entire application to feature a global fixed beach background, Dark Glassmorphism style cards (translucent dark background with blur), a floating RTL sidebar, and Bento Box-style data layouts.

## Architecture & Global Constraints
- **Framework:** Next.js (App Router) + Tailwind CSS.
- **Components:** Shadcn UI / Radix primitives.
- **RTL Support:** Sidebar is anchored to the right. Text alignment remains RTL-native.
- **Responsive:** Mobile-first layout for navigation (bottom floating bar on mobile, floating sidebar on desktop).

## 1. Global Layout & Background
- **Background Image:** The provided beach image (`Image 2`) must be set as a fixed, fullscreen background on the `<body>` or root `<main>` element.
- **Scrolling:** The background remains fixed; the glass cards and content scroll over it.
- **Tailwind Utility:** Extend Tailwind config or `globals.css` with a `.glass-panel` class:
  ```css
  .glass-panel {
    background-color: rgba(0, 0, 0, 0.45); /* Dark translucent */
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    color: white;
  }
  ```

## 2. Navigation
- **Desktop Sidebar:** 
  - Positioned on the right (RTL).
  - Floating design: `fixed top-4 right-4 bottom-4 w-64 rounded-3xl glass-panel flex flex-col`.
  - Margin applied to the main content wrapper: `mr-[calc(16rem+2rem)]` (256px + 32px) to accommodate the sidebar and gaps.
- **Mobile Navigation:**
  - Floating bottom bar: `fixed bottom-4 left-4 right-4 h-16 rounded-3xl glass-panel flex justify-around items-center z-50`.
  - Main content padding-bottom adjusted for mobile to prevent content hiding behind the bar.

## 3. Page Structure (Bento Box Layout)
- **Grid System:** Wrap main page content in a CSS grid (e.g., `grid grid-cols-1 md:grid-cols-12 gap-4`).
- **Data Heavy Pages (Inventory, Finance, etc.):**
  - Break down monolithic tables into smaller semantic cards.
  - *Example Setup:*
    - **Top Row:** 3-4 small glass cards for Key Performance Indicators (KPIs/Metrics) using `col-span-12 md:col-span-3`.
    - **Middle Row:** A glass card for search/filters taking `col-span-12`.
    - **Main Area:** A large glass card for the data table `col-span-12`.
- **Card Styling:** Every bento container gets the `.glass-panel` class and soft rounded corners (`rounded-2xl` or `rounded-3xl`).

## 4. Floating Elements (Overlays, Modals, Dropdowns)
- **Constraint:** Do NOT apply glassmorphism to popups/dropdowns to preserve performance and avoid blur-on-blur unreadability.
- **Styling:** Use a solid dark color that matches the tone of the dark glass, e.g., `bg-slate-900 border-slate-700 text-white`.
- **Implementation:** Override Shadcn UI overlay components (DialogContent, DropdownMenuContent, PopoverContent, TooltipContent) in their respective files to remove `bg-background` and replace with `bg-slate-900 border-slate-700 text-white shadow-xl rounded-xl`.

## 5. Micro-interactions
- **Hover States:** Add subtle hover effects to interactive glass elements. 
  - `hover:bg-black/50 transition-colors duration-200`
  - Subtle scaling for buttons/small cards: `hover:scale-[1.02] active:scale-95 transition-transform`.

## Implementation Strategy (Phases)
1. **Infrastructure:** Add background image, define `.glass-panel` in `globals.css`, setup Tailwind dark mode variables to force light text on dark panels.
2. **Global Navigation:** Rebuild the `layout.tsx` to include the desktop right-floating sidebar and mobile bottom floating bar.
3. **Components Overhaul:** Update Shadcn UI Popovers, Dropdowns, and Dialogs to the solid dark theme.
4. **Bento Box Refactoring:** Incrementally update main pages (e.g., dashboard, inventory) by replacing single large containers with the grid-based `.glass-panel` bento layout.
