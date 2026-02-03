import React, { createContext, useContext, useState, useCallback } from 'react';

interface VoiceContextType {
  showVoiceAssistant: boolean;
  openVoiceAssistant: () => void;
  closeVoiceAssistant: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  const openVoiceAssistant = useCallback(() => {
    setShowVoiceAssistant(true);
  }, []);

  const closeVoiceAssistant = useCallback(() => {
    setShowVoiceAssistant(false);
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        showVoiceAssistant,
        openVoiceAssistant,
        closeVoiceAssistant,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
