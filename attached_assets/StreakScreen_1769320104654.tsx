import { ArrowLeft, Flame, Calendar, Trophy, Zap, Gift, Shield, Crown, Gem, Award, Check } from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";

interface StreakScreenProps {
  onNavigate?: (screen: string) => void;
}

// Icon components for milestones
const MilestoneIcons = {
  flame: Flame,
  gem: Gem,
  shield: Shield,
  trophy: Trophy,
  crown: Crown,
};

export function StreakScreen({ onNavigate }: StreakScreenProps) {
  const streakData = {
    currentStreak: 7,
    longestStreak: 23,
    totalDaysActive: 89,
    xpMultiplier: 1.5,
    nextMilestone: 14,
    daysToMilestone: 7,
  };

  // Calendar data for the month (showing last 28 days)
  const today = new Date();
  const calendarDays = Array.from({ length: 28 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (27 - i));
    const isActive = i >= 21; // Last 7 days active (current streak)
    const isToday = i === 27;
    return { date, isActive, isToday };
  });

  const milestones = [
    { days: 3, reward: '1.2x XP', icon: 'flame' as const, color: 'text-orange-500', achieved: true },
    { days: 7, reward: '1.5x XP', icon: 'flame' as const, color: 'text-orange-500', achieved: true, current: true },
    { days: 14, reward: '2x XP', icon: 'gem' as const, color: 'text-cyan-500', achieved: false },
    { days: 30, reward: 'Streak Shield', icon: 'shield' as const, color: 'text-blue-500', achieved: false },
    { days: 60, reward: 'Gold Badge', icon: 'trophy' as const, color: 'text-amber-500', achieved: false },
    { days: 100, reward: 'Legend Status', icon: 'crown' as const, color: 'text-yellow-500', achieved: false },
  ];

  const streakBenefits = [
    { icon: Zap, title: '1.5x XP Multiplier', desc: 'All tasks give 50% more XP', active: true },
    { icon: Gift, title: 'Daily Bonus Chest', desc: 'Unlocks at 14 days', active: false },
    { icon: Shield, title: 'Streak Shield', desc: 'Unlocks at 30 days', active: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50/30 pb-28 relative overflow-hidden">
      <IOSStatusBar />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-60 h-60 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-20 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-red-200/20 rounded-full blur-2xl" />
      </div>

      <div className="relative px-5 pt-14 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => onNavigate?.('hub')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">Your Streak</h1>
          <div className="w-10" />
        </div>

        {/* Main Streak Display */}
        <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-6 shadow-xl mb-6 overflow-hidden">
          {/* Animated fire background */}
          <div className="absolute inset-0 opacity-10 flex items-center justify-center">
            <Flame className="w-48 h-48 text-white" />
          </div>
          
          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <Zap className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">{streakData.xpMultiplier}x XP Active</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center animate-pulse">
                <Flame className="w-10 h-10 text-white" />
              </div>
              <span className="text-[72px] font-black text-white leading-none">{streakData.currentStreak}</span>
            </div>
            <p className="text-white/90 font-semibold text-lg">Day Streak!</p>
            
            <div className="mt-4 pt-4 border-t border-white/20 flex justify-around">
              <div className="text-center">
                <p className="text-white/70 text-xs mb-1">Longest</p>
                <p className="text-white font-bold text-lg">{streakData.longestStreak}</p>
              </div>
              <div className="text-center">
                <p className="text-white/70 text-xs mb-1">Total Days</p>
                <p className="text-white font-bold text-lg">{streakData.totalDaysActive}</p>
              </div>
              <div className="text-center">
                <p className="text-white/70 text-xs mb-1">To Next</p>
                <p className="text-white font-bold text-lg">{streakData.daysToMilestone}d</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Calendar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-slate-900">Activity This Month</h2>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-slate-400 mb-1">
                {day}
              </div>
            ))}
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                  day.isToday
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 scale-110'
                    : day.isActive
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                {day.isActive && <Flame className="w-3.5 h-3.5" />}
                {!day.isActive && day.date.getDate()}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-100" />
              <span className="text-[10px] text-slate-500">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-slate-50" />
              <span className="text-[10px] text-slate-500">Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-500 to-amber-500" />
              <span className="text-[10px] text-slate-500">Today</span>
            </div>
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900">Milestones</h2>
          </div>
          
          <div className="space-y-3">
            {milestones.map((milestone, i) => {
              const IconComponent = MilestoneIcons[milestone.icon];
              return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  milestone.current
                    ? 'bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300'
                    : milestone.achieved
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-slate-50 border border-slate-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  milestone.achieved ? 'bg-white shadow-sm' : 'bg-slate-100'
                }`}>
                  <IconComponent className={`w-5 h-5 ${milestone.achieved ? milestone.color : 'text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${milestone.achieved ? 'text-slate-900' : 'text-slate-500'}`}>
                      {milestone.days} Day Streak
                    </p>
                    {milestone.current && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-bold">
                        CURRENT
                      </span>
                    )}
                    {milestone.achieved && !milestone.current && (
                      <span className="text-green-500 text-xs">✓</span>
                    )}
                  </div>
                  <p className={`text-xs ${milestone.achieved ? 'text-slate-600' : 'text-slate-400'}`}>
                    Reward: {milestone.reward}
                  </p>
                </div>
                {!milestone.achieved && (
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-400">
                      {milestone.days - streakData.currentStreak}d left
                    </p>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>

        {/* Current Benefits */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-slate-900">Streak Benefits</h2>
          </div>
          
          <div className="space-y-3">
            {streakBenefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    benefit.active
                      ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
                      : 'bg-slate-50 border border-slate-100 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    benefit.active
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${benefit.active ? 'text-slate-900' : 'text-slate-500'}`}>
                      {benefit.title}
                    </p>
                    <p className="text-xs text-slate-500">{benefit.desc}</p>
                  </div>
                  {benefit.active && (
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-600 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
