import { Circle } from './types';

/**
 * Generate a random invite code in format MYPA-XXXX
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MYPA-${code}`;
}

/**
 * Get an appropriate icon name based on circle name
 */
export function getCircleIcon(circleName: string): 'running' | 'book' | 'dumbbell' | 'users' {
  const name = circleName.toLowerCase();
  if (name.includes('run') || name.includes('jog') || name.includes('walk')) return 'running';
  if (name.includes('book') || name.includes('read') || name.includes('study')) return 'book';
  if (name.includes('gym') || name.includes('workout') || name.includes('fitness')) return 'dumbbell';
  return 'users';
}

/**
 * Get gradient colors based on circle name/type
 */
export function getCircleGradient(circleName: string): [string, string] {
  const name = circleName.toLowerCase();
  if (name.includes('run') || name.includes('jog') || name.includes('walk')) {
    return ['#fef3c7', '#fde68a'];
  }
  if (name.includes('book') || name.includes('read') || name.includes('study')) {
    return ['#dbeafe', '#bfdbfe'];
  }
  if (name.includes('gym') || name.includes('workout') || name.includes('fitness')) {
    return ['#fce7f3', '#fbcfe8'];
  }
  return ['#f1f5f9', '#e2e8f0'];
}

/**
 * Calculate statistics from circles array
 */
export function calculateCirclesStats(circles: Circle[]) {
  const totalStreaks = circles.reduce((sum, c) => sum + c.streak, 0);
  const totalPosted = circles.reduce(
    (sum, c) => sum + c.members.filter((m) => m.posted).length,
    0
  );
  const totalMembers = circles.reduce((sum, c) => sum + c.members.length, 0);
  const activePercentage = totalMembers > 0 
    ? Math.round((totalPosted / totalMembers) * 100)
    : 0;

  return {
    totalStreaks,
    totalPosted,
    totalMembers,
    activePercentage,
  };
}

/**
 * Filter circles based on search query and filter chip
 */
export function filterCircles(
  circles: Circle[],
  searchQuery: string,
  filterChip: 'all' | 'streak' | 'pending'
): Circle[] {
  return circles.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterChip === 'all') return matchesSearch;
    if (filterChip === 'streak') return matchesSearch && c.streak > 0;
    if (filterChip === 'pending') {
      return matchesSearch && c.members.some((m) => !m.posted);
    }
    return matchesSearch;
  });
}
