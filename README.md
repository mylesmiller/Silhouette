# Silhouette

A daily Tetris-style puzzle. You're given a target silhouette (a gray shape on the right) and a fixed queue of pieces. Place the pieces with standard Tetris controls to recreate the silhouette exactly.

---

## Concept

- The right canvas shows a gray "silhouette" — the shape you need to build.
- The middle canvas shows the upcoming piece queue, in order.
- The left canvas is your playable board.
- Pieces drop with gravity (standard Tetris). You move and rotate them as they fall.
- Win = your board exactly matches the silhouette (100% coverage, 0 overflow cells).
- Daily puzzle: everyone gets the same puzzle on the same day, driven by a date-based seed.

## Difficulty tiers

The player picks easy / medium / hard at the top.

| | Easy | Medium | Hard |
|---|---|---|---|
| Board | 8×12 | 9×14 | 10×16 |
| Pieces | 5–6 | 8–10 | 12–15 |
| Dashed outline on your board | yes | no | no |
| Gray silhouette on right | always visible | always visible | shown 5s then hidden |
| Ghost piece (drop preview) | yes | yes | no |

The generator biases easy puzzles toward flat, low piece placements so silhouettes are simple. Medium and hard let the generator pick more freely.

**Important constraint:** Because the player drops pieces with gravity, the generator must only produce silhouettes that are physically reachable by gravity drops. Don't create floating cells / overhangs.

## Tech stack (recommended)

- **Next.js (App Router) + TypeScript** — easy to deploy to Vercel, gives you API routes for free if you later add leaderboards
- **Tailwind CSS** — quick styling
- **Canvas API** for the three game boards (do not use SVG or DOM cells — canvas is much smoother for the 60fps active piece)
- **No state library** — useState/useReducer is enough for MVP
- **Vercel** for hosting; the app is fully client-side for MVP

## File structure

```
silhouette/
├── README.md                 ← this file
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← main game page
│   └── globals.css
├── components/
│   ├── GameBoard.tsx         ← left canvas: player board + active piece + ghost + outline
│   ├── QueuePanel.tsx        ← middle canvas: upcoming pieces
│   ├── TargetPanel.tsx       ← right canvas: silhouette (or hidden in hard)
│   ├── DifficultyBar.tsx     ← easy/medium/hard tabs
│   ├── HUD.tsx               ← pieces left, match %, overflow
│   └── ResultModal.tsx       ← win/lose modal
├── lib/
│   ├── pieces.ts             ← tetromino definitions + rotations
│   ├── generator.ts          ← seeded puzzle generation
│   ├── game.ts               ← board state, collision, rotation, lock logic
│   ├── rng.ts                ← mulberry32 seeded RNG
│   └── difficulty.ts         ← difficulty configs
└── hooks/
    └── useGame.ts            ← game state + keyboard input
```

## Core mechanics (must-have for MVP)

1. **Piece data** — 7 tetrominoes (I, O, T, S, Z, J, L), 4 rotation states each, defined as `[x, y]` cell offsets. See `lib/pieces.ts` in starter code.

2. **Seeded RNG** — `mulberry32(seed)`. Seed = `YYYYMMDD` as integer. This guarantees everyone playing on the same day gets the same puzzle.

3. **Puzzle generator** (`generatePuzzle(seed, difficulty)`):
   - Start with empty grid.
   - For each of N pieces (N from difficulty config), pick a random type and rotation.
   - Find all valid (column, dropY) positions for that piece.
   - On easy: pick from the lowest 40% (flattest placements).
   - On medium/hard: pick randomly from all valid positions.
   - Lock the piece into the grid. Record `{type, rotation}` in the queue (the rotation is informational only — the player chooses their own rotations).
   - Return `{target: grid, queue}`.

4. **Game loop**:
   - Spawn the next piece from the queue at the top-center.
   - Player controls: ←/→ move, ↑ or X rotate cw, Z rotate ccw, ↓ soft drop, Space hard drop.
   - On lock, advance the queue index.
   - When queue is exhausted, game over → check win.

5. **Win check** — count cells: matched (filled in both target and board), overflow (filled in board but not target). Win = matched == total target cells AND overflow == 0.

6. **Rendering** — three canvases:
   - **Board canvas**: paper background, grid lines, optional dashed silhouette outline (easy), locked pieces, ghost piece (easy/medium), active piece.
   - **Queue canvas**: 5–7 upcoming pieces stacked vertically, current piece NOT shown (it's already on the board).
   - **Target canvas**: solid gray silhouette cells. In hard mode, show for 5s with a countdown ring, then replace with "?" and "from memory" label.

7. **Reveal on game end** — when the game ends (win or loss), always reveal the silhouette regardless of difficulty, so the player can see what they were aiming for.

## Stretch features (after MVP works)

These are not required for v1. Build them once the core loop is solid.

- **Share string** — after a win, generate something like `silhouette #42 · medium · 100% · 7 pieces` plus emoji-square art of the silhouette, copyable to clipboard. This is the virality lever.
- **Streak tracking** — localStorage. Track current streak, longest streak per difficulty.
- **Daily lock** — once a player completes today's daily, lock it so they can't replay (preserves leaderboard integrity). Provide a separate "free play" mode with the new-puzzle button.
- **Mobile controls** — swipe left/right to move, swipe down for soft drop, tap to rotate, swipe up for hard drop. Or on-screen buttons.
- **Leaderboard** — Vercel Postgres or Supabase, store seed + difficulty + completion time + user id.
- **Auth** — optional, only needed for cross-device streaks and leaderboard.
- **Stats page** — win rate per difficulty, average pieces-used, etc.
- **Hint system** — for a "show me where the next piece goes" hint, generate the solution path during puzzle generation (record drop column per piece) and reveal one hint per puzzle.
- **Settings** — colorblind palette, sound on/off, haptics on mobile.

## What NOT to build for MVP

- Authentication
- Server-side anything (puzzles are deterministic client-side from the date seed)
- Animations beyond what's already there
- Sound
- Multiplayer

## Visual direction

Hand-drawn / notebook aesthetic: cream paper background, wobbly black borders on the three wells, Caveat font for handwritten labels, Fraunces serif for the brand mark, JetBrains Mono for UI text. Bright Tetris piece colors against muted gray silhouette. See `mvp.html` for the working reference.

## Acceptance criteria for MVP

- [ ] All three difficulties playable end-to-end
- [ ] Daily puzzle is deterministic from date (same puzzle for all players on same day)
- [ ] Win detection works correctly (100% match + 0 overflow)
- [ ] Game over when queue is exhausted
- [ ] Reset and "new puzzle" buttons work
- [ ] Generator never produces unsolvable silhouettes (no floating cells)
- [ ] Mobile-responsive (playable on phone — even with placeholder touch controls)
- [ ] No console errors

## Notes for Claude Code

- The reference implementation is `mvp.html` in this folder. It's a single-file working version of everything in the "Core mechanics" section. **Port it** rather than rewriting from scratch — all the math (collision, rotation, generator, win check) is already debugged.
- Keep the cell-based coordinate system used in the reference. `[x, y]` where `x` is column, `y` is row, origin top-left.
- When implementing canvas rendering, set `canvas.width = cols * cellSize` and `canvas.height = rows * cellSize` directly — don't try to use CSS to size canvases, that produces blurry output.
- The generator runs in milliseconds even on hard mode; no need to web-worker it.
