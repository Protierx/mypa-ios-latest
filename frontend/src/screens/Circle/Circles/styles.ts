import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
    paddingBottom: 120,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  joinButtonBlur: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Toast
  toast: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 10,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  toastSuccess: {
    backgroundColor: '#ECFDF5',
  },
  toastInfo: {
    backgroundColor: '#F1F5F9',
  },
  toastText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },

  // Stats
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  statsLeft: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  nudgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
  },
  nudgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b45309',
  },

  // Search & Filter
  searchFilterRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  clearButton: {
    padding: 4,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Circles List
  circlesList: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // Empty State
  emptyState: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyStateBlur: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Circle Card
  circleCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 0,
  },
  circleCardHighlight: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  circleCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  joinedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  joinedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  circleCardContent: {
    padding: 16,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  circleAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInfo: {
    flex: 1,
    minWidth: 0,
  },
  circleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flexShrink: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  streakBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ea580c',
  },
  circleSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  circleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeDone: {
    backgroundColor: '#ecfdf5',
  },
  statusBadgePending: {
    backgroundColor: '#fffbeb',
  },
  statusDoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  statusPendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressFillDone: {
    backgroundColor: '#10b981',
  },
  progressFillPending: {
    backgroundColor: '#8b5cf6',
  },

  // Member Avatars
  memberAvatars: {
    flexDirection: 'row',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  memberAvatarPosted: {
    backgroundColor: '#10b981',
  },
  memberAvatarPending: {
    backgroundColor: '#e2e8f0',
  },
  memberAvatarMore: {
    backgroundColor: '#475569',
  },
  memberInitial: {
    fontSize: 10,
    fontWeight: '600',
  },
  memberInitialPosted: {
    color: '#fff',
  },
  memberInitialPending: {
    color: '#64748b',
  },
  memberMoreText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },

  // Expanded Actions
  expandedActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  expandedButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  openCircleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  openCircleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 8,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 8,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  actionSheetItemPressed: {
    backgroundColor: '#f8fafc',
  },
  actionSheetItemPressedDanger: {
    backgroundColor: '#fef2f2',
  },
  actionSheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetText: {
    flex: 1,
  },
  actionSheetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionSheetSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },

  // Create Modal
  createModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
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
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 16,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  privacyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  privacyButtonActive: {
    backgroundColor: '#0f172a',
  },
  privacyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  privacyButtonTextActive: {
    color: '#fff',
  },
  createSubmitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  createSubmitButtonDisabled: {
    opacity: 0.5,
  },
  createSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Join Modal
  joinModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  joinCodeInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  joinError: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  joinSubmitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  joinSubmitButtonDisabled: {
    opacity: 0.5,
  },
  joinSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  joinSuccessContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  joinSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  joinSuccessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  joinSuccessSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
});
