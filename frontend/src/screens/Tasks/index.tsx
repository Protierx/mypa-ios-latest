import React from 'react';
import { SafeAreaView } from 'react-native';
import { useTasksData } from './hooks';
import {
  Header,
  SearchBar,
  StatsRow,
  FilterTabs,
  TasksList,
} from './components';
import { TaskModal } from './modals';
import { styles } from './styles';

export function TasksScreen({ navigation }: any) {
  const {
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
    filteredTasks,
    pendingCount,
    completedCount,
    highPriorityCount,
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
  } = useTasksData();

  return (
    <SafeAreaView style={styles.container}>
      <Header
        onBack={() => navigation.goBack()}
        onAdd={openCreateModal}
      />

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <StatsRow
        pendingCount={pendingCount}
        completedCount={completedCount}
        highPriorityCount={highPriorityCount}
      />

      <FilterTabs
        filter={filter}
        onFilterChange={setFilter}
      />

      <TasksList
        tasks={filteredTasks}
        filter={filter}
        onToggleTask={toggleTask}
        onEditTask={openEditModal}
        addPulse={addPulse}
        onAdd={openCreateModal}
      />

      <TaskModal
        visible={showTaskModal}
        editingTask={editingTask}
        titleInput={titleInput}
        descInput={descInput}
        priorityInput={priorityInput}
        categoryInput={categoryInput}
        dueInput={dueInput}
        onTitleChange={setTitleInput}
        onDescChange={setDescInput}
        onPriorityChange={setPriorityInput}
        onCategoryChange={setCategoryInput}
        onDueChange={setDueInput}
        onSave={saveTask}
        onDelete={deleteTask}
        onClose={() => setShowTaskModal(false)}
      />
    </SafeAreaView>
  );
}

export default TasksScreen;
