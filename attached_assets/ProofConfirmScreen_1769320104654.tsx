import { ArrowLeft, Tag, Lock, Users } from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState } from "react";

interface ProofConfirmScreenProps {
  onNavigate?: (screen: string) => void;
}

export function ProofConfirmScreen({ onNavigate }: ProofConfirmScreenProps) {
  const [selectedPrivacy, setSelectedPrivacy] = useState<'private' | 'metrics' | 'proof'>('metrics');
  const [selectedCircle, setSelectedCircle] = useState<string>('Morning Warriors');

  const privacyOptions = [
    { id: 'private', label: 'Only me', icon: Lock },
    { id: 'metrics', label: 'Metrics only', icon: Users },
    { id: 'proof', label: 'Share proof to circle', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-ios-bg pb-28">
      <IOSStatusBar />
      
      {/* Header */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('challenges')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-[20px] font-bold text-slate-900">Confirm Proof</h1>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* Image Thumbnail */}
        <div className="aspect-square rounded-[24px] bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-sm overflow-hidden">
          <div className="text-slate-400 text-center">
            <span className="text-[15px]">Proof Image</span>
          </div>
        </div>

        {/* Attach to */}
        <div>
          <h2 className="text-[17px] font-semibold text-slate-800 mb-3">Attach to</h2>
          <div className="space-y-2">
            <button className="w-full py-4 px-5 rounded-[20px] bg-gradient-to-r from-primary to-secondary text-white text-left shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[17px] font-medium">Morning Workout Challenge</span>
                <span className="text-[13px] text-white/80">Active</span>
              </div>
            </button>
            <button className="w-full py-4 px-5 rounded-[20px] bg-white border border-slate-200 text-slate-800 text-left hover:border-purple-300 transition-colors">
              <span className="text-[17px] font-medium">Daily Life Card</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <h2 className="text-[17px] font-semibold text-slate-800 mb-3">Add tags (optional)</h2>
          <button className="flex items-center gap-2 px-4 py-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-purple-300 transition-colors">
            <Tag className="w-4 h-4" />
            <span className="text-[15px]">Add tag</span>
          </button>
        </div>

        {/* Privacy Selector */}
        <div>
          <h2 className="text-[17px] font-semibold text-slate-800 mb-3">Privacy</h2>
          <div className="space-y-2">
            {privacyOptions.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedPrivacy(option.id as typeof selectedPrivacy)}
                  className={`w-full py-4 px-5 rounded-[20px] transition-all text-left ${
                    selectedPrivacy === option.id
                      ? 'bg-purple-50 border-2 border-purple-400 text-slate-800'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="text-[17px] font-medium">{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Circle Selector (if proof sharing is selected) */}
        {selectedPrivacy === 'proof' && (
          <div>
            <h2 className="text-[17px] font-semibold text-slate-800 mb-3">Share to</h2>
            <button className="w-full py-4 px-5 rounded-[20px] bg-white border border-slate-200 text-slate-800 text-left hover:border-purple-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[17px] font-medium">{selectedCircle}</span>
                <span className="text-[13px] text-slate-500">Circle</span>
              </div>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button 
            onClick={() => onNavigate?.('challenges')}
            className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[17px] font-medium hover:opacity-90 transition-opacity shadow-lg"
          >
            Post
          </button>
          <button 
            onClick={() => onNavigate?.('challenges')}
            className="w-full py-4 rounded-full bg-white text-slate-800 text-[17px] font-medium hover:bg-slate-50 transition-colors border border-slate-200"
          >
            Save Private
          </button>
        </div>
      </div>
    </div>
  );
}
