import { Phone, Settings, Mic, Sparkles, Waves, Keyboard, Send, X, Globe, Gauge, Volume2, ChevronRight, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MYPAOrb } from "../components/MYPAOrb";

interface ListeningScreenProps {
  onEndCall: () => void;
  onSettings?: () => void;
}

export function ListeningScreen({ onEndCall, onSettings }: ListeningScreenProps) {
  const [isListening, setIsListening] = useState(true);
  const [dots, setDots] = useState('.');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textMessage, setTextMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState('English');
  const [speed, setSpeed] = useState('Normal');
  const [voice, setVoice] = useState('Nova');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Focus input when text mode enabled
  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);
  
  // Mock transcript data
  const [transcripts, setTranscripts] = useState([
    { id: 1, text: "Hey MYPA! What's on my schedule today?", isUser: true, time: "Just now" },
    { id: 2, text: "Good morning! You have 4 tasks today. Your first meeting is at 10 AM - Team standup.", isUser: false, time: "Just now" },
  ]);

  const handleSendText = () => {
    if (!textMessage.trim()) return;
    
    setTranscripts(prev => [...prev, {
      id: prev.length + 1,
      text: textMessage,
      isUser: true,
      time: "Just now"
    }]);
    setTextMessage('');
    
    // Simulate MYPA response
    setTimeout(() => {
      setTranscripts(prev => [...prev, {
        id: prev.length + 1,
        text: "Got it! I'll help you with that. Is there anything else?",
        isUser: false,
        time: "Just now"
      }]);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 z-50 flex flex-col items-center pt-14 pb-6 px-6 overflow-hidden">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
        }
        .pulse-ring { animation: pulse-ring 2s ease-in-out infinite; }
        .float-particle { animation: float-particle 3s ease-in-out infinite; }
      `}</style>
      
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-purple-400/30 float-particle" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-blue-400/30 float-particle" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-primary/30 float-particle" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 rounded-full bg-secondary/30 float-particle" style={{ animationDelay: '1.5s' }} />
      </div>
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl pointer-events-none pulse-ring" />
      
      {/* Header */}
      <div className="w-full flex justify-between items-start pt-8 relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[12px] font-semibold uppercase tracking-wider">Active</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            I'm<br />Listening{dots}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm"
          >
            <Settings className="w-5 h-5 text-white/80" />
          </button>
          <button 
            onClick={onEndCall}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <>
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowSettings(false)}
          />
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-slate-900 rounded-3xl border border-white/10 overflow-hidden z-50 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-[18px] font-bold text-white">Voice Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
            
            {/* Settings Options */}
            <div className="p-4 space-y-3">
              {/* Language */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white">Language</p>
                    <p className="text-[12px] text-white/50">Choose your language</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['English', 'Spanish', 'French', 'Arabic'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                        language === lang 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white">Speed</p>
                    <p className="text-[12px] text-white/50">How fast MYPA speaks</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {['Slow', 'Normal', 'Fast'].map(spd => (
                    <button
                      key={spd}
                      onClick={() => setSpeed(spd)}
                      className={`flex-1 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                        speed === spd 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {spd}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white">Voice</p>
                    <p className="text-[12px] text-white/50">MYPA's voice style</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'Nova', desc: 'Warm & friendly' },
                    { id: 'Aria', desc: 'Calm & professional' },
                    { id: 'Echo', desc: 'Energetic & upbeat' },
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => setVoice(v.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        voice === v.id 
                          ? 'bg-purple-500/20 border border-purple-500/30' 
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="text-left">
                        <p className={`text-[14px] font-medium ${voice === v.id ? 'text-purple-300' : 'text-white/80'}`}>{v.id}</p>
                        <p className="text-[11px] text-white/40">{v.desc}</p>
                      </div>
                      {voice === v.id && (
                        <Check className="w-5 h-5 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Done Button */}
            <div className="p-4 pt-0">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Visual - MYPA Orb */}
      <div className="relative flex items-center justify-center w-full max-w-[200px] aspect-square my-4">
        {/* Outer rings */}
        <div className="absolute inset-0 rounded-full border border-white/5 pulse-ring" style={{ animationDelay: '0s' }} />
        <div className="absolute inset-4 rounded-full border border-white/10 pulse-ring" style={{ animationDelay: '0.3s' }} />
        <div className="absolute inset-8 rounded-full border border-white/10 pulse-ring" style={{ animationDelay: '0.6s' }} />
        
        <MYPAOrb size="lg" showGlow={true} />
      </div>

      {/* Transcripts */}
      <div className="w-full flex-1 overflow-y-auto space-y-2 mb-4 relative z-10 max-h-[180px]">
        {transcripts.map((t, i) => (
          <div 
            key={t.id}
            className={`w-full p-4 rounded-2xl backdrop-blur-md border transition-all
              ${t.isUser 
                ? 'bg-gradient-to-r from-primary/30 to-secondary/30 border-primary/30 text-white ml-auto max-w-[85%]' 
                : 'bg-white/10 border-white/10 text-white/90 mr-auto max-w-[85%]'
              }`}
            style={{
               opacity: 0.85 - (transcripts.length - 1 - i) * 0.15
            }}
          >
            <p className="text-[13px] font-medium leading-relaxed">
              {t.text}
            </p>
            <p className="text-[10px] text-white/40 mt-1">{t.time}</p>
          </div>
        ))}
        
        {/* Typing indicator */}
        <div className="flex items-center gap-2 px-3 py-1">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-white/50 text-[11px]">MYPA is thinking...</span>
        </div>
      </div>

      {/* Text Input Mode */}
      {showTextInput && (
        <div className="w-full max-w-sm mb-3 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Type your message..."
              className="w-full px-4 py-3 pr-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder:text-white/40 text-[14px] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              onClick={handleSendText}
              disabled={!textMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 disabled:bg-white/20 transition-all hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-5 mb-3 relative z-10 mt-auto">
        {/* Mute/Mic button */}
        <button 
          onClick={() => setIsListening(!isListening)}
          className={`w-12 h-12 rounded-2xl backdrop-blur border flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-white/10 border-white/10 hover:bg-white/20' 
              : 'bg-red-500/20 border-red-500/30'
          }`}
        >
          <Mic className={`w-5 h-5 ${isListening ? 'text-white/80' : 'text-red-400'}`} />
        </button>
        
        {/* End call button */}
        <button 
          onClick={onEndCall}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Phone className="w-7 h-7 text-white rotate-[135deg]" fill="currentColor" />
        </button>
        
        {/* Keyboard toggle button */}
        <button 
          onClick={() => setShowTextInput(!showTextInput)}
          className={`w-12 h-12 rounded-2xl backdrop-blur border flex items-center justify-center transition-all ${
            showTextInput 
              ? 'bg-primary/20 border-primary/30' 
              : 'bg-white/10 border-white/10 hover:bg-white/20'
          }`}
        >
          {showTextInput ? (
            <X className="w-5 h-5 text-primary" />
          ) : (
            <Keyboard className="w-5 h-5 text-white/80" />
          )}
        </button>
      </div>
      
      {/* Tip */}
      <p className="text-white/40 text-[11px] text-center">
        {showTextInput 
          ? "Type your message or tap × to go back to voice"
          : "Speak naturally — or tap keyboard to type instead"
        }
      </p>
    </div>
  );
}
