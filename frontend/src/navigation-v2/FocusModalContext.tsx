/**
 * FocusModalContext
 *
 * Allows opening the Focus modal from anywhere (e.g. TaskDetailModal "Start Focus").
 * Provided by GestureNavigatorContent.
 */

import React, { createContext, useContext, useCallback, ReactNode } from 'react';

type OpenFocusModal = (taskId?: string) => void;

interface FocusModalContextType {
  openFocusModal: OpenFocusModal;
}

const FocusModalContext = createContext<FocusModalContextType | undefined>(undefined);

export function FocusModalProvider({
  children,
  openFocusModal,
}: {
  children: ReactNode;
  openFocusModal: OpenFocusModal;
}) {
  const value = React.useMemo(() => ({ openFocusModal }), [openFocusModal]);
  return (
    <FocusModalContext.Provider value={value}>
      {children}
    </FocusModalContext.Provider>
  );
}

export function useFocusModal() {
  const context = useContext(FocusModalContext);
  if (context === undefined) {
    return { openFocusModal: (_taskId?: string) => {} };
  }
  return context;
}
