interface MYPAOrbProps {
  size?: "sm" | "md" | "lg" | "xl";
  showGlow?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-14 h-14",
  md: "w-20 h-20",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
};

const glowSizes = {
  sm: "blur-md scale-110",
  md: "blur-lg scale-115",
  lg: "blur-xl scale-120",
  xl: "blur-2xl scale-125",
};

export function MYPAOrb({ 
  size = "lg", 
  showGlow = true,
  className = "" 
}: MYPAOrbProps) {
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Subtle ambient glow */}
      {showGlow && (
        <div 
          className={`absolute inset-0 rounded-full bg-gradient-to-r from-primary via-orb-middle to-secondary opacity-30 ${glowSizes[size]}`}
        />
      )}

      {/* Main orb */}
      <div className={`relative ${sizeClasses[size]}`}>
        <img
          src="/mypa-orb.png"
          alt="MYPA Orb"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}
