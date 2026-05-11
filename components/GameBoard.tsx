'use client';

import { useEffect, useRef } from 'react';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { PIECES, type ActivePiece, type Board } from '@/lib/pieces';
import { collides } from '@/lib/game';

interface Props {
  board: Board;
  target: Board;
  active: ActivePiece | null;
  difficulty: Difficulty;
}

function getCssColor(varName: string): string {
  if (typeof window === 'undefined') return '#000';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  size: number
) {
  const px = x * size;
  const py = y * size;
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(px + 1, py + 1, size - 2, 3);
  ctx.fillRect(px + 1, py + 1, 3, size - 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(px + 1, py + size - 4, size - 2, 3);
  ctx.fillRect(px + size - 4, py + 1, 3, size - 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
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

function drawTargetOutline(
  ctx: CanvasRenderingContext2D,
  target: Board,
  cols: number,
  rows: number,
  size: number
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.lineCap = 'round';

  const isTarget = (x: number, y: number) =>
    x >= 0 && x < cols && y >= 0 && y < rows && !!target[y][x];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!target[y][x]) continue;
      const px = x * size;
      const py = y * size;
      if (!isTarget(x, y - 1)) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + size, py);
        ctx.stroke();
      }
      if (!isTarget(x, y + 1)) {
        ctx.beginPath();
        ctx.moveTo(px, py + size);
        ctx.lineTo(px + size, py + size);
        ctx.stroke();
      }
      if (!isTarget(x - 1, y)) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + size);
        ctx.stroke();
      }
      if (!isTarget(x + 1, y)) {
        ctx.beginPath();
        ctx.moveTo(px + size, py);
        ctx.lineTo(px + size, py + size);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

export default function GameBoard({ board, target, active, difficulty }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cfg = DIFFICULTIES[difficulty];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Set canvas pixel size directly (NOT via CSS) to avoid blurring
    canvas.width = cfg.cols * cfg.cell;
    canvas.height = cfg.rows * cfg.cell;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = getCssColor('--paper');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGridLines(ctx, cfg.cols, cfg.rows, cfg.cell);

    if (cfg.showOutline) {
      drawTargetOutline(ctx, target, cfg.cols, cfg.rows, cfg.cell);
    }

    // Locked pieces
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        const cell = board[y][x];
        if (cell) {
          const c = getCssColor(PIECES[cell].color);
          drawCell(ctx, x, y, c, cfg.cell);
        }
      }
    }

    // Ghost + active piece
    if (active) {
      const shape = PIECES[active.type].rotations[active.rotation];
      const color = getCssColor(PIECES[active.type].color);

      if (cfg.showGhost) {
        let ghostY = active.y;
        while (
          !collides(board, active.type, active.x, ghostY + 1, active.rotation, {
            cols: cfg.cols,
            rows: cfg.rows,
          })
        ) {
          ghostY++;
        }
        for (const [sx, sy] of shape) {
          const gx = sx + active.x;
          const gy = sy + ghostY;
          if (gy >= 0 && gy < cfg.rows && gx >= 0 && gx < cfg.cols) {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.18;
            ctx.fillRect(gx * cfg.cell + 2, gy * cfg.cell + 2, cfg.cell - 4, cfg.cell - 4);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(gx * cfg.cell + 2, gy * cfg.cell + 2, cfg.cell - 4, cfg.cell - 4);
            ctx.setLineDash([]);
          }
        }
      }

      for (const [sx, sy] of shape) {
        const gx = sx + active.x;
        const gy = sy + active.y;
        if (gy >= 0 && gy < cfg.rows && gx >= 0 && gx < cfg.cols) {
          drawCell(ctx, gx, gy, color, cfg.cell);
        }
      }
    }
  }, [board, target, active, cfg]);

  return (
    <div className="well-wrap">
      <div className="well-label">your board ↓</div>
      <div className="well">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
