'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import GameBoard from '@/components/GameBoard';
import QueuePanel from '@/components/QueuePanel';
import TargetPanel from '@/components/TargetPanel';
import DifficultyBar from '@/components/DifficultyBar';
import HUD from '@/components/HUD';
import ResultModal from '@/components/ResultModal';
import HowToPlay from '@/components/HowToPlay';
import { DIFFICULTIES } from '@/lib/difficulty';

const HOWTO_KEY = 'silhouette-seen-howto';

export default function Page() {
  const { state, stats, setDifficulty, newPuzzle, reset, retryKeepTime, undo, canUndo, peekNow, elapsedMs } = useGame();
  const [modalOpen, setModalOpen] = useState(false);
  const [howtoOpen, setHowtoOpen] = useState(false);

  useEffect(() => {
    if (state.gameOver) setModalOpen(true);
  }, [state.gameOver]);

  useEffect(() => {
    if (!state.gameOver) setModalOpen(false);
  }, [state.gameOver, state.seed, state.puzzleOffset, state.difficulty]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(HOWTO_KEY)) setHowtoOpen(true);
    } catch {}
  }, []);

  const closeHowto = () => {
    setHowtoOpen(false);
    try {
      localStorage.setItem(HOWTO_KEY, '1');
    } catch {}
  };

  return (
    <div className="app">
      <header className="header-centered">
        <h1 className="brand-title">stax.</h1>
        <button
          className="help-btn header-help"
          aria-label="how to play"
          onClick={() => setHowtoOpen(true)}
        >
          ?
        </button>
      </header>

      <div className="layout">
        <aside className="side-difficulty">
          <DifficultyBar difficulty={state.difficulty} onChange={setDifficulty} />
        </aside>

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
            silhouetteHidden={
              state.silhouetteHidden ||
              (!state.gameOver && !DIFFICULTIES[state.difficulty].showSilhouette)
            }
            peekDeadline={state.peekDeadline}
            peekNow={peekNow}
          />
        </section>
      </div>

      <HUD
        elapsedMs={elapsedMs}
        canUndo={canUndo}
        onUndo={undo}
        onNewPuzzle={newPuzzle}
        onReset={retryKeepTime}
      />

      <ResultModal
        open={modalOpen}
        won={state.won}
        matchPct={stats.pct}
        overflow={stats.overflow}
        difficulty={state.difficulty}
        puzzleNo={1 + state.puzzleOffset}
        elapsedMs={elapsedMs}
        target={state.target}
        board={state.board}
        onClose={() => setModalOpen(false)}
        onContinue={() => {
          setModalOpen(false);
          if (state.won) newPuzzle();
          else retryKeepTime();
        }}
        onNextDifficulty={(next) => {
          setModalOpen(false);
          setDifficulty(next);
        }}
      />

      <HowToPlay open={howtoOpen} onClose={closeHowto} />
    </div>
  );
}
