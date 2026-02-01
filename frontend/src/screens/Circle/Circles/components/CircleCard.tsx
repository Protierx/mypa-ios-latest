import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, MoreVertical, Users, Dumbbell, BookOpen } from 'lucide-react-native';
import { Circle, CardAnimation } from '../types';
import { getCircleGradient } from '../utils';
import { styles } from '../styles';

interface CircleCardProps {
  circle: Circle;
  index: number;
  cardAnimation: CardAnimation;
  expandedCard: string | null;
  onPress: () => void;
  onLongPress: () => void;
  onOpenCircle: () => void;
  onMore: () => void;
}

export function CircleCard({
  circle,
  index,
  cardAnimation,
  expandedCard,
  onPress,
  onLongPress,
  onOpenCircle,
  onMore,
}: CircleCardProps) {
  const totalMembers = circle.members.length;
  const postedCount = circle.members.filter((m) => m.posted).length;
  const progress = totalMembers > 0 ? (postedCount / totalMembers) * 100 : 0;
  const allPosted = postedCount === totalMembers;
  const displayMembers = circle.members.slice(0, 4);
  const extraCount = totalMembers - 4;
  const gradientColors = getCircleGradient(circle.name);
  const isExpanded = expandedCard === circle.id;

  // Get icon based on circle name
  const getIcon = () => {
    const name = circle.name.toLowerCase();
    if (name.includes('gym') || name.includes('workout') || name.includes('fitness')) {
      return <Dumbbell color="#0f172a" size={24} />;
    }
    if (name.includes('book') || name.includes('read') || name.includes('study')) {
      return <BookOpen color="#0f172a" size={24} />;
    }
    return <Users color="#0f172a" size={24} />;
  };

  return (
    <Animated.View
      style={[
        styles.circleCard,
        circle.isNew && styles.circleCardHighlight,
        {
          transform: [{ scale: cardAnimation.scale }],
          opacity: cardAnimation.opacity,
        },
      ]}
    >
      <BlurView intensity={40} tint="light" style={styles.circleCardBlur}>
        {circle.isNew && (
          <LinearGradient colors={['#10b981', '#059669']} style={styles.joinedBanner}>
            <Check color="#fff" size={16} />
            <Text style={styles.joinedBannerText}>Just joined!</Text>
          </LinearGradient>
        )}
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          style={({ pressed }) => [
            styles.circleCardContent,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={styles.circleRow}>
            <LinearGradient
              colors={gradientColors}
              style={styles.circleAvatar}
            >
              {getIcon()}
            </LinearGradient>

            <View style={styles.circleInfo}>
              <View style={styles.circleTitleRow}>
                <Text style={styles.circleName} numberOfLines={1}>
                  {circle.name}
                </Text>
                {circle.streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakBadgeText}>🔥 {circle.streak}</Text>
                  </View>
                )}
              </View>
              {circle.challenge && (
                <Text style={styles.circleSubtitle} numberOfLines={1}>
                  {circle.challenge}
                </Text>
              )}
            </View>

            <View style={styles.circleStatus}>
              <View
                style={[
                  styles.statusBadge,
                  allPosted ? styles.statusBadgeDone : styles.statusBadgePending,
                ]}
              >
                {allPosted ? (
                  <View style={styles.statusDoneContent}>
                    <Check color="#059669" size={12} />
                    <Text style={styles.statusDoneText}>Done</Text>
                  </View>
                ) : (
                  <Text style={styles.statusPendingText}>
                    {postedCount}/{totalMembers}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  allPosted ? styles.progressFillDone : styles.progressFillPending,
                  { width: `${progress}%` },
                ]}
              />
            </View>

            <View style={styles.memberAvatars}>
              {displayMembers.map((member, idx) => (
                <View
                  key={member.id}
                  style={[
                    styles.memberAvatar,
                    member.posted
                      ? styles.memberAvatarPosted
                      : styles.memberAvatarPending,
                    { marginLeft: idx > 0 ? -8 : 0 },
                  ]}
                >
                  <Text
                    style={[
                      styles.memberInitial,
                      member.posted
                        ? styles.memberInitialPosted
                        : styles.memberInitialPending,
                    ]}
                  >
                    {member.initial}
                  </Text>
                </View>
              ))}
              {extraCount > 0 && (
                <View
                  style={[
                    styles.memberAvatar,
                    styles.memberAvatarMore,
                    { marginLeft: -8 },
                  ]}
                >
                  <Text style={styles.memberMoreText}>+{extraCount}</Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>

        {isExpanded && (
          <View style={styles.expandedActions}>
            <View style={styles.expandedButtonsRow}>
              <Pressable
                onPress={onOpenCircle}
                style={({ pressed }) => [
                  styles.openCircleButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.openCircleText}>Open Circle</Text>
              </Pressable>
              <Pressable
                onPress={onMore}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <MoreVertical color="#475569" size={20} />
              </Pressable>
            </View>
          </View>
        )}
      </BlurView>
    </Animated.View>
  );
}
