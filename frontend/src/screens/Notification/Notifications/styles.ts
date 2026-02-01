import { StyleSheet } from 'react-native';
import { colors } from '../../../styles/colors';

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
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  masterToggle: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  masterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  masterIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  masterDesc: {
    fontSize: 13,
    color: '#64748B',
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  quietHoursConfig: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quietNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
});
