import { ArrowLeft, Lock, Users, Eye, ChevronRight, Check, MapPin, Smartphone, Zap, Volume2, RefreshCw, Calendar, Heart, Mic } from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState } from "react";

interface PrivacyControlsScreenProps {
  onNavigate?: (screen: string) => void;
}

interface Circle {
  id: number;
  name: string;
  privacy: string;
}

export function PrivacyControlsScreen({ onNavigate }: PrivacyControlsScreenProps) {
  const [defaultPrivacy, setDefaultPrivacy] = useState<'private' | 'metrics' | 'proof'>('metrics');
  const [circles, setCircles] = useState<Circle[]>([
    { id: 1, name: 'Morning Warriors', privacy: 'metrics' },
    { id: 2, name: 'Product Team', privacy: 'proof' },
    { id: 3, name: 'Book Club', privacy: 'private' },
  ]);
  const [showPickerForCircle, setShowPickerForCircle] = useState<number | null>(null);
  const [hideWallet, setHideWallet] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);
  
  // Data permissions
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [contactsAccess, setContactsAccess] = useState(false);
  const [healthAccess, setHealthAccess] = useState(false);
  const [calendarAccess, setCalendarAccess] = useState(true);
  const [microphoneAccess, setMicrophoneAccess] = useState(true);
  const [backgroundRefresh, setBackgroundRefresh] = useState(true);

  const privacyModes = [
    {
      id: 'private',
      label: 'Private',
      description: 'Only you can see your activity',
      icon: Lock,
    },
    {
      id: 'metrics',
      label: 'Metrics only',
      description: 'Share numbers, no personal details',
      icon: Eye,
    },
    {
      id: 'proof',
      label: 'Proof to circle',
      description: 'Share photos and full details',
      icon: Users,
    },
  ];

  const privacyOptions = [
    { value: 'default', label: 'Use default' },
    { value: 'private', label: 'Private' },
    { value: 'metrics', label: 'Metrics only' },
    { value: 'proof', label: 'Proof to circle' },
  ];

  const getPrivacyLabel = (value: string) => {
    return privacyOptions.find(o => o.value === value)?.label || 'Use default';
  };

  const handleSelectPrivacy = (circleId: number, privacy: string) => {
    setCircles(circles.map(c => c.id === circleId ? { ...c, privacy } : c));
    setShowPickerForCircle(null);
  };

  return (
    <div className="min-h-screen bg-ios-bg pb-28 relative">
      <IOSStatusBar />
      
      {/* Header */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('profile')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-[20px] font-bold text-slate-900">Privacy Controls</h1>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* Info Card */}
        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
          <h3 className="text-[14px] font-semibold text-slate-800 mb-1">Your privacy matters</h3>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            MYPA is designed with privacy-first principles. You control what you share.
          </p>
        </div>

        {/* Default Privacy Setting */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Default Privacy Mode</h2>
          
          <div className="bg-white rounded-2xl overflow-hidden">
            {privacyModes.map((mode, index) => {
              const Icon = mode.icon;
              const isSelected = defaultPrivacy === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setDefaultPrivacy(mode.id as typeof defaultPrivacy)}
                  className={`w-full p-4 text-left flex items-center gap-3 active:bg-slate-50 transition-colors ${
                    index !== 0 ? 'border-t border-slate-100' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-purple-500' : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-slate-900">{mode.label}</p>
                    <p className="text-[12px] text-slate-500 truncate">{mode.description}</p>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Per-Circle Settings */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Per-Circle Settings</h2>
          
          <div className="bg-white rounded-2xl overflow-hidden">
            {circles.map((circle, index) => (
              <button
                key={circle.id}
                onClick={() => setShowPickerForCircle(circle.id)}
                className={`w-full p-4 text-left flex items-center justify-between active:bg-slate-50 transition-colors ${
                  index !== 0 ? 'border-t border-slate-100' : ''
                }`}
              >
                <span className="text-[15px] font-medium text-slate-900">{circle.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[14px] text-slate-500">{getPrivacyLabel(circle.privacy)}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Settings */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Additional Settings</h2>
          
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[15px] font-medium text-slate-900">Hide wallet amounts</p>
                <p className="text-[12px] text-slate-500">Don't show time saved to circles</p>
              </div>
              <button 
                onClick={() => setHideWallet(!hideWallet)}
                className={`w-[51px] h-[31px] rounded-full relative transition-colors ${hideWallet ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-[27px] h-[27px] rounded-full bg-white absolute top-[2px] transition-transform shadow-sm ${hideWallet ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>
            
            <div className="p-4 flex items-center justify-between border-t border-slate-100">
              <div className="flex-1">
                <p className="text-[15px] font-medium text-slate-900">Anonymous mode</p>
                <p className="text-[12px] text-slate-500">Show as "Someone" in circles</p>
              </div>
              <button 
                onClick={() => setAnonymousMode(!anonymousMode)}
                className={`w-[51px] h-[31px] rounded-full relative transition-colors ${anonymousMode ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-[27px] h-[27px] rounded-full bg-white absolute top-[2px] transition-transform shadow-sm ${anonymousMode ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Permissions */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Data Permissions</h2>
          
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Location */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${locationEnabled ? 'bg-blue-500' : 'bg-slate-200'}`}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Location</p>
                  <p className="text-[12px] text-slate-500">Commute ETAs & reminders</p>
                </div>
              </div>
              <button 
                onClick={() => setLocationEnabled(!locationEnabled)}
                className={`w-[51px] h-[31px] rounded-full relative transition-colors ${locationEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-[27px] h-[27px] rounded-full bg-white absolute top-[2px] transition-transform shadow-sm ${locationEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>

            {/* Calendar */}
            <div className="p-4 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${calendarAccess ? 'bg-red-500' : 'bg-slate-200'}`}>
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Calendar</p>
                  <p className="text-[12px] text-slate-500">Read & write events</p>
                </div>
              </div>
              <button 
                onClick={() => setCalendarAccess(!calendarAccess)}
                className={`w-[51px] h-[31px] rounded-full relative transition-colors ${calendarAccess ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-[27px] h-[27px] rounded-full bg-white absolute top-[2px] transition-transform shadow-sm ${calendarAccess ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>

            {/* Contacts */}
            <div className="p-4 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${contactsAccess ? 'bg-green-500' : 'bg-slate-200'}`}>
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Contacts</p>
                  <p className="text-[12px] text-slate-500">For meeting invites</p>
                </div>
              </div>
              <button 
                onClick={() => setContactsAccess(!contactsAccess)}
                className={`w-[51px] h-[31px] rounded-full relative transition-colors ${contactsAccess ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-[27px] h-[27px] rounded-full bg-white absolute top-[2px] transition-transform shadow-sm ${contactsAccess ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>

            {/* Microphone */}
            <div className="p-4 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${microphoneAccess ? 'bg-violet-500' : 'bg-slate-200'}`}>
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Microphone</p>
                  <p className="text-[12px] text-slate-500">Voice commands & calls</p>
                </div>
              </div>
              <button 
                onClick={() => setMicrophoneAccess(!microphoneAccess)}
                className={`w-[51px] h-[31px] rounded-full relative transition-colors ${microphoneAccess ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-[27px] h-[27px] rounded-full bg-white absolute top-[2px] transition-transform shadow-sm ${microphoneAccess ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>

            {/* Health & Fitness */}
            <div className="p-4 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${healthAccess ? 'bg-pink-500' : 'bg-slate-200'}`}>
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Health & Fitness</p>
                  <p className="text-[12px] text-slate-500">Sleep & activity data</p>
                </div>
              </div>
              <button 
                onClick={() => setHealthAccess(!healthAccess)}
                className={`w-[51px] h-[31px] rounded-full relative transition-colors ${healthAccess ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-[27px] h-[27px] rounded-full bg-white absolute top-[2px] transition-transform shadow-sm ${healthAccess ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>

            {/* Background Refresh */}
            <div className="p-4 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${backgroundRefresh ? 'bg-cyan-500' : 'bg-slate-200'}`}>
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Background Refresh</p>
                  <p className="text-[12px] text-slate-500">Keep data synced</p>
                </div>
              </div>
              <button 
                onClick={() => setBackgroundRefresh(!backgroundRefresh)}
                className={`w-[51px] h-[31px] rounded-full relative transition-colors ${backgroundRefresh ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-[27px] h-[27px] rounded-full bg-white absolute top-[2px] transition-transform shadow-sm ${backgroundRefresh ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>
          </div>
          <p className="text-[12px] text-slate-500 mt-2 px-1">These permissions help MYPA assist you better. Disable any you're not comfortable with.</p>
        </div>
      </div>

      {/* iOS Action Sheet Picker */}
      {showPickerForCircle !== null && (
        <div className="absolute inset-0 z-50 flex items-end justify-center rounded-[48px] overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPickerForCircle(null)}
          />
          <div className="relative z-10 w-full bg-ios-bg rounded-t-[14px] pb-8 animate-in slide-in-from-bottom duration-200">
            <div className="w-9 h-1 bg-slate-300 rounded-full mx-auto mt-2 mb-3" />
            <p className="text-[13px] text-slate-500 text-center mb-2">
              {circles.find(c => c.id === showPickerForCircle)?.name}
            </p>
            
            <div className="mx-2 bg-white rounded-xl overflow-hidden">
              {privacyOptions.map((option, index) => {
                const currentCircle = circles.find(c => c.id === showPickerForCircle);
                const isSelected = currentCircle?.privacy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelectPrivacy(showPickerForCircle, option.value)}
                    className={`w-full py-3.5 px-4 text-center text-[17px] active:bg-slate-100 transition-colors flex items-center justify-between ${
                      index !== 0 ? 'border-t border-slate-200' : ''
                    }`}
                  >
                    <span className={isSelected ? 'text-blue-500 font-medium' : 'text-slate-900'}>
                      {option.label}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-blue-500" />}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setShowPickerForCircle(null)}
              className="mx-2 mt-2 w-[calc(100%-16px)] py-3.5 bg-white rounded-xl text-[17px] font-semibold text-blue-500 active:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
