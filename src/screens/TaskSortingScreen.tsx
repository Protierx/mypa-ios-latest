import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Types
interface BrainDumpTask {
  id: number;
  title: string;
  status: 'unsorted' | 'reviewed' | 'planned';
  aiCategory?: 'work' | 'health' | 'personal' | 'learning' | 'social' | 'finance' | 'home';
  aiPriority?: 'urgent' | 'important' | 'normal' | 'low';
  estimatedTime?: string;
  isNew: boolean;
  createdAt: string;
  source: 'voice' | 'typed' | 'ai-chat';
  isStarred: boolean;
}

interface TaskSortingScreenProps {
  navigation?: any;
}

// Colors
const Colors = {
  primary: '#7c3aed',
  primaryLight: '#f3e8ff',
  white: '#ffffff',
  background: '#f8fafc',
  surface: '#f1f5f9',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  success: '#10b981',
  successLight: '#d1fae5',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  blue: '#3b82f6',
  blueLight: '#dbeafe',
  rose: '#f43f5e',
  roseLight: '#ffe4e6',
  purple: '#8b5cf6',
  purpleLight: '#ede9fe',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  emerald: '#10b981',
  emeraldLight: '#d1fae5',
  green: '#22c55e',
  greenLight: '#dcfce7',
  orange: '#f97316',
  orangeLight: '#ffedd5',
  gray: '#6b7280',
  grayLight: '#f3f4f6',
};

// Category config
const categoryConfig: Record<string, { color: string; lightColor: string; icon: string; label: string }> = {
  work: { color: Colors.blue, lightColor: Colors.blueLight, icon: 'briefcase', label: 'Work' },
  health: { color: Colors.rose, lightColor: Colors.roseLight, icon: 'heart-pulse', label: 'Health' },
  personal: { color: Colors.purple, lightColor: Colors.purpleLight, icon: 'account', label: 'Personal' },
  learning: { color: Colors.amber, lightColor: Colors.amberLight, icon: 'book-open-variant', label: 'Learning' },
  social: { color: Colors.emerald, lightColor: Colors.emeraldLight, icon: 'account-group', label: 'Social' },
  finance: { color: Colors.green, lightColor: Colors.greenLight, icon: 'wallet', label: 'Finance' },
  home: { color: Colors.orange, lightColor: Colors.orangeLight, icon: 'home', label: 'Home' },
};

// Priority config
const priorityConfig: Record<string, { color: string; textColor: string; label: string }> = {
  urgent: { color: Colors.danger, textColor: Colors.white, label: 'Urgent' },
  important: { color: Colors.warning, textColor: Colors.white, label: 'Important' },
  normal: { color: Colors.grayLight, textColor: Colors.textSecondary, label: '' },
  low: { color: Colors.surface, textColor: Colors.textMuted, label: '' },
};

// Quick templates
const quickTemplates = [
  { icon: 'phone', label: 'Call', text: 'Call ' },
  { icon: 'email', label: 'Email', text: 'Email ' },
  { icon: 'dumbbell', label: 'Exercise', text: 'Go to gym' },
  { icon: 'cart', label: 'Shopping', text: 'Buy groceries' },
  { icon: 'clipboard-check', label: 'Review', text: 'Review ' },
  { icon: 'handshake', label: 'Meeting', text: 'Meeting with ' },
];

// Initial sample data
const initialTasks: BrainDumpTask[] = [
  {
    id: 1,
    title: 'Call dentist for appointment',
    status: 'unsorted',
    source: 'voice',
    isStarred: true,
    isNew: true,
    createdAt: '10m ago',
  },
  {
    id: 2,
    title: 'Review Q1 metrics report',
    status: 'unsorted',
    source: 'ai-chat',
    isStarred: false,
    isNew: false,
    createdAt: '5m ago',
  },
  {
    id: 3,
    title: 'Book flight for conference',
    status: 'unsorted',
    source: 'typed',
    isStarred: false,
    isNew: false,
    createdAt: '2h ago',
  },
  {
    id: 4,
    title: 'Respond to team Slack messages',
    status: 'reviewed',
    aiCategory: 'work',
    aiPriority: 'important',
    estimatedTime: '20m',
    source: 'voice',
    isStarred: false,
    isNew: true,
    createdAt: '1h ago',
  },
  {
    id: 5,
    title: 'Learn new React patterns',
    status: 'reviewed',
    aiCategory: 'learning',
    aiPriority: 'normal',
    estimatedTime: '1h 30m',
    source: 'ai-chat',
    isStarred: false,
    isNew: false,
    createdAt: '3h ago',
  },
  {
    id: 6,
    title: 'Schedule gym session',
    status: 'unsorted',
    source: 'voice',
    isStarred: false,
    isNew: false,
    createdAt: '5h ago',
  },
  {
    id: 7,
    title: 'Pay electricity bill',
    status: 'unsorted',
    source: 'typed',
    isStarred: false,
    isNew: false,
    createdAt: '1d ago',
  },
];

export function TaskSortingScreen({ navigation: navProp }: TaskSortingScreenProps) {
  const navigation = navProp || useNavigation<any>();
  
  // State
  const [tasks, setTasks] = useState<BrainDumpTask[]>(initialTasks);
  const [inputText, setInputText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unsorted' | 'reviewed'>('all');
  const [showAddToPlanModal, setShowAddToPlanModal] = useState(false);
  const [showAiSortModal, setShowAiSortModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BrainDumpTask | null>(null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [sortedTasks, setSortedTasks] = useState<(BrainDumpTask & { suggestedTime?: string })[]>([]);
  const [showTaskMenu, setShowTaskMenu] = useState<number | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  
  const inputRef = useRef<TextInput>(null);
  const fadeAnims = useRef<{ [key: number]: Animated.Value }>({}).current;
  const slideAnims = useRef<{ [key: number]: Animated.Value }>({}).current;
  const checkAnims = useRef<{ [key: number]: Animated.Value }>({}).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Initialize animations for tasks
  useEffect(() => {
    tasks.forEach((task, index) => {
      if (!fadeAnims[task.id]) {
        fadeAnims[task.id] = new Animated.Value(0);
        slideAnims[task.id] = new Animated.Value(30);
        checkAnims[task.id] = new Animated.Value(0);
        
        Animated.parallel([
          Animated.timing(fadeAnims[task.id], {
            toValue: 1,
            duration: 300,
            delay: index * 30,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnims[task.id], {
            toValue: 0,
            duration: 300,
            delay: index * 30,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [tasks]);

  // Generate date options
  const getDateOptions = () => {
    const options = [];
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push({
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[date.getDay()],
        date: `${months[date.getMonth()]} ${date.getDate()}`,
        fullDate: date.toISOString().split('T')[0],
        isRecommended: i === 0,
      });
    }
    return options;
  };

  const dateOptions = getDateOptions();

  // AI Categorization Logic
  const categorizeTask = (title: string): { category: BrainDumpTask['aiCategory']; priority: BrainDumpTask['aiPriority']; time: string } => {
    const lowerTitle = title.toLowerCase();
    
    if (/doctor|dentist|gym|workout|medicine|appointment|health|exercise|run|jog|yoga|fitness/.test(lowerTitle)) {
      return { category: 'health', priority: 'important', time: /gym|workout|exercise|run|jog|yoga/.test(lowerTitle) ? '45m' : '20m' };
    }
    if (/meeting|report|email|project|deadline|client|work|presentation|review|slack|teams/.test(lowerTitle)) {
      return { category: 'work', priority: 'important', time: /meeting|presentation/.test(lowerTitle) ? '45m' : '20m' };
    }
    if (/bill|pay|bank|tax|invoice|budget|money|finance|payment/.test(lowerTitle)) {
      return { category: 'finance', priority: 'important', time: '20m' };
    }
    if (/learn|study|course|read|tutorial|practice|book|lesson/.test(lowerTitle)) {
      return { category: 'learning', priority: 'normal', time: '1h 30m' };
    }
    if (/call|meet|friend|family|dinner|lunch|party|birthday|visit/.test(lowerTitle)) {
      return { category: 'social', priority: 'normal', time: /dinner|lunch|party/.test(lowerTitle) ? '45m' : '10m' };
    }
    if (/clean|organize|laundry|grocery|cook|home|house|dishes|vacuum|trash/.test(lowerTitle)) {
      return { category: 'home', priority: 'normal', time: /cook|clean|organize/.test(lowerTitle) ? '45m' : '20m' };
    }
    
    let time = '30m';
    if (/call|email|message|respond|schedule|book|order/.test(lowerTitle)) time = '10m';
    else if (/pay|bill|review|check|organize|clean/.test(lowerTitle)) time = '20m';
    else if (/meeting|gym|appointment|lunch|dinner|report/.test(lowerTitle)) time = '45m';
    else if (/learn|study|project|design|write|create/.test(lowerTitle)) time = '1h 30m';
    
    return { category: 'personal', priority: 'normal', time };
  };

  // Get smart time slot
  const getSmartTimeSlot = (task: BrainDumpTask, index: number): string => {
    const urgentSlots = ['9:00 AM', '9:30 AM', '10:00 AM'];
    const workSlots = ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'];
    const healthSlots = ['7:00 AM', '6:00 PM', '7:00 PM'];
    const socialSlots = ['12:00 PM', '1:00 PM', '6:00 PM', '7:00 PM'];
    const learningSlots = ['8:00 AM', '4:00 PM', '8:00 PM'];
    const defaultSlots = ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

    if (task.aiPriority === 'urgent') return urgentSlots[index % urgentSlots.length];
    switch (task.aiCategory) {
      case 'work': return workSlots[index % workSlots.length];
      case 'health': return healthSlots[index % healthSlots.length];
      case 'social': return socialSlots[index % socialSlots.length];
      case 'learning': return learningSlots[index % learningSlots.length];
      default: return defaultSlots[index % defaultSlots.length];
    }
  };

  // Add new task
  const handleAddTask = () => {
    if (!inputText.trim()) return;
    
    const newTask: BrainDumpTask = {
      id: Date.now(),
      title: inputText.trim(),
      status: 'unsorted',
      source: 'typed',
      isStarred: false,
      isNew: true,
      createdAt: 'Just now',
    };
    
    fadeAnims[newTask.id] = new Animated.Value(0);
    slideAnims[newTask.id] = new Animated.Value(30);
    checkAnims[newTask.id] = new Animated.Value(0);
    
    setTasks([newTask, ...tasks]);
    setInputText('');
    
    Animated.parallel([
      Animated.timing(fadeAnims[newTask.id], { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnims[newTask.id], { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleToggleStar = (taskId: number) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, isStarred: !t.isStarred } : t));
  };

  const handleCompleteTask = (taskId: number) => {
    setCompletingTaskId(taskId);
    Animated.sequence([
      Animated.spring(checkAnims[taskId], { toValue: 1, useNativeDriver: true, tension: 100, friction: 5 }),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(fadeAnims[taskId], { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnims[taskId], { toValue: 100, duration: 200, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setTasks(tasks.filter(t => t.id !== taskId));
      setCompletingTaskId(null);
    });
  };

  const handleDeleteTask = (taskId: number) => {
    Animated.parallel([
      Animated.timing(fadeAnims[taskId], { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnims[taskId], { toValue: 100, duration: 200, useNativeDriver: true }),
    ]).start(() => setTasks(tasks.filter(t => t.id !== taskId)));
    setShowTaskMenu(null);
  };

  const handleCategorizeTask = (taskId: number) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const { category, priority, time } = categorizeTask(t.title);
        return { ...t, status: 'reviewed', aiCategory: category, aiPriority: priority, estimatedTime: time };
      }
      return t;
    }));
  };

  const handleOpenAddToPlan = (task: BrainDumpTask) => {
    setSelectedTask(task);
    setSelectedDate(0);
    setShowAddToPlanModal(true);
    setShowTaskMenu(null);
  };

  const handleConfirmAddToPlan = async () => {
    if (!selectedTask) return;
    
    let taskToAdd = { ...selectedTask };
    if (taskToAdd.status === 'unsorted') {
      const { category, priority, time } = categorizeTask(taskToAdd.title);
      taskToAdd = { ...taskToAdd, status: 'planned', aiCategory: category, aiPriority: priority, estimatedTime: time };
    }
    
    const timeSlot = getSmartTimeSlot(taskToAdd, 0);
    const planTask = { ...taskToAdd, scheduledDate: dateOptions[selectedDate].fullDate, scheduledTime: timeSlot };
    
    try {
      const existing = await AsyncStorage.getItem('pendingPlanTasks');
      const pending = existing ? JSON.parse(existing) : [];
      pending.push(planTask);
      await AsyncStorage.setItem('pendingPlanTasks', JSON.stringify(pending));
    } catch (e) { console.error('Error saving task:', e); }
    
    Animated.parallel([
      Animated.timing(fadeAnims[selectedTask.id], { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnims[selectedTask.id], { toValue: -50, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setTasks(tasks.filter(t => t.id !== selectedTask.id));
      setShowAddToPlanModal(false);
      setSelectedTask(null);
      try { navigation.navigate('Home', { screen: 'Plan' }); } catch { navigation.navigate('Plan'); }
    });
  };

  const handleAiSort = () => {
    const unsortedTasks = tasks.filter(t => t.status === 'unsorted');
    if (unsortedTasks.length === 0) {
      Alert.alert('All Done!', 'No unsorted tasks to process.');
      return;
    }
    
    setIsAiProcessing(true);
    setShowAiSortModal(true);
    
    Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true })).start();
    
    setTimeout(() => {
      const categorized = unsortedTasks.map((task, index) => {
        const { category, priority, time } = categorizeTask(task.title);
        return {
          ...task, status: 'reviewed' as const, aiCategory: category, aiPriority: priority, estimatedTime: time,
          suggestedTime: getSmartTimeSlot({ ...task, aiCategory: category, aiPriority: priority }, index),
        };
      });
      setSortedTasks(categorized);
      setIsAiProcessing(false);
      spinAnim.setValue(0);
    }, 1500);
  };

  const handleConfirmAiSort = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const planTasks = sortedTasks.map(task => ({ ...task, status: 'planned', scheduledDate: today, scheduledTime: task.suggestedTime }));
      
      const existing = await AsyncStorage.getItem('pendingPlanTasks');
      const pending = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('pendingPlanTasks', JSON.stringify([...pending, ...planTasks]));
      
      const sortedIds = sortedTasks.map(t => t.id);
      setTasks(tasks.filter(t => !sortedIds.includes(t.id)));
      setShowAiSortModal(false);
      setSortedTasks([]);
      
      try { navigation.navigate('Home', { screen: 'Plan' }); } catch { navigation.navigate('Plan'); }
    } catch (e) { console.error('Error saving tasks:', e); }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'unsorted') return task.status === 'unsorted';
    if (activeFilter === 'reviewed') return task.status === 'reviewed';
    return true;
  });

  const unsortedCount = tasks.filter(t => t.status === 'unsorted').length;
  const reviewedCount = tasks.filter(t => t.status === 'reviewed').length;

  const getTotalTime = () => {
    let totalMinutes = 0;
    sortedTasks.forEach(task => {
      const time = task.estimatedTime || '30m';
      if (time.includes('h')) {
        const [hours, mins] = time.split('h');
        totalMinutes += parseInt(hours) * 60;
        if (mins) totalMinutes += parseInt(mins.replace('m', '').trim()) || 0;
      } else {
        totalMinutes += parseInt(time.replace('m', ''));
      }
    });
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${totalMinutes}m`;
  };

  const getPriorityCount = () => sortedTasks.filter(t => t.aiPriority === 'urgent' || t.aiPriority === 'important').length;

  const renderSourceIcon = (source: BrainDumpTask['source']) => {
    switch (source) {
      case 'voice': return <Feather name="mic" size={12} color={Colors.textMuted} />;
      case 'ai-chat': return <MaterialCommunityIcons name="robot" size={12} color={Colors.textMuted} />;
      default: return <Feather name="edit-3" size={12} color={Colors.textMuted} />;
    }
  };

  const renderCategoryBadge = (category?: BrainDumpTask['aiCategory']) => {
    if (!category) return null;
    const config = categoryConfig[category];
    return (
      <View style={[styles.badge, { backgroundColor: config.lightColor }]}>
        <MaterialCommunityIcons name={config.icon as any} size={12} color={config.color} />
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const renderPriorityBadge = (priority?: BrainDumpTask['aiPriority']) => {
    if (!priority || priority === 'normal' || priority === 'low') return null;
    const config = priorityConfig[priority];
    return (
      <View style={[styles.badge, { backgroundColor: config.color }]}>
        <Text style={[styles.badgeText, { color: config.textColor }]}>{config.label}</Text>
      </View>
    );
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Brain Dump</Text>
          <Text style={styles.subtitle}>Your thoughts, organized</Text>
        </View>
        <TouchableOpacity onPress={handleAiSort} style={styles.aiSortButton}>
          <LinearGradient colors={['#a78bfa', '#7c3aed']} style={styles.aiSortGradient}>
            <MaterialCommunityIcons name="auto-fix" size={20} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <LinearGradient colors={['#ede9fe', '#f3e8ff']} style={styles.infoBannerGradient}>
            <View style={styles.infoBannerIcon}>
              <LinearGradient colors={['#a78bfa', '#7c3aed']} style={styles.infoBannerIconGradient}>
                <MaterialCommunityIcons name="brain" size={24} color={Colors.white} />
              </LinearGradient>
            </View>
            <View style={styles.infoBannerContent}>
              <Text style={styles.infoBannerTitle}>
                {unsortedCount > 0 ? `${unsortedCount} task${unsortedCount > 1 ? 's' : ''} ready for smart scheduling` : 'All tasks scheduled! 🎉'}
              </Text>
              <Text style={styles.infoBannerSubtitle}>AI will categorize, estimate time & add to your plan</Text>
            </View>
            {unsortedCount > 0 && (
              <TouchableOpacity onPress={handleAiSort} style={styles.autoPlanButton}>
                <Text style={styles.autoPlanButtonText}>Auto Plan</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* Quick Add Input */}
        <View style={styles.quickAddContainer}>
          <View style={styles.quickAddInput}>
            <Feather name="zap" size={20} color={Colors.warning} />
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Dump a task here..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAddTask}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.micButton}>
              <Feather name="mic" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddTask} style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]} disabled={!inputText.trim()}>
              <Feather name="plus" size={20} color={inputText.trim() ? Colors.white : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Templates */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll} contentContainerStyle={styles.templatesContent}>
          {quickTemplates.map((template, index) => (
            <TouchableOpacity key={index} style={styles.templateButton} onPress={() => { setInputText(template.text); inputRef.current?.focus(); }}>
              <MaterialCommunityIcons name={template.icon as any} size={16} color={Colors.textSecondary} />
              <Text style={styles.templateText}>{template.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]} onPress={() => setActiveFilter('all')}>
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>All ({tasks.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterTab, activeFilter === 'unsorted' && styles.filterTabActive]} onPress={() => setActiveFilter('unsorted')}>
            <Text style={[styles.filterTabText, activeFilter === 'unsorted' && styles.filterTabTextActive]}>Unsorted ({unsortedCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterTab, activeFilter === 'reviewed' && styles.filterTabActive]} onPress={() => setActiveFilter('reviewed')}>
            <Text style={[styles.filterTabText, activeFilter === 'reviewed' && styles.filterTabTextActive]}>Reviewed ({reviewedCount})</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity style={styles.quickAccessButton} onPress={() => { try { navigation.navigate('Home', { screen: 'Plan' }); } catch { navigation.navigate('Plan'); } }}>
            <Feather name="calendar" size={20} color={Colors.blue} />
            <Text style={styles.quickAccessText}>View Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessButton} onPress={() => { try { navigation.navigate('Home', { screen: 'Challenges' }); } catch { navigation.navigate('Challenges'); } }}>
            <Feather name="award" size={20} color={Colors.warning} />
            <Text style={styles.quickAccessText}>Challenges</Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <View style={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><Feather name="inbox" size={48} color={Colors.textMuted} /></View>
              <Text style={styles.emptyTitle}>{activeFilter === 'unsorted' ? 'Nothing to sort!' : 'No tasks here'}</Text>
              <Text style={styles.emptySubtitle}>{activeFilter === 'unsorted' ? 'All your tasks have been reviewed' : 'Add tasks to get started'}</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => inputRef.current?.focus()}>
                <Text style={styles.emptyButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <Animated.View key={task.id} style={[styles.taskCard, { opacity: fadeAnims[task.id] || 1, transform: [{ translateY: slideAnims[task.id] || 0 }] }]}>
                <TouchableOpacity style={[styles.checkbox, completingTaskId === task.id && styles.checkboxCompleted]} onPress={() => handleCompleteTask(task.id)}>
                  {completingTaskId === task.id && (
                    <Animated.View style={{ transform: [{ scale: checkAnims[task.id] || 0 }] }}>
                      <Feather name="check" size={14} color={Colors.white} />
                    </Animated.View>
                  )}
                </TouchableOpacity>
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View style={styles.taskActions}>
                      <TouchableOpacity onPress={() => handleToggleStar(task.id)}>
                        <Ionicons name={task.isStarred ? 'star' : 'star-outline'} size={18} color={task.isStarred ? Colors.warning : Colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setShowTaskMenu(showTaskMenu === task.id ? null : task.id)} style={styles.moreButton}>
                        <Feather name="more-vertical" size={18} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {showTaskMenu === task.id && (
                    <View style={styles.taskMenu}>
                      <TouchableOpacity style={styles.taskMenuItem} onPress={() => handleOpenAddToPlan(task)}>
                        <Feather name="calendar" size={16} color={Colors.success} />
                        <Text style={styles.taskMenuItemText}>Add to Plan</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.taskMenuItem} onPress={() => { handleCompleteTask(task.id); setShowTaskMenu(null); }}>
                        <Feather name="check-circle" size={16} color={Colors.primary} />
                        <Text style={styles.taskMenuItemText}>Mark Done</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.taskMenuItem, { borderBottomWidth: 0 }]} onPress={() => handleDeleteTask(task.id)}>
                        <Feather name="trash-2" size={16} color={Colors.danger} />
                        <Text style={[styles.taskMenuItemText, { color: Colors.danger }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.taskMeta}>
                    {renderSourceIcon(task.source)}
                    {task.status === 'unsorted' && <View style={[styles.badge, { backgroundColor: Colors.warningLight }]}><Text style={[styles.badgeText, { color: Colors.warning }]}>Unsorted</Text></View>}
                    {renderCategoryBadge(task.aiCategory)}
                    {renderPriorityBadge(task.aiPriority)}
                    {task.estimatedTime && <View style={[styles.badge, { backgroundColor: Colors.surface }]}><Feather name="clock" size={10} color={Colors.textMuted} /><Text style={[styles.badgeText, { color: Colors.textSecondary }]}>{task.estimatedTime}</Text></View>}
                    {task.isNew && <View style={[styles.badge, { backgroundColor: Colors.primaryLight }]}><Text style={[styles.badgeText, { color: Colors.primary }]}>NEW</Text></View>}
                    <Text style={styles.taskTime}>{task.createdAt}</Text>
                  </View>
                  <View style={styles.taskButtons}>
                    <TouchableOpacity style={styles.addToPlanButton} onPress={() => handleOpenAddToPlan(task)}>
                      <Feather name="calendar" size={14} color={Colors.success} />
                      <Text style={styles.addToPlanButtonText}>Add to Plan</Text>
                    </TouchableOpacity>
                    {task.status === 'unsorted' && (
                      <TouchableOpacity style={styles.categorizeButton} onPress={() => handleCategorizeTask(task.id)}>
                        <MaterialCommunityIcons name="auto-fix" size={14} color={Colors.primary} />
                        <Text style={styles.categorizeButtonText}>Categorize</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTask(task.id)}>
                      <Feather name="trash-2" size={14} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add to Plan Modal */}
      <Modal visible={showAddToPlanModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddToPlanModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddToPlanModal(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}><Feather name="calendar" size={24} color={Colors.primary} /></View>
              <View><Text style={styles.modalTitle}>Add to Plan</Text><Text style={styles.modalSubtitle}>Select a date for this task</Text></View>
            </View>
            {selectedTask && <View style={styles.taskPreview}><Text style={styles.taskPreviewText}>{selectedTask.title}</Text></View>}
            <ScrollView style={styles.dateOptionsScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.dateOptions}>
                {dateOptions.map((option, index) => (
                  <TouchableOpacity key={index} style={[styles.dateOption, selectedDate === index && styles.dateOptionSelected]} onPress={() => setSelectedDate(index)}>
                    <View style={styles.dateOptionContent}>
                      <Text style={[styles.dateOptionLabel, selectedDate === index && styles.dateOptionLabelSelected]}>{option.label}</Text>
                      <Text style={[styles.dateOptionDate, selectedDate === index && styles.dateOptionDateSelected]}>{option.date}</Text>
                      {option.isRecommended && <View style={styles.recommendedBadge}><Text style={styles.recommendedBadgeText}>Recommended</Text></View>}
                    </View>
                    {selectedDate === index && <View style={styles.dateCheckmark}><Feather name="check" size={16} color={Colors.white} /></View>}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddToPlanModal(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAddToPlan}><Feather name="send" size={16} color={Colors.white} /><Text style={styles.confirmButtonText}>Add to Plan</Text></TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* AI Sort Results Modal */}
      <Modal visible={showAiSortModal} animationType="slide" transparent={true} onRequestClose={() => { if (!isAiProcessing) { setShowAiSortModal(false); setSortedTasks([]); } }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { if (!isAiProcessing) { setShowAiSortModal(false); setSortedTasks([]); } }}>
          <View style={styles.aiModalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            {isAiProcessing ? (
              <View style={styles.processingContainer}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}><MaterialCommunityIcons name="loading" size={48} color={Colors.primary} /></Animated.View>
                <Text style={styles.processingText}>AI is organizing your tasks...</Text>
              </View>
            ) : (
              <>
                <View style={styles.aiModalHeader}>
                  <View style={styles.aiModalIcon}><LinearGradient colors={['#a78bfa', '#7c3aed']} style={styles.aiModalIconGradient}><MaterialCommunityIcons name="brain" size={28} color={Colors.white} /></LinearGradient></View>
                  <Text style={styles.aiModalTitle}>Smart Schedule ✨</Text>
                  <Text style={styles.aiModalSubtitle}>AI planned your tasks for today</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}><Text style={styles.statNumber}>{sortedTasks.length}</Text><Text style={styles.statLabel}>Tasks</Text></View>
                  <View style={styles.statBox}><Text style={styles.statNumber}>{getTotalTime()}</Text><Text style={styles.statLabel}>Total Time</Text></View>
                  <View style={styles.statBox}><Text style={styles.statNumber}>{getPriorityCount()}</Text><Text style={styles.statLabel}>Priority</Text></View>
                </View>
                <Text style={styles.scheduleTitle}>Today's Schedule</Text>
                <ScrollView style={styles.scheduleList} showsVerticalScrollIndicator={false}>
                  {sortedTasks.map((task) => (
                    <View key={task.id} style={styles.scheduleItem}>
                      <Text style={styles.scheduleTime}>{task.suggestedTime}</Text>
                      <View style={styles.scheduleContent}>
                        <Text style={styles.scheduleTaskTitle}>{task.title}</Text>
                        <View style={styles.scheduleTaskMeta}>
                          {task.aiCategory && <View style={[styles.smallBadge, { backgroundColor: categoryConfig[task.aiCategory].lightColor }]}><MaterialCommunityIcons name={categoryConfig[task.aiCategory].icon as any} size={10} color={categoryConfig[task.aiCategory].color} /><Text style={[styles.smallBadgeText, { color: categoryConfig[task.aiCategory].color }]}>{categoryConfig[task.aiCategory].label}</Text></View>}
                          {task.estimatedTime && <Text style={styles.scheduleTaskTime}>{task.estimatedTime}</Text>}
                          {task.aiPriority === 'urgent' && <Text style={styles.priorityEmoji}>🔥</Text>}
                          {task.aiPriority === 'important' && <Text style={styles.priorityEmoji}>⭐</Text>}
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <Text style={styles.helperText}>Tasks will be added to your Plan with optimal time slots</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowAiSortModal(false); setSortedTasks([]); }}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAiSort}><Feather name="calendar" size={16} color={Colors.white} /><Text style={styles.confirmButtonText}>Add to Plan</Text></TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  headerTitle: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  aiSortButton: { marginLeft: 12 },
  aiSortGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  infoBanner: { margin: 16, borderRadius: 16, overflow: 'hidden' },
  infoBannerGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  infoBannerIcon: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  infoBannerIconGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoBannerContent: { flex: 1 },
  infoBannerTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  infoBannerSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  autoPlanButton: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  autoPlanButtonText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  quickAddContainer: { paddingHorizontal: 16, marginBottom: 12 },
  quickAddInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: Colors.border },
  textInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, padding: 0 },
  micButton: { padding: 4 },
  addButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  addButtonDisabled: { backgroundColor: Colors.surface },
  templatesScroll: { marginBottom: 12 },
  templatesContent: { paddingHorizontal: 16, gap: 8 },
  templateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  templateText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filterTabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  filterTabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTabTextActive: { color: Colors.white },
  quickAccessGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  quickAccessButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, paddingVertical: 14, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: Colors.border },
  quickAccessText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  taskList: { paddingHorizontal: 16 },
  taskCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  checkboxCompleted: { backgroundColor: Colors.success, borderColor: Colors.success },
  taskContent: { flex: 1 },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  taskTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary, lineHeight: 20 },
  taskActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  moreButton: { padding: 2 },
  taskMenu: { position: 'absolute', top: 30, right: 0, backgroundColor: Colors.white, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8, zIndex: 100, minWidth: 150, borderWidth: 1, borderColor: Colors.border },
  taskMenuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  taskMenuItemText: { fontSize: 14, color: Colors.textPrimary },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  taskTime: { fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' },
  taskButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addToPlanButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  addToPlanButtonText: { fontSize: 12, fontWeight: '600', color: Colors.success },
  categorizeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  categorizeButtonText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  deleteButton: { padding: 6, marginLeft: 'auto' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  emptyButton: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  emptyButtonText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  aiModalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  modalHeaderIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  modalSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  taskPreview: { backgroundColor: Colors.surface, padding: 14, borderRadius: 10, marginBottom: 20 },
  taskPreviewText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  dateOptionsScroll: { maxHeight: 350 },
  dateOptions: { gap: 8, marginBottom: 20 },
  dateOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 14, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  dateOptionSelected: { backgroundColor: Colors.successLight, borderColor: Colors.success },
  dateOptionContent: { flex: 1 },
  dateOptionLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  dateOptionLabelSelected: { color: Colors.success },
  dateOptionDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  dateOptionDateSelected: { color: Colors.success },
  recommendedBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' },
  recommendedBadgeText: { fontSize: 10, fontWeight: '600', color: Colors.primary },
  dateCheckmark: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.surface, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  confirmButton: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmButtonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  processingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  processingText: { fontSize: 16, color: Colors.textSecondary, marginTop: 20 },
  aiModalHeader: { alignItems: 'center', marginBottom: 24 },
  aiModalIcon: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', marginBottom: 16 },
  aiModalIconGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  aiModalTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  aiModalSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: Colors.surface, padding: 16, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  scheduleTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  scheduleList: { maxHeight: 250, marginBottom: 16 },
  scheduleItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  scheduleTime: { fontSize: 13, fontWeight: '600', color: Colors.primary, width: 70 },
  scheduleContent: { flex: 1 },
  scheduleTaskTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 6 },
  scheduleTaskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 },
  smallBadgeText: { fontSize: 10, fontWeight: '600' },
  scheduleTaskTime: { fontSize: 11, color: Colors.textMuted },
  priorityEmoji: { fontSize: 12 },
  helperText: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginBottom: 16 },
});

export default TaskSortingScreen;
