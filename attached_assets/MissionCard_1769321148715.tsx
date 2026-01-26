import { Check, Circle, AlertCircle } from "lucide-react";

interface MissionCardProps {
  title: string;
  status: 'pending' | 'completed' | 'at-risk';
  onComplete?: () => void;
}

export function MissionCard({ title, status, onComplete }: MissionCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-success" strokeWidth={2.5} />;
      case 'at-risk':
        return <AlertCircle className="w-5 h-5 text-warning" strokeWidth={2} />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" strokeWidth={2} />;
    }
  };

  return (
    <div className="bg-card rounded-[24px] p-4 shadow-[0_4px_12px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_0_rgba(0,0,0,0.4)] border border-border/50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[17px] ${status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
            {title}
          </p>
        </div>
        {status === 'pending' && (
          <button
            onClick={onComplete}
            className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-muted-foreground/30 hover:border-success hover:bg-success/10 transition-all duration-200 flex items-center justify-center"
            aria-label="Mark complete"
          >
            <Check className="w-4 h-4 text-muted-foreground opacity-0 hover:opacity-100" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
