export const ROUND_MS = 30000;

const STARS_PER_STAGE = 4;

export const DIFFICULTY = [
  {clouds: 3, steps: 2, axes: 1, operations: 2, mixed: [0, 1], unit: 5, regroups: [0, 0], thinkMs: 4000},
  {clouds: 3, steps: 2, axes: 2, operations: 2, mixed: [0, 1], unit: 5, regroups: [0, 1], thinkMs: 4800},
  {clouds: 3, steps: 2, axes: 2, operations: 2, mixed: [0, 1], unit: 2, regroups: [0, 1], thinkMs: 5200},
  {clouds: 3, steps: 2, axes: 2, operations: 3, mixed: [0, 1], unit: 2, regroups: [0, 1], thinkMs: 5500},
  {clouds: 4, steps: 2, axes: 2, operations: 3, mixed: [1, 1], unit: 2, regroups: [0, 1], thinkMs: 5800},
  {clouds: 4, steps: 2, axes: 2, operations: 3, mixed: [1, 1], unit: 1, regroups: [0, 1], thinkMs: 6000},
  {clouds: 4, steps: 2, axes: 2, operations: 3, mixed: [1, 1], unit: 1, regroups: [1, 2], thinkMs: 6200},
  {clouds: 4, steps: 3, axes: 2, operations: 4, mixed: [1, 1], unit: 1, regroups: [1, 2], thinkMs: 6300},
  {clouds: 4, steps: 3, axes: 2, operations: 5, mixed: [1, 1], unit: 1, regroups: [1, 2], thinkMs: 6500},
  {clouds: 4, steps: 3, axes: 2, operations: 6, mixed: [2, 2], unit: 1, regroups: [1, 2], thinkMs: 7000},
  {clouds: 5, steps: 3, axes: 2, operations: 6, mixed: [2, 2], unit: 1, regroups: [1, 2], thinkMs: 7400},
  {clouds: 5, steps: 3, axes: 2, operations: 6, mixed: [2, 2], unit: 1, regroups: [2, 3]},
].map((level, index) => ({...level, stars: index * STARS_PER_STAGE}));

export function difficultyAt(stars) {
  const index = DIFFICULTY.findLastIndex(level => stars >= level.stars);
  return {...DIFFICULTY[index], stage: index + 1};
}
