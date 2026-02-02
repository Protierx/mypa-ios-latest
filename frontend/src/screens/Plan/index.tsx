import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { PlanScreenProps } from './types';
import { isQuickTask } from './utils';
import { styles } from './styles';

// Components
import {
  SwipeableTask,
  ProgressCard,
  FocusCard,
  NextFocusCard,
  EmptyState,
  AddedBanner,
  PlanHeader,
} from './components';

// Modals
import {
  AddTaskModal,
  EditTaskModal,
  AbandonConfirmModal,
  SessionSummaryModal,
} from './modals';

// Hooks
import { usePlanData, usePlanActions } from './hooks';

export function PlanScreen({ navigation, route }: PlanScreenProps) {
  const nav = useNavigation<any>();
  const routeHook = useRoute<RouteProp<{ Plan: { date?: string; taskId?: string; highlightNew?: boolean } }, 'Plan'>>();
  const routeParams = route?.params || routeHook?.params;
  const navigator = navigation || nav;

  // Data hook
  const {
    tasks,
    setTasks,
    selectedDate,
    setSelectedDate,
    showCalendar,
    setShowCalendar,
    highlightedTaskId,
    isLoading,
    isAdding,
    setIsAdding,
    editingTask,
    setEditingTask,
    newTitle,
    setNewTitle,
    newCategory,
    setNewCategory,
    newDuration,
    setNewDuration,
    newPriority,
    setNewPriority,
    newTime,
    setNewTime,
    showNewTimePicker,
    setShowNewTimePicker,
    newTimeDate,
    setNewTimeDate,
    newTaskDate,
    setNewTaskDate,
    showNewDatePicker,
    setShowNewDatePicker,
    aiSuggestion,
    setAiSuggestion,
    isLoadingAI,
    editTitle,
    setEditTitle,
    editCategory,
    setEditCategory,
    editDuration,
    setEditDuration,
    editPriority,
    setEditPriority,
    editTime,
    setEditTime,
    activeTimerId,
    setActiveTimerId,
    elapsedSeconds,
    setElapsedSeconds,
    isRecording,
    setIsRecording,
    sessionStartTime,
    focusCardAnim,
    focusSessions,
    setFocusSessions,
    focusStats,
    setFocusStats,
    showAbandonConfirm,
    setShowAbandonConfirm,
    showSessionSummary,
    setShowSessionSummary,
    highlightedTaskTitle,
    showAddedBanner,
    greeting,
    todayTasks,
    completedCount,
    totalCount,
    progressPercent,
    nextTask,
    totalMinutes,
    completedMinutes,
    activeTask,
  } = usePlanData({ routeParams });

  // Actions hook
  const {
    handleNavigate,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    completeTimedTask,
    handleComplete,
    handleDelete,
    handleMoveToTomorrow,
    handleAddTask,
    openEditModal,
    saveEditedTask,
  } = usePlanActions({
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
    navigation: navigator,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading plan…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <PlanHeader
          greeting={greeting}
          showCalendar={showCalendar}
          onToggleCalendar={() => setShowCalendar(!showCalendar)}
          onAddTask={() => setIsAdding(true)}
        />

        {/* Date Pill */}
        <TouchableOpacity 
          style={styles.datePill} 
          onPress={() => setShowCalendar(true)}
          accessibilityRole="button"
          accessibilityLabel={`Select date: ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
          accessibilityHint="Opens calendar to choose a different date"
        >
          <Text style={styles.datePillText}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
          <Ionicons name={showCalendar ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* Calendar */}
        {showCalendar && (
          <View style={styles.calendarWrap}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => {
                if (date) setSelectedDate(date);
                if (Platform.OS !== 'ios') setShowCalendar(false);
              }}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity 
                style={styles.calendarCloseBtn} 
                onPress={() => setShowCalendar(false)}
                accessibilityRole="button"
                accessibilityLabel="Close calendar"
              >
                <Text style={styles.calendarCloseText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Progress Card */}
        <ProgressCard
          todayTasks={todayTasks}
          completedCount={completedCount}
          totalCount={totalCount}
          progressPercent={progressPercent}
          totalMinutes={totalMinutes}
          completedMinutes={completedMinutes}
          onNavigateSort={() => handleNavigate('sort')}
        />

        {/* Active Focus Session */}
        {activeTimerId !== null && activeTask && (
          <FocusCard
            activeTask={activeTask}
            elapsedSeconds={elapsedSeconds}
            isRecording={isRecording}
            focusStats={focusStats}
            focusCardAnim={focusCardAnim}
            onStop={() => stopTimer(false)}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onComplete={() => completeTimedTask(activeTimerId)}
          />
        )}

        {/* Next Focus Card */}
        {nextTask && activeTimerId === null && !isQuickTask(nextTask) && (
          <NextFocusCard
            task={nextTask}
            onStart={() => startTimer(nextTask.id)}
            onComplete={() => handleComplete(nextTask.id)}
          />
        )}

        {/* Swipe Hint */}
        {todayTasks.length > 0 && (
          <Text style={styles.swipeHint}>Swipe tasks: → complete • ← delete</Text>
        )}

        {/* Added Banner */}
        {showAddedBanner && <AddedBanner taskTitle={showAddedBanner} />}

        {/* Task List */}
        <View style={styles.taskList}>
          {todayTasks.map(task => (
            <View key={task.id} style={[styles.taskListItem, highlightedTaskTitle === task.title && styles.highlightedTask]}>
              <SwipeableTask
                task={task}
                onComplete={() => handleComplete(task.id)}
                onDelete={() => handleDelete(task.id)}
                onEdit={() => openEditModal(task)}
                onFocus={() => {
                  if (activeTimerId === task.id) {
                    pauseTimer();
                  } else {
                    if (activeTimerId) stopTimer(true);
                    startTimer(task.id);
                  }
                }}
                onMoveTomorrow={() => handleMoveToTomorrow(task.id)}
                isActive={activeTimerId === task.id}
                isQuick={isQuickTask(task)}
                isHighlighted={highlightedTaskId === String(task.id)}
              />
            </View>
          ))}
        </View>

        {/* Empty State */}
        {todayTasks.length === 0 && (
          <EmptyState
            onAddTask={() => setIsAdding(true)}
            onNavigateSort={() => handleNavigate('sort')}
          />
        )}
      </ScrollView>

      {/* Modals */}
      <AddTaskModal
        visible={isAdding}
        onClose={() => setIsAdding(false)}
        onSubmit={handleAddTask}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        newDuration={newDuration}
        setNewDuration={setNewDuration}
        newPriority={newPriority}
        setNewPriority={setNewPriority}
        newTime={newTime}
        setNewTime={setNewTime}
        newTaskDate={newTaskDate}
        setNewTaskDate={setNewTaskDate}
        newTimeDate={newTimeDate}
        setNewTimeDate={setNewTimeDate}
        showNewTimePicker={showNewTimePicker}
        setShowNewTimePicker={setShowNewTimePicker}
        showNewDatePicker={showNewDatePicker}
        setShowNewDatePicker={setShowNewDatePicker}
        aiSuggestion={aiSuggestion}
        isLoadingAI={isLoadingAI}
        setAiSuggestion={setAiSuggestion}
      />

      <EditTaskModal
        visible={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={saveEditedTask}
        onDelete={handleDelete}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        editDuration={editDuration}
        setEditDuration={setEditDuration}
        editPriority={editPriority}
        setEditPriority={setEditPriority}
        editTime={editTime}
        setEditTime={setEditTime}
      />

      <AbandonConfirmModal
        visible={showAbandonConfirm}
        onKeepGoing={() => setShowAbandonConfirm(false)}
        onEndSession={() => stopTimer(true)}
      />

      <SessionSummaryModal
        session={showSessionSummary}
        onClose={() => setShowSessionSummary(null)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBackdrop} />
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      )}
    </SafeAreaView>
  );
}

export default PlanScreen;
