import { useState, useMemo, useCallback } from 'react';
import { ContactType, FAQ } from '../types';
import { FAQS, SUCCESS_TOAST_DURATION } from '../constants';

interface UseHelpSupportDataReturn {
  searchQuery: string;
  showContactForm: boolean;
  contactType: ContactType;
  contactMessage: string;
  messageSent: boolean;
  expandedFaq: number | null;
  filteredFaqs: FAQ[];
  setSearchQuery: (query: string) => void;
  setShowContactForm: (show: boolean) => void;
  setContactType: (type: ContactType) => void;
  setContactMessage: (message: string) => void;
  setExpandedFaq: (id: number | null) => void;
  handleSubmitContact: () => void;
  handleOpenContact: (type: ContactType) => void;
  toggleFaq: (id: number) => void;
}

export const useHelpSupportData = (): UseHelpSupportDataReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactType, setContactType] = useState<ContactType>('general');
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return FAQS;
    const query = searchQuery.toLowerCase();
    return FAQS.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSubmitContact = useCallback(() => {
    setMessageSent(true);
    setTimeout(() => {
      setShowContactForm(false);
      setMessageSent(false);
      setContactMessage('');
    }, SUCCESS_TOAST_DURATION);
  }, []);

  const handleOpenContact = useCallback((type: ContactType) => {
    setContactType(type);
    setShowContactForm(true);
  }, []);

  const toggleFaq = useCallback((id: number) => {
    setExpandedFaq((prev) => (prev === id ? null : id));
  }, []);

  return {
    searchQuery,
    showContactForm,
    contactType,
    contactMessage,
    messageSent,
    expandedFaq,
    filteredFaqs,
    setSearchQuery,
    setShowContactForm,
    setContactType,
    setContactMessage,
    setExpandedFaq,
    handleSubmitContact,
    handleOpenContact,
    toggleFaq,
  };
};
