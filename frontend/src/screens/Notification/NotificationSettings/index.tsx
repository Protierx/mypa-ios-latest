import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles';
import { NOTIFICATION_CATEGORIES } from './constants';
import { useNotificationSettingsData } from './hooks';
import {
  StatusCard,
  CategorySection,
  DeliveryOptionsSection,
  QuietHoursSection,
  TestNotificationCard,
} from './components';
import { TimePickerModal } from './modals';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const {
    loading,
    saving,
    settings,
    pushRegistered,
    showTimePicker,
    editingTimeField,
    tempHour,
    tempMinute,
    tempPeriod,
    testSending,
    testSuccess,
    expandedCategory,
    fadeAnim,
    scaleAnim,
    successAnim,
    pulseAnim,
    updateSetting,
    handleEnablePush,
    handleTestNotification,
    openTimePicker,
    confirmTimeSelection,
    setShowTimePicker,
    setExpandedCategory,
    handleChangeHour,
    handleChangeMinute,
    handleChangePeriod,
    handleQuickSelect,
  } = useNotificationSettingsData();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {saving && <ActivityIndicator size="small" color="#007AFF" />}
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <StatusCard
          settings={settings}
          pushRegistered={pushRegistered}
          pulseAnim={pulseAnim}
          onTogglePush={(value) => updateSetting('pushEnabled', value)}
          onEnablePush={handleEnablePush}
        />

        {/* Notification Categories */}
        {settings.pushEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTIFICATION TYPES</Text>
            <View style={styles.sectionCard}>
              <CategorySection
                categoryKey="tasks"
                category={NOTIFICATION_CATEGORIES.tasks}
                settings={settings}
                isExpanded={expandedCategory === 'tasks'}
                onToggleExpand={setExpandedCategory}
                onUpdateSetting={updateSetting}
              />
              <View style={styles.categorySeparator} />
              <CategorySection
                categoryKey="social"
                category={NOTIFICATION_CATEGORIES.social}
                settings={settings}
                isExpanded={expandedCategory === 'social'}
                onToggleExpand={setExpandedCategory}
                onUpdateSetting={updateSetting}
              />
              <View style={styles.categorySeparator} />
              <CategorySection
                categoryKey="progress"
                category={NOTIFICATION_CATEGORIES.progress}
                settings={settings}
                isExpanded={expandedCategory === 'progress'}
                onToggleExpand={setExpandedCategory}
                onUpdateSetting={updateSetting}
              />
            </View>
          </View>
        )}

        {/* Delivery Options */}
        {settings.pushEnabled && (
          <DeliveryOptionsSection
            settings={settings}
            onUpdateSetting={updateSetting}
          />
        )}

        {/* Quiet Hours */}
        {settings.pushEnabled && (
          <QuietHoursSection
            settings={settings}
            onToggleQuietHours={(value) => updateSetting('quietHoursEnabled', value)}
            onOpenTimePicker={openTimePicker}
          />
        )}

        {/* Test Notification */}
        {settings.pushEnabled && (
          <TestNotificationCard
            testSending={testSending}
            testSuccess={testSuccess}
            successAnim={successAnim}
            onTestNotification={handleTestNotification}
          />
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={18} color="#8E8E93" />
          <Text style={styles.infoText}>
            Notifications help you stay on track with tasks, maintain streaks, and stay connected with your circles. You can change these settings at any time.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePicker}
        editingField={editingTimeField}
        tempHour={tempHour}
        tempMinute={tempMinute}
        tempPeriod={tempPeriod}
        onChangeHour={handleChangeHour}
        onChangeMinute={handleChangeMinute}
        onChangePeriod={handleChangePeriod}
        onQuickSelect={handleQuickSelect}
        onConfirm={confirmTimeSelection}
        onCancel={() => setShowTimePicker(false)}
      />
    </SafeAreaView>
  );
}

export { NotificationSettingsScreen };
