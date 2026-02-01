import React from 'react';
import { View, ScrollView } from 'react-native';
import { HelpSupportScreenProps } from './types';
import { styles } from './styles';
import {
  Header,
  SearchBar,
  QuickContactGrid,
  ResponseTime,
  FAQSection,
  ResourcesSection,
  ContactCard,
} from './components';
import { ContactModal } from './modals';
import { useHelpSupportData } from './hooks';

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({
  navigation,
}) => {
  const {
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
    handleSubmitContact,
    handleOpenContact,
    toggleFaq,
  } = useHelpSupportData();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header onBack={() => navigation?.goBack()} />

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        <QuickContactGrid onContactType={handleOpenContact} />

        <ResponseTime />

        <FAQSection
          faqs={filteredFaqs}
          expandedFaq={expandedFaq}
          onToggleFaq={toggleFaq}
        />

        <ResourcesSection />

        <ContactCard />
      </ScrollView>

      <ContactModal
        visible={showContactForm}
        contactType={contactType}
        message={contactMessage}
        messageSent={messageSent}
        onContactTypeChange={setContactType}
        onMessageChange={setContactMessage}
        onClose={() => setShowContactForm(false)}
        onSubmit={handleSubmitContact}
      />
    </View>
  );
};

export default HelpSupportScreen;
