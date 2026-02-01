/**
 * DailyBriefingScreen - iOS-styled AI-powered daily briefing
 * Beautiful morning/evening summary with insights and tasks
 * 
 * Features:
 * - Time-based themes (morning/afternoon/evening/night)
 * - AI-generated personalized insights and tips
 * - Today's schedule with priority focus
 * - Weekly progress tracking
 * - Motivational quote of the day
 * - Upcoming assignments/missions
 * - Productivity score
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDailyBriefingData } from './hooks';
import {
  BriefingHeader,
  ProductivityScoreCard,
  QuoteCard,
  InsightsCard,
  TodaysSchedule,
  PriorityFocus,
  WeeklyProgress,
  MissionsCard,
  QuickActions,
} from './components';
import { styles } from './styles';

export default function DailyBriefingScreen() {
  const navigation = useNavigation();
  const {
    loading,
    refreshing,
    briefing,
    weeklyStats,
    assignments,
    quote,
    colors,
    pendingTasks,
    completedTasks,
    highPriorityTasks,
    todaysTasks,
    productivityScore,
    scoreInfo,
    onRefresh,
    fadeAnim,
    slideAnim,
    scaleAnim,
    pulseAnim,
  } = useDailyBriefingData();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.accent }]}>
          Preparing your briefing...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <BriefingHeader
          greeting={briefing.greeting}
          pendingTasksCount={pendingTasks.length}
          streak={briefing.stats?.streak || 0}
          colors={colors}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          onBack={() => navigation.goBack()}
        />

        {/* Productivity Score Card */}
        <ProductivityScoreCard
          productivityScore={productivityScore}
          scoreInfo={scoreInfo}
          completedCount={completedTasks.length}
          totalCount={todaysTasks.length}
          streak={briefing.stats?.streak || 0}
          weeklyCompleted={briefing.stats?.weeklyCompleted || 0}
          fadeAnim={fadeAnim}
          pulseAnim={pulseAnim}
        />

        {/* Quote of the Day */}
        <QuoteCard
          quote={quote}
          fadeAnim={fadeAnim}
          scaleAnim={scaleAnim}
        />

        {/* AI Insights */}
        {briefing.insights && briefing.insights.length > 0 && (
          <InsightsCard
            insights={briefing.insights}
            tip={briefing.tip}
            colors={colors}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
          />
        )}

        {/* High Priority Tasks */}
        {highPriorityTasks.length > 0 && (
          <PriorityFocus
            tasks={highPriorityTasks}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
          />
        )}

        {/* Today's Schedule */}
        <TodaysSchedule
          pendingTasks={pendingTasks}
          completedCount={completedTasks.length}
          totalCount={todaysTasks.length}
          colors={colors}
          fadeAnim={fadeAnim}
          scaleAnim={scaleAnim}
          navigation={navigation}
        />

        {/* Weekly Progress */}
        {weeklyStats && (
          <WeeklyProgress
            weeklyStats={weeklyStats}
            colors={colors}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
          />
        )}

        {/* Incoming Missions */}
        {assignments.length > 0 && (
          <MissionsCard
            assignments={assignments}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
            navigation={navigation}
          />
        )}

        {/* Quick Actions */}
        <QuickActions
          colors={colors}
          fadeAnim={fadeAnim}
          scaleAnim={scaleAnim}
          navigation={navigation}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
