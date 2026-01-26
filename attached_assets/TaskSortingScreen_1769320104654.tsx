import { useState, useRef } from "react";
import {
  ArrowLeft,
  Mic,
  Plus,
  MoreVertical,
  CheckCircle,
  Clock,
  Sparkles,
  Trash2,
  Calendar,
  Bell,
  Target,
  ChevronRight,
  AlertCircle,
  Timer,
  Inbox,
  Star,
  ChevronDown,
  X,
  Check,
  MoveRight,
  Zap,
  ArrowRight,
  Brain,
  Lightbulb,
  Send,
  CalendarPlus,
  ChevronLeft,
  Trophy,
  Briefcase,
  HeartPulse,
  User,
  BookOpen,
  Users,
  Wallet,
  Home,
  FileText,
  Phone,
  Mail,
  Dumbbell,
  ShoppingCart,
  ClipboardCheck,
  Handshake,
  Keyboard,
  Bot,
  LucideIcon
} from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";

interface TaskSortingProps {
  onNavigate?: (screen: string) => void;
}

interface BrainDumpItem {
  id: number;
  title: string;
  status: "unsorted" | "reviewed" | "planned";
  aiCategory?: "work" | "health" | "personal" | "learning" | "social" | "finance" | "home";
  aiPriority?: "urgent" | "important" | "normal" | "low";
  estimatedTime?: string;
  isNew?: boolean;
  createdAt: string;
  source: "voice" | "typed" | "ai-chat";
  plannedDate?: string;
  isStarred?: boolean;
}

type FilterType = "all" | "unsorted" | "reviewed";

export function TaskSortingScreen({ onNavigate }: TaskSortingProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<BrainDumpItem[]>([
    {
      id: 1,
      title: "Call dentist for appointment",
      status: "unsorted",
      isNew: true,
      createdAt: "10m ago",
      source: "voice",
      isStarred: true,
    },
    {
      id: 2,
      title: "Review Q1 metrics report",
      status: "unsorted",
      estimatedTime: "15m",
      createdAt: "5m ago",
      source: "ai-chat",
    },
    {
      id: 3,
      title: "Book flight for conference",
      status: "unsorted",
      createdAt: "2h ago",
      source: "typed",
    },
    {
      id: 4,
      title: "Respond to team Slack messages",
      status: "reviewed",
      aiCategory: "work",
      aiPriority: "important",
      estimatedTime: "20m",
      isNew: true,
      createdAt: "1h ago",
      source: "voice",
    },
    {
      id: 5,
      title: "Learn new React patterns",
      status: "reviewed",
      aiCategory: "learning",
      aiPriority: "normal",
      createdAt: "3h ago",
      source: "ai-chat",
    },
    {
      id: 6,
      title: "Schedule gym session",
      status: "unsorted",
      createdAt: "5h ago",
      source: "voice",
    },
    {
      id: 7,
      title: "Pay electricity bill",
      status: "unsorted",
      createdAt: "1d ago",
      source: "typed",
    },
  ]);

  const [showMenuId, setShowMenuId] = useState<number | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState<number | null>(null);
  const [selectedPlanDate, setSelectedPlanDate] = useState<Date>(new Date());
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [isAISorting, setIsAISorting] = useState(false);
  const [sortedPreview, setSortedPreview] = useState<BrainDumpItem[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const unsortedCount = items.filter(i => i.status === 'unsorted').length;
  const reviewedCount = items.filter(i => i.status === 'reviewed').length;
  const totalItems = items.length;

  const filteredItems = items.filter((item) => {
    if (activeFilter === "all") return true;
    return item.status === activeFilter;
  });

  // AI categorization logic with time estimation
  const categorizeTask = (title: string): { category: BrainDumpItem['aiCategory'], priority: BrainDumpItem['aiPriority'], estimatedTime: string } => {
    const lower = title.toLowerCase();
    
    // Time estimation based on task type
    const estimateTime = (taskType: string): string => {
      // Quick tasks (5-15 min)
      if (lower.includes('call') || lower.includes('email') || lower.includes('message') ||
          lower.includes('respond') || lower.includes('reply') || lower.includes('text') ||
          lower.includes('schedule') || lower.includes('book') || lower.includes('order')) {
        return '10m';
      }
      // Short tasks (15-30 min)
      if (lower.includes('pay') || lower.includes('bill') || lower.includes('review') ||
          lower.includes('check') || lower.includes('organize') || lower.includes('clean')) {
        return '20m';
      }
      // Medium tasks (30-60 min)
      if (lower.includes('meeting') || lower.includes('gym') || lower.includes('workout') ||
          lower.includes('appointment') || lower.includes('lunch') || lower.includes('dinner') ||
          lower.includes('report') || lower.includes('presentation')) {
        return '45m';
      }
      // Long tasks (1-2 hours)
      if (lower.includes('learn') || lower.includes('study') || lower.includes('project') ||
          lower.includes('design') || lower.includes('write') || lower.includes('create') ||
          lower.includes('deep work') || lower.includes('conference')) {
        return '1h 30m';
      }
      // Default medium task
      return '30m';
    };
    
    // Health keywords
    if (lower.includes('doctor') || lower.includes('dentist') || lower.includes('gym') || 
        lower.includes('health') || lower.includes('workout') || lower.includes('medicine') ||
        lower.includes('appointment') || lower.includes('hospital')) {
      return { category: 'health', priority: lower.includes('urgent') || lower.includes('emergency') ? 'urgent' : 'important', estimatedTime: estimateTime('health') };
    }
    
    // Work keywords
    if (lower.includes('meeting') || lower.includes('report') || lower.includes('email') ||
        lower.includes('slack') || lower.includes('work') || lower.includes('project') ||
        lower.includes('deadline') || lower.includes('client') || lower.includes('team') ||
        lower.includes('review') || lower.includes('conference') || lower.includes('presentation')) {
      return { category: 'work', priority: lower.includes('urgent') || lower.includes('deadline') ? 'urgent' : 'important', estimatedTime: estimateTime('work') };
    }
    
    // Finance keywords
    if (lower.includes('bill') || lower.includes('pay') || lower.includes('bank') ||
        lower.includes('money') || lower.includes('tax') || lower.includes('invoice') ||
        lower.includes('budget') || lower.includes('expense')) {
      return { category: 'finance', priority: lower.includes('overdue') ? 'urgent' : 'important', estimatedTime: estimateTime('finance') };
    }
    
    // Learning keywords
    if (lower.includes('learn') || lower.includes('study') || lower.includes('course') ||
        lower.includes('read') || lower.includes('book') || lower.includes('tutorial') ||
        lower.includes('practice')) {
      return { category: 'learning', priority: 'normal', estimatedTime: estimateTime('learning') };
    }
    
    // Social keywords
    if (lower.includes('call') || lower.includes('meet') || lower.includes('friend') ||
        lower.includes('family') || lower.includes('birthday') || lower.includes('party') ||
        lower.includes('dinner') || lower.includes('lunch')) {
      return { category: 'social', priority: 'normal', estimatedTime: estimateTime('social') };
    }
    
    // Home keywords
    if (lower.includes('clean') || lower.includes('organize') || lower.includes('home') ||
        lower.includes('house') || lower.includes('laundry') || lower.includes('grocery') ||
        lower.includes('cook') || lower.includes('repair')) {
      return { category: 'home', priority: 'normal', estimatedTime: estimateTime('home') };
    }
    
    return { category: 'personal', priority: 'normal', estimatedTime: estimateTime('personal') };
  };

  const handleAddItem = () => {
    if (inputValue.trim()) {
      const newItem: BrainDumpItem = {
        id: Math.max(...items.map((i) => i.id), 0) + 1,
        title: inputValue,
        status: "unsorted",
        isNew: true,
        createdAt: "now",
        source: "typed",
      };
      setItems([newItem, ...items]);
      setInputValue("");
    }
  };

  const handleComplete = (id: number) => {
    setCompletedTasks([...completedTasks, id]);
    setTimeout(() => {
      setItems(items.filter((item) => item.id !== id));
      setCompletedTasks(completedTasks.filter(t => t !== id));
    }, 500);
    setShowMenuId(null);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
    setShowMenuId(null);
  };

  const handleToggleStar = (id: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, isStarred: !item.isStarred } : item
      )
    );
  };

  // Smart scheduling - find best time slot for a task
  const getSmartTimeSlot = (priority: string, category: string, index: number): string => {
    // Urgent tasks go in morning/early slots
    if (priority === 'urgent') {
      const urgentTimes = ['9:00 AM', '9:30 AM', '10:00 AM'];
      return urgentTimes[index % urgentTimes.length];
    }
    // Work tasks during work hours
    if (category === 'work') {
      const workTimes = ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'];
      return workTimes[index % workTimes.length];
    }
    // Health/gym tasks morning or evening
    if (category === 'health') {
      const healthTimes = ['7:00 AM', '6:00 PM', '7:00 PM'];
      return healthTimes[index % healthTimes.length];
    }
    // Social tasks afternoon/evening
    if (category === 'social') {
      const socialTimes = ['12:00 PM', '1:00 PM', '6:00 PM', '7:00 PM'];
      return socialTimes[index % socialTimes.length];
    }
    // Learning tasks in focused time
    if (category === 'learning') {
      const learnTimes = ['8:00 AM', '4:00 PM', '8:00 PM'];
      return learnTimes[index % learnTimes.length];
    }
    // Default spread throughout day
    const defaultTimes = ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];
    return defaultTimes[index % defaultTimes.length];
  };

  const handleAISort = () => {
    setIsAISorting(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const sorted = items.map((item, index) => {
        if (item.status === 'unsorted' || !item.estimatedTime) {
          const { category, priority, estimatedTime } = categorizeTask(item.title);
          return { 
            ...item, 
            aiCategory: category, 
            aiPriority: priority, 
            estimatedTime: item.estimatedTime || estimatedTime,
            status: 'reviewed' as const,
            suggestedTime: getSmartTimeSlot(priority, category, index)
          };
        }
        return { ...item, suggestedTime: getSmartTimeSlot(item.aiPriority || 'normal', item.aiCategory || 'personal', index) };
      });
      
      // Sort by priority
      const priorityOrder = { urgent: 0, important: 1, normal: 2, low: 3 };
      sorted.sort((a, b) => {
        const aPriority = priorityOrder[a.aiPriority || 'normal'];
        const bPriority = priorityOrder[b.aiPriority || 'normal'];
        return aPriority - bPriority;
      });
      
      setSortedPreview(sorted);
      setIsAISorting(false);
      setShowAIModal(true);
    }, 1500);
  };

  // Apply AI sort and add all tasks to Plan
  const applyAISort = () => {
    if (sortedPreview) {
      // Save tasks to localStorage for Plan screen to pick up
      try {
        localStorage.setItem('pendingPlanTasks', JSON.stringify(sortedPreview));
      } catch (e) {
        console.error('Error saving tasks', e);
      }
      
      // Clear the items (they're being moved to plan)
      setItems([]);
      setSortedPreview(null);
      setShowAIModal(false);
      
      // Navigate to plan page
      setTimeout(() => {
        onNavigate?.('plan');
      }, 300);
    }
  };

  const handleAddToPlan = (id: number, date: Date) => {
    // Format date for display
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const task = items.find(i => i.id === id);
    
    if (!task) return;
    
    // Auto-categorize if not already done
    let taskData = { ...task };
    if (!task.aiCategory) {
      const { category, priority, estimatedTime } = categorizeTask(task.title);
      taskData = { ...task, aiCategory: category, aiPriority: priority, estimatedTime: task.estimatedTime || estimatedTime };
    }
    
    // Determine time slot based on date selection
    const isToday = date.toDateString() === new Date().toDateString();
    const suggestedTime = isToday ? getSmartTimeSlot(taskData.aiPriority || 'normal', taskData.aiCategory || 'personal', 0) : '9:00 AM';
    
    // Save task to localStorage for Plan screen to pick up
    try {
      const taskToAdd = {
        ...taskData,
        suggestedTime,
        plannedDate: dateStr,
      };
      localStorage.setItem('pendingPlanTasks', JSON.stringify([taskToAdd]));
    } catch (e) {
      console.error('Error saving task', e);
    }
    
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, status: 'planned' as const, plannedDate: dateStr } : item
      )
    );
    
    // Remove from list after brief animation
    setTimeout(() => {
      setItems(prev => prev.filter(item => item.id !== id));
      // Navigate to plan page
      onNavigate?.('plan');
    }, 600);
    
    setShowPlanModal(null);
  };

  const getCategoryIcon = (category?: BrainDumpItem['aiCategory']): LucideIcon => {
    switch (category) {
      case 'work': return Briefcase;
      case 'health': return HeartPulse;
      case 'personal': return User;
      case 'learning': return BookOpen;
      case 'social': return Users;
      case 'finance': return Wallet;
      case 'home': return Home;
      default: return FileText;
    }
  };

  const getCategoryColor = (category?: BrainDumpItem['aiCategory']) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-700';
      case 'health': return 'bg-rose-100 text-rose-700';
      case 'personal': return 'bg-purple-100 text-purple-700';
      case 'learning': return 'bg-amber-100 text-amber-700';
      case 'social': return 'bg-emerald-100 text-emerald-700';
      case 'finance': return 'bg-green-100 text-green-700';
      case 'home': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityBadge = (priority?: BrainDumpItem['aiPriority']) => {
    switch (priority) {
      case 'urgent': return { color: 'bg-red-500 text-white', label: 'Urgent' };
      case 'important': return { color: 'bg-amber-500 text-white', label: 'Important' };
      case 'normal': return { color: 'bg-slate-200 text-slate-700', label: 'Normal' };
      case 'low': return { color: 'bg-slate-100 text-slate-500', label: 'Low' };
      default: return null;
    }
  };

  const getSourceIcon = (source: BrainDumpItem['source']): LucideIcon => {
    switch (source) {
      case 'voice': return Mic;
      case 'ai-chat': return Bot;
      case 'typed': return Keyboard;
    }
  };

  // Generate date options for Plan modal
  const getDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push(date);
    }
    return options;
  };

  const formatDateOption = (date: Date, index: number) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-screen bg-ios-bg flex flex-col overflow-hidden">
      <IOSStatusBar />

      <style>{`
        .ios-glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slideUp 0.3s ease-out forwards; }
        @keyframes checkmark {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .checkmark { animation: checkmark 0.3s ease-out forwards; }
        @keyframes fadeOut {
          to { opacity: 0; transform: translateX(20px); }
        }
        .fade-out { animation: fadeOut 0.3s ease-out forwards; }
        @keyframes planSuccess {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); background: rgb(16 185 129 / 0.2); }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .plan-success { animation: planSuccess 0.8s ease-out forwards; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Header */}
      <div className="px-5 pt-1 pb-2 relative z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate?.('hub')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="text-center">
            <h1 className="text-[17px] font-bold text-slate-900">Brain Dump</h1>
            <p className="text-[10px] text-slate-500">Your thoughts, organized</p>
          </div>
          <button 
            onClick={handleAISort}
            disabled={isAISorting || unsortedCount === 0}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${
              isAISorting ? 'bg-slate-300' : 'bg-gradient-to-br from-violet-500 to-purple-600'
            }`}
          >
            {isAISorting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-4 mb-3 flex-shrink-0">
        <div className="ios-glass rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-900">
                {unsortedCount > 0 ? `${unsortedCount} tasks ready for smart scheduling` : 'All tasks scheduled! 🎉'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {unsortedCount > 0 
                  ? 'AI will categorize, estimate time & add to your plan'
                  : 'Dump new tasks anytime - AI handles the rest'}
              </p>
            </div>
            {unsortedCount > 0 && (
              <button 
                onClick={handleAISort}
                disabled={isAISorting}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-transform"
              >
                {isAISorting ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full spin" />
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Auto Plan
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="px-4 mb-2 flex-shrink-0">
        <div className="ios-glass rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-slate-600" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleAddItem();
              }}
              placeholder="Dump a task here..."
              className="flex-1 outline-none bg-transparent text-slate-800 placeholder:text-slate-400 text-[14px]"
            />
            <button 
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 active:scale-95"
              onClick={() => {/* Voice input */}}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddItem}
              disabled={!inputValue.trim()}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                inputValue.trim() 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="px-4 mb-3 flex-shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { icon: Phone, color: 'text-blue-500', label: 'Call', template: 'Call ' },
            { icon: Mail, color: 'text-rose-500', label: 'Email', template: 'Email ' },
            { icon: Dumbbell, color: 'text-orange-500', label: 'Exercise', template: 'Go to gym' },
            { icon: ShoppingCart, color: 'text-emerald-500', label: 'Shopping', template: 'Buy groceries' },
            { icon: ClipboardCheck, color: 'text-violet-500', label: 'Review', template: 'Review ' },
            { icon: Handshake, color: 'text-amber-500', label: 'Meeting', template: 'Meeting with ' },
          ].map((tpl) => (
            <button
              key={tpl.label}
              onClick={() => {
                setInputValue(tpl.template);
                inputRef.current?.focus();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white shadow-sm text-[11px] font-medium text-slate-600 hover:bg-slate-50 active:scale-95 transition-all whitespace-nowrap border border-slate-100"
            >
              <tpl.icon className={`w-3.5 h-3.5 ${tpl.color}`} />
              <span>{tpl.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mb-2 flex-shrink-0">
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All', count: totalItems },
            { id: 'unsorted', label: 'Unsorted', count: unsortedCount },
            { id: 'reviewed', label: 'Reviewed', count: reviewedCount },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeFilter === filter.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 shadow-sm'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeFilter === filter.id ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Context-Aware Quick Access */}
      <div className="px-4 mb-3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate?.('plan')}
            className="ios-glass rounded-xl p-2.5 shadow-sm flex items-center gap-2 active:scale-95 transition-transform hover:bg-blue-50"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <p className="text-[12px] font-semibold text-slate-900">View Plan</p>
            <ChevronRight className="w-3 h-3 text-slate-400 ml-auto" />
          </button>
          
          <button
            onClick={() => onNavigate?.('challenges')}
            className="ios-glass rounded-xl p-2.5 shadow-sm flex items-center gap-2 active:scale-95 transition-transform hover:bg-orange-50"
          >
            <Trophy className="w-4 h-4 text-orange-600" />
            <p className="text-[12px] font-semibold text-slate-900">Challenges</p>
            <ChevronRight className="w-3 h-3 text-slate-400 ml-auto" />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="px-4 flex-1 overflow-y-auto pb-6">
        {filteredItems.length === 0 ? (
          <div className="ios-glass rounded-xl p-6 text-center shadow-sm mt-2">
            <div className="w-14 h-14 rounded-xl bg-slate-100 mx-auto mb-3 flex items-center justify-center">
              <Inbox className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-[15px] font-semibold text-slate-800 mb-1">
              {activeFilter === 'unsorted' ? 'Nothing to sort!' : 'No tasks here'}
            </h3>
            <p className="text-[12px] text-slate-500 mb-3">
              {activeFilter === 'unsorted' 
                ? 'All your tasks have been reviewed'
                : 'Add tasks to get started'}
            </p>
            <button
              onClick={() => inputRef.current?.focus()}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-[13px] font-medium active:scale-95 transition-transform"
            >
              Add Task
            </button>
          </div>
        ) : (
          <div className="space-y-2 mt-1">
            {filteredItems.map((item, index) => (
              <div 
                key={item.id} 
                className={`ios-glass rounded-xl shadow-sm overflow-hidden slide-up ${
                  completedTasks.includes(item.id) ? 'fade-out' : ''
                } ${item.status === 'planned' ? 'plan-success' : ''}`}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="p-3">
                  <div className="flex items-start gap-2.5">
                    {/* Complete Button */}
                    <button 
                      onClick={() => handleComplete(item.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        completedTasks.includes(item.id)
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {completedTasks.includes(item.id) && (
                        <Check className="w-3 h-3 text-white checkmark" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-[14px] font-medium leading-tight ${
                          completedTasks.includes(item.id) ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}>
                          {item.title}
                        </h3>
                        <div className="flex items-center flex-shrink-0">
                          <button 
                            onClick={() => handleToggleStar(item.id)}
                            className={`p-1 rounded-md transition-colors active:scale-95 ${
                              item.isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" fill={item.isStarred ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => setShowMenuId(showMenuId === item.id ? null : item.id)}
                            className="p-1 rounded-md hover:bg-slate-100 transition-colors text-slate-400 active:scale-95"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {/* Source indicator */}
                        {(() => {
                          const SourceIcon = getSourceIcon(item.source);
                          return <SourceIcon className="w-3 h-3 text-slate-400" />;
                        })()}
                        
                        {/* Status badge */}
                        {item.status === 'unsorted' ? (
                          <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Unsorted
                          </span>
                        ) : item.aiCategory && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1 ${getCategoryColor(item.aiCategory)}`}>
                            {(() => {
                              const CategoryIcon = getCategoryIcon(item.aiCategory);
                              return <CategoryIcon className="w-3 h-3" />;
                            })()}
                            {item.aiCategory}
                          </span>
                        )}
                        
                        {/* Priority badge */}
                        {item.aiPriority && getPriorityBadge(item.aiPriority) && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${getPriorityBadge(item.aiPriority)!.color}`}>
                            {getPriorityBadge(item.aiPriority)!.label}
                          </span>
                        )}
                        
                        {item.estimatedTime && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            <Timer className="w-2.5 h-2.5" />
                            ~{item.estimatedTime}
                          </span>
                        )}
                        
                        {item.isNew && (
                          <span className="text-[9px] text-violet-600 font-semibold bg-violet-100 px-1.5 py-0.5 rounded-full">
                            NEW
                          </span>
                        )}
                        
                        <span className="text-[10px] text-slate-400">{item.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
                    <button 
                      onClick={() => setShowPlanModal(item.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-medium hover:bg-emerald-200 transition-colors active:scale-95"
                    >
                      <CalendarPlus className="w-3 h-3" />
                      Add to Plan
                    </button>
                    <button 
                      onClick={() => {
                        const { category, priority, estimatedTime } = categorizeTask(item.title);
                        setItems(items.map(i => 
                          i.id === item.id 
                            ? { ...i, aiCategory: category, aiPriority: priority, estimatedTime: i.estimatedTime || estimatedTime, status: 'reviewed' as const }
                            : i
                        ));
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-100 text-violet-700 text-[11px] font-medium hover:bg-violet-200 transition-colors active:scale-95"
                    >
                      <Sparkles className="w-3 h-3" />
                      Categorize
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors active:scale-95 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Context Menu */}
                {showMenuId === item.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenuId(null)} />
                    <div 
                      className="absolute right-3 top-10 bg-white rounded-xl shadow-xl border border-slate-100 z-50 min-w-[180px] overflow-hidden slide-up"
                      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
                    >
                      <div className="p-1.5">
                        <button 
                          onClick={() => {
                            setShowMenuId(null);
                            setShowPlanModal(item.id);
                          }}
                          className="w-full text-left px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition-colors"
                        >
                          <CalendarPlus className="w-4 h-4 text-emerald-500" />
                          Add to Plan
                        </button>
                        <button 
                          onClick={() => handleComplete(item.id)} 
                          className="w-full text-left px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Mark Done
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="w-full text-left px-3 py-2.5 text-[13px] text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2.5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Modal - Date Picker */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPlanModal(null)} />
          <div className="relative w-full max-w-[390px] bg-white rounded-t-[24px] p-5 pb-8 shadow-2xl">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CalendarPlus className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-slate-900">Add to Plan</h2>
                <p className="text-[12px] text-slate-500">Select a date for this task</p>
              </div>
            </div>
            
            {/* Task Preview */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <p className="text-[14px] font-medium text-slate-800">
                {items.find(i => i.id === showPlanModal)?.title}
              </p>
            </div>
            
            {/* Date Options */}
            <div className="space-y-2 mb-4">
              {getDateOptions().map((date, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPlanDate(date)}
                  className={`w-full p-3 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] ${
                    selectedPlanDate.toDateString() === date.toDateString()
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-[14px] font-medium">{formatDateOption(date, index)}</span>
                  {index === 0 && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      selectedPlanDate.toDateString() === date.toDateString()
                        ? 'bg-white/20'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      Recommended
                    </span>
                  )}
                  {selectedPlanDate.toDateString() === date.toDateString() && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPlanModal(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 text-[14px] font-semibold active:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleAddToPlan(showPlanModal, selectedPlanDate)}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-[14px] font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Add to Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Sort Results Modal - Smart Schedule Preview */}
      {showAIModal && sortedPreview && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAIModal(false)} />
          <div className="relative w-full max-w-[390px] bg-white rounded-t-[24px] p-5 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-[17px] font-bold text-slate-900">Smart Schedule ✨</h2>
                <p className="text-[12px] text-slate-500">AI planned your tasks for today</p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-emerald-50 rounded-xl p-2.5 text-center">
                <p className="text-[18px] font-bold text-emerald-600">{sortedPreview.length}</p>
                <p className="text-[10px] text-emerald-700">Tasks</p>
              </div>
              <div className="flex-1 bg-violet-50 rounded-xl p-2.5 text-center">
                <p className="text-[18px] font-bold text-violet-600">
                  {sortedPreview.reduce((acc, t) => {
                    const time = t.estimatedTime || '30m';
                    const mins = time.includes('h') ? parseInt(time) * 60 + (parseInt(time.split('h')[1]) || 0) : parseInt(time);
                    return acc + mins;
                  }, 0)}m
                </p>
                <p className="text-[10px] text-violet-700">Total Time</p>
              </div>
              <div className="flex-1 bg-amber-50 rounded-xl p-2.5 text-center">
                <p className="text-[18px] font-bold text-amber-600">
                  {sortedPreview.filter(t => t.aiPriority === 'urgent' || t.aiPriority === 'important').length}
                </p>
                <p className="text-[10px] text-amber-700">Priority</p>
              </div>
            </div>

            {/* Smart Schedule Preview */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-2.5">
                <CalendarPlus className="w-4 h-4 text-slate-600" />
                <span className="text-[12px] font-semibold text-slate-700">Today's Schedule</span>
              </div>
              <div className="space-y-2">
                {sortedPreview.map((task: BrainDumpItem & { suggestedTime?: string }) => (
                  <div key={task.id} className="flex items-center gap-2 bg-white rounded-lg p-2.5 shadow-sm">
                    <div className="text-[11px] font-medium text-slate-500 w-16 flex-shrink-0">
                      {task.suggestedTime || '10:00 AM'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{task.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {(() => {
                          const CategoryIcon = getCategoryIcon(task.aiCategory);
                          return <CategoryIcon className="w-3 h-3 text-slate-500" />;
                        })()}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${getCategoryColor(task.aiCategory)}`}>
                          {task.aiCategory}
                        </span>
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                          <Timer className="w-2.5 h-2.5" />
                          {task.estimatedTime}
                        </span>
                      </div>
                    </div>
                    {(task.aiPriority === 'urgent' || task.aiPriority === 'important') && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        task.aiPriority === 'urgent' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {task.aiPriority === 'urgent' ? '🔥' : '⭐'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 mb-4 px-1">
              <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500">
                Tasks will be added to your Plan with optimal time slots based on priority and category.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setSortedPreview(null);
                  setShowAIModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 text-[14px] font-semibold active:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={applyAISort}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[14px] font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Add to Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
