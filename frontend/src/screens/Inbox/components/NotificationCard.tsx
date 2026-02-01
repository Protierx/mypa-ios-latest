import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  AlarmClock,
  CheckCheck,
  CheckCircle,
  Eye,
  Heart,
  Reply,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react-native';

import { NotificationItem, Feedback } from '../types';
import { iconFor } from '../utils';
import { styles } from '../styles';
import { SlideInCard, PulseDot } from './AnimatedComponents';

interface NotificationCardProps {
  item: NotificationItem;
  index: number;
  actionFeedback: Feedback;
  snoozedItems: Set<number | string>;
  onMarkRead: () => void;
  onSnooze: () => void;
  onAcceptInvite: () => void;
  onDeclineInvite: () => void;
  onMessageReply: () => void;
  onMessageArchive: () => void;
  onReminderDone: () => void;
  onReminderDismiss: () => void;
  onSocialView: () => void;
  onArchive: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  item,
  index,
  actionFeedback,
  snoozedItems,
  onMarkRead,
  onSnooze,
  onAcceptInvite,
  onDeclineInvite,
  onMessageReply,
  onMessageArchive,
  onReminderDone,
  onReminderDismiss,
  onSocialView,
  onArchive,
}) => {
  const icon = iconFor(item.type);
  
  return (
    <SlideInCard index={index}>
      <BlurView intensity={50} tint="light" style={[styles.card, item.isNew && styles.newCard]}>
        <View style={styles.activityHeader}>
          <View style={[styles.activityIcon, { backgroundColor: icon.bg }]}>
            <icon.Icon size={18} color={icon.color} />
          </View>
          <View style={styles.activityBody}>
            <View style={styles.activityTitleRow}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <View style={styles.activityMeta}>
                {item.isNew && <PulseDot color="#7C3AED" />}
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
            {item.subtitle && <Text style={styles.activitySubtitle}>{item.subtitle}</Text>}
          </View>
        </View>

        <View style={styles.cardActions}>
          {actionFeedback?.id === item.id ? (
            <View style={[styles.feedbackChip, actionFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackInfo]}>
              <CheckCircle size={14} color={actionFeedback.type === 'success' ? '#10B981' : '#64748B'} />
              <Text style={styles.feedbackText}>{actionFeedback.message}</Text>
            </View>
          ) : (
            <>
              {item.type === 'message' && (
                <>
                  <Pressable style={styles.primaryAction} onPress={onMessageReply}>
                    <Reply size={14} color="#2563EB" />
                    <Text style={[styles.primaryActionText, { color: '#2563EB' }]}>Reply</Text>
                  </Pressable>
                  {item.isNew && (
                    <Pressable style={styles.secondaryAction} onPress={onMarkRead}>
                      <CheckCheck size={14} color="#64748B" />
                      <Text style={styles.secondaryActionText}>Read</Text>
                    </Pressable>
                  )}
                  <Pressable style={styles.iconAction} onPress={onMessageArchive}>
                    <Trash2 size={16} color="#94A3B8" />
                  </Pressable>
                </>
              )}
              {item.type === 'reminder' && (
                <>
                  <Pressable style={styles.primaryAction} onPress={onReminderDone}>
                    <CheckCircle size={14} color="#10B981" />
                    <Text style={styles.primaryActionText}>Done</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.secondaryAction, snoozedItems.has(item.id) && styles.secondaryDisabled]}
                    onPress={onSnooze}
                    disabled={snoozedItems.has(item.id)}
                  >
                    <AlarmClock size={14} color="#B45309" />
                    <Text style={[styles.secondaryActionText, { color: '#B45309' }]}>
                      {snoozedItems.has(item.id) ? 'Snoozed' : 'Snooze 1h'}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.iconAction} onPress={onReminderDismiss}>
                    <X size={16} color="#94A3B8" />
                  </Pressable>
                </>
              )}
              {item.type === 'invite' && (
                <>
                  <Pressable style={styles.primaryAction} onPress={onAcceptInvite}>
                    <UserPlus size={14} color="#7C3AED" />
                    <Text style={[styles.primaryActionText, { color: '#7C3AED' }]}>Join Circle</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryAction} onPress={onSocialView}>
                    <Eye size={14} color="#64748B" />
                    <Text style={styles.secondaryActionText}>View</Text>
                  </Pressable>
                  <Pressable style={styles.iconAction} onPress={onDeclineInvite}>
                    <X size={16} color="#94A3B8" />
                  </Pressable>
                </>
              )}
              {item.type === 'social' && (
                <>
                  <Pressable style={styles.primaryAction} onPress={onSocialView}>
                    <Heart size={14} color="#DB2777" />
                    <Text style={[styles.primaryActionText, { color: '#DB2777' }]}>View Activity</Text>
                  </Pressable>
                  {item.isNew && (
                    <Pressable style={styles.secondaryAction} onPress={onMarkRead}>
                      <CheckCheck size={14} color="#64748B" />
                      <Text style={styles.secondaryActionText}>Read</Text>
                    </Pressable>
                  )}
                  <Pressable style={styles.iconAction} onPress={onArchive}>
                    <Trash2 size={16} color="#94A3B8" />
                  </Pressable>
                </>
              )}
            </>
          )}
        </View>
      </BlurView>
    </SlideInCard>
  );
};
