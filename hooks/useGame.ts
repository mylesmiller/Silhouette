'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { dateSeed } from '@/lib/rng';
import { generatePuzzle, type Puzzle } from '@/lib/generator';
import {
  collides,
  computeStats,
  emptyBoard,
  hardDrop as gameHardDrop,
  isWin,
  lockPiece,
  move as gameMove,
  rotate as gameRotate,
  softDrop as gameSoftDrop,
} from '@/lib/game';
import type { ActivePiece, Board, QueueEntry } from '@/lib/pieces';

export interface GameState {
  difficulty: Difficulty;
  board: Board;
  target: Board;
  queue: QueueEntry[];
  queueIdx: number;
  active: ActivePiece | null;
  gameOver: boolean;
  won: boolean;
  silhouetteHidden: boolean;
  peekDeadline: number | null;
  puzzleOffset: number;
  seed: number;
}

export interface UseGame {
  state: GameState;
  setDifficulty: (d: Difficulty) => void;
  newPuzzle: () => void;
  reset: () => void;
  retryKeepTime: () => void;
  undo: () => void;
  canUndo: boolean;
  moveLeft: () => void;
  moveRight: () => void;
  rotateCW: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  // peekNow: current performance.now() value for animation tick
  peekNow: number;
  // stats for HUD
  stats: ReturnType<typeof computeStats>;
  elapsedMs: number;
  setPaused: (paused: boolean) => void;
}

const COMPLETION_KEY_PREFIX = 'stax-completed:';

interface SavedCompletion {
  board: Board;
  elapsedMs: number;
  won: boolean;
}

function completionKey(seed: number, difficulty: Difficulty): string {
  return `${COMPLETION_KEY_PREFIX}${seed}:${difficulty}`;
}

function loadCompletion(seed: number, difficulty: Difficulty): SavedCompletion | null {
  try {
    const raw = localStorage.getItem(completionKey(seed, difficulty));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedCompletion;
    if (!parsed || !Array.isArray(parsed.board)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCompletion(seed: number, difficulty: Difficulty, data: SavedCompletion): void {
  try {
    localStorage.setItem(completionKey(seed, difficulty), JSON.stringify(data));
  } catch {}
}

function spawnFromQueue(
  queue: QueueEntry[],
  idx: number,
  board: Board,
  cols: number,
  rows: number
): { active: ActivePiece | null; gameOver: boolean } {
  if (idx >= queue.length) return { active: null, gameOver: true };
  const { type } = queue[idx];
  const candidate: ActivePiece = {
    type,
    rotation: 0,
    x: Math.floor(cols / 2) - 2,
    y: -1,
  };
  if (collides(board, candidate.type, candidate.x, candidate.y, candidate.rotation, { cols, rows })) {
    return { active: null, gameOver: true };
  }
  return { active: candidate, gameOver: false };
}

const LAST_DIFFICULTY_KEY = 'stax-last-difficulty';

function loadLastDifficulty(): Difficulty {
  try {
    const raw = localStorage.getItem(LAST_DIFFICULTY_KEY);
    if (raw === 'hard' || raw === 'daily') return raw;
  } catch {}
  return 'daily';
}

export function useGame(): UseGame {
  const [difficulty, setDifficultyState] = useState<Difficulty>('daily');

  useEffect(() => {
    const last = loadLastDifficulty();
    if (last !== 'daily') setDifficultyState(last);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LAST_DIFFICULTY_KEY, difficulty);
    } catch {}
  }, [difficulty]);
  const [puzzleOffset, setPuzzleOffset] = useState(0);
  const [seed, setSeed] = useState<number>(() => dateSeed());

  const cfg = DIFFICULTIES[difficulty];
  const dims = useMemo(() => ({ cols: cfg.cols, rows: cfg.rows }), [cfg.cols, cfg.rows]);

  // We generate the puzzle in a state initializer based on seed+offset+difficulty.
  // To keep the "first paint" deterministic we lazily init.
  const [board, setBoard] = useState<Board>(() => emptyBoard(dims));
  const [target, setTarget] = useState<Board>(() => emptyBoard(dims));
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [active, setActive] = useState<ActivePiece | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [silhouetteHidden, setSilhouetteHidden] = useState(false);
  const [peekDeadline, setPeekDeadline] = useState<number | null>(null);
  const [peekNow, setPeekNow] = useState(0);
  // bumped whenever we want to (re)load a puzzle
  const [reloadKey, setReloadKey] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedAccumMs, setPausedAccumMs] = useState<number>(0);

  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekRafRef = useRef<number | null>(null);
  // When true, next puzzle load preserves the existing timer (failed retry)
  const keepTimerRef = useRef(false);
  // Stack of {board, queueIdx} snapshots taken right before each piece locks
  const historyRef = useRef<{ board: Board; queueIdx: number }[]>([]);

  // Load a puzzle whenever seed/offset/difficulty/reloadKey changes
  useEffect(() => {
    const conf = DIFFICULTIES[difficulty];
    const newDims = { cols: conf.cols, rows: conf.rows };
    const puzzle: Puzzle = generatePuzzle(seed + puzzleOffset, conf);
    const fresh = emptyBoard(newDims);
    const spawn = spawnFromQueue(puzzle.queue, 0, fresh, conf.cols, conf.rows);

    const saved = puzzleOffset === 0 ? loadCompletion(seed, difficulty) : null;

    setTarget(puzzle.target);
    setQueue(puzzle.queue);
    historyRef.current = [];
    if (saved) {
      setBoard(saved.board);
      setQueueIdx(puzzle.queue.length);
      setActive(null);
      setGameOver(true);
      setWon(saved.won);
      const now = Date.now();
      setStartedAt(now - saved.elapsedMs);
      setEndedAt(now);
      setNowTick(now);
      setPausedAccumMs(0);
      setPausedAt(null);
      setSilhouetteHidden(false);
      setPeekDeadline(null);
      if (peekTimerRef.current) {
        clearTimeout(peekTimerRef.current);
        peekTimerRef.current = null;
      }
      if (peekRafRef.current) {
        cancelAnimationFrame(peekRafRef.current);
        peekRafRef.current = null;
      }
      keepTimerRef.current = false;
      return;
    }

    setBoard(fresh);
    setQueueIdx(0);
    setActive(spawn.active);
    setGameOver(spawn.gameOver);
    setWon(false);
    const now = Date.now();
    if (keepTimerRef.current) {
      // Failed-retry: keep the existing startedAt, just clear endedAt
      setEndedAt(null);
      setNowTick(now);
      keepTimerRef.current = false;
    } else {
      setStartedAt(now);
      setEndedAt(null);
      setNowTick(now);
      setPausedAccumMs(0);
      setPausedAt(null);
    }

    // Cancel any previous peek timers
    if (peekTimerRef.current) {
      clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }
    if (peekRafRef.current) {
      cancelAnimationFrame(peekRafRef.current);
      peekRafRef.current = null;
    }

    if (conf.silhouettePeekMs) {
      setSilhouetteHidden(false);
      const deadline = performance.now() + conf.silhouettePeekMs;
      setPeekDeadline(deadline);
      peekTimerRef.current = setTimeout(() => {
        setSilhouetteHidden(true);
        setPeekDeadline(null);
        peekTimerRef.current = null;
      }, conf.silhouettePeekMs);
      const tick = () => {
        setPeekNow(performance.now());
        peekRafRef.current = requestAnimationFrame(tick);
      };
      peekRafRef.current = requestAnimationFrame(tick);
    } else {
      setSilhouetteHidden(false);
      setPeekDeadline(null);
    }

    return () => {
      if (peekTimerRef.current) {
        clearTimeout(peekTimerRef.current);
        peekTimerRef.current = null;
      }
      if (peekRafRef.current) {
        cancelAnimationFrame(peekRafRef.current);
        peekRafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, seed, puzzleOffset, reloadKey]);

  // Stop the peek RAF once peekDeadline becomes null
  useEffect(() => {
    if (peekDeadline === null && peekRafRef.current) {
      cancelAnimationFrame(peekRafRef.current);
      peekRafRef.current = null;
    }
  }, [peekDeadline]);

  // Tick the clock every second while playing
  useEffect(() => {
    if (gameOver || pausedAt !== null) return;
    const id = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(id);
  }, [gameOver, startedAt, pausedAt]);

  const setPaused = useCallback((paused: boolean) => {
    if (paused) {
      setPausedAt((prev) => (prev === null ? Date.now() : prev));
    } else {
      setPausedAt((prev) => {
        if (prev === null) return null;
        setPausedAccumMs((acc) => acc + (Date.now() - prev));
        setNowTick(Date.now());
        return null;
      });
    }
  }, []);

  // Helper: spawn next piece from the queue and possibly trigger game over / win
  const advanceAfterLock = useCallback(
    (newBoard: Board, newIdx: number) => {
      const conf = DIFFICULTIES[difficulty];
      const spawn = spawnFromQueue(queue, newIdx, newBoard, conf.cols, conf.rows);
      setBoard(newBoard);
      setQueueIdx(newIdx);
      setActive(spawn.active);
      // End game on either queue exhaust OR successful match (early win)
      const winNow = isWin(newBoard, target, { cols: conf.cols, rows: conf.rows });
      if (winNow || spawn.gameOver) {
        const endTime = Date.now();
        setGameOver(true);
        setSilhouetteHidden(false);
        setWon(winNow);
        setEndedAt(endTime);
        if (puzzleOffset === 0 && !loadCompletion(seed, difficulty)) {
          const finalElapsedMs = endTime - startedAt - pausedAccumMs;
          saveCompletion(seed, difficulty, {
            board: newBoard,
            elapsedMs: finalElapsedMs,
            won: winNow,
          });
        }
      }
    },
    [difficulty, queue, target, puzzleOffset, seed, startedAt, pausedAccumMs]
  );

  const undo = useCallback(() => {
    const snap = historyRef.current.pop();
    if (!snap) return;
    const conf = DIFFICULTIES[difficulty];
    setBoard(snap.board);
    setQueueIdx(snap.queueIdx);
    setGameOver(false);
    setWon(false);
    setEndedAt(null);
    const spawn = spawnFromQueue(queue, snap.queueIdx, snap.board, conf.cols, conf.rows);
    setActive(spawn.active);
  }, [difficulty, queue]);

  const moveLeft = useCallback(() => {
    if (gameOver || !active) return;
    const conf = DIFFICULTIES[difficulty];
    setActive((a) => (a ? gameMove(board, a, -1, { cols: conf.cols, rows: conf.rows }) : a));
  }, [active, board, difficulty, gameOver]);

  const moveRight = useCallback(() => {
    if (gameOver || !active) return;
    const conf = DIFFICULTIES[difficulty];
    setActive((a) => (a ? gameMove(board, a, 1, { cols: conf.cols, rows: conf.rows }) : a));
  }, [active, board, difficulty, gameOver]);

  const rotateCW = useCallback(() => {
    if (gameOver || !active) return;
    const conf = DIFFICULTIES[difficulty];
    const next = gameRotate(board, active, 1, { cols: conf.cols, rows: conf.rows });
    if (next) setActive(next);
  }, [active, board, difficulty, gameOver]);

  const softDrop = useCallback(() => {
    if (gameOver || !active) return;
    const conf = DIFFICULTIES[difficulty];
    const d = { cols: conf.cols, rows: conf.rows };
    const res = gameSoftDrop(board, active, d);
    if (res.locked) {
      historyRef.current.push({ board, queueIdx });
      advanceAfterLock(res.board, queueIdx + 1);
    } else {
      setActive(res.active);
    }
  }, [active, board, difficulty, gameOver, queueIdx, advanceAfterLock]);

  const hardDrop = useCallback(() => {
    if (gameOver || !active) return;
    const conf = DIFFICULTIES[difficulty];
    const nb = gameHardDrop(board, active, { cols: conf.cols, rows: conf.rows });
    historyRef.current.push({ board, queueIdx });
    advanceAfterLock(nb, queueIdx + 1);
  }, [active, board, difficulty, gameOver, queueIdx, advanceAfterLock]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        undo();
        return;
      }
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          softDrop();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotateCW();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, moveLeft, moveRight, softDrop, rotateCW, hardDrop]);

  const setDifficulty = useCallback((d: Difficulty) => {
    setDifficultyState(d);
    // Difficulty change triggers reload via effect
  }, []);

  const newPuzzle = useCallback(() => {
    setPuzzleOffset((o) => o + 1);
  }, []);

  const reset = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const retryKeepTime = useCallback(() => {
    keepTimerRef.current = true;
    setReloadKey((k) => k + 1);
  }, []);

  const stats = useMemo(
    () => computeStats(board, target, dims),
    [board, target, dims]
  );

  const liveNow = pausedAt ?? nowTick;
  const elapsedMs = (endedAt ?? liveNow) - startedAt - pausedAccumMs;

  return {
    state: {
      difficulty,
      board,
      target,
      queue,
      queueIdx,
      active,
      gameOver,
      won,
      silhouetteHidden,
      peekDeadline,
      puzzleOffset,
      seed,
    },
    setDifficulty,
    newPuzzle,
    reset,
    retryKeepTime,
    undo,
    canUndo: queueIdx > 0 && !gameOver,
    moveLeft,
    moveRight,
    rotateCW,
    softDrop,
    hardDrop,
    peekNow,
    stats,
    elapsedMs,
    setPaused,
  };
}
