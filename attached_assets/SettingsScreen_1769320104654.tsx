import { 
  ArrowLeft, 
  Bell, 
  MapPin, 
  Calendar, 
  Mail, 
  Smartphone, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX,
  Vibrate,
  Battery,
  Wifi,
  Shield,
  Eye,
  Clock,
  Globe,
  Palette,
  Type,
  ChevronRight,
  Check,
  X,
  Zap,
  Cloud,
  RefreshCw,
  Trash2,
  Download,
  HardDrive
} from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { useState } from "react";

interface SettingsScreenProps {
  onNavigate?: (screen: string) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  // Integrations State
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(true);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [appleCalendarConnected, setAppleCalendarConnected] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(true);
  const [outlookMailConnected, setOutlookMailConnected] = useState(false);

  // Notifications & Focus State  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [focusModeAccess, setFocusModeAccess] = useState(true);

  // App Preferences
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Auto');

  // Data & Storage
  const [cacheSize, setCacheSize] = useState('124 MB');
  const [lastSync, setLastSync] = useState('2 minutes ago');

  const handleClearCache = () => {
    setCacheSize('0 MB');
  };

  const handleSyncNow = () => {
    setLastSync('Just now');
  };

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
        .toggle-switch {
          transition: background-color 0.2s ease;
        }
        .toggle-switch.active {
          background-color: #8b5cf6;
        }
        .toggle-knob {
          transition: transform 0.2s ease;
        }
        .toggle-switch.active .toggle-knob {
          transform: translateX(20px);
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
          <h1 className="text-[24px] font-bold text-slate-900">App Settings</h1>
        </div>
      </div>

      <div className="px-5 space-y-5">
        
        {/* Integrations Section */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Connected Services
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            {/* Google Calendar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Google Calendar</p>
                  <p className="text-[12px] text-slate-500">Sync events & reminders</p>
                </div>
              </div>
              <ToggleSwitch active={googleCalendarConnected} onToggle={() => setGoogleCalendarConnected(!googleCalendarConnected)} />
            </div>

            {/* Apple Calendar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Apple Calendar</p>
                  <p className="text-[12px] text-slate-500">iCloud calendar sync</p>
                </div>
              </div>
              <ToggleSwitch active={appleCalendarConnected} onToggle={() => setAppleCalendarConnected(!appleCalendarConnected)} />
            </div>

            {/* Outlook Calendar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Outlook Calendar</p>
                  <p className="text-[12px] text-slate-500">Microsoft 365 sync</p>
                </div>
              </div>
              <ToggleSwitch active={outlookConnected} onToggle={() => setOutlookConnected(!outlookConnected)} />
            </div>

            {/* Gmail */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-md">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Gmail</p>
                  <p className="text-[12px] text-emerald-600 font-medium">Connected • khalid@gmail.com</p>
                </div>
              </div>
              <ToggleSwitch active={gmailConnected} onToggle={() => setGmailConnected(!gmailConnected)} />
            </div>

            {/* Outlook Mail */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Outlook Mail</p>
                  <p className="text-[12px] text-slate-500">Not connected</p>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[12px] font-semibold">
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Notifications & Focus */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Notifications
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            {/* Notifications */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${notificationsEnabled ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-slate-300'}`}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Push Notifications</p>
                  <p className="text-[12px] text-slate-500">Reminders, updates & nudges</p>
                </div>
              </div>
              <ToggleSwitch active={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} />
            </div>

            {/* Focus Mode */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${focusModeAccess ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-slate-300'}`}>
                  <Moon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Focus Mode</p>
                  <p className="text-[12px] text-slate-500">Respect Do Not Disturb</p>
                </div>
              </div>
              <ToggleSwitch active={focusModeAccess} onToggle={() => setFocusModeAccess(!focusModeAccess)} />
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Privacy & Data
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            <button 
              onClick={() => onNavigate?.('privacy-controls')}
              className="flex items-center justify-between p-4 w-full active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-medium text-slate-900">Privacy Controls</p>
                  <p className="text-[12px] text-slate-500">Permissions, data access & sharing</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Saved Places */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Location Intelligence
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            <button 
              onClick={() => onNavigate?.('saved-places')}
              className="flex items-center justify-between p-4 w-full active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-medium text-slate-900">Saved Places</p>
                  <p className="text-[12px] text-slate-500">Home, work, gym & more</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <p className="text-[12px] text-slate-500 mt-2 px-1">MYPA uses your saved places for smart ETAs and location-aware reminders</p>
        </div>

        {/* App Preferences */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Preferences
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            {/* Sound */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${soundEnabled ? 'bg-gradient-to-br from-violet-500 to-violet-600' : 'bg-slate-300'}`}>
                  {soundEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Sound Effects</p>
                  <p className="text-[12px] text-slate-500">Task completion sounds</p>
                </div>
              </div>
              <ToggleSwitch active={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
            </div>

            {/* Haptic Feedback */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${hapticFeedback ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-slate-300'}`}>
                  <Vibrate className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Haptic Feedback</p>
                  <p className="text-[12px] text-slate-500">Vibration on actions</p>
                </div>
              </div>
              <ToggleSwitch active={hapticFeedback} onToggle={() => setHapticFeedback(!hapticFeedback)} />
            </div>

            {/* Auto Sync */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${autoSync ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-slate-300'}`}>
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Auto Sync</p>
                  <p className="text-[12px] text-slate-500">Sync data automatically</p>
                </div>
              </div>
              <ToggleSwitch active={autoSync} onToggle={() => setAutoSync(!autoSync)} />
            </div>

            {/* Low Power Mode */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${lowPowerMode ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 'bg-slate-300'}`}>
                  <Battery className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Low Power Mode</p>
                  <p className="text-[12px] text-slate-500">Reduce animations & sync</p>
                </div>
              </div>
              <ToggleSwitch active={lowPowerMode} onToggle={() => setLowPowerMode(!lowPowerMode)} />
            </div>

            {/* Language */}
            <button className="w-full flex items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Language</p>
                  <p className="text-[12px] text-slate-500">{language}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>

            {/* Timezone */}
            <button className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Timezone</p>
                  <p className="text-[12px] text-slate-500">{timezone}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Data & Storage */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Data & Storage
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            {/* Sync Status */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Last Synced</p>
                  <p className="text-[12px] text-emerald-600 font-medium">{lastSync}</p>
                </div>
              </div>
              <button 
                onClick={handleSyncNow}
                className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[12px] font-semibold active:bg-slate-200 transition-colors"
              >
                Sync Now
              </button>
            </div>

            {/* Cache */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                  <HardDrive className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Cache Size</p>
                  <p className="text-[12px] text-slate-500">{cacheSize}</p>
                </div>
              </div>
              <button 
                onClick={handleClearCache}
                className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[12px] font-semibold active:bg-slate-200 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Export Data */}
            <button className="w-full flex items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Export My Data</p>
                  <p className="text-[12px] text-slate-500">Download all your data</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>

            {/* Delete Data */}
            <button className="w-full flex items-center justify-between p-4 active:bg-red-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-red-600">Delete All Data</p>
                  <p className="text-[12px] text-slate-500">This cannot be undone</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-300" />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="ios-card p-4 shadow-sm text-center">
          <p className="text-[14px] font-semibold text-slate-700">MYPA</p>
          <p className="text-[12px] text-slate-500">Version 1.0.0 (Build 42)</p>
          <p className="text-[11px] text-slate-400 mt-1">© 2025 MYPA Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
