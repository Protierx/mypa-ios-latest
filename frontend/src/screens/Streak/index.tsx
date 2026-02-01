import React from 'react';
import { ScrollView } from 'react-native';
import { StreakScreenProps } from './types';
import { styles } from './styles';
import {
  Header,
  MainCard,
  ActivityCalendar,
  MilestonesSection,
  BenefitsSection,
} from './components';
import { useStreakData } from './hooks';

export function StreakScreen({ navigation }: StreakScreenProps) {
  const {
    streakData,
    calendarDays,
    milestones,
    streakBenefits,
    currentStreak,
  } = useStreakData();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header onBack={() => navigation?.goBack()} />
      <MainCard streakData={streakData} />
      <ActivityCalendar calendarDays={calendarDays} />
      <MilestonesSection milestones={milestones} currentStreak={currentStreak} />
      <BenefitsSection benefits={streakBenefits} />
    </ScrollView>
  );
}

export default StreakScreen;
