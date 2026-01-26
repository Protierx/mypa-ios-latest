import { ArrowLeft, Star, Zap, Trophy, Target, TrendingUp, Gift, Lock, Sprout, Compass, Crown, Gem, Award, Check, CircleCheck, Flame, Users, Sunrise } from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";

interface LevelScreenProps {
  onNavigate?: (screen: string) => void;
}

// Icon mapping for tiers
const TierIcons = {
  sprout: Sprout,
  compass: Compass,
  star: Star,
  trophy: Trophy,
  gem: Gem,
  crown: Crown,
};

export function LevelScreen({ onNavigate }: LevelScreenProps) {
  const levelData = {
    currentLevel: 12,
    currentXP: 2460,
    xpForCurrentLevel: 2200,
    xpForNextLevel: 2800,
    totalXPEarned: 24600,
    rank: 'Rising Star',
    nextRank: 'Champion',
  };

  const xpProgress = ((levelData.currentXP - levelData.xpForCurrentLevel) / (levelData.xpForNextLevel - levelData.xpForCurrentLevel)) * 100;
  const xpToNext = levelData.xpForNextLevel - levelData.currentXP;

  // Level tiers
  const tiers = [
    { level: '1-5', name: 'Beginner', icon: 'sprout' as const, color: 'from-green-400 to-emerald-500', iconColor: 'text-emerald-500' },
    { level: '6-10', name: 'Explorer', icon: 'compass' as const, color: 'from-blue-400 to-cyan-500', iconColor: 'text-cyan-500' },
    { level: '11-15', name: 'Rising Star', icon: 'star' as const, color: 'from-violet-400 to-purple-500', iconColor: 'text-violet-500', current: true },
    { level: '16-25', name: 'Champion', icon: 'trophy' as const, color: 'from-amber-400 to-orange-500', iconColor: 'text-amber-500' },
    { level: '26-40', name: 'Master', icon: 'gem' as const, color: 'from-pink-400 to-rose-500', iconColor: 'text-pink-500' },
    { level: '41+', name: 'Legend', icon: 'crown' as const, color: 'from-yellow-400 to-amber-500', iconColor: 'text-yellow-500' },
  ];

  // Recent XP gains
  const recentXP = [
    { action: 'Completed Daily Tasks', xp: 150, time: '2h ago', icon: CircleCheck, color: 'text-green-500' },
    { action: '7-Day Streak Bonus', xp: 100, time: '5h ago', icon: Flame, color: 'text-orange-500' },
    { action: 'Circle Challenge Won', xp: 250, time: 'Yesterday', icon: Trophy, color: 'text-amber-500' },
    { action: 'Morning Routine', xp: 75, time: 'Yesterday', icon: Sunrise, color: 'text-pink-500' },
    { action: 'First Task of Day', xp: 50, time: 'Yesterday', icon: Zap, color: 'text-violet-500' },
  ];

  // Level rewards
  const levelRewards = [
    { level: 10, reward: 'Custom Themes', icon: Award, color: 'text-pink-500', unlocked: true },
    { level: 12, reward: 'Priority Support', icon: Users, color: 'text-violet-500', unlocked: true, current: true },
    { level: 15, reward: 'Circle Leader Badge', icon: Crown, color: 'text-amber-500', unlocked: false },
    { level: 20, reward: 'Unlimited Circles', icon: Target, color: 'text-blue-500', unlocked: false },
    { level: 25, reward: 'VIP Status', icon: Gem, color: 'text-cyan-500', unlocked: false },
  ];

  // XP earning methods
  const xpMethods = [
    { action: 'Complete a task', xp: '10-50', icon: Target },
    { action: 'Maintain streak', xp: '+50/day', icon: Zap },
    { action: 'Win challenges', xp: '100-500', icon: Trophy },
    { action: 'Help circle members', xp: '25-100', icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-purple-50/30 pb-28 relative overflow-hidden">
      <IOSStatusBar />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-60 h-60 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-20 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-indigo-200/20 rounded-full blur-2xl" />
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
          <h1 className="text-[17px] font-bold text-slate-900">Your Level</h1>
          <div className="w-10" />
        </div>

        {/* Main Level Display */}
        <div className="relative bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-3xl p-6 shadow-xl mb-6 overflow-hidden">
          {/* Animated star background */}
          <div className="absolute inset-0 opacity-10 flex items-center justify-center">
            <Star className="w-48 h-48 text-white" />
          </div>
          
          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <Star className="w-4 h-4 text-white fill-white" />
              <span className="text-white font-bold text-sm">{levelData.rank}</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Star className="w-8 h-8 text-white fill-white/50" />
              </div>
              <div>
                <span className="text-[72px] font-black text-white leading-none">{levelData.currentLevel}</span>
              </div>
            </div>
            <p className="text-white/90 font-semibold text-lg mb-4">Level {levelData.currentLevel}</p>
            
            {/* XP Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{levelData.currentXP.toLocaleString()} XP</span>
                <span>{levelData.xpForNextLevel.toLocaleString()} XP</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500 relative"
                  style={{ width: `${xpProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                </div>
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium">{xpToNext} XP to Level {levelData.currentLevel + 1}</p>
            
            <div className="mt-4 pt-4 border-t border-white/20 flex justify-around">
              <div className="text-center">
                <p className="text-white/70 text-xs mb-1">Total XP</p>
                <p className="text-white font-bold text-lg">{(levelData.totalXPEarned / 1000).toFixed(1)}K</p>
              </div>
              <div className="text-center">
                <p className="text-white/70 text-xs mb-1">This Week</p>
                <p className="text-white font-bold text-lg">+625</p>
              </div>
              <div className="text-center">
                <p className="text-white/70 text-xs mb-1">Multiplier</p>
                <p className="text-white font-bold text-lg">1.5x</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rank Tiers */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-violet-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-violet-500" />
            <h2 className="font-bold text-slate-900">Rank Progression</h2>
          </div>
          
          <div className="space-y-2">
            {tiers.map((tier, i) => {
              const IconComponent = TierIcons[tier.icon];
              return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  tier.current
                    ? 'bg-gradient-to-r from-violet-100 to-purple-100 border-2 border-violet-300'
                    : i < 2
                    ? 'bg-green-50/50 border border-green-100'
                    : 'bg-slate-50 border border-slate-100 opacity-60'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tier.current
                    ? `bg-gradient-to-br ${tier.color} shadow-lg`
                    : i < 2
                    ? 'bg-white shadow-sm'
                    : 'bg-slate-100'
                }`}>
                  <IconComponent className={`w-5 h-5 ${tier.current ? 'text-white' : i < 2 ? tier.iconColor : 'text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${tier.current || i < 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                      {tier.name}
                    </p>
                    {tier.current && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-500 text-white text-[9px] font-bold">
                        YOU
                      </span>
                    )}
                    {i < 2 && !tier.current && (
                      <span className="text-green-500 text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Level {tier.level}</p>
                </div>
                {i > 2 && (
                  <Lock className="w-4 h-4 text-slate-300" />
                )}
              </div>
            );
            })}
          </div>
        </div>

        {/* Recent XP Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-violet-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-900">Recent XP</h2>
            </div>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          
          <div className="space-y-2">
            {recentXP.map((item, i) => {
              const IconComponent = item.icon;
              return (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-violet-50/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <IconComponent className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-800">{item.action}</p>
                  <p className="text-[10px] text-slate-400">{item.time}</p>
                </div>
                <span className="text-sm font-bold text-green-500">+{item.xp}</span>
              </div>
            );
            })}
          </div>
        </div>

        {/* Level Rewards */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-violet-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-pink-500" />
            <h2 className="font-bold text-slate-900">Level Rewards</h2>
          </div>
          
          <div className="space-y-2">
            {levelRewards.map((reward, i) => {
              const IconComponent = reward.icon;
              return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  reward.current
                    ? 'bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200'
                    : reward.unlocked
                    ? 'bg-green-50/50 border border-green-100'
                    : 'bg-slate-50 border border-slate-100 opacity-60'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  reward.unlocked ? 'bg-white shadow-sm' : 'bg-slate-100'
                }`}>
                  <IconComponent className={`w-5 h-5 ${reward.unlocked ? reward.color : 'text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${reward.unlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                    {reward.reward}
                  </p>
                  <p className="text-xs text-slate-500">Level {reward.level}</p>
                </div>
                {reward.current && (
                  <span className="px-2 py-1 rounded-full bg-violet-500 text-white text-[10px] font-bold">
                    NEW
                  </span>
                )}
                {reward.unlocked && !reward.current && (
                  <span className="text-green-500 text-xs font-medium">Unlocked</span>
                )}
                {!reward.unlocked && (
                  <Lock className="w-4 h-4 text-slate-300" />
                )}
              </div>
            );
            })}
          </div>
        </div>

        {/* How to Earn XP */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-violet-100">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-violet-500" />
            <h2 className="font-bold text-slate-900">How to Earn XP</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {xpMethods.map((method, i) => {
              const Icon = method.icon;
              return (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500 text-white flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="font-medium text-xs text-slate-800">{method.action}</p>
                  <p className="text-violet-600 font-bold text-sm">{method.xp} XP</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
