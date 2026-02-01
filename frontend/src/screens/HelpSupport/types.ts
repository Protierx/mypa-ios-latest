export interface HelpSupportScreenProps {
  navigation?: any;
}

export type ContactType = 'general' | 'bug' | 'feature';

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface QuickLink {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface ContactTypeOption {
  id: ContactType;
  label: string;
  icon: string;
}
