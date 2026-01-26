import { Mic } from "lucide-react";
import { useState } from "react";
import { MYPAOrb } from "./MYPAOrb";

interface VoicePillProps {
  placeholder?: string;
  onVoiceClick?: () => void;
  isListening?: boolean;
}

export function VoicePill({ 
  placeholder = "Say something to your day...", 
  onVoiceClick,
  isListening = false 
}: VoicePillProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handlePillClick = () => {
    setIsRecording(!isRecording);
    onVoiceClick?.();
  };

  // When listening, transform to MYPA Orb
  if (isRecording) {
    return (
      <div className="w-full px-6 flex justify-center items-center min-h-28">
        <style>{`
          @keyframes morph-in {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .orb-morph-in {
            animation: morph-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>
        <button
          onClick={handlePillClick}
          className="orb-morph-in relative hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          aria-label="Listening"
        >
          <MYPAOrb size="md" showGlow={true} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-6">
      <button
        onClick={handlePillClick}
        className={`
          relative flex items-center justify-between w-full
          rounded-full px-5 py-3.5
          bg-gradient-to-r from-primary via-orb-middle to-secondary
          transition-all duration-300 cursor-pointer
          hover:shadow-[0_0_25px_0_rgba(181,140,255,0.35)]
          active:scale-95
          ${isFocused ? 'shadow-[0_0_20px_0_rgba(181,140,255,0.25)]' : 'shadow-md'}
        `}
      >
        <input
          type="text"
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/70 text-[17px] pointer-events-none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          readOnly
        />
        <div className="flex items-center gap-2 ml-2">
          <Mic className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
      </button>
    </div>
  );
}
