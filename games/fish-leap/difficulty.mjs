export const NET_CD_MS = 600;
export const EVOLUTION_MS = 12500;
export const TIER_MIN_MS = 37000;
export const OPENING_FISH = 3;

const TIER_COUNT = 12;

function interpolateRange(start, end, progress) {
  return start.map((value, i) => Math.round(value + (end[i] - value) * progress));
}

export const TIERS = Array.from({length: TIER_COUNT}, (_, index) => {
  const progress = index / (TIER_COUNT - 1);
  if (index === TIER_COUNT - 1) {
    return {birth: [1250, 1700], ordinaryStay: [8900, 10900], evolutionWait: [5800, 7100]};
  }
  return {
    birth: interpolateRange([2100, 2800], [1250, 1700], progress),
    ordinaryStay: interpolateRange([6200, 8500], [8900, 11100], progress),
    evolutionWait: interpolateRange([9000, 10300], [5600, 6900], progress),
  };
});
