import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface HelpSupportScreenProps {
  navigation?: any;
}

export function HelpSupportScreen({ navigation }: HelpSupportScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactType, setContactType] = useState<'general' | 'bug' | 'feature'>('general');
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { id: 1, question: "How do I connect my calendar?", answer: "Go to Settings > App Settings > Connected Services. You can connect Google Calendar, Apple Calendar, or Outlook." },
    { id: 2, question: "What is a Circle?", answer: "Circles are accountability groups where you can share your daily progress with friends, family, or colleagues." },
    { id: 3, question: "How does the Time Wallet work?", answer: "The Time Wallet tracks time you save by completing tasks efficiently. When you finish a task early, MYPA calculates the time saved." },
    { id: 4, question: "How do I change my notification settings?", answer: "Go to Profile > App Settings > Permissions. You can customize what types of notifications you receive." },
    { id: 5, question: "Can I export my data?", answer: "Yes! Go to Settings > App Settings > Data & Storage > Export My Data." },
    { id: 6, question: "What are XP and Levels?", answer: "XP (Experience Points) are earned by completing tasks, maintaining streaks, and participating in circles. Higher levels unlock new features." },
  ];

  const quickLinks = [
    { id: 'guide', label: 'Getting Started Guide', icon: 'book', color: '#3B82F6' },
    { id: 'video', label: 'Video Tutorials', icon: 'play-circle', color: '#EF4444' },
    { id: 'privacy', label: 'Privacy Policy', icon: 'shield-checkmark', color: '#10B981' },
    { id: 'terms', label: 'Terms of Service', icon: 'document-text', color: '#64748B' },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const handleSubmitContact = () => {
    setMessageSent(true);
    setTimeout(() => {
      setShowContactForm(false);
      setMessageSent(false);
      setContactMessage('');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search help articles..."
            placeholderTextColor="#94A3B8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.quickContactGrid}>
          <TouchableOpacity 
            style={styles.quickContactCard}
            onPress={() => { setContactType('general'); setShowContactForm(true); }}
          >
            <View style={[styles.quickContactIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.quickContactLabel}>Chat</Text>
            <Text style={styles.quickContactDesc}>Message us</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickContactCard}
            onPress={() => { setContactType('bug'); setShowContactForm(true); }}
          >
            <View style={[styles.quickContactIcon, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="bug" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.quickContactLabel}>Bug</Text>
            <Text style={styles.quickContactDesc}>Report issue</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickContactCard}
            onPress={() => { setContactType('feature'); setShowContactForm(true); }}
          >
            <View style={[styles.quickContactIcon, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="bulb" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.quickContactLabel}>Idea</Text>
            <Text style={styles.quickContactDesc}>Suggest feature</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.responseTime}>
          <Ionicons name="time" size={20} color="#10B981" />
          <View>
            <Text style={styles.responseTimeTitle}>Typical response time</Text>
            <Text style={styles.responseTimeValue}>Under 24 hours</Text>
          </View>
        </View>

        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={styles.card}>
            {filteredFaqs.length === 0 ? (
              <View style={styles.noResults}>
                <Ionicons name="help-circle" size={40} color="#CBD5E1" />
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsDesc}>Try a different search term</Text>
              </View>
            ) : (
              filteredFaqs.map((faq, i) => (
                <TouchableOpacity
                  key={faq.id}
                  style={[styles.faqItem, i > 0 && styles.faqItemBorder]}
                  onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color="#CBD5E1"
                      style={expandedFaq === faq.id ? { transform: [{ rotate: '90deg' }] } : {}}
                    />
                  </View>
                  {expandedFaq === faq.id && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>RESOURCES</Text>
          <View style={styles.card}>
            {quickLinks.map((link, i) => (
              <TouchableOpacity key={link.id} style={[styles.resourceItem, i > 0 && styles.resourceItemBorder]}>
                <View style={[styles.resourceIcon, { backgroundColor: link.color }]}>
                  <Ionicons name={link.icon as any} size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.resourceLabel}>{link.label}</Text>
                <Ionicons name="open-outline" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.contactCard, { marginBottom: 120 }]}>
          <View style={styles.contactRow}>
            <Ionicons name="mail" size={20} color="#94A3B8" />
            <Text style={styles.contactEmail}>support@mypa.app</Text>
          </View>
          <Text style={styles.contactNote}>
            For urgent matters, you can email us directly. We typically respond within 24 hours on business days.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showContactForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            {messageSent ? (
              <View style={styles.successView}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={32} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Message Sent!</Text>
                <Text style={styles.successDesc}>We'll get back to you within 24 hours</Text>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {contactType === 'bug' ? 'Report a Bug' : 
                     contactType === 'feature' ? 'Suggest a Feature' : 
                     'Contact Us'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowContactForm(false)}>
                    <Ionicons name="close" size={24} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.typePills}>
                  {[
                    { id: 'general', label: 'General', icon: 'chatbubble' },
                    { id: 'bug', label: 'Bug', icon: 'bug' },
                    { id: 'feature', label: 'Feature', icon: 'bulb' },
                  ].map(type => (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.typePill, contactType === type.id && styles.typePillActive]}
                      onPress={() => setContactType(type.id as typeof contactType)}
                    >
                      <Ionicons name={type.icon as any} size={16} color={contactType === type.id ? '#FFFFFF' : '#64748B'} />
                      <Text style={[styles.typePillText, contactType === type.id && { color: '#FFFFFF' }]}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={styles.messageInput}
                  value={contactMessage}
                  onChangeText={setContactMessage}
                  placeholder={
                    contactType === 'bug' 
                      ? "What happened? What did you expect to happen?"
                      : contactType === 'feature'
                      ? "Describe the feature you'd like to see..."
                      : "How can we help?"
                  }
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.sendButton, !contactMessage.trim() && { opacity: 0.5 }]}
                  onPress={handleSubmitContact}
                  disabled={!contactMessage.trim()}
                >
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  quickContactGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickContactCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  quickContactIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickContactLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  quickContactDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  responseTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
  },
  responseTimeTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#065F46',
  },
  responseTimeValue: {
    fontSize: 12,
    color: '#059669',
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
  noResults: {
    alignItems: 'center',
    padding: 24,
  },
  noResultsTitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  noResultsDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  faqItem: {
    padding: 16,
  },
  faqItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    paddingRight: 12,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginTop: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  resourceItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  contactCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 14,
    color: '#64748B',
  },
  contactNote: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successView: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  successDesc: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  typePills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  typePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  typePillActive: {
    backgroundColor: colors.primary,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  messageInput: {
    height: 128,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 20,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
