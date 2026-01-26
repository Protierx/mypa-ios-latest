import { useState } from "react";
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  Plus, 
  Trophy, 
  Flame, 
  Target, 
  Clock,
  ChevronRight,
  Sparkles,
  Crown,
  Medal,
  Star,
  Zap,
  TrendingUp,
  Gift,
  Lock,
  ChevronDown,
  X,
  Check,
  Users,
  Calendar,
  Dumbbell,
  BookOpen,
  Smartphone,
  Droplets,
  Gem,
  Bird,
  Handshake,
  Heart,
  LucideIcon
} from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";

interface ChallengesScreenProps {
  onNavigate?: (screen: string) => void;
}

interface Challenge {
  id: number;
  name: string;
  icon: LucideIcon;
  iconColor: string;
  duration: string;
  daysLeft: number;
  totalDays: number;
  members: { name: string; initial: string; color: string; streak: number; rank: number }[];
  todayPrompt: string;
  progress: { completed: number; total: number };
  myStatus: 'pending' | 'completed' | 'missed';
  myStreak: number;
  bestStreak: number;
  category: 'fitness' | 'wellness' | 'learning' | 'productivity' | 'social';
  xpReward: number;
  stakes?: string;
}

export function ChallengesScreen({ onNavigate }: ChallengesScreenProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'leaderboard' | 'achievements'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedChallenge, setExpandedChallenge] = useState<number | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');

  // User stats
  const userStats = {
    totalXP: 4850,
    currentStreak: 7,
    longestStreak: 21,
    challengesWon: 8,
    rank: 3,
    totalMembers: 24,
    level: 12,
    nextLevelXP: 5000
  };

  // Leaderboard data
  const leaderboard = [
    { rank: 1, name: 'Sarah', initial: 'S', xp: 6240, streak: 21, wins: 12, isYou: false, movement: 'up' },
    { rank: 2, name: 'Mike', initial: 'M', xp: 5890, streak: 18, wins: 10, isYou: false, movement: 'same' },
    { rank: 3, name: 'You', initial: 'A', xp: 4850, streak: 7, wins: 8, isYou: true, movement: 'up' },
    { rank: 4, name: 'Emma', initial: 'E', xp: 4200, streak: 5, wins: 6, isYou: false, movement: 'down' },
    { rank: 5, name: 'Jake', initial: 'J', xp: 3950, streak: 4, wins: 5, isYou: false, movement: 'up' },
    { rank: 6, name: 'Lily', initial: 'L', xp: 3400, streak: 3, wins: 4, isYou: false, movement: 'same' },
  ];

  // Achievements
  const achievements = [
    { id: 1, name: 'First Blood', icon: Target, color: 'text-blue-500', description: 'Complete your first challenge', unlocked: true, xp: 100 },
    { id: 2, name: 'Streak Master', icon: Flame, color: 'text-orange-500', description: '7-day streak', unlocked: true, xp: 250 },
    { id: 3, name: 'Consistency King', icon: Crown, color: 'text-amber-500', description: '21-day streak', unlocked: false, xp: 500, progress: 7, total: 21 },
    { id: 4, name: 'Social Butterfly', icon: Heart, color: 'text-pink-500', description: 'Join 5 group challenges', unlocked: true, xp: 150 },
    { id: 5, name: 'Early Bird', icon: Bird, color: 'text-sky-500', description: 'Submit proof before 8 AM for 7 days', unlocked: false, xp: 300, progress: 3, total: 7 },
    { id: 6, name: 'Champion', icon: Trophy, color: 'text-yellow-500', description: 'Win 10 challenges', unlocked: false, xp: 1000, progress: 8, total: 10 },
    { id: 7, name: 'Perfectionist', icon: Gem, color: 'text-cyan-500', description: '100% completion rate for a month', unlocked: false, xp: 750, progress: 89, total: 100 },
    { id: 8, name: 'Team Player', icon: Handshake, color: 'text-emerald-500', description: 'Help 5 friends complete challenges', unlocked: true, xp: 200 },
  ];

  const [activeChallenges] = useState<Challenge[]>([
    {
      id: 1,
      name: 'Morning Workout',
      icon: Dumbbell,
      iconColor: 'text-rose-500',
      duration: '30 days',
      daysLeft: 18,
      totalDays: 30,
      members: [
        { name: 'You', initial: 'A', color: 'from-violet-400 to-violet-600', streak: 7, rank: 1 },
        { name: 'Sarah', initial: 'S', color: 'from-rose-400 to-rose-600', streak: 6, rank: 2 },
        { name: 'Mike', initial: 'M', color: 'from-blue-400 to-blue-600', streak: 5, rank: 3 },
        { name: 'Emma', initial: 'E', color: 'from-green-400 to-green-600', streak: 4, rank: 4 },
        { name: 'Jake', initial: 'J', color: 'from-amber-400 to-amber-600', streak: 3, rank: 5 },
      ],
      todayPrompt: 'Post your workout proof by 10 AM',
      progress: { completed: 3, total: 5 },
      myStatus: 'pending',
      myStreak: 7,
      bestStreak: 12,
      category: 'fitness',
      xpReward: 50,
      stakes: '$5 per miss'
    },
    {
      id: 2,
      name: 'Daily Reading',
      icon: BookOpen,
      iconColor: 'text-blue-500',
      duration: '14 days',
      daysLeft: 6,
      totalDays: 14,
      members: [
        { name: 'You', initial: 'A', color: 'from-violet-400 to-violet-600', streak: 14, rank: 1 },
        { name: 'Lily', initial: 'L', color: 'from-pink-400 to-pink-600', streak: 10, rank: 2 },
        { name: 'Tom', initial: 'T', color: 'from-teal-400 to-teal-600', streak: 8, rank: 3 },
      ],
      todayPrompt: 'Share what you read today',
      progress: { completed: 3, total: 3 },
      myStatus: 'completed',
      myStreak: 14,
      bestStreak: 14,
      category: 'learning',
      xpReward: 30
    },
    {
      id: 3,
      name: 'No Phone After 9PM',
      icon: Smartphone,
      iconColor: 'text-violet-500',
      duration: '7 days',
      daysLeft: 3,
      totalDays: 7,
      members: [
        { name: 'You', initial: 'A', color: 'from-violet-400 to-violet-600', streak: 4, rank: 2 },
        { name: 'Kate', initial: 'K', color: 'from-orange-400 to-orange-600', streak: 5, rank: 1 },
      ],
      todayPrompt: 'Screenshot your screen time',
      progress: { completed: 1, total: 2 },
      myStatus: 'pending',
      myStreak: 4,
      bestStreak: 4,
      category: 'wellness',
      xpReward: 25
    },
  ]);

  const invites = [
    {
      id: 1,
      name: 'Hydration Challenge',
      icon: Droplets,
      iconColor: 'text-cyan-500',
      inviter: 'Sarah',
      duration: '7 days',
      members: 4,
      xpReward: 200,
    },
  ];

  const getCategoryGradient = (category: Challenge['category']) => {
    switch (category) {
      case 'fitness': return 'from-rose-500 to-orange-500';
      case 'wellness': return 'from-violet-500 to-purple-500';
      case 'learning': return 'from-blue-500 to-indigo-500';
      case 'productivity': return 'from-amber-500 to-yellow-500';
      case 'social': return 'from-emerald-500 to-teal-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-100' };
    if (rank === 2) return { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-100' };
    if (rank === 3) return { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-50' };
    return { icon: Star, color: 'text-slate-400', bg: 'bg-slate-50' };
  };

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
          0%, 100% { box-shadow: 0 0 20px rgba(251, 146, 60, 0.3); }
          50% { box-shadow: 0 0 30px rgba(251, 146, 60, 0.5); }
        }
        .streak-glow { animation: pulse-glow 2s ease-in-out infinite; }
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .bounce-in { animation: bounce-in 0.4s ease-out forwards; }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-20px) rotate(180deg); opacity: 0; }
        }
        .confetti { animation: confetti 0.6s ease-out forwards; }
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
          <h1 className="text-[20px] font-bold text-slate-900">Challenges</h1>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="px-5 mb-4">
        <div className="ios-glass rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            {/* XP & Level */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center streak-glow">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[24px] font-black text-slate-900">{userStats.currentStreak}</span>
                  <span className="text-[14px] text-slate-500">day streak</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-[13px] font-semibold text-violet-600">{userStats.totalXP} XP</span>
                  <span className="text-[11px] text-slate-400">• Lvl {userStats.level}</span>
                </div>
              </div>
            </div>
            
            {/* Rank Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-[20px] font-bold text-slate-900">#{userStats.rank}</span>
                </div>
                <span className="text-[11px] text-slate-500">of {userStats.totalMembers}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
          
          {/* XP Progress */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-500">Level {userStats.level} → {userStats.level + 1}</span>
              <span className="text-[11px] font-medium text-violet-600">{userStats.nextLevelXP - userStats.totalXP} XP to go</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                style={{ width: `${(userStats.totalXP / userStats.nextLevelXP) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'active', label: 'Active', icon: Target },
            { id: 'leaderboard', label: 'Rankings', icon: Trophy },
            { id: 'achievements', label: 'Badges', icon: Medal },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
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
            <p className="text-[12px] font-semibold text-slate-900">My Plan</p>
          </button>
          
          <button
            onClick={() => onNavigate?.('wallet')}
            className="ios-glass rounded-xl p-2.5 shadow-sm flex items-center gap-2 active:scale-95 transition-transform hover:bg-emerald-50"
          >
            <Zap className="w-4 h-4 text-emerald-600" />
            <p className="text-[12px] font-semibold text-slate-900">View Rewards</p>
          </button>
        </div>
      </div>

      <div className="px-5">
        {/* Active Challenges Tab */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {/* Invites */}
            {invites.length > 0 && (
              <div className="ios-glass rounded-2xl p-4 shadow-sm border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span className="text-[13px] font-semibold text-amber-700">New Challenge Invite</span>
                </div>
                {invites.map(invite => (
                  <div key={invite.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <invite.icon className={`w-6 h-6 ${invite.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-slate-900">{invite.name}</p>
                        <p className="text-[12px] text-slate-500">{invite.inviter} • {invite.members} members • +{invite.xpReward} XP</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-2 rounded-xl bg-white text-slate-600 text-[13px] font-medium shadow-sm active:scale-95 transition-transform">
                        <X className="w-4 h-4" />
                      </button>
                      <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[13px] font-medium active:scale-95 transition-transform">
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Challenge Cards */}
            {activeChallenges.map((challenge, index) => (
              <div
                key={challenge.id}
                className="ios-glass rounded-2xl shadow-sm overflow-hidden slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Challenge Header */}
                <div className={`p-4 bg-gradient-to-r ${getCategoryGradient(challenge.category)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <challenge.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-[17px] font-bold text-white">{challenge.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[12px] text-white/80">{challenge.daysLeft} days left</span>
                          <span className="text-[12px] text-white/60">•</span>
                          <span className="text-[12px] text-white/80">+{challenge.xpReward} XP/day</span>
                        </div>
                      </div>
                    </div>
                    {challenge.myStatus === 'completed' ? (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5">
                        <Flame className="w-4 h-4 text-white" />
                        <span className="text-[14px] font-bold text-white">{challenge.myStreak}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-white/70 mb-1">
                      <span>Day {challenge.totalDays - challenge.daysLeft}</span>
                      <span>{Math.round((1 - challenge.daysLeft / challenge.totalDays) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full"
                        style={{ width: `${(1 - challenge.daysLeft / challenge.totalDays) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Challenge Body */}
                <div className="p-4">
                  {/* Today's Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-[13px] text-slate-600">{challenge.todayPrompt}</span>
                    </div>
                    <span className="text-[12px] font-medium text-slate-500">{challenge.progress.completed}/{challenge.progress.total} done</span>
                  </div>

                  {/* Mini Leaderboard */}
                  <button
                    onClick={() => setExpandedChallenge(expandedChallenge === challenge.id ? null : challenge.id)}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-slate-700">Challenge Leaderboard</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedChallenge === challenge.id ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      {challenge.members.slice(0, 5).map((member, i) => (
                        <div key={i} className="relative">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-[12px] font-semibold border-2 ${member.name === 'You' ? 'border-violet-400' : 'border-white'}`}>
                            {member.initial}
                          </div>
                          {member.rank <= 3 && (
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                              member.rank === 1 ? 'bg-amber-400 text-amber-900' : 
                              member.rank === 2 ? 'bg-slate-300 text-slate-700' : 
                              'bg-amber-200 text-amber-800'
                            }`}>
                              {member.rank}
                            </div>
                          )}
                        </div>
                      ))}
                      {challenge.members.length > 5 && (
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-600">
                          +{challenge.members.length - 5}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Expanded Leaderboard */}
                  {expandedChallenge === challenge.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {challenge.members.map((member, i) => (
                        <div key={i} className={`flex items-center justify-between p-2 rounded-xl ${member.name === 'You' ? 'bg-violet-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-6 text-[13px] font-bold ${member.rank <= 3 ? 'text-amber-600' : 'text-slate-400'}`}>#{member.rank}</span>
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-[11px] font-semibold`}>
                              {member.initial}
                            </div>
                            <span className={`text-[14px] font-medium ${member.name === 'You' ? 'text-violet-700' : 'text-slate-700'}`}>
                              {member.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-orange-500">
                            <Flame className="w-4 h-4" />
                            <span className="text-[14px] font-bold">{member.streak}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stakes Badge */}
                  {challenge.stakes && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-xl">
                      <span className="text-[12px]">💰</span>
                      <span className="text-[12px] font-medium text-rose-700">{challenge.stakes}</span>
                    </div>
                  )}

                  {/* Action Button */}
                  {challenge.myStatus === 'pending' ? (
                    <button 
                      onClick={() => onNavigate?.('proof-camera')}
                      className="w-full mt-4 py-3 rounded-xl bg-slate-900 text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <Camera className="w-5 h-5" />
                      Submit Proof
                    </button>
                  ) : (
                    <div className="mt-4 py-3 rounded-xl bg-emerald-100 text-emerald-700 text-[15px] font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Completed for today! +{challenge.xpReward} XP
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {/* Timeframe Selector */}
            <div className="flex gap-2">
              {[
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setSelectedTimeframe(tf.id as any)}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all ${
                    selectedTimeframe === tf.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 shadow-sm'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Top 3 Podium */}
            <div className="ios-glass rounded-2xl p-4 shadow-sm">
              <div className="flex items-end justify-center gap-3 mb-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-[20px] font-bold border-4 border-slate-200 mb-2">
                    {leaderboard[1].initial}
                  </div>
                  <Medal className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-[13px] font-semibold text-slate-700">{leaderboard[1].name}</span>
                  <span className="text-[11px] text-slate-500">{leaderboard[1].xp} XP</span>
                  <div className="h-16 w-20 bg-slate-200 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-[24px] font-black text-slate-400">2</span>
                  </div>
                </div>
                
                {/* 1st Place */}
                <div className="flex flex-col items-center -mt-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[24px] font-bold border-4 border-amber-300 mb-2 shadow-lg shadow-amber-500/30">
                    {leaderboard[0].initial}
                  </div>
                  <Crown className="w-7 h-7 text-amber-500 mb-1" />
                  <span className="text-[14px] font-bold text-slate-900">{leaderboard[0].name}</span>
                  <span className="text-[12px] text-amber-600 font-medium">{leaderboard[0].xp} XP</span>
                  <div className="h-24 w-24 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-[32px] font-black text-amber-700">1</span>
                  </div>
                </div>
                
                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${leaderboard[2].isYou ? 'from-violet-400 to-purple-500 border-violet-300' : 'from-amber-200 to-amber-300 border-amber-200'} flex items-center justify-center text-white text-[20px] font-bold border-4 mb-2`}>
                    {leaderboard[2].initial}
                  </div>
                  <Medal className="w-6 h-6 text-amber-600 mb-1" />
                  <span className={`text-[13px] font-semibold ${leaderboard[2].isYou ? 'text-violet-700' : 'text-slate-700'}`}>{leaderboard[2].name}</span>
                  <span className="text-[11px] text-slate-500">{leaderboard[2].xp} XP</span>
                  <div className={`h-12 w-20 ${leaderboard[2].isYou ? 'bg-violet-200' : 'bg-amber-100'} rounded-t-lg mt-2 flex items-center justify-center`}>
                    <span className={`text-[24px] font-black ${leaderboard[2].isYou ? 'text-violet-400' : 'text-amber-400'}`}>3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Leaderboard */}
            <div className="ios-glass rounded-2xl shadow-sm overflow-hidden">
              {leaderboard.slice(3).map((player, index) => (
                <div 
                  key={player.rank}
                  className={`flex items-center justify-between p-4 ${index > 0 ? 'border-t border-slate-100' : ''} ${player.isYou ? 'bg-violet-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-[15px] font-bold text-slate-400">#{player.rank}</span>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${player.isYou ? 'from-violet-400 to-purple-500' : 'from-slate-300 to-slate-400'} flex items-center justify-center text-white text-[14px] font-bold`}>
                      {player.initial}
                    </div>
                    <div>
                      <p className={`text-[15px] font-semibold ${player.isYou ? 'text-violet-700' : 'text-slate-800'}`}>{player.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-500">{player.xp} XP</span>
                        <span className="text-[12px] text-slate-400">•</span>
                        <span className="text-[12px] text-orange-500">{player.streak}🔥</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {player.movement === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    {player.movement === 'down' && <TrendingUp className="w-4 h-4 text-rose-500 rotate-180" />}
                    <span className="text-[13px] font-medium text-slate-500">{player.wins} wins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-3">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="ios-glass rounded-xl p-3 text-center shadow-sm">
                <span className="text-[20px] font-bold text-emerald-600">{achievements.filter(a => a.unlocked).length}</span>
                <p className="text-[10px] text-slate-500">Unlocked</p>
              </div>
              <div className="ios-glass rounded-xl p-3 text-center shadow-sm">
                <span className="text-[20px] font-bold text-slate-400">{achievements.filter(a => !a.unlocked).length}</span>
                <p className="text-[10px] text-slate-500">Locked</p>
              </div>
              <div className="ios-glass rounded-xl p-3 text-center shadow-sm">
                <span className="text-[20px] font-bold text-violet-600">{achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0)}</span>
                <p className="text-[10px] text-slate-500">XP Earned</p>
              </div>
            </div>

            {/* Achievement Cards */}
            {achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className={`ios-glass rounded-2xl p-4 shadow-sm slide-up ${!achievement.unlocked ? 'opacity-70' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100' 
                      : 'bg-slate-100'
                  }`}>
                    {achievement.unlocked ? <achievement.icon className={`w-7 h-7 ${achievement.color}`} /> : <Lock className="w-6 h-6 text-slate-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-[15px] font-semibold ${achievement.unlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                        {achievement.name}
                      </h3>
                      {achievement.unlocked && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5">{achievement.description}</p>
                    
                    {/* Progress bar for locked achievements */}
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{achievement.progress}/{achievement.total}</span>
                          <span>{Math.round((achievement.progress / achievement.total!) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-400 to-purple-400 rounded-full"
                            style={{ width: `${(achievement.progress / achievement.total!) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg ${achievement.unlocked ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <span className={`text-[12px] font-bold ${achievement.unlocked ? 'text-emerald-700' : 'text-slate-500'}`}>
                      +{achievement.xp} XP
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowCreateModal(false)} 
          />
          <div className="relative w-full max-w-[390px] bg-white rounded-t-[24px] p-6 pb-10 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            
            <h2 className="text-[20px] font-bold text-slate-900 mb-1">Create Challenge</h2>
            <p className="text-[13px] text-slate-500 mb-5">Start a competition with friends</p>

            {/* Challenge Name */}
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">Name</label>
              <input 
                type="text"
                placeholder="e.g., Morning Workout"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 outline-none text-slate-900 placeholder-slate-400 text-[15px]"
              />
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">Duration</label>
              <div className="flex gap-2">
                {['7 days', '14 days', '21 days', '30 days'].map((duration) => (
                  <button
                    key={duration}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 text-[13px] font-medium text-slate-700 active:bg-slate-200 transition-colors"
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Fitness', icon: Dumbbell, color: 'text-rose-500' },
                  { name: 'Wellness', icon: Heart, color: 'text-violet-500' },
                  { name: 'Learning', icon: BookOpen, color: 'text-blue-500' },
                  { name: 'Productivity', icon: Zap, color: 'text-amber-500' },
                  { name: 'Social', icon: Users, color: 'text-emerald-500' }
                ].map((cat) => (
                  <button
                    key={cat.name}
                    className="px-3 py-2 rounded-xl bg-slate-100 text-[13px] font-medium text-slate-700 active:bg-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <cat.icon className={`w-4 h-4 ${cat.color}`} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Stakes (Optional) */}
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">Stakes (Optional)</label>
              <div className="flex gap-2">
                {['None', '$1/miss', '$5/miss', 'Custom'].map((stake) => (
                  <button
                    key={stake}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 text-[13px] font-medium text-slate-700 active:bg-slate-200 transition-colors"
                  >
                    {stake}
                  </button>
                ))}
              </div>
            </div>

            {/* XP Reward */}
            <div className="mb-6">
              <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">Daily XP Reward</label>
              <div className="flex items-center gap-4 px-4 py-3 bg-violet-50 rounded-xl">
                <Zap className="w-5 h-5 text-violet-500" />
                <span className="text-[15px] font-semibold text-violet-700">+50 XP per day completed</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-700 text-[15px] font-semibold active:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3.5 rounded-xl bg-slate-900 text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
              >
                Create & Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
