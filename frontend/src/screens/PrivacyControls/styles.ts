import { StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  sectionWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  privacyOptionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  privacyDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  circleRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  circleName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  circlePrivacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  circlePrivacyText: {
    fontSize: 14,
    color: '#64748B',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  permIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permContent: {
    flex: 1,
  },
  permLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  permDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  permNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    paddingLeft: 4,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingBottom: 32,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerOptions: {
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pickerOptionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  pickerOptionText: {
    fontSize: 17,
    color: '#0F172A',
  },
  pickerCancel: {
    marginHorizontal: 8,
    marginTop: 8,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
