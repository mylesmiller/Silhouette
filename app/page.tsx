'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import GameBoard from '@/components/GameBoard';
import QueuePanel from '@/components/QueuePanel';
import TargetPanel from '@/components/TargetPanel';
import DifficultyBar from '@/components/DifficultyBar';
import HUD from '@/components/HUD';
import ResultModal from '@/components/ResultModal';

export default function Page() {
  const { state, stats, setDifficulty, newPuzzle, reset, peekNow } = useGame();
  const [modalOpen, setModalOpen] = useState(false);
  const [dateLine, setDateLine] = useState('');

  // Open modal when game ends
  useEffect(() => {
    if (state.gameOver) setModalOpen(true);
  }, [state.gameOver]);

  // Close modal whenever a new puzzle is loaded (gameOver flips back to false)
  useEffect(() => {
    if (!state.gameOver) setModalOpen(false);
  }, [state.gameOver, state.seed, state.puzzleOffset, state.difficulty]);

  // Render today's date on client only (avoids SSR/CSR mismatch)
  useEffect(() => {
    const today = new Date();
    setDateLine(
      today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    );
  }, []);

  const piecesLeft = Math.max(0, state.queue.length - state.queueIdx);
  const puzzleNo = 'PUZZLE #' + String(1 + state.puzzleOffset).padStart(3, '0');

  return (
    <div className="app">
      <header>
        <div className="brand">
          <h1>silhouette.</h1>
          <div className="sub">a daily tetris puzzle</div>
        </div>
        <div className="meta">
          <div className="puzzle-no">{puzzleNo}</div>
          <div>{dateLine}</div>
          <div>seed-based · same for everyone</div>
        </div>
      </header>

      <DifficultyBar difficulty={state.difficulty} onChange={setDifficulty} />

      <section className="wells">
        <GameBoard
          board={state.board}
          target={state.target}
          active={state.active}
          difficulty={state.difficulty}
        />
        <QueuePanel
          queue={state.queue}
          queueIdx={state.queueIdx}
          difficulty={state.difficulty}
        />
        <TargetPanel
          target={state.target}
          difficulty={state.difficulty}
          silhouetteHidden={state.silhouetteHidden}
          peekDeadline={state.peekDeadline}
          peekNow={peekNow}
        />
      </section>

      <HUD
        piecesLeft={piecesLeft}
        matchPct={stats.pct}
        overflow={stats.overflow}
        onNewPuzzle={newPuzzle}
        onReset={reset}
      />

      <ResultModal
        open={modalOpen}
        won={state.won}
        matchPct={stats.pct}
        overflow={stats.overflow}
        onClose={() => setModalOpen(false)}
        onContinue={() => {
          setModalOpen(false);
          if (state.won) newPuzzle();
          else reset();
        }}
      />
    </div>
  );
}
