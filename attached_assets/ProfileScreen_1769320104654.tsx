import { Users, ChevronRight, Settings, Bell, Lock, HelpCircle, LogOut, TrendingUp, Award, Flame, Crown, Star } from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState } from "react";

interface ProfileScreenProps {
  onNavigate?: (screen: string) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // User stats and achievements
  const userStats = {
    level: 12,
    xp: 2460,
    xpToNext: 340,
    streak: 12,
    timeSaved: '14h',
    challengesWon: 8,
    circlesJoined: 3,
  };

  const achievements = [
    { id: 1, name: 'Early Bird', emoji: '🌅', description: 'Complete 7 tasks before 9 AM', unlocked: true },
    { id: 2, name: 'Streak Master', emoji: '🔥', description: 'Maintain a 14-day streak', unlocked: true },
    { id: 3, name: 'Time Lord', emoji: '⏰', description: 'Save 10+ hours', unlocked: true },
    { id: 4, name: 'Social Butterfly', emoji: '🦋', description: 'Join 5 circles', unlocked: false, progress: 60 },
    { id: 5, name: 'Challenge Champion', emoji: '🏆', description: 'Win 10 challenges', unlocked: false, progress: 80 },
    { id: 6, name: 'Zen Master', emoji: '🧘', description: 'Complete all daily goals for a month', unlocked: false, progress: 40 },
  ];

  return (
    <div className="min-h-screen bg-ios-bg pb-28">
      <IOSStatusBar />
      
      {/* Header */}
      <div className="px-5 pt-2 pb-3 relative z-10">
        <p className="text-[12px] text-slate-500 font-medium">Your Account</p>
        <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">Profile</h1>
      </div>

      <div className="px-5 space-y-4 relative z-10">
        {/* User Card - Clean white card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">A</span>
              </div>
              {/* Level Badge */}
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-bold border-2 border-white">
                {userStats.level}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-[20px] font-bold text-slate-900">Alex</h2>
              <p className="text-[13px] text-slate-500">alex@email.com</p>
            </div>
            <button 
              onClick={() => onNavigate?.('edit-profile')}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-[13px] font-medium active:scale-95 transition-transform"
            >
              Edit
            </button>
          </div>

          {/* XP Progress */}
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-slate-600 font-medium">Level {userStats.level}</span>
              <span className="text-[12px] text-violet-600 font-medium">{userStats.xpToNext} XP to next</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                style={{ width: `${((userStats.xp % 500) / 500) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => onNavigate?.('streak')} className="bg-white rounded-2xl p-3 shadow-sm text-center active:scale-95 transition-transform">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-[18px] font-bold text-slate-900">{userStats.streak}</p>
            <p className="text-[10px] text-slate-500">Streak</p>
          </button>
          <button onClick={() => onNavigate?.('circles')} className="bg-white rounded-2xl p-3 shadow-sm text-center active:scale-95 transition-transform">
            <Users className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-[18px] font-bold text-slate-900">{userStats.circlesJoined}</p>
            <p className="text-[10px] text-slate-500">Circles</p>
          </button>
          <button onClick={() => onNavigate?.('wallet')} className="bg-white rounded-2xl p-3 shadow-sm text-center active:scale-95 transition-transform">
            <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-[18px] font-bold text-slate-900">{userStats.timeSaved}</p>
            <p className="text-[10px] text-slate-500">Saved</p>
          </button>
          <button onClick={() => onNavigate?.('challenges')} className="bg-white rounded-2xl p-3 shadow-sm text-center active:scale-95 transition-transform">
            <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-[18px] font-bold text-slate-900">{userStats.challengesWon}</p>
            <p className="text-[10px] text-slate-500">Wins</p>
          </button>
        </div>

        {/* Achievements */}
        <button 
          onClick={() => setShowAchievements(true)}
          className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-transform"
        >
          <div className="flex -space-x-2">
            {achievements.filter(a => a.unlocked).slice(0, 3).map(a => (
              <div key={a.id} className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg border-2 border-white">
                {a.emoji}
              </div>
            ))}
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-slate-900">{achievements.filter(a => a.unlocked).length} Achievements</p>
            <p className="text-[12px] text-slate-500">{achievements.length - achievements.filter(a => a.unlocked).length} more to unlock</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Settings */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {[
            { id: 'privacy-controls', label: 'Privacy Controls', icon: Lock, color: 'from-purple-500 to-purple-600' },
            { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-orange-400 to-orange-500' },
            { id: 'settings', label: 'App Settings', icon: Settings, color: 'from-slate-500 to-slate-600' },
            { id: 'help', label: 'Help & Support', icon: HelpCircle, color: 'from-emerald-500 to-emerald-600' },
          ].map((item, index, arr) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={`w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors ${
                  index < arr.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-[15px] font-medium text-slate-900">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3.5 rounded-2xl bg-white text-red-500 text-[15px] font-semibold shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>

        <p className="text-[11px] text-slate-400 text-center pb-2">MYPA v1.0.0</p>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-[20px] font-bold text-slate-800 mb-2">Log out?</h3>
                <p className="text-[14px] text-slate-500">Are you sure you want to log out of MYPA?</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3.5 rounded-full bg-slate-100 text-slate-700 text-[15px] font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    // In real app: clear auth state and redirect to login
                    onNavigate?.('hub');
                  }}
                  className="flex-1 py-3.5 rounded-full bg-red-500 text-white text-[15px] font-semibold hover:bg-red-600 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowAchievements(false)} />
          <div className="fixed inset-0 flex items-end z-50 pointer-events-none">
            <div className="w-full bg-white rounded-t-3xl p-6 pointer-events-auto max-h-[80vh] overflow-y-auto" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
              <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-slate-800">Achievements</h2>
                  <p className="text-[13px] text-slate-500">{achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked</p>
                </div>
              </div>

              <div className="space-y-3">
                {achievements.map(achievement => (
                  <div 
                    key={achievement.id} 
                    className={`rounded-2xl p-4 border ${achievement.unlocked ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                        achievement.unlocked 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30' 
                          : 'bg-slate-200'
                      }`}>
                        {achievement.unlocked ? achievement.emoji : '🔒'}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-[15px] font-semibold ${achievement.unlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                          {achievement.name}
                        </h3>
                        <p className="text-[13px] text-slate-500">{achievement.description}</p>
                        {!achievement.unlocked && achievement.progress && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                                style={{ width: `${achievement.progress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{achievement.progress}% complete</p>
                          </div>
                        )}
                      </div>
                      {achievement.unlocked && (
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowAchievements(false)}
                className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}