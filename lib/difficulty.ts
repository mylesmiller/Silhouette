export type Difficulty = 'daily' | 'hard';

export interface DifficultyConfig {
  label: string;
  cols: number;
  rows: number;
  cell: number;
  pieceMin: number;
  pieceMax: number;
  showOutline: boolean;
  showSilhouette: boolean;
  silhouettePeekMs: number | null;
  showGhost: boolean;
  showQueue: boolean;
  queueLookahead: number;
  overhangs: boolean;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  daily: {
    label: 'daily',
    cols: 8,
    rows: 12,
    cell: 44,
    pieceMin: 5,
    pieceMax: 6,
    showOutline: true,
    showSilhouette: true,
    silhouettePeekMs: null,
    showGhost: true,
    showQueue: true,
    queueLookahead: 7,
    overhangs: false,
  },
  hard: {
    label: 'hard',
    cols: 9,
    rows: 14,
    cell: 38,
    pieceMin: 8,
    pieceMax: 10,
    showOutline: true,
    showSilhouette: true,
    silhouettePeekMs: null,
    showGhost: true,
    showQueue: true,
    queueLookahead: 5,
    overhangs: false,
  },
};
