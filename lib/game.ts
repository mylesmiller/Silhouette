// Pure game logic — collisions, movement, rotation, lock.
// Operates on (board, active) and returns updated values; no globals.
// Ported from mvp.html.

import { PIECES, type ActivePiece, type Board, type PieceType } from './pieces';

export interface Dims {
  cols: number;
  rows: number;
}

export function collides(
  board: Board,
  type: PieceType,
  x: number,
  y: number,
  rotation: number,
  dims: Dims
): boolean {
  const shape = PIECES[type].rotations[rotation];
  for (const [sx, sy] of shape) {
    const gx = sx + x;
    const gy = sy + y;
    if (gx < 0 || gx >= dims.cols || gy >= dims.rows) return true;
    if (gy >= 0 && board[gy][gx]) return true;
  }
  return false;
}

export function getShape(piece: ActivePiece) {
  return PIECES[piece.type].rotations[piece.rotation];
}

// Returns a new board with the active piece locked in.
export function lockPiece(board: Board, active: ActivePiece, dims: Dims): Board {
  const next: Board = board.map((row) => row.slice());
  const shape = getShape(active);
  for (const [sx, sy] of shape) {
    const gx = sx + active.x;
    const gy = sy + active.y;
    if (gy >= 0 && gy < dims.rows && gx >= 0 && gx < dims.cols) {
      next[gy][gx] = active.type;
    }
  }
  return next;
}

// Compute the y after a hard drop (does not mutate)
export function hardDropY(board: Board, active: ActivePiece, dims: Dims): number {
  let y = active.y;
  while (!collides(board, active.type, active.x, y + 1, active.rotation, dims)) {
    y++;
  }
  return y;
}

export function move(
  board: Board,
  active: ActivePiece,
  dx: number,
  dims: Dims
): ActivePiece {
  if (!collides(board, active.type, active.x + dx, active.y, active.rotation, dims)) {
    return { ...active, x: active.x + dx };
  }
  return active;
}

// Returns either the rotated piece (with kick) or null if rotation impossible.
export function rotate(
  board: Board,
  active: ActivePiece,
  dir: number,
  dims: Dims
): ActivePiece | null {
  const newRot = (active.rotation + dir + 4) % 4;
  const kicks = [0, -1, 1, -2, 2];
  for (const k of kicks) {
    if (!collides(board, active.type, active.x + k, active.y, newRot, dims)) {
      return { ...active, x: active.x + k, rotation: newRot };
    }
  }
  return null;
}

// Soft-drop one row. Returns either { active: newActive, locked: false }
// or { board: newBoard, locked: true } if it couldn't move down.
export type SoftDropResult =
  | { locked: false; active: ActivePiece }
  | { locked: true; board: Board };

export function softDrop(board: Board, active: ActivePiece, dims: Dims): SoftDropResult {
  if (!collides(board, active.type, active.x, active.y + 1, active.rotation, dims)) {
    return { locked: false, active: { ...active, y: active.y + 1 } };
  }
  return { locked: true, board: lockPiece(board, active, dims) };
}

// Hard drop: move all the way down, then lock.
export function hardDrop(board: Board, active: ActivePiece, dims: Dims): Board {
  const y = hardDropY(board, active, dims);
  return lockPiece(board, { ...active, y }, dims);
}

// Match-percent and overflow stats vs target silhouette.
export function computeStats(board: Board, target: Board, dims: Dims) {
  let targetCells = 0, boardCells = 0, matched = 0, overflow = 0;
  for (let y = 0; y < dims.rows; y++) {
    for (let x = 0; x < dims.cols; x++) {
      const t = target[y][x] ? 1 : 0;
      const b = board[y][x] ? 1 : 0;
      if (t) targetCells++;
      if (b) boardCells++;
      if (t && b) matched++;
      if (b && !t) overflow++;
    }
  }
  const pct = targetCells === 0 ? 0 : Math.round((matched / targetCells) * 100);
  return { pct, overflow, matched, targetCells, boardCells };
}

export function isWin(board: Board, target: Board, dims: Dims): boolean {
  const s = computeStats(board, target, dims);
  return s.pct === 100 && s.overflow === 0;
}

export function emptyBoard(dims: Dims): Board {
  return Array.from({ length: dims.rows }, () => Array(dims.cols).fill(0) as (PieceType | 0)[]);
}
