import { useCallback } from 'react';

interface UseProfileActionsProps {
  navigation: any;
  setShowAchievements: (show: boolean) => void;
  setShowLogoutConfirm: (show: boolean) => void;
  logout: () => Promise<void>;
}

interface UseProfileActionsReturn {
  handleNavigate: (screen: string) => void;
  handleEditProfile: () => void;
  handleOpenAchievements: () => void;
  handleCloseAchievements: () => void;
  handleOpenLogout: () => void;
  handleCloseLogout: () => void;
  handleConfirmLogout: () => Promise<void>;
}

export const useProfileActions = ({
  navigation,
  setShowAchievements,
  setShowLogoutConfirm,
  logout,
}: UseProfileActionsProps): UseProfileActionsReturn => {
  
  const handleNavigate = useCallback((screen: string) => {
    if (!navigation) return;
    
    const profileStackRoutes: { [key: string]: string } = {
      'edit-profile': 'EditProfile',
      'privacy-controls': 'PrivacyControls',
      notifications: 'Notifications',
      settings: 'SettingsFromProfile',
      help: 'HelpSupport',
      integrations: 'Integrations',
    };

    const homeStackRoutes: { [key: string]: string } = {
      hub: 'Hub',
      streak: 'Streak',
      wallet: 'Wallet',
      challenges: 'Challenges',
      'saved-places': 'SavedPlaces',
    };

    if (profileStackRoutes[screen]) {
      navigation.navigate(profileStackRoutes[screen]);
    } else if (homeStackRoutes[screen]) {
      navigation.navigate('Home', { screen: homeStackRoutes[screen] });
    } else if (screen === 'circles') {
      navigation.navigate('Circles', { screen: 'CirclesList' });
    } else {
      navigation.navigate(screen);
    }
  }, [navigation]);
  
  const handleEditProfile = useCallback(() => {
    handleNavigate('edit-profile');
  }, [handleNavigate]);
  
  const handleOpenAchievements = useCallback(() => {
    setShowAchievements(true);
  }, [setShowAchievements]);
  
  const handleCloseAchievements = useCallback(() => {
    setShowAchievements(false);
  }, [setShowAchievements]);
  
  const handleOpenLogout = useCallback(() => {
    setShowLogoutConfirm(true);
  }, [setShowLogoutConfirm]);
  
  const handleCloseLogout = useCallback(() => {
    setShowLogoutConfirm(false);
  }, [setShowLogoutConfirm]);
  
  const handleConfirmLogout = useCallback(async () => {
    setShowLogoutConfirm(false);
    await logout();
  }, [setShowLogoutConfirm, logout]);
  
  return {
    handleNavigate,
    handleEditProfile,
    handleOpenAchievements,
    handleCloseAchievements,
    handleOpenLogout,
    handleCloseLogout,
    handleConfirmLogout,
  };
};
