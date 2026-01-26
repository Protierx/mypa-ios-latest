import {
  ArrowLeft,
  Trash2,
  CheckCircle,
  MessageSquare,
  Bell,
  Users,
  Heart,
  Clock,
  X,
  ChevronRight,
  Sparkles,
  Inbox,
  Zap,
  Reply,
  AlarmClock,
  CheckCheck,
  UserPlus,
  Eye,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState, useEffect } from "react";

interface InboxScreenProps {
  onNavigate?: (screen: string) => void;
}

interface Assignment {
  id: number;
  title: string;
  assignedByName: string;
  dueTime?: string;
  dueDate?: string;
  status: "pending" | "accepted" | "completed" | "declined";
  category?: string;
}

type TabType = "all" | "messages" | "reminders" | "invites";

interface NotificationItem {
  id: number;
  title: string;
  subtitle?: string;
  type: "message" | "reminder" | "invite" | "social";
  time: string;
  isNew?: boolean;
  circleName?: string;
  senderName?: string;
}

export function InboxScreen({ onNavigate }: InboxScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [actionFeedback, setActionFeedback] = useState<{ id: number; message: string; type: 'success' | 'info' } | null>(null);
  
  // Assignments assigned to you
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: 1,
      title: "Review Q1 metrics",
      assignedByName: "Alex",
      dueTime: "2:00 PM",
      dueDate: "Today",
      status: "pending",
      category: "Work",
    },
    {
      id: 2,
      title: "Grocery run",
      assignedByName: "Blake",
      dueTime: "6:00 PM",
      dueDate: "Today",
      status: "pending",
      category: "Errands",
    },
  ]);

  const [items, setItems] = useState<NotificationItem[]>([
    {
      id: 1,
      title: "Alice sent you a message",
      subtitle: "Can we reschedule our call to Thursday?",
      type: "message",
      time: "10m ago",
      isNew: true,
      senderName: "Alice",
      circleName: "Family",
    },
    {
      id: 2,
      title: "Reminder: Take medication",
      subtitle: "Daily 8:00 AM",
      type: "reminder",
      time: "1h ago",
    },
    {
      id: 3,
      title: "Circle invite from Dev Team",
      subtitle: "Join the Q1 planning circle",
      type: "invite",
      time: "2h ago",
      isNew: true,
      circleName: "Dev Team",
    },
  ]);

  const [menuId, setMenuId] = useState<number | null>(null);
  const [snoozedItems, setSnoozedItems] = useState<Set<number>>(new Set());

  // Show feedback message briefly
  const showFeedback = (id: number, message: string, type: 'success' | 'info' = 'success') => {
    setActionFeedback({ id, message, type });
    setTimeout(() => setActionFeedback(null), 2000);
  };

  const filtered = items.filter((it) =>
    activeTab === "all"
      ? true
      : activeTab === "messages"
      ? it.type === "message"
      : activeTab === "reminders"
      ? it.type === "reminder"
      : activeTab === "invites"
      ? it.type === "invite"
      : true
  );

  const markRead = (id: number) => {
    setItems(items.map((it) => (it.id === id ? { ...it, isNew: false } : it)));
    setMenuId(null);
  };

  const remove = (id: number) => {
    setItems(items.filter((it) => it.id !== id));
    setMenuId(null);
  };

  const snoozeItem = (id: number) => {
    setSnoozedItems(prev => new Set(prev).add(id));
    showFeedback(id, "Snoozed for 1 hour", 'info');
    // Remove from view after snooze feedback
    setTimeout(() => {
      setItems(items.filter((it) => it.id !== id));
      setSnoozedItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1500);
  };

  // Accept circle invite - removes from inbox and navigates to circles
  const acceptInvite = (id: number) => {
    const invite = items.find(it => it.id === id);
    const circleName = invite?.circleName || 'circle';
    
    // Store the pending circle join action for CirclesScreen to pick up
    try {
      const pendingCircleAction = {
        action: 'join',
        circleName: circleName,
        timestamp: Date.now(),
      };
      localStorage.setItem('pendingCircleAction', JSON.stringify(pendingCircleAction));
    } catch (e) {
      console.error('Error storing circle action', e);
    }
    
    showFeedback(id, `Joining ${circleName}...`, 'success');
    setTimeout(() => {
      remove(id);
      onNavigate?.("circles");
    }, 1000);
  };

  // Decline circle invite - removes from inbox
  const declineInvite = (id: number) => {
    showFeedback(id, "Invite declined", 'info');
    setTimeout(() => remove(id), 800);
  };

  // Handle message reply - mark as read and navigate to conversation
  const handleMessageReply = (id: number) => {
    const message = items.find(it => it.id === id);
    markRead(id);
    
    // Store the pending message action for CircleHomeScreen to pick up
    try {
      const pendingMessageAction = {
        action: 'reply',
        senderName: message?.senderName || 'Unknown',
        messagePreview: message?.subtitle || '',
        timestamp: Date.now(),
      };
      localStorage.setItem('pendingMessageAction', JSON.stringify(pendingMessageAction));
    } catch (e) {
      console.error('Error storing message action', e);
    }
    
    // Navigate to circle-home where the conversation happens
    onNavigate?.("circle-home");
  };

  // Handle message archive - remove from inbox
  const handleMessageArchive = (id: number) => {
    showFeedback(id, "Archived", 'info');
    setTimeout(() => remove(id), 600);
  };

  // Handle reminder complete - remove and optionally go to plan
  const handleReminderDone = (id: number) => {
    const reminder = items.find(it => it.id === id);
    
    // Mark the reminder as completed and optionally remove from any linked tasks
    try {
      const completedReminder = {
        action: 'completed',
        title: reminder?.title || 'Reminder',
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem('lastCompletedReminder', JSON.stringify(completedReminder));
    } catch (e) {
      console.error('Error storing reminder completion', e);
    }
    
    showFeedback(id, "Marked complete ✓", 'success');
    setTimeout(() => remove(id), 800);
  };

  // Handle social notification view
  const handleSocialView = (id: number) => {
    markRead(id);
    onNavigate?.("circles");
  };

  // Accept assignment - adds to Plan and removes from inbox
  const acceptAssignment = (id: number) => {
    const assignment = assignments.find(a => a.id === id);
    if (assignment) {
      // Use pendingPlanTasks which PlanScreen already monitors
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const pendingTask = {
          title: assignment.title,
          suggestedTime: assignment.dueTime || '12:00 PM',
          estimatedTime: '30m',
          aiCategory: assignment.category?.toLowerCase() || 'work',
          aiPriority: 'important',
          assignedBy: assignment.assignedByName,
          source: 'inbox-assignment',
        };
        
        // Get existing pending tasks and add this one
        const existingPending = localStorage.getItem('pendingPlanTasks');
        const pendingTasks = existingPending ? JSON.parse(existingPending) : [];
        pendingTasks.push(pendingTask);
        localStorage.setItem('pendingPlanTasks', JSON.stringify(pendingTasks));
        
        // Also store a highlight flag so PlanScreen can highlight the new task
        localStorage.setItem('highlightNewTask', JSON.stringify({
          title: assignment.title,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.error('Error adding task to plan', e);
      }
      
      showFeedback(assignment.id, "Adding to your Plan...", 'success');
      // Update status and auto-remove after feedback
      setAssignments(assignments.map(a => 
        a.id === id ? { ...a, status: 'accepted' as const } : a
      ));
      setTimeout(() => {
        setAssignments(prev => prev.filter(a => a.id !== id));
        onNavigate?.("plan");
      }, 1200);
    }
  };

  // Decline assignment - notifies assigner and removes
  const declineAssignment = (id: number) => {
    const assignment = assignments.find(a => a.id === id);
    showFeedback(id, `Declined - ${assignment?.assignedByName} notified`, 'info');
    setAssignments(assignments.map(a => 
      a.id === id ? { ...a, status: 'declined' as const } : a
    ));
    setTimeout(() => {
      setAssignments(prev => prev.filter(a => a.id !== id));
    }, 1500);
  };

  // Complete assignment - marks done and removes
  const completeAssignment = (id: number) => {
    showFeedback(id, "Completed! Great job 🎉", 'success');
    setAssignments(assignments.map(a => 
      a.id === id ? { ...a, status: 'completed' as const } : a
    ));
    setTimeout(() => {
      setAssignments(prev => prev.filter(a => a.id !== id));
    }, 1500);
  };

  // View assignment in Plan
  const viewAssignmentInPlan = (id: number) => {
    onNavigate?.("plan");
  };

  const iconFor = (type: NotificationItem["type"]) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case "reminder":
        return <Bell className="w-5 h-5 text-amber-600" />;
      case "invite":
        return <Users className="w-5 h-5 text-purple-600" />;
      case "social":
        return <Heart className="w-5 h-5 text-pink-600" />;
    }
  };

  const iconBgFor = (type: NotificationItem["type"]) => {
    switch (type) {
      case "message":
        return "bg-blue-100";
      case "reminder":
        return "bg-amber-100";
      case "invite":
        return "bg-purple-100";
      case "social":
        return "bg-pink-100";
    }
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "accepted":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "completed":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "declined":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getAssignmentStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "completed":
        return "Done";
      case "declined":
        return "Declined";
      default:
        return status;
    }
  };

  const newCount = items.filter(i => i.isNew).length;

  return (
    <div className="min-h-screen bg-ios-bg pb-28 relative overflow-hidden">
      <IOSStatusBar />

      <style>{`
        .ios-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
        }
        .ios-card:active {
          transform: scale(0.98);
          transition: transform 0.15s ease;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in { animation: slideIn 0.3s ease-out forwards; }
        @keyframes gentlePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .gentle-pulse { animation: gentlePulse 3s ease-in-out infinite; }
      `}</style>

      {/* Ambient background glow */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="px-5 pt-2 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.("hub")}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <p className="text-[13px] text-slate-500 font-medium">Messages & Requests</p>
              <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Inbox</h1>
            </div>
          </div>
          {newCount > 0 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-primary px-3 py-1.5 rounded-full shadow-lg shadow-purple-500/30">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="text-[12px] font-bold text-white">{newCount} new</span>
            </div>
          )}
        </div>

        {/* Smart Summary Card - More Personal */}
        <div className="mt-3 mb-4 rounded-[24px] p-5 shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(145deg, var(--dark-card-start) 0%, var(--dark-card-middle) 50%, var(--dark-card-end) 100%)' }}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Inbox className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-[16px] font-semibold mb-1">
                  {items.filter(i => i.isNew).length === 0 ? "All caught up! 🎉" : `${items.filter(i => i.isNew).length} things need your attention`}
                </p>
                <p className="text-white/60 text-[13px] leading-relaxed">
                  {assignments.filter(a => a.status === 'pending').length > 0 
                    ? `You have ${assignments.filter(a => a.status === 'pending').length} tasks waiting for your response` 
                    : "Looking good - your tasks are under control"}
                </p>
              </div>
            </div>
            
            {/* Quick action */}
            {items.filter(i => i.isNew).length > 0 && (
              <button 
                onClick={() => {
                  items.forEach(item => {
                    if (item.isNew) markRead(item.id);
                  });
                }}
                className="mt-4 w-full py-3 rounded-xl bg-white/10 text-white text-[14px] font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["all", "messages", "reminders", "invites"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md"
                  : "bg-white text-slate-600 shadow-sm"
              }`}
            >
              {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Assigned to You Section */}
        {assignments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
                Assigned to you
              </h2>
              <span className="text-[12px] font-medium text-slate-400">{assignments.length} tasks</span>
            </div>
            <div className="space-y-2.5">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="ios-card p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-slate-900">
                        {assignment.title}
                      </h3>
                      <p className="text-[13px] text-slate-500 mt-0.5">
                        From <span className="font-medium text-slate-600">{assignment.assignedByName}</span>
                      </p>
                      {assignment.dueTime && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getAssignmentStatusColor(assignment.status)}`}>
                            {getAssignmentStatusLabel(assignment.status)}
                          </span>
                          <span className="text-[12px] text-slate-400">• Due {assignment.dueTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    {/* Show feedback message if active */}
                    {actionFeedback?.id === assignment.id ? (
                      <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl ${
                        actionFeedback.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-slate-100 text-slate-600'
                      } text-[13px] font-semibold`}>
                        {actionFeedback.type === 'success' && <CheckCircle className="w-4 h-4" />}
                        {actionFeedback.message}
                      </div>
                    ) : (
                      <>
                        {assignment.status === "pending" && (
                          <>
                            <button
                              onClick={() => acceptAssignment(assignment.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-600 text-[13px] font-semibold hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Accept & Add to Plan
                            </button>
                            <button
                              onClick={() => declineAssignment(assignment.id)}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-500 text-[13px] font-semibold hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              Decline
                            </button>
                          </>
                        )}
                        {assignment.status === "accepted" && (
                          <>
                            <button
                              onClick={() => completeAssignment(assignment.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-600 text-[13px] font-semibold hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Mark Complete
                            </button>
                            <button
                              onClick={() => viewAssignmentInPlan(assignment.id)}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 text-blue-600 text-[13px] font-semibold hover:bg-blue-100 transition-colors"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              View in Plan
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Inbox Items */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
              Activity
            </h2>
            <span className="text-[12px] text-slate-400">{filtered.length} items</span>
          </div>
          
          {filtered.length === 0 ? (
            <div className="ios-card p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 shadow-inner">
                <span className="text-4xl">✨</span>
              </div>
              <h3 className="text-[18px] font-bold text-slate-900 mb-2">
                All caught up!
              </h3>
              <p className="text-[14px] text-slate-500 max-w-[240px] leading-relaxed">
                Great job staying on top of things. New messages and updates will appear here.
              </p>
              <div className="mt-4 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100">
                <p className="text-[12px] text-emerald-600 font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  +10 XP for staying organized
                </p>
              </div>
              {/* Navigation shortcuts when inbox is empty */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => onNavigate?.("plan")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-[13px] font-semibold hover:bg-blue-100 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  View Plan
                </button>
                <button
                  onClick={() => onNavigate?.("circles")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-600 text-[13px] font-semibold hover:bg-purple-100 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Circles
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((it, index) => (
                <div
                  key={it.id}
                  className={`ios-card p-4 shadow-sm slide-in ${it.isNew ? "ring-2 ring-purple-200 ring-offset-1" : ""}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${iconBgFor(it.type)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      {iconFor(it.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-semibold text-slate-900">
                            {it.title}
                          </h3>
                          {it.subtitle && (
                            <p className="text-[13px] text-slate-500 mt-0.5 truncate">
                              {it.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {it.isNew && (
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                          )}
                          <span className="text-[12px] text-slate-400">{it.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    {/* Show feedback if active for this item */}
                    {actionFeedback?.id === it.id ? (
                      <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl ${
                        actionFeedback.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-slate-100 text-slate-600'
                      } text-[13px] font-semibold`}>
                        {actionFeedback.type === 'success' && <CheckCircle className="w-4 h-4" />}
                        {actionFeedback.message}
                      </div>
                    ) : (
                      <>
                        {it.type === "message" && (
                          <>
                            <button
                              onClick={() => handleMessageReply(it.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 text-blue-600 text-[13px] font-semibold hover:bg-blue-100 transition-colors"
                            >
                              <Reply className="w-3.5 h-3.5" />
                              Reply
                            </button>
                            {it.isNew && (
                              <button
                                onClick={() => markRead(it.id)}
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold hover:bg-slate-200 transition-colors"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Read
                              </button>
                            )}
                            <button
                              onClick={() => handleMessageArchive(it.id)}
                              className="flex items-center justify-center p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {it.type === "reminder" && (
                          <>
                            <button
                              onClick={() => handleReminderDone(it.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-600 text-[13px] font-semibold hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Done
                            </button>
                            <button
                              onClick={() => snoozeItem(it.id)}
                              disabled={snoozedItems.has(it.id)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[13px] font-semibold transition-colors ${
                                snoozedItems.has(it.id)
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                              }`}
                            >
                              <AlarmClock className="w-3.5 h-3.5" />
                              {snoozedItems.has(it.id) ? "Snoozed" : "Snooze 1h"}
                            </button>
                            <button
                              onClick={() => {
                                showFeedback(it.id, "Dismissed", 'info');
                                setTimeout(() => remove(it.id), 600);
                              }}
                              className="flex items-center justify-center p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {it.type === "invite" && (
                          <>
                            <button
                              onClick={() => acceptInvite(it.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-50 text-purple-600 text-[13px] font-semibold hover:bg-purple-100 transition-colors"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Join Circle
                            </button>
                            <button
                              onClick={() => {
                                markRead(it.id);
                                onNavigate?.("circles");
                              }}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold hover:bg-slate-200 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => declineInvite(it.id)}
                              className="flex items-center justify-center p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {it.type === "social" && (
                          <>
                            <button
                              onClick={() => handleSocialView(it.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-pink-50 text-pink-600 text-[13px] font-semibold hover:bg-pink-100 transition-colors"
                            >
                              <Heart className="w-3.5 h-3.5" />
                              View Activity
                            </button>
                            {it.isNew && (
                              <button
                                onClick={() => markRead(it.id)}
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold hover:bg-slate-200 transition-colors"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Read
                              </button>
                            )}
                            <button
                              onClick={() => {
                                showFeedback(it.id, "Archived", 'info');
                                setTimeout(() => remove(it.id), 600);
                              }}
                              className="flex items-center justify-center p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}