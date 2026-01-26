interface ToggleSwitchProps {
  active: boolean;
  onToggle: () => void;
}

export function ToggleSwitch({ active, onToggle }: ToggleSwitchProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${
        active ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-slate-300'
      }`}
    >
      <div 
        className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform duration-200 ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
