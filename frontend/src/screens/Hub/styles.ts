/**
 * Hub Screen Styles
 * Centralized styles for the Hub module
 */
import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  
  // Ambient Background
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  ambientBlob1: {
    top: 80,
    right: -80,
    width: 256,
    height: 256,
    backgroundColor: 'rgba(221, 214, 254, 0.3)',
  },
  ambientBlob2: {
    top: 240,
    left: -80,
    width: 192,
    height: 192,
    backgroundColor: 'rgba(191, 219, 254, 0.3)',
  },
  ambientBlob3: {
    bottom: 160,
    right: 40,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(253, 230, 138, 0.3)',
  },
  
  // XP Popup
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  xpPopupText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  greetingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Content
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  
  // Briefing Card
  briefingCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  briefingOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  briefingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  orbContainer: {
    position: 'relative',
  },
  orbRipple: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
  },
  orb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingTextContainer: {
    flex: 1,
  },
  briefingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  briefingTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
  },
  aiBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ddd6fe',
  },
  briefingSubtitle: {
    color: 'rgba(221, 214, 254, 0.8)',
    fontSize: 12,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  
  // Section
  section: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
  },
  
  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
    backgroundColor: '#0f172a',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  
  // Task List
  taskList: {
    gap: 10,
  },
  emptyTasks: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyTasksText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  
  // Add Task Button
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addTaskIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  
  // Ask MYPA Card
  askMypaCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  askMypaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  askMypaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askMypaTextContainer: {
    flex: 1,
  },
  askMypaTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  askMypaSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  
  // Reset Button
  resetButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  resetLink: {
    color: '#8b5cf6',
    fontWeight: '500',
  },
  
  // Button States
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
});
