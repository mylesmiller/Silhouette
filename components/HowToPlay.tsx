'use client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HowToPlay({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="howto-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="howto-card">
        <button className="howto-close" aria-label="close" onClick={onClose}>
          ×
        </button>
        <h2>How to Play</h2>
        <p className="howto-sub">
          Rebuild the gray silhouette using the falling pieces. 100% match,
          zero overflow.
        </p>

        <div className="howto-inner">
          <div className="howto-row">
            <div className="howto-swatch silhouette" />
            <div className="howto-text">
              <strong>Match the silhouette</strong>
              <span>The gray shape on the right is your goal.</span>
            </div>
          </div>

          <div className="howto-divider" />

          <div className="howto-keys">
            <div><kbd>←</kbd> <kbd>→</kbd> move &nbsp; <kbd>↑</kbd> rotate</div>
            <div><kbd>↓</kbd> soft drop &nbsp; <kbd>space</kbd> hard drop</div>
          </div>

          <div className="howto-divider" />

          <div className="howto-row small">
            <div className="howto-pill easy">DAILY</div>
            <span>Today&apos;s puzzle — small board, a few pieces.</span>
          </div>
          <div className="howto-row small">
            <div className="howto-pill hard">HARD</div>
            <span>Same board, more pieces.</span>
          </div>
        </div>

        <button className="howto-cta" onClick={onClose}>
          let&apos;s play
        </button>
      </div>
    </div>
  );
}
