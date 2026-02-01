import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles';
import { useAIInsightsData } from './hooks';
import {
  BrainCard,
  StatsSnapshot,
  SuggestionsList,
  InsightsList,
  EmptyState,
  QuickActions,
} from './components';

export function AIInsightsScreen() {
  const navigation = useNavigation();
  const {
    loading,
    stats,
    suggestions,
    insights,
    currentTip,
    fadeAnim,
    slideAnim,
    pulseAnim,
    progressAnim,
    handleApplySuggestion,
    handleDismissSuggestion,
    handleRefresh,
  } = useAIInsightsData();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing your tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Insights</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brain Card with Productivity Tip */}
        <BrainCard
          tip={currentTip}
          pulseAnim={pulseAnim}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
        />

        {/* Stats Snapshot */}
        <StatsSnapshot
          stats={stats}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          progressAnim={progressAnim}
        />

        {/* Smart Suggestions */}
        <SuggestionsList
          suggestions={suggestions}
          onApply={handleApplySuggestion}
          onDismiss={handleDismissSuggestion}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
        />

        {/* Insights */}
        <InsightsList
          insights={insights}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
        />

        {/* Empty State */}
        {suggestions.length === 0 && insights.length === 0 && (
          <EmptyState fadeAnim={fadeAnim} slideAnim={slideAnim} />
        )}

        {/* Quick Actions */}
        <QuickActions fadeAnim={fadeAnim} slideAnim={slideAnim} />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default AIInsightsScreen;
