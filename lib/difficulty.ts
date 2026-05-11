export type Difficulty = 'easy' | 'medium' | 'hard';

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
  overhangs: boolean;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'easy',
    cols: 8,
    rows: 12,
    cell: 32,
    pieceMin: 5,
    pieceMax: 6,
    showOutline: true,
    showSilhouette: true,
    silhouettePeekMs: null,
    showGhost: true,
    showQueue: true,
    overhangs: false,
  },
  medium: {
    label: 'medium',
    cols: 9,
    rows: 14,
    cell: 28,
    pieceMin: 8,
    pieceMax: 10,
    showOutline: false,
    showSilhouette: true,
    silhouettePeekMs: null,
    showGhost: true,
    showQueue: true,
    overhangs: false,
  },
  hard: {
    label: 'hard',
    cols: 10,
    rows: 16,
    cell: 24,
    pieceMin: 12,
    pieceMax: 15,
    showOutline: false,
    showSilhouette: true,
    silhouettePeekMs: 5000,
    showGhost: false,
    showQueue: true,
    overhangs: false,
  },
};
