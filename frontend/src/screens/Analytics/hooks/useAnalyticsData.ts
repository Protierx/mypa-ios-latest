import { useState, useEffect, useCallback } from 'react';
import {
  DailyStats,
  WeeklyStats,
  UserInsights,
  ProductivityTrends,
  PeriodType,
} from '../types';
import { analyticsApi } from '../../../services/api';

interface UseAnalyticsDataReturn {
  loading: boolean;
  refreshing: boolean;
  selectedPeriod: PeriodType;
  dailyStats: DailyStats | null;
  weeklyStats: WeeklyStats | null;
  insights: UserInsights | null;
  trends: ProductivityTrends | null;
  setSelectedPeriod: (period: PeriodType) => void;
  onRefresh: () => void;
}

export const useAnalyticsData = (): UseAnalyticsDataReturn => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [trends, setTrends] = useState<ProductivityTrends | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dailyData, weeklyData, insightsData, trendsData] =
        await Promise.all([
          analyticsApi.getDaily(),
          analyticsApi.getWeekly(),
          analyticsApi.getInsights(),
          analyticsApi.getTrends(),
        ]);

      setDailyStats(dailyData);
      setWeeklyStats(weeklyData);
      setInsights(insightsData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  return {
    loading,
    refreshing,
    selectedPeriod,
    dailyStats,
    weeklyStats,
    insights,
    trends,
    setSelectedPeriod,
    onRefresh,
  };
};
