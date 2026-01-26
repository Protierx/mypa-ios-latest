import { ArrowLeft, Send, Mic, Square, X, Moon, Wind, Heart } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ResetScreenProps {
  onNavigate?: (screen: string) => void;
  onVoiceClick?: () => void;
}

interface Message {
  id: number;
  type: 'ai' | 'user';
  text: string;
}

export function ResetScreen({ onNavigate }: ResetScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      type: 'ai', 
      text: "Hey. I noticed you came here. That's okay — everyone needs a moment sometimes.",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [breatheMode, setBreatheMode] = useState(false);
  const [breathePhase, setBreathePhase] = useState<'in' | 'hold' | 'out'>('in');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordTimer = useRef<NodeJS.Timeout | null>(null);

  const quickPrompts = [
    "I'm overwhelmed",
    "Just need to vent",
    "Help me think",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      recordTimer.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } else {
      if (recordTimer.current) clearInterval(recordTimer.current);
      setRecordSeconds(0);
    }
    return () => { if (recordTimer.current) clearInterval(recordTimer.current); };
  }, [isRecording]);

  useEffect(() => {
    if (!breatheMode) return;
    const phases: Array<'in' | 'hold' | 'out'> = ['in', 'hold', 'out'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % 3;
      setBreathePhase(phases[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, [breatheMode]);

  const getAIResponse = (text: string): string => {
    const t = text.toLowerCase();
    if (t.includes('overwhelm') || t.includes('too much')) {
      return "I hear you. When everything feels like too much, the bravest thing is to pause. What's weighing on you most?";
    }
    if (t.includes('vent') || t.includes('frustrated') || t.includes('angry')) {
      return "I'm here. No advice, no judgment — just listening. Let it out.";
    }
    if (t.includes('help') || t.includes('think') || t.includes('figure')) {
      return "Let's untangle this together. Is it one thing, or does everything feel heavy right now?";
    }
    return "I'm listening. Take your time.";
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: text.trim() }]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: getAIResponse(text) }]);
      setIsTyping(false);
    }, 1200);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: `Voice note (${recordSeconds}s)` }]);
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: "I heard you. Let it all out — I'm here." }]);
        setIsTyping(false);
      }, 1000);
    } else {
      setIsRecording(true);
    }
  };

  // Breathe mode - full screen takeover
  if (breatheMode) {
    return (
      <div className="absolute inset-0 bg-[#080810] flex flex-col">
        {/* Close */}
        <div className="pt-14 px-5">
          <button 
            onClick={() => {
              setBreatheMode(false);
              setMessages(prev => [...prev, { id: Date.now(), type: 'ai', text: "Feel a little lighter? I'm here whenever you need." }]);
            }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Breathing orb */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Outer glow */}
            <div 
              className="absolute inset-0 rounded-full transition-all duration-[4000ms] ease-in-out"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
                transform: breathePhase === 'in' ? 'scale(1.8)' : breathePhase === 'hold' ? 'scale(1.8)' : 'scale(1)',
                opacity: breathePhase === 'hold' ? 0.8 : 0.5,
              }}
            />
            {/* Main orb */}
            <div 
              className="w-40 h-40 rounded-full flex items-center justify-center transition-all duration-[4000ms] ease-in-out"
              style={{
                background: 'linear-gradient(145deg, rgba(139,92,246,0.4) 0%, rgba(109,40,217,0.3) 100%)',
                boxShadow: '0 0 60px rgba(139,92,246,0.4), inset 0 0 40px rgba(139,92,246,0.2)',
                transform: breathePhase === 'in' ? 'scale(1.15)' : breathePhase === 'hold' ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              <Wind className="w-12 h-12 text-white/60" />
            </div>
          </div>

          <p className="mt-12 text-[24px] font-light text-white/70 tracking-wide">
            {breathePhase === 'in' ? 'Breathe in...' : breathePhase === 'hold' ? 'Hold...' : 'Breathe out...'}
          </p>
          <p className="mt-2 text-[14px] text-white/40">Let everything else fade</p>
        </div>

        {/* Bottom hint */}
        <div className="pb-12 text-center">
          <p className="text-[13px] text-white/30">Tap X when you're ready</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#080810] flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-14 pb-3 px-5 flex items-center justify-between">
        <button 
          onClick={() => onNavigate?.('hub')}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[12px] text-white/50 font-medium">Safe space</span>
        </div>
      </div>

      {/* Title card */}
      <div className="relative z-10 px-5 pb-4">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">Reset Mode</p>
              <p className="text-[17px] text-white font-medium">No rush. Just be.</p>
            </div>
            <button
              onClick={() => setBreatheMode(true)}
              className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Moon className="w-5 h-5 text-violet-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5">
        <div className="space-y-3 pb-4">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] px-4 py-3 ${
                message.type === 'user' 
                  ? 'bg-violet-500/30 border border-violet-400/20 rounded-2xl rounded-br-sm' 
                  : 'bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm'
              }`}>
                <p className="text-[15px] leading-relaxed text-white/90">{message.text}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <div className="relative z-10 px-5 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/70 active:scale-95 transition-transform"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="relative z-10 px-5 pb-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-400/20">
            <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[14px] text-red-200">Recording... {recordSeconds}s</span>
            <span className="text-[12px] text-white/40 ml-auto">Tap mic to stop</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative z-10 px-5 pb-8 pt-2">
        <div className="flex items-center gap-2">
          {/* Mic button */}
          <button
            onClick={toggleRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isRecording 
                ? 'bg-red-500/20 border-2 border-red-400/50' 
                : 'bg-white/5 border border-white/10'
            }`}
          >
            {isRecording ? (
              <Square className="w-5 h-5 text-red-300" />
            ) : (
              <Mic className="w-5 h-5 text-white/60" />
            )}
          </button>

          {/* Text input */}
          <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
              placeholder="Say anything..."
              className="flex-1 bg-transparent text-white text-[15px] placeholder-white/30 outline-none"
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              inputText.trim() ? 'bg-violet-500' : 'bg-white/5 border border-white/10'
            }`}
          >
            <Send className={`w-5 h-5 ${inputText.trim() ? 'text-white' : 'text-white/30'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
