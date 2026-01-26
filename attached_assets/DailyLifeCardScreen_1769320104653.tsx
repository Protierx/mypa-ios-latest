import { ArrowLeft, Camera, Flame, Share2, Lock, Users, Eye, Sparkles, TrendingUp } from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState } from "react";

interface DailyLifeCardScreenProps {
  onNavigate?: (screen: string) => void;
}

export function DailyLifeCardScreen({ onNavigate }: DailyLifeCardScreenProps) {
  const [missions, setMissions] = useState(4);
  const [wallet, setWallet] = useState('+42m');
  const [streak, setStreak] = useState(6);
  const [selectedPrivacy, setSelectedPrivacy] = useState<'private' | 'metrics' | 'full'>('metrics');
  const [addNote, setAddNote] = useState('');
  const [tomorrow, setTomorrow] = useState([
    'Morning workout',
    'Focus work session',
    'Team standup',
  ]);

  // XP reward for sharing
  const xpReward = selectedPrivacy === 'full' ? 30 : selectedPrivacy === 'metrics' ? 20 : 10;

  return (
    <div className="min-h-screen bg-ios-bg pb-28">
      <IOSStatusBar />
      
      {/* Header */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('hub')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-[20px] font-bold text-slate-900">Daily Life Card</h1>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Hero Card Preview */}
        <div className="rounded-[24px] p-5 shadow-xl" style={{ background: 'linear-gradient(145deg, var(--dark-card-start) 0%, var(--dark-card-middle) 50%, var(--dark-card-end) 100%)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-[12px] text-purple-400 font-semibold uppercase tracking-wide">Daily Life Card Preview</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <p className="text-[11px] text-white/60 mb-1">Missions</p>
              <p className="text-[24px] font-bold text-white">{missions}/5</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <p className="text-[11px] text-white/60 mb-1">Time Saved</p>
              <p className="text-[24px] font-bold text-emerald-400">{wallet}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <p className="text-[11px] text-white/60 mb-1">Streak</p>
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-orange-400" />
                <p className="text-[24px] font-bold text-orange-400">{streak}</p>
              </div>
            </div>
          </div>

          {/* XP Reward Banner */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-[13px] text-white/80">Share to earn <span className="font-bold text-purple-400">+{xpReward} XP</span></span>
          </div>
        </div>

        {/* Proof Thumbnail (optional) */}
        <div>
          <h2 className="text-[15px] font-semibold text-slate-800 mb-3">Add Photo Proof (optional)</h2>
          <button className="w-full aspect-video rounded-[20px] bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center hover:border-purple-400 transition-colors shadow-sm">
            <Camera className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-[15px] text-slate-500">Tap to add photo</span>
            <span className="text-[12px] text-slate-400 mt-1">Photos earn +10 bonus XP</span>
          </button>
        </div>

        {/* Tomorrow's Top 3 */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800 mb-4">Tomorrow's Top 3</h2>
          
          <div className="space-y-3">
            {tomorrow.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-[12px] font-bold text-white">{index + 1}</span>
                </div>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newTomorrow = [...tomorrow];
                    newTomorrow[index] = e.target.value;
                    setTomorrow(newTomorrow);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Add Note */}
        <div>
          <h2 className="text-[15px] font-semibold text-slate-800 mb-3">Add a note (optional)</h2>
          <textarea
            value={addNote}
            onChange={(e) => setAddNote(e.target.value)}
            placeholder="How was your day? Any wins to celebrate?"
            className="w-full py-3 px-4 rounded-xl bg-white border border-slate-200 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none h-24 shadow-sm"
          />
        </div>

        {/* Privacy Selector */}
        <div>
          <h2 className="text-[15px] font-semibold text-slate-800 mb-3">Who can see this?</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'private', label: 'Private', icon: Lock, xp: 10 },
              { id: 'metrics', label: 'Metrics', icon: Eye, xp: 20 },
              { id: 'full', label: 'Full', icon: Users, xp: 30 },
            ].map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedPrivacy(option.id as typeof selectedPrivacy)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedPrivacy === option.id
                      ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${selectedPrivacy === option.id ? 'text-white' : 'text-slate-400'}`} />
                  <p className="text-[13px] font-medium">{option.label}</p>
                  <p className={`text-[10px] ${selectedPrivacy === option.id ? 'text-white/80' : 'text-slate-400'}`}>+{option.xp} XP</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          <button 
            onClick={() => onNavigate?.('circles')}
            className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[17px] font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share to Circle
          </button>
          <button 
            onClick={() => onNavigate?.('hub')}
            className="w-full py-4 rounded-full bg-white text-slate-800 text-[17px] font-medium hover:bg-slate-50 transition-colors border border-slate-200"
          >
            Save for Later
          </button>
        </div>
      </div>
    </div>
  );
}
