# Tasks: Basile Minimalism UI Redesign

**Input**: Design documents from `/specs/002-basile-ui-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/design-tokens.json, quickstart.md

**Tests**: No tests requested - this is a visual-only redesign with manual verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**CRITICAL REMINDER**: This is a VISUAL-ONLY redesign. Do NOT change functionality or graph animations.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `3_borges-interface/`:
- `src/app/globals.css` - Global styles
- `tailwind.config.js` - Tailwind configuration
- `src/components/*.tsx` - React components

---

## Phase 1: Setup (Design System Foundation)

**Purpose**: Establish design tokens and configuration before component updates

- [X] T001 Update Tailwind config with complete color palette in `3_borges-interface/tailwind.config.js`
- [X] T002 Update CSS custom properties in `3_borges-interface/src/app/globals.css`
- [X] T003 [P] Add focus state styles in `3_borges-interface/src/app/globals.css`
- [X] T004 [P] Add scrollbar styling in `3_borges-interface/src/app/globals.css`

**Checkpoint**: Design tokens ready - component styling can begin

---

## Phase 2: Foundational (Shared Component Patterns)

**Purpose**: Establish reusable styling patterns that all user stories depend on

**⚠️ CRITICAL**: Complete this phase before starting any user story

- [X] T005 Create button styling utility classes in `3_borges-interface/src/app/globals.css`
- [X] T006 [P] Create input field styling utility classes in `3_borges-interface/src/app/globals.css`
- [X] T007 [P] Create panel/card styling utility classes in `3_borges-interface/src/app/globals.css`
- [X] T008 [P] Create modal styling utility classes in `3_borges-interface/src/app/globals.css`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Content-First Knowledge Exploration (Priority: P1) 🎯 MVP

**Goal**: Make textual content (entity names, descriptions, relationship labels) the dominant visual element

**Independent Test**: Navigate graph interface and verify text occupies >70% of visual hierarchy, all decorative elements justify their existence

### Implementation for User Story 1

- [X] T009 [US1] Update BorgesLibrary main layout to prioritize content in `3_borges-interface/src/components/BorgesLibrary.tsx`
- [X] T010 [P] [US1] Update EntityDetailModal typography hierarchy in `3_borges-interface/src/components/EntityDetailModal.tsx`
- [X] T011 [P] [US1] Update TextChunkModal content styling in `3_borges-interface/src/components/TextChunkModal.tsx`
- [X] T012 [P] [US1] Update ProvenancePanel text hierarchy in `3_borges-interface/src/components/ProvenancePanel.tsx`
- [X] T013 [US1] Update HighlightedText styling for readability in `3_borges-interface/src/components/HighlightedText.tsx`
- [X] T014 [US1] Update RelationshipTooltip typography in `3_borges-interface/src/components/RelationshipTooltip.tsx`
- [X] T015 [US1] Audit and remove any unjustified decorative elements across all components

**Checkpoint**: Content-first design complete - text is dominant visual element

---

## Phase 4: User Story 2 - Streamlined Navigation Architecture (Priority: P1)

**Goal**: Reduce navigation to essential actions only: Browse, Search, Random, contextual actions

**Independent Test**: Enumerate all navigation elements and verify each serves one of the core actions

### Implementation for User Story 2

- [X] T016 [US2] Streamline main navigation in `3_borges-interface/src/components/BorgesLibrary.tsx`
- [X] T017 [P] [US2] Update QueryInterface search styling in `3_borges-interface/src/components/QueryInterface.tsx`
- [X] T018 [P] [US2] Update BookSelector dropdown styling in `3_borges-interface/src/components/BookSelector.tsx`
- [X] T019 [US2] Ensure contextual actions appear only on interaction (hover/click) in all components
- [X] T020 [US2] Remove or consolidate any redundant navigation elements

**Checkpoint**: Navigation streamlined - only essential actions visible

---

## Phase 5: User Story 3 - Dark Theme with Restrained Palette (Priority: P2)

**Goal**: Apply 5-color palette consistently across all components

**Independent Test**: Audit all CSS color definitions and verify ≤5 distinct colors (excluding grayscale)

### Implementation for User Story 3

- [X] T021 [US3] Apply dark theme to BorgesLibrary in `3_borges-interface/src/components/BorgesLibrary.tsx`
- [X] T022 [P] [US3] Apply color palette to QueryInterface in `3_borges-interface/src/components/QueryInterface.tsx`
- [X] T023 [P] [US3] Apply color palette to BookSelector in `3_borges-interface/src/components/BookSelector.tsx`
- [X] T024 [P] [US3] Apply color palette to EntityDetailModal in `3_borges-interface/src/components/EntityDetailModal.tsx`
- [X] T025 [P] [US3] Apply color palette to TextChunkModal in `3_borges-interface/src/components/TextChunkModal.tsx`
- [X] T026 [P] [US3] Apply color palette to ProvenancePanel in `3_borges-interface/src/components/ProvenancePanel.tsx`
- [X] T027 [P] [US3] Apply color palette to QueryDebugPanel in `3_borges-interface/src/components/QueryDebugPanel.tsx`
- [X] T028 [P] [US3] Apply color palette to QueryAnimationControls in `3_borges-interface/src/components/QueryAnimationControls.tsx`
- [X] T029 [US3] Verify WCAG AA contrast compliance across all color combinations

**Checkpoint**: Dark theme applied - ≤5 colors used consistently

---

## Phase 6: User Story 4 - Visual Styling Preservation (Priority: P2)

**Goal**: Update graph node/edge COLORS ONLY while preserving all animations

**Independent Test**: Verify all graph animations (physics, zoom, pan, expansion) work identically before and after

**⚠️ CRITICAL**: DO NOT modify any animation code, physics settings, or interaction handlers

### Implementation for User Story 4

- [X] T030 [US4] Update node color styling ONLY in `3_borges-interface/src/components/GraphVisualization3DForce.tsx`
- [X] T031 [US4] Update edge color styling ONLY in `3_borges-interface/src/components/GraphVisualization3DForce.tsx`
- [X] T032 [P] [US4] Update LoadingWheel3D color styling in `3_borges-interface/src/components/LoadingWheel3D.tsx`
- [X] T033 [P] [US4] Update DebugVisualization styling in `3_borges-interface/src/components/DebugVisualization.tsx`
- [X] T034 [P] [US4] Update ProgressiveDebugVisualization styling in `3_borges-interface/src/components/ProgressiveDebugVisualization.tsx`
- [X] T035 [US4] Verify all graph animations still work (zoom, pan, physics, expansion)

**Checkpoint**: Graph styling updated - all animations preserved

---

## Phase 7: User Story 5 - Hexagonal/Geometric Visual Symbolism (Priority: P3)

**Goal**: Add subtle hexagonal accents in non-content areas only

**Independent Test**: Verify geometric elements appear only in branding/dividers/empty states, not in content areas

### Implementation for User Story 5

- [X] T036 [US5] Add hexagonal accent to empty state in `3_borges-interface/src/components/BorgesLibrary.tsx`
- [X] T037 [P] [US5] Add subtle geometric section dividers where appropriate
- [X] T038 [US5] Verify hexagonal elements do not appear in content regions

**Checkpoint**: Geometric accents added - content areas remain clean

---

## Phase 8: Mobile Responsiveness (Constitution Principle VIII)

**Purpose**: Ensure interface is fully functional on mobile devices per Constitution v1.5.0

**⚠️ CRITICAL**: Per Principle VIII, the interface MUST be fully usable on mobile devices

- [X] T039 Add responsive breakpoints to Tailwind config in `3_borges-interface/tailwind.config.js`
- [X] T040 [US-MOBILE] Add mobile navigation (hamburger menu) in `3_borges-interface/src/components/BorgesLibrary.tsx`
- [X] T041 [P] [US-MOBILE] Make header responsive in `3_borges-interface/src/components/BorgesLibrary.tsx`
- [X] T042 [P] [US-MOBILE] Make search bar responsive in `3_borges-interface/src/components/BorgesLibrary.tsx`
- [X] T043 [US-MOBILE] Make answer panel responsive in `3_borges-interface/src/components/BorgesLibrary.tsx`
- [X] T044 [P] [US-MOBILE] Make EntityDetailModal responsive in `3_borges-interface/src/components/EntityDetailModal.tsx`
- [X] T045 [P] [US-MOBILE] Make TextChunkModal responsive in `3_borges-interface/src/components/TextChunkModal.tsx`
- [X] T046 [US-MOBILE] Ensure touch targets are ≥44x44px across all interactive elements
- [X] T047 [US-MOBILE] Add touch gesture support for graph (tap, pinch, drag) - 3d-force-graph natively supports touch
- [X] T048 Add responsive typography (min 16px body text) in `3_borges-interface/src/app/globals.css`

**Checkpoint**: Mobile responsiveness complete - interface usable on phones and tablets

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and consistency checks

- [X] T049 [P] Run full visual audit - verify ≤5 colors used
- [X] T050 [P] Run full visual audit - verify ≤2 font families used
- [X] T051 [P] Run full visual audit - verify ≤4 navigation items
- [X] T052 Verify all functionality unchanged (graph navigation, search, book selection)
- [X] T053 Run WCAG AA contrast check on all text
- [X] T054 Run quickstart.md validation checklist
- [X] T055 Performance check - verify no page load regression
- [X] T056 [P] Test on mobile viewport (< 768px)
- [X] T057 [P] Test on tablet viewport (768-1024px)
- [ ] T058 Test touch interactions on real device (requires physical device)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 (both P1) can proceed in parallel
  - US3 and US4 (both P2) can proceed in parallel after P1
  - US5 (P3) can proceed after P2
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Independent
- **User Story 2 (P1)**: Can start after Foundational - Independent
- **User Story 3 (P2)**: Can start after US1/US2 for consistency - Mostly independent
- **User Story 4 (P2)**: Can start after Foundational - Independent
- **User Story 5 (P3)**: Can start after US3 palette is finalized - Slight dependency

### Parallel Opportunities per Phase

- **Phase 1**: T003, T004 can run in parallel
- **Phase 2**: T006, T007, T008 can run in parallel
- **Phase 3**: T010, T011, T012 can run in parallel
- **Phase 4**: T017, T018 can run in parallel
- **Phase 5**: T022-T028 can all run in parallel
- **Phase 6**: T032, T033, T034 can run in parallel
- **Phase 7**: T037 can run in parallel with T036
- **Phase 8**: T039, T040, T041 can run in parallel

---

## Parallel Example: User Story 3 (Dark Theme)

```bash
# Launch all component color updates in parallel:
Task: "Apply color palette to QueryInterface in src/components/QueryInterface.tsx"
Task: "Apply color palette to BookSelector in src/components/BookSelector.tsx"
Task: "Apply color palette to EntityDetailModal in src/components/EntityDetailModal.tsx"
Task: "Apply color palette to TextChunkModal in src/components/TextChunkModal.tsx"
Task: "Apply color palette to ProvenancePanel in src/components/ProvenancePanel.tsx"
Task: "Apply color palette to QueryDebugPanel in src/components/QueryDebugPanel.tsx"
Task: "Apply color palette to QueryAnimationControls in src/components/QueryAnimationControls.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Content-First)
4. Complete Phase 4: User Story 2 (Navigation)
5. **STOP and VALIDATE**: Test content hierarchy and navigation independently
6. Deploy/demo if ready - this is a usable minimalist interface

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US2 → Content-first navigation → Deploy (MVP!)
3. Add US3 → Dark theme applied → Deploy
4. Add US4 → Graph styling updated → Deploy
5. Add US5 → Hexagonal accents → Deploy (Complete)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Content-First)
   - Developer B: User Story 2 (Navigation)
3. After P1 stories:
   - Developer A: User Story 3 (Colors)
   - Developer B: User Story 4 (Graph Styling)
4. Developer A or B: User Story 5 (Hexagonal)
5. Full team: Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **CRITICAL**: DO NOT modify graph animations, physics, or interaction handlers
- **CRITICAL**: Verify functionality unchanged after each phase
