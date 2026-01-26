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

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  categoryIcon: string;
  dueDate: string;
  completed: boolean;
}

const initialTasks: Task[] = [
  { id: '1', title: 'Complete project proposal', description: 'Draft and review Q1 project proposal', priority: 'high', category: 'Work', categoryIcon: 'briefcase', dueDate: 'Today', completed: false },
  { id: '2', title: 'Morning workout', description: '45 min strength training session', priority: 'medium', category: 'Fitness', categoryIcon: 'barbell', dueDate: 'Today', completed: true },
  { id: '3', title: 'Call with Sarah', description: 'Discuss partnership opportunity', priority: 'high', category: 'Work', categoryIcon: 'phone-portrait', dueDate: 'Today', completed: false },
  { id: '4', title: 'Grocery shopping', description: 'Weekly groceries for meal prep', priority: 'low', category: 'Personal', categoryIcon: 'cart', dueDate: 'Today', completed: false },
  { id: '5', title: 'Read book chapter', description: 'Finish chapter 5 of current book', priority: 'low', category: 'Learning', categoryIcon: 'book', dueDate: 'Tomorrow', completed: false },
  { id: '6', title: 'Team meeting prep', description: 'Prepare slides for Monday meeting', priority: 'medium', category: 'Work', categoryIcon: 'people', dueDate: 'Tomorrow', completed: false },
  { id: '7', title: 'Dentist appointment', description: 'Regular checkup at 3 PM', priority: 'medium', category: 'Health', categoryIcon: 'medkit', dueDate: 'Jan 25', completed: false },
  { id: '8', title: 'Pay bills', description: 'Electricity and internet bills', priority: 'high', category: 'Finance', categoryIcon: 'card', dueDate: 'Jan 26', completed: false },
];

const priorityConfig = {
  high: { color: '#F43F5E', bg: '#FEF2F2', icon: 'alert-circle' },
  medium: { color: '#F59E0B', bg: '#FFFBEB', icon: 'time' },
  low: { color: '#10B981', bg: '#ECFDF5', icon: 'leaf' },
};

const categoryColors: { [key: string]: string } = {
  Work: '#3B82F6',
  Fitness: '#F43F5E',
  Personal: '#8B5CF6',
  Learning: '#F59E0B',
  Health: '#10B981',
  Finance: '#06B6D4',
};

export function TasksScreen({ navigation }: any) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || (filter === 'pending' ? !task.completed : task.completed);
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.completed).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#475569" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity style={styles.addHeaderButton}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="hourglass-outline" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          </View>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="alert-circle" size={18} color="#F43F5E" />
          </View>
          <Text style={[styles.statValue, { color: '#F43F5E' }]}>{highPriorityCount}</Text>
          <Text style={styles.statLabel}>High Priority</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            {f === 'all' && <Ionicons name="list" size={14} color={filter === f ? '#FFFFFF' : '#64748B'} />}
            {f === 'pending' && <Ionicons name="time-outline" size={14} color={filter === f ? '#FFFFFF' : '#64748B'} />}
            {f === 'completed' && <Ionicons name="checkmark-done" size={14} color={filter === f ? '#FFFFFF' : '#64748B'} />}
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyStateText}>No tasks found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'completed' ? 'Complete some tasks to see them here' : 'Add a new task to get started'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const prioConfig = priorityConfig[task.priority];
            const catColor = categoryColors[task.category] || '#64748B';

            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
                onPress={() => toggleTask(task.id)}
              >
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    task.completed && styles.checkboxCompleted,
                    !task.completed && { borderColor: catColor },
                  ]}
                  onPress={() => toggleTask(task.id)}
                >
                  {task.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: prioConfig.bg }]}>
                      <Ionicons name={prioConfig.icon as any} size={12} color={prioConfig.color} />
                      <Text style={[styles.priorityText, { color: prioConfig.color }]}>
                        {task.priority}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.taskDescription} numberOfLines={1}>{task.description}</Text>
                  
                  <View style={styles.taskMeta}>
                    <View style={[styles.categoryBadge, { backgroundColor: catColor + '15' }]}>
                      <Ionicons name={task.categoryIcon as any} size={12} color={catColor} />
                      <Text style={[styles.categoryText, { color: catColor }]}>{task.category}</Text>
                    </View>
                    <View style={styles.dueBadge}>
                      <Ionicons name="calendar-outline" size={12} color="#64748B" />
                      <Text style={styles.taskDue}>{task.dueDate}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.taskMenuButton}>
                  <Ionicons name="ellipsis-vertical" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add Task FAB */}
      <TouchableOpacity style={styles.addFab}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  addHeaderButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 8, marginRight: 8, fontSize: 15, color: '#0F172A' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#64748B' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  filterButtonActive: { backgroundColor: '#0F172A' },
  filterText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: '#64748B', marginTop: 16 },
  emptyStateSubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  taskCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  taskCardCompleted: { opacity: 0.7 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  checkboxCompleted: { backgroundColor: '#10B981', borderColor: '#10B981' },
  taskContent: { flex: 1 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1, marginRight: 8 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#94A3B8' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  taskDescription: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { fontSize: 11, fontWeight: '500' },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskDue: { fontSize: 11, color: '#64748B' },
  taskMenuButton: { padding: 4 },
  addFab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 16, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});
