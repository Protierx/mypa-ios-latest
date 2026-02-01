import { useState, useCallback } from 'react';
import { PrivacyModeType, Circle, DataPermission } from '../types';
import { INITIAL_CIRCLES, PRIVACY_OPTIONS } from '../constants';

export const usePrivacyControlsData = () => {
  const [defaultPrivacy, setDefaultPrivacy] = useState<PrivacyModeType>('metrics');
  const [circles, setCircles] = useState<Circle[]>(INITIAL_CIRCLES);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);

  // Additional settings
  const [hideWallet, setHideWallet] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);

  // Data permissions
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [calendarAccess, setCalendarAccess] = useState(true);
  const [contactsAccess, setContactsAccess] = useState(false);
  const [microphoneAccess, setMicrophoneAccess] = useState(true);
  const [healthAccess, setHealthAccess] = useState(true);
  const [backgroundRefresh, setBackgroundRefresh] = useState(true);

  const getPrivacyLabel = useCallback((privacy: string): string => {
    if (privacy === 'default') return 'Use default';
    const option = PRIVACY_OPTIONS.find((o) => o.value === privacy);
    return option?.label || privacy;
  }, []);

  const handleSelectCircle = useCallback((circleId: number) => {
    setSelectedCircleId(circleId);
    setShowPicker(true);
  }, []);

  const handleSelectPrivacy = useCallback((value: string) => {
    if (selectedCircleId !== null) {
      setCircles((prev) =>
        prev.map((c) =>
          c.id === selectedCircleId ? { ...c, privacy: value } : c
        )
      );
    }
    setShowPicker(false);
    setSelectedCircleId(null);
  }, [selectedCircleId]);

  const selectedCircle = circles.find((c) => c.id === selectedCircleId) || null;

  const dataPermissions: DataPermission[] = [
    {
      key: 'location',
      label: 'Location',
      desc: 'For place-based tasks and check-ins',
      icon: 'location',
      color: '#EF4444',
      value: locationEnabled,
      setter: setLocationEnabled,
    },
    {
      key: 'calendar',
      label: 'Calendar',
      desc: 'Sync events and schedule tasks',
      icon: 'calendar',
      color: '#F59E0B',
      value: calendarAccess,
      setter: setCalendarAccess,
    },
    {
      key: 'contacts',
      label: 'Contacts',
      desc: 'Find friends and invite to circles',
      icon: 'people',
      color: '#3B82F6',
      value: contactsAccess,
      setter: setContactsAccess,
    },
    {
      key: 'microphone',
      label: 'Microphone',
      desc: 'Voice commands and audio notes',
      icon: 'mic',
      color: '#8B5CF6',
      value: microphoneAccess,
      setter: setMicrophoneAccess,
    },
    {
      key: 'health',
      label: 'Health data',
      desc: 'Track wellness and activity goals',
      icon: 'heart',
      color: '#EC4899',
      value: healthAccess,
      setter: setHealthAccess,
    },
    {
      key: 'background',
      label: 'Background refresh',
      desc: 'Keep data synced when app is closed',
      icon: 'refresh',
      color: '#10B981',
      value: backgroundRefresh,
      setter: setBackgroundRefresh,
    },
  ];

  return {
    defaultPrivacy,
    setDefaultPrivacy,
    circles,
    showPicker,
    setShowPicker,
    selectedCircle,
    hideWallet,
    setHideWallet,
    anonymousMode,
    setAnonymousMode,
    dataPermissions,
    getPrivacyLabel,
    handleSelectCircle,
    handleSelectPrivacy,
  };
};
