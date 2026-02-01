import React from 'react';
import { ScrollView } from 'react-native';
import { NotificationsScreenProps } from './types';
import { styles } from './styles';
import {
  Header,
  MasterToggle,
  NotificationTypesSection,
  QuietHoursSection,
  DeliverySection,
} from './components';
import { useNotificationsData } from './hooks';

export function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    notificationTypes,
    quietHoursEnabled,
    setQuietHoursEnabled,
    deliveryOptions,
  } = useNotificationsData();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header onBack={() => navigation?.goBack()} />

      <MasterToggle
        enabled={notificationsEnabled}
        onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
      />

      {notificationsEnabled && (
        <>
          <NotificationTypesSection types={notificationTypes} />
          <QuietHoursSection
            enabled={quietHoursEnabled}
            onToggle={() => setQuietHoursEnabled(!quietHoursEnabled)}
          />
          <DeliverySection options={deliveryOptions} />
        </>
      )}
    </ScrollView>
  );
}

export default NotificationsScreen;
