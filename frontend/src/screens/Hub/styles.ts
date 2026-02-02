/**
 * Hub Screen Styles - Premium Redesign
 * Clean, modern, million-dollar app aesthetic
 * Inspired by Linear, Notion, Apple Fitness
 */
import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Base Container
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // ============ HEADER SECTION ============
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b45309',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },

  // ============ CONTENT ============
  content: {
    paddingHorizontal: 24,
  },

  // ============ AI HERO CARD ============
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  heroGradient: {
    padding: 28,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  heroCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7c3aed',
  },

  // ============ SECTION HEADER ============
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#7c3aed',
  },
  progressRingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7c3aed',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
  },

  // ============ TASK CARDS ============
  taskList: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  taskAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  taskCardActive: {
    borderColor: '#7c3aed',
    borderWidth: 1.5,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  taskCardCompleted: {
    opacity: 0.6,
    backgroundColor: '#f8fafc',
  },
  taskCardOverdue: {
    borderColor: '#fecaca',
    borderWidth: 1.5,
    backgroundColor: '#fef2f2',
  },
  taskCardUrgent: {
    borderColor: '#fed7aa',
    borderWidth: 1.5,
    backgroundColor: '#fffbeb',
  },
  taskRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  taskCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  taskCheckboxActive: {
    borderColor: '#7c3aed',
  },
  taskCheckboxCompleted: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  taskCheckboxFocus: {
    borderColor: '#7c3aed',
    backgroundColor: '#f3e8ff',
  },
  taskContent: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 4,
  },
  taskTimeOverdue: {
    color: '#ef4444',
    fontWeight: '700',
  },
  taskTimeUrgent: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  taskTimeUntil: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginLeft: 2,
  },
  taskDuration: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  taskDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
  },
  taskCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
  },
  overdueIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f59e0b',
  },
  taskAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ ADD TASK BUTTON ============
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
  },
  addTaskText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },

  // ============ SOCIAL TEASER - Compact ============
  socialTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  socialTeaserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  socialAvatarsCompact: {
    flexDirection: 'row',
  },
  socialAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  socialAvatarOverlap: {
    marginLeft: -10,
  },
  socialAvatarSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  socialTeaserText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    flex: 1,
  },
  socialTeaserBold: {
    fontWeight: '700',
    color: '#0f172a',
  },

  // ============ XP POPUP ============
  xpPopup: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 50,
  },
  xpPopupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  xpPopupText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ============ EMPTY STATE ============
  emptyTasks: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },

  // ============ STATS ROW ============
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ============ QUICK ACTIONS ============
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },

  // ============ PROGRESS BAR ============
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 4,
  },
  progressBarFillOverdue: {
    backgroundColor: '#ef4444',
  },
  progressBarFillComplete: {
    backgroundColor: '#10b981',
  },
  progressStats: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  progressBarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7c3aed',
  },
  progressTextOverdue: {
    color: '#ef4444',
  },
  progressTextComplete: {
    color: '#10b981',
  },
  timeEstimate: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 2,
  },

  // ============ EMPTY STATE ============
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyStateCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },

  // ============ UTILITY STYLES ============
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonPressed: {
    opacity: 0.7,
  },

  // Loading State
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.2,
  },
});
