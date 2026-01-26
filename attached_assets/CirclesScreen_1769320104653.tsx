import { Users, Plus, Flame, Search, X, Check, ChevronRight, Sparkles, Heart, Zap, Bell, MoreHorizontal, UserPlus, Settings, Trash2, Dumbbell, Briefcase, BookOpen } from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState, useEffect, useRef } from "react";

interface CirclesScreenProps {
  onNavigate?: (screen: string) => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

// Generate a random invite code (e.g., MYPA-7K2P)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MYPA-${code}`;
}

export function CirclesScreen({ onNavigate, onModalStateChange }: CirclesScreenProps) {
  const [activeTab, setActiveTab] = useState<'circles' | 'feed'>('circles');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChip, setFilterChip] = useState<'all' | 'active' | 'your-turn'>('all');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [longPressedCard, setLongPressedCard] = useState<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const [circles, setCircles] = useState([
    {
      id: 1,
      name: 'Morning Warriors',
      members: [
        { initial: 'A', posted: true },
        { initial: 'B', posted: true },
        { initial: 'C', posted: false },
        { initial: 'D', posted: true },
      ],
      challenge: '30-day fitness streak',
      posted: 3,
      total: 4,
      streak: 12,
      lastActivity: '24m ago',
      inviteCode: 'MYPA-7K2P',
      inviteLink: 'https://mypa.app/invite/MYPA-7K2P',
    },
    {
      id: 2,
      name: 'Product Team',
      members: [
        { initial: 'J', posted: true },
        { initial: 'M', posted: true },
        { initial: 'S', posted: false },
      ],
      challenge: 'Daily standup attendance',
      posted: 2,
      total: 3,
      streak: 8,
      lastActivity: '12m ago',
      inviteCode: 'MYPA-9F4L',
      inviteLink: 'https://mypa.app/invite/MYPA-9F4L',
    },
    {
      id: 3,
      name: 'Book Club',
      members: [
        { initial: 'E', posted: true },
        { initial: 'R', posted: false },
        { initial: 'L', posted: true },
        { initial: 'K', posted: false },
        { initial: 'P', posted: true },
      ],
      challenge: 'Read 15min daily',
      posted: 3,
      total: 5,
      streak: 5,
      lastActivity: '2h ago',
      inviteCode: 'MYPA-2X8Q',
      inviteLink: 'https://mypa.app/invite/MYPA-2X8Q',
    },
  ]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMembers, setNewMembers] = useState('');
  const [newPrivacy, setNewPrivacy] = useState<'public' | 'private'>('public');
  const [justJoinedCircle, setJustJoinedCircle] = useState<string | null>(null);

  // Check for pending circle actions from Inbox
  useEffect(() => {
    const checkForPendingAction = () => {
      try {
        const pendingAction = localStorage.getItem('pendingCircleAction');
        if (pendingAction) {
          const action = JSON.parse(pendingAction);
          if (action.action === 'join' && action.circleName) {
            // Find or create the circle
            const existingCircle = circles.find(c => 
              c.name.toLowerCase().includes(action.circleName.toLowerCase())
            );
            
            if (existingCircle) {
              // Join existing circle
              setCircles(prev => prev.map(c => {
                if (c.id === existingCircle.id) {
                  if (!c.members.some(m => m.initial === 'Y')) {
                    return {
                      ...c,
                      members: [...c.members, { initial: 'Y', posted: false }],
                      total: c.total + 1,
                    };
                  }
                }
                return c;
              }));
              setJustJoinedCircle(existingCircle.name);
            } else {
              // Create new circle with that name
              const inviteCode = generateInviteCode();
              const newCircle = {
                id: Math.max(0, ...circles.map(c => c.id)) + 1,
                name: action.circleName,
                members: [{ initial: 'Y', posted: false }],
                challenge: '',
                posted: 0,
                total: 1,
                streak: 0,
                lastActivity: 'just now',
                inviteCode: inviteCode,
                inviteLink: `https://mypa.app/invite/${inviteCode}`,
              };
              setCircles(prev => [newCircle, ...prev]);
              setJustJoinedCircle(action.circleName);
            }
            
            // Clear the pending action
            localStorage.removeItem('pendingCircleAction');
            
            // Clear the highlight after a few seconds
            setTimeout(() => setJustJoinedCircle(null), 3000);
          }
        }
      } catch (e) {
        console.error('Error processing pending circle action', e);
      }
    };
    
    checkForPendingAction();
  }, []);

  // Update parent about modal state
  useEffect(() => {
    const isAnyModalOpen = joinModalOpen || createOpen || longPressedCard !== null;
    onModalStateChange?.(isAnyModalOpen);
  }, [joinModalOpen, createOpen, longPressedCard, onModalStateChange]);

  // Handle long press for card actions
  const handleTouchStart = (circleId: number) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressedCard(circleId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  function handleCreateCircle() {
    if (!newName.trim()) return;

    const nextId = Math.max(0, ...circles.map(c => c.id)) + 1;
    const memberInitials = newMembers
      .split(',')
      .map(s => s.trim().charAt(0).toUpperCase())
      .filter(Boolean);

    const inviteCode = generateInviteCode();
    const newCircle = {
      id: nextId,
      name: newName.trim(),
      members: memberInitials.length ? memberInitials.map(initial => ({ initial, posted: false })) : [{ initial: 'A', posted: false }],
      challenge: '',
      posted: 0,
      total: memberInitials.length || 1,
      streak: 0,
      lastActivity: 'just now',
      privacy: newPrivacy,
      inviteCode: inviteCode,
      inviteLink: `https://mypa.app/invite/${inviteCode}`,
    } as any;

    setCircles([newCircle, ...circles]);
    setNewName('');
    setNewMembers('');
    setNewPrivacy('public');
    setCreateOpen(false);
  }

  function handleJoinCircle() {
    if (!joinCode.trim()) return;

    setJoinError('');
    const normalizedCode = joinCode.trim().toUpperCase();
    const foundCircle = circles.find(c => c.inviteCode === normalizedCode);

    if (!foundCircle) {
      setJoinError('Invalid code. Please check and try again.');
      return;
    }

    const updatedCircles = circles.map(c => {
      if (c.id === foundCircle.id) {
        if (c.members.some(m => m.initial === 'U')) {
          setJoinError('You are already a member of this circle.');
          return c;
        }
        return {
          ...c,
          members: [...c.members, { initial: 'U', posted: false }],
          total: c.total + 1,
        };
      }
      return c;
    });

    setCircles(updatedCircles);
    setJoinSuccess(true);
    setJoinCode('');
    
    setTimeout(() => {
      setJoinSuccess(false);
      setJoinModalOpen(false);
    }, 1500);
  }

  // Calculate filtered circles based on search and filter
  let filteredCircles = [...circles];

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredCircles = filteredCircles.filter(circle =>
      circle.name.toLowerCase().includes(query)
    );
  }

  if (filterChip === 'active') {
    filteredCircles = filteredCircles.filter(c => c.posted > 0);
  } else if (filterChip === 'your-turn') {
    filteredCircles = filteredCircles.filter(c => c.posted < c.total);
  }

  return (
    <div className="min-h-screen bg-ios-bg pb-28 relative overflow-hidden">
      <IOSStatusBar />
      
      <style>{`
        .ios-glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .circle-card {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: all 0.2s ease;
        }
        .circle-card:active {
          transform: scale(0.98);
        }
        .circle-card.expanded {
          transform: scale(1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slideUp 0.3s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fade-in { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .scale-in { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
      
      {/* Header */}
      <div className="px-5 pt-2 pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Circles</h1>
            <p className="text-[13px] text-slate-500 font-medium">{circles.length} circles • {circles.reduce((sum, c) => sum + c.total, 0)} members</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setJoinModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl ios-glass text-slate-700 text-[14px] font-semibold shadow-sm active:scale-95 transition-transform"
            >
              Join
            </button>
            <button 
              onClick={() => setCreateOpen(true)}
              className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="px-4 mb-4 relative z-10">
        <div className="ios-glass rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-[18px] font-bold text-slate-900">{circles.reduce((sum, c) => sum + c.streak, 0)}</p>
                  <p className="text-[11px] text-slate-500">Streaks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[18px] font-bold text-emerald-600">
                    {Math.round((circles.reduce((sum, c) => sum + c.posted, 0) / Math.max(1, circles.reduce((sum, c) => sum + c.total, 0))) * 100)}%
                  </p>
                  <p className="text-[11px] text-slate-500">Active</p>
                </div>
              </div>
            </div>
            
            {circles.some(c => c.posted < c.total) && (
              <button 
                onClick={() => alert('Nudge sent!')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 active:bg-amber-100 transition-colors"
              >
                <Bell className="w-4 h-4 text-amber-600" />
                <span className="text-[13px] font-semibold text-amber-700">Nudge</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-10 py-3 rounded-xl ios-glass shadow-sm outline-none text-slate-900 placeholder-slate-400 text-[15px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          
          {/* Filter Pills */}
          <div className="flex gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'your-turn', label: 'Pending' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterChip(tab.id as any)}
                className={`px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  filterChip === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-white/80 text-slate-600 shadow-sm"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Circles List */}
      <div className="px-4 space-y-3 relative z-10">
        {filteredCircles.length === 0 ? (
          <div className="ios-glass rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-[17px] font-semibold text-slate-900 mb-1">No circles found</h3>
            <p className="text-[14px] text-slate-500 mb-4">Create or join a circle to get started</p>
            <button 
              onClick={() => setCreateOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[14px] font-semibold active:scale-95 transition-transform"
            >
              Create Circle
            </button>
          </div>
        ) : (
          filteredCircles.map((circle, index) => (
            <div
              key={circle.id}
              className={`circle-card rounded-2xl shadow-sm slide-up overflow-hidden ${expandedCard === circle.id ? 'expanded' : ''} ${justJoinedCircle === circle.name ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Just Joined Banner */}
              {justJoinedCircle === circle.name && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-white" />
                  <span className="text-white text-[13px] font-semibold">Successfully joined!</span>
                </div>
              )}
              
              {/* Main Card Content */}
              <button
                onClick={() => {
                  if (expandedCard === circle.id) {
                    onNavigate?.('circle-home');
                  } else {
                    setExpandedCard(expandedCard === circle.id ? null : circle.id);
                  }
                }}
                onTouchStart={() => handleTouchStart(circle.id)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center gap-4">
                  {/* Circle Avatar */}
                  <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    index % 3 === 0 ? 'bg-gradient-to-br from-violet-500 to-purple-600' :
                    index % 3 === 1 ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
                    'bg-gradient-to-br from-emerald-500 to-teal-600'
                  }`}>
                    {index % 3 === 0 ? <Dumbbell className="w-6 h-6 text-white" /> : 
                     index % 3 === 1 ? <Briefcase className="w-6 h-6 text-white" /> : 
                     <BookOpen className="w-6 h-6 text-white" />}
                  </div>
                  
                  {/* Circle Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-[16px] font-semibold text-slate-900 truncate">{circle.name}</h3>
                      {circle.streak >= 7 && (
                        <div className="flex items-center gap-0.5 bg-orange-100 px-1.5 py-0.5 rounded-full">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span className="text-[10px] font-bold text-orange-600">{circle.streak}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-500">{circle.total} members • {circle.lastActivity}</p>
                  </div>

                  {/* Status & Arrow */}
                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      circle.posted === circle.total 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {circle.posted === circle.total ? (
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Done
                        </span>
                      ) : (
                        <span>{circle.posted}/{circle.total}</span>
                      )}
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform ${expandedCard === circle.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Member Progress Bar */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        circle.posted === circle.total 
                          ? 'bg-emerald-500' 
                          : 'bg-gradient-to-r from-violet-500 to-purple-500'
                      }`}
                      style={{ width: `${(circle.posted / circle.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex -space-x-1.5">
                    {circle.members.slice(0, 4).map((member, i) => (
                      <div 
                        key={i} 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 border-white ${
                          member.posted 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {member.initial}
                      </div>
                    ))}
                    {circle.members.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-white border-2 border-white">
                        +{circle.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Quick Actions */}
              {expandedCard === circle.id && (
                <div className="px-4 pb-4 pt-1 fade-in">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onNavigate?.('circle-home')}
                      className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-[13px] font-semibold active:scale-98 transition-transform"
                    >
                      Open Circle
                    </button>
                    <button 
                      onClick={() => alert(`Invite code: ${circle.inviteCode}`)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 active:bg-slate-200 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setLongPressedCard(circle.id)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 active:bg-slate-200 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Long Press Action Sheet */}
      {longPressedCard !== null && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm fade-in" 
            onClick={() => setLongPressedCard(null)} 
          />
          
          <div className="relative w-full max-w-[390px] bg-white rounded-t-[24px] p-2 pb-8 shadow-2xl scale-in">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 mt-2" />
            
            <div className="space-y-1">
              <button 
                onClick={() => {
                  onNavigate?.('circle-home');
                  setLongPressedCard(null);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-semibold text-slate-900">Open Circle</p>
                  <p className="text-[13px] text-slate-500">View posts and activity</p>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  const circle = circles.find(c => c.id === longPressedCard);
                  if (circle) alert(`Invite code: ${circle.inviteCode}`);
                  setLongPressedCard(null);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-semibold text-slate-900">Invite Members</p>
                  <p className="text-[13px] text-slate-500">Share invite code</p>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  alert('Circle settings');
                  setLongPressedCard(null);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-slate-600" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-semibold text-slate-900">Settings</p>
                  <p className="text-[13px] text-slate-500">Notifications & privacy</p>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  if (confirm('Leave this circle?')) {
                    setCircles(circles.filter(c => c.id !== longPressedCard));
                  }
                  setLongPressedCard(null);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-semibold text-red-600">Leave Circle</p>
                  <p className="text-[13px] text-slate-500">Remove yourself from this circle</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Circle Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm fade-in" onClick={() => setCreateOpen(false)} />

          <div className="relative w-full max-w-[390px] bg-white rounded-t-[24px] p-6 pb-10 shadow-2xl scale-in">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <h2 className="text-[20px] font-bold text-slate-900 mb-5">Create Circle</h2>

            <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full mb-4 px-4 py-3.5 rounded-xl bg-slate-100 outline-none text-slate-900 placeholder-slate-400 text-[15px]"
              placeholder="e.g. Weekend Runners"
            />

            <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Invite Members</label>
            <input
              value={newMembers}
              onChange={(e) => setNewMembers(e.target.value)}
              className="w-full mb-4 px-4 py-3.5 rounded-xl bg-slate-100 outline-none text-slate-900 placeholder-slate-400 text-[15px]"
              placeholder="Alex, Sam, Priya"
            />

            <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Privacy</label>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setNewPrivacy('public')}
                className={`flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all ${
                  newPrivacy === 'public' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Public
              </button>
              <button
                onClick={() => setNewPrivacy('private')}
                className={`flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all ${
                  newPrivacy === 'private' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Private
              </button>
            </div>

            <button
              onClick={handleCreateCircle}
              disabled={!newName.trim()}
              className="w-full py-4 rounded-xl bg-slate-900 text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              Create Circle
            </button>
          </div>
        </div>
      )}

      {/* Join Circle Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm fade-in" onClick={() => {
            setJoinModalOpen(false);
            setJoinError('');
            setJoinCode('');
          }} />

          <div className="relative w-full max-w-[390px] bg-white rounded-t-[24px] p-6 pb-10 shadow-2xl scale-in">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            
            {joinSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-[20px] font-bold text-slate-900">You're in!</h3>
                <p className="text-[14px] text-slate-500 mt-1">Successfully joined the circle</p>
              </div>
            ) : (
              <>
                <h2 className="text-[20px] font-bold text-slate-900 mb-2">Join Circle</h2>
                <p className="text-[14px] text-slate-500 mb-5">Enter the invite code to join</p>

                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                  placeholder="e.g. MYPA-7K2P"
                  className="w-full mb-4 px-4 py-4 rounded-xl bg-slate-100 outline-none text-slate-900 placeholder-slate-400 text-[17px] font-semibold text-center tracking-wider"
                />

                {joinError && (
                  <p className="text-[13px] text-red-500 mb-4 text-center">{joinError}</p>
                )}

                <button
                  onClick={handleJoinCircle}
                  disabled={!joinCode.trim()}
                  className="w-full py-4 rounded-xl bg-slate-900 text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  Join Circle
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}