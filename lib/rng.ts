// Seeded RNG — mulberry32. Deterministic for a given seed.
// Ported from mvp.html.

export function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ET (America/New_York) calendar parts for a given Date — handles EST/EDT.
function etParts(d: Date): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

// Today's puzzle seed — ET-date-based so everyone rolls over at midnight America/New_York.
// offset shifts to a future puzzle (when user hits "new puzzle").
export function dateSeed(offset = 0): number {
  const now = new Date();
  const { year, month, day } = etParts(new Date(now.getTime() + offset * 86400000));
  return year * 10000 + month * 100 + day;
}

// Puzzle number — days since launch (2026-05-11 ET), 1-indexed.
// offset shifts forward (for "new puzzle" preview).
export function puzzleNumber(offset = 0): number {
  const now = new Date();
  const { year, month, day } = etParts(new Date(now.getTime() + offset * 86400000));
  // UTC midnight of the ET calendar date — avoids DST drift when diffing days.
  const todayUtc = Date.UTC(year, month - 1, day);
  const launchUtc = Date.UTC(2026, 4, 11);
  return Math.floor((todayUtc - launchUtc) / 86400000) + 1;
}

// Milliseconds until the next midnight in America/New_York.
export function msUntilNextEtMidnight(now: Date = new Date()): number {
  const { hour, minute, second } = etParts(now);
  const elapsedSec = hour * 3600 + minute * 60 + second;
  const remainingSec = 86400 - elapsedSec;
  return remainingSec * 1000;
}
