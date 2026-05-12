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
import TouchControls from '@/components/TouchControls';
import { DIFFICULTIES } from '@/lib/difficulty';
import { puzzleNumber } from '@/lib/rng';

const HOWTO_KEY = 'silhouette-seen-howto';

export default function Page() {
  const { state, stats, setDifficulty, newPuzzle, reset, retryKeepTime, undo, canUndo, peekNow, elapsedMs, moveLeft, moveRight, rotateCW, softDrop, hardDrop, setPaused } = useGame();
  const [modalOpen, setModalOpen] = useState(false);
  const [howtoOpen, setHowtoOpen] = useState(false);

  useEffect(() => {
    if (state.gameOver) setModalOpen(true);
    else setModalOpen(false);
  }, [state.gameOver, state.seed, state.puzzleOffset, state.difficulty]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(HOWTO_KEY)) setHowtoOpen(true);
    } catch {}
  }, []);

  useEffect(() => {
    setPaused(howtoOpen);
  }, [howtoOpen, setPaused]);

  const closeHowto = () => {
    setHowtoOpen(false);
    try {
      localStorage.setItem(HOWTO_KEY, '1');
    } catch {}
  };

  return (
    <div className="app">
      <header className="header-centered">
        <div className="brand-stack">
          <svg className="brand-logo" viewBox="0 0 4 3" aria-hidden="true">
            <rect x="1" y="0" width="1" height="1" fill="var(--c-I)" />
            <rect x="2" y="0" width="1" height="1" fill="var(--c-I)" />
            <rect x="3" y="0" width="1" height="1" fill="var(--c-I)" />
            <rect x="2" y="1" width="1" height="1" fill="var(--c-I)" />
            <rect x="1" y="1" width="1" height="1" fill="var(--ink)" />
            <rect x="0" y="2" width="1" height="1" fill="var(--ink)" />
            <rect x="1" y="2" width="1" height="1" fill="var(--ink)" />
            <rect x="2" y="2" width="1" height="1" fill="var(--ink)" />
          </svg>
          <h1 className="brand-title">stax.</h1>
        </div>
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

      <TouchControls
        onLeft={moveLeft}
        onRight={moveRight}
        onRotate={rotateCW}
        onSoftDrop={softDrop}
        onHardDrop={hardDrop}
      />

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
        puzzleNo={puzzleNumber(state.puzzleOffset)}
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
