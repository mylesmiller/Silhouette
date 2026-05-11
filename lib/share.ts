import type { Board } from './pieces';
import type { Difficulty } from './difficulty';

export function buildShareText(opts: {
  puzzleNo: number;
  difficulty: Difficulty;
  matchPct: number;
  elapsedMs: number;
  target: Board;
  board: Board;
  url?: string;
}): string {
  const { puzzleNo, difficulty, matchPct, elapsedMs, target, board, url } = opts;
  const emoji =
    matchPct === 100 ? '🟩' : matchPct >= 80 ? '🟨' : '🟥';
  const s = Math.floor(elapsedMs / 1000);
  const time = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const header = `stax #${String(puzzleNo).padStart(3, '0')} — ${difficulty} ${time} ${emoji}`;

  const rows = target.length;
  const cols = target[0]?.length ?? 0;
  const lines: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      const t = !!target[y][x];
      const b = !!board[y][x];
      if (t && b) line += '🟩';
      else if (t && !b) line += '⬜';
      else if (!t && b) line += '🟥';
      else line += '⬛';
    }
    lines.push(line);
  }

  return [header, '', ...lines, '', url ?? 'play: staxgame.com'].join('\n');
}
