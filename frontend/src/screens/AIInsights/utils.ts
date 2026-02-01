import { SuggestionType, InsightType, ImpactLevel } from './types';
import { SUGGESTION_CONFIG, INSIGHT_COLORS, IMPACT_CONFIG } from './constants';

export const getSuggestionIcon = (type: SuggestionType): string => {
  return SUGGESTION_CONFIG[type]?.icon || 'bulb-outline';
};

export const getSuggestionColor = (type: SuggestionType): string => {
  return SUGGESTION_CONFIG[type]?.color || '#007AFF';
};

export const getInsightColor = (type: InsightType): string => {
  return INSIGHT_COLORS[type] || '#007AFF';
};

export const getImpactBadge = (impact: ImpactLevel): { color: string; bg: string; label: string } => {
  return IMPACT_CONFIG[impact] || IMPACT_CONFIG.low;
};
