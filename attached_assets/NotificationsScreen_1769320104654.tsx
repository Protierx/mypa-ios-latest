import { 
  ArrowLeft, 
  Bell, 
  BellOff,
  Clock,
  Calendar,
  Users,
  Trophy,
  MessageCircle,
  Zap,
  Moon,
  Volume2,
  Vibrate,
  ChevronRight
} from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { useState } from "react";

interface NotificationsScreenProps {
  onNavigate?: (screen: string) => void;
}

export function NotificationsScreen({ onNavigate }: NotificationsScreenProps) {
  // Master toggle
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Notification types
  const [taskReminders, setTaskReminders] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [calendarAlerts, setCalendarAlerts] = useState(true);
  const [circleUpdates, setCircleUpdates] = useState(true);
  const [challengeAlerts, setChallengeAlerts] = useState(true);
  const [nudges, setNudges] = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  
  // Quiet hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  
  // Delivery preferences
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [badgeEnabled, setBadgeEnabled] = useState(true);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-ios-bg pb-28">
      <IOSStatusBar />
      
      <style>{`
        .ios-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
        }
      `}</style>

      {/* Header */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate?.('profile')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-[24px] font-bold text-slate-900">Notifications</h1>
        </div>
      </div>

      <div className="px-5 space-y-5">
        
        {/* Master Toggle */}
        <div className="ios-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                notificationsEnabled 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                  : 'bg-slate-300'
              }`}>
                {notificationsEnabled ? (
                  <Bell className="w-6 h-6 text-white" />
                ) : (
                  <BellOff className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <p className="text-[17px] font-semibold text-slate-900">Allow Notifications</p>
                <p className="text-[13px] text-slate-500">
                  {notificationsEnabled ? 'Notifications are on' : 'All notifications are paused'}
                </p>
              </div>
            </div>
            <ToggleSwitch active={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} />
          </div>
        </div>

        {notificationsEnabled && (
          <>
            {/* Notification Types */}
            <div>
              <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
                Notification Types
              </h2>
              <div className="ios-card overflow-hidden shadow-sm">
                {/* Task Reminders */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      taskReminders ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-slate-300'
                    }`}>
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-slate-900">Task Reminders</p>
                      <p className="text-[12px] text-slate-500">Upcoming tasks & deadlines</p>
                    </div>
                  </div>
                  <ToggleSwitch active={taskReminders} onToggle={() => setTaskReminders(!taskReminders)} />
                </div>

                {/* Daily Briefing */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      dailyBriefing ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-slate-300'
                    }`}>
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-slate-900">Daily Briefing</p>
                      <p className="text-[12px] text-slate-500">Morning summary at 7:00 AM</p>
                    </div>
                  </div>
                  <ToggleSwitch active={dailyBriefing} onToggle={() => setDailyBriefing(!dailyBriefing)} />
                </div>

                {/* Calendar Alerts */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      calendarAlerts ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-slate-300'
                    }`}>
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-slate-900">Calendar Alerts</p>
                      <p className="text-[12px] text-slate-500">Event reminders</p>
                    </div>
                  </div>
                  <ToggleSwitch active={calendarAlerts} onToggle={() => setCalendarAlerts(!calendarAlerts)} />
                </div>

                {/* Circle Updates */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      circleUpdates ? 'bg-gradient-to-br from-pink-500 to-pink-600' : 'bg-slate-300'
                    }`}>
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-slate-900">Circle Updates</p>
                      <p className="text-[12px] text-slate-500">Posts, reactions & assignments</p>
                    </div>
                  </div>
                  <ToggleSwitch active={circleUpdates} onToggle={() => setCircleUpdates(!circleUpdates)} />
                </div>

                {/* Challenge Alerts */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      challengeAlerts ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-slate-300'
                    }`}>
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-slate-900">Challenges</p>
                      <p className="text-[12px] text-slate-500">Progress & completions</p>
                    </div>
                  </div>
                  <ToggleSwitch active={challengeAlerts} onToggle={() => setChallengeAlerts(!challengeAlerts)} />
                </div>

                {/* Nudges */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      nudges ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-slate-300'
                    }`}>
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-slate-900">Nudges</p>
                      <p className="text-[12px] text-slate-500">Motivational reminders</p>
                    </div>
                  </div>
                  <ToggleSwitch active={nudges} onToggle={() => setNudges(!nudges)} />
                </div>

                {/* Achievements */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      achievements ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-slate-300'
                    }`}>
                      <span className="text-[18px]">🏆</span>
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-slate-900">Achievements</p>
                      <p className="text-[12px] text-slate-500">Unlocks & milestones</p>
                    </div>
                  </div>
                  <ToggleSwitch active={achievements} onToggle={() => setAchievements(!achievements)} />
                </div>

                {/* Weekly Report */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      weeklyReport ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-slate-300'
                    }`}>
                      <span className="text-[18px]">📊</span>
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-slate-900">Weekly Report</p>
                      <p className="text-[12px] text-slate-500">Sunday summary email</p>
                    </div>
                  </div>
                  <ToggleSwitch active={weeklyReport} onToggle={() => setWeeklyReport(!weeklyReport)} />
                </div>
              </div>
            </div>

            {/* Quiet Hours */}
            <div>
              <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
                Quiet Hours
              </h2>
              <div className="ios-card overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      quietHoursEnabled ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-slate-300'
                    }`}>
                      <Moon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-slate-900">Quiet Hours</p>
                      <p className="text-[12px] text-slate-500">Pause notifications</p>
                    </div>
                  </div>
                  <ToggleSwitch active={quietHoursEnabled} onToggle={() => setQuietHoursEnabled(!quietHoursEnabled)} />
                </div>

                {quietHoursEnabled && (
                  <div className="p-4 bg-slate-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[14px] text-slate-600">From</span>
                      <input
                        type="time"
                        value={quietStart}
                        onChange={(e) => setQuietStart(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-[14px] font-medium text-slate-900"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-slate-600">To</span>
                      <input
                        type="time"
                        value={quietEnd}
                        onChange={(e) => setQuietEnd(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-[14px] font-medium text-slate-900"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">
                      Notifications will be silently delivered during quiet hours
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Preferences */}
            <div>
              <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
                Delivery
              </h2>
              <div className="ios-card overflow-hidden shadow-sm">
                {/* Sound */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      soundEnabled ? 'bg-gradient-to-br from-violet-500 to-violet-600' : 'bg-slate-300'
                    }`}>
                      <Volume2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-900">Sound</span>
                  </div>
                  <ToggleSwitch active={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
                </div>

                {/* Vibration */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      vibrationEnabled ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-slate-300'
                    }`}>
                      <Vibrate className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-900">Vibration</span>
                  </div>
                  <ToggleSwitch active={vibrationEnabled} onToggle={() => setVibrationEnabled(!vibrationEnabled)} />
                </div>

                {/* Badge */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      badgeEnabled ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-slate-300'
                    }`}>
                      <span className="text-[18px]">🔴</span>
                    </div>
                    <span className="text-[15px] font-medium text-slate-900">Badge Count</span>
                  </div>
                  <ToggleSwitch active={badgeEnabled} onToggle={() => setBadgeEnabled(!badgeEnabled)} />
                </div>

                {/* Preview */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      previewEnabled ? 'bg-gradient-to-br from-slate-500 to-slate-600' : 'bg-slate-300'
                    }`}>
                      <span className="text-[18px]">👁️</span>
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-slate-900">Show Previews</p>
                      <p className="text-[12px] text-slate-500">Show content on lock screen</p>
                    </div>
                  </div>
                  <ToggleSwitch active={previewEnabled} onToggle={() => setPreviewEnabled(!previewEnabled)} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* iOS Settings Link */}
        <button className="w-full ios-card p-4 shadow-sm flex items-center justify-between active:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-slate-900">iOS Notification Settings</p>
              <p className="text-[12px] text-slate-500">Open system settings</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>
      </div>
    </div>
  );
}
