import { X, Camera, Zap } from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState } from "react";

interface ProofCameraScreenProps {
  onNavigate?: (screen: string) => void;
}

export function ProofCameraScreen({ onNavigate }: ProofCameraScreenProps) {
  const [captureMode, setCaptureMode] = useState<'proof' | 'proof-note'>('proof');

  const handleCapture = () => {
    // Simulate camera capture and navigate to confirmation
    onNavigate?.('proof-confirm');
  };

  return (
    <div className="min-h-screen bg-black relative">
      <IOSStatusBar />
      
      {/* Camera Preview (simulated) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white/30 text-center">
          <Camera className="w-16 h-16 mx-auto mb-3" />
          <p className="text-[15px]">Camera Preview</p>
        </div>
      </div>

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 pt-12 px-6 z-10">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigate?.('challenges')}
            className="p-3 rounded-full bg-black/40 backdrop-blur-md"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-4 py-2">
            <Zap className="w-4 h-4 text-white" />
            <span className="text-[13px] text-white font-medium">Auto</span>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 px-6 z-10">
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setCaptureMode('proof')}
              className={`px-6 py-2.5 rounded-full text-[15px] font-medium transition-all ${
                captureMode === 'proof'
                  ? 'bg-white text-slate-900'
                  : 'bg-white/20 text-white backdrop-blur-md'
              }`}
            >
              Proof only
            </button>
            <button
              onClick={() => setCaptureMode('proof-note')}
              className={`px-6 py-2.5 rounded-full text-[15px] font-medium transition-all ${
                captureMode === 'proof-note'
                  ? 'bg-white text-slate-900'
                  : 'bg-white/20 text-white backdrop-blur-md'
              }`}
            >
              Proof + note
            </button>
          </div>

          {/* Capture Button */}
          <div className="flex justify-center">
            <button 
              onClick={handleCapture}
              className="w-20 h-20 rounded-full bg-white border-4 border-white/30 hover:scale-105 transition-transform active:scale-95"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}