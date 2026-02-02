import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
export const SCREEN_HEIGHT = height;
export const ORB_SIZE = Math.min(width * 0.45, 180);

export const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Header - minimal and floating
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Main Content
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Response text at top
  responseContainer: {
    position: 'absolute',
    top: 20,
    left: 32,
    right: 32,
    maxHeight: height * 0.25,
  },
  responseScroll: {
    alignItems: 'center',
  },
  responseText: {
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '400',
  },

  // Orb Section - the star of the show
  orbSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1,
  },
  orbTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
    width: ORB_SIZE * 1.6,
    height: ORB_SIZE * 1.6,
    borderRadius: ORB_SIZE * 0.8,
  },
  orbMain: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden',
  },
  orbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  orbWaves: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orbWave: {
    width: 4,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 2,
  },
  orbWaveTall: {
    height: 36,
  },
  orbWaveTallest: {
    height: 48,
  },
  processingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },

  // Status text
  statusText: {
    marginTop: 32,
    fontSize: 17,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },

  // Live transcript
  transcriptContainer: {
    position: 'absolute',
    bottom: 40,
    left: 32,
    right: 32,
  },
  transcriptText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Bottom Area
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  quickActionTextActive: {
    color: '#10B981',
  },
  quickActionDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Text Input
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(139,92,246,0.3)',
  },

  // Settings Modal styles
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    backgroundColor: '#1E1B4B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  voiceOptions: {
    gap: 12,
    marginBottom: 24,
  },
  voiceOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voiceOptionActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  voiceOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  voiceOptionTextActive: {
    color: '#A78BFA',
  },
  voiceOptionDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
});
