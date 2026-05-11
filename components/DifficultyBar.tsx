'use client';

import type { Difficulty } from '@/lib/difficulty';

interface Props {
  difficulty: Difficulty;
  onChange: (d: Difficulty) => void;
}

const TIERS: Difficulty[] = ['daily', 'hard'];

export default function DifficultyBar({ difficulty, onChange }: Props) {
  return (
    <div className="difficulty-bar">
      {TIERS.map((id) => (
        <button
          key={id}
          className={`diff-btn${difficulty === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
        >
          <span className="diff-name">{id}</span>
        </button>
      ))}
    </div>
  );
}
