import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 120 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748B', fontSize: 14 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, alignItems: 'flex-start' },
  greetingText: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  title: { fontSize: 26, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  headerButtons: { flexDirection: 'row', gap: 10 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerIconBtnActive: { backgroundColor: '#0F172A' },
  addBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  
  // Date Pill
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 8, marginLeft: 20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9' },
  datePillText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  
  // Calendar
  calendarWrap: { marginHorizontal: 20, marginTop: 10, padding: 12, borderRadius: 18, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  calendarCloseBtn: { marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#0F172A' },
  calendarCloseText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  
  // Progress Card
  progressCardWrapper: { marginHorizontal: 20, marginTop: 14 },
  progressCard: { padding: 24, borderRadius: 28, shadowColor: '#312e81', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  motivationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  motivationEmoji: { fontSize: 20 },
  motivationText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  bigNumberRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginVertical: 8 },
  bigNumber: { fontSize: 64, fontWeight: '800', color: '#fff', letterSpacing: -2 },
  bigNumberSlash: { fontSize: 40, fontWeight: '300', color: 'rgba(255,255,255,0.4)', marginHorizontal: 4 },
  bigNumberTotal: { fontSize: 40, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 999 },
  timeRemainingText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 12, fontWeight: '500' },
  
  // Focus Card
  focusCardWrap: { marginHorizontal: 20, marginTop: 16 },
  focusCard: { borderRadius: 28, padding: 24, alignItems: 'center' },
  focusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  focusStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  focusStreakPill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveDotActive: { backgroundColor: '#4ADE80' },
  liveDotPaused: { backgroundColor: '#FBBF24' },
  focusStatusText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  focusStreakText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringTimeMain: { fontSize: 40, color: '#FFFFFF', fontWeight: '700', letterSpacing: -1 },
  ringLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'lowercase', marginTop: 2 },
  ringTime: { fontSize: 26, color: '#FFFFFF', fontWeight: '700' },
  focusTaskTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '700', textAlign: 'center', marginTop: 8 },
  focusMessage: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  timerControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 },
  timerControlBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  timerMainBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  focusStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', width: '100%' },
  focusStatItem: { flex: 1, alignItems: 'center' },
  focusStatValue: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
  focusStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'lowercase' },
  focusStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
  
  // Next Focus Card
  nextFocusCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  nextFocusPlayWrap: { },
  nextFocusPlay: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  nextFocusInfo: { flex: 1 },
  nextFocusLabel: { fontSize: 11, color: '#A5B4FC', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  nextFocusTitle: { fontSize: 17, color: '#FFFFFF', fontWeight: '600', marginTop: 2 },
  nextFocusMeta: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  nextFocusCheck: { padding: 4 },
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
  taskList: { marginTop: 16, paddingHorizontal: 20, gap: 10 },
  taskListItem: { borderRadius: 16 },
  highlightedTask: { shadowColor: '#7c3aed', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  
  // Task Card (SwipeableTask)
  taskWrapper: { position: 'relative', overflow: 'hidden', borderRadius: 16 },
  swipeBgRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 90, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 16, borderBottomRightRadius: 16 },
  deleteButton: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  deleteText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', marginTop: 4 },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  taskCardCompleted: { backgroundColor: '#F8FAFC' },
  taskCardActive: { borderWidth: 2, borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  taskCardHighlighted: { borderWidth: 2, borderColor: '#7c3aed', backgroundColor: '#FAF5FF' },
  taskCardHighPriority: { borderLeftWidth: 0 },
  
  // Calendar Event Card (different style)
  calendarEventCard: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed' as const },
  calendarIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  calendarBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  calendarBadgeText: { fontSize: 10, fontWeight: '600', color: '#3B82F6' },
  
  taskAccent: { width: 4, height: 48, borderRadius: 2, marginRight: 12 },
  taskContent: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  taskCheckArea: { width: 44, alignItems: 'center', justifyContent: 'center' },
  quickCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  quickCheckHighPriority: { borderColor: '#FECACA' },
  quickCheckInner: { width: 0, height: 0 },
  completedCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  focusPlay: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  focusPlayActive: { backgroundColor: '#10B981' },
  taskDetails: { flex: 1 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', flex: 1 },
  taskTitleCompleted: { textDecorationLine: 'line-through', textDecorationColor: '#94A3B8', color: '#94A3B8' },
  taskTitleHighPriority: { color: '#0F172A' },
  priorityBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  priorityText: { fontSize: 11, color: '#EF4444', fontWeight: '800' },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  taskMetaText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  taskMetaDot: { color: '#CBD5E1', fontSize: 10 },
  taskCategoryDot: { width: 6, height: 6, borderRadius: 3 },
  taskTimeBlock: { width: 50, alignItems: 'center' },
  taskTime: { fontSize: 14, fontWeight: '700', color: '#475569' },
  taskTimeCompleted: { color: '#94A3B8' },
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
  
  // Session Summary / Celebration
  celebrationOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)' },
  celebrationCard: { width: '85%', maxWidth: 340, borderRadius: 28, backgroundColor: '#FFFFFF', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  celebrationHeader: { paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24, alignItems: 'center' },
  celebrationEmoji: { fontSize: 56, marginBottom: 12 },
  celebrationTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  celebrationMessage: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 4 },
  celebrationBody: { padding: 24, alignItems: 'center' },
  celebrationTaskName: { fontSize: 16, fontWeight: '600', color: '#1e293b', textAlign: 'center', marginBottom: 12 },
  xpEarnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 20 },
  xpEarnedText: { fontSize: 15, fontWeight: '700', color: '#B45309' },
  celebrationStats: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24 },
  celebrationStatItem: { flex: 1, alignItems: 'center' },
  celebrationStatIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  celebrationStatValue: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  celebrationStatLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  celebrationStatDivider: { width: 1, height: 50, backgroundColor: '#E2E8F0' },
  celebrationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F172A', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%' },
  celebrationButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  
  // Legacy summary styles (kept for compatibility)
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
