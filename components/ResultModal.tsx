'use client';

import { useMemo, useState } from 'react';
import type { Difficulty } from '@/lib/difficulty';
import type { Board } from '@/lib/pieces';
import { buildShareText } from '@/lib/share';

interface Props {
  open: boolean;
  won: boolean;
  matchPct: number;
  overflow: number;
  difficulty: Difficulty;
  puzzleNo: number;
  elapsedMs: number;
  target: Board;
  board: Board;
  onClose: () => void;
  onContinue: () => void;
  onNextDifficulty?: (next: Difficulty) => void;
}

const NEXT: Record<Difficulty, Difficulty | null> = {
  daily: 'hard',
  hard: null,
};

function fmtTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function ResultModal({
  open,
  won,
  matchPct,
  overflow,
  difficulty,
  puzzleNo,
  elapsedMs,
  target,
  board,
  onClose,
  onContinue,
  onNextDifficulty,
}: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = useMemo(() => {
    if (!open) return '';
    return buildShareText({
      puzzleNo,
      difficulty,
      matchPct,
      elapsedMs,
      target,
      board,
      url: 'www.staxgames.com',
    });
  }, [open, puzzleNo, difficulty, matchPct, elapsedMs, target, board]);

  if (!open) return null;
  const next = won ? NEXT[difficulty] : null;

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {}
    }
  };

  return (
    <div
      className="modal show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`result-card${won ? '' : ' fail'}`}>
        <div className="result-header">
          {won ? 'Solved!' : 'No Match'}
        </div>

        <div className="result-body">
          <div className="result-info">
            <div className="result-info-label">
              PUZZLE #{String(puzzleNo).padStart(3, '0')} · {difficulty.toUpperCase()}
            </div>
            <div className="result-info-value">
              {won ? fmtTime(elapsedMs) : `${matchPct}% match`}
            </div>
          </div>

          <div className="result-section-label">
            {won ? 'SHARE' : 'YOUR ATTEMPT'}
          </div>
          <div className="result-share">{shareText}</div>

          <div className="result-buttons">
            <button className="result-btn outline" onClick={onShare}>
              {copied ? 'Copied!' : 'Share'}
            </button>
            {won && next && onNextDifficulty ? (
              <button
                className="result-btn primary-cta"
                onClick={() => onNextDifficulty(next)}
              >
                Try {next} →
              </button>
            ) : !won ? (
              <button className="result-btn primary-cta fail" onClick={onContinue}>
                Restart
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
