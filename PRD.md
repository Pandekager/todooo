# PRD — Todooo

## Problem Statement

I need a simple, fast checklist that I can access from both my PC and phone on my home network. Existing solutions either require accounts, are too complex, or don't work well across devices. I want a single shared list with Google Keep-style quick interactions — check, uncheck, reorder, inline edit — that feels snappy and stays out of my way.

## Solution

A self-hosted, single-page checklist app running on a home server via Docker. One list, no accounts, no complexity. Access the same list from any device on the local network via phone browser or PC. Quick-add at the bottom, checkboxes for toggling, drag-and-drop and keyboard shortcuts for reordering, inline text editing. Danish UI with a clean, minimal nordic design supporting light, dark, and system theme modes. Data persists in a server-side SQLite database via a REST API.

## User Stories

1. As a user, I want to open the app in any browser on my local network and see the same list, so that I can switch between phone and PC seamlessly.
2. As a user, I want a quick-add placeholder at the bottom of the active list saying "Tilføj...", so that I can rapidly add new items by typing and pressing Enter.
3. As a user, I want empty input on Enter to be ignored, so that I don't accidentally create blank items.
4. As a user, I want new items to appear at the bottom of the active list, so that the order reflects the sequence I added them.
5. As a user, I want to click a checkbox to toggle an item between active and completed, so that I can mark items as done or undo them easily.
6. As a user, I want to press Space on a focused item to toggle its checked state, so that I can use the keyboard to check off items quickly.
7. As a user, I want completed items to be grayed out and moved to a collapsed archive section below the active list, so that they don't clutter my working view.
8. As a user, I want to click a button to expand the archive and see all completed items, so that I can review what I've finished.
9. As a user, I want completed items sorted by most-recently-checked first, so that an accidentally checked item is immediately visible at the top of the archive.
10. As a user, I want to uncheck a completed item and have it return to its previous position in the active list, so that undoing a mistake is natural.
11. As a user, I want the archive button to show a counter like "Arkiv (3)", so that I know how many completed items exist without opening it.
12. As a user, I want to drag and drop active items to reorder them, so that I can organize my list as priorities change.
13. As a user, I want to press Cmd+Up and Cmd+Down to reorder a focused active item with the keyboard, so that I don't have to reach for the mouse.
14. As a user, I want completed items to NOT be reorderable, so that the archive always stays sorted by recency.
15. As a user, I want to click an item's text to edit it inline, so that I can fix typos or update descriptions.
16. As a user, I want to press Enter while focused on an item to start editing it, so that I can edit from the keyboard without touching the mouse.
17. As a user, I want to press Enter to save an edit or Escape to cancel it, so that editing feels natural and non-destructive.
18. As a user, I want to navigate items with the Tab key and land on one item at a time (checkbox+text as one stop), so that keyboard navigation is predictable.
19. As a user, I want the app to detect my system's light/dark preference on first visit, so that it matches my environment automatically.
20. As a user, I want a toggle to manually switch between light, dark, and system theme, so that I can override the default when I want.
21. As a user, I want smooth animated transitions when checking, unchecking, and reordering items, so that the app feels polished and responsive.
22. As a user, I want the app to show "Ingen ting på listen — ingen problemer :)" when the active list is empty, so that I'm not staring at a blank page.
23. As a user, I want the entire UI to be in Danish, so that it feels native to my language.
24. As a user, I want the app to use my local network IP so I can open it from any device, so that my phone and PC share the same list without cloud accounts.
25. As a user, I want the app to run as a Docker container on my home server and always be available, so that I don't need to start it manually.

## Implementation Decisions

### Architectural

- **Single page application** — one route (`/`), no navigation. The entire app is The List page.
- **Server-client split** — Nitro API routes handle all SQLite persistence. The Vue frontend is a consumer of the API. Items are always loaded fresh from the server on load; optimistic updates with rollback on failure.
- **No authentication** — single-user, single-list by design. The app is accessed only on a local network.

### Data model

Single `items` table:

| Column | Type | Purpose |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Unique identifier |
| `text` | TEXT NOT NULL | The item's content |
| `checked` | INTEGER NOT NULL DEFAULT 0 | 0 = active, 1 = completed |
| `checked_at` | INTEGER | Unix timestamp of when checked (null if active) |
| `order` | INTEGER NOT NULL | Position in the active list |

### API contracts

- `GET /api/items` — returns all items partitioned into active (ordered by `order`) and completed (ordered by `checked_at` DESC)
- `POST /api/items` — creates an item at the bottom of the active list. Body: `{ text: string }`
- `PATCH /api/items/:id` — updates text, checked state, or order. Body: `{ text?: string, checked?: boolean, order?: number }`
- `PATCH /api/items/reorder` — batch-updates order for multiple items. Body: `{ items: Array<{ id: number, order: number }> }`

### Modules

- **Nitro API routes** — REST handlers backed by `bun:sqlite`. Zero dependencies beyond Bun stdlib.
- **`useItems` composable** — the deep module. Exposes reactive state (`items`, `activeItems`, `completedItems`, `archiveCount`) and actions (`addItem`, `toggleItem`, `updateText`, `reorderItems`). Handles API communication, optimistic updates, and rollback. Testable in isolation.
- **`useTheme` composable** — reactive theme state (light/dark/system), persisted to localStorage, initial detection from `prefers-color-scheme`.
- **`useKeyboard` composable** — handles Tab navigation, Cmd+Up, Cmd+Down, Space, Enter, and Escape within the list. Decoupled from rendering so it can be tested independently.
- **ItemList component** — renders active items wrapped with @formkit/drag-and-drop. Delegates reorder events to `useItems`. Manages focus state for keyboard navigation.
- **Item component** — single row: checkbox (toggles via click), editable text (click or Enter to edit, Enter to save, Escape to cancel), drag handle (for @formkit/drag-and-drop).
- **QuickAdd component** — inline placeholder "Tilføj..." below the last active item. Captures typed text, creates item on Enter, ignores empty input.
- **Archive component** — expand/collapse button with count, renders completed items (read-only, no drag, no inline edit). Sorted most-recently-checked first via checked_at.

### Styling

- **UnoCSS** (via `@unocss/nuxt`) for atomic CSS styling. Tailwind-compatible utility classes, Nuxt-native integration, zero-config.
- **Nordic minimal aesthetic** — neutral grays, clean whitespace, no accent colors per item.
- **Smooth transitions** — Vue `<TransitionGroup>` for check/uncheck animations and reorder list movement.
- **Light/dark/system** theme via UnoCSS's `dark:` variant with `class`-based dark mode, toggled by a sun/moon/system button.

### Drag-and-drop

- **@formkit/drag-and-drop** — native Vue integration, supports both mouse and touch out of the box.

### Deployment

- **Docker** — multi-stage Dockerfile: stage 1 builds the Nuxt app, stage 2 runs it via Bun with `--host 0.0.0.0` for network access.
- SQLite database file bind-mounted via Docker volume for persistence.
- README includes setup instructions for running the Docker container on a home server.

## Testing Decisions

### Test runner

**Vitest** — unified test runner for all test types. Single `bun run test` command. Configured alongside the Nuxt project with a `vitest.config.ts`.

### What to test

- **API integration tests** — test each API route against a real in-memory SQLite database. Verify: create item, get all items (active/completed split), toggle checked state, update text, batch reorder, enforce constraints (non-empty text, valid order).
- **`useItems` composable unit tests** — mock `$fetch` to verify: reactive state updates on fetch, optimistic add/toggle/update/reorder with correct rollback on failure, derived state correctness (activeItems, completedItems, archiveCount).
- **`useKeyboard` composable unit tests** — verify: Tab focus cycling, Cmd+Up/Cmd+Down emits reorder, Space emits toggle, Enter enters/exits edit mode, Escape cancels edit.

### What makes a good test

- Test external behavior only — input in, output/state out. Never assert on internal implementation details.
- API tests verify HTTP status codes and persisted database state.
- Composable tests verify exposed reactive state and emitted events, not internal refs.
- Each test is independent — resets database state or composable state per test case.

### Unified format

All tests live under `tests/` with the following structure:

```
tests/
├── api/
│   └── items.test.ts       # API integration tests (bun:sqlite in-memory)
└── composables/
    ├── useItems.test.ts    # useItems unit tests (mocked $fetch)
    └── useKeyboard.test.ts # useKeyboard unit tests
```

Run with `bun run test` (maps to `vitest run`).

## Out of Scope

- Multiple lists or notebooks — only The List.
- User authentication or accounts.
- Categories, tags, labels, colors, or priorities.
- Reminders, due dates, or scheduling.
- Drawing, image attachments, file uploads.
- Sharing, collaboration, or multi-user support.
- PWA / install to home screen / offline support.
- Permanent deletion of items — checking/unchecking is the only lifecycle.
- Search, filter, or sorting beyond the defined order rules.
- Server-side rendering of the app — purely client-side after initial load.

## Further Notes

- The UI language is exclusively Danish. All visible strings (quick-add placeholder, empty state, archive button) must be in Danish.
- The app name "Todooo" is a play on "to do" with three Os to match the Scandinavian aesthetic.
- The CONTEXT.md file in the repository serves as the canonical domain glossary. All code should use the terminology defined there.
