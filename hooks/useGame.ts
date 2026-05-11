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
  // peekNow: current performance.now() value for animation tick
  peekNow: number;
  // stats for HUD
  stats: ReturnType<typeof computeStats>;
  elapsedMs: number;
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

export function useGame(): UseGame {
  const [difficulty, setDifficultyState] = useState<Difficulty>('daily');
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

  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekRafRef = useRef<number | null>(null);
  // When true, next puzzle load preserves the existing timer (failed retry)
  const keepTimerRef = useRef(false);

  // Load a puzzle whenever seed/offset/difficulty/reloadKey changes
  useEffect(() => {
    const conf = DIFFICULTIES[difficulty];
    const newDims = { cols: conf.cols, rows: conf.rows };
    const puzzle: Puzzle = generatePuzzle(seed + puzzleOffset, conf);
    const fresh = emptyBoard(newDims);
    const spawn = spawnFromQueue(puzzle.queue, 0, fresh, conf.cols, conf.rows);

    setBoard(fresh);
    setTarget(puzzle.target);
    setQueue(puzzle.queue);
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
    if (gameOver) return;
    const id = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(id);
  }, [gameOver, startedAt]);

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
        setGameOver(true);
        setSilhouetteHidden(false);
        setWon(winNow);
        setEndedAt(Date.now());
      }
    },
    [difficulty, queue, target]
  );

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (!active) return;
      const conf = DIFFICULTIES[difficulty];
      const d = { cols: conf.cols, rows: conf.rows };

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setActive((a) => (a ? gameMove(board, a, -1, d) : a));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setActive((a) => (a ? gameMove(board, a, 1, d) : a));
          break;
        case 'ArrowDown': {
          e.preventDefault();
          const res = gameSoftDrop(board, active, d);
          if (res.locked) {
            advanceAfterLock(res.board, queueIdx + 1);
          } else {
            setActive(res.active);
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const next = gameRotate(board, active, 1, d);
          if (next) setActive(next);
          break;
        }
        case ' ': {
          e.preventDefault();
          const nb = gameHardDrop(board, active, d);
          advanceAfterLock(nb, queueIdx + 1);
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, board, difficulty, gameOver, queueIdx, advanceAfterLock]);

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

  const elapsedMs = (endedAt ?? nowTick) - startedAt;

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
    peekNow,
    stats,
    elapsedMs,
  };
}
