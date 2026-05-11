// Puzzle generator — ported from mvp.html.
// Drops random pieces with gravity onto an empty grid. The resulting
// silhouette is the target the player must match. The order of placement
// is recorded as the queue.

import { mulberry32 } from './rng';
import { PIECES, PIECE_TYPES, type Board, type Cell, type PieceType, type QueueEntry } from './pieces';
import type { DifficultyConfig } from './difficulty';

export interface Puzzle {
  target: Board;
  queue: QueueEntry[];
}

export function findDropY(
  grid: Board,
  shape: ReadonlyArray<readonly [number, number]>,
  rows: number,
  cols: number
): number | null {
  let y = -3;
  while (y < rows) {
    let collides = false;
    for (const [sx, sy] of shape) {
      const gy = sy + y + 1;
      const gx = sx;
      if (gy >= rows) { collides = true; break; }
      if (gy >= 0 && gx >= 0 && gx < cols && grid[gy][gx]) { collides = true; break; }
    }
    if (collides) {
      for (const [, sy] of shape) {
        const gy = sy + y;
        if (gy < 0) return null;
      }
      return y;
    }
    y++;
  }
  return y;
}

export function generatePuzzle(seed: number, cfg: DifficultyConfig): Puzzle {
  const rng = mulberry32(seed);
  const grid: Board = Array.from({ length: cfg.rows }, () =>
    Array<Cell>(cfg.cols).fill(0)
  );
  const queue: QueueEntry[] = [];
  const targetPieceCount =
    cfg.pieceMin + Math.floor(rng() * (cfg.pieceMax - cfg.pieceMin + 1));

  for (let i = 0; i < targetPieceCount; i++) {
    const type = PIECE_TYPES[Math.floor(rng() * PIECE_TYPES.length)];
    const rot = Math.floor(rng() * 4);
    const shape = PIECES[type].rotations[rot];

    interface Candidate {
      shifted: [number, number][];
      dropY: number;
      cells: [number, number][];
      height: number;
    }
    const candidates: Candidate[] = [];
    for (let startX = -1; startX < cfg.cols; startX++) {
      const shifted = shape.map(([x, y]) => [x + startX - 1, y] as [number, number]);
      if (shifted.some(([x]) => x < 0 || x >= cfg.cols)) continue;
      const dropY = findDropY(grid, shifted, cfg.rows, cfg.cols);
      if (dropY === null) continue;
      const cells = shifted.map(([sx, sy]) => [sx, sy + dropY] as [number, number]);
      const maxY = Math.max(...cells.map((c) => c[1]));
      candidates.push({ shifted, dropY, cells, height: cfg.rows - maxY });
    }
    if (candidates.length === 0) break;

    let chosen: { cells: [number, number][] } | undefined;

    if (cfg.overhangs && rng() < 0.35 && i > 0) {
      const liftable: { cells: [number, number][] }[] = [];
      for (const c of candidates) {
        for (let lift = 1; lift <= 3; lift++) {
          const liftedCells = c.cells.map(([x, y]) => [x, y - lift] as [number, number]);
          if (liftedCells.some(([x, y]) => y < 0 || y >= cfg.rows || x < 0 || x >= cfg.cols)) continue;
          if (liftedCells.some(([x, y]) => grid[y][x])) continue;
          let touches = false;
          for (const [x, y] of liftedCells) {
            const neighbors: [number, number][] = [
              [x - 1, y], [x + 1, y], [x, y + 1],
            ];
            for (const [nx, ny] of neighbors) {
              if (nx < 0 || nx >= cfg.cols || ny < 0 || ny >= cfg.rows) continue;
              if (grid[ny][nx]) { touches = true; break; }
            }
            if (touches) break;
          }
          if (touches) {
            liftable.push({ cells: liftedCells });
            break;
          }
        }
      }
      if (liftable.length > 0) {
        chosen = liftable[Math.floor(rng() * liftable.length)];
      }
    }

    if (!chosen) {
      if (!cfg.overhangs) {
        candidates.sort((a, b) => a.height - b.height);
        const top = candidates.slice(0, Math.max(1, Math.ceil(candidates.length * 0.4)));
        chosen = top[Math.floor(rng() * top.length)];
      } else {
        chosen = candidates[Math.floor(rng() * candidates.length)];
      }
    }

    for (const [x, y] of chosen.cells) {
      if (y >= 0 && y < cfg.rows && x >= 0 && x < cfg.cols) grid[y][x] = type;
    }
    queue.push({ type, rotation: rot });
  }

  return { target: grid, queue };
}
