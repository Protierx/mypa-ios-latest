import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface Circle {
  id: string;
  name: string;
  description: string;
  members: number;
  activity: string;
  iconName: string;
  color: string;
  lastActive: string;
  unreadCount?: number;
}

const myCircles: Circle[] = [
  { id: '1', name: 'Morning Runners', description: 'Early morning running group', members: 28, activity: 'Very Active', iconName: 'run', color: '#F43F5E', lastActive: '5 min ago', unreadCount: 3 },
  { id: '2', name: 'Wellness Warriors', description: 'Mental health & self-care', members: 45, activity: 'Active', iconName: 'spa', color: '#8B5CF6', lastActive: '1 hour ago' },
  { id: '3', name: 'Tech Team', description: 'Work colleagues & friends', members: 12, activity: 'Moderate', iconName: 'laptop', color: '#3B82F6', lastActive: '2 hours ago', unreadCount: 1 },
  { id: '4', name: 'Family Circle', description: 'Close family members', members: 8, activity: 'Active', iconName: 'people', color: '#EC4899', lastActive: '30 min ago' },
  { id: '5', name: 'Book Club', description: 'Monthly book discussions', members: 15, activity: 'Moderate', iconName: 'book', color: '#F59E0B', lastActive: '1 day ago' },
];

const suggestedCircles: Circle[] = [
  { id: '6', name: 'Healthy Eaters', description: 'Share recipes & meal prep tips', members: 156, activity: 'Very Active', iconName: 'nutrition', color: '#10B981', lastActive: '' },
  { id: '7', name: 'Meditation Masters', description: 'Daily mindfulness practice', members: 89, activity: 'Active', iconName: 'brain', color: '#8B5CF6', lastActive: '' },
];

export function CirclesScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');

  const renderCircleIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'run':
        return <MaterialCommunityIcons name="run" size={24} color={color} />;
      case 'spa':
        return <MaterialCommunityIcons name="spa" size={24} color={color} />;
      case 'laptop':
        return <Ionicons name="laptop" size={24} color={color} />;
      case 'people':
        return <Ionicons name="people" size={24} color={color} />;
      case 'book':
        return <Ionicons name="book" size={24} color={color} />;
      case 'nutrition':
        return <Ionicons name="nutrition" size={24} color={color} />;
      case 'brain':
        return <MaterialCommunityIcons name="brain" size={24} color={color} />;
      default:
        return <Ionicons name="people-circle" size={24} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Circles</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search circles..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="people" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>My Circles</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="person-add" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>108</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="chatbubbles" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statLabel}>New Posts</Text>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create New Circle</Text>
        </TouchableOpacity>

        {/* My Circles */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Circles</Text>
          <Text style={styles.sectionCount}>{myCircles.length}</Text>
        </View>

        {myCircles.map((circle) => (
          <TouchableOpacity key={circle.id} style={styles.circleCard} onPress={() => navigation?.navigate('CircleHome')}>
            <View style={[styles.circleIcon, { backgroundColor: circle.color + '20' }]}>
              {renderCircleIcon(circle.iconName, circle.color)}
            </View>
            <View style={styles.circleInfo}>
              <View style={styles.circleNameRow}>
                <Text style={styles.circleName}>{circle.name}</Text>
                {circle.unreadCount && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{circle.unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.circleDescription}>{circle.description}</Text>
              <View style={styles.circleMeta}>
                <View style={styles.membersInfo}>
                  <Ionicons name="people-outline" size={14} color="#64748B" />
                  <Text style={styles.circleMembers}>{circle.members}</Text>
                </View>
                <View style={[styles.activityBadge, { 
                  backgroundColor: circle.activity === 'Very Active' ? '#ECFDF5' : 
                                   circle.activity === 'Active' ? '#EDE9FE' : '#F1F5F9' 
                }]}>
                  <View style={[styles.activityDot, { 
                    backgroundColor: circle.activity === 'Very Active' ? '#10B981' : 
                                     circle.activity === 'Active' ? '#8B5CF6' : '#94A3B8' 
                  }]} />
                  <Text style={[styles.activityText, { 
                    color: circle.activity === 'Very Active' ? '#059669' : 
                           circle.activity === 'Active' ? '#7C3AED' : '#64748B' 
                  }]}>{circle.activity}</Text>
                </View>
              </View>
            </View>
            <View style={styles.circleRight}>
              <Text style={styles.lastActive}>{circle.lastActive}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Suggested Circles */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suggested for You</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {suggestedCircles.map((circle) => (
          <TouchableOpacity key={circle.id} style={styles.circleCard}>
            <View style={[styles.circleIcon, { backgroundColor: circle.color + '20' }]}>
              {renderCircleIcon(circle.iconName, circle.color)}
            </View>
            <View style={styles.circleInfo}>
              <Text style={styles.circleName}>{circle.name}</Text>
              <Text style={styles.circleDescription}>{circle.description}</Text>
              <View style={styles.circleMeta}>
                <View style={styles.membersInfo}>
                  <Ionicons name="people-outline" size={14} color="#64748B" />
                  <Text style={styles.circleMembers}>{circle.members} members</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={[styles.joinButton, { backgroundColor: circle.color }]}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0F172A' },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statIconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748B', textAlign: 'center' },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F172A', marginHorizontal: 20, borderRadius: 12, padding: 14, marginBottom: 20 },
  createButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A' },
  sectionCount: { fontSize: 14, fontWeight: '500', color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  seeAll: { fontSize: 14, fontWeight: '500', color: '#8B5CF6' },
  circleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  circleIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  circleInfo: { flex: 1 },
  circleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circleName: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 3 },
  unreadBadge: { backgroundColor: '#F43F5E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  unreadText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  circleDescription: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  circleMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  membersInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  circleMembers: { fontSize: 12, color: '#64748B' },
  activityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activityDot: { width: 6, height: 6, borderRadius: 3 },
  activityText: { fontSize: 11, fontWeight: '500' },
  circleRight: { alignItems: 'flex-end', gap: 4 },
  lastActive: { fontSize: 11, color: '#94A3B8' },
  joinButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  joinButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
