import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },

  // Status Card
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statusGradient: {
    padding: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  statusIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  quietActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quietActiveText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E6E73',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Category Sections
  categoryContainer: {
    borderBottomWidth: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  categoryItems: {
    backgroundColor: '#F9F9FB',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  categorySeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 58,
  },

  // Settings Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 62,
  },

  // Quiet Hours
  quietTimesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  quietTimeCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
  },
  quietTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  quietTimeLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  quietTimeArrow: {
    paddingHorizontal: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  quietHoursInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quietHoursInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },

  // Test Notification
  testCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  testCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testCardText: {
    flex: 1,
  },
  testCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  testCardSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  testButtonDisabled: {
    backgroundColor: '#B4D5FF',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  testSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  testSuccessText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '500',
  },

  // Info Section
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },

  // Time Picker Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBackdrop: {
    flex: 1,
  },
  timePickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  timePickerCancel: {
    fontSize: 17,
    color: '#007AFF',
  },
  timePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  timePickerDone: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Custom Time Picker
  customTimePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 8,
  },
  timeColumn: {
    alignItems: 'center',
    width: 80,
  },
  timeArrowButton: {
    padding: 8,
  },
  timeValueBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  periodBox: {
    paddingHorizontal: 12,
    minWidth: 60,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1C1C1E',
    marginHorizontal: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  quickSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickSelectButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  quickSelectText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
