// 补船。cells 为木板格数（5–10），holes 为同时出现的破口数（2–5）。
export const DIFFICULTY_CONFIG = {
  answerMs: 7000,
  warningMs: 2000,
  promotion: {
    correctPerStage: 15,
    recentAnswers: 6,
    recentCorrect: 5,
    correctStreak: 3,
    blendAfterCorrect: 4
  },
  // 每行是低、中、高负荷比例。辨形 2、4 是相邻两种原有比例的中间档。
  loadWeights: [
    [0.60, 0.35, 0.05],
    [0.425, 0.475, 0.10],
    [0.25, 0.60, 0.15],
    [0.175, 0.575, 0.25],
    [0.10, 0.55, 0.35]
  ],
  complexityWeights: [
    [0.25, 0.70, 0.05],
    [0.15, 0.675, 0.175],
    [0.05, 0.65, 0.30],
    [0.025, 0.50, 0.475],
    [0, 0.35, 0.65]
  ],
  stages: [
    { cells: 6,  discrimination: 1, holes: 2 },
    { cells: 6,  discrimination: 1, holes: 3 },
    { cells: 6,  discrimination: 2, holes: 3 },
    { cells: 6,  discrimination: 3, holes: 3 },
    { cells: 7,  discrimination: 3, holes: 3 },
    { cells: 8,  discrimination: 3, holes: 3 },
    { cells: 8,  discrimination: 3, holes: 4 },
    { cells: 8,  discrimination: 4, holes: 4 },
    { cells: 8,  discrimination: 5, holes: 4 },
    { cells: 9,  discrimination: 5, holes: 4 },
    { cells: 10, discrimination: 5, holes: 4 },
    { cells: 10, discrimination: 5, holes: 5 }
  ]
};
