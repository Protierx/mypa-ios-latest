/**
 * Gesture Context
 * 
 * Provides shared state for gesture navigation.
 * 
 * TODO: Implement in Phase 3, Step 3.1
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Screen = 'ai_hub' | 'tasks' | 'social' | 'profile' | 'focus';

interface GestureContextType {
  currentScreen: Screen;
  navigateTo: (screen: Screen) => void;
  canSwipe: boolean;
  setCanSwipe: (value: boolean) => void;
}

const GestureContext = createContext<GestureContextType | undefined>(undefined);

export function GestureProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('ai_hub');
  const [canSwipe, setCanSwipe] = useState(true);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  return (
    <GestureContext.Provider
      value={{
        currentScreen,
        navigateTo,
        canSwipe,
        setCanSwipe,
      }}
    >
      {children}
    </GestureContext.Provider>
  );
}

export function useGesture() {
  const context = useContext(GestureContext);
  if (context === undefined) {
    throw new Error('useGesture must be used within a GestureProvider');
  }
  return context;
}

export { GestureContext };
