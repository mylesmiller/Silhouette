'use client';

interface Props {
  open: boolean;
  won: boolean;
  matchPct: number;
  overflow: number;
  onClose: () => void;
  onContinue: () => void;
}

export default function ResultModal({
  open,
  won,
  matchPct,
  overflow,
  onClose,
  onContinue,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="modal show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-card${won ? '' : ' fail'}`}>
        <h2>{won ? 'solved!' : 'no match'}</h2>
        <div className="scribble">{won ? 'beautifully matched' : 'so close'}</div>
        <p>
          {won
            ? 'You rebuilt the silhouette perfectly. Come back tomorrow for a new puzzle.'
            : `You matched ${matchPct}% with ${overflow} overflow cells. Try again?`}
        </p>
        <button className="primary" onClick={onContinue}>
          {won ? 'try another' : 'try again'}
        </button>
      </div>
    </div>
  );
}
