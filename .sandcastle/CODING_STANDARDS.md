# Coding Standards

## Style

- Vue 3 Composition API with `<script setup>` in all components
- Use Danish for all UI text (empty states, placeholders, buttons)
- UnoCSS for all styling — no inline styles, no scoped CSS
- Use camelCase for composables (e.g. `useItems`, `useTheme`, `useKeyboard`)
- Use PascalCase for Vue components (e.g. `ItemList`, `QuickAdd`, `Archive`)
- Prefer named exports over default exports

## Testing

- All tests live under `tests/` — API tests in `tests/api/`, composable tests in `tests/composables/`
- Run with `bun run test` (maps to `vitest run`)
- Run `bun run [test](test:smoke)` as a final step to validate the build
- Test external behavior only — no asserting on internal implementation details
- API tests verify HTTP status codes and persisted database state
- Composable tests verify exposed reactive state and emitted events
- Each test must be independent (reset state per test case)
- Use descriptive test names that explain the expected behavior
- Run `bun run [test](test:smoke)` as a final step to validate the build

## Architecture

- Nitro API routes handle all persistence via `bun:sqlite` — no ORM
- `useItems` composable is the single source of truth for item state
- Components consume composables, never call `$fetch` directly
- Optimistic updates with rollback on API failure
- Follow the domain terminology in CONTEXT.md (Active Item, Completed Item, Archive, etc.)

## Commands

- `bun install` — install dependencies
- `bun run dev` — start dev server
- `bun run test` — run vitest test suite
- `bun run test:smoke` — make build and run smoke tests
- `bun run typecheck` — run Vue type checking
- `bun run build` — production build
