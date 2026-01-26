import { Calendar, Inbox, Trophy, Clock, CheckCircle2, Wallet, Sparkles, ChevronRight, Zap, Sun, Moon, CloudSun, Target, ArrowRight, MessageCircle, Check, Flame, X, Volume2, Award, TrendingUp, Play, Star, Gift, Mic, ArrowUpRight, Pause, SkipForward, Brain, Timer, Rocket, BarChart3, Dumbbell, Phone, Sunrise, Hand, Plus } from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState, useEffect, useRef } from "react";
import "../../styles/cards.css";

interface HubScreenProps {
  onNavigate?: (screen: string) => void;
  onVoiceClick?: () => void;
}

interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedToday: boolean;
}

export function HubScreen({ onNavigate, onVoiceClick }: HubScreenProps) {
  const [greeting, setGreeting] = useState({ text: '', icon: Sun, period: 'day', timeOfDay: 'morning' });
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingStep, setBriefingStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [lastXpGain, setLastXpGain] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);
  const [orbHovered, setOrbHovered] = useState(false);
  const briefingTimer = useRef<NodeJS.Timeout | null>(null);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load localStorage data
  useEffect(() => {
    const stored = localStorage.getItem('hubData');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setXpEarned(data.xpEarned || 0);
      } catch (e) {
        console.error('Error loading hub data:', e);
      }
    }
  }, []);

  // Dynamic greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ text: 'Good morning', icon: Sun, period: 'morning', timeOfDay: 'morning' });
    } else if (hour < 17) {
      setGreeting({ text: 'Good afternoon', icon: CloudSun, period: 'afternoon', timeOfDay: 'afternoon' });
    } else if (hour < 21) {
      setGreeting({ text: 'Good evening', icon: Sunrise, period: 'evening', timeOfDay: 'evening' });
    } else {
      setGreeting({ text: 'Good night', icon: Moon, period: 'night', timeOfDay: 'night' });
    }
  }, []);

  // Rotating insights
  const insights = [
    { icon: Target, text: "Peak focus hours: 9-11am", color: 'blue' },
    { icon: Zap, text: "You're 67% more productive today", color: 'emerald' },
    { icon: Flame, text: '7-day streak active!', color: 'orange' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveInsightIndex(prev => (prev + 1) % insights.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Briefing items
  const briefingItems = [
    { icon: Hand, text: greeting.text + "! I'm MYPA, your AI life organizer. Let me brief you.", delay: 2500 },
    { icon: BarChart3, text: 'You have 3 tasks remaining today, with 2 marked priority. Very achievable!', delay: 3000 },
    { icon: Clock, text: "Your peak focus window is 9-11am. I've scheduled your hardest tasks then.", delay: 2800 },
    { icon: Target, text: 'Next up: "Review Q1 metrics" at 5PM. You usually finish these in 15 mins.', delay: 2800 },
    { icon: TrendingUp, text: "Exciting! You're 67% above last week. Your consistency is remarkable!", delay: 2500 },
    { icon: Flame, text: 'Your 7-day streak gives you 1.5x XP multiplier. Push to 14 days!', delay: 2300 },
    { icon: Rocket, text: "With your pace, you'll hit 85% completion. Ready to make it 100%?", delay: 2500 },
  ];

  const startBriefing = () => {
    setShowBriefing(true);
    setBriefingStep(0);
    setIsSpeaking(true);
    playBriefingSequence(0);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(briefingItems[0].text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.log('Speech synthesis not available');
      }
    }
  };

  const playBriefingSequence = (step: number) => {
    if (step >= briefingItems.length) {
      setIsSpeaking(false);
      const bonusXp = 10;
      awardXp(bonusXp);
      return;
    }
    setBriefingStep(step);
    setIsSpeaking(true);
    briefingTimer.current = setTimeout(() => {
      playBriefingSequence(step + 1);
    }, briefingItems[step].delay);
  };

  const closeBriefing = () => {
    setShowBriefing(false);
    setBriefingStep(0);
    setIsSpeaking(false);
    if (briefingTimer.current) clearTimeout(briefingTimer.current);
    window.speechSynthesis?.cancel();
  };

  const awardXp = (amount: number) => {
    setLastXpGain(amount);
    setShowXpPopup(true);
    setXpEarned(prev => {
      const newXp = prev + amount;
      localStorage.setItem('hubData', JSON.stringify({ xpEarned: newXp }));
      return newXp;
    });
    setTimeout(() => setShowXpPopup(false), 2000);
  };

  // Today's data
  const today = {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    userName: 'Alex',
    streak: 7,
    level: 12,
    xp: 2460 + xpEarned,
    xpToNext: 340 - xpEarned,
    tasksCompleted: 4 + completedTasks.length,
    totalTasks: 7,
    timeSaved: 42,
    focusMinutes: 180,
  };

  const progressPercent = Math.round((today.tasksCompleted / today.totalTasks) * 100);

  // Priority tasks
  const tasks = [
    { id: 1, title: 'Review Q1 metrics', time: '5:00 PM', icon: BarChart3, category: 'Work', duration: '15m', priority: true },
    { id: 2, title: 'Gym Session', time: '6:00 PM', icon: Dumbbell, category: 'Health', duration: '1h', priority: true },
    { id: 3, title: 'Call Mom', time: 'Evening', icon: Phone, category: 'Personal', duration: '15m', priority: false },
  ];

  // Achievements
  const recentAchievements = [
    { id: 1, icon: Sunrise, name: 'Early Bird', new: true },
    { id: 2, icon: Flame, name: '7-Day Streak', new: true },
    { id: 3, icon: Zap, name: 'Speed Runner', new: false },
  ];

  const formattedTime = currentTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28 relative overflow-hidden">
      <IOSStatusBar />
      
      <style>{`
        @keyframes float { 
          0%, 100% { transform: translateY(0px); } 
          50% { transform: translateY(-8px); } 
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1); }
          50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.2); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes slide-up { 
          from { opacity: 0; transform: translateY(12px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes scale-in { 
          from { opacity: 0; transform: scale(0.9); } 
          to { opacity: 1; transform: scale(1); } 
        }
        @keyframes badge-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes xp-float {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-40px); }
        }
        @keyframes progress-fill {
          from { stroke-dashoffset: 251; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes waveform {
          0%, 100% { height: 8px; }
          50% { height: 24px; }
        }
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .float { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .shimmer { 
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .slide-up { animation: slide-up 0.4s ease-out forwards; }
        .scale-in { animation: scale-in 0.3s ease-out forwards; }
        .badge-bounce { animation: badge-bounce 2s ease-in-out infinite; }
        .xp-float { animation: xp-float 1.5s ease-out forwards; }
        .ripple { animation: ripple 1s ease-out infinite; }
        .wave-bar { animation: waveform 0.5s ease-in-out infinite; }
        .orb-breathe { animation: orb-breathe 4s ease-in-out infinite; }
        .gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        .glass {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .glass-dark {
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
        }
      `}</style>

      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-20 w-64 h-64 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute top-60 -left-20 w-48 h-48 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl" />
      </div>

      {/* XP Popup */}
      {showXpPopup && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 xp-float">
          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold shadow-xl flex items-center gap-2">
            <Star className="w-4 h-4" />
            +{lastXpGain} XP
          </div>
        </div>
      )}

      {/* Header - Compact */}
      <div className="relative px-5 pt-2 pb-2">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[12px] text-slate-500 font-medium">{greeting.text}</p>
            <h1 className="text-[24px] font-bold text-slate-900 tracking-tight leading-tight">{today.userName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate?.('inbox')}
              className="relative w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-all"
            >
              <Inbox className="w-4 h-4 text-slate-600" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">3</span>
              </div>
            </button>
            <button
              onClick={() => onNavigate?.('profile')}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25 active:scale-95 transition-all"
            >
              <span className="text-[14px] font-bold text-white">{today.userName[0]}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-3 relative z-10">
        
        {/* MYPA AI Briefing - Compact */}
        <button
          onClick={startBriefing}
          className="w-full relative rounded-2xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)'
          }}
        >
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-500/20 to-transparent" />
          </div>
          
          <div className="relative p-3 flex items-center gap-3">
            {/* Orb */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-violet-400/20 ripple" />
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg pulse-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-[14px]">MYPA</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-violet-400/30 text-violet-200">AI</span>
              </div>
              <p className="text-violet-200/80 text-[12px]">Tap for your daily briefing</p>
            </div>

            {/* Play */}
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md">
              <Play className="w-4 h-4 text-violet-600 ml-0.5" />
            </div>
          </div>
        </button>

        {/* Streak & Level Row - Compact */}
        <div className="grid grid-cols-2 gap-2">
          {/* Streak Card */}
          <button 
            onClick={() => onNavigate?.('streak')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[18px] font-bold text-slate-900 leading-none">{today.streak} days</p>
              <p className="text-[10px] text-orange-600 font-medium">1.5x XP boost</p>
            </div>
          </button>

          {/* Level Card */}
          <button 
            onClick={() => onNavigate?.('level')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/50 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[18px] font-bold text-slate-900 leading-none">Level {today.level}</p>
              <p className="text-[10px] text-violet-600 font-medium">{today.xpToNext > 0 ? today.xpToNext : 0} XP to next</p>
            </div>
          </button>
        </div>

        {/* Up Next - Clean Timeline Design */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Today's Focus</h3>
                <p className="text-[12px] text-slate-500">{completedTasks.length}/{tasks.length} completed</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate?.('plan')}
              className="text-[13px] font-semibold text-violet-600 flex items-center gap-1 active:scale-95 transition-transform"
            >
              Full Plan <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 rounded-full transition-all duration-500"
                style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
              />
            </div>
            <span className="text-[12px] font-bold text-slate-900">{Math.round((completedTasks.length / tasks.length) * 100)}%</span>
          </div>

          {/* Task List - Rich Cards */}
          <div className="space-y-2.5">
            {tasks.map((task, index) => {
              const isCompleted = completedTasks.includes(task.id);
              const isNextUp = !isCompleted && !tasks.slice(0, index).some(t => !completedTasks.includes(t.id));
              const catStyle = task.category === 'Work' 
                ? { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' }
                : task.category === 'Health'
                  ? { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' }
                  : { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' };
              
              return (
                <div
                  key={task.id}
                  onClick={() => !isCompleted && onNavigate?.('plan')}
                  className={`relative overflow-hidden rounded-2xl transition-all cursor-pointer active:scale-[0.98] ${
                    isCompleted 
                      ? 'bg-slate-50 opacity-60' 
                      : isNextUp 
                        ? `${catStyle.light} shadow-md border ${catStyle.border}` 
                        : 'bg-white shadow-sm border border-slate-100 hover:shadow-md'
                  }`}
                >
                  {/* Category Accent Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCompleted ? 'bg-slate-300' : catStyle.bg}`} />
                  
                  {/* Next Up Badge */}
                  {isNextUp && (
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${catStyle.bg} text-white shadow-sm`}>
                        Next
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3.5 pl-4">
                    {/* Time */}
                    <div className="w-12 text-center flex-shrink-0">
                      <span className={`text-[13px] font-bold ${isCompleted ? 'text-slate-400' : isNextUp ? catStyle.text : 'text-slate-700'}`}>
                        {task.time.replace(':00', '').replace(' ', '')}
                      </span>
                    </div>
                    
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCompleted) {
                          setCompletedTasks(prev => prev.filter(id => id !== task.id));
                        } else {
                          setCompletedTasks(prev => [...prev, task.id]);
                        }
                      }}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-500' 
                          : isNextUp
                            ? `border-current ${catStyle.text} hover:bg-white/50`
                            : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {isCompleted && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </button>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-[14px] font-semibold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </h3>
                        {task.priority && !isCompleted && (
                          <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-[9px] font-bold text-white">!</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-500 font-medium">{task.duration}</span>
                        <span className="text-slate-300">·</span>
                        <span className={`text-[11px] font-semibold ${catStyle.text}`}>{task.category}</span>
                      </div>
                    </div>
                    
                    {/* Play / Arrow */}
                    {!isCompleted && (
                      isNextUp ? (
                        <div className={`w-9 h-9 rounded-full ${catStyle.bg} flex items-center justify-center flex-shrink-0 shadow-md`}>
                          <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Quick Add */}
          <button 
            onClick={() => onNavigate?.('plan')}
            className="w-full mt-3 py-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 text-[13px] font-semibold text-slate-500 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <Plus className="w-3.5 h-3.5 text-slate-500" />
            </div>
            Add task
          </button>
        </div>

        {/* Quick Actions - Premium Grid */}
        <div>
          <h3 className="text-[13px] font-bold text-slate-600 uppercase tracking-wide px-1 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Calendar, label: 'Plan', color: 'from-blue-500 to-cyan-500', screen: 'plan' },
              { icon: Brain, label: 'Dump', color: 'from-slate-700 to-slate-900', screen: 'sort' },
              { icon: Trophy, label: 'Compete', color: 'from-orange-500 to-amber-500', screen: 'challenges' },
              { icon: Wallet, label: 'Wallet', color: 'from-emerald-500 to-teal-500', screen: 'wallet' },
            ].map((action, idx) => (
              <button
                key={action.label}
                onClick={() => onNavigate?.(action.screen)}
                className="glass rounded-2xl p-3 text-center shadow-sm active:scale-95 transition-all hover:shadow-md scale-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-1.5 shadow-sm`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-[11px] font-semibold text-slate-700">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Ask MYPA CTA */}
        <button
          onClick={() => onVoiceClick?.()}
          className="w-full rounded-2xl p-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-3 active:scale-[0.98] transition-all gradient-shift relative overflow-hidden"
        >
          <div className="absolute inset-0 shimmer" />
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-[15px]">Ask MYPA Anything</p>
            <p className="text-white/70 text-[12px]">"What should I focus on next?"</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-white/70 ml-auto" />
        </button>

        {/* Reset Day Link */}
        <button
          onClick={() => onNavigate?.('reset')}
          className="w-full py-2 text-center"
        >
          <span className="text-[12px] text-slate-400">Overwhelmed? <span className="text-violet-500 font-medium">Reset your day</span></span>
        </button>
      </div>

      {/* AI Briefing Overlay */}
      {showBriefing && (
        <div className="fixed inset-0 z-[9999] flex flex-col">
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 30%, #1e1b4b 0%, #0f0a1e 40%, #030014 100%)'
            }}
          />
          
          {/* Close */}
          <button
            onClick={closeBriefing}
            className="absolute top-14 right-5 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>

          {/* Skip */}
          <button
            onClick={() => {
              if (briefingTimer.current) clearTimeout(briefingTimer.current);
              if (briefingStep < briefingItems.length - 1) {
                playBriefingSequence(briefingItems.length - 1);
              }
            }}
            className="absolute top-14 left-5 z-10 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md flex items-center gap-1 active:scale-95 transition-transform"
          >
            <SkipForward className="w-4 h-4 text-white/80" />
            <span className="text-[12px] text-white/80 font-medium">Skip</span>
          </button>
          
          <div className="relative flex-1 flex flex-col items-center justify-center px-6">
            {/* Speaking Orb */}
            <div className="relative mb-8">
              <div className={`absolute -inset-8 rounded-full bg-violet-500/10 ${isSpeaking ? 'animate-ping' : ''}`} style={{ animationDuration: '2s' }} />
              <div className={`absolute -inset-4 rounded-full bg-violet-500/20 ${isSpeaking ? 'animate-pulse' : ''}`} />
              
              <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/50 ${isSpeaking ? 'scale-105' : 'orb-breathe'} transition-transform`}>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
                
                {isSpeaking ? (
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-white rounded-full wave-bar"
                        style={{ animationDelay: `${i * 0.1}s`, height: '12px' }}
                      />
                    ))}
                  </div>
                ) : (
                  <Sparkles className="w-12 h-12 text-white" />
                )}
              </div>
            </div>
            
            <p className="text-violet-300 text-[13px] font-semibold uppercase tracking-widest mb-6">AI Life Organizer</p>
            
            {/* Briefing Messages */}
            <div className="w-full max-w-sm min-h-[160px]">
              {briefingItems.slice(Math.max(0, briefingStep - 1), briefingStep + 1).map((item, index) => {
                const actualIndex = Math.max(0, briefingStep - 1) + index;
                const isCurrent = actualIndex === briefingStep;
                const ItemIcon = item.icon;
                return (
                  <div
                    key={actualIndex}
                    className={`w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-3 transition-all duration-300 ${
                      isCurrent ? 'border border-violet-400/50 scale-100 opacity-100' : 'scale-95 opacity-40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <ItemIcon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-white text-[14px] font-medium leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Progress */}
            <div className="flex items-center gap-2 mt-4">
              {briefingItems.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index <= briefingStep ? 'bg-violet-400 w-4' : 'bg-white/20 w-2'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="relative p-6 pb-10">
            <button
              onClick={closeBriefing}
              className="w-full py-4 rounded-2xl bg-white text-slate-900 text-[16px] font-bold active:scale-[0.98] transition-transform shadow-xl flex items-center justify-center gap-2"
            >
              {briefingStep >= briefingItems.length - 1 ? (
                <>
                  <Rocket className="w-5 h-5" />
                  Let's Crush Today!
                </>
              ) : (
                'Close Briefing'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
