import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../styles';

interface SavedPlacesScreenProps {
  navigation?: any;
}

const savedPlaces = [
  { id: '1', name: 'Home', address: '123 Main Street, City', icon: 'home', color: colors.primary },
  { id: '2', name: 'Work', address: '456 Business Ave, Downtown', icon: 'briefcase', color: colors.work },
  { id: '3', name: 'Gym', address: '789 Fitness Blvd, Uptown', icon: 'barbell', color: colors.fitness },
  { id: '4', name: 'Coffee Shop', address: '321 Brew Lane, Midtown', icon: 'cafe', color: colors.creative },
  { id: '5', name: 'Park', address: 'Central Park, North End', icon: 'leaf', color: colors.health },
];

export function SavedPlacesScreen({ navigation }: SavedPlacesScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Places</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.mutedForeground} />
          <Text style={styles.searchPlaceholder}>Search places...</Text>
        </View>

        <Text style={styles.sectionLabel}>YOUR PLACES</Text>

        {savedPlaces.map((place) => (
          <TouchableOpacity key={place.id} style={styles.placeCard}>
            <View style={[styles.placeIcon, { backgroundColor: `${place.color}20` }]}>
              <Ionicons name={place.icon as any} size={22} color={place.color} />
            </View>
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeAddress}>{place.address}</Text>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addPlaceButton}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.addPlaceText}>Add New Place</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: colors.mutedForeground,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  placeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  placeAddress: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginTop: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  addPlaceText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
});

export default SavedPlacesScreen;
