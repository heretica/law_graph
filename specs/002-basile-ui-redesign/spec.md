# Feature Specification: Basile Minimalism UI Redesign

**Feature Branch**: `002-basile-ui-redesign`
**Created**: 2025-11-25
**Status**: Draft
**Constitution Reference**: Principle VII - Basile Minimalism
**Input**: User description: "Specify the specs with the new governing principle for user interface design - tribute to Jonathan Basile's libraryofbabel.info"

---

## CRITICAL SCOPE CONSTRAINT

**This redesign affects VISUAL STYLING ONLY:**
- Fonts and typography
- Colors and palette
- Button/panel/menu appearances
- UI chrome styling

**This redesign DOES NOT affect:**
- Any functionality (must remain 100% identical)
- Graph animations (physics, zoom, pan, expansion)
- User interactions and workflows
- API calls or data handling
- Feature capabilities

**Principle**: Same functionality, refined visual presentation.

## User Scenarios & Testing *(mandatory)*

<!--
  This specification implements Constitution Principle VII - Basile Minimalism,
  paying tribute to Jonathan Basile's iconic libraryofbabel.info design.

  Core design tenets:
  - Functional minimalism: every UI element must serve a purpose
  - Content-centric layout: text and knowledge as primary visual content
  - Restrained visual hierarchy: limited color palette, typography-focused
  - Hexagonal/geometric symbolism echoing Borges' architectural vision
-->

### User Story 1 - Content-First Knowledge Exploration (Priority: P1)

As a literary researcher, I want the interface to prioritize textual content and knowledge relationships over decorative elements, so I can focus on exploring the Borges Library without visual distractions.

**Why this priority**: The core purpose of the Borges Library is knowledge exploration. A content-centric design ensures users engage with literary content rather than interface chrome. This is the foundational design change that enables all other visual improvements.

**Independent Test**: Can be fully tested by navigating the graph interface and verifying that text (entity names, descriptions, relationship labels) is the dominant visual element, and all decorative elements justify their existence.

**Acceptance Scenarios**:

1. **Given** I am on the main exploration page, **When** I view the interface, **Then** textual content (entity names, descriptions, chunk previews) occupies at least 70% of the visual hierarchy
2. **Given** any UI element exists on the page, **When** I evaluate its purpose, **Then** it either (a) displays content, (b) enables navigation, or (c) provides essential feedback
3. **Given** the graph visualization is displayed, **When** nodes render, **Then** entity names are clearly legible as the primary visual anchor with minimal decorative styling

---

### User Story 2 - Streamlined Navigation Architecture (Priority: P1)

As a user exploring the knowledge graph, I want navigation to be reduced to essential actions (Browse, Search, Random, contextual actions), so I can focus on content discovery without cognitive overload.

**Why this priority**: Simplified navigation directly implements the "functional minimalism" principle. Every removed navigation element reduces cognitive load and reinforces the content-first approach.

**Independent Test**: Can be tested by enumerating all navigation elements and verifying each serves one of the core actions: Browse, Search, Random, or essential contextual actions.

**Acceptance Scenarios**:

1. **Given** I am on any page, **When** I look for navigation options, **Then** I see only: Browse (graph exploration), Search (entity/text query), Random (serendipitous discovery), and contextual actions relevant to current view
2. **Given** a navigation element exists, **When** I interact with it, **Then** it performs exactly one clear action (no nested menus beyond one level)
3. **Given** I am exploring the graph, **When** I want to perform an action on a node, **Then** contextual actions appear only on interaction (hover/click), not cluttering the default view

---

### User Story 3 - Dark Theme with Restrained Palette (Priority: P2)

As a reader spending extended time in the library, I want a dark background with light text using a limited color palette (4-5 colors maximum), so the interface evokes Borges' infinite galleries while reducing eye strain.

**Why this priority**: The dark theme is a signature element of libraryofbabel.info and reinforces the infinite library metaphor. However, it's secondary to structural changes in P1 stories as it's primarily aesthetic.

**Independent Test**: Can be tested by auditing all CSS color definitions and verifying compliance with the 4-5 color palette constraint.

**Acceptance Scenarios**:

1. **Given** I am viewing any page, **When** I examine the color scheme, **Then** the background is dark (#0a0a0a to #1a1a1a range) with light text (#e0e0e0 to #ffffff)
2. **Given** the entire application, **When** I audit all colors used, **Then** there are no more than 5 distinct color values (excluding grayscale variations)
3. **Given** colored elements exist (links, highlights, accents), **When** they appear, **Then** they use muted, non-competing tones that don't distract from content

---

### User Story 4 - Visual Styling Only (Priority: P2)

As a user interacting with the interface, I want the visual styling (fonts, colors, buttons, UI chrome) to follow minimalist principles while preserving all existing graph animations and interactions, so I get a refined aesthetic without losing the dynamic exploration experience.

**Why this priority**: The graph visualization animations are ESSENTIAL for knowledge exploration and must be preserved. This story clarifies that Basile Minimalism applies to static visual elements only.

**Independent Test**: Can be tested by verifying all graph animations (node physics, zoom, pan, expansion) work identically before and after redesign, while visual styling (colors, fonts, buttons) match the minimalist palette.

**Acceptance Scenarios**:

1. **Given** the graph visualization is displayed, **When** I interact with nodes, **Then** all existing animations (physics simulation, node expansion, zoom, pan) work exactly as before
2. **Given** UI chrome elements (buttons, panels, menus), **When** I examine their styling, **Then** they follow the minimalist color palette and typography rules
3. **Given** loading states outside the graph, **When** progress needs indication, **Then** a subtle, non-distracting spinner appears (but graph animations remain fully dynamic)

---

### User Story 5 - Hexagonal/Geometric Visual Symbolism (Priority: P3)

As a user appreciating the Library of Babel theme, I want geometric accents (especially hexagons) used sparingly to reinforce the architectural metaphor, so the design pays homage to Borges' vision without overwhelming the content.

**Why this priority**: Thematic visual elements enhance the experience but are less critical than functional design changes. They should be implemented only after core minimalism is achieved.

**Independent Test**: Can be tested by verifying hexagonal/geometric elements appear only in designated accent areas (logo, section dividers, empty states) and don't compete with content.

**Acceptance Scenarios**:

1. **Given** geometric symbols are used, **When** I examine their placement, **Then** they appear only in: logo/branding, section dividers, empty state illustrations, or background patterns
2. **Given** a hexagonal element appears, **When** I evaluate its visual weight, **Then** it is subtle (low contrast, small size, or opacity) and doesn't compete with text content
3. **Given** the content area of any page, **When** I examine it, **Then** geometric symbols do not appear within content regions

---

### Edge Cases

- **What happens when content is empty (no search results, no entities)?** Display minimal "No results" message with optional subtle hexagonal illustration
- **How does system handle very long entity names?** Truncate with ellipsis, full name on hover tooltip
- **What if user prefers light mode?** System respects `prefers-color-scheme` but defaults to dark; light mode uses same palette constraints
- **How to handle accessibility for dark theme?** All text must pass WCAG AA contrast ratios (4.5:1 minimum)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Interface MUST use a maximum of 2 font families (one for body text, one for headings/accents)
- **FR-002**: Color palette MUST be limited to 5 primary colors maximum (excluding grayscale)
- **FR-003**: Navigation MUST be streamlined to: Browse, Search, Random, and contextual actions only
- **FR-004**: All decorative elements MUST pass a "purpose test" - if an element cannot justify its existence functionally, it must be removed
- **FR-005**: White space MUST be used deliberately to separate content areas and reduce cognitive load
- **FR-006**: Loading states (outside graph) MUST use minimal, non-distracting indicators (subtle spinners)
- **FR-007**: Error states MUST be informative but visually understated
- **FR-008**: Graph visualization animations MUST be fully preserved - all physics simulations, node expansions, zoom, pan, and interactive motions remain unchanged
- **FR-009**: Minimalism applies to VISUAL STYLING ONLY (fonts, colors, buttons, panels) - NOT to graph animations which are essential for exploration
- **FR-010**: Hexagonal/geometric accents MUST appear only in non-content areas (branding, dividers, empty states)
- **FR-011**: Typography MUST be the dominant visual element, with font choices and spacing communicating hierarchy through restraint
- **FR-012**: Background MUST be dark (#0a0a0a to #1a1a1a) with light text (#e0e0e0 to #ffffff) to evoke infinite galleries
- **FR-013**: Accessibility option MUST be provided for users who need alternatives (e.g., "Browse without JavaScript" for reduced-motion needs)

### Key Entities

- **Color Token**: A defined color value in the design system (name, hex value, usage context)
- **Typography Scale**: Font family, size, weight, and line-height definitions for each text level
- **Navigation Item**: A clickable element providing access to a core function (label, icon, route, visibility condition)
- **Animation Definition**: A motion effect with purpose classification (loading/transition/feedback), duration, easing

### Responsive Design *(Constitution Principle VIII)*

<!--
  Per Constitution Principle VIII - Mobile-First Responsiveness:
  The interface MUST be fully functional and usable on mobile devices.
  The Basile Minimalism principle MUST be applied across ALL device sizes.
-->

**Breakpoints**:
- Mobile (< 768px): Single-column layout; navigation collapses to hamburger menu; panels stack vertically
- Tablet (768-1024px): Two-column layout where appropriate; expanded navigation
- Desktop (> 1024px): Full multi-panel layout with side-by-side views

**Touch Interactions**:
- Tap to select nodes and navigate (replaces click)
- Pinch to zoom the knowledge graph
- Swipe to navigate between panels/views
- Double-tap to focus on entity clusters
- Touch targets MUST be at least 44x44 pixels

**Mobile-Specific Considerations**:
- [ ] Navigation collapses to hamburger menu or bottom navigation bar
- [ ] Modals and detail panels are scrollable and dismissible with swipe gestures
- [ ] Font sizes use relative units (rem/em) with minimum 16px body text
- [ ] Color palette and minimalist aesthetic apply equally on mobile
- [ ] Hexagonal accents scale appropriately without overflow
- [ ] Performance target: < 3s First Contentful Paint on 3G

**Graph Visualization (Critical)**:
- Touch gestures: tap (select), pinch (zoom), drag (pan), double-tap (focus)
- Graph physics simulation adapts for limited GPU devices
- Minimalist node styling preserved on all screen sizes
- Typography legibility maintained through responsive scaling

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Total distinct colors (excluding grayscale) used across the application is 5 or fewer
- **SC-002**: Total font families used is 2 or fewer
- **SC-003**: Navigation items in primary navigation is 4 or fewer (Browse, Search, Random, + 1 optional)
- **SC-004**: 100% of decorative elements can cite their functional justification in design documentation
- **SC-005**: Graph visualization animations (physics, expansion, zoom, pan) work identically before and after redesign
- **SC-006**: ALL functionality works identically before and after redesign (zero regression)
- **SC-007**: All text passes WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- **SC-008**: Page load time does not increase compared to current implementation
- **SC-009**: User can identify content hierarchy within 2 seconds of page load
- **SC-010**: "Browse without JavaScript" alternative provides core content access

## Assumptions

- Current Next.js/React architecture supports CSS-in-JS or CSS modules for theming
- Graph visualization library (3d-force-graph) can be styled to match the minimalist aesthetic
- No major navigation restructuring is required beyond visual simplification

## Out of Scope

- **ANY functionality changes** - all features must work identically before and after
- **Graph animations** - physics, zoom, pan, node expansion must be unchanged
- **User workflows** - interaction patterns must remain the same
- Complete graph visualization library replacement
- Backend API changes
- New features or functionality (this is purely a visual restyling)
- User preference persistence for theme settings

> **Note**: Mobile-first responsive layouts are now IN SCOPE per Constitution Principle VIII - Mobile-First Responsiveness. The minimalist aesthetic MUST apply across all device sizes.

## Constitution Compliance

This specification implements **Constitution Principle VII - Basile Minimalism** and **Principle VIII - Mobile-First Responsiveness**. Every requirement traces back to these principles:

| Tenet | Requirements |
|-------|-------------|
| Functional minimalism | FR-003, FR-004, FR-006, FR-007 |
| Content-centric layout | FR-005, FR-011 |
| Typography as anchor | FR-001, FR-011 |
| Restrained color palette | FR-002, FR-012 |
| Hexagonal symbolism | FR-010 |
| Graph animations preserved | FR-008, FR-009 |
| Accessibility | FR-013 |
| Mobile-first responsiveness | Responsive Design section, touch interactions, breakpoints |

**CRITICAL CONSTRAINTS**:
1. Graph visualization animations are EXEMPT from minimalism rules. The Basile Minimalism principle applies exclusively to static visual elements (fonts, colors, buttons, panels). All graph physics, node expansion, zoom, pan, and interactive animations must remain fully functional.
2. Per Principle VIII, the minimalist aesthetic MUST work seamlessly on mobile devices with touch-optimized interactions and responsive breakpoints.
