'use client';

import type { Difficulty } from '@/lib/difficulty';

interface Props {
  difficulty: Difficulty;
  onChange: (d: Difficulty) => void;
}

const TIERS: { id: Difficulty; meta: string }[] = [
  { id: 'easy', meta: '8×12 · 5-6 pieces · outline' },
  { id: 'medium', meta: '9×14 · 8-10 pieces' },
  { id: 'hard', meta: '10×16 · 12-15 · 5s peek then memory' },
];

export default function DifficultyBar({ difficulty, onChange }: Props) {
  return (
    <div className="difficulty-bar">
      {TIERS.map((t) => (
        <button
          key={t.id}
          className={`diff-btn${difficulty === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="diff-name">{t.id}</span>
          <span className="diff-meta">{t.meta}</span>
        </button>
      ))}
    </div>
  );
}
