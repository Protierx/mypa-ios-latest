import { useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { LevelData, TierDisplay, RecentXPItem, LevelReward } from '../types';
import { XP_PER_LEVEL, getTierForLevel, getTiers, getLevelRewards } from '../constants';

interface UseLevelDataReturn {
  levelData: LevelData;
  xpProgress: number;
  xpToNext: number;
  tiers: TierDisplay[];
  recentXP: RecentXPItem[];
  levelRewards: LevelReward[];
}

export const useLevelData = (): UseLevelDataReturn => {
  const { user } = useAuth();

  const currentLevel = user?.level || 1;
  const currentXP = user?.xp || 0;
  const xpForCurrentLevel = (currentLevel - 1) * XP_PER_LEVEL;
  const xpForNextLevel = currentLevel * XP_PER_LEVEL;
  const tier = getTierForLevel(currentLevel);

  const levelData: LevelData = useMemo(
    () => ({
      currentLevel,
      currentXP,
      xpForCurrentLevel,
      xpForNextLevel,
      totalXPEarned: currentXP,
      rank: tier.name,
    }),
    [currentLevel, currentXP, xpForCurrentLevel, xpForNextLevel, tier.name]
  );

  const xpProgress = useMemo(() => {
    const progress =
      ((levelData.currentXP - levelData.xpForCurrentLevel) /
        (levelData.xpForNextLevel - levelData.xpForCurrentLevel)) *
      100;
    return Math.min(Math.max(progress, 0), 100);
  }, [levelData]);

  const xpToNext = levelData.xpForNextLevel - levelData.currentXP;

  const tiers = useMemo(() => getTiers(currentLevel), [currentLevel]);
  const levelRewards = useMemo(() => getLevelRewards(currentLevel), [currentLevel]);

  // Recent XP will be empty for new users - could be fetched from API in future
  const recentXP: RecentXPItem[] = [];

  return {
    levelData,
    xpProgress,
    xpToNext,
    tiers,
    recentXP,
    levelRewards,
  };
};
