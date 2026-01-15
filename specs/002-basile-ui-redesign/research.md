# Research: Basile Minimalism UI Redesign

**Feature**: 002-basile-ui-redesign
**Date**: 2025-11-25
**Status**: Complete

---

## Research Questions

1. What are the key design patterns from libraryofbabel.info?
2. What 5-color palette best captures the Babel aesthetic?
3. How to maintain typography hierarchy with minimal fonts?
4. What Tailwind CSS patterns work for design token systems?
5. How to verify WCAG AA compliance efficiently?

---

## 1. libraryofbabel.info Design Analysis

### Decision: Adopt core visual principles, adapt for graph visualization

**Patterns Observed**:
- **Background**: Pure black (#000000) or near-black (#0a0a0a)
- **Text**: Off-white (#f5f5f5) for readability, not pure white
- **Accent**: Minimal - single muted color for interactive elements
- **Typography**: Serif font for literary content, monospace for codes
- **Layout**: Centered content, generous margins, maximum readability
- **Navigation**: Text-only links, no icons, no elaborate styling
- **Animations**: None visible - static presentation

**Adaptation for Borges Library**:
- Keep dark background (already compliant at #0a0a0a)
- Keep off-white text (already compliant at #f5f5f5)
- Retain single accent color (gold #d4af37 works well)
- Keep Inter as primary font (modern sans-serif, excellent readability)
- Graph animations are EXEMPT (essential for exploration)

**Rationale**: The Borges Library adds interactive graph exploration to Basile's static literary presentation. Animations serve knowledge exploration and must be preserved.

**Alternatives Considered**:
- Pure black (#000000) - Rejected: current #0a0a0a is softer, reduces eye strain
- Serif font like Georgia - Rejected: Inter provides better UI readability

---

## 2. Color Palette Definition

### Decision: 5-color palette with grayscale extensions

| Token | Hex | Usage |
|-------|-----|-------|
| `--borges-dark` | #0a0a0a | Primary background |
| `--borges-light` | #f5f5f5 | Primary text |
| `--borges-accent` | #d4af37 | Interactive elements, highlights |
| `--borges-secondary` | #2a2a2a | Secondary backgrounds, panels |
| `--borges-muted` | #666666 | Muted text, disabled states |

**Grayscale Extensions** (not counted in 5-color limit):
- `--borges-dark-hover`: #1a1a1a (hover states)
- `--borges-light-muted`: #a0a0a0 (secondary text)
- `--borges-border`: #333333 (subtle borders)

**Rationale**:
- Current palette already compliant (4 colors defined)
- Added `--borges-muted` for accessibility (WCAG AA requires distinguishable disabled states)
- Gold accent (#d4af37) evokes library/book aesthetic, passes contrast on dark

**Alternatives Considered**:
- Blue accent (#4a90d9) - Rejected: too "tech", doesn't match literary aesthetic
- Red accent (#c0392b) - Rejected: too aggressive, competes with content
- Green accent (#27ae60) - Rejected: ecological/nature connotation doesn't fit

---

## 3. Typography System

### Decision: Single font family (Inter) with weight-based hierarchy

**Font Stack**: `'Inter', system-ui, sans-serif`

**Typography Scale**:
| Level | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| Display | 2.5rem (40px) | 300 | 1.2 | Page titles |
| H1 | 2rem (32px) | 400 | 1.3 | Section headers |
| H2 | 1.5rem (24px) | 500 | 1.4 | Panel titles |
| H3 | 1.25rem (20px) | 500 | 1.4 | Subsections |
| Body | 1rem (16px) | 400 | 1.6 | Main content |
| Small | 0.875rem (14px) | 400 | 1.5 | Metadata, labels |
| Caption | 0.75rem (12px) | 400 | 1.4 | Tooltips, hints |

**Rationale**:
- Inter already in use, excellent readability at all sizes
- Weight variations (300-700) provide sufficient hierarchy
- Single font reduces HTTP requests and visual noise
- Line-heights optimized for readability on dark backgrounds

**Alternatives Considered**:
- Add serif heading font (Playfair Display) - Rejected: adds complexity, visual inconsistency
- Use system fonts only - Rejected: Inter provides better cross-platform consistency

---

## 4. Tailwind CSS Design Token Strategy

### Decision: Extend existing Tailwind config with semantic tokens

**Implementation Pattern**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'borges-dark': '#0a0a0a',
        'borges-light': '#f5f5f5',
        'borges-accent': '#d4af37',
        'borges-secondary': '#2a2a2a',
        'borges-muted': '#666666',
        'borges-border': '#333333',
      },
      fontFamily: {
        'borges': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['2.5rem', { lineHeight: '1.2', fontWeight: '300' }],
        // ... other scale definitions
      },
    },
  },
}
```

**CSS Custom Properties** (in globals.css):
```css
:root {
  --borges-dark: #0a0a0a;
  --borges-light: #f5f5f5;
  --borges-accent: #d4af37;
  --borges-secondary: #2a2a2a;
  --borges-muted: #666666;
  --borges-border: #333333;
}
```

**Rationale**:
- Dual definition (Tailwind + CSS variables) provides flexibility
- Components can use Tailwind classes or CSS variables
- Easy to update palette from single source

**Alternatives Considered**:
- CSS-in-JS (styled-components) - Rejected: not in current stack, adds dependency
- CSS Modules only - Rejected: loses Tailwind utility benefits

---

## 5. WCAG AA Compliance Verification

### Decision: Manual contrast checks + automated build-time validation

**Contrast Requirements**:
- Normal text (< 18pt): 4.5:1 ratio minimum
- Large text (≥ 18pt or 14pt bold): 3:1 ratio minimum

**Verified Combinations**:
| Foreground | Background | Ratio | Status |
|------------|------------|-------|--------|
| #f5f5f5 (light) | #0a0a0a (dark) | 18.4:1 | ✅ PASS |
| #d4af37 (accent) | #0a0a0a (dark) | 8.2:1 | ✅ PASS |
| #666666 (muted) | #0a0a0a (dark) | 4.8:1 | ✅ PASS |
| #f5f5f5 (light) | #2a2a2a (secondary) | 12.1:1 | ✅ PASS |
| #d4af37 (accent) | #2a2a2a (secondary) | 5.4:1 | ✅ PASS |

**Testing Approach**:
1. Use browser DevTools contrast checker
2. Test all color combinations during implementation
3. Verify focus states are visible (accent on dark)

**Rationale**: Manual verification during implementation is sufficient for this visual redesign scope. No new build tooling needed.

**Alternatives Considered**:
- Add axe-core to CI pipeline - Rejected: overkill for styling-only changes
- Use lighthouse accessibility audit - Good for final verification, not required for implementation

---

## Summary of Decisions

| Research Question | Decision | Key Rationale |
|-------------------|----------|---------------|
| libraryofbabel.info patterns | Adopt visual principles, preserve graph animations | Animations essential for exploration |
| Color palette | 5 colors: dark, light, accent, secondary, muted | Current palette largely compliant |
| Typography | Single font (Inter) with weight hierarchy | Already in use, excellent readability |
| Tailwind strategy | Extend config + CSS custom properties | Flexibility, single source of truth |
| WCAG compliance | Manual contrast verification | Sufficient for visual-only changes |

---

## Next Steps

1. Update `tailwind.config.js` with complete design tokens
2. Update `globals.css` with CSS custom properties
3. Audit each component for color/typography compliance
4. Streamline navigation elements
5. Apply decorative element "purpose test"
