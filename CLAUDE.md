# Build instructions for Claude Code

## What this project is

**Stax** (formerly "Silhouette") is a daily stacking puzzle web app. Domain: **staxgame.com**. The full product spec is in `README.md`. A working single-file reference implementation is in `mvp.html`.

> **Hard rule:** never use the word "Tetris" anywhere visible on the site (copyright). The codebase still uses "tetromino" in code comments — that's fine, but copy/UI must say "stacking puzzle," "blocks," etc.

## Where to make changes

The **Next.js app** under `app/`, `components/`, `hooks/`, `lib/` is what gets deployed to staxgame.com. **Default all edits there.**

`mvp.html` is a single-file reference implementation only — edits there do not reach the live site. Only touch it if the user explicitly says "in mvp" or "in the reference."

## Current state (as of 2026-05-11)

### Done
- **Rebrand to Stax.** Title, share text, domain (`staxgame.com`) updated in mvp.html and Next.js app. Share fallback URL hard-coded to `staxgame.com` (not `window.location.origin`).
- **No "Tetris" in visible copy.** Subtitle reads "a daily stacking puzzle"; meta description matches.
- **R-key restart.** Wired into `hooks/useGame.ts` (fires before the gameOver/!active guards; calls `setReloadKey`, same path as the restart button) and into mvp.html. Listed in the bottom controls hint on both.
- **HowToPlay modal slimmed.** Only shows `↑ rotate` and `space hard drop` (arrows / soft drop are self-explanatory). The in-game bottom hint keeps the full list.
- **ET midnight rollover for the daily seed** — implemented in `mvp.html` via `Intl.DateTimeFormat` with `timeZone: 'America/New_York'`. **NOT yet ported to `lib/rng.ts`** — still uses local `new Date()`.
- **Generator improvements in mvp.html only:**
  - **7-bag piece selection** (`makeBag(rng)`) — each tetromino once per 7 draws, so no "five S-pieces in a row" puzzles.
  - **Shape-quality scoring** (`scorePuzzle`) — rewards perimeter complexity, footprint width, column-height variance, piece-type diversity; rejects 1-2 column blobs.
  - `generatePuzzle` now generates 8 candidates per seed and keeps the highest scorer (still deterministic).
  - **Not yet ported to `lib/generator.ts`.**

### Decisions made
- **Daily rollover:** midnight America/New_York for everyone (handles EDT/EST automatically).
- **Puzzle archive (paid feature):** URL routing `/puzzle/[number]/[difficulty]`. Today + yesterday free, older gated behind Stripe. **Archive plays do NOT count toward streaks** — streaks are daily-live only.
- **Share-text format target:** brand + puzzle # + difficulty + score on the top line, emoji grid, bare domain on its own line. Drop `🟥` overflow squares from winning shares (spoiler-safe / aspirational, like Wordle). Use stars or a rank letter (S/A/B) instead of raw `match% · time` in the header.
- **OG image strategy:** dynamic per-day `app/opengraph-image.tsx` using `next/og`'s `ImageResponse`. 1200×630, dark theme, "STAX" wordmark + `puzzle #042` + teaser silhouette + `staxgame.com`. Highest-leverage virality move — every shared link becomes a custom card.

### Currently working on
**Dynamic OG image route** — `app/opengraph-image.tsx`. Mid-implementation when the user asked to compact. Plan:
1. Update `lib/rng.ts`: port ET timezone fix from mvp.html + add `puzzleNumber()` helper (days since launch epoch `2026-05-11`).
2. Create `app/opengraph-image.tsx` with `runtime = 'edge'`, `revalidate = 3600`. Pulls today's seed, calls `generatePuzzle`, renders the target silhouette as a grid on a dark card.
3. Add `openGraph` + `twitter` metadata fields to `app/layout.tsx` so the route is referenced.

### Backlog (discussed, not committed)
- Port 7-bag + shape scoring from `mvp.html` → `lib/generator.ts`.
- Themed days (skyline / carpet / swiss-cheese) seeded off the day's number.
- Rolling-hash dedup so today's target doesn't accidentally match a recent past target.
- Archive UI: calendar grid linking to `/puzzle/[n]`; paywall modal on locked tiles; Stripe entitlement.
- Localstorage history of the player's own results per puzzle.
- Per-puzzle stars/rank letter (S/A/B) to replace raw match% + time — needed for the new share-text format.
- New share-text format itself (top line redesign + remove red overflow squares on wins).

---

## How to approach this build (reference)

1. **Read `README.md` first** for the full spec, then **open `mvp.html`** in a browser and play through all three difficulties so you understand the mechanics.
2. **Port the reference, don't rewrite it.** All the math (piece rotations, collision detection, gravity drop, generator, win check) is already debugged in `mvp.html`. Translate it to TypeScript modules, keep the logic identical.
3. **Build order (for any not-yet-ported logic):**
   - `lib/pieces.ts`, `lib/rng.ts`, `lib/generator.ts`, `lib/game.ts` — pure logic, no React
   - `hooks/useGame.ts` — wraps game state + keyboard input
   - Canvas components (`GameBoard`, `QueuePanel`, `TargetPanel`)
   - `app/page.tsx` layout
   - `DifficultyBar`, `HUD`, `ResultModal`
4. **Don't add features beyond the MVP acceptance criteria** in the README.

## Things to preserve from the reference

- Visual style (dark theme, orange accent, three font choices, block colors)
- 5-second peek countdown ring on hard mode
- Reveal-on-game-end behavior (silhouette shown after win or loss)
- Seeded RNG approach for daily puzzles (mulberry32 with ET-day seed)
- "Match %" and "overflow" stats in the HUD

## Things you can improve

- Type safety — `mvp.html` is plain JS, the ports should add proper TS types
- Mobile touch controls — reference is keyboard-only; add swipe/tap
- Component decomposition — split the single file into the modules listed above
- Test the generator with a unit test confirming it never produces floating cells

## Things to NOT change without asking

- The piece shape/rotation tables in `pieces.ts` — standard SRS-ish; changing them breaks puzzles
- The difficulty config numbers (board sizes, piece counts) — these are tuned
- The win condition (100% match + 0 overflow)

## Running the reference

```bash
# Open in a browser:
open mvp.html
# or
python3 -m http.server 8000   # then visit localhost:8000/mvp.html
```

## Asking for clarification

If anything in the spec is ambiguous, the reference implementation is the source of truth. If both are ambiguous, ask the user before guessing.
