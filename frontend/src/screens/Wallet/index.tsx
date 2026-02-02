import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useWalletData } from './hooks/useWalletData';
import { useWalletActions } from './hooks/useWalletActions';
import { WalletHeader } from './components/WalletHeader';
import { TimeCard } from './components/TimeCard';
import { XPCard } from './components/XPCard';
import { PeriodSelector } from './components/PeriodSelector';
import { QuickAccessRow } from './components/QuickAccessRow';
import { StatsGrid } from './components/StatsGrid';
import { WeeklyChart } from './components/WeeklyChart';
import { MilestonesCard } from './components/MilestonesCard';
import { RecentSavingsSection } from './components/RecentSavingsSection';
import { HowItWorksCard } from './components/HowItWorksCard';
import { ShareModal } from './modals/ShareModal';
import { InfoModal } from './modals/InfoModal';
import { styles as walletStyles } from './styles';

interface WalletScreenProps {
  navigation?: any;
}

export function WalletScreen({ navigation }: WalletScreenProps) {
  const { user } = useAuth();
  
  const {
    isLoading,
    isRefreshing,
    selectedPeriod,
    setSelectedPeriod,
    periodStats,
    walletData,
    milestones,
    weeklyBreakdown,
    recentSavings,
    shareModalVisible,
    setShareModalVisible,
    infoModalVisible,
    setInfoModalVisible,
    infoModalData,
    setInfoModalData,
    pulseAnim,
    chartAnims: chartBarAnims,
    recentSlideAnims,
    refreshData,
  } = useWalletData();

  const {
    handleBack,
    handleHistory,
    handleShare,
    handleCalendar,
    handleFavorites,
    handleStreak,
    handleTasks,
    handleLevel,
    handleHowItWorksPress,
    howItWorksItems,
  } = useWalletActions({
    navigation,
    setShareModalVisible,
    setInfoModalVisible,
    setInfoModalData,
  });

  const onRefresh = React.useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  const maxTime = Math.max(...weeklyBreakdown.map(d => d.time), 60);

  const handleNavigate = (screen: string) => {
    if (!navigation) return;
    const homeStackRoutes: { [key: string]: string } = {
      hub: 'Hub',
      streak: 'Streak',
      challenges: 'Challenges',
      'daily-life-card': 'DailyLifeCard',
    };

    if (homeStackRoutes[screen]) {
      navigation.navigate('Today', { screen: homeStackRoutes[screen] });
    } else if (screen === 'plan') {
      navigation.navigate('Plan');
    } else if (screen === 'circles') {
      navigation.navigate('Circles', { screen: 'CirclesList' });
    } else {
      navigation.navigate(screen);
    }
  };

  return (
    <View style={walletStyles.container}>
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9', '#f8fafc']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={walletStyles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <WalletHeader
          onBack={() => handleNavigate('hub')}
          onHistory={handleHistory}
        />

        {isLoading ? (
          <View style={walletStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={walletStyles.loadingText}>Loading your stats...</Text>
          </View>
        ) : (
          <ScrollView
            style={walletStyles.scrollView}
            contentContainerStyle={walletStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor="#10b981"
              />
            }
          >
            {/* Main Time Card */}
            <TimeCard
              wallet={walletData}
              pulseAnim={pulseAnim}
              onStreakPress={handleStreak}
              onTasksPress={handleTasks}
              onSharePress={handleShare}
            />

            {/* XP & Level Card */}
            <XPCard wallet={walletData} onPress={handleLevel} />

            {/* Period Selector */}
            <PeriodSelector selectedPeriod={selectedPeriod} onSelect={setSelectedPeriod} />

            {/* Quick Access */}
            <QuickAccessRow
              onShare={handleShare}
              onCalendar={handleCalendar}
              onFavorites={handleFavorites}
            />

            {/* Stats Grid */}
            <StatsGrid
              stats={periodStats}
              onTimeSavedPress={() =>
                setInfoModalData({
                  title: 'Time Saved',
                  description: `You've saved ${periodStats.saved} ${
                    selectedPeriod === 'today'
                      ? 'today'
                      : selectedPeriod === 'week'
                        ? 'this week'
                        : 'this month'
                  }!`,
                })
              }
              onTasksPress={handleTasks}
              onEfficiencyPress={() =>
                setInfoModalData({
                  title: 'Efficiency',
                  description: `Your efficiency is ${periodStats.efficiency}% - ${
                    periodStats.efficiency >= 90
                      ? 'Excellent!'
                      : periodStats.efficiency >= 80
                        ? 'Great job!'
                        : 'Keep improving!'
                  }`,
                })
              }
            />

            {/* Weekly Chart */}
            {selectedPeriod === 'week' && (
              <WeeklyChart weeklyBreakdown={weeklyBreakdown} chartBarAnims={chartBarAnims} maxTime={maxTime} />
            )}

            {/* Milestones */}
            <MilestonesCard
              milestones={milestones}
              onMilestonePress={(milestone) => {
                if (milestone.reached) {
                  setInfoModalData({
                    title: `${milestone.reward} ${milestone.title} Milestone`,
                    description: 'Congratulations! You unlocked this milestone!',
                  });
                } else {
                  setInfoModalData({
                    title: `${milestone.title} Milestone`,
                    description: `${milestone.progress || 0}% complete. Keep saving time to unlock this milestone!`,
                  });
                }
              }}
            />

            {/* Recent Savings */}
            <RecentSavingsSection
              savings={recentSavings}
              slideAnims={recentSlideAnims}
              onItemPress={(item) =>
                setInfoModalData({
                  title: `${item.icon} Time Saved`,
                  description: `${item.action}\n\nTime saved: ${item.time}\n${item.when}`,
                })
              }
            />

            {/* How It Works */}
            <HowItWorksCard items={howItWorksItems} onItemPress={handleHowItWorksPress} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Share Modal */}
      <ShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        totalTime={walletData.totalTimeSaved}
      />

      {/* Info Modal */}
      <InfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        data={infoModalData}
      />
    </View>
  );
}

export default WalletScreen;
