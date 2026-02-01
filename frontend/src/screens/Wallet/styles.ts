import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },

  // Main Time Card
  mainCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mainCard: {
    borderRadius: 16,
    padding: 20,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalTime: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
  },
  avgLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  clockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  shareButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // XP Card
  xpCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  xpCard: {
    borderRadius: 16,
    padding: 16,
  },
  xpCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  xpLevelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  xpDetails: {
    alignItems: 'flex-end',
  },
  xpValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  xpToNext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  xpProgressContainer: {
    marginBottom: 12,
  },
  xpProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 4,
  },
  xpStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  periodButtonActive: {
    backgroundColor: '#0f172a',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  periodButtonTextActive: {
    color: '#fff',
  },

  // Quick Access
  quickAccessRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  quickAccessButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickAccessBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statCardBlur: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
  },

  // Weekly Chart
  chartCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  chartBlur: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 96,
    gap: 8,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  chartBarLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  chartBarLabelActive: {
    color: '#059669',
  },
  chartBarLabelInactive: {
    color: '#cbd5e1',
  },
  chartBarWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 6,
  },
  chartBarActive: {
    backgroundColor: '#6ee7b7',
  },
  chartBarToday: {
    backgroundColor: '#10b981',
  },
  chartBarInactive: {
    backgroundColor: '#f1f5f9',
  },
  chartDayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  chartDayLabelToday: {
    color: '#059669',
  },

  // Milestones
  milestonesCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  milestonesBlur: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  milestonesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  milestonesBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  milestonesBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#059669',
  },
  milestonesScroll: {
    paddingRight: 16,
    gap: 8,
  },
  milestoneItem: {
    width: 68,
    alignItems: 'center',
  },
  milestoneItemLocked: {
    opacity: 0.6,
  },
  milestoneIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  milestoneIconReached: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneIconLocked: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
  },
  milestoneEmoji: {
    fontSize: 24,
  },
  milestoneLockEmoji: {
    fontSize: 20,
    zIndex: 10,
  },
  milestoneProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  milestoneTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  // Recent Savings
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  recentCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  recentCardBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  recentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentEmoji: {
    fontSize: 20,
  },
  recentContent: {
    flex: 1,
    minWidth: 0,
  },
  recentAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  recentWhen: {
    fontSize: 12,
    color: '#94a3b8',
  },
  recentTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recentTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },

  // How It Works
  howItWorksCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  howItWorksBlur: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  howItWorksGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  howItWorksItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  howItWorksIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  howItWorksTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  howItWorksDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  infoModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 390,
    alignSelf: 'center',
  },
  infoModalButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  infoModalButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  previewTime: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  previewPeriod: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  previewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 24,
  },
  previewStatItem: {
    alignItems: 'center',
  },
  previewStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  previewStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  previewDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  shareOptionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  shareOption: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  shareOptionPressed: {
    backgroundColor: '#e2e8f0',
  },
  shareOptionEmoji: {
    fontSize: 24,
  },
  shareOptionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
});
