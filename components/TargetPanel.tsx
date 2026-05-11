'use client';

import { useEffect, useRef } from 'react';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import type { Board } from '@/lib/pieces';

interface Props {
  target: Board;
  difficulty: Difficulty;
  silhouetteHidden: boolean;
  peekDeadline: number | null;
  peekNow: number;
}

function getCssColor(varName: string): string {
  if (typeof window === 'undefined') return '#000';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function drawGridLines(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  size: number
) {
  ctx.strokeStyle = getCssColor('--grid-line');
  ctx.lineWidth = 1;
  for (let x = 1; x < cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * size + 0.5, 0);
    ctx.lineTo(x * size + 0.5, rows * size);
    ctx.stroke();
  }
  for (let y = 1; y < rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * size + 0.5);
    ctx.lineTo(cols * size, y * size + 0.5);
    ctx.stroke();
  }
}

export default function TargetPanel({
  target,
  difficulty,
  silhouetteHidden,
  peekDeadline,
  peekNow,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cfg = DIFFICULTIES[difficulty];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = cfg.cols * cfg.cell;
    canvas.height = cfg.rows * cfg.cell;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = getCssColor('--paper');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGridLines(ctx, cfg.cols, cfg.rows, cfg.cell);

    if (silhouetteHidden) {
      ctx.save();
      ctx.fillStyle = 'rgba(20, 20, 20, 0.04)';
      for (let i = -cfg.rows; i < cfg.cols + cfg.rows; i += 1) {
        ctx.fillRect(i * cfg.cell, 0, 2, cfg.rows * cfg.cell);
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = 'rgba(20, 20, 20, 0.35)';
      ctx.font = `bold ${cfg.cell * 2}px Fraunces, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', canvas.width / 2, canvas.height / 2 - cfg.cell);
      ctx.font = `${cfg.cell * 0.5}px JetBrains Mono, monospace`;
      ctx.fillStyle = 'rgba(20, 20, 20, 0.5)';
      ctx.fillText('from memory', canvas.width / 2, canvas.height / 2 + cfg.cell);
      ctx.restore();
      return;
    }

    const targetColor = getCssColor('--target');
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        if (target[y][x]) {
          const px = x * cfg.cell;
          const py = y * cfg.cell;
          ctx.fillStyle = targetColor;
          ctx.fillRect(px + 1, py + 1, cfg.cell - 2, cfg.cell - 2);
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(px + cfg.cell / 2 - 1, py + cfg.cell / 2 - 1, 2, 2);
        }
      }
    }

    if (peekDeadline !== null && cfg.silhouettePeekMs) {
      const now = peekNow || performance.now();
      const remaining = Math.max(0, peekDeadline - now);
      const total = cfg.silhouettePeekMs;
      const pct = remaining / total;

      ctx.save();
      const seconds = Math.ceil(remaining / 1000);
      const pad = 12;
      const r = 22;
      const cx = canvas.width - r - pad;
      const cy = r + pad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251, 247, 239, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.2)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.strokeStyle = getCssColor('--accent');
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = getCssColor('--ink');
      ctx.font = 'bold 18px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(seconds), cx, cy);
      ctx.restore();
    }
  }, [target, cfg, silhouetteHidden, peekDeadline, peekNow]);

  return (
    <div className="well-wrap">
      <div className="well-label target">match this</div>
      <div className="well">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
