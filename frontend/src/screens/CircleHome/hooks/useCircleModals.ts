import { useState } from 'react';

/**
 * Manages all modal visibility states for CircleHome
 * Centralizes modal state to reduce clutter in main component
 */
export function useCircleModals() {
  // Action & Navigation Modals
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showTodayModal, setShowTodayModal] = useState(false);
  
  // Assignment Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showAssignmentOptions, setShowAssignmentOptions] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  
  // Post Modals
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Proof Modals
  const [showSubmitProofModal, setShowSubmitProofModal] = useState(false);
  const [showViewProofModal, setShowViewProofModal] = useState(false);
  
  // Member Management Modals (Admin)
  const [showMemberOptions, setShowMemberOptions] = useState(false);
  const [showMemberActionSheet, setShowMemberActionSheet] = useState(false);
  const [showMemberDetailModal, setShowMemberDetailModal] = useState(false);
  
  // Circle Settings Modals (Admin)
  const [showCircleSettings, setShowCircleSettings] = useState(false);
  
  // Challenge Modals
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  
  // Helper to close all modals (useful for cleanup)
  const closeAllModals = () => {
    setShowActionMenu(false);
    setShowInviteSheet(false);
    setShowMembersModal(false);
    setShowTodayModal(false);
    setShowAssignModal(false);
    setShowMemberPicker(false);
    setShowAssignmentOptions(false);
    setShowEditAssignmentModal(false);
    setShowDeclineModal(false);
    setShowPostOptions(false);
    setShowEditPostModal(false);
    setShowShareModal(false);
    setShowSubmitProofModal(false);
    setShowViewProofModal(false);
    setShowMemberOptions(false);
    setShowMemberActionSheet(false);
    setShowMemberDetailModal(false);
    setShowCircleSettings(false);
    setShowCreateChallengeModal(false);
  };

  // Helper to open assign modal with pre-selected member
  const openAssignModalForMember = (member: { id: string; name: string; initial: string }) => {
    // This will need to be handled by the parent component's state setter
    // Return an action object that parent can handle
    setShowAssignModal(true);
    return { action: 'preselect-member', member };
  };

  return {
    // Action & Navigation
    showActionMenu,
    setShowActionMenu,
    showInviteSheet,
    setShowInviteSheet,
    showMembersModal,
    setShowMembersModal,
    showTodayModal,
    setShowTodayModal,
    
    // Assignments
    showAssignModal,
    setShowAssignModal,
    showMemberPicker,
    setShowMemberPicker,
    showAssignmentOptions,
    setShowAssignmentOptions,
    showEditAssignmentModal,
    setShowEditAssignmentModal,
    showDeclineModal,
    setShowDeclineModal,
    
    // Posts
    showPostOptions,
    setShowPostOptions,
    showEditPostModal,
    setShowEditPostModal,
    showShareModal,
    setShowShareModal,
    
    // Proof
    showSubmitProofModal,
    setShowSubmitProofModal,
    showViewProofModal,
    setShowViewProofModal,
    
    // Member Management
    showMemberOptions,
    setShowMemberOptions,
    showMemberActionSheet,
    setShowMemberActionSheet,
    showMemberDetailModal,
    setShowMemberDetailModal,
    
    // Circle Settings
    showCircleSettings,
    setShowCircleSettings,
    
    // Challenges
    showCreateChallengeModal,
    setShowCreateChallengeModal,
    
    // Helpers
    closeAllModals,
    openAssignModalForMember,
  };
}
