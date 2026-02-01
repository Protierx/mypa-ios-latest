import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { SavedPlacesScreenProps } from './types';
import { SAVED_PLACES } from './constants';
import { styles } from './styles';
import { Header, SearchBar, PlaceCard, AddPlaceButton } from './components';

export function SavedPlacesScreen({ navigation }: SavedPlacesScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={() => navigation?.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SearchBar />

        <Text style={styles.sectionLabel}>YOUR PLACES</Text>

        {SAVED_PLACES.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}

        <AddPlaceButton />

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default SavedPlacesScreen;
