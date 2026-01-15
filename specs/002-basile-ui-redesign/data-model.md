# Data Model: Basile Minimalism Design System

**Feature**: 002-basile-ui-redesign
**Date**: 2025-11-25
**Status**: Complete

---

## Design Token Definitions

### Color Tokens

| Token Name | CSS Variable | Hex Value | Usage | Contrast on Dark |
|------------|--------------|-----------|-------|------------------|
| `dark` | `--borges-dark` | #0a0a0a | Primary background | N/A |
| `light` | `--borges-light` | #f5f5f5 | Primary text | 18.4:1 ✅ |
| `accent` | `--borges-accent` | #d4af37 | Interactive, highlights | 8.2:1 ✅ |
| `secondary` | `--borges-secondary` | #2a2a2a | Panels, cards | N/A |
| `muted` | `--borges-muted` | #666666 | Disabled, metadata | 4.8:1 ✅ |

**Extended Tokens** (grayscale, not counted in 5-color limit):

| Token Name | CSS Variable | Hex Value | Usage |
|------------|--------------|-----------|-------|
| `dark-hover` | `--borges-dark-hover` | #1a1a1a | Hover backgrounds |
| `light-muted` | `--borges-light-muted` | #a0a0a0 | Secondary text |
| `border` | `--borges-border` | #333333 | Subtle borders |
| `focus` | `--borges-focus` | #d4af3766 | Focus rings (accent 40% opacity) |

---

### Typography Scale

| Token | Size | Weight | Line-height | Letter-spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `display` | 40px (2.5rem) | 300 | 1.2 | -0.02em | Page titles |
| `h1` | 32px (2rem) | 400 | 1.3 | -0.01em | Section headers |
| `h2` | 24px (1.5rem) | 500 | 1.4 | 0 | Panel titles |
| `h3` | 20px (1.25rem) | 500 | 1.4 | 0 | Subsections |
| `body` | 16px (1rem) | 400 | 1.6 | 0 | Main content |
| `body-sm` | 14px (0.875rem) | 400 | 1.5 | 0 | Metadata, labels |
| `caption` | 12px (0.75rem) | 400 | 1.4 | 0.02em | Tooltips, hints |

**Font Stack**: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

---

### Spacing Scale

Based on 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px (0.25rem) | Tight gaps |
| `space-2` | 8px (0.5rem) | Icon margins |
| `space-3` | 12px (0.75rem) | Input padding |
| `space-4` | 16px (1rem) | Card padding |
| `space-6` | 24px (1.5rem) | Section gaps |
| `space-8` | 32px (2rem) | Panel margins |
| `space-12` | 48px (3rem) | Page sections |
| `space-16` | 64px (4rem) | Major divisions |

---

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Buttons, inputs |
| `radius-md` | 8px | Cards, panels |
| `radius-lg` | 12px | Modals |
| `radius-full` | 9999px | Pills, badges |

---

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle elevation |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.4)` | Cards, dropdowns |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.5)` | Modals |

---

### Transition Timing

| Token | Value | Usage |
|-------|-------|-------|
| `transition-fast` | 150ms ease | Hover states |
| `transition-normal` | 250ms ease | Panel transitions |
| `transition-slow` | 400ms ease | Modal open/close |

**Note**: Graph visualization animations are EXEMPT from these tokens.

---

## Component Patterns

### Button Variants

```
Primary Button:
- Background: transparent
- Border: 1px solid var(--borges-accent)
- Text: var(--borges-accent)
- Hover: background var(--borges-accent), text var(--borges-dark)

Secondary Button:
- Background: var(--borges-secondary)
- Border: 1px solid var(--borges-border)
- Text: var(--borges-light)
- Hover: border-color var(--borges-light-muted)

Ghost Button:
- Background: transparent
- Border: none
- Text: var(--borges-light-muted)
- Hover: text var(--borges-light)
```

### Input Fields

```
Text Input:
- Background: var(--borges-secondary)
- Border: 1px solid var(--borges-border)
- Text: var(--borges-light)
- Placeholder: var(--borges-muted)
- Focus: border-color var(--borges-accent), box-shadow var(--borges-focus)
```

### Panel/Card

```
Panel:
- Background: var(--borges-secondary)
- Border: 1px solid var(--borges-border)
- Border-radius: var(--radius-md)
- Padding: var(--space-4)
```

### Modal

```
Modal Overlay:
- Background: rgba(0,0,0,0.8)

Modal Content:
- Background: var(--borges-secondary)
- Border: 1px solid var(--borges-border)
- Border-radius: var(--radius-lg)
- Shadow: var(--shadow-lg)
```

---

## Navigation Constraints

**Allowed Navigation Elements** (per Constitution Principle VII):

1. **Browse** - Graph exploration entry point
2. **Search** - Entity/text query
3. **Random** - Serendipitous discovery
4. **Contextual actions** - Only appear on interaction (hover/click)

**Prohibited**:
- Nested menus beyond one level
- Permanent visible icons without purpose
- Multiple competing navigation bars

---

## Graph Visualization Styling

**CRITICAL**: These are STYLING ONLY tokens. All animations/physics remain unchanged.

### Node Styling

| Node Type | Fill Color | Border | Size Factor |
|-----------|------------|--------|-------------|
| Book | var(--borges-accent) | none | 1.2x |
| Entity | var(--borges-light-muted) | none | 1.0x |
| Highlighted | var(--borges-accent) | 2px var(--borges-light) | 1.3x |

### Edge Styling

| Edge Type | Color | Width | Opacity |
|-----------|-------|-------|---------|
| Default | var(--borges-border) | 1px | 0.6 |
| Highlighted | var(--borges-accent) | 2px | 1.0 |
| Inter-book | var(--borges-accent) | 1.5px | 0.8 |

---

## Validation Rules

### Color Compliance

- [ ] No more than 5 distinct colors (excluding grayscale)
- [ ] All text passes WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] Focus states visible against dark background

### Typography Compliance

- [ ] Maximum 2 font families (Inter only for this implementation)
- [ ] All text uses defined scale tokens
- [ ] Line heights optimized for readability

### Decoration Compliance

- [ ] Every visual element passes "purpose test"
- [ ] Hexagonal accents only in branding/dividers/empty states
- [ ] No animations except graph visualization and functional feedback
