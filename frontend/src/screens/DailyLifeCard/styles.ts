import { StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../../styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.base,
  },
  dateCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  dateLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  highlightItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  highlightTime: {
    width: 70,
  },
  timeText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  highlightContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timelineDot: {},
  highlightTitle: {
    fontSize: 15,
    color: colors.foreground,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  moodButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  moodEmoji: {
    fontSize: 24,
  },
});
