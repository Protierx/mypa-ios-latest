export interface ResetScreenProps {
  navigation?: any;
}

export interface Message {
  id: number;
  type: 'ai' | 'user';
  text: string;
}

export type BreathePhase = 'in' | 'hold' | 'out';
