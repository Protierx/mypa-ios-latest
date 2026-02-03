import { Animated } from 'react-native';
import { AssistantState, VoiceCommand } from '../../services/voiceAssistant';

export interface VoiceAssistantScreenProps {
  visible: boolean;
  onClose: () => void;
}

export interface Message {
  id: number;
  text: string;
  isUser: boolean;
  time: string;
  command?: VoiceCommand;
}

export type VoiceType = 'nova' | 'alloy' | 'shimmer';

export interface VoiceOption {
  id: VoiceType;
  name: string;
  description: string;
}

export interface StatusInfo {
  text: string;
  color: string;
}

export { AssistantState, VoiceCommand };
