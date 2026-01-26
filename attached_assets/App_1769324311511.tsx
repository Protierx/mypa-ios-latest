import { useState } from "react";
import { HubScreen } from "./screens/HubScreen";
import { PlanScreen } from "./screens/PlanScreen";
import { InboxScreen } from "./screens/InboxScreen";
import { TaskSortingScreen } from "./screens/TaskSortingScreen";
import { WalletScreen } from "./screens/WalletScreen";
import { CirclesScreen } from "./screens/CirclesScreen";
import { ChallengesScreen } from "./screens/ChallengesScreen";
import { ResetScreen } from "./screens/ResetScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { ListeningScreen } from "./screens/ListeningScreen";
import { CircleHomeScreen } from "./screens/CircleHomeScreen";
import { ProofCameraScreen } from "./screens/ProofCameraScreen";
import { ProofConfirmScreen } from "./screens/ProofConfirmScreen";
import { DailyLifeCardScreen } from "./screens/DailyLifeCardScreen";
import { PrivacyControlsScreen } from "./screens/PrivacyControlsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { HelpSupportScreen } from "./screens/HelpSupportScreen";
import { EditProfileScreen } from "./screens/EditProfileScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { StreakScreen } from "./screens/StreakScreen";
import { LevelScreen } from "./screens/LevelScreen";
import { SavedPlacesScreen } from "./screens/SavedPlacesScreen";
import { TabBar } from "./components/TabBar";

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [previousTab, setPreviousTab] = useState('home');
  const [isListening, setIsListening] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle Tab Change
  const handleTabChange = (tabId: string) => {
    if (tabId === 'voice') {
      handleVoiceClick();
    } else {
      setActiveTab(tabId);
      setIsListening(false);
    }
  };

  // Handle Navigation from Hub tiles
  const handleNavigate = (screen: string) => {
    setActiveTab(screen);
  };

  // Handle Voice Mode
  const handleVoiceClick = () => {
    setPreviousTab(activeTab);
    setActiveTab('voice');
    setIsListening(true);
  };

  const handleEndCall = () => {
    setIsListening(false);
    setActiveTab(previousTab === 'voice' ? 'home' : previousTab);
  };

  const renderScreen = () => {
    if (isListening) {
      return <ListeningScreen onEndCall={handleEndCall} />;
    }

    switch (activeTab) {
      case 'home':
        return <HubScreen onNavigate={handleNavigate} onVoiceClick={handleVoiceClick} />;
      case 'plan':
        return <PlanScreen onNavigate={handleNavigate} />;
      case 'inbox':
        return <InboxScreen onNavigate={handleNavigate} />;
      case 'sort':
        return <TaskSortingScreen onNavigate={handleNavigate} />;
      case 'circles':
        return <CirclesScreen onNavigate={handleNavigate} onModalStateChange={setIsModalOpen} />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} />;
      case 'challenges':
        return <ChallengesScreen onNavigate={handleNavigate} />;
      case 'wallet':
        return <WalletScreen onNavigate={handleNavigate} />;
      case 'reset':
        return <ResetScreen onNavigate={handleNavigate} onVoiceClick={handleVoiceClick} />;
      case 'circle-home':
        return <CircleHomeScreen onNavigate={handleNavigate} onModalStateChange={setIsModalOpen} />;
      case 'proof-camera':
        return <ProofCameraScreen onNavigate={handleNavigate} />;
      case 'proof-confirm':
        return <ProofConfirmScreen onNavigate={handleNavigate} />;
      case 'daily-life-card':
        return <DailyLifeCardScreen onNavigate={handleNavigate} />;
      case 'privacy-controls':
        return <PrivacyControlsScreen onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsScreen onNavigate={handleNavigate} />;
      case 'help':
        return <HelpSupportScreen onNavigate={handleNavigate} />;
      case 'edit-profile':
        return <EditProfileScreen onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationsScreen onNavigate={handleNavigate} />;
      case 'streak':
        return <StreakScreen onNavigate={handleNavigate} />;
      case 'level':
        return <LevelScreen onNavigate={handleNavigate} />;
      case 'saved-places':
        return <SavedPlacesScreen onNavigate={handleNavigate} />;
      default:
        return <HubScreen onNavigate={handleNavigate} onVoiceClick={handleVoiceClick} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8 font-sans">
      {/* iPhone Frame */}
      <div 
        id="phone-frame"
        className="relative w-full max-w-[390px] h-[844px] bg-black rounded-[60px] p-3 shadow-2xl border-[4px] border-[#333]"
        style={{
          boxShadow: '0 0 0 10px #1a1a1a, 0 20px 60px rgba(0,0,0,0.5)'
        }}
      >
        {/* Dynamic Island / Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-b-[20px] z-[100] mt-3" />

        {/* Screen Content - this is the containment boundary for modals */}
        <div 
          id="screen-container"
          className={`w-full h-full rounded-[48px] overflow-hidden relative transition-colors duration-500 ${isListening ? 'bg-black' : 'bg-ios-bg'}`}
          style={{ isolation: 'isolate' }}
        >
          
          {/* Main Content Area */}
          <div className="h-full overflow-y-auto scrollbar-hide">
            {renderScreen()}
          </div>

          {/* Tab Bar (Only show if not listening, no modal, and not on reset screen) */}
          {!isListening && !isModalOpen && activeTab !== 'reset' && (
            <TabBar 
              activeTab={activeTab} 
              onTabChange={handleTabChange}
              onVoiceClick={handleVoiceClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}