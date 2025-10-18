export function createSeededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return function random() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const t = (h ^= h >>> 16) >>> 0;
    return t / 4294967296;
  };
}

export function pickOne<T>(values: T[], random: () => number) {
  if (!values.length) {
    throw new Error("Cannot pick from empty array");
  }
  const index = Math.floor(random() * values.length);
  return values[index];
}

export function randomBetween(min: number, max: number, random: () => number) {
  return min + (max - min) * random();
}

export function randomInt(min: number, max: number, random: () => number) {
  return Math.round(randomBetween(min, max, random));
}
