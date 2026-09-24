# Liquid Glass & Bento Box Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the application to feature a global fixed beach background, Dark Glassmorphism style cards (translucent dark background with blur), a floating RTL sidebar, and solid dark overlay components.

**Architecture:** We are updating the global CSS utilities for glassmorphism, modifying the main layout to include the fixed background, transitioning the sidebar to a floating rounded element, and updating Shadcn UI popup components to use a solid dark theme for performance and readability.

**Tech Stack:** Next.js (App Router), Tailwind CSS, React, Shadcn UI.

## Global Constraints

- Must maintain existing RTL text alignment (`dir="rtl"`).
- Performance: Popovers, dialogs, and selects must use a solid dark background instead of glassmorphism to prevent mobile scrolling lag.
- The beach image must be served from `/beach-bg.png`.

---

### Task 1: Global CSS & Background Setup

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: N/A
- Produces: Global `.glass-panel` and `.solid-overlay-dark` CSS utility classes.

- [ ] **Step 1: Update globals.css with new utilities**

Modify the existing `.glass-panel` to use a dark theme and add `.solid-overlay-dark` in `src/app/globals.css`.

```css
@layer utilities {
  .glass-panel {
    background-color: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(12px) saturate(150%);
    -webkit-backdrop-filter: blur(12px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    color: white;
  }
  .solid-overlay-dark {
    background-color: #0f172a; /* slate-900 */
    border: 1px solid #334155; /* slate-700 */
    color: white;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  }
}
```

- [ ] **Step 2: Add fixed background to root layout**

Modify the `<body>` element in `src/app/layout.tsx` to include the background image and remove solid background colors.

```tsx
<body 
  className={`${assistant.className} antialiased h-screen overflow-hidden flex flex-col md:flex-row bg-cover bg-center bg-no-repeat bg-fixed`}
  style={{ backgroundImage: "url('/beach-bg.png')" }}
>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add dark glassmorphism utilities and global beach background"
```

### Task 2: Floating Sidebar Navigation

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

**Interfaces:**
- Consumes: Global `.glass-panel` class.
- Produces: A floating sidebar layout.

- [ ] **Step 1: Update Sidebar wrapper classes**

Modify the main `div` containing the sidebar in `src/components/layout/sidebar.tsx` to add margins and rounded corners for the floating effect. Replace `fixed inset-y-0 right-0 z-50 flex h-full w-64` with the new floating layout classes.

```tsx
<div className={cn(
  "fixed inset-y-4 right-4 z-50 flex h-[calc(100vh-2rem)] w-64 flex-col rounded-3xl glass-panel text-white shadow-xl transition-transform duration-300 md:relative md:translate-x-0 print:hidden",
  isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
)}>
```

- [ ] **Step 2: Update mobile header classes**

In `src/components/layout/sidebar.tsx`, update the mobile header div to use `glass-panel` with correct spacing. Note: It already uses `glass-panel`, just ensure text defaults to white (add `text-white`).

```tsx
<div className="md:hidden print:hidden flex h-[calc(5rem_+_env(safe-area-inset-top))] pt-[calc(1.5rem_+_env(safe-area-inset-top))] pb-2 items-center px-4 border-b border-border/20 glass-panel text-white shrink-0 relative z-50 justify-center">
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: implement floating dark glass sidebar layout"
```

### Task 3: Adjust Layout Wrapper Spacing

**Files:**
- Modify: `src/components/layout/layout-wrapper.tsx`

**Interfaces:**
- Consumes: Floating sidebar from Task 2.
- Produces: Adjusted main content area wrapper.

- [ ] **Step 1: Modify layout wrapper container**

Since the sidebar is now floating with a margin (it has a gap to the edge), the main content wrapper needs slightly adjusted spacing. If `LayoutWrapper` handles the flex layout alongside the sidebar, ensure the main content is readable on top of the background.

```tsx
export function LayoutWrapper({ sidebar, children }: { sidebar: React.ReactNode, children: React.ReactNode }) {
  return (
    <>
      {sidebar}
      <main className="flex-1 overflow-y-auto h-full w-full relative z-0 p-4 md:p-8">
        {children}
      </main>
    </>
  );
}
```

*(Note: Verify the actual contents of `layout-wrapper.tsx` to match this structure, preserving any context providers if they exist).*

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/layout-wrapper.tsx
git commit -m "feat: adjust layout wrapper for floating sidebar and scrolling background"
```

### Task 4: Solid Dark Overlays (Popups, Dialogs, Selects)

**Files:**
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/popover.tsx`
- Modify: `src/components/ui/select.tsx`

**Interfaces:**
- Consumes: `.solid-overlay-dark` class from Task 1.
- Produces: Updated Radix primitives with solid dark UI.

- [x] **Step 1: Update DialogContent**

In `src/components/ui/dialog.tsx`, modify `DialogContent` className to remove `bg-background` and replace with `solid-overlay-dark rounded-xl`.

```tsx
className={cn(
  "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 solid-overlay-dark rounded-xl p-6 shadow-lg duration-200 ...",
  className
)}
```

- [x] **Step 2: Update PopoverContent**

In `src/components/ui/popover.tsx`, modify `PopoverContent`.

```tsx
className={cn(
  "z-50 w-72 rounded-xl solid-overlay-dark p-4 shadow-md outline-none data-[state=open]:animate-in ...",
  className
)}
```

- [x] **Step 3: Update SelectContent**

In `src/components/ui/select.tsx`, modify `SelectContent`.

```tsx
className={cn(
  "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl solid-overlay-dark shadow-md data-[state=open]:animate-in ...",
  className
)}
```

- [x] **Step 4: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/popover.tsx src/components/ui/select.tsx
git commit -m "feat: apply solid dark theme to overlay components"
```
