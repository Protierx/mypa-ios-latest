import { Challenge, ChallengeCategory, APIChallenge } from './types';
import { categoryColors } from './constants';

/**
 * Parse category from challenge description
 */
export function parseCategoryFromDescription(description?: string): ChallengeCategory | null {
  if (!description) return null;
  const match = description.match(/Category:\s*([^|\n]+)/i);
  const raw = match?.[1]?.trim()?.toLowerCase();
  if (!raw) return null;
  if (raw.includes('fitness')) return 'fitness';
  if (raw.includes('wellness')) return 'wellness';
  if (raw.includes('learning')) return 'learning';
  if (raw.includes('productivity')) return 'productivity';
  if (raw.includes('social')) return 'social';
  return null;
}

/**
 * Map challenge type to category
 */
export function typeToCategory(type: string): ChallengeCategory {
  const mapping: Record<string, ChallengeCategory> = {
    FOCUS_MINUTES: 'wellness',
    TASKS_COMPLETED: 'productivity',
    STREAK_DAYS: 'fitness',
    CUSTOM: 'social',
  };
  return mapping[type] || 'social';
}

/**
 * Map category to icon name
 */
export function categoryToIcon(category: ChallengeCategory): string {
  const mapping: Record<ChallengeCategory, string> = {
    fitness: 'dumbbell',
    wellness: 'cellphone-off',
    learning: 'book-open',
    productivity: 'target',
    social: 'heart',
  };
  return mapping[category] || 'trophy';
}

/**
 * Map category to emoji
 */
export function categoryToEmoji(category: ChallengeCategory): string {
  const mapping: Record<ChallengeCategory, string> = {
    fitness: '💪',
    wellness: '🧘',
    learning: '📚',
    productivity: '🎯',
    social: '❤️',
  };
  return mapping[category] || '🏆';
}

/**
 * Format category label for display
 */
export function formatCategoryLabel(cat: ChallengeCategory): string {
  return `${cat.charAt(0).toUpperCase()}${cat.slice(1)}`;
}

/**
 * Convert API challenge to local display format
 */
export function convertToDisplayChallenge(apiChallenge: APIChallenge): Challenge {
  const now = new Date();
  const endsAt = new Date(apiChallenge.endsAt);
  const startsAt = new Date(apiChallenge.startsAt);
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.ceil((endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));

  const category = parseCategoryFromDescription(apiChallenge.description) || typeToCategory(apiChallenge.type);

  // Build members from participants
  const members = (apiChallenge.participants || [])
    .filter((p) => p?.user?.id)
    .slice(0, 5)
    .map((p, idx) => ({
      id: p.user?.id,
      name: p.user?.name || p.user?.username || 'User',
      initial: (p.user?.name || p.user?.username || 'U')[0]?.toUpperCase() || 'U',
      color: idx === 0 ? '#8B5CF6' : idx === 1 ? '#F43F5E' : idx === 2 ? '#3B82F6' : '#10B981',
      streak: p.progress || 0,
      rank: p.rank || idx + 1,
    }));

  return {
    id: apiChallenge.id,
    name: apiChallenge.title,
    iconName: categoryToIcon(category),
    iconColor: categoryColors[category]?.bg || '#8B5CF6',
    daysLeft,
    totalDays,
    members: members.length > 0 ? members : [{ name: 'You', initial: 'Y', color: '#8B5CF6', streak: 0, rank: 1 }],
    todayPrompt: apiChallenge.description || `Complete ${apiChallenge.targetValue} ${apiChallenge.type.toLowerCase().replace('_', ' ')}`,
    progress: { completed: apiChallenge.myProgress || 0, total: apiChallenge.targetValue },
    myStatus: apiChallenge.isCompleted ? 'completed' : 'pending',
    myStreak: apiChallenge.myProgress || 0,
    category,
    xpReward: apiChallenge.xpReward,
    apiData: apiChallenge,
  };
}

/**
 * Get member color by index
 */
export function getMemberColor(index: number): string {
  const colors = ['#8B5CF6', '#F43F5E', '#3B82F6', '#10B981', '#F59E0B'];
  return colors[index % colors.length];
}
