import { useState, useCallback } from 'react';
import { INITIAL_TOGGLES } from '../constants';

export const useSettingsData = () => {
  const [toggles, setToggles] = useState<{ [key: string]: boolean }>(INITIAL_TOGGLES);

  const handleToggle = useCallback((id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return {
    toggles,
    handleToggle,
  };
};
