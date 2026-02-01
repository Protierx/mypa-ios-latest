import { useState } from 'react';

/**
 * Manages post selection mode (WhatsApp-style multi-select)
 * Handles selecting, deleting, and hiding posts
 */
export function usePostSelection() {
  const [postSelectionMode, setPostSelectionMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string | number>>(new Set());
  const [deletingSelectedPosts, setDeletingSelectedPosts] = useState(false);
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());

  // Enter selection mode with initial post selected
  const enterSelectionMode = (postId: string | number) => {
    setPostSelectionMode(true);
    setSelectedPosts(new Set([postId]));
  };

  // Exit selection mode and clear selections
  const exitSelectionMode = () => {
    setPostSelectionMode(false);
    setSelectedPosts(new Set());
  };

  // Toggle post selection
  const togglePostSelection = (postId: string | number) => {
    setSelectedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        // Exit selection mode if nothing selected
        if (newSet.size === 0) {
          setPostSelectionMode(false);
        }
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Select all posts
  const selectAllPosts = (postIds: (string | number)[]) => {
    setSelectedPosts(new Set(postIds));
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedPosts(new Set());
  };

  // Hide a post from feed
  const hidePost = (postId: string) => {
    setHiddenPostIds((prev) => new Set([...prev, postId]));
  };

  // Unhide all posts
  const unhideAllPosts = () => {
    setHiddenPostIds(new Set());
  };

  // Check if post is hidden
  const isPostHidden = (postId: string) => {
    return hiddenPostIds.has(postId);
  };

  // Check if post is selected
  const isPostSelected = (postId: string | number) => {
    return selectedPosts.has(postId);
  };

  // Get count of selected posts
  const selectedCount = selectedPosts.size;

  // Get count of hidden posts
  const hiddenCount = hiddenPostIds.size;

  return {
    // Selection mode
    postSelectionMode,
    setPostSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    
    // Selected posts
    selectedPosts,
    setSelectedPosts,
    togglePostSelection,
    selectAllPosts,
    clearSelections,
    isPostSelected,
    selectedCount,
    
    // Hidden posts
    hiddenPostIds,
    setHiddenPostIds,
    hidePost,
    unhideAllPosts,
    isPostHidden,
    hiddenCount,
    
    // Deleting state
    deletingSelectedPosts,
    setDeletingSelectedPosts,
  };
}
