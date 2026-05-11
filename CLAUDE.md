# Build instructions for Claude Code

## What this project is

Silhouette is a daily Tetris-style puzzle web app. The full product spec is in `README.md`. A working single-file reference implementation is in `mvp.html`.

## How to approach this build

1. **Read `README.md` first** for the full spec, then **open `mvp.html`** in a browser and play through all three difficulties so you understand the mechanics before writing any code.
2. **Port the reference, don't rewrite it.** All the math (piece rotations, collision detection, gravity drop, generator, win check) is already debugged in `mvp.html`. Translate it to TypeScript modules, keep the logic identical.
3. **Build in this order:**
   - Scaffold the Next.js + TypeScript + Tailwind project
   - Port `lib/pieces.ts`, `lib/rng.ts`, `lib/generator.ts`, `lib/game.ts` from the reference (pure logic, no React)
   - Build `hooks/useGame.ts` to wrap game state + keyboard input
   - Build the three canvas components (`GameBoard`, `QueuePanel`, `TargetPanel`)
   - Wire up `app/page.tsx` with the layout from the reference
   - Add `DifficultyBar`, `HUD`, `ResultModal`
4. **Don't add features beyond the MVP acceptance criteria** in the README. The "Stretch features" section is explicitly for later.

## Things to preserve from the reference

- The visual style (cream paper, wobbly borders, the three font choices, Tetris piece colors)
- The 5-second peek countdown ring on hard mode
- The reveal-on-game-end behavior (silhouette shown after win or loss)
- The seeded RNG approach for daily puzzles (mulberry32 with YYYYMMDD seed)
- The "match %" and "overflow" stats in the HUD

## Things you can improve

- Type safety — the reference is plain JS, you should add proper TypeScript types
- Mobile touch controls — the reference is keyboard-only, add swipe/tap on mobile
- Component decomposition — the reference is one file, split into the modules listed in the README
- Test the generator with a unit test confirming it never produces floating cells

## Things to NOT change without asking

- The piece shape/rotation tables in `pieces.ts` — they are standard SRS-ish definitions; changing them breaks puzzles
- The difficulty config numbers (board sizes, piece counts) — these are tuned
- The win condition (100% match + 0 overflow)

## Running the reference

```bash
# Just open it in a browser:
open mvp.html
# or
python3 -m http.server 8000   # then visit localhost:8000/mvp.html
```

## Asking for clarification

If anything in the spec is ambiguous, the reference implementation is the source of truth. If both are ambiguous, ask the user before guessing.
