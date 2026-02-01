import React from 'react';
import { View, ScrollView, SafeAreaView } from 'react-native';
import { DailyLifeCardScreenProps } from './types';
import { DAILY_STATS, HIGHLIGHTS } from './constants';
import { styles } from './styles';
import {
  Header,
  DateCard,
  StatsGrid,
  HighlightsSection,
  MoodSection,
} from './components';

export function DailyLifeCardScreen({ navigation }: DailyLifeCardScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={() => navigation?.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <DateCard />
        <StatsGrid stats={DAILY_STATS} />
        <HighlightsSection highlights={HIGHLIGHTS} />
        <MoodSection />
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default DailyLifeCardScreen;
