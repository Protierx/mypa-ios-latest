import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 120 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748B', fontSize: 14 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, alignItems: 'center' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greetingEmoji: { fontSize: 18 },
  greetingText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  headerButtons: { flexDirection: 'row', gap: 10 },
  headerIconBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerIconBtnActive: { backgroundColor: '#0F172A' },
  addBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  
  // Date Pill
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 8, marginLeft: 20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9' },
  datePillText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  
  // Calendar
  calendarWrap: { marginHorizontal: 20, marginTop: 10, padding: 12, borderRadius: 18, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  calendarCloseBtn: { marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#0F172A' },
  calendarCloseText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  
  // Progress Card
  progressCard: { marginHorizontal: 20, marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  progressValue: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  progressTotal: { fontSize: 18, color: '#CBD5F5' },
  progressUnit: { fontSize: 12, color: '#94A3B8' },
  timeLeft: { alignItems: 'flex-end' },
  timeLeftLabel: { fontSize: 10, color: '#CBD5F5', textTransform: 'uppercase' },
  timeLeftValue: { fontSize: 16, fontWeight: '700', color: '#475569' },
  progressBar: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 999, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: '#10B981' },
  progressFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  progressMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressDot: { width: 6, height: 6, borderRadius: 3 },
  progressMetaText: { fontSize: 11, color: '#64748B' },
  progressMetaStrong: { fontWeight: '700', color: '#0F172A' },
  dumpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F1F5F9' },
  dumpBtnText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  
  // Focus Card
  focusCard: { marginHorizontal: 20, marginTop: 14, borderRadius: 24, padding: 18 },
  focusCardWrap: { marginHorizontal: 20, marginTop: 14 },
  focusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  focusStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  focusStreak: { flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveDotActive: { backgroundColor: '#FFFFFF' },
  liveDotPaused: { backgroundColor: '#FDE68A' },
  focusStatusText: { fontSize: 11, color: '#FFFFFF', fontWeight: '700', textTransform: 'uppercase' },
  focusStreakText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  focusTaskTitle: { marginTop: 12, fontSize: 14, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  ringTime: { fontSize: 26, color: '#FFFFFF', fontWeight: '700' },
  timerStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 },
  timerStatItem: { alignItems: 'center' },
  timerStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  timerStatValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  timerDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.3)' },
  timerControls: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14 },
  timerControlBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  timerMainBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  
  // Next Focus Card
  nextFocusCard: { marginHorizontal: 20, marginTop: 12, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextFocusPlay: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  nextFocusInfo: { flex: 1 },
  nextFocusLabel: { fontSize: 10, color: '#34D399', fontWeight: '700', textTransform: 'uppercase' },
  nextFocusTitle: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  nextFocusMeta: { fontSize: 12, color: '#94A3B8' },
  nextFocusDone: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  
  // Swipe Hint
  swipeHint: { textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 12 },
  
  // Added Banner
  addedBanner: { marginHorizontal: 20, marginTop: 12, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  addedIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  addedTextWrap: { flex: 1 },
  addedTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  addedSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  
  // Task List
  taskList: { marginTop: 12, paddingHorizontal: 20, gap: 10 },
  taskListItem: { borderRadius: 18 },
  highlightedTask: { shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  
  // Task Card (SwipeableTask)
  taskWrapper: { position: 'relative' },
  swipeBgRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  taskCardCompleted: { opacity: 0.6 },
  taskCardActive: { borderWidth: 1, borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  taskCardHighlighted: { borderWidth: 2, borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  taskAccent: { width: 4, height: '100%', borderRadius: 4, marginRight: 12 },
  taskContent: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  taskTimeBlock: { width: 48, alignItems: 'center' },
  taskTime: { fontSize: 13, fontWeight: '700', color: '#475569' },
  taskTimeCompleted: { color: '#94A3B8' },
  quickCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#CBD5F5', alignItems: 'center', justifyContent: 'center' },
  quickCheckInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  completedCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  focusPlay: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  focusPlayActive: { backgroundColor: '#10B981' },
  taskDetails: { flex: 1 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', flex: 1 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#94A3B8' },
  priorityBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  priorityText: { fontSize: 10, color: '#EF4444', fontWeight: '700' },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  taskMetaText: { fontSize: 11, color: '#94A3B8' },
  taskMetaDot: { color: '#CBD5F5', fontSize: 12, marginHorizontal: 2 },
  taskCategoryDot: { width: 6, height: 6, borderRadius: 3 },
  tomorrowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F1F5F9' },
  tomorrowText: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  
  // Empty State
  emptyState: { marginHorizontal: 20, marginTop: 20, padding: 24, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  emptySubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  emptyButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  emptyPrimary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0F172A' },
  emptyPrimaryText: { color: '#FFFFFF', fontWeight: '600' },
  emptySecondary: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EDE9FE', flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptySecondaryText: { color: '#7C3AED', fontWeight: '600' },
  
  // Modal Base
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  modalBackdrop: { flex: 1 },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  modalBody: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  modalInput: { backgroundColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A', marginBottom: 12 },
  modalHelper: { fontSize: 11, color: '#94A3B8', marginBottom: 8 },
  
  // AI Suggestion
  aiSuggestionBanner: { backgroundColor: '#F5F3FF', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E9D5FF' },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLoadingText: { fontSize: 12, color: '#8B5CF6', fontWeight: '600' },
  aiSuggestionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiSuggestionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiSuggestionLabel: { fontSize: 12, color: '#8B5CF6', fontWeight: '700' },
  aiApplyAllBtn: { backgroundColor: '#8B5CF6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  aiApplyAllText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  aiSuggestionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aiChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E9D5FF' },
  aiChipApplied: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  aiChipText: { fontSize: 11, color: '#6366F1', fontWeight: '600' },
  aiChipTextApplied: { color: '#059669' },
  
  // Modal Fields
  modalRow: { flexDirection: 'row', gap: 12 },
  modalField: { flex: 1 },
  modalLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  
  // Date Picker
  dateQuickRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dateQuickChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9' },
  dateQuickChipActive: { backgroundColor: '#7C3AED' },
  dateQuickText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  dateQuickTextActive: { color: '#FFFFFF' },
  
  // Picker Container
  pickerContainer: { backgroundColor: '#F8FAFC', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  fullWidthPickerContainer: { backgroundColor: '#F8FAFC', borderRadius: 14, marginBottom: 12 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  pickerTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  pickerCancelText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  pickerDoneText: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },
  datePickerChip: { backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#E9D5FF' },
  datePickerChipText: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },
  
  // Time Picker
  timePickerButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  timePickerText: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  timePickerPlaceholder: { color: '#94A3B8' },
  
  // Duration
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  durationChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9' },
  durationChipActive: { backgroundColor: '#7C3AED' },
  durationText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  durationTextActive: { color: '#FFFFFF' },
  
  // Category
  categoryRow: { marginBottom: 12 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: '#F1F5F9', marginRight: 8 },
  categoryChipActive: { backgroundColor: '#0F172A' },
  categoryChipText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  categoryChipTextActive: { color: '#FFFFFF' },
  
  // Priority
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priorityChip: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  priorityChipActive: { backgroundColor: '#2563EB' },
  priorityTextLabel: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  priorityTextActive: { color: '#FFFFFF' },
  
  // Modal Actions
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10, alignItems: 'center' },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontWeight: '600' },
  modalSubmit: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#7C3AED', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  modalSubmitText: { color: '#FFFFFF', fontWeight: '700' },
  modalDelete: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalDeleteText: { color: '#EF4444', fontWeight: '700' },
  
  // Session Summary
  summaryCard: { marginHorizontal: 24, padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF' },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  summarySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 6 },
  summaryButton: { marginTop: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center' },
  summaryButtonText: { color: '#FFFFFF', fontWeight: '700' },

  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
