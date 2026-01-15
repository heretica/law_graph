# Quickstart: Basile Minimalism UI Redesign

**Feature**: 002-basile-ui-redesign
**Date**: 2025-11-25

---

## Prerequisites

- Node.js 18+ installed
- Access to `3_borges-interface/` directory
- Understanding of Tailwind CSS

## CRITICAL REMINDER

**This is a VISUAL-ONLY redesign:**
- ✅ Change: fonts, colors, buttons, panels, UI chrome
- ❌ Do NOT change: functionality, graph animations, user workflows

---

## Step 1: Update Tailwind Config

Edit `3_borges-interface/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'borges-dark': '#0a0a0a',
        'borges-light': '#f5f5f5',
        'borges-accent': '#d4af37',
        'borges-secondary': '#2a2a2a',
        'borges-muted': '#666666',
        'borges-dark-hover': '#1a1a1a',
        'borges-light-muted': '#a0a0a0',
        'borges-border': '#333333',
      },
      fontFamily: {
        'borges': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['2.5rem', { lineHeight: '1.2', fontWeight: '300' }],
        'h1': ['2rem', { lineHeight: '1.3', fontWeight: '400' }],
        'h2': ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        'borges-sm': '4px',
        'borges-md': '8px',
        'borges-lg': '12px',
      },
      boxShadow: {
        'borges-sm': '0 1px 2px rgba(0,0,0,0.3)',
        'borges-md': '0 4px 6px rgba(0,0,0,0.4)',
        'borges-lg': '0 10px 15px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
```

---

## Step 2: Update Global CSS

Edit `3_borges-interface/src/app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --borges-dark: #0a0a0a;
  --borges-light: #f5f5f5;
  --borges-accent: #d4af37;
  --borges-secondary: #2a2a2a;
  --borges-muted: #666666;
  --borges-dark-hover: #1a1a1a;
  --borges-light-muted: #a0a0a0;
  --borges-border: #333333;
  --borges-focus: rgba(212, 175, 55, 0.4);
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: 'Inter', system-ui, sans-serif;
}

body {
  color: var(--borges-light);
  background: var(--borges-dark);
}

/* Focus states */
*:focus-visible {
  outline: 2px solid var(--borges-accent);
  outline-offset: 2px;
}

/* Scrollbar styling (optional) */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--borges-dark);
}

::-webkit-scrollbar-thumb {
  background: var(--borges-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--borges-muted);
}
```

---

## Step 3: Component Update Checklist

Work through each component in priority order:

### P1 - Critical (Core UX)

| Component | File | Changes Required |
|-----------|------|------------------|
| [ ] BorgesLibrary | `BorgesLibrary.tsx` | Layout, navigation streamlining |
| [ ] QueryInterface | `QueryInterface.tsx` | Search input styling |
| [ ] BookSelector | `BookSelector.tsx` | Dropdown styling |

### P2 - Important (Panels/Modals)

| Component | File | Changes Required |
|-----------|------|------------------|
| [ ] EntityDetailModal | `EntityDetailModal.tsx` | Panel styling |
| [ ] TextChunkModal | `TextChunkModal.tsx` | Modal styling |
| [ ] ProvenancePanel | `ProvenancePanel.tsx` | Panel styling |
| [ ] GraphVisualization3DForce | `GraphVisualization3DForce.tsx` | Node/edge COLORS ONLY |
| [ ] LoadingWheel3D | `LoadingWheel3D.tsx` | Spinner styling |

### P3 - Polish (Consistency)

| Component | File | Changes Required |
|-----------|------|------------------|
| [ ] QueryDebugPanel | `QueryDebugPanel.tsx` | Panel styling |
| [ ] QueryAnimationControls | `QueryAnimationControls.tsx` | Button styling |
| [ ] DebugVisualization | `DebugVisualization.tsx` | Panel styling |
| [ ] HighlightedText | `HighlightedText.tsx` | Text styling |
| [ ] RelationshipTooltip | `RelationshipTooltip.tsx` | Tooltip styling |

---

## Step 4: Styling Patterns

### Button Pattern

```tsx
// Primary button
<button className="px-4 py-2 border border-borges-accent text-borges-accent
  hover:bg-borges-accent hover:text-borges-dark transition-colors rounded-borges-sm">
  Action
</button>

// Secondary button
<button className="px-4 py-2 bg-borges-secondary border border-borges-border
  text-borges-light hover:border-borges-light-muted transition-colors rounded-borges-sm">
  Secondary
</button>

// Ghost button
<button className="px-4 py-2 text-borges-light-muted hover:text-borges-light transition-colors">
  Ghost
</button>
```

### Input Pattern

```tsx
<input
  type="text"
  className="w-full px-3 py-2 bg-borges-secondary border border-borges-border
    text-borges-light placeholder-borges-muted rounded-borges-sm
    focus:border-borges-accent focus:ring-1 focus:ring-borges-accent/40"
  placeholder="Search..."
/>
```

### Panel Pattern

```tsx
<div className="bg-borges-secondary border border-borges-border rounded-borges-md p-4 shadow-borges-md">
  <h2 className="text-h2 text-borges-light mb-4">Panel Title</h2>
  <p className="text-borges-light-muted">Content...</p>
</div>
```

### Modal Pattern

```tsx
{/* Overlay */}
<div className="fixed inset-0 bg-black/80 z-50">
  {/* Modal */}
  <div className="bg-borges-secondary border border-borges-border
    rounded-borges-lg shadow-borges-lg p-6 max-w-lg mx-auto mt-20">
    <h2 className="text-h2 text-borges-light mb-4">Modal Title</h2>
    {/* Content */}
  </div>
</div>
```

---

## Step 5: Testing Verification

### Visual Tests

1. [ ] All backgrounds are dark (#0a0a0a or #2a2a2a)
2. [ ] All text is light (#f5f5f5 or #a0a0a0)
3. [ ] Accent color (#d4af37) used only for interactive elements
4. [ ] No more than 5 distinct colors visible

### Functionality Tests

1. [ ] Graph navigation works (zoom, pan, click)
2. [ ] Node expansion works
3. [ ] Search returns results
4. [ ] Book selection works
5. [ ] Modals open/close correctly
6. [ ] All existing features work identically

### Accessibility Tests

1. [ ] Text contrast passes WCAG AA (use DevTools)
2. [ ] Focus states visible on all interactive elements
3. [ ] Keyboard navigation works

---

## Step 6: Run Development Server

```bash
cd 3_borges-interface
npm run dev
```

Open http://localhost:3000 and verify changes.

---

## Rollback

If issues occur:
1. `git checkout -- .` to revert all changes
2. Or restore specific files from git history

---

## Success Criteria Checklist

- [ ] SC-001: ≤5 distinct colors used
- [ ] SC-002: ≤2 font families (Inter only)
- [ ] SC-003: ≤4 navigation items
- [ ] SC-004: All decorative elements justified
- [ ] SC-005: Graph animations unchanged
- [ ] SC-006: Zero functionality regression
- [ ] SC-007: WCAG AA contrast compliance
- [ ] SC-008: No performance regression
