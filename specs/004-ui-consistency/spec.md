# Feature Specification: Grand Débat UI Consistency with Borges Interface

**Feature Branch**: `004-ui-consistency`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "Make clearer that the interface and UI for the Grand Débat should be similar to the one in nano-graphrag/3_borges-interface"

## Overview

The Grand Débat National interface must follow the established Borges Library design system and UI patterns from the reference implementation. This specification defines the visual and interaction consistency requirements between both interfaces, ensuring users experience a unified look and feel when exploring civic data through the GraphRAG visualization.

**Key Architectural Difference**: Unlike the reference Borges Library which uses Neo4j for large-scale literary corpus analysis, the Grand Débat interface works exclusively with GraphML files. The civic data from 50 communes in Charente-Maritime is small enough to be loaded directly from GraphML without requiring a database backend.

**Reference Interface**: `/Users/arthursarazin/Documents/nano-graphrag/3_borges-interface`
**Target Interface**: `/Users/arthursarazin/Documents/law_graph/3_borges-interface`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - GraphML-Based Data Loading (Priority: P1)

As a user accessing the Grand Débat interface, I want the system to load civic graph data directly from GraphML files, so that I can explore citizen contributions without needing database infrastructure.

**Why this priority**: The data architecture is fundamentally different from the reference. GraphML-based loading must work before any visual consistency matters.

**Independent Test**: Can be fully tested by loading the interface and verifying graph data appears from GraphML files without any Neo4j connection errors.

**Acceptance Scenarios**:

1. **Given** the interface is loaded, **When** the system initializes, **Then** graph data is parsed from GraphML files and entities/relationships are populated
2. **Given** GraphML files contain commune-linked entities, **When** the user queries the system, **Then** results include proper commune attribution derived from the GraphML structure
3. **Given** no Neo4j server is available, **When** the interface loads, **Then** it functions fully without errors or degraded features

---

### User Story 2 - Consistent Visual Identity (Priority: P1)

As a user navigating the Grand Débat interface, I want to see the same dark theme, typography, and color palette as the Borges Library interface, so that I can recognize the interface as part of the same product family and navigate intuitively.

**Why this priority**: Visual consistency is the foundation of user trust and recognition. Without consistent styling, users may feel disoriented or question whether they're using the correct tool.

**Independent Test**: Can be fully tested by visual comparison between both interfaces. The Grand Débat interface should be indistinguishable in styling from the reference Borges Library interface when viewing the same component types.

**Acceptance Scenarios**:

1. **Given** the Grand Débat interface is loaded, **When** the user views the page, **Then** the background uses the dark theme color (`#0a0a0a`), text uses light color (`#f5f5f5`), and accent elements use sky blue (`#7dd3fc`)
2. **Given** both interfaces are open side-by-side, **When** the user compares equivalent components (query input, response panel, graph visualization), **Then** styling is visually identical
3. **Given** the interface displays text content, **When** the user reads headings and body text, **Then** typography uses the Cormorant Garamond font family with appropriate sizing hierarchy

---

### User Story 3 - Unified 3D Graph Visualization (Priority: P1)

As a user exploring civic data through the knowledge graph, I want the 3D graph visualization to behave identically to the Borges Library interface, so that I can use familiar interactions to navigate entities and relationships.

**Why this priority**: The 3D graph is the core interaction paradigm. Consistent behavior ensures users can transfer their skills between interfaces.

**Independent Test**: Can be fully tested by performing standard graph interactions (rotate, zoom, click nodes) and verifying identical visual feedback and behavior.

**Acceptance Scenarios**:

1. **Given** the 3D graph is displayed with GraphML-loaded data, **When** the user clicks and drags, **Then** the graph rotates smoothly using the same physics parameters as the reference
2. **Given** a node is visible in the graph, **When** the user hovers over it, **Then** a tooltip appears with entity details styled identically to the reference
3. **Given** the graph contains relationships, **When** the user views connections between nodes, **Then** relationship lines use consistent coloring and labeling
4. **Given** the user clicks a node, **When** the node is selected, **Then** visual highlighting matches the reference interface (color change, size emphasis)

---

### User Story 4 - Consistent Query Interface (Priority: P2)

As a user asking questions about civic data, I want the query input and response display to look and behave like the Borges Library interface, so that submitting queries feels familiar.

**Why this priority**: The query interface is the primary input mechanism. Consistency reduces learning curve.

**Independent Test**: Can be fully tested by submitting queries and comparing the input field styling, loading animations, and response formatting.

**Acceptance Scenarios**:

1. **Given** the query interface is displayed, **When** the user views the input field, **Then** it uses the same border styling, placeholder text formatting, and focus states as the reference
2. **Given** a query is submitted, **When** processing begins, **Then** the loading animation (hexagonal library assembly) displays identically
3. **Given** a response is received, **When** the answer is displayed, **Then** highlighted entities use consistent color-coding and the text formatting matches the reference

---

### User Story 5 - Provenance Panel with Civic Context (Priority: P2)

As a user investigating the source of AI-generated answers, I want the provenance panel to display entities, relationships, and source chunks with commune attribution, so that I can trace civic contributions back to their origins.

**Why this priority**: End-to-end interpretability (Constitution Principle #5) requires consistent provenance display with civic-specific context.

**Independent Test**: Can be fully tested by triggering provenance display after a query and comparing layout, tabs, and interaction patterns.

**Acceptance Scenarios**:

1. **Given** a query has been answered, **When** the user views the provenance panel, **Then** it displays three tabs (entities, relationships, chunks) styled identically to the reference
2. **Given** the entities tab is active, **When** entities are listed, **Then** they show relevance scores, commune attribution, and click to highlight in the graph
3. **Given** the chunks tab is active, **When** source text chunks are displayed, **Then** they show commune of origin rather than book provenance

---

### User Story 6 - Mobile Responsive Consistency (Priority: P3)

As a mobile user accessing the Grand Débat interface, I want the responsive behavior to match the Borges Library mobile experience, so that I can explore civic data on any device.

**Why this priority**: Mobile access expands audience reach. Consistent mobile experience prevents confusion.

**Independent Test**: Can be fully tested by resizing browser or using mobile device emulation to verify breakpoint behaviors match the reference.

**Acceptance Scenarios**:

1. **Given** the interface is viewed on a mobile device (width < 768px), **When** the layout adjusts, **Then** components stack vertically and navigation collapses to hamburger menu matching the reference
2. **Given** the user interacts with the graph on touch devices, **When** using pinch/drag gestures, **Then** zoom and pan behavior is consistent with the reference
3. **Given** modal dialogs appear on mobile, **When** the user views entity details, **Then** modals are full-screen and scrollable with dismissible close buttons

---

### Edge Cases

- What happens when GraphML file is missing or corrupted? System displays informative error with suggested remediation (file path, expected format).
- What happens when custom styling is applied that conflicts with the Borges theme? System ignores custom styles and maintains theme consistency.
- How does system handle the absence of the Cormorant Garamond font? Falls back to Georgia, then serif fonts as defined in the theme.
- What happens when 3D graph rendering fails on low-capability devices? Gracefully degrades to 2D visualization or displays informative error message.
- How does system handle entities without commune attribution in GraphML? Displays "Source commune unavailable" placeholder while maintaining panel structure.
- What happens when GraphML contains more data than expected? System limits displayed nodes to prevent performance degradation while allowing user to filter.

## Requirements *(mandatory)*

### Functional Requirements

**Data Architecture (GraphML-Based)**:
- **FR-001**: System MUST load graph data exclusively from GraphML files, not from Neo4j or other database backends
- **FR-002**: System MUST parse GraphML structure to extract nodes, relationships, and commune attributes
- **FR-003**: System MUST function fully offline once GraphML files are loaded (no server round-trips for graph queries)

**Visual Design System**:
- **FR-004**: System MUST use the Borges design system color palette (borges-dark: `#0a0a0a`, borges-light: `#f5f5f5`, borges-accent: `#7dd3fc`, borges-secondary: `#2a2a2a`, borges-muted: `#666666`, borges-light-muted: `#a0a0a0`, borges-border: `#333333`)
- **FR-005**: System MUST use Cormorant Garamond as the primary font family with Georgia and serif as fallbacks
- **FR-006**: System MUST implement the same responsive breakpoints as the reference (xs: 375px, sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
- **FR-007**: System MUST display the hexagonal library assembly animation during loading states
- **FR-008**: System MUST display the Borges quote during loading: "L'univers (que d'autres appellent la Bibliothèque) se compose d'un nombre indéfini, et peut-être infini, de galeries hexagonales..."

**Graph Visualization**:
- **FR-009**: System MUST render 3D graph visualization using force-directed layout with identical physics parameters to the reference
- **FR-010**: System MUST implement the same node highlighting behavior when entities are selected
- **FR-011**: System MUST use the same tooltip component styling for relationship and node tooltips

**Provenance & Interpretability**:
- **FR-012**: System MUST provide entity detail modals that show provenance information with commune attribution (replacing book attribution)
- **FR-013**: System MUST display query responses with highlighted entities using consistent color-coding
- **FR-014**: System MUST implement the provenance panel with three tabs (entities, relationships, chunks)

**Interaction & Accessibility**:
- **FR-015**: System MUST maintain minimum 44x44 pixel touch targets for interactive elements

### Key Entities

- **GraphML Document**: Structured file containing nodes and edges with attributes, the primary data source for the interface
- **Design Token**: Named value (color, spacing, typography) that defines the visual language, must match between interfaces
- **Component Pattern**: Reusable UI structure (query input, response panel, modal) that must behave identically
- **Interaction State**: Visual feedback for user actions (hover, focus, active, disabled) that must be consistent
- **Civic Provenance Element**: Entity, relationship, or chunk display with commune attribution that traces answer back to citizen source

### Responsive Design

**Breakpoints**:
- Mobile (< 768px): Single-column layout, stacked panels, hamburger navigation, expanded search on tap
- Tablet (768-1024px): Two-column layout with collapsible side panels
- Desktop (> 1024px): Full three-panel layout with graph, query interface, and provenance panel visible simultaneously

**Touch Interactions**:
- Tap: Select node, open modal, activate button
- Pinch: Zoom in/out on 3D graph
- Drag: Pan/rotate 3D graph, scroll panels
- Double-tap: Focus and zoom to selected node
- Touch targets MUST be at least 44x44 pixels

**Mobile-Specific Considerations**:
- Navigation adapts to hamburger menu on mobile
- Modals are full-screen and dismissible with swipe or close button
- Font sizes use rem units with minimum 16px body text (1rem = 16px)
- SVG animations scale without overflow
- Performance target: < 3s First Contentful Paint on 3G

**Graph Visualization**:
- Touch gestures: tap (select), pinch (zoom), drag (pan/rotate), double-tap (focus)
- Graceful degradation for devices with limited GPU capabilities
- Fallback to reduced particle count or 2D view on low-memory devices

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Interface loads and displays graph from GraphML files within 2 seconds (no database connection required)
- **SC-002**: Users can identify both interfaces as part of the same product family within 5 seconds of viewing
- **SC-003**: 95% of UI components pass visual regression testing against the reference interface
- **SC-004**: All interactive elements meet the 44x44 pixel touch target requirement
- **SC-005**: Users can complete a query-to-provenance navigation flow in the same number of clicks/taps as the reference interface
- **SC-006**: Mobile users can access all features without horizontal scrolling on devices 375px wide and larger
- **SC-007**: Graph interactions (rotate, zoom, select) respond within 100ms of user input
- **SC-008**: Loading states display the hexagonal animation within 200ms of request initiation

## Assumptions

- The reference Borges Library interface at `nano-graphrag/3_borges-interface` is the canonical design source
- Both interfaces share the same Tailwind configuration and design tokens
- The Grand Débat interface components already exist and need styling alignment, not creation from scratch
- GraphML files contain all necessary data for the 50 communes in Charente-Maritime
- The data volume from the Grand Débat is small enough to be loaded entirely into browser memory
- Commune attribution replaces book attribution in provenance chains for the Grand Débat context
- The MCP server is used for AI-powered querying, but graph data itself is loaded from local GraphML files
