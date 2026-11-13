// 上菜。evidence 是本档无提示答对次数，口味没变的顾客可沿用上档已验证的记忆。
export const DIFFICULTY_CONFIG = {
  responseMs: 8000,
  teachingGapVisits: 2,
  // intervals 是换口味前的回忆次数。updating 档至少有一次换口味，并重新检查所有顾客。
  stages: [
    { guests: 3, meals: 4, intervals: [5],        axis: 'content',  evidence: 6 },
    { guests: 3, meals: 5, intervals: [5],        axis: 'content',  evidence: 4 },
    { guests: 3, meals: 6, intervals: [5],        axis: 'content',  evidence: 4 },
    { guests: 4, meals: 6, intervals: [5],        axis: 'content',  evidence: 6 },
    { guests: 4, meals: 7, intervals: [5],        axis: 'content',  evidence: 4 },
    { guests: 5, meals: 7, intervals: [5],        axis: 'content',  evidence: 6 },
    { guests: 5, meals: 8, intervals: [5],        axis: 'content',  evidence: 4 },
    { guests: 6, meals: 8, intervals: [5],        axis: 'content',  evidence: 6 },
    { guests: 6, meals: 9, intervals: [5],        axis: 'content',  evidence: 4 },
    { guests: 6, meals: 9, intervals: [5,5,5,4],  axis: 'updating', evidence: 7 },
    { guests: 6, meals: 9, intervals: [5,4],      axis: 'updating', evidence: 7 },
    { guests: 6, meals: 9, intervals: [5,4,4,4],  axis: 'updating', evidence: 7 },
    { guests: 6, meals: 9, intervals: [4],        axis: 'updating', evidence: 7 }
  ]
};
