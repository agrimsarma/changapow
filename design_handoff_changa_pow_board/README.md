# Handoff: Changa Pow — Board Design

## Overview
Board reference for "Changa Pow," a Ludo/Pachisi-style cross-track board game for 4 players, played with 4 vertically-halved cylindrical wooden sticks instead of a die.

## About the Design Files
The bundled file (`Changa Pow Board.dc.html`) is a **design reference built in HTML** — it shows the intended layout, colors, and structure. It is not production code to copy directly. The task is to recreate this design in the target codebase's environment (web, native, or game engine — whichever the project uses), using its existing component/rendering patterns.

## Fidelity
**Low-to-mid fidelity.** This is a static reference board (no game logic, no interactivity, no piece movement). Layout structure, board geometry, and color roles are intentional and should be followed; exact pixel values are a starting point, not a spec to match exactly.

## Screens / Views

### Screen: Board Reference
**Purpose**: Static illustration of the game board, player colors, and the stick-roll scoring rule, for reference during implementation.

**Layout**:
- Two-column flex layout, wrapping on narrow viewports: board (left), sidebar (right, 260px).
- Board: 15×15 CSS grid, each cell 36px, total 540×540px, dark neutral background, `var(--radius-md)` corners, `var(--shadow-lg)`.
- Cross-shaped track: cells included where `row 6–8` OR `col 6–8` (0-indexed), excluding the center 3×3 (rows 6–8 AND cols 6–8) which is the home/finish hub.
- Four 6×6 corner quadrants (player yards), each containing a 2×2×~ grid of 4 token dots on a slightly inset card.
- Center 3×3 cell: split into 4 triangles (pinwheel) via `clip-path`, one per player color, with a small circular badge in the middle.

**Components**:
- **Player yard** (×4): 108×108px inset panel per quadrant, `var(--color-neutral-800)` background, `var(--radius-sm)`, holding a 2×2 grid of 26px circular tokens in the player's color.
- **Track cell** (×~80 non-center cross cells): 36×36px, 1px border `var(--color-neutral-700)`, background `var(--color-neutral-800)` by default.
  - **Home-stretch lane cells** (the 6 cells leading into the center on each arm): tinted 55% toward that arm's player color.
  - **Start cells** (one per player, on their entry square): tinted 45% toward the player color, with a solid color dot marker.
  - **Safe cells** (4 total, one per arm): neutral marker dot (`var(--color-neutral-300)`), no color tint.
- **Center hub**: 108×108px (3×3 cells), 4 color triangles meeting at center, small circular badge with "CP" monogram.
- **Sidebar — Players card**: `.card.elev-sm`, lists 4 players as color dot + name.
- **Sidebar — Stick roll card**: `.card.elev-sm`, shows two stick illustrations (flat-side-up vs round-side-up) and a scoring table.

**Content/copy**:
- Title: "Changa Pow"
- Subtitle: "Board reference — cross-track, 4 players, wooden-stick roll"
- Player names (placeholder, swap for real names): Violet, Teal, Amber, Rose
- Scoring table:
  - 0 sticks flat → **8**
  - 1 stick flat → **1**
  - 2 sticks flat → **2**
  - 3 sticks flat → **3**
  - 4 sticks flat → **4**

## Interactions & Behavior
None implemented — this is a static board. For the real game, implement:
- Roll: randomize 4 independent boolean outcomes (flat/round) per stick; score per the table above.
- Turn order, piece movement along the cross track, capturing on non-safe cells, entry into home-stretch lane, and finishing at the center hub — standard Pachisi/Ludo rules, adapted to the stick-roll distribution (note: roll distribution is NOT uniform 1–8 like a die; a fair coin-per-stick model gives 8 only when all 4 land round side up — rarer than each of 1–4 — while 8 is often treated as a special/bonus/extra-turn roll in this family of games. Confirm intended probabilities/extra-turn rules with the user before building game logic.)

## State Management
Not applicable to this static reference. A real implementation will need: current roll, current player turn, each piece's position (yard / track index / home lane index / finished), safe-cell occupancy, capture events.

## Design Tokens
All values come from the bound **Nocturne** design system (`_ds/nocturne-.../styles.css`) — do not hard-code new hex/px values when reimplementing; pull from that stylesheet's `--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*` tokens instead. Key roles used here:
- Ground: `--color-bg`, `--color-neutral-800/900`
- Player colors (custom, not in the base ramp — carry these through if reused): Violet `#9184d9` (system accent), Teal `#5fa88f`, Amber `#c9a24d`, Rose `#c96a6a`
- Card surfaces: `.card.elev-sm`
- Type: `--font-heading` (title), `--font-body` (rest)

## Assets
No external image assets — everything is CSS shapes (grid cells, circles, `clip-path` triangles, gradient "wood" sticks).

## Files
- `Changa Pow Board.dc.html` — the design reference (open directly in a browser).
