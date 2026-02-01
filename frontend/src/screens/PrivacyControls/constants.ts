import { Circle, PrivacyMode, PrivacyOption } from './types';

export const INITIAL_CIRCLES: Circle[] = [
  { id: 1, name: 'Morning Warriors', privacy: 'metrics' },
  { id: 2, name: 'Product Team', privacy: 'proof' },
  { id: 3, name: 'Book Club', privacy: 'private' },
];

export const PRIVACY_MODES: PrivacyMode[] = [
  {
    id: 'private',
    label: 'Private',
    desc: 'Only you can see your activity',
    icon: 'lock-closed',
  },
  {
    id: 'metrics',
    label: 'Metrics only',
    desc: 'Share numbers, no personal details',
    icon: 'eye',
  },
  {
    id: 'proof',
    label: 'Proof to circle',
    desc: 'Share photos and full details',
    icon: 'people',
  },
];

export const PRIVACY_OPTIONS: PrivacyOption[] = [
  { value: 'default', label: 'Use default' },
  { value: 'private', label: 'Private' },
  { value: 'metrics', label: 'Metrics only' },
  { value: 'proof', label: 'Proof to circle' },
];
