import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAQ } from '../types';
import { styles } from '../styles';

interface FAQSectionProps {
  faqs: FAQ[];
  expandedFaq: number | null;
  onToggleFaq: (id: number) => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  faqs,
  expandedFaq,
  onToggleFaq,
}) => {
  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
      <View style={styles.card}>
        {faqs.length === 0 ? (
          <View style={styles.noResults}>
            <Ionicons name="help-circle" size={40} color="#CBD5E1" />
            <Text style={styles.noResultsTitle}>No results found</Text>
            <Text style={styles.noResultsDesc}>Try a different search term</Text>
          </View>
        ) : (
          faqs.map((faq, i) => (
            <TouchableOpacity
              key={faq.id}
              style={[styles.faqItem, i > 0 && styles.faqItemBorder]}
              onPress={() => onToggleFaq(faq.id)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#CBD5E1"
                  style={
                    expandedFaq === faq.id
                      ? { transform: [{ rotate: '90deg' }] }
                      : {}
                  }
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
  );
};
