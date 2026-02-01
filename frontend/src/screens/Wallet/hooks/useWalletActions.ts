import { useCallback } from 'react';
import { HowItWorksItem, InfoModalData } from '../types';
import { HOW_IT_WORKS } from '../constants';

interface UseWalletActionsProps {
  navigation: any;
  setShareModalVisible: (visible: boolean) => void;
  setInfoModalVisible: (visible: boolean) => void;
  setInfoModalData: (data: InfoModalData | null) => void;
}

interface UseWalletActionsReturn {
  handleBack: () => void;
  handleHistory: () => void;
  handleShare: () => void;
  handleCalendar: () => void;
  handleFavorites: () => void;
  handleStreak: () => void;
  handleTasks: () => void;
  handleLevel: () => void;
  handleHowItWorksPress: (item: HowItWorksItem) => void;
  howItWorksItems: HowItWorksItem[];
}

export const useWalletActions = ({
  navigation,
  setShareModalVisible,
  setInfoModalVisible,
  setInfoModalData,
}: UseWalletActionsProps): UseWalletActionsReturn => {
  const navigateToTab = useCallback((tabName: string, params?: any) => {
    const parentNav = navigation?.getParent?.();
    const rootNav = parentNav?.getParent?.() || parentNav || navigation;
    rootNav.navigate('MainTabs', { screen: tabName, params });
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  
  const handleHistory = useCallback(() => {
    console.log('History pressed');
  }, []);
  
  const handleShare = useCallback(() => {
    setShareModalVisible(true);
  }, [setShareModalVisible]);
  
  const handleCalendar = useCallback(() => {
    navigateToTab('Plan');
  }, [navigateToTab]);
  
  const handleFavorites = useCallback(() => {
    navigateToTab('Circles');
  }, [navigateToTab]);

  const handleStreak = useCallback(() => {
    navigation.navigate('Streak');
  }, [navigation]);

  const handleTasks = useCallback(() => {
    navigation.navigate('Tasks');
  }, [navigation]);

  const handleLevel = useCallback(() => {
    navigation.navigate('Level');
  }, [navigation]);
  
  const handleHowItWorksPress = useCallback((item: HowItWorksItem) => {
    const infoData: InfoModalData = {
      title: `${item.icon} ${item.action}`,
      description: item.example,
      details: getDetailsForItem(item.action),
      tips: getTipsForItem(item.action),
    };
    setInfoModalData(infoData);
    setInfoModalVisible(true);
  }, [setInfoModalData, setInfoModalVisible]);
  
  return {
    handleBack,
    handleHistory,
    handleShare,
    handleCalendar,
    handleFavorites,
    handleStreak,
    handleTasks,
    handleLevel,
    handleHowItWorksPress,
    howItWorksItems: HOW_IT_WORKS,
  };
};

// Helper functions to get detailed info for each "How It Works" item
function getDetailsForItem(action: string): string[] {
  switch (action) {
    case 'Complete tasks faster than estimated':
      return [
        'Each completed task earns you time credits',
        'Completing tasks early earns bonus time',
        'Harder tasks earn more time',
        'Streak multipliers boost your earnings',
      ];
    case 'Batch similar tasks together':
      return [
        'Grouping tasks reduces context switching',
        'Batching tasks saves 10-20 minutes per day',
        'Similar tasks complete faster together',
        'Build momentum with task batching',
      ];
    case 'Auto-optimized scheduling':
      return [
        'Smart scheduling aligns tasks with your energy',
        'Breaks are automatically scheduled',
        'Optimal time blocks are suggested',
        'Adjusts to your patterns automatically',
      ];
    case 'Reduced travel/transitions':
      return [
        'Group tasks by location',
        'Minimize commute time',
        'Consolidate meetings into blocks',
        'Save 10-30 minutes daily through efficiency',
      ];
    default:
      return [];
  }
}

function getTipsForItem(action: string): string[] {
  switch (action) {
    case 'Complete tasks faster than estimated':
      return [
        'Set realistic deadlines to consistently beat them',
        'Track which tasks you typically finish early',
      ];
    case 'Batch similar tasks together':
      return [
        'Group all emails, calls, or admin tasks together',
        'Schedule batched sessions back-to-back',
      ];
    case 'Auto-optimized scheduling':
      return [
        'Let MYPA learn your preferences over time',
        'Review and approve suggested schedules',
      ];
    case 'Reduced travel/transitions':
      return [
        'Schedule all location-specific tasks together',
        'Combine remote tasks into focused blocks',
      ];
    default:
      return [];
  }
}
