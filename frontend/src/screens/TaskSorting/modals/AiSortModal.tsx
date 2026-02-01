import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BrainDumpTask } from '../types';
import { Colors, categoryConfig } from '../constants';
import { getTotalTime, getPriorityCount } from '../utils';
import { styles } from '../styles';

interface AiSortModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isAiProcessing: boolean;
  sortedTasks: (BrainDumpTask & { suggestedTime?: string })[];
  spinAnim: Animated.Value;
}

export const AiSortModal: React.FC<AiSortModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isAiProcessing,
  sortedTasks,
  spinAnim,
}) => {
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  
  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true} 
      onRequestClose={() => { if (!isAiProcessing) { onClose(); } }}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => { if (!isAiProcessing) { onClose(); } }}
        />
        <View style={styles.aiModalSheet} onStartShouldSetResponder={() => true}>
          <View style={styles.sheetHandle} />
          
          {isAiProcessing ? (
            <View style={styles.processingContainer}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <MaterialCommunityIcons name="loading" size={48} color={Colors.primary} />
              </Animated.View>
              <Text style={styles.processingText}>AI is organizing your tasks...</Text>
            </View>
          ) : (
            <>
              <View style={styles.aiModalHeader}>
                <View style={styles.aiModalIcon}>
                  <LinearGradient colors={['#a78bfa', '#7c3aed']} style={styles.aiModalIconGradient}>
                    <MaterialCommunityIcons name="brain" size={28} color={Colors.white} />
                  </LinearGradient>
                </View>
                <Text style={styles.aiModalTitle}>Smart Schedule ✨</Text>
                <Text style={styles.aiModalSubtitle}>AI planned your tasks for today</Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{sortedTasks.length}</Text>
                  <Text style={styles.statLabel}>Tasks</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{getTotalTime(sortedTasks)}</Text>
                  <Text style={styles.statLabel}>Total Time</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{getPriorityCount(sortedTasks)}</Text>
                  <Text style={styles.statLabel}>Priority</Text>
                </View>
              </View>
              
              <Text style={styles.scheduleTitle}>Today's Schedule</Text>
              <ScrollView style={styles.scheduleList} showsVerticalScrollIndicator={false}>
                {sortedTasks.map((task) => (
                  <View key={task.id} style={styles.scheduleItem}>
                    <Text style={styles.scheduleTime}>{task.suggestedTime}</Text>
                    <View style={styles.scheduleContent}>
                      <Text style={styles.scheduleTaskTitle}>{task.title}</Text>
                      <View style={styles.scheduleTaskMeta}>
                        {task.aiCategory && (
                          <View style={[styles.smallBadge, { backgroundColor: categoryConfig[task.aiCategory].lightColor }]}>
                            <MaterialCommunityIcons 
                              name={categoryConfig[task.aiCategory].icon as any} 
                              size={10} 
                              color={categoryConfig[task.aiCategory].color} 
                            />
                            <Text style={[styles.smallBadgeText, { color: categoryConfig[task.aiCategory].color }]}>
                              {categoryConfig[task.aiCategory].label}
                            </Text>
                          </View>
                        )}
                        {task.estimatedTime && (
                          <Text style={styles.scheduleTaskTime}>{task.estimatedTime}</Text>
                        )}
                        {task.aiPriority === 'urgent' && <Text style={styles.priorityEmoji}>🔥</Text>}
                        {task.aiPriority === 'important' && <Text style={styles.priorityEmoji}>⭐</Text>}
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
              
              <Text style={styles.helperText}>Tasks will be added to your Plan with optimal time slots</Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                  <Feather name="calendar" size={16} color={Colors.white} />
                  <Text style={styles.confirmButtonText}>Add to Plan</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};
