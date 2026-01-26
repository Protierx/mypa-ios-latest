import {
  ArrowLeft,
  Users,
  MoreVertical,
  Flame,
  Heart,
  Plus,
  CheckCircle,
  Clock,
  X,
  ThumbsUp,
  Camera,
  Share2,
  Copy,
  Check,
  ChevronDown,
  MessageCircle,
  Trophy,
} from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState, useEffect } from "react";

interface CircleHomeScreenProps {
  onNavigate?: (screen: string) => void;
  onAssignmentCreated?: (assignment: Assignment) => void;
  onModalStateChange?: (isModalOpen: boolean) => void;
}

interface Member {
  id: string;
  initial: string;
  name: string;
  posted: boolean;
  lastPostTime?: string;
  lastPostPreview?: { missions?: number; wallet?: string; streak?: number };
  role?: "admin" | "member"; // NEW: role field
}

interface Post {
  id: number;
  type: "receipt" | "system";
  isNew?: boolean;
  // Receipt fields
  user?: { initial: string; name: string };
  time?: string;
  missions?: { completed: number; total: number };
  wallet?: string;
  streak?: number;
  reactions?: { heart: number; fire: number; clap: number };
  privacy?: string;
  note?: string;
  reactionAnimatingId?: number | null;
  // System update fields (assignments)
  systemType?: "assigned" | "accepted" | "completed" | "declined";
  systemText?: string;
  icon?: "clock" | "check" | "x";
  dueTime?: string;
}

interface Assignment {
  id: number;
  circleId: string;
  title: string;
  assignedTo: string;
  assignedToId: string;
  createdByName: string;
  dueTime?: string;
  dueAt?: string; // ISO datetime string for future scheduling
  status: "pending" | "accepted" | "completed" | "declined" | "scheduled";
  createdAt: string;
  proofRequired?: boolean;
  proofStatus?: "none" | "required" | "submitted" | "approved";
  proofType?: "photo";
  proofImageUri?: string;
  proofSubmittedAt?: string;
  repeatRule?: {
    frequency: "daily" | "weekly" | "custom" | "monthly";
    days?: string[]; // ["Mon", "Tue", "Wed", ...]
    time?: string; // "19:00"
    end?: {
      type: "forever" | "untilDate" | "count";
      untilDate?: string;
      count?: number;
    };
  };
  nudgeTiming?: "now" | "at-due-time" | "30-mins-before";
}

export function CircleHomeScreen({ onNavigate, onAssignmentCreated, onModalStateChange }: CircleHomeScreenProps) {
  const circleId = "circle-1";
  const circleName = "Morning Warriors";
  const userInitial = "Y"; // You
  const userName = "You";
  
  const [circleMembers, setCircleMembers] = useState<Member[]>([
    { id: "a", initial: 'A', name: 'Alex', posted: true, lastPostTime: "2h ago", lastPostPreview: { missions: 4, wallet: "+26m", streak: 6 }, role: "admin" },
    { id: "b", initial: 'B', name: 'Blake', posted: true, lastPostTime: "4h ago", lastPostPreview: { missions: 5, wallet: "+32m", streak: 12 }, role: "member" },
    { id: "c", initial: 'C', name: 'Charlie', posted: false, role: "member" },
    { id: "d", initial: 'D', name: 'Dana', posted: true, lastPostTime: "1h ago", lastPostPreview: { missions: 3, wallet: "+15m", streak: 4 }, role: "member" },
  ]);
  
  const [userPosted, setUserPosted] = useState(false);
  const postedCount = circleMembers.filter(m => m.posted).length + (userPosted ? 1 : 0);
  const totalCount = circleMembers.length + 1; // +1 for user

  const [showTodayModal, setShowTodayModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showMemberDetailModal, setShowMemberDetailModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [copySuccess, setCopySuccess] = useState<'link' | 'code' | null>(null);
  const [feedFilter, setFeedFilter] = useState<"all" | "checkins" | "assignments">("all");
  const [circleTab, setCircleTab] = useState<"feed" | "challenges" | "members">("feed");

  // Circle invite data
  const inviteCode = "MYPA-7K2P";
  const inviteLink = "https://mypa.app/invite/MYPA-7K2P";

  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDueTime, setAssignmentDueTime] = useState("");
  const [sendNudge, setSendNudge] = useState(true);
  const [assignTo, setAssignTo] = useState("");
  const [assignToId, setAssignToId] = useState("");
  const [requireProof, setRequireProof] = useState(false); // OFF by default
  const [proofType, setProofType] = useState<"photo">("photo");
  const [showSubmitProofModal, setShowSubmitProofModal] = useState(false);
  const [showViewProofModal, setShowViewProofModal] = useState(false);
  const [selectedAssignmentForProof, setSelectedAssignmentForProof] = useState<Assignment | null>(null);
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  // Scheduling state
  const [dueDay, setDueDay] = useState<"today" | "tomorrow" | "custom">("today");
  const [customDueDate, setCustomDueDate] = useState("");
  const [dueTime, setDueTime] = useState("18:00");
  
  // Repeat state - OFF by default
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [repeatTime, setRepeatTime] = useState("19:00");
  
  // Repeat end rule
  const [repeatEndType, setRepeatEndType] = useState<"forever" | "untilDate" | "count">("forever");
  const [repeatEndDate, setRepeatEndDate] = useState("");
  const [repeatEndCount, setRepeatEndCount] = useState(10);
  
  // Nudge timing - ON by default (send now)
  const [nudgeTiming, setNudgeTiming] = useState<"now" | "at-due-time" | "30-mins-before">("now");

  // Member picker state
  const [assignedMember, setAssignedMember] = useState<Member | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  // Share Post state
  const [shareMissions, setShareMissions] = useState(true);
  const [shareWallet, setShareWallet] = useState(true);
  const [shareStreak, setShareStreak] = useState(true);
  const [shareNote, setShareNote] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("metrics");

  // Global assignments list (would sync to parent/global state in real app)
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);

  // Circle Settings state
  const [showCircleSettings, setShowCircleSettings] = useState(false);
  const [selectedMemberForManage, setSelectedMemberForManage] = useState<Member | null>(null);
  const [showMemberActionSheet, setShowMemberActionSheet] = useState(false);
  
  // Settings toggles
  const [allowAssignments, setAllowAssignments] = useState(true);
  const [requireAcceptBeforeAdding, setRequireAcceptBeforeAdding] = useState(false);
  const [defaultProofRequired, setDefaultProofRequired] = useState(false);
  const [inviteLinkEnabled, setInviteLinkEnabled] = useState(true);
  const [approveNewMembers, setApproveNewMembers] = useState(false);
  const [muteCircle, setMuteCircle] = useState(false);
  const [circlePrivacy, setCirclePrivacy] = useState<"metrics" | "circle">("metrics");
  
  // Quiet hours
  const [quietHoursStart, setQuietHoursStart] = useState("21:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      type: "system",
      systemType: "completed",
      systemText: "Dana completed: Take bins out",
      icon: "check",
      time: "1h ago",
    },
    {
      id: 2,
      type: "receipt",
      user: { initial: "A", name: "Alex" },
      time: "2h ago",
      missions: { completed: 4, total: 5 },
      wallet: "+26m",
      streak: 6,
      privacy: "Metrics only",
      note: "Morning accountability boost",
      reactions: { heart: 18, fire: 8, clap: 3 },
    },
    {
      id: 3,
      type: "system",
      systemType: "assigned",
      systemText: "Blake assigned: Grocery run",
      icon: "clock",
      time: "30m ago",
      dueTime: "6pm",
    },
    {
      id: 4,
      type: "receipt",
      isNew: true,
      user: { initial: "B", name: "Blake" },
      time: "1h ago",
      missions: { completed: 5, total: 5 },
      wallet: "+32m",
      streak: 12,
      privacy: "Metrics only",
      note: "Deep work sessions complete",
      reactions: { heart: 24, fire: 12, clap: 5 },
    },
  ]);

  // State for pending message reply
  const [replyingTo, setReplyingTo] = useState<{ name: string; message: string } | null>(null);
  const [replyText, setReplyText] = useState("");

  // Check for pending message actions from Inbox
  useEffect(() => {
    const checkForPendingMessage = () => {
      try {
        const pendingAction = localStorage.getItem('pendingMessageAction');
        if (pendingAction) {
          const action = JSON.parse(pendingAction);
          if (action.action === 'reply' && action.senderName) {
            setReplyingTo({
              name: action.senderName,
              message: action.messagePreview || '',
            });
            // Clear the pending action
            localStorage.removeItem('pendingMessageAction');
          }
        }
      } catch (e) {
        console.error('Error processing pending message action', e);
      }
    };
    
    checkForPendingMessage();
  }, []);

  // Handle sending a reply
  const handleSendReply = () => {
    if (replyText.trim() && replyingTo) {
      // Add the reply as a new post in the feed
      const newPost: Post = {
        id: Date.now(),
        type: "system",
        systemType: "completed",
        systemText: `You replied to ${replyingTo.name}: "${replyText.trim()}"`,
        icon: "check",
        time: "just now",
      };
      setPosts(prev => [newPost, ...prev]);
      setReplyText("");
      setReplyingTo(null);
    }
  };

  // Update parent about modal state
  useEffect(() => {
    const isAnyModalOpen = showAssignModal || showShareModal || showMemberPicker || showInviteSheet || showTodayModal || showMembersModal || showMemberDetailModal || showCircleSettings || showMemberActionSheet || replyingTo !== null;
    onModalStateChange?.(isAnyModalOpen);
  }, [showAssignModal, showShareModal, showMemberPicker, showInviteSheet, showTodayModal, showMembersModal, showMemberDetailModal, showCircleSettings, showMemberActionSheet, replyingTo, onModalStateChange]);

  const handleReaction = (postId: number, reaction: "heart" | "fire" | "clap") => {
    setPosts(posts.map(post => {
      if (post.id === postId && post.reactions) {
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [reaction]: post.reactions[reaction] + 1,
          },
          reactionAnimatingId: postId,
        };
      }
      return post;
    }));

    // Reset animation state after 300ms
    setTimeout(() => {
      setPosts(posts =>
        posts.map(post =>
          post.id === postId ? { ...post, reactionAnimatingId: null } : post
        )
      );
    }, 300);
  };

  const handleOpenTodayModal = () => {
    setShowTodayModal(true);
  };

  const handleOpenMemberDetail = (member: Member) => {
    setSelectedMember(member);
    setShowMemberDetailModal(true);
  };

  const filteredPosts = posts.filter(post => {
    if (feedFilter === "checkins") return post.type === "receipt";
    if (feedFilter === "assignments") return post.type === "system";
    return true;
  });

  const handleShareToday = () => {
    setShowShareModal(true);
    onModalStateChange?.(true);
  };

  const handleConfirmShare = () => {
    // Create a receipt post
    const newReceipt: Post = {
      id: Math.max(...posts.map(p => p.id), 0) + 1,
      type: "receipt",
      user: { initial: userInitial, name: userName },
      time: "Just now",
      isNew: true,
      ...(shareMissions && { missions: { completed: 4, total: 5 } }),
      ...(shareWallet && { wallet: "+28m" }),
      ...(shareStreak && { streak: 8 }),
      privacy: privacyLevel === "metrics" ? "Metrics only" : "Circle only",
      note: shareNote || undefined,
      reactions: { heart: 0, fire: 0, clap: 0 },
    };

    setPosts([newReceipt, ...posts]);
    setUserPosted(true);
    
    // Reset form
    setShareMissions(true);
    setShareWallet(true);
    setShareStreak(true);
    setShareNote("");
    setPrivacyLevel("metrics");
    setShowShareModal(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess('link');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopySuccess('code');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleShareLink = async () => {
    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${circleName}`,
          text: `Join me in ${circleName} on MYPA`,
          url: inviteLink,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback to copying
      handleCopyLink();
    }
  };

  // Member management functions
  const handlePromoteToAdmin = (memberId: string) => {
    setCircleMembers(members =>
      members.map(m => m.id === memberId ? { ...m, role: "admin" } : m)
    );
    setShowMemberActionSheet(false);
    setSelectedMemberForManage(null);
  };

  const handleRemoveFromCircle = (memberId: string) => {
    setCircleMembers(members => members.filter(m => m.id !== memberId));
    setShowMemberActionSheet(false);
    setSelectedMemberForManage(null);
  };

  const isCurrentUserAdmin = true; // For demo: current user (You) is admin

  const handleAssignMission = () => {
    if (!assignmentTitle.trim() || !assignTo || !assignToId) {
      alert("Please fill in mission title and assignee");
      return;
    }

    // Calculate due datetime
    let dueDateObj = new Date();
    if (dueDay === "tomorrow") {
      dueDateObj.setDate(dueDateObj.getDate() + 1);
    } else if (dueDay === "custom" && customDueDate) {
      dueDateObj = new Date(customDueDate);
    }
    
    const [hours, minutes] = dueTime.split(":").map(Number);
    dueDateObj.setHours(hours, minutes, 0, 0);
    const dueAtISO = dueDateObj.toISOString();
    
    // Format display text for due date - convert to 12-hour format
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dueDayName = daysOfWeek[dueDateObj.getDay()];
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours < 12 ? "AM" : "PM";
    const dueTimeDisplay = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`; // 12-hour format
    
    let systemText = `${assignTo} assigned: ${assignmentTitle}`;
    if (dueDay === "today") {
      systemText += ` (Due today ${dueTimeDisplay})`;
    } else if (dueDay === "tomorrow") {
      systemText += ` (Due tomorrow ${dueTimeDisplay})`;
    } else {
      systemText += ` (Due ${dueDayName} ${dueTimeDisplay})`;
    }
    
    if (repeatEnabled && repeatFrequency) {
      systemText += ` · Repeats ${repeatFrequency}`;
      if (repeatFrequency === "weekly" && selectedWeekdays.length > 0) {
        systemText += ` · ${selectedWeekdays.join(", ")} ${repeatTime}`;
      }
    }

    // Create system update card
    const newSystemCard: Post = {
      id: Math.max(...posts.map(p => p.id), 0) + 1,
      type: "system",
      systemType: "assigned",
      systemText: systemText,
      icon: "clock",
      time: "Just now",
      dueTime: dueTimeDisplay,
    };

    // Create assignment object
    const newAssignment: Assignment = {
      id: Math.max(...allAssignments.map(a => a.id), 0) + 1,
      circleId: circleId,
      title: assignmentTitle,
      assignedTo: assignTo,
      assignedToId: assignToId,
      createdByName: userName,
      dueTime: dueTimeDisplay,
      dueAt: dueAtISO,
      status: dueDay === "today" ? "pending" : "scheduled",
      createdAt: new Date().toISOString(),
      proofRequired: requireProof,
      proofStatus: requireProof ? "required" : "none",
      proofType: requireProof ? proofType : undefined,
      nudgeTiming: nudgeTiming,
      repeatRule: repeatEnabled 
        ? {
            frequency: repeatFrequency,
            days: selectedWeekdays.length > 0 ? selectedWeekdays : undefined,
            time: repeatTime,
            end: {
              type: repeatEndType,
              untilDate: repeatEndType === "untilDate" ? repeatEndDate : undefined,
              count: repeatEndType === "count" ? repeatEndCount : undefined,
            },
          }
        : undefined,
    };

    setPosts([newSystemCard, ...posts]);
    setAllAssignments([newAssignment, ...allAssignments]);
    
    // Notify parent component
    onAssignmentCreated?.(newAssignment);

    // Reset form
    setAssignmentTitle("");
    setAssignmentDueTime("");
    setAssignTo("");
    setAssignToId("");
    setSendNudge(true);
    setRequireProof(false);
    setProofType("photo");
    setDueDay("today");
    setCustomDueDate("");
    setDueTime("18:00");
    setRepeatEnabled(false);
    setRepeatFrequency("daily");
    setSelectedWeekdays([]);
    setRepeatTime("19:00");
    setRepeatEndType("forever");
    setRepeatEndDate("");
    setRepeatEndCount(10);
    setNudgeTiming("now");
    setAssignedMember(null);
    setShowMemberPicker(false);
    setShowAssignModal(false);
    onModalStateChange?.(false);
  };

  const handleAssignmentStatusChange = (assignmentId: number, newStatus: "accepted" | "completed" | "declined") => {
    const assignment = allAssignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    // If proof is required and trying to complete, open Submit Proof modal instead
    if (newStatus === "completed" && assignment.proofRequired) {
      setSelectedAssignmentForProof(assignment);
      setShowSubmitProofModal(true);
      return;
    }

    // Update assignment status
    setAllAssignments(allAssignments.map(a => 
      a.id === assignmentId ? { ...a, status: newStatus } : a
    ));

    // Create system update card
    const statusText = 
      newStatus === "accepted" ? `⏳ ${assignment.assignedTo} accepted: ${assignment.title}` :
      newStatus === "completed" ? `✅ ${assignment.assignedTo} completed: ${assignment.title}` :
      `❌ ${assignment.assignedTo} declined: ${assignment.title}`;

    const newSystemCard: Post = {
      id: Math.max(...posts.map(p => p.id), 0) + 1,
      type: "system",
      systemType: newStatus === "completed" ? "completed" : newStatus === "accepted" ? "accepted" : "declined",
      systemText: statusText,
      icon: newStatus === "completed" ? "check" : newStatus === "accepted" ? "clock" : "x",
      time: "Just now",
    };

    setPosts([newSystemCard, ...posts]);
  };

  return (
    <div className="min-h-screen bg-ios-bg pb-28 relative">
      <IOSStatusBar />

      <style>{`
        .ios-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.5);
        }
        .glass-button {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>

      {/* Clean iOS Header */}
      <div className="bg-ios-bg px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate?.("circles")}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>

          <h1 className="text-[17px] font-semibold text-slate-900">
            {circleName}
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMembersModal(true)}
              className="p-2 rounded-xl glass-button hover:bg-white/90 transition-colors"
            >
              <Users className="w-5 h-5 text-slate-600" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="p-2 rounded-xl glass-button hover:bg-white/90 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </button>

              {showActionMenu && (
                <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl z-50 min-w-[200px] overflow-hidden border border-slate-200/50">
                  <button
                    onClick={() => {
                      setShowAssignModal(true);
                      setShowActionMenu(false);
                      onModalStateChange?.(true);
                    }}
                    className="flex items-center gap-3 w-full text-left px-4 py-3.5 text-[15px] text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                  >
                    <Plus className="w-4 h-4 text-purple-500" />
                    Assign Mission
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteSheet(true);
                      setShowActionMenu(false);
                    }}
                    className="flex items-center gap-3 w-full text-left px-4 py-3.5 text-[15px] text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                  >
                    <Share2 className="w-4 h-4 text-blue-500" />
                    Invite Members
                  </button>
                  <button
                    onClick={() => {
                      setShowCircleSettings(true);
                      setShowActionMenu(false);
                    }}
                    className="flex items-center gap-3 w-full text-left px-4 py-3.5 text-[15px] text-slate-700 hover:bg-slate-50"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                    Circle Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Circle Stats Card - iOS Glass Style */}
      <div className="px-4 pt-3 pb-2">
        <div className="ios-card p-4 shadow-sm">
          {/* Streak Badge & Members Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-amber-700 text-[13px] font-semibold">12 day streak</span>
            </div>
            <button 
              onClick={handleOpenTodayModal}
              className="text-[13px] text-purple-600 font-medium"
            >
              View all →
            </button>
          </div>

          {/* Member Avatars Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex -space-x-2">
              {circleMembers.slice(0, 4).map((member, idx) => (
                <div 
                  key={member.id} 
                  className="relative"
                  style={{ zIndex: 10 - idx }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-semibold bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white shadow-sm ${
                      member.posted ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-white" : ""
                    }`}
                  >
                    {member.initial}
                  </div>
                  {member.posted && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {/* You */}
              <div className="relative" style={{ zIndex: 5 }}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-slate-700 border-2 border-white shadow-sm ${
                    userPosted ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-white" : ""
                  }`}
                >
                  You
                </div>
                {userPosted && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-slate-800">{postedCount} of {totalCount} checked in</p>
              <p className="text-[12px] text-slate-500">Today's progress</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${(postedCount / totalCount) * 100}%` }}
            />
          </div>

          {/* Share Button - Only if not posted */}
          {!userPosted && (
            <button
              onClick={handleShareToday}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[15px] font-semibold shadow-lg shadow-purple-500/20 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              Share Your Day
            </button>
          )}
          {userPosted && (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-[14px] font-medium">
              <Check className="w-4 h-4" />
              You've shared today
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setShowAssignModal(true);
                onModalStateChange?.(true);
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-medium hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Assign Mission
            </button>
            <button
              onClick={() => setShowInviteSheet(true)}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-medium hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Invite
            </button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex bg-slate-100 rounded-xl p-1">
          {(["feed", "challenges", "members"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCircleTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition-all ${
                circleTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {tab === "feed" && "Feed"}
              {tab === "challenges" && `Challenges`}
              {tab === "members" && `Members`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {circleTab === "feed" && (
        <>
          {/* Empty State - No Check-ins */}
          {postedCount === 0 && (
            <div className="px-4 pb-3">
              <div className="ios-card p-5 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-3">
                  <Share2 className="w-7 h-7 text-purple-600" />
                </div>
                <p className="text-[16px] font-semibold text-slate-800 mb-1">
                  Be the first to share today
                </p>
                <p className="text-[13px] text-slate-500 mb-4">
                  Inspire your circle with your daily progress
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => onNavigate?.('daily-life-card')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[15px] font-semibold hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Create Daily Life Card
                  </button>
                  <button
                    onClick={handleShareToday}
                    className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 text-[14px] font-medium hover:bg-slate-200 active:scale-[0.98] transition-all"
                  >
                    Quick Share
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feed Filter */}
          <div className="px-4 pb-3">
            <div className="flex bg-slate-50 rounded-lg p-1 gap-0.5">
              {(["all", "checkins", "assignments"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setFeedFilter(option)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-[12px] font-medium transition-all ${
                    feedFilter === option
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {option === "all" && "All"}
                  {option === "checkins" && "Check-ins"}
                  {option === "assignments" && "Tasks"}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Posts */}
          <div className="px-4 space-y-3 pb-4">
            {filteredPosts.length === 0 ? (
              <div className="ios-card p-6 text-center">
                <p className="text-[14px] text-slate-500">No activity yet</p>
              </div>
            ) : (
              filteredPosts.map((post) => {
                if (post.type === "system") {
                  const statusChipColor = 
                    post.systemType === "completed" ? "bg-green-50 text-green-700" :
                    post.systemType === "accepted" ? "bg-amber-50 text-amber-700" :
                    post.systemType === "assigned" ? "bg-purple-50 text-purple-700" :
                    "bg-red-50 text-red-700";

                  const statusChipLabel = 
                    post.systemType === "completed" ? "Complete" :
                    post.systemType === "accepted" ? "Due" :
                    post.systemType === "assigned" ? "Assigned" :
                    "Declined";

                  return (
                    <div
                      key={post.id}
                      className={`ios-card p-4 ${
                        post.systemType === "completed" ? "border-l-4 border-emerald-400" :
                        post.systemType === "accepted" ? "border-l-4 border-amber-400" :
                        post.systemType === "assigned" ? "border-l-4 border-purple-400" :
                        "border-l-4 border-red-400"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            backgroundColor: 
                              post.systemType === "completed" ? "var(--status-completed-bg)" :
                              post.systemType === "accepted" ? "var(--status-accepted-bg)" :
                              post.systemType === "assigned" ? "var(--status-assigned-bg)" :
                              "var(--status-error-bg)"
                          }}
                        >
                          {post.systemType === "completed" && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {post.systemType === "accepted" && <Clock className="w-5 h-5 text-amber-600" />}
                          {post.systemType === "declined" && <X className="w-5 h-5 text-red-600" />}
                          {post.systemType === "assigned" && <Clock className="w-5 h-5 text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-slate-700">{post.systemText}</p>
                          {post.time && <p className="text-[11px] text-slate-500 mt-0.5">{post.time}</p>}
                        </div>
                        <div className={`px-2 py-1 rounded-md text-[10px] font-semibold flex-shrink-0 ${statusChipColor}`}>
                          {statusChipLabel}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Receipt Card
                return (
                  <div key={post.id} className={`ios-card p-4 shadow-sm ${post.isNew ? "ring-2 ring-purple-400/30" : ""}`}>
                    {post.isNew && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold">NEW</div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[13px] font-semibold ${
                        post.missions && post.missions.completed === post.missions.total ? "ring-2 ring-emerald-400 ring-offset-2" : ""
                      }`}>
                        {post.user?.initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-slate-800">{post.user?.name}</p>
                        <p className="text-[12px] text-slate-500">{post.time}</p>
                      </div>
                    </div>
                    {post.missions && (
                      <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 rounded-xl">
                        <div className="relative w-14 h-14 flex-shrink-0">
                          <svg className="w-14 h-14 transform -rotate-90">
                            <circle cx="28" cy="28" r="24" className="fill-none stroke-slate-200" strokeWidth="5" />
                            <circle cx="28" cy="28" r="24" className="fill-none stroke-purple-500" strokeWidth="5" strokeLinecap="round"
                              strokeDasharray={`${(post.missions.completed / post.missions.total) * 150.8} 150.8`} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[14px] font-bold text-slate-800">{post.missions.completed}/{post.missions.total}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[12px] text-slate-500 mb-2">Missions completed</p>
                          <div className="flex gap-2 flex-wrap">
                            {post.wallet && <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-medium">💰 {post.wallet}</span>}
                            {post.streak && <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-[12px] font-medium flex items-center gap-1"><Flame className="w-3 h-3" /> {post.streak}d</span>}
                          </div>
                        </div>
                      </div>
                    )}
                    {post.note && (
                      <div className="mb-4 p-3 bg-purple-50/50 rounded-xl border border-purple-100/50">
                        <p className="text-[13px] text-slate-700 italic">"{post.note}"</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      {post.reactions?.heart !== undefined && (
                        <button onClick={() => handleReaction(post.id, "heart")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-pink-50 transition-all active:scale-95">
                          <Heart className={`w-4 h-4 ${post.reactions.heart > 0 ? "fill-pink-500 text-pink-500" : "text-slate-400"}`} />
                          <span className="text-[12px] font-medium text-slate-600">{post.reactions.heart}</span>
                        </button>
                      )}
                      {post.reactions?.fire !== undefined && (
                        <button onClick={() => handleReaction(post.id, "fire")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-orange-50 transition-all active:scale-95">
                          <span>🔥</span>
                          <span className="text-[12px] font-medium text-slate-600">{post.reactions.fire}</span>
                        </button>
                      )}
                      {post.reactions?.clap !== undefined && (
                        <button onClick={() => handleReaction(post.id, "clap")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-amber-50 transition-all active:scale-95">
                          <span>👏</span>
                          <span className="text-[12px] font-medium text-slate-600">{post.reactions.clap}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Challenges Tab */}
      {circleTab === "challenges" && (
        <div className="px-4 pb-4 space-y-3">
          {/* Challenge 1 */}
          <div className="ios-card p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center text-2xl">🏋️</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[15px] font-semibold text-slate-800">Morning Workout</h4>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-medium">18 days left</span>
                </div>
                <p className="text-[13px] text-slate-500">Post workout proof by 10 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full" style={{ width: '60%' }} />
              </div>
              <span className="text-[12px] font-medium text-slate-600">3/5 today</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-[10px] border-2 border-white">🥇</div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold border-2 border-white">A</div>
                </div>
                <span className="text-[11px] text-slate-500">Alex leads • 12d streak</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50">
                <Flame className="w-3 h-3 text-amber-500" />
                <span className="text-[11px] font-semibold text-amber-700">7d</span>
              </div>
            </div>
          </div>

          {/* Challenge 2 */}
          <div className="ios-card p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-2xl">📵</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[15px] font-semibold text-slate-800">No Phone After 9PM</h4>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-medium">3 days left</span>
                </div>
                <p className="text-[13px] text-slate-500">Log your screen time</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full" style={{ width: '40%' }} />
              </div>
              <span className="text-[12px] font-medium text-slate-600">2/5 today</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[12px] text-slate-500">You're in 2nd place!</span>
              <button className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[12px] font-semibold hover:bg-purple-700 transition-colors">
                Log Today
              </button>
            </div>
          </div>

          {/* Create Challenge */}
          <button className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-[14px] font-medium hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/50 transition-all flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Start New Challenge
          </button>
        </div>
      )}

      {/* Members Tab */}
      {circleTab === "members" && (
        <div className="px-4 pb-4 space-y-2">
          {circleMembers.map((member, idx) => (
            <div key={member.id} className="ios-card p-4 shadow-sm flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[14px] font-semibold ${
                member.posted ? "ring-2 ring-emerald-400 ring-offset-2" : ""
              }`}>
                {member.initial}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-semibold text-slate-800">{member.name}</p>
                  {member.role === "admin" && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-semibold">Admin</span>
                  )}
                </div>
                <p className="text-[12px] text-slate-500">
                  {member.posted ? "✓ Checked in today" : "Waiting to check in"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span className="text-[11px] font-semibold text-amber-700">8d</span>
                </div>
                <button
                  onClick={() => {
                    setAssignTo(member.name);
                    setAssignToId(member.id);
                    setShowAssignModal(true);
                    onModalStateChange?.(true);
                  }}
                  className="p-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {/* You */}
          <div className="ios-card p-4 shadow-sm flex items-center gap-3 bg-purple-50/30">
            <div className={`w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white text-[12px] font-bold ${
              userPosted ? "ring-2 ring-emerald-400 ring-offset-2" : ""
            }`}>
              You
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-slate-800">You</p>
              <p className="text-[12px] text-slate-500">
                {userPosted ? "✓ Checked in today" : "Waiting to check in"}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50">
              <Flame className="w-3 h-3 text-amber-500" />
              <span className="text-[11px] font-semibold text-amber-700">12d</span>
            </div>
          </div>

          {/* Invite */}
          <button 
            onClick={() => setShowInviteSheet(true)}
            className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-[14px] font-medium hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Invite Members
          </button>
        </div>
      )}

      {/* TODAY IN CIRCLE MODAL - iOS STYLE */}
      {showTodayModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
            onClick={() => setShowTodayModal(false)}
          />
          <div className="fixed inset-0 flex items-end z-[9999] pointer-events-none">
            <div
              className="w-full bg-white rounded-t-[28px] pointer-events-auto max-h-[85vh] overflow-y-auto"
              style={{
                boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 bg-slate-300 rounded-full" />
              </div>
              
              <div className="px-5 pb-2">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[18px] font-semibold text-slate-900">
                    Today in {circleName}
                  </h2>
                  <button
                    onClick={() => setShowTodayModal(false)}
                    className="p-2 -mr-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <span className="text-[14px] text-slate-500">
                    Checked in today
                  </span>
                  <span className="text-[14px] font-semibold text-slate-900">
                    {postedCount} of {totalCount}
                  </span>
                </div>

                {/* Members List */}
                <div className="space-y-3 pb-6">
                  {circleMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        handleOpenMemberDetail(member);
                        setShowTodayModal(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-[14px] hover:bg-slate-50 transition-colors active:bg-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold ${
                          member.posted
                            ? "bg-gradient-to-br from-purple-400 to-blue-400 border-2 border-purple-600"
                            : "bg-gradient-to-br from-purple-400 to-blue-400 border-2 border-slate-300"
                        }`}>
                          {member.initial}
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] font-medium text-slate-800">{member.name}</p>
                          <p className="text-[12px] text-slate-500">
                            {member.posted ? `posted ${member.lastPostTime}` : "not posted"}
                          </p>
                        </div>
                        {member.posted && (
                          <span className="text-[13px] text-green-600 font-medium">✅</span>
                        )}
                        {!member.posted && (
                          <span className="text-[13px] text-slate-400">⏳</span>
                        )}
                      </div>
                    </button>
                  ))}

                  {/* You */}
                  <div className="px-4 py-3 rounded-[14px] bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold bg-slate-800 border-2 ${
                        userPosted ? "border-purple-600" : "border-slate-300"
                      }`}>
                        You
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-medium text-slate-800">You</p>
                        <p className="text-[12px] text-slate-500">
                          {userPosted ? "posted just now" : "your turn"}
                        </p>
                      </div>
                      {userPosted && (
                        <span className="text-[13px] text-green-600 font-medium">✅</span>
                      )}
                      {!userPosted && (
                        <span className="text-[13px] text-purple-600 font-semibold">→</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="px-5 pb-8 pt-4 space-y-2.5">
                <button
                  onClick={() => {
                    setShowTodayModal(false);
                    handleShareToday();
                  }}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  Share Today
                </button>
                <button
                  onClick={() => {
                    setShowTodayModal(false);
                    setShowAssignModal(true);
                  }}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-100 text-slate-700 text-[15px] font-semibold hover:bg-slate-200 transition-all active:scale-[0.98]"
                >
                  Assign Mission
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MEMBER DETAIL MODAL - iOS STYLE */}
      {showMemberDetailModal && selectedMember && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setShowMemberDetailModal(false)}
          />
          <div className="fixed inset-0 flex items-end z-50 pointer-events-none">
            <div
              className="w-full bg-white rounded-t-[28px] pointer-events-auto max-h-[65vh] overflow-y-auto"
              style={{
                boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 bg-slate-300 rounded-full" />
              </div>
              
              <div className="px-5 pb-6">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-[14px] font-semibold">
                      {selectedMember.initial}
                    </div>
                    <div>
                      <p className="text-[17px] font-semibold text-slate-900">{selectedMember.name}</p>
                      <p className="text-[13px] text-slate-500">
                        Last check-in {selectedMember.lastPostTime}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMemberDetailModal(false)}
                    className="p-2 -mr-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

              {/* Latest Post Preview */}
              {selectedMember.lastPostPreview && (
                <div className="bg-slate-50 rounded-2xl p-4 mb-5">
                  <p className="text-[12px] text-slate-500 mb-2">Latest check-in</p>
                  <div className="text-[20px] font-bold text-slate-900 mb-2">
                    {selectedMember.lastPostPreview.missions}/5 Missions
                  </div>
                  <div className="flex gap-2">
                    {selectedMember.lastPostPreview.wallet && (
                      <div className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-medium">
                        {selectedMember.lastPostPreview.wallet}
                      </div>
                    )}
                    {selectedMember.lastPostPreview.streak && (
                      <div className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-[11px] font-medium flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {selectedMember.lastPostPreview.streak}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button className="w-full px-4 py-3.5 rounded-2xl bg-slate-100 text-slate-700 text-[15px] font-semibold hover:bg-slate-200 transition-all active:scale-[0.98]">
                  View Last Post
                </button>
                <button
                  onClick={() => {
                    setShowMemberDetailModal(false);
                    setShowAssignModal(true);
                    setAssignTo(selectedMember.name);
                    setAssignToId(selectedMember.id);
                  }}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  Assign Mission
                </button>
              </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Members Modal - iOS STYLE */}
      {showMembersModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
            onClick={() => setShowMembersModal(false)}
          />
          <div className="fixed inset-0 flex items-end z-[9999] pointer-events-none">
            <div
              className="w-full bg-white rounded-t-[28px] pointer-events-auto max-h-[80vh] overflow-y-auto"
              style={{
                boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 bg-slate-300 rounded-full" />
              </div>
              
              <div className="px-5 pb-6">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-[18px] font-semibold text-slate-900">
                    Members
                  </h2>
                  <button
                    onClick={() => setShowMembersModal(false)}
                    className="p-2 -mr-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

              <div className="space-y-2">
                {circleMembers.map((member) => (
                  <div
                    key={member.initial}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-[13px] font-semibold">
                        {member.initial}
                      </div>
                      <p className="text-[15px] font-medium text-slate-900">
                        {member.name}
                      </p>
                    </div>
                    {member.posted && (
                      <span className="text-[12px] font-medium text-emerald-600">
                        ✓ Posted
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 p-4 rounded-2xl bg-purple-50">
                <p className="text-[13px] font-medium text-slate-700">
                  Circle Privacy
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Metrics only · No messages
                </p>
              </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ✅ ASSIGN MISSION BOTTOM SHEET - iOS STYLE */}
      {showAssignModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-[9999] backdrop-blur-sm"
            onClick={() => {
              setShowAssignModal(false);
              onModalStateChange?.(false);
            }}
          />

          {/* Bottom Sheet Wrapper */}
          <div className="fixed inset-0 flex items-end justify-center z-[10000] pointer-events-none">
            {/* Sheet Container */}
            <div
              className="w-full max-w-[390px] bg-white rounded-t-[28px] pointer-events-auto max-h-[85vh] overflow-y-auto flex flex-col"
              style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-9 h-1 bg-slate-300 rounded-full" />
              </div>
              
              {/* ===== HEADER ===== */}
              <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
                <h2 className="text-[18px] font-semibold text-slate-900">Assign Mission</h2>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    onModalStateChange?.(false);
                  }}
                  className="p-2 -mr-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {/* ===== SCROLLABLE CONTENT ===== */}
              <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-0">

                {/* ===== MISSION (REQUIRED) ===== */}
                <div className="mb-5">
                  <label className="text-[13px] font-medium text-slate-500 block mb-2">
                    Mission
                  </label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="e.g. Take bins out"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 outline-none text-slate-900 placeholder:text-slate-400 text-[15px] font-medium"
                  />
                </div>

                {/* ===== ASSIGN TO (REQUIRED) ===== */}
                <div className="mb-5">
                  <label className="text-[13px] font-medium text-slate-500 block mb-2">
                    Assign to
                  </label>
                  <button
                    onClick={() => setShowMemberPicker(true)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 text-[15px] font-medium flex items-center justify-between gap-3 active:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {assignedMember ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {assignedMember.initial}
                          </div>
                          <span className="text-slate-900">{assignedMember.name}</span>
                        </>
                      ) : (
                        <span className="text-slate-400">Select member</span>
                      )}
                    </div>
                    <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
                  </button>
                </div>

                {/* ===== D) SCHEDULE (OPTIONAL) ===== */}
                <div className="mb-6 pb-6 border-b border-slate-200/60">
                  <label className="text-[14px] font-semibold text-slate-700 block mb-3">Schedule</label>

                  {/* D1) Segmented Control - True iOS Style */}
                  <div className="inline-flex gap-0 bg-slate-100 rounded-[12px] p-1 mb-4 w-full">
                    {[
                      { id: "today", label: "Today" },
                      { id: "tomorrow", label: "Tomorrow" },
                      { id: "pickDate", label: "Pick date" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setDueDay(option.id as "today" | "tomorrow" | "custom")}
                        className={`flex-1 px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${
                          (dueDay === "today" && option.id === "today") ||
                          (dueDay === "tomorrow" && option.id === "tomorrow") ||
                          (dueDay === "custom" && option.id === "pickDate")
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Date Picker (shown if Pick date selected) */}
                  {dueDay === "custom" && (
                    <input
                      type="date"
                      value={customDueDate}
                      onChange={(e) => setCustomDueDate(e.target.value)}
                      className="w-full px-4 py-3 h-12 rounded-[16px] bg-slate-50 border border-slate-200 outline-none text-slate-800 text-sm font-medium mb-3"
                    />
                  )}

                  {/* D2) Time Row - Clickable */}
                  <label className="block mb-2">
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full px-4 py-3 h-12 rounded-[16px] bg-slate-50 border border-slate-200 outline-none text-slate-800 text-base font-semibold cursor-pointer appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        paddingRight: '3rem',
                      }}
                    />
                  </label>

                  {/* Helper Text */}
                  <p className="text-[13px] text-slate-600">
                    Due: {dueDay === "today" ? "Today" : dueDay === "tomorrow" ? "Tomorrow" : customDueDate ? new Date(customDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}{" "}
                    at{" "}
                    {dueTime
                      ? (() => {
                          const [h, m] = dueTime.split(":");
                          const hour = parseInt(h);
                          const am = hour < 12;
                          const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          return `${display}:${m} ${am ? "AM" : "PM"}`;
                        })()
                      : "—"}
                  </p>
                </div>

                {/* ===== REPEAT TOGGLE ===== */}
                <div className="flex items-center justify-between py-4 border-t border-slate-100">
                  <span className="text-[15px] font-medium text-slate-900">Repeat</span>
                  <button
                    onClick={() => setRepeatEnabled(!repeatEnabled)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      repeatEnabled ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                        repeatEnabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* E - Expanded Repeat Options */}
                {repeatEnabled && (
                  <div className="mb-6 pb-6 space-y-4 border-b border-slate-200/60">
                    {/* Frequency */}
                    <div>
                      <label className="text-[12px] font-semibold text-slate-600 block mb-2">Frequency</label>
                      <div className="flex gap-2">
                        {["daily", "weekly", "monthly"].map((freq) => (
                          <button
                            key={freq}
                            onClick={() => setRepeatFrequency(freq as "daily" | "weekly" | "monthly")}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                              repeatFrequency === freq
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {freq === "daily" ? "Daily" : freq === "weekly" ? "Weekly" : "Monthly"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Repeat End Rule */}
                    <div>
                      <label className="text-[12px] font-semibold text-slate-600 block mb-2">Repeat ends</label>
                      <div className="flex gap-1.5 mb-3">
                        {["forever", "untilDate", "count"].map((type) => (
                          <button
                            key={type}
                            onClick={() => setRepeatEndType(type as "forever" | "untilDate" | "count")}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              repeatEndType === type
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {type === "forever" ? "Forever" : type === "untilDate" ? "Until" : "X times"}
                          </button>
                        ))}
                      </div>

                      {repeatEndType === "untilDate" && (
                        <input
                          type="date"
                          value={repeatEndDate}
                          onChange={(e) => setRepeatEndDate(e.target.value)}
                          className="w-full px-4 py-2.5 h-11 rounded-lg bg-slate-100 border border-slate-200 outline-none text-slate-800 text-sm font-medium"
                        />
                      )}

                      {repeatEndType === "count" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRepeatEndCount(Math.max(1, repeatEndCount - 1))}
                            className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-200"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={repeatEndCount}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setRepeatEndCount(Math.min(365, Math.max(1, val)));
                            }}
                            min="1"
                            max="365"
                            className="flex-1 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 outline-none text-slate-800 text-sm font-medium text-center"
                          />
                          <button
                            onClick={() => setRepeatEndCount(Math.min(365, repeatEndCount + 1))}
                            className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== REQUIRE PROOF TOGGLE ===== */}
                <div className="flex items-center justify-between py-4 border-t border-slate-100">
                  <div>
                    <span className="text-[15px] font-medium text-slate-900 block">Require proof</span>
                    <span className="text-[12px] text-slate-500">Photo required to complete</span>
                  </div>
                  <button
                    onClick={() => setRequireProof(!requireProof)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                      requireProof ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                        requireProof ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* ===== SEND NUDGE TOGGLE ===== */}
                <div className="flex items-center justify-between py-4 border-t border-slate-100 mb-4">
                  <div>
                    <span className="text-[15px] font-medium text-slate-900 block">Send nudge now</span>
                    <span className="text-[12px] text-slate-500">Notify immediately</span>
                  </div>
                  <button
                    onClick={() => setNudgeTiming(nudgeTiming === "now" ? "at-due-time" : "now")}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                      nudgeTiming === "now" ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                        nudgeTiming === "now" ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

              </div>

              {/* ===== BOTTOM BUTTONS ===== */}
              <div className="flex gap-3 px-5 py-5 border-t border-slate-100 bg-white flex-shrink-0">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    onModalStateChange?.(false);
                  }}
                  className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignMission}
                  disabled={!assignmentTitle.trim() || !assignedMember}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  Assign
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ✅ MEMBER PICKER SHEET - Separate overlay */}
      {showMemberPicker && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[10001] backdrop-blur-sm"
            onClick={() => setShowMemberPicker(false)}
          />
          <div className="fixed inset-0 flex items-end justify-center z-[10002] pointer-events-none">
            <div
              className="w-full max-w-[390px] bg-white rounded-t-[28px] pointer-events-auto max-h-[70vh] overflow-y-auto"
              style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-center px-5 pt-4 pb-4 border-b border-slate-200/60 sticky top-0 bg-white">
                <h3 className="text-[18px] font-semibold text-slate-900">Choose member</h3>
                <button
                  onClick={() => setShowMemberPicker(false)}
                  className="absolute right-5 p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>

              {/* Members Grid - Large Avatar Chips */}
              <div className="px-5 py-6">
                {circleMembers && circleMembers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {circleMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          setAssignedMember(member);
                          setAssignTo(member.name);
                          setAssignToId(member.id);
                          setShowMemberPicker(false);
                        }}
                        className={`flex flex-col items-center gap-3 p-4 rounded-[20px] transition-all ${
                          assignedMember?.id === member.id
                            ? "bg-slate-100 border-2.5 border-purple-600"
                            : "bg-slate-50 border-2 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {member.initial}
                          </div>
                          {assignedMember?.id === member.id && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                              <CheckCircle size={16} className="text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-slate-800 text-center line-clamp-2">{member.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-600">
                    <p className="text-sm">No members available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Share Post Modal */}
      {showShareModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
            onClick={() => {
              setShowShareModal(false);
              onModalStateChange?.(false);
            }}
          />
          <div className="fixed inset-0 flex items-end z-[9999] pointer-events-none">
            <div
              className="w-full bg-white rounded-t-[32px] p-6 pointer-events-auto max-h-[80vh] overflow-y-auto"
              style={{
                boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
              }}
            >
              <h2 className="text-[20px] font-semibold text-slate-800 mb-2">
                Share Your Day
              </h2>
              <p className="text-[14px] text-slate-500 mb-4">
                Choose what you'd like to share with your circle
              </p>

              {/* Daily Life Card Quick Access */}
              <button
                onClick={() => {
                  setShowShareModal(false);
                  onModalStateChange?.(false);
                  onNavigate?.('daily-life-card');
                }}
                className="w-full mb-5 p-4 rounded-2xl text-left active:scale-[0.98] transition-transform"
                style={{ background: 'linear-gradient(145deg, var(--dark-card-start) 0%, var(--dark-card-middle) 50%, var(--dark-card-end) 100%)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-[15px]">Create Daily Life Card</p>
                    <p className="text-white/60 text-[12px]">Beautiful shareable card with your stats</p>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    +50 XP
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-[1px] bg-slate-200" />
                <span className="text-[12px] text-slate-400 font-medium">or quick share</span>
                <div className="flex-1 h-[1px] bg-slate-200" />
              </div>

              {/* Share Options - Toggle Cards */}
              <div className="space-y-3 mb-6">
              </div>

              {/* Note */}
              <div className="mb-6">
                <label className="text-[13px] font-semibold text-slate-700 block mb-2">
                  Add a note (optional)
                </label>
                <textarea
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  placeholder="Share your win or daily insight..."
                  className="w-full px-4 py-3 rounded-[12px] bg-slate-100 border border-slate-300 outline-none text-slate-800 placeholder:text-slate-500 text-[14px] resize-none h-20"
                />
              </div>

              {/* Privacy Settings */}
              <div className="mb-6">
                <label className="text-[13px] font-semibold text-slate-700 block mb-3">
                  Privacy Level
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-[12px] bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="radio"
                      name="privacy"
                      value="metrics"
                      checked={privacyLevel === "metrics"}
                      onChange={(e) => setPrivacyLevel(e.target.value)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="text-[14px] font-medium text-slate-800">
                        Metrics Only
                      </p>
                      <p className="text-[12px] text-slate-500">
                        No personal notes
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-[12px] bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="radio"
                      name="privacy"
                      value="full"
                      checked={privacyLevel === "full"}
                      onChange={(e) => setPrivacyLevel(e.target.value)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="text-[14px] font-medium text-slate-800">
                        Full Share
                      </p>
                      <p className="text-[12px] text-slate-500">
                        Include your note
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                  setShowShareModal(false);
                  onModalStateChange?.(false);
                }}
                  className="flex-1 px-4 py-3 rounded-full text-[14px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmShare}
                  className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[14px] font-semibold hover:opacity-90 transition-all active:scale-95"
                >
                  Share to Circle
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Submit Proof Modal - for assignee */}
      {showSubmitProofModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
            onClick={() => setShowSubmitProofModal(false)}
          />
          <div className="fixed inset-0 flex items-end z-[9999] pointer-events-none">
            <div
              className="w-full bg-white rounded-t-3xl pointer-events-auto max-h-[85vh] overflow-y-auto"
              style={{
                boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-900">Submit Proof</h2>
                <button
                  onClick={() => setShowSubmitProofModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="px-5 py-6 space-y-5">
                {/* Assignment Info */}
                {selectedAssignmentForProof && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Mission
                    </p>
                    <p className="text-base font-semibold text-slate-900">{selectedAssignmentForProof.title}</p>
                  </div>
                )}

                {/* Upload Section */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-3">
                    Photo Proof <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProofImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProofPreviewUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="proof-file-input"
                  />
                  <label
                    htmlFor="proof-file-input"
                    className="flex items-center justify-center px-4 py-8 rounded-2xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors bg-slate-50"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📷</div>
                      <p className="text-sm font-medium text-slate-700">
                        {proofPreviewUrl ? "Change photo" : "Upload or take photo"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">JPG, PNG up to 10MB</p>
                    </div>
                  </label>
                </div>

                {/* Photo Preview */}
                {proofPreviewUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Preview</p>
                    <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={proofPreviewUrl}
                        alt="Proof preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowSubmitProofModal(false);
                      setProofImageFile(null);
                      setProofPreviewUrl(null);
                    }}
                    className="flex-1 px-4 py-3 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedAssignmentForProof || !proofImageFile) return;
                      
                      // Update assignment with proof
                      const updatedAssignments = allAssignments.map(a =>
                        a.id === selectedAssignmentForProof.id
                          ? {
                              ...a,
                              status: "completed" as const,
                              proofStatus: "submitted" as const,
                              proofImageUri: proofPreviewUrl || "",
                              proofSubmittedAt: new Date().toISOString(),
                            }
                          : a
                      );
                      setAllAssignments(updatedAssignments);

                      // Add system card for proof submission
                      const proofSubmittedCard: Post = {
                        id: Math.max(...posts.map(p => p.id), 0) + 1,
                        type: "system",
                        systemType: "completed",
                        systemText: `${selectedAssignmentForProof.assignedTo} completed: ${selectedAssignmentForProof.title} (Proof submitted)`,
                        icon: "check",
                        time: "Just now",
                      };
                      setPosts([proofSubmittedCard, ...posts]);

                      setShowSubmitProofModal(false);
                      setProofImageFile(null);
                      setProofPreviewUrl(null);
                      setSelectedAssignmentForProof(null);
                    }}
                    disabled={!proofImageFile}
                    className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Submit Proof
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Proof Modal - for assigner */}
      {showViewProofModal && selectedAssignmentForProof?.proofImageUri && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
            onClick={() => setShowViewProofModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
            <div
              className="bg-white rounded-3xl pointer-events-auto max-h-[85vh] max-w-md w-full overflow-y-auto"
              style={{
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Proof Submitted</h2>
                <button
                  onClick={() => setShowViewProofModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="px-5 py-6 space-y-5">
                {/* Mission Info */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Mission
                  </p>
                  <p className="text-base font-semibold text-slate-900">{selectedAssignmentForProof.title}</p>
                  <p className="text-sm text-slate-600 mt-2">
                    Completed by {selectedAssignmentForProof.assignedTo}
                  </p>
                </div>

                {/* Photo Proof */}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Photo Proof</p>
                  <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={selectedAssignmentForProof.proofImageUri}
                      alt="Mission proof"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  {selectedAssignmentForProof.proofSubmittedAt && (
                    <p className="text-xs text-slate-500 mt-3">
                      Submitted {new Date(selectedAssignmentForProof.proofSubmittedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Verify Button (optional) */}
                <button className="w-full px-4 py-3 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-200">
                  Mark as Verified
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invite Members Bottom Sheet */}
      {showInviteSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setShowInviteSheet(false)}
          />
          <div className="fixed inset-0 flex items-end z-50 pointer-events-none">
            <div
              className="w-full bg-white rounded-t-[32px] p-6 pointer-events-auto max-h-[80vh] overflow-y-auto"
              style={{
                boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-slate-800">
                  Invite to {circleName}
                </h2>
                <button
                  onClick={() => setShowInviteSheet(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              {/* Invite Link Section */}
              <div className="mb-8">
                <p className="text-[13px] font-medium text-slate-600 mb-3">Invite link</p>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 px-4 py-3 rounded-[14px] bg-slate-50 border border-slate-200">
                    <p className="text-[14px] text-slate-700 font-medium truncate">
                      mypa.app/invite/7K2P…
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleShareLink}
                    className="flex-1 px-4 py-3 rounded-full bg-slate-100 text-slate-700 text-[14px] font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share link
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 px-4 py-3 rounded-full bg-slate-100 text-slate-700 text-[14px] font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    {copySuccess === 'link' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 mb-8" />

              {/* Invite Code Section */}
              <div className="mb-8">
                <p className="text-[13px] font-medium text-slate-600 mb-3">Invite code</p>
                
                <div className="flex items-center justify-center px-4 py-5 rounded-[20px] bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 mb-4">
                  <p className="text-[32px] font-bold text-slate-800 tracking-widest">
                    {inviteCode}
                  </p>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="w-full px-4 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[14px] font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                  {copySuccess === 'code' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy code
                    </>
                  )}
                </button>
              </div>

              {/* Helper Text */}
              <p className="text-center text-[13px] text-slate-500">
                Anyone with this link or code can join this circle.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Circle Settings Bottom Sheet */}
      {showCircleSettings && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
            onClick={() => setShowCircleSettings(false)}
          />
          <div className="fixed inset-0 flex items-end justify-center z-[9999] pointer-events-none">
            <div className="w-full max-w-[390px] bg-white rounded-t-[28px] px-5 pt-4 pb-6 pointer-events-auto max-h-[85vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-200">
                <div className="flex-1">
                  <h2 className="text-[18px] font-semibold text-slate-800">Circle Settings</h2>
                  <p className="text-[13px] text-slate-500 mt-1">{circleName}</p>
                </div>
                <button
                  onClick={() => setShowCircleSettings(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SECTION A: Circle Overview */}
              <div className="mb-4 bg-slate-50 border border-slate-200/60 rounded-[20px] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[15px] font-semibold text-slate-800">{circleName}</p>
                    <p className="text-[13px] text-slate-500 mt-1">{circleMembers.length + 1} members</p>
                    <p className="text-[13px] text-slate-500">Admin: Alex</p>
                  </div>
                  <div className="bg-blue-100 px-2 py-1 rounded-full">
                    <p className="text-[11px] font-medium text-blue-700">Invite link enabled</p>
                  </div>
                </div>
              </div>

              {/* SECTION B: Members & Roles */}
              <div className="mb-4">
                <p className="text-[13px] font-semibold text-slate-600 px-1 mb-3">Members & Roles</p>
                <div className="bg-slate-50 border border-slate-200/60 rounded-[20px] overflow-hidden">
                  {circleMembers.map((member, index) => (
                    <div key={member.id}>
                      <div className="px-4 py-3 flex items-center justify-between min-h-[48px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-[12px] font-semibold">
                            {member.initial}
                          </div>
                          <p className="text-[15px] font-medium text-slate-800">{member.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[12px] font-semibold px-2 py-1 rounded-full ${
                            member.role === "admin"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-200 text-slate-700"
                          }`}>
                            {member.role === "admin" ? "Admin" : "Member"}
                          </span>
                          {isCurrentUserAdmin && member.role !== "admin" && (
                            <button
                              onClick={() => {
                                setSelectedMemberForManage(member);
                                setShowMemberActionSheet(true);
                              }}
                              className="text-slate-400 hover:text-slate-600 p-1"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {index < circleMembers.length - 1 && (
                        <div className="h-px bg-slate-200/50" />
                      )}
                    </div>
                  ))}
                </div>
                {!isCurrentUserAdmin && (
                  <p className="text-[12px] text-slate-500 mt-2">Only admins can manage roles.</p>
                )}
              </div>

              {/* SECTION C: Invite Members */}
              <div className="mb-4">
                <p className="text-[13px] font-semibold text-slate-600 px-1 mb-3">Invite Members</p>
                <div className="bg-slate-50 border border-slate-200/60 rounded-[20px] overflow-hidden">
                  {/* Row 1: Invite Button */}
                  <button
                    onClick={() => {
                      setShowInviteSheet(true);
                      setShowCircleSettings(false);
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] hover:bg-slate-100 transition-colors"
                  >
                    <p className="text-[15px] font-medium text-slate-800">Invite members</p>
                    <ChevronDown className="w-4 h-4 text-slate-400 transform rotate-[-90deg]" />
                  </button>
                  <div className="h-px bg-slate-200/50" />
                  
                  {/* Row 2: Toggle Invite Link */}
                  <div className="px-4 py-3 flex items-center justify-between min-h-[48px]">
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-slate-800">Invite link enabled</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">Allow members to join using link/code</p>
                    </div>
                    <button
                      onClick={() => setInviteLinkEnabled(!inviteLinkEnabled)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        inviteLinkEnabled ? "bg-green-500" : "bg-slate-300"
                      } flex items-center p-0.5`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          inviteLinkEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="h-px bg-slate-200/50" />

                  {/* Row 3: Toggle Approve New Members */}
                  <div className="px-4 py-3 flex items-center justify-between min-h-[48px]">
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-slate-800">Approve new members</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">New joiners require admin approval</p>
                    </div>
                    <button
                      onClick={() => setApproveNewMembers(!approveNewMembers)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        approveNewMembers ? "bg-green-500" : "bg-slate-300"
                      } flex items-center p-0.5`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          approveNewMembers ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION D: Assignments */}
              <div className="mb-4">
                <p className="text-[13px] font-semibold text-slate-600 px-1 mb-3">Assignments</p>
                <div className="bg-slate-50 border border-slate-200/60 rounded-[20px] overflow-hidden">
                  {/* Row 1: Allow Assignments */}
                  <div className="px-4 py-3 flex items-center justify-between min-h-[48px]">
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-slate-800">Allow assignments</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">Members can assign missions to each other</p>
                    </div>
                    <button
                      onClick={() => setAllowAssignments(!allowAssignments)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        allowAssignments ? "bg-green-500" : "bg-slate-300"
                      } flex items-center p-0.5`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          allowAssignments ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="h-px bg-slate-200/50" />

                  {/* Row 2: Require Accept */}
                  <div className="px-4 py-3 flex items-center justify-between min-h-[48px]">
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-slate-800">Require accept before adding</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">Assignments go to Inbox first</p>
                    </div>
                    <button
                      onClick={() => setRequireAcceptBeforeAdding(!requireAcceptBeforeAdding)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        requireAcceptBeforeAdding ? "bg-green-500" : "bg-slate-300"
                      } flex items-center p-0.5`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          requireAcceptBeforeAdding ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="h-px bg-slate-200/50" />

                  {/* Row 3: Default Proof */}
                  <div className="px-4 py-3 flex items-center justify-between min-h-[48px]">
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-slate-800">Default proof required</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">New assignments require photo proof</p>
                    </div>
                    <button
                      onClick={() => setDefaultProofRequired(!defaultProofRequired)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        defaultProofRequired ? "bg-green-500" : "bg-slate-300"
                      } flex items-center p-0.5`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          defaultProofRequired ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="h-px bg-slate-200/50" />

                  {/* Row 4: Quiet Hours */}
                  <div className="px-4 py-4">
                    <p className="text-[15px] font-medium text-slate-800 mb-3">Quiet hours</p>
                    <p className="text-[13px] text-slate-500 mb-3">No nudges during this time</p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[12px] text-slate-600 mb-1 block">Start</label>
                        <input
                          type="time"
                          value={quietHoursStart}
                          onChange={(e) => setQuietHoursStart(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-[14px] font-medium"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[12px] text-slate-600 mb-1 block">End</label>
                        <input
                          type="time"
                          value={quietHoursEnd}
                          onChange={(e) => setQuietHoursEnd(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-[14px] font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION E: Privacy */}
              <div className="mb-4">
                <p className="text-[13px] font-semibold text-slate-600 px-1 mb-3">Privacy</p>
                <div className="bg-slate-50 border border-slate-200/60 rounded-[20px] p-4">
                  <div className="flex gap-2 mb-3">
                    {[
                      { id: "metrics", label: "Metrics only" },
                      { id: "circle", label: "Circle only" }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setCirclePrivacy(option.id as "metrics" | "circle")}
                        className={`flex-1 px-3 py-2 rounded-full text-[13px] font-medium transition-all ${
                          circlePrivacy === option.id
                            ? "bg-primary text-white"
                            : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[12px] text-slate-500">
                    {circlePrivacy === "metrics"
                      ? "Share stats without details."
                      : "Share full posts inside this circle."}
                  </p>
                </div>
              </div>

              {/* SECTION F: Notifications */}
              <div className="mb-4">
                <p className="text-[13px] font-semibold text-slate-600 px-1 mb-3">Notifications</p>
                <div className="bg-slate-50 border border-slate-200/60 rounded-[20px] overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between min-h-[48px]">
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-slate-800">Mute this circle</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">Stop notifications from this circle</p>
                    </div>
                    <button
                      onClick={() => setMuteCircle(!muteCircle)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        muteCircle ? "bg-green-500" : "bg-slate-300"
                      } flex items-center p-0.5`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          muteCircle ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION G: Danger Zone */}
              <div className="bg-red-50 border border-red-200/50 rounded-[20px] p-4">
                <button className="w-full text-left py-2">
                  <p className="text-[15px] font-semibold text-red-600">Leave Circle</p>
                  <p className="text-[12px] text-red-500 mt-1">You cannot undo this action</p>
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* Member Action Sheet */}
      {showMemberActionSheet && selectedMemberForManage && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[10000] backdrop-blur-sm"
            onClick={() => {
              setShowMemberActionSheet(false);
              setSelectedMemberForManage(null);
            }}
          />
          <div className="fixed inset-0 flex items-end justify-center z-[10001] pointer-events-none">
            <div className="w-full max-w-[390px] bg-white rounded-t-[20px] px-5 py-4 pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-semibold text-slate-800">Manage {selectedMemberForManage.name}</h3>
                <button
                  onClick={() => {
                    setShowMemberActionSheet(false);
                    setSelectedMemberForManage(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handlePromoteToAdmin(selectedMemberForManage.id)}
                  className="w-full px-4 py-3 rounded-lg bg-blue-50 text-blue-700 text-[14px] font-medium hover:bg-blue-100 transition-colors"
                >
                  Promote to Admin
                </button>
                <button
                  onClick={() => handleRemoveFromCircle(selectedMemberForManage.id)}
                  className="w-full px-4 py-3 rounded-lg bg-red-50 text-red-700 text-[14px] font-medium hover:bg-red-100 transition-colors"
                >
                  Remove from Circle
                </button>
                <button
                  onClick={() => {
                    setShowMemberActionSheet(false);
                    setSelectedMemberForManage(null);
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-slate-100 text-slate-700 text-[14px] font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reply to Message Modal */}
      {replyingTo && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
            onClick={() => setReplyingTo(null)}
          />
          <div className="fixed inset-0 flex items-end z-[9999] pointer-events-none">
            <div
              className="w-full bg-white rounded-t-[28px] pointer-events-auto"
              style={{
                boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 bg-slate-300 rounded-full" />
              </div>
              
              <div className="px-5 pb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[18px] font-semibold text-slate-900">
                    Reply to {replyingTo.name}
                  </h2>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-2 -mr-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Original Message */}
                {replyingTo.message && (
                  <div className="bg-slate-50 rounded-xl p-3 mb-4 border-l-4 border-blue-400">
                    <p className="text-[12px] text-slate-500 mb-1">Original message:</p>
                    <p className="text-[14px] text-slate-700">{replyingTo.message}</p>
                  </div>
                )}

                {/* Reply Input */}
                <div className="mb-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full p-4 rounded-xl border border-slate-200 text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    autoFocus
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className={`w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all ${
                    replyText.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Send Reply
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
