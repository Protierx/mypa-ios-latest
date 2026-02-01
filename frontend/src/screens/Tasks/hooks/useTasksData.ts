import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, FilterType, PriorityType } from '../types';
import { initialTasks, categoryIcons, STORAGE_KEY } from '../constants';

export function useTasksData() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<PriorityType>('medium');
  const [categoryInput, setCategoryInput] = useState('Work');
  const [dueInput, setDueInput] = useState('Today');
  const addPulse = useRef(new Animated.Value(1)).current;

  // Load tasks from storage
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setTasks(JSON.parse(stored));
        } else {
          setTasks(initialTasks);
        }
      } catch (e) {
        setTasks(initialTasks);
      }
    };
    loadTasks();
  }, []);

  // Save tasks to storage
  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (e) {
        // noop
      }
    };
    if (tasks.length) saveTasks();
  }, [tasks]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(addPulse, { toValue: 1.05, duration: 1400, useNativeDriver: true }),
        Animated.timing(addPulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [addPulse]);

  const toggleTask = useCallback((id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  }, [tasks]);

  const openCreateModal = useCallback(() => {
    setEditingTask(null);
    setTitleInput('');
    setDescInput('');
    setPriorityInput('medium');
    setCategoryInput('Work');
    setDueInput('Today');
    setShowTaskModal(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setTitleInput(task.title);
    setDescInput(task.description);
    setPriorityInput(task.priority);
    setCategoryInput(task.category);
    setDueInput(task.dueDate);
    setShowTaskModal(true);
  }, []);

  const saveTask = useCallback(() => {
    if (!titleInput.trim()) return;
    const categoryIcon = categoryIcons[categoryInput] || 'briefcase';
    if (editingTask) {
      setTasks(prev =>
        prev.map(task =>
          task.id === editingTask.id
            ? {
                ...task,
                title: titleInput.trim(),
                description: descInput.trim() || 'No description',
                priority: priorityInput,
                category: categoryInput,
                categoryIcon,
                dueDate: dueInput,
              }
            : task
        )
      );
    } else {
      const newTask: Task = {
        id: `${Date.now()}`,
        title: titleInput.trim(),
        description: descInput.trim() || 'No description',
        priority: priorityInput,
        category: categoryInput,
        categoryIcon,
        dueDate: dueInput,
        completed: false,
      };
      setTasks(prev => [newTask, ...prev]);
    }
    setShowTaskModal(false);
  }, [titleInput, descInput, priorityInput, categoryInput, dueInput, editingTask]);

  const deleteTask = useCallback(() => {
    if (!editingTask) return;
    setTasks(prev => prev.filter(task => task.id !== editingTask.id));
    setShowTaskModal(false);
  }, [editingTask]);

  // Filtered tasks
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || (filter === 'pending' ? !task.completed : task.completed);
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Stats
  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.completed).length;

  return {
    // State
    tasks,
    filter,
    searchQuery,
    showTaskModal,
    editingTask,
    titleInput,
    descInput,
    priorityInput,
    categoryInput,
    dueInput,
    addPulse,
    
    // Derived
    filteredTasks,
    pendingCount,
    completedCount,
    highPriorityCount,
    
    // Actions
    setFilter,
    setSearchQuery,
    setShowTaskModal,
    setTitleInput,
    setDescInput,
    setPriorityInput,
    setCategoryInput,
    setDueInput,
    toggleTask,
    openCreateModal,
    openEditModal,
    saveTask,
    deleteTask,
  };
}
