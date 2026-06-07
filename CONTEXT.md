# CONTEXT — Todooo

## Glossary

- **Item** — a single checklist entry. Has text content and a checked/unchecked state. Items have a user-controlled order within their section.
- **Active Item** — an unchecked item. Appears in the top section, full opacity.
- **Completed Item** — a checked item. Grayed out, shown below active items, ordered by most-recently-checked first.
- **Check** — marking an active item as completed. Moves it to the completed section, grayed out. Toggled by clicking the checkbox or pressing Space when focused.
- **Uncheck** — restoring a completed item to active state. Returns it to the active section at its previous position. Toggled by clicking the checkbox or pressing Space when focused.
- **Reorder** — manually changing the order of active items via drag-and-drop (mouse/touch) or Cmd+Up / Cmd+Down (keyboard). Only active items are reorderable; completed items are always sorted most-recently-checked first.
- **Quick-add** — the inline placeholder at the bottom of the active list. Grayed-out text, reads "Tilføj...". Click to type an item, press Enter to create it. New items appear at the bottom of the active list.
- **Archive** — the collapsible section at the bottom of the page containing completed items. Only visible when expanded.
- **Edit** — inline editing of an item's text by clicking the text. Click outside or press Enter to save, Escape to cancel.
- **The List** — the single, global checklist. There is only one list for the app.

## Domain Rules

- Checking/unchecking is reversible — no permanent deletion.
- Completed items are ordered most-recently-checked first (so accidentally checked items are easy to spot).
- The app is single-user, single-list. No authentication, no credentials.
- Data is stored server-side (SQLite via Nitro API routes). Same list is accessible from any device on the local network.
- The UI is in Danish. Empty state reads: "Ingen ting på listen — ingen problemer :)".
- New items always go to the bottom of the active list. Active item ordering is user-controlled; there is no auto-sort.
- Items have no categories, tags, or colors. Clean, minimal, nordic design.
