import React from 'react';
import { ScrollView } from 'react-native';
import { LevelScreenProps } from './types';
import { styles } from './styles';
import {
  Header,
  MainCard,
  RankProgression,
  RecentXPSection,
  LevelRewardsSection,
} from './components';
import { useLevelData } from './hooks';

export const LevelScreen: React.FC<LevelScreenProps> = ({ navigation }) => {
  const { levelData, xpProgress, xpToNext, tiers, recentXP, levelRewards } =
    useLevelData();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header onBack={() => navigation?.goBack()} />

      <MainCard
        levelData={levelData}
        xpProgress={xpProgress}
        xpToNext={xpToNext}
      />

      <RankProgression tiers={tiers} />

      <RecentXPSection recentXP={recentXP} />

      <LevelRewardsSection rewards={levelRewards} />
    </ScrollView>
  );
};

export default LevelScreen;
