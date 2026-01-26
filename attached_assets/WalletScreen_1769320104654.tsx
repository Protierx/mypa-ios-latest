import { 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  Gift, 
  ChevronRight, 
  Flame, 
  Target, 
  Share2, 
  Trophy, 
  Zap,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  History,
  X
} from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState } from "react";

interface WalletScreenProps {
  onNavigate?: (screen: string) => void;
}

export function WalletScreen({ onNavigate }: WalletScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Time stats per period
  const stats = {
    today: { saved: '42m', tasks: 8, streak: 6, efficiency: 87 },
    week: { saved: '2h 40m', tasks: 34, streak: 6, efficiency: 92 },
    month: { saved: '12h 20m', tasks: 142, streak: 6, efficiency: 89 },
  };

  // User wallet data
  const wallet = {
    totalTimeSaved: '48h 32m',
    streak: 6,
    bestStreak: 21,
    tasksCompleted: 342,
    avgDaily: '1h 12m'
  };

  // Recent time savings
  const recentSavings = [
    { id: 1, action: 'Completed Morning Workout early', time: '+15m', when: '2h ago', icon: '🏃' },
    { id: 2, action: 'Batched 3 errands together', time: '+12m', when: '4h ago', icon: '📦' },
    { id: 3, action: 'Auto-rescheduled conflicts', time: '+8m', when: 'Yesterday', icon: '🔄' },
    { id: 4, action: 'Quick meal prep routine', time: '+20m', when: 'Yesterday', icon: '🍳' },
    { id: 5, action: 'Optimized commute route', time: '+10m', when: '2 days ago', icon: '🚗' },
  ];

  // Milestones
  const milestones = [
    { id: 1, title: '1 Hour', reached: true, reward: '🎉' },
    { id: 2, title: '5 Hours', reached: true, reward: '⭐' },
    { id: 3, title: '10 Hours', reached: true, reward: '🏆' },
    { id: 4, title: '24 Hours', reached: false, reward: '👑', progress: 51 },
    { id: 5, title: '50 Hours', reached: false, reward: '💎', progress: 24 },
    { id: 6, title: '100 Hours', reached: false, reward: '🌟', progress: 12 },
  ];

  // Weekly breakdown
  const weeklyBreakdown = [
    { day: 'Mon', time: 45, label: '45m' },
    { day: 'Tue', time: 32, label: '32m' },
    { day: 'Wed', time: 55, label: '55m' },
    { day: 'Thu', time: 28, label: '28m' },
    { day: 'Fri', time: 0, label: '—' },
    { day: 'Sat', time: 0, label: '—' },
    { day: 'Sun', time: 0, label: '—' },
  ];

  const maxTime = Math.max(...weeklyBreakdown.map(d => d.time), 60);

  const currentStats = stats[selectedPeriod];

  return (
    <div className="min-h-screen bg-ios-bg pb-28 relative overflow-hidden">
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
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.5); }
        }
        .time-glow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>
      
      {/* Header */}
      <div className="px-5 pt-2 pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate?.('hub')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-[20px] font-bold text-slate-900">Time Saved</h1>
          <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform">
            <History className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Main Time Card */}
      <div className="px-5 mb-4">
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'linear-gradient(145deg, #10b981 0%, #059669 50%, #047857 100%)'
        }}>
          <div className="p-5">
            {/* Total Time */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-white/70 text-[13px] font-medium mb-1">Total Time Saved</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[44px] font-black text-white">{wallet.totalTimeSaved}</span>
                </div>
                <p className="text-white/60 text-[12px] mt-1">Avg {wallet.avgDaily}/day</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center time-glow">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 bg-white/15 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-[12px] text-white/70">Streak</span>
                </div>
                <span className="text-[22px] font-bold text-white">{wallet.streak} days</span>
              </div>
              <div className="flex-1 bg-white/15 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="text-[12px] text-white/70">Tasks</span>
                </div>
                <span className="text-[22px] font-bold text-white">{wallet.tasksCompleted}</span>
              </div>
            </div>

            {/* Share Button */}
            <button 
              onClick={() => setShowShareModal(true)}
              className="w-full py-3 rounded-xl bg-white/20 text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Share2 className="w-4 h-4" />
              Share Progress
            </button>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 shadow-sm'
              }`}
            >
              {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Context-Aware Quick Access */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate?.('plan')}
            className="ios-glass rounded-xl p-2.5 shadow-sm flex items-center gap-2 active:scale-95 transition-transform hover:bg-blue-50"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <p className="text-[12px] font-semibold text-slate-900">Plan</p>
          </button>
          
          <button
            onClick={() => onNavigate?.('challenges')}
            className="ios-glass rounded-xl p-2.5 shadow-sm flex items-center gap-2 active:scale-95 transition-transform hover:bg-orange-50"
          >
            <Trophy className="w-4 h-4 text-orange-600" />
            <p className="text-[12px] font-semibold text-slate-900">Challenges</p>
          </button>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="ios-glass rounded-xl p-3 text-center shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[20px] font-bold text-slate-900">{currentStats.saved}</span>
            <p className="text-[11px] text-slate-500">Time Saved</p>
          </div>
          <div className="ios-glass rounded-xl p-3 text-center shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-2">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-[20px] font-bold text-slate-900">{currentStats.tasks}</span>
            <p className="text-[11px] text-slate-500">Tasks Done</p>
          </div>
          <div className="ios-glass rounded-xl p-3 text-center shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[20px] font-bold text-slate-900">{currentStats.efficiency}%</span>
            <p className="text-[11px] text-slate-500">Efficiency</p>
          </div>
        </div>

        {/* Weekly Chart */}
        {selectedPeriod === 'week' && (
          <div className="ios-glass rounded-2xl p-4 shadow-sm slide-up">
            <h3 className="text-[14px] font-semibold text-slate-800 mb-4">This Week</h3>
            <div className="flex items-end justify-between gap-2 h-24">
              {weeklyBreakdown.map((day, index) => {
                const isToday = index === 3; // Thursday
                const height = day.time > 0 ? (day.time / maxTime) * 100 : 8;
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <span className={`text-[10px] font-medium ${day.time > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                      {day.label}
                    </span>
                    <div 
                      className={`w-full rounded-lg transition-all ${
                        day.time > 0 
                          ? isToday 
                            ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' 
                            : 'bg-gradient-to-t from-emerald-400 to-emerald-300'
                          : 'bg-slate-100'
                      }`}
                      style={{ height: `${height}%`, minHeight: '8px' }}
                    />
                    <span className={`text-[11px] font-medium ${isToday ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Milestones */}
        <div className="ios-glass rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-slate-800">Time Milestones</h3>
            <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
              {milestones.filter(m => m.reached).length}/{milestones.length} Unlocked
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {milestones.map((milestone) => (
              <div 
                key={milestone.id}
                className={`flex-shrink-0 w-[68px] text-center ${!milestone.reached ? 'opacity-60' : ''}`}
              >
                <div className={`w-13 h-13 mx-auto rounded-xl flex items-center justify-center text-xl mb-1.5 ${
                  milestone.reached 
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-md' 
                    : 'bg-slate-100 border-2 border-dashed border-slate-200 relative overflow-hidden'
                }`} style={{ width: '52px', height: '52px' }}>
                  {milestone.reached ? (
                    milestone.reward
                  ) : (
                    <>
                      <span className="relative z-10 text-slate-400">🔒</span>
                      {milestone.progress && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-400 to-emerald-300 opacity-50"
                          style={{ height: `${milestone.progress}%` }}
                        />
                      )}
                    </>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-slate-700">{milestone.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Savings */}
        <div>
          <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">Recent Savings</h3>
          <div className="space-y-2">
            {recentSavings.map((item, index) => (
              <div 
                key={item.id}
                className="ios-glass rounded-xl p-3 shadow-sm slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-slate-800 font-medium truncate">{item.action}</p>
                    <span className="text-[12px] text-slate-400">{item.when}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[13px] font-bold text-emerald-700">{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="ios-glass rounded-2xl p-4 shadow-sm">
          <h3 className="text-[14px] font-semibold text-slate-800 mb-3">How Time is Calculated</h3>
          <div className="space-y-2">
            {[
              { icon: '⚡', action: 'Complete tasks faster than estimated', example: 'Avg +5-15m' },
              { icon: '📦', action: 'Batch similar tasks together', example: 'Avg +10-20m' },
              { icon: '🔄', action: 'Auto-optimized scheduling', example: 'Avg +5-10m' },
              { icon: '🚗', action: 'Reduced travel/transitions', example: 'Avg +10-30m' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[13px] text-slate-700">{item.action}</span>
                </div>
                <span className="text-[12px] font-medium text-emerald-600">{item.example}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowShareModal(false)} 
          />
          <div className="relative w-full max-w-[390px] bg-white rounded-t-[24px] p-6 pb-10 shadow-2xl">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            
            <h2 className="text-[20px] font-bold text-slate-900 mb-1 text-center">Share Progress</h2>
            <p className="text-[13px] text-slate-500 mb-5 text-center">Show off your time savings!</p>

            {/* Preview Card */}
            <div className="rounded-2xl p-5 mb-5 text-center" style={{
              background: 'linear-gradient(145deg, #10b981 0%, #059669 100%)'
            }}>
              <p className="text-white/80 text-[13px] mb-1">I saved</p>
              <p className="text-[32px] font-black text-white">{currentStats.saved}</p>
              <p className="text-white/80 text-[13px] mt-1">this {selectedPeriod} with MYPA! 🎉</p>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-white text-[18px] font-bold">{currentStats.tasks}</p>
                  <p className="text-white/70 text-[11px]">Tasks</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <p className="text-white text-[18px] font-bold">🔥 {wallet.streak}</p>
                  <p className="text-white/70 text-[11px]">Streak</p>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: '📝', label: 'Daily Card', action: () => onNavigate?.('daily-life-card') },
                { icon: '👥', label: 'Circles', action: () => onNavigate?.('circles') },
                { icon: '📋', label: 'Copy', action: () => setShowShareModal(false) },
              ].map((opt, i) => (
                <button 
                  key={i}
                  onClick={opt.action}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-100 active:bg-slate-200 transition-colors"
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-[12px] font-medium text-slate-700">{opt.label}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full py-3.5 rounded-xl bg-slate-100 text-slate-700 text-[15px] font-semibold active:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
