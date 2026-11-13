// 接饭。时间用毫秒，概率用 0–1 的小数。
export const DIFFICULTY_CONFIG = {
  correctPerStage: 20,
  pickyCueMs: 600,
  probabilities: {
    // 泡泡的长期占比。非零值可设为 0.01 到 2/3，仍最多连续出现两个泡泡。
    beforePicky: 0.25,
    withPicky: 0.15,
    forbiddenFood: 0.10
  },
  // flightMs 是从落下到触地的作答时间。gap 是触地后的出题间隔。
  // wrappedFraction 是泡泡里装食物的比例。挑食开启后持续到本局结束。
  stages: [
    { flightMs: 900, gapMinMs: 800, gapMaxMs: 1000, wrappedFraction: 0,    picky: false },
    { flightMs: 900, gapMinMs: 800, gapMaxMs: 1000, wrappedFraction: 0,    picky: true },
    { flightMs: 900, gapMinMs: 800, gapMaxMs: 1000, wrappedFraction: 0.15, picky: true },
    { flightMs: 900, gapMinMs: 700, gapMaxMs: 1100, wrappedFraction: 0.15, picky: true },
    { flightMs: 750, gapMinMs: 700, gapMaxMs: 1100, wrappedFraction: 0.15, picky: true },
    { flightMs: 750, gapMinMs: 700, gapMaxMs: 1100, wrappedFraction: 0.30, picky: true },
    { flightMs: 750, gapMinMs: 600, gapMaxMs: 1200, wrappedFraction: 0.30, picky: true },
    { flightMs: 600, gapMinMs: 600, gapMaxMs: 1200, wrappedFraction: 0.30, picky: true },
    { flightMs: 600, gapMinMs: 600, gapMaxMs: 1200, wrappedFraction: 0.45, picky: true },
    { flightMs: 600, gapMinMs: 500, gapMaxMs: 1300, wrappedFraction: 0.45, picky: true },
    { flightMs: 600, gapMinMs: 500, gapMaxMs: 1300, wrappedFraction: 0.60, picky: true },
    { flightMs: 450, gapMinMs: 500, gapMaxMs: 1300, wrappedFraction: 0.60, picky: true },
    { flightMs: 450, gapMinMs: 400, gapMaxMs: 1400, wrappedFraction: 0.60, picky: true },
    { flightMs: 450, gapMinMs: 400, gapMaxMs: 1400, wrappedFraction: 0.75, picky: true }
  ]
};
