import { VoiceOptionItem, LanguageType, SpeedType } from './types';

export const LANGUAGES: LanguageType[] = ['English', 'Spanish', 'French', 'Arabic'];

export const SPEEDS: SpeedType[] = ['Slow', 'Normal', 'Fast'];

export const VOICE_OPTIONS: VoiceOptionItem[] = [
  { id: 'Nova', desc: 'Warm & friendly' },
  { id: 'Aria', desc: 'Calm & professional' },
  { id: 'Echo', desc: 'Energetic & upbeat' },
];
