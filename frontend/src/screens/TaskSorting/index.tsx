import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TaskSortingScreenProps } from './types';
import { Colors, quickTemplates } from './constants';
import { useTaskSortingData } from './hooks';
import { TaskCard, EmptyState } from './components';
import { AddToPlanModal, AiSortModal } from './modals';
import { styles } from './styles';

export function TaskSortingScreen({ navigation: navProp }: TaskSortingScreenProps) {
  const navigation = navProp || useNavigation<any>();
  
  const {
    inputText,
    setInputText,
    activeFilter,
    setActiveFilter,
    showAddToPlanModal,
    setShowAddToPlanModal,
    showAiSortModal,
    setShowAiSortModal,
    selectedTask,
    selectedDate,
    setSelectedDate,
    isAiProcessing,
    sortedTasks,
    setSortedTasks,
    showTaskMenu,
    setShowTaskMenu,
    completingTaskId,
    inputRef,
    fadeAnims,
    slideAnims,
    checkAnims,
    spinAnim,
    dateOptions,
    filteredTasks,
    unsortedCount,
    reviewedCount,
    handleAddTask,
    handleToggleStar,
    handleCompleteTask,
    handleDeleteTask,
    handleCategorizeTask,
    handleOpenAddToPlan,
    handleConfirmAddToPlan,
    handleAiSort,
    handleConfirmAiSort,
    tasks,
  } = useTaskSortingData();

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
            <TouchableOpacity 
              onPress={handleAddTask} 
              style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]} 
              disabled={!inputText.trim()}
            >
              <Feather name="plus" size={20} color={inputText.trim() ? Colors.white : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Templates */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.templatesScroll} 
          contentContainerStyle={styles.templatesContent}
        >
          {quickTemplates.map((template, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.templateButton} 
              onPress={() => { setInputText(template.text); inputRef.current?.focus(); }}
            >
              <MaterialCommunityIcons name={template.icon as any} size={16} color={Colors.textSecondary} />
              <Text style={styles.templateText}>{template.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]} 
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
              All ({tasks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'unsorted' && styles.filterTabActive]} 
            onPress={() => setActiveFilter('unsorted')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'unsorted' && styles.filterTabTextActive]}>
              Unsorted ({unsortedCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'reviewed' && styles.filterTabActive]} 
            onPress={() => setActiveFilter('reviewed')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'reviewed' && styles.filterTabTextActive]}>
              Reviewed ({reviewedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity 
            style={styles.quickAccessButton} 
            onPress={() => { try { navigation.navigate('Home', { screen: 'Plan' }); } catch { navigation.navigate('Plan'); } }}
          >
            <Feather name="calendar" size={20} color={Colors.blue} />
            <Text style={styles.quickAccessText}>View Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAccessButton} 
            onPress={() => { try { navigation.navigate('Home', { screen: 'Challenges' }); } catch { navigation.navigate('Challenges'); } }}
          >
            <Feather name="award" size={20} color={Colors.warning} />
            <Text style={styles.quickAccessText}>Challenges</Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <View style={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <EmptyState 
              activeFilter={activeFilter}
              onAddTask={() => inputRef.current?.focus()}
            />
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                fadeAnim={fadeAnims[task.id]}
                slideAnim={slideAnims[task.id]}
                checkAnim={checkAnims[task.id]}
                completingTaskId={completingTaskId}
                showTaskMenu={showTaskMenu}
                onToggleStar={handleToggleStar}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onOpenAddToPlan={handleOpenAddToPlan}
                onCategorize={handleCategorizeTask}
                onToggleMenu={setShowTaskMenu}
              />
            ))
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add to Plan Modal */}
      <AddToPlanModal
        visible={showAddToPlanModal}
        onClose={() => setShowAddToPlanModal(false)}
        onConfirm={() => handleConfirmAddToPlan(navigation)}
        selectedTask={selectedTask}
        dateOptions={dateOptions}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* AI Sort Results Modal */}
      <AiSortModal
        visible={showAiSortModal}
        onClose={() => { setShowAiSortModal(false); setSortedTasks([]); }}
        onConfirm={() => handleConfirmAiSort(navigation)}
        isAiProcessing={isAiProcessing}
        sortedTasks={sortedTasks}
        spinAnim={spinAnim}
      />
    </SafeAreaView>
  );
}

export default TaskSortingScreen;
