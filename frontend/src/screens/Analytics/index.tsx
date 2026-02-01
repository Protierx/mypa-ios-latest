import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Text,
  SafeAreaView,
} from 'react-native';
import { AnalyticsScreenProps } from './types';
import { Colors } from './constants';
import { styles } from './styles';
import {
  Header,
  PeriodSelector,
  SummaryCards,
  TrendChart,
  CategoryBreakdown,
  PeakHours,
  LifetimeStats,
  Milestones,
  LevelProgress,
} from './components';
import { useAnalyticsData } from './hooks';

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  navigation,
}) => {
  const {
    loading,
    refreshing,
    selectedPeriod,
    dailyStats,
    weeklyStats,
    insights,
    trends,
    setSelectedPeriod,
    onRefresh,
  } = useAnalyticsData();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={() => navigation?.goBack()} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        <SummaryCards dailyStats={dailyStats} />
        <TrendChart trends={trends} />
        <CategoryBreakdown weeklyStats={weeklyStats} />
        <PeakHours trends={trends} />
        <LifetimeStats insights={insights} />
        <Milestones insights={insights} />
        <LevelProgress insights={insights} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;
