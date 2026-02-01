import { useState, useRef, useEffect, useCallback } from 'react';
import { Animated, Alert, TextInput } from 'react-native';
import { brainDumpApi } from '../../../services/api';
import { BrainDumpTask, AIScheduledTask, FilterType, DateOption } from '../types';
import {
  mapPriority,
  mapPriorityFromAI,
  isWithinHours,
  formatTimeAgo,
  formatDuration,
  formatTime12h,
  getDateOptions,
  categorizeTask,
  getSmartTimeSlot,
  formatCategory,
} from '../utils';

interface UseTaskSortingDataReturn {
  // State
  tasks: BrainDumpTask[];
  setTasks: React.Dispatch<React.SetStateAction<BrainDumpTask[]>>;
  inputText: string;
  setInputText: (text: string) => void;
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  showAddToPlanModal: boolean;
  setShowAddToPlanModal: (show: boolean) => void;
  showAiSortModal: boolean;
  setShowAiSortModal: (show: boolean) => void;
  selectedTask: BrainDumpTask | null;
  setSelectedTask: (task: BrainDumpTask | null) => void;
  selectedDate: number;
  setSelectedDate: (date: number) => void;
  isAiProcessing: boolean;
  sortedTasks: (BrainDumpTask & { suggestedTime?: string })[];
  setSortedTasks: React.Dispatch<React.SetStateAction<(BrainDumpTask & { suggestedTime?: string })[]>>;
  showTaskMenu: string | null;
  setShowTaskMenu: (id: string | null) => void;
  completingTaskId: string | null;
  aiSummary: string;
  isLoading: boolean;
  
  // Refs
  inputRef: React.RefObject<TextInput>;
  fadeAnims: { [key: string]: Animated.Value };
  slideAnims: { [key: string]: Animated.Value };
  checkAnims: { [key: string]: Animated.Value };
  spinAnim: Animated.Value;
  
  // Computed
  dateOptions: DateOption[];
  filteredTasks: BrainDumpTask[];
  unsortedCount: number;
  reviewedCount: number;
  
  // Actions
  loadBrainDumpItems: () => Promise<void>;
  handleAddTask: () => Promise<void>;
  handleToggleStar: (taskId: string) => void;
  handleCompleteTask: (taskId: string) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleCategorizeTask: (taskId: string) => void;
  handleOpenAddToPlan: (task: BrainDumpTask) => void;
  handleConfirmAddToPlan: (navigation: any) => Promise<void>;
  handleAiSort: () => Promise<void>;
  handleConfirmAiSort: (navigation: any) => Promise<void>;
}

export const useTaskSortingData = (): UseTaskSortingDataReturn => {
  // State
  const [tasks, setTasks] = useState<BrainDumpTask[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showAddToPlanModal, setShowAddToPlanModal] = useState(false);
  const [showAiSortModal, setShowAiSortModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BrainDumpTask | null>(null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [sortedTasks, setSortedTasks] = useState<(BrainDumpTask & { suggestedTime?: string })[]>([]);
  const [showTaskMenu, setShowTaskMenu] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const inputRef = useRef<TextInput>(null);
  const fadeAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const slideAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const checkAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  
  const dateOptions = getDateOptions();
  
  // Load brain dump items from API on mount
  useEffect(() => {
    loadBrainDumpItems();
  }, []);
  
  const loadBrainDumpItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await brainDumpApi.getAll(false);
      if (response.success && response.data) {
        const loadedTasks: BrainDumpTask[] = response.data.map((item: any) => ({
          id: item.id,
          title: item.content,
          status: item.processed ? 'reviewed' : 'unsorted',
          aiCategory: item.aiCategory?.toLowerCase(),
          aiPriority: mapPriority(item.aiPriority),
          estimatedTime: item.suggestion?.suggestedDuration ? `${item.suggestion.suggestedDuration}m` : undefined,
          isNew: isWithinHours(item.createdAt, 1),
          createdAt: formatTimeAgo(item.createdAt),
          source: 'typed',
          isStarred: false,
        }));
        setTasks(loadedTasks);
      }
    } catch (error) {
      console.error('Failed to load brain dump items:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
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
  }, [tasks, fadeAnims, slideAnims, checkAnims]);
  
  // Add new task - saves to backend
  const handleAddTask = useCallback(async () => {
    if (!inputText.trim()) return;
    
    try {
      const response = await brainDumpApi.create(inputText.trim(), false);
      
      if (response.success && response.data) {
        const newTask: BrainDumpTask = {
          id: response.data.id,
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
        
        setTasks(prev => [newTask, ...prev]);
        setInputText('');
        
        Animated.parallel([
          Animated.timing(fadeAnims[newTask.id], { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnims[newTask.id], { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      }
    } catch (error) {
      console.error('Failed to create brain dump item:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  }, [inputText, fadeAnims, slideAnims, checkAnims]);
  
  const handleToggleStar = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isStarred: !t.isStarred } : t));
  }, []);
  
  const handleCompleteTask = useCallback(async (taskId: string) => {
    setCompletingTaskId(taskId);
    
    try {
      await brainDumpApi.delete(taskId);
    } catch (error) {
      console.error('Failed to delete brain dump item:', error);
    }
    
    Animated.sequence([
      Animated.spring(checkAnims[taskId], { toValue: 1, useNativeDriver: true, tension: 100, friction: 5 }),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(fadeAnims[taskId], { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnims[taskId], { toValue: 100, duration: 200, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setCompletingTaskId(null);
    });
  }, [fadeAnims, slideAnims, checkAnims]);
  
  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await brainDumpApi.delete(taskId);
    } catch (error) {
      console.error('Failed to delete brain dump item:', error);
    }
    
    Animated.parallel([
      Animated.timing(fadeAnims[taskId], { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnims[taskId], { toValue: 100, duration: 200, useNativeDriver: true }),
    ]).start(() => setTasks(prev => prev.filter(t => t.id !== taskId)));
    setShowTaskMenu(null);
  }, [fadeAnims, slideAnims]);
  
  const handleCategorizeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const { category, priority, time } = categorizeTask(t.title);
        return { ...t, status: 'reviewed', aiCategory: category, aiPriority: priority, estimatedTime: time };
      }
      return t;
    }));
  }, []);
  
  const handleOpenAddToPlan = useCallback((task: BrainDumpTask) => {
    setSelectedTask(task);
    setSelectedDate(0);
    setShowAddToPlanModal(true);
    setShowTaskMenu(null);
  }, []);
  
  const handleConfirmAddToPlan = useCallback(async (navigation: any) => {
    if (!selectedTask) return;
    
    try {
      const selectedDateOption = dateOptions[selectedDate];
      const targetDate = selectedDateOption?.fullDate || new Date().toISOString().split('T')[0];
      
      const response = await brainDumpApi.convert(selectedTask.id, {
        title: selectedTask.title,
        category: formatCategory(selectedTask.aiCategory),
        priority: selectedTask.aiPriority === 'urgent' ? 'HIGH' : selectedTask.aiPriority === 'low' ? 'LOW' : 'NORMAL',
        durationMin: parseInt(selectedTask.estimatedTime?.replace(/[^\d]/g, '') || '30', 10) || 30,
        date: targetDate,
      });
      
      if (response.success && response.data) {
        Animated.parallel([
          Animated.timing(fadeAnims[selectedTask.id], { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnims[selectedTask.id], { toValue: -50, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
          setShowAddToPlanModal(false);
          setSelectedTask(null);
          try {
            navigation.navigate('Home', { screen: 'Plan', params: { date: targetDate, highlightNew: true } });
          } catch {
            navigation.navigate('Plan', { date: targetDate, highlightNew: true });
          }
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to add task to plan. Please try again.');
      }
    } catch (error) {
      console.error('Failed to schedule task:', error);
      Alert.alert('Error', 'Failed to schedule task. Please try again.');
    }
  }, [selectedTask, selectedDate, dateOptions, fadeAnims, slideAnims]);
  
  // AI Smart Schedule
  const handleAiSort = useCallback(async () => {
    const unsortedTasks = tasks.filter(t => t.status === 'unsorted');
    if (unsortedTasks.length === 0) {
      Alert.alert('All Done!', 'No unsorted tasks to process.');
      return;
    }
    
    setIsAiProcessing(true);
    setShowAiSortModal(true);
    setAiSummary('');
    
    Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true })).start();
    
    try {
      const response = await brainDumpApi.smartSchedule(
        unsortedTasks.map(t => t.id),
        false
      );
      
      if (response.success && response.data) {
        const scheduledTasks = response.data.scheduledTasks as AIScheduledTask[];
        
        const categorized = scheduledTasks.map((scheduled) => {
          const originalTask = unsortedTasks.find(t => t.id === scheduled.originalId);
          return {
            ...originalTask!,
            id: scheduled.originalId,
            title: scheduled.title,
            status: 'reviewed' as const,
            aiCategory: scheduled.category.toLowerCase() as BrainDumpTask['aiCategory'],
            aiPriority: mapPriorityFromAI(scheduled.priority),
            estimatedTime: formatDuration(scheduled.durationMinutes),
            scheduledDate: scheduled.suggestedDate,
            scheduledTime: formatTime12h(scheduled.suggestedTime),
            reasoning: scheduled.reasoning,
            suggestedTime: formatTime12h(scheduled.suggestedTime),
          };
        });
        
        setSortedTasks(categorized);
        setAiSummary(response.data.summary || '');
      }
    } catch (error) {
      console.error('AI scheduling failed:', error);
      
      const categorized = unsortedTasks.map((task, index) => {
        const { category, priority, time } = categorizeTask(task.title);
        return {
          ...task,
          status: 'reviewed' as const,
          aiCategory: category,
          aiPriority: priority,
          estimatedTime: time,
          suggestedTime: getSmartTimeSlot({ ...task, aiCategory: category, aiPriority: priority }, index),
        };
      });
      setSortedTasks(categorized);
      setAiSummary('Scheduled using local intelligence (AI unavailable)');
    } finally {
      setIsAiProcessing(false);
      spinAnim.setValue(0);
    }
  }, [tasks, spinAnim]);
  
  const handleConfirmAiSort = useCallback(async (navigation: any) => {
    try {
      setIsAiProcessing(true);
      
      const response = await brainDumpApi.smartSchedule(
        sortedTasks.map(t => t.id),
        true
      );
      
      if (response.success) {
        const sortedIds = sortedTasks.map(t => t.id);
        setTasks(prev => prev.filter(t => !sortedIds.includes(t.id)));
        setShowAiSortModal(false);
        setSortedTasks([]);
        setAiSummary('');

        const createdTasks = response.data?.createdTasks || [];
        const scheduledDates: string[] = createdTasks
          .map((t: any) => t.date)
          .filter(Boolean);
        const fallbackDates = sortedTasks
          .map((t: any) => t.scheduledDate)
          .filter(Boolean);
        const allDates = scheduledDates.length > 0 ? scheduledDates : fallbackDates;
        const targetDate = allDates.sort()[0] || new Date().toISOString().split('T')[0];

        try {
          navigation.navigate('Home', { screen: 'Plan', params: { date: targetDate, highlightNew: true } });
        } catch {
          navigation.navigate('Plan', { date: targetDate, highlightNew: true });
        }
      }
    } catch (error) {
      console.error('Error creating tasks:', error);
      Alert.alert('Error', 'Failed to create tasks. Please try again.');
    } finally {
      setIsAiProcessing(false);
    }
  }, [sortedTasks]);
  
  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'unsorted') return task.status === 'unsorted';
    if (activeFilter === 'reviewed') return task.status === 'reviewed';
    return true;
  });
  
  const unsortedCount = tasks.filter(t => t.status === 'unsorted').length;
  const reviewedCount = tasks.filter(t => t.status === 'reviewed').length;
  
  return {
    tasks,
    setTasks,
    inputText,
    setInputText,
    activeFilter,
    setActiveFilter,
    showAddToPlanModal,
    setShowAddToPlanModal,
    showAiSortModal,
    setShowAiSortModal,
    selectedTask,
    setSelectedTask,
    selectedDate,
    setSelectedDate,
    isAiProcessing,
    sortedTasks,
    setSortedTasks,
    showTaskMenu,
    setShowTaskMenu,
    completingTaskId,
    aiSummary,
    isLoading,
    inputRef,
    fadeAnims,
    slideAnims,
    checkAnims,
    spinAnim,
    dateOptions,
    filteredTasks,
    unsortedCount,
    reviewedCount,
    loadBrainDumpItems,
    handleAddTask,
    handleToggleStar,
    handleCompleteTask,
    handleDeleteTask,
    handleCategorizeTask,
    handleOpenAddToPlan,
    handleConfirmAddToPlan,
    handleAiSort,
    handleConfirmAiSort,
  };
};
