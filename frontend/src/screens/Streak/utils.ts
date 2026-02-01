// Calculate XP multiplier based on streak
export const getXPMultiplier = (streak: number): number => {
  if (streak >= 60) return 3.0;
  if (streak >= 30) return 2.5;
  if (streak >= 14) return 2.0;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
};

// Calculate next milestone
export const getNextMilestone = (streak: number): number => {
  const milestones = [3, 7, 14, 30, 60, 100];
  return milestones.find(m => m > streak) || 100;
};
