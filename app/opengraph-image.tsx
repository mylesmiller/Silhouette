import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'STAX — daily stacking puzzle';

export default async function OG() {
  const cyan = '#4ad6e6';
  const ink = '#f4efe6';
  const bg = '#0f1013';
  const cell = 80;

  // Logo cells: same pattern as the in-app SVG (4 cols x 3 rows)
  const cyanCells: [number, number][] = [
    [1, 0], [2, 0], [3, 0], [2, 1],
  ];
  const inkCells: [number, number][] = [
    [0, 1], [0, 2], [1, 2],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: bg,
          color: ink,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <div
            style={{
              position: 'relative',
              width: 4 * cell,
              height: 3 * cell,
              display: 'flex',
            }}
          >
            {cyanCells.map(([x, y]) => (
              <div
                key={`c${x}${y}`}
                style={{
                  position: 'absolute',
                  left: x * cell,
                  top: y * cell,
                  width: cell,
                  height: cell,
                  background: cyan,
                }}
              />
            ))}
            {inkCells.map(([x, y]) => (
              <div
                key={`i${x}${y}`}
                style={{
                  position: 'absolute',
                  left: x * cell,
                  top: y * cell,
                  width: cell,
                  height: cell,
                  background: ink,
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 240,
              fontWeight: 800,
              letterSpacing: -8,
              lineHeight: 1,
            }}
          >
            stax.
          </div>
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 36,
            color: '#9aa0a6',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          a daily stacking puzzle
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            color: '#9aa0a6',
          }}
        >
          staxgame.com
        </div>
      </div>
    ),
    { ...size }
  );
}
