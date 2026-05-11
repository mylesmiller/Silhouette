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

// Today's puzzle seed — date-based so everyone gets the same puzzle.
// offset shifts to a future puzzle (when user hits "new puzzle").
export function dateSeed(offset = 0): number {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
