import {
  Inbox,
  Users,
  User,
  LayoutGrid,
  CalendarDays,
  Home,
} from "lucide-react";
import { MYPAOrb } from "./MYPAOrb";

interface TabBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onVoiceClick?: () => void;
  notifications?: { home?: number; circles?: number };
}

const tabs = [
  { id: "home", label: "Home", icon: Home, gradient: "from-purple-500 to-violet-500" },
  { id: "plan", label: "Plan", icon: CalendarDays, gradient: "from-blue-500 to-cyan-500" },
  { id: "circles", label: "Circles", icon: Users, gradient: "from-pink-500 to-rose-500" },
  { id: "profile", label: "Me", icon: User, gradient: "from-emerald-500 to-teal-500" },
];

export function TabBar({
  activeTab = "home",
  onTabChange,
  onVoiceClick,
  notifications = { home: 2, circles: 1 },
}: TabBarProps) {
  return (
    <div className="absolute left-0 right-0 bottom-0 z-50 pointer-events-none">
      <div className="relative mx-auto max-w-[390px] w-full pointer-events-auto">
        {/* Premium frosted glass background */}
        <div 
          className="absolute inset-x-3 bottom-3 h-[70px] rounded-[24px] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.92) 100%)',
            boxShadow: '0 -4px 30px rgba(181, 140, 255, 0.15), 0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.6)',
          }}
        />

        <div className="relative px-6 pb-4 pt-2 flex items-end justify-evenly z-10 h-[76px]">
          {/* Left tabs */}
          {tabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badgeCount = notifications?.[tab.id as keyof typeof notifications];

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className="flex flex-col items-center gap-0.5 w-[60px] active:scale-90 transition-all duration-200"
              >
                <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-br ${tab.gradient} shadow-lg` 
                    : 'bg-transparent hover:bg-slate-100'
                }`}
                style={isActive ? {
                  boxShadow: tab.id === 'home' 
                    ? '0 4px 14px rgba(168, 85, 247, 0.4)' 
                    : '0 4px 14px rgba(59, 130, 246, 0.4)'
                } : {}}
                >
                  <Icon
                    className={`w-[22px] h-[22px] transition-all duration-200 ${
                      isActive ? "text-white" : "text-slate-600"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {/* Notification badge */}
                  {badgeCount && badgeCount > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold transition-all duration-200 ${
                    isActive 
                      ? "text-slate-800" 
                      : "text-slate-500"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Center Voice Orb - MYPA Orb - PROMINENT */}
          <button
            onClick={onVoiceClick}
            className="relative flex flex-col items-center active:scale-95 transition-all duration-200 group -mt-6"
          >
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
            <div className="w-[52px] h-[52px] flex items-center justify-center relative">
              <MYPAOrb size="sm" showGlow={true} />
            </div>
            {/* Label */}
            <span className="text-[10px] font-semibold text-primary whitespace-nowrap mt-1">
              Talk
            </span>
          </button>

          {/* Right tabs */}
          {tabs.slice(2).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badgeCount = notifications?.[tab.id as keyof typeof notifications];

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className="flex flex-col items-center gap-0.5 w-[60px] active:scale-90 transition-all duration-200"
              >
                <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-br ${tab.gradient} shadow-lg` 
                    : 'bg-transparent hover:bg-slate-100'
                }`}
                style={isActive ? {
                  boxShadow: tab.id === 'circles' 
                    ? '0 4px 14px rgba(236, 72, 153, 0.4)' 
                    : '0 4px 14px rgba(16, 185, 129, 0.4)'
                } : {}}
                >
                  <Icon
                    className={`w-[22px] h-[22px] transition-all duration-200 ${
                      isActive ? "text-white" : "text-slate-600"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {/* Notification badge */}
                  {badgeCount && badgeCount > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold transition-all duration-200 ${
                    isActive 
                      ? "text-slate-800" 
                      : "text-slate-500"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}