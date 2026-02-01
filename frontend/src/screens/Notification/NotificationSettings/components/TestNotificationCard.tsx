import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface TestNotificationCardProps {
  testSending: boolean;
  testSuccess: boolean;
  successAnim: Animated.Value;
  onTestNotification: () => void;
}

export const TestNotificationCard: React.FC<TestNotificationCardProps> = ({
  testSending,
  testSuccess,
  successAnim,
  onTestNotification,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>TEST NOTIFICATIONS</Text>
      <View style={styles.testCard}>
        <View style={styles.testCardHeader}>
          <Ionicons name="flask" size={24} color="#007AFF" />
          <View style={styles.testCardText}>
            <Text style={styles.testCardTitle}>Test Your Setup</Text>
            <Text style={styles.testCardSubtitle}>
              Send a test notification to make sure everything works
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.testButton, testSending && styles.testButtonDisabled]}
          onPress={onTestNotification}
          disabled={testSending}
          activeOpacity={0.8}
        >
          {testSending ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.testButtonText}>Sending...</Text>
            </>
          ) : testSuccess ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.testButtonText}>Sent!</Text>
            </>
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="white" />
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </>
          )}
        </TouchableOpacity>

        {testSuccess && (
          <Animated.View style={[styles.testSuccessBanner, { opacity: successAnim }]}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.testSuccessText}>
              Notification sent! Check your device.
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
};
