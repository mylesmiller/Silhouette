'use client';

interface Props {
  piecesLeft: number;
  matchPct: number;
  overflow: number;
  onNewPuzzle: () => void;
  onReset: () => void;
}

export default function HUD({ piecesLeft, matchPct, overflow, onNewPuzzle, onReset }: Props) {
  const matchClass =
    'stat-value' + (matchPct === 100 && overflow === 0 ? ' match' : '');
  const overflowClass = 'stat-value' + (overflow > 0 ? ' over' : '');

  return (
    <div className="hud">
      <div className="stats">
        <div className="stat">
          <div className="stat-label">pieces left</div>
          <div className="stat-value">{piecesLeft}</div>
        </div>
        <div className="stat">
          <div className="stat-label">match</div>
          <div className={matchClass}>{matchPct}%</div>
        </div>
        <div className="stat">
          <div className="stat-label">overflow</div>
          <div className={overflowClass}>{overflow}</div>
        </div>
      </div>

      <div className="controls-hint">
        <kbd>←</kbd> <kbd>→</kbd> move &nbsp;·&nbsp; <kbd>↑</kbd> / <kbd>X</kbd> rotate &nbsp;·&nbsp; <kbd>Z</kbd> rotate ccw
        <br />
        <kbd>↓</kbd> soft drop &nbsp;·&nbsp; <kbd>space</kbd> hard drop
      </div>

      <div className="buttons">
        <button onClick={onNewPuzzle}>new puzzle</button>
        <button className="primary" onClick={onReset}>
          restart
        </button>
      </div>
    </div>
  );
}
