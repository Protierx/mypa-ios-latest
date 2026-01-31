import { useState } from 'react';

/**
 * Manages assignment creation form state
 * Handles all form fields and validation for creating assignments
 */
export function useAssignmentForm() {
  // Basic fields
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [assignmentXp, setAssignmentXp] = useState(50);
  
  // Member selection
  const [assignedMember, setAssignedMember] = useState<{ 
    id: string; 
    name: string; 
    initial: string;
  } | null>(null);
  const [assignTo, setAssignTo] = useState('');
  const [assignToId, setAssignToId] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  
  // Scheduling
  const [dueDay, setDueDay] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDueDate, setCustomDueDate] = useState<Date>(new Date());
  const [dueTime, setDueTime] = useState<Date>(() => {
    const date = new Date();
    date.setHours(18, 0, 0, 0);
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Options
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [requireProof, setRequireProof] = useState(false);
  const [sendNudge, setSendNudge] = useState(true);
  
  // Repeat end options
  const [repeatEndType, setRepeatEndType] = useState<'forever' | 'untilDate' | 'count'>('forever');
  const [repeatEndDate, setRepeatEndDate] = useState<Date>(new Date());
  const [repeatEndCount, setRepeatEndCount] = useState(10);
  const [showRepeatEndDatePicker, setShowRepeatEndDatePicker] = useState(false);
  
  // Loading state
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Reset form to defaults
  const resetForm = () => {
    setAssignmentTitle('');
    setAssignmentNote('');
    setAssignmentXp(50);
    setAssignedMember(null);
    setAssignTo('');
    setAssignToId('');
    setMemberSearchQuery('');
    setDueDay('today');
    setCustomDueDate(new Date());
    const defaultTime = new Date();
    defaultTime.setHours(18, 0, 0, 0);
    setDueTime(defaultTime);
    setRepeatEnabled(false);
    setRepeatFrequency('daily');
    setRequireProof(false);
    setSendNudge(true);
    setRepeatEndType('forever');
    setRepeatEndDate(new Date());
    setRepeatEndCount(10);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowRepeatEndDatePicker(false);
  };

  // Select member helper
  const selectMember = (member: { id: string; name: string; initial: string }) => {
    setAssignedMember(member);
    setAssignTo(member.name);
    setAssignToId(member.id);
  };

  // Calculate final due date
  const calculateDueDate = (): Date => {
    let dueDate = new Date();
    
    if (dueDay === 'tomorrow') {
      dueDate.setDate(dueDate.getDate() + 1);
    } else if (dueDay === 'custom') {
      dueDate = new Date(customDueDate);
    }
    
    // Set the time from the time picker
    dueDate.setHours(dueTime.getHours(), dueTime.getMinutes(), 0, 0);
    
    return dueDate;
  };

  // Validate form
  const validateForm = (): { valid: boolean; error?: string } => {
    if (!assignmentTitle.trim()) {
      return { valid: false, error: 'Please enter a mission title' };
    }
    if (!assignedMember) {
      return { valid: false, error: 'Please select a member to assign' };
    }
    return { valid: true };
  };

  // Get form data for submission
  const getFormData = () => {
    return {
      assigneeId: assignedMember?.id || '',
      title: assignmentTitle.trim(),
      description: assignmentNote.trim() || '',
      dueDate: calculateDueDate().toISOString(),
      xpReward: assignmentXp,
      repeatEnabled,
      repeatFrequency: repeatEnabled ? repeatFrequency : undefined,
      requireProof,
    };
  };

  return {
    // Basic fields
    assignmentTitle,
    setAssignmentTitle,
    assignmentNote,
    setAssignmentNote,
    assignmentXp,
    setAssignmentXp,
    
    // Member selection
    assignedMember,
    setAssignedMember,
    assignTo,
    setAssignTo,
    assignToId,
    setAssignToId,
    memberSearchQuery,
    setMemberSearchQuery,
    
    // Scheduling
    dueDay,
    setDueDay,
    customDueDate,
    setCustomDueDate,
    dueTime,
    setDueTime,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    
    // Options
    repeatEnabled,
    setRepeatEnabled,
    repeatFrequency,
    setRepeatFrequency,
    requireProof,
    setRequireProof,
    sendNudge,
    setSendNudge,
    
    // Repeat end
    repeatEndType,
    setRepeatEndType,
    repeatEndDate,
    setRepeatEndDate,
    repeatEndCount,
    setRepeatEndCount,
    showRepeatEndDatePicker,
    setShowRepeatEndDatePicker,
    
    // Loading
    creatingAssignment,
    setCreatingAssignment,
    
    // Helpers
    resetForm,
    selectMember,
    calculateDueDate,
    validateForm,
    getFormData,
  };
}
