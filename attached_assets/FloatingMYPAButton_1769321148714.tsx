import { Mic } from "lucide-react";
import { MYPAOrb } from "./MYPAOrb";

interface FloatingMYPAButtonProps {
  onTap: () => void;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

/**
 * Floating MYPA Button - provides quick voice access from any screen
 * Voice-first approach: prominent but not intrusive
 */
export function FloatingMYPAButton({ 
  onTap, 
  size = 'medium',
  showLabel = false,
  className = ''
}: FloatingMYPAButtonProps) {
  const sizes = {
    small: {
      button: 'w-12 h-12',
      orbSize: 'sm' as const,
      glow: 'w-14 h-14',
      label: 'text-[10px]'
    },
    medium: {
      button: 'w-14 h-14',
      orbSize: 'sm' as const,
      glow: 'w-16 h-16',
      label: 'text-[11px]'
    },
    large: {
      button: 'w-16 h-16',
      orbSize: 'sm' as const,
      glow: 'w-20 h-20',
      label: 'text-[12px]'
    }
  };

  const s = sizes[size];

  return (
    <button 
      onClick={onTap}
      className={`group relative flex flex-col items-center gap-1 ${className}`}
    >
      {/* Glow ring */}
      <div className={`absolute ${s.glow} rounded-full bg-primary/20 blur-xl opacity-60 group-hover:opacity-100 group-active:opacity-80 transition-all duration-300`} />
      
      {/* Pulse rings on hover */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${s.button} rounded-full bg-primary/10 animate-ping opacity-0 group-hover:opacity-40`} />
      </div>
      
      {/* Button */}
      <div className={`${s.button} rounded-full bg-gradient-to-br from-primary via-primary to-purple-600 shadow-lg shadow-primary/40 flex items-center justify-center group-hover:scale-110 group-active:scale-95 transition-all duration-200 relative z-10`}>
        <MYPAOrb size={s.orbSize} showGlow={false} />
      </div>
      
      {/* Label */}
      {showLabel && (
        <span className={`${s.label} text-white/60 font-medium group-hover:text-white/90 transition-colors`}>
          Talk
        </span>
      )}
    </button>
  );
}

/**
 * Absolute position floating button for bottom-right placement within parent container
 * Use inside a relative positioned container (like a screen)
 */
export function FloatingMYPAButtonFixed({ 
  onTap,
  className = ''
}: { 
  onTap: () => void;
  className?: string;
}) {
  return (
    <div className={`absolute bottom-28 right-5 z-40 ${className}`}>
      <FloatingMYPAButton 
        onTap={onTap} 
        size="medium" 
        showLabel={true}
      />
    </div>
  );
}
