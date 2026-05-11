'use client';

interface Props {
  elapsedMs: number;
  canUndo: boolean;
  onUndo: () => void;
  onNewPuzzle: () => void;
  onReset: () => void;
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function HUD({ elapsedMs, canUndo, onUndo, onNewPuzzle, onReset }: Props) {
  return (
    <div className="hud">
      <div className="stats">
        <div className="stat">
          <div className="stat-label">time</div>
          <div className="stat-value">{formatTime(elapsedMs)}</div>
        </div>
      </div>

      <div className="controls-hint">
        <span><kbd>←</kbd> <kbd>→</kbd> move</span>
        <span><kbd>↑</kbd> rotate</span>
        <span><kbd>↓</kbd> soft drop</span>
        <span><kbd>space</kbd> hard drop</span>
      </div>

      <div className="buttons">
        <button onClick={onUndo} disabled={!canUndo}>undo</button>
        <button onClick={onNewPuzzle}>new puzzle</button>
        <button className="primary" onClick={onReset}>
          restart
        </button>
      </div>
    </div>
  );
}
