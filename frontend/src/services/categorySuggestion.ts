/**
 * AI Task Suggestion Service
 *
 * As the user types a task title, this suggests:
 * - Category (Health, Work, Finance, etc.)
 * - Priority (low / medium / high / urgent)
 * - Duration (estimated minutes)
 *
 * All local keyword matching — zero latency, no API call.
 * Future: swap in GPT-based classification for better accuracy.
 */

export type TaskCategory =
  | 'Work'
  | 'Personal'
  | 'Health'
  | 'Errands'
  | 'Finance'
  | 'Social'
  | 'Learning'
  | 'Home';

export type SuggestedPriority = 'low' | 'medium' | 'high' | 'urgent';

// ============================================================================
// Category rules with per-keyword priority + duration hints
// ============================================================================

interface KeywordHint {
  keyword: string;
  priority?: SuggestedPriority;
  duration?: number; // minutes
}

interface CategoryRule {
  category: TaskCategory;
  icon: string;
  color: string;
  defaultPriority: SuggestedPriority;
  defaultDuration: number;
  keywords: KeywordHint[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Health',
    icon: 'heart-outline',
    color: '#EF4444',
    defaultPriority: 'medium',
    defaultDuration: 45,
    keywords: [
      { keyword: 'gym', duration: 60 },
      { keyword: 'workout', duration: 60 },
      { keyword: 'run', duration: 30 },
      { keyword: 'exercise', duration: 45 },
      { keyword: 'doctor', priority: 'high', duration: 60 },
      { keyword: 'dentist', priority: 'high', duration: 60 },
      { keyword: 'medicine', priority: 'high', duration: 10 },
      { keyword: 'yoga', duration: 60 },
      { keyword: 'meditate', duration: 15 },
      { keyword: 'meditation', duration: 15 },
      { keyword: 'sleep', priority: 'low', duration: 15 },
      { keyword: 'walk', duration: 30 },
      { keyword: 'health', duration: 30 },
      { keyword: 'vitamin', priority: 'low', duration: 5 },
      { keyword: 'stretch', duration: 15 },
      { keyword: 'physio', priority: 'high', duration: 45 },
      { keyword: 'therapy', priority: 'high', duration: 60 },
      { keyword: 'weight', duration: 45 },
      { keyword: 'diet', duration: 30 },
      { keyword: 'meal prep', duration: 60 },
      { keyword: 'water', priority: 'low', duration: 5 },
    ],
  },
  {
    category: 'Work',
    icon: 'briefcase-outline',
    color: '#3B82F6',
    defaultPriority: 'high',
    defaultDuration: 30,
    keywords: [
      { keyword: 'meeting', priority: 'high', duration: 30 },
      { keyword: 'email', priority: 'medium', duration: 15 },
      { keyword: 'report', priority: 'high', duration: 60 },
      { keyword: 'deadline', priority: 'urgent', duration: 60 },
      { keyword: 'project', priority: 'high', duration: 60 },
      { keyword: 'client', priority: 'high', duration: 30 },
      { keyword: 'call', priority: 'medium', duration: 15 },
      { keyword: 'presentation', priority: 'high', duration: 90 },
      { keyword: 'review', priority: 'medium', duration: 30 },
      { keyword: 'sprint', priority: 'high', duration: 30 },
      { keyword: 'standup', priority: 'medium', duration: 15 },
      { keyword: 'slack', priority: 'low', duration: 10 },
      { keyword: 'teams', priority: 'medium', duration: 30 },
      { keyword: 'invoice', priority: 'high', duration: 15 },
      { keyword: 'proposal', priority: 'high', duration: 60 },
      { keyword: 'contract', priority: 'urgent', duration: 30 },
      { keyword: 'boss', priority: 'high', duration: 30 },
      { keyword: 'colleague', priority: 'medium', duration: 15 },
      { keyword: 'office', priority: 'medium', duration: 30 },
      { keyword: 'deliver', priority: 'high', duration: 30 },
      { keyword: 'submit', priority: 'high', duration: 30 },
      { keyword: 'send', priority: 'medium', duration: 15 },
      { keyword: 'follow up', priority: 'medium', duration: 10 },
      { keyword: 'agenda', priority: 'medium', duration: 15 },
    ],
  },
  {
    category: 'Finance',
    icon: 'card-outline',
    color: '#10B981',
    defaultPriority: 'high',
    defaultDuration: 15,
    keywords: [
      { keyword: 'pay', priority: 'high', duration: 10 },
      { keyword: 'bill', priority: 'high', duration: 10 },
      { keyword: 'budget', priority: 'medium', duration: 30 },
      { keyword: 'bank', priority: 'high', duration: 30 },
      { keyword: 'transfer', priority: 'high', duration: 10 },
      { keyword: 'tax', priority: 'urgent', duration: 60 },
      { keyword: 'rent', priority: 'urgent', duration: 10 },
      { keyword: 'mortgage', priority: 'urgent', duration: 15 },
      { keyword: 'insurance', priority: 'high', duration: 30 },
      { keyword: 'invest', priority: 'medium', duration: 30 },
      { keyword: 'save', priority: 'medium', duration: 15 },
      { keyword: 'expense', priority: 'medium', duration: 15 },
      { keyword: 'receipt', priority: 'low', duration: 5 },
      { keyword: 'subscription', priority: 'medium', duration: 10 },
      { keyword: 'refund', priority: 'medium', duration: 15 },
      { keyword: 'money', priority: 'medium', duration: 15 },
    ],
  },
  {
    category: 'Errands',
    icon: 'bag-outline',
    color: '#F59E0B',
    defaultPriority: 'medium',
    defaultDuration: 30,
    keywords: [
      { keyword: 'buy', duration: 30 },
      { keyword: 'shop', duration: 45 },
      { keyword: 'groceries', duration: 45 },
      { keyword: 'pick up', duration: 20 },
      { keyword: 'drop off', duration: 20 },
      { keyword: 'return', duration: 20 },
      { keyword: 'post', duration: 15 },
      { keyword: 'mail', duration: 15 },
      { keyword: 'package', duration: 15 },
      { keyword: 'pharmacy', priority: 'high', duration: 20 },
      { keyword: 'store', duration: 30 },
      { keyword: 'order', duration: 10 },
      { keyword: 'collect', duration: 20 },
      { keyword: 'repair', priority: 'high', duration: 30 },
      { keyword: 'fix', priority: 'medium', duration: 30 },
      { keyword: 'laundry', duration: 30 },
      { keyword: 'dry clean', duration: 15 },
      { keyword: 'petrol', duration: 15 },
      { keyword: 'gas', duration: 15 },
      { keyword: 'car wash', duration: 30 },
    ],
  },
  {
    category: 'Social',
    icon: 'people-outline',
    color: '#EC4899',
    defaultPriority: 'medium',
    defaultDuration: 60,
    keywords: [
      { keyword: 'dinner', duration: 90 },
      { keyword: 'lunch', duration: 60 },
      { keyword: 'coffee', duration: 45 },
      { keyword: 'birthday', priority: 'high', duration: 30 },
      { keyword: 'party', duration: 120 },
      { keyword: 'gift', duration: 30 },
      { keyword: 'friend', duration: 60 },
      { keyword: 'family', priority: 'high', duration: 60 },
      { keyword: 'date', duration: 90 },
      { keyword: 'catch up', duration: 45 },
      { keyword: 'visit', duration: 60 },
      { keyword: 'invite', priority: 'medium', duration: 10 },
      { keyword: 'rsvp', priority: 'high', duration: 5 },
      { keyword: 'event', duration: 120 },
      { keyword: 'wedding', priority: 'high', duration: 180 },
      { keyword: 'celebration', duration: 120 },
      { keyword: 'drinks', duration: 90 },
      { keyword: 'text', priority: 'low', duration: 5 },
      { keyword: 'message', priority: 'low', duration: 5 },
    ],
  },
  {
    category: 'Learning',
    icon: 'school-outline',
    color: '#8EAAD8',
    defaultPriority: 'medium',
    defaultDuration: 45,
    keywords: [
      { keyword: 'read', duration: 30 },
      { keyword: 'study', duration: 60 },
      { keyword: 'course', duration: 60 },
      { keyword: 'learn', duration: 45 },
      { keyword: 'book', duration: 30 },
      { keyword: 'class', priority: 'high', duration: 60 },
      { keyword: 'lecture', priority: 'high', duration: 60 },
      { keyword: 'tutorial', duration: 30 },
      { keyword: 'practice', duration: 45 },
      { keyword: 'homework', priority: 'high', duration: 60 },
      { keyword: 'exam', priority: 'urgent', duration: 90 },
      { keyword: 'research', duration: 60 },
      { keyword: 'podcast', priority: 'low', duration: 30 },
      { keyword: 'lesson', duration: 45 },
      { keyword: 'certificate', priority: 'high', duration: 60 },
      { keyword: 'skill', duration: 45 },
      { keyword: 'train', duration: 45 },
    ],
  },
  {
    category: 'Home',
    icon: 'home-outline',
    color: '#14B8A6',
    defaultPriority: 'low',
    defaultDuration: 30,
    keywords: [
      { keyword: 'clean', duration: 30 },
      { keyword: 'tidy', duration: 20 },
      { keyword: 'organise', duration: 30 },
      { keyword: 'organize', duration: 30 },
      { keyword: 'declutter', duration: 45 },
      { keyword: 'wash', duration: 30 },
      { keyword: 'cook', duration: 45 },
      { keyword: 'garden', duration: 45 },
      { keyword: 'mow', duration: 30 },
      { keyword: 'vacuum', duration: 20 },
      { keyword: 'dust', duration: 15 },
      { keyword: 'dishes', duration: 15 },
      { keyword: 'trash', priority: 'medium', duration: 10 },
      { keyword: 'recycle', duration: 10 },
      { keyword: 'furniture', priority: 'medium', duration: 60 },
      { keyword: 'decorate', duration: 60 },
      { keyword: 'paint', duration: 120 },
      { keyword: 'plumber', priority: 'high', duration: 60 },
      { keyword: 'electrician', priority: 'high', duration: 60 },
    ],
  },
];

// ============================================================================
// Full Task Suggestion (category + priority + duration)
// ============================================================================

export interface TaskSuggestion {
  category: TaskCategory;
  priority: SuggestedPriority;
  duration: number; // minutes
  confidence: number; // 0-1
  icon: string;
  color: string;
}

/**
 * Suggest category, priority, and duration based on the task title.
 * Returns null only if there's no meaningful input.
 */
export function suggestFromTitle(title: string): TaskSuggestion | null {
  if (!title || title.trim().length < 2) return null;

  const lower = title.toLowerCase().trim();
  let bestRule: CategoryRule | null = null;
  let bestScore = 0;
  let bestKeywordHit: KeywordHint | null = null;

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    let topHit: KeywordHint | null = null;

    for (const kw of rule.keywords) {
      if (lower.includes(kw.keyword)) {
        score++;
        // Bonus for whole-word match
        const wb = new RegExp(`\\b${kw.keyword}\\b`, 'i');
        if (wb.test(lower)) {
          score += 0.5;
          // Keep the most specific hit (longest keyword)
          if (!topHit || kw.keyword.length > topHit.keyword.length) {
            topHit = kw;
          }
        }
        if (!topHit) topHit = kw;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
      bestKeywordHit = topHit;
    }
  }

  const confidence = Math.min(bestScore / 2, 1);

  if (bestRule && confidence >= 0.25) {
    return {
      category: bestRule.category,
      priority: bestKeywordHit?.priority || bestRule.defaultPriority,
      duration: bestKeywordHit?.duration || bestRule.defaultDuration,
      confidence,
      icon: bestRule.icon,
      color: bestRule.color,
    };
  }

  // Weak/no match → Personal defaults
  return {
    category: 'Personal',
    priority: 'medium',
    duration: 30,
    confidence: 0.1,
    icon: 'person-outline',
    color: '#A1A1AA',
  };
}

// Keep backward-compat alias
export type CategorySuggestion = TaskSuggestion;
export const suggestCategory = suggestFromTitle;

/**
 * Get all available categories for manual selection.
 */
export function getAllCategories(): { category: TaskCategory; icon: string; color: string }[] {
  return [
    ...CATEGORY_RULES.map((r) => ({
      category: r.category,
      icon: r.icon,
      color: r.color,
    })),
    { category: 'Personal', icon: 'person-outline', color: '#A1A1AA' },
  ];
}
