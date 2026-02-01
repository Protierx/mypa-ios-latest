import { useCallback, MutableRefObject } from 'react';
import { Task, FocusSession, FocusStats } from '../types';
import { getTodayStr, getYesterdayStr, parseDuration } from '../utils';

interface UsePlanActionsProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activeTimerId: number | null;
  setActiveTimerId: React.Dispatch<React.SetStateAction<number | null>>;
  elapsedSeconds: number;
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  sessionStartTime: MutableRefObject<string | null>;
  focusSessions: FocusSession[];
  setFocusSessions: React.Dispatch<React.SetStateAction<FocusSession[]>>;
  focusStats: FocusStats;
  setFocusStats: React.Dispatch<React.SetStateAction<FocusStats>>;
  setShowAbandonConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSessionSummary: React.Dispatch<React.SetStateAction<FocusSession | null>>;
  // Edit modal
  editingTask: Task | null;
  setEditingTask: React.Dispatch<React.SetStateAction<Task | null>>;
  setEditTitle: React.Dispatch<React.SetStateAction<string>>;
  setEditCategory: React.Dispatch<React.SetStateAction<string>>;
  setEditDuration: React.Dispatch<React.SetStateAction<string>>;
  setEditPriority: React.Dispatch<React.SetStateAction<'High' | 'Normal' | 'Low'>>;
  setEditTime: React.Dispatch<React.SetStateAction<string>>;
  editTitle: string;
  editCategory: string;
  editDuration: string;
  editPriority: 'High' | 'Normal' | 'Low';
  editTime: string;
  // Add modal
  newTitle: string;
  newCategory: string;
  newDuration: string;
  newPriority: 'High' | 'Normal' | 'Low';
  newTime: string;
  newTaskDate: Date;
  setNewTitle: React.Dispatch<React.SetStateAction<string>>;
  setNewCategory: React.Dispatch<React.SetStateAction<string>>;
  setNewDuration: React.Dispatch<React.SetStateAction<string>>;
  setNewPriority: React.Dispatch<React.SetStateAction<'High' | 'Normal' | 'Low'>>;
  setNewTime: React.Dispatch<React.SetStateAction<string>>;
  setShowNewTimePicker: React.Dispatch<React.SetStateAction<boolean>>;
  setNewTimeDate: React.Dispatch<React.SetStateAction<Date>>;
  setNewTaskDate: React.Dispatch<React.SetStateAction<Date>>;
  setShowNewDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  setAiSuggestion: React.Dispatch<React.SetStateAction<any>>;
  setIsAdding: React.Dispatch<React.SetStateAction<boolean>>;
  // Navigation
  navigation?: any;
}

export const usePlanActions = ({
  tasks,
  setTasks,
  activeTimerId,
  setActiveTimerId,
  elapsedSeconds,
  setElapsedSeconds,
  isRecording,
  setIsRecording,
  sessionStartTime,
  focusSessions,
  setFocusSessions,
  focusStats,
  setFocusStats,
  setShowAbandonConfirm,
  setShowSessionSummary,
  editingTask,
  setEditingTask,
  setEditTitle,
  setEditCategory,
  setEditDuration,
  setEditPriority,
  setEditTime,
  editTitle,
  editCategory,
  editDuration,
  editPriority,
  editTime,
  newTitle,
  newCategory,
  newDuration,
  newPriority,
  newTime,
  newTaskDate,
  setNewTitle,
  setNewCategory,
  setNewDuration,
  setNewPriority,
  setNewTime,
  setShowNewTimePicker,
  setNewTimeDate,
  setNewTaskDate,
  setShowNewDatePicker,
  setAiSuggestion,
  setIsAdding,
  navigation,
}: UsePlanActionsProps) => {
  
  // Navigation handler
  const handleNavigate = useCallback((screen: string) => {
    if (!navigation) return;
    if (screen === 'sort') {
      navigation.navigate('Home', { screen: 'TaskSorting' });
    } else if (screen === 'hub') {
      navigation.navigate('Home', { screen: 'Hub' });
    } else if (screen === 'circles') {
      navigation.navigate('Circles', { screen: 'CirclesList' });
    } else if (screen === 'profile') {
      navigation.navigate('Profile', { screen: 'ProfileMain' });
    } else {
      navigation.navigate(screen);
    }
  }, [navigation]);

  // Timer actions
  const startTimer = useCallback((taskId: number) => {
    setActiveTimerId(taskId);
    setElapsedSeconds(0);
    setIsRecording(true);
    sessionStartTime.current = new Date().toISOString();
  }, [setActiveTimerId, setElapsedSeconds, setIsRecording, sessionStartTime]);

  const pauseTimer = useCallback(() => setIsRecording(false), [setIsRecording]);
  const resumeTimer = useCallback(() => setIsRecording(true), [setIsRecording]);

  const saveSession = useCallback((wasCompleted: boolean, wasAbandoned: boolean) => {
    if (activeTimerId === null || elapsedSeconds < 5) return;
    const task = tasks.find(t => t.id === activeTimerId);
    if (!task) return;

    const targetSeconds = task.durationMin * 60;
    const percentComplete = Math.min(Math.round((elapsedSeconds / targetSeconds) * 100), 100);
    const today = getTodayStr();

    const newSession: FocusSession = {
      id: Date.now(),
      taskId: activeTimerId,
      taskTitle: task.title,
      category: task.category,
      date: today,
      startTime: sessionStartTime.current || new Date().toISOString(),
      elapsedSeconds,
      targetSeconds,
      percentComplete,
      wasCompleted,
      wasAbandoned,
    };

    const updatedSessions = [newSession, ...focusSessions].slice(0, 50);
    setFocusSessions(updatedSessions);

    const isNewDay = focusStats.lastSessionDate !== today;
    const isConsecutiveDay = focusStats.lastSessionDate === getYesterdayStr();

    const newStats: FocusStats = {
      totalSessions: focusStats.totalSessions + 1,
      completedSessions: focusStats.completedSessions + (wasCompleted ? 1 : 0),
      abandonedSessions: focusStats.abandonedSessions + (wasAbandoned ? 1 : 0),
      totalFocusMinutes: focusStats.totalFocusMinutes + Math.round(elapsedSeconds / 60),
      currentStreak: wasCompleted
        ? (isConsecutiveDay || !isNewDay ? focusStats.currentStreak + 1 : 1)
        : (wasAbandoned && percentComplete < 25 ? 0 : focusStats.currentStreak),
      bestStreak: Math.max(
        focusStats.bestStreak,
        wasCompleted ? (isConsecutiveDay || !isNewDay ? focusStats.currentStreak + 1 : 1) : focusStats.currentStreak
      ),
      averageCompletion: Math.round(
        ((focusStats.averageCompletion * focusStats.totalSessions) + percentComplete) / (focusStats.totalSessions + 1)
      ),
      lastSessionDate: today,
    };

    setFocusStats(newStats);
    setShowSessionSummary(newSession);
  }, [activeTimerId, elapsedSeconds, tasks, sessionStartTime, focusSessions, setFocusSessions, focusStats, setFocusStats, setShowSessionSummary]);

  const stopTimer = useCallback((confirmed = false) => {
    if (!confirmed && elapsedSeconds > 30) {
      setShowAbandonConfirm(true);
      return;
    }

    const task = tasks.find(t => t.id === activeTimerId);
    const targetSeconds = (task?.durationMin || 30) * 60;
    const percentComplete = Math.round((elapsedSeconds / targetSeconds) * 100);

    if (elapsedSeconds >= 5) {
      saveSession(percentComplete >= 80, percentComplete < 80);
    }

    setActiveTimerId(null);
    setElapsedSeconds(0);
    setIsRecording(false);
    setShowAbandonConfirm(false);
    sessionStartTime.current = null;
  }, [elapsedSeconds, tasks, activeTimerId, saveSession, setShowAbandonConfirm, setActiveTimerId, setElapsedSeconds, setIsRecording, sessionStartTime]);

  // Task actions
  const handleComplete = useCallback((id: number) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
    if (activeTimerId === id) stopTimer(true);
  }, [setTasks, activeTimerId, stopTimer]);

  const handleDelete = useCallback((id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTimerId === id) stopTimer(true);
  }, [setTasks, activeTimerId, stopTimer]);

  const handleMoveToTomorrow = useCallback((id: number) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, date: tomorrowStr } : t)));
  }, [setTasks]);

  const completeTimedTask = useCallback((taskId: number) => {
    saveSession(true, false);
    handleComplete(taskId);
    setActiveTimerId(null);
    setElapsedSeconds(0);
    setIsRecording(false);
    sessionStartTime.current = null;
  }, [saveSession, handleComplete, setActiveTimerId, setElapsedSeconds, setIsRecording, sessionStartTime]);

  // Add task
  const handleAddTask = useCallback(() => {
    if (!newTitle.trim()) return;
    const taskDateStr = newTaskDate.toISOString().split('T')[0];
    const newTask: Task = {
      id: Date.now(),
      date: taskDateStr,
      time: newTime || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      duration: newDuration,
      durationMin: parseDuration(newDuration),
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      completed: false,
      isFixed: false,
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
    setNewCategory('Personal');
    setNewDuration('30m');
    setNewPriority('Normal');
    setNewTime('');
    setShowNewTimePicker(false);
    setNewTimeDate(new Date());
    setNewTaskDate(new Date());
    setShowNewDatePicker(false);
    setAiSuggestion(null);
    setIsAdding(false);
  }, [newTitle, newTaskDate, newTime, newDuration, newCategory, newPriority, setTasks, setNewTitle, setNewCategory, setNewDuration, setNewPriority, setNewTime, setShowNewTimePicker, setNewTimeDate, setNewTaskDate, setShowNewDatePicker, setAiSuggestion, setIsAdding]);

  // Edit task
  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditDuration(task.duration);
    setEditPriority(task.priority);
    setEditTime(task.time);
  }, [setEditingTask, setEditTitle, setEditCategory, setEditDuration, setEditPriority, setEditTime]);

  const saveEditedTask = useCallback(() => {
    if (!editingTask || !editTitle.trim()) return;
    setTasks(prev =>
      prev.map(t =>
        t.id === editingTask.id
          ? {
              ...t,
              title: editTitle.trim(),
              category: editCategory,
              duration: editDuration,
              durationMin: parseDuration(editDuration),
              priority: editPriority,
              time: editTime || t.time,
            }
          : t
      )
    );
    setEditingTask(null);
  }, [editingTask, editTitle, editCategory, editDuration, editPriority, editTime, setTasks, setEditingTask]);

  return {
    handleNavigate,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    saveSession,
    completeTimedTask,
    handleComplete,
    handleDelete,
    handleMoveToTomorrow,
    handleAddTask,
    openEditModal,
    saveEditedTask,
  };
};
