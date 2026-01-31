import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../styles/colors';

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

  // ... Additional styles truncated for brevity
  // The full styles would be included here
});
