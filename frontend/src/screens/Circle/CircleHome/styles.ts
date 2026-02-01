import { StyleSheet, Dimensions } from 'react-native';
import { colors as Colors } from '../../../styles/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const postSelectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  cancelButton: {
    padding: 4,
  },
  headerText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deleteButton: {
    padding: 4,
  },
  checkboxRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
});

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  circleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  circleEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  circleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  postedCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabInactive: {
    backgroundColor: Colors.surface,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabTextInactive: {
    color: Colors.textSecondary,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Filters
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryLight,
  },
  filterPillInactive: {
    backgroundColor: Colors.surface,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
  },
  filterTextInactive: {
    color: Colors.textSecondary,
  },

  // Post Card
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  postCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  postTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },

  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 16,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  clapEmoji: {
    fontSize: 16,
  },

  // System Card
  systemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  systemCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  systemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  systemTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  systemHideButton: {
    padding: 8,
    marginLeft: 8,
  },
  hiddenPostsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  hiddenPostsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Section Title
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  challengeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeSectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  challengeSectionActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Member Card
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  memberCardPlain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberDetails: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  memberRole: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  memberStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  adminBadge: {
    fontSize: 16,
  },
  
  // Admin & Member Management Styles
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminTagBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadgeSmall: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeSmallText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  editedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  systemTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postNoteContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  postNoteText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // iOS Action Sheet Styles
  actionSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 34,
  },
  actionSheetGroup: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  actionSheetButtonDestructive: {
    borderBottomWidth: 0,
  },
  actionSheetButtonText: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '400',
  },
  actionSheetCancel: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
  
  // Member Option Modal
  memberOptionHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 8,
  },
  memberOptionAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberOptionAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  memberOptionName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  memberOptionRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  
  // Edit Post Modal - iOS Themed
  editPostSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  editPostSheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  editPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  editPostCancelText: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '400',
  },
  editPostTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  editPostSaveText: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '600',
  },
  editPostContent: {
    padding: 16,
    minHeight: 150,
  },
  editPostTextInput: {
    fontSize: 17,
    color: Colors.textPrimary,
    lineHeight: 24,
    minHeight: 120,
  },
  editPostInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    marginTop: 'auto',
  },
  editPostInfoText: {
    fontSize: 13,
    color: '#64748B',
  },
  
  // Circle Settings Modal
  settingsSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsRowInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingsRowTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  settingsRowSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.danger,
  },

  // Challenge Card
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  challengeJoinButton: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 40,
  },
  challengeJoinText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  challengeJoinedBadge: {
    marginTop: 10,
    backgroundColor: Colors.successLight,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  challengeJoinedText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: 13,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  challengeAssigner: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: Colors.warningLight,
  },
  statusAccepted: {
    backgroundColor: Colors.successLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPending: {
    color: Colors.warningText,
  },
  statusTextAccepted: {
    color: Colors.successText,
  },
  challengeDueTime: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Create Button
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // Invite
  inviteCodeBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inviteLinkBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inviteLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  inviteLink: {
    fontSize: 14,
    color: Colors.primary,
    flex: 1,
    marginRight: 12,
  },
  copyButton: {
    padding: 8,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },

  // Form
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  selectInputText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  memberPickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  memberPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberPickerItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  memberPickerItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  memberPickerItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: Colors.primary,
  },
  toggleOff: {
    backgroundColor: Colors.border,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Activity Card Styles
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  // Header Icons
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Navigation
  navigationGrid: {
    marginBottom: 16,
    gap: 8,
  },
  navigationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navigationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  navigationButtonActive: {
    backgroundColor: Colors.primary,
  },
  navigationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  navigationButtonTextActive: {
    color: Colors.white,
  },

  // Empty States
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginTop: 8,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    marginTop: 8,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  filterEmptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 8,
  },
  filterEmptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  filterEmptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Start New Challenge Button
  startNewChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    marginTop: 16,
    gap: 8,
  },
  startNewChallengeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Type Chips for Challenge Creation
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.primary,
  },

  // Modal Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // Assign Modal Styles
  assignModalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 20,
    maxHeight: '90%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  assignModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  assignModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  assignModalClose: {
    padding: 4,
  },
  assignModalContent: {
    flex: 1,
  },
  assignSection: {
    marginBottom: 20,
  },
  assignLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  assignInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assignNoteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  assignSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assignSelectPlaceholder: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  assignSelectedMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  assignSelectedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignSelectedAvatarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  assignSelectedName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  assignBottomButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: 34,
  },
  assignCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  assignCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  assignSubmitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  assignSubmitButtonDisabled: {
    opacity: 0.5,
  },
  assignSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  assignSubmitButtonTextDisabled: {
    color: Colors.white,
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentOptionActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  segmentOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Date/Time Pickers
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  datePickerButtonText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timePickerLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timePickerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timePickerInput: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  iosPickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerDoneButton: {
    padding: 12,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pickerDoneButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  dueSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },

  // Toggle Styles
  toggleRowNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelNew: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  toggleRowWithSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: Colors.primary,
  },
  toggleSwitchOff: {
    backgroundColor: Colors.border,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  toggleKnobOff: {
    alignSelf: 'flex-start',
  },

  // Repeat Options
  repeatOptions: {
    marginTop: 8,
  },
  repeatEndOptions: {
    gap: 8,
  },
  repeatEndOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  repeatEndOptionActive: {},
  repeatEndOptionText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  repeatEndDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  repeatEndDateButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  countStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  stepperLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // XP Selector
  xpSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  xpOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  xpOptionSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  xpOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  xpOptionTextSelected: {
    color: Colors.primary,
  },

  // Member Picker Grid
  memberPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  memberPickerGridItem: {
    width: 80,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
  },
  memberPickerGridItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
  memberPickerAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  memberPickerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberPickerAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  memberPickerCheckmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  memberPickerName: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  memberPickerNameSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Action Sheet Header
  actionSheetHeader: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 8,
  },
  actionSheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Invite Modal Styles
  inviteLinkSection: {
    marginBottom: 16,
  },
  inviteLinkRow: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  inviteLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inviteLinkButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteShareLinkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  inviteShareLinkText: {
    color: Colors.white,
    fontWeight: '600',
  },
  inviteCopyLinkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
  },
  inviteCopyLinkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  inviteDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  inviteCodeSection: {
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  inviteCodeDisplay: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  inviteCodeBig: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 4,
  },
  inviteCopyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  inviteCopyCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  inviteHelperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },

  // Share Modal Styles
  createDailyCardButton: {
    marginBottom: 16,
  },
  createDailyCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createDailyCardText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  shareOrDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  shareOrLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  shareOrText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: Colors.textMuted,
  },
  privacyOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  privacyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyOptionActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  privacyRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyRadioActive: {
    borderColor: Colors.primary,
  },
  privacyRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  privacyOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },

  // Today Modal Styles
  checkinStats: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  memberListScroll: {
    maxHeight: 300,
  },
  todayMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  todayMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayMemberAvatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  todayMemberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  todayMemberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  todayMemberStatus: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  postedCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayModalActions: {
    marginTop: 16,
    gap: 12,
  },
  todayShareButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  todayShareButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  todayShareButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  todayAssignButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  todayAssignButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Member Detail Modal
  memberDetailHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  memberDetailAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  memberDetailAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  memberDetailName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  memberDetailLastCheckin: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  memberDetailPreview: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  memberDetailPreviewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
  },
  memberDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  memberDetailStat: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  memberDetailStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  memberDetailStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  memberDetailActions: {
    gap: 12,
  },
  memberDetailViewPost: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  memberDetailViewPostText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  memberDetailAssign: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  memberDetailAssignText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Members Modal
  membersModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  membersModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersModalAvatarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  membersModalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  membersModalName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  membersModalPosted: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  circlePrivacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
  },
  circlePrivacyText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
