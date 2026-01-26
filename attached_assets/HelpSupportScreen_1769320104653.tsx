import { 
  ArrowLeft, 
  MessageCircle, 
  Mail, 
  FileText, 
  HelpCircle, 
  ChevronRight,
  ExternalLink,
  BookOpen,
  Video,
  Search,
  Star,
  Bug,
  Lightbulb,
  ShieldCheck,
  Clock,
  Check,
  Send,
  X,
  Phone,
  Globe
} from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { useState } from "react";

interface HelpSupportScreenProps {
  onNavigate?: (screen: string) => void;
}

export function HelpSupportScreen({ onNavigate }: HelpSupportScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactType, setContactType] = useState<'general' | 'bug' | 'feature'>('general');
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('user@email.com');
  const [messageSent, setMessageSent] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: "How do I connect my calendar?",
      answer: "Go to Settings > App Settings > Connected Services. You can connect Google Calendar, Apple Calendar, or Outlook. Simply tap the toggle next to the service you want to connect and follow the authentication prompts.",
      category: "integrations"
    },
    {
      id: 2,
      question: "What is a Circle?",
      answer: "Circles are accountability groups where you can share your daily progress with friends, family, or colleagues. You can assign tasks to each other, share daily life cards, and keep each other motivated. Create or join up to 5 circles.",
      category: "features"
    },
    {
      id: 3,
      question: "How does the Time Wallet work?",
      answer: "The Time Wallet tracks time you save by completing tasks efficiently. When you finish a task early or batch similar tasks together, MYPA calculates the time saved. You can then 'spend' this saved time on breaks or leisure activities.",
      category: "features"
    },
    {
      id: 4,
      question: "How do I change my notification settings?",
      answer: "Go to Profile > App Settings > Permissions. You can enable or disable notifications, customize what types of notifications you receive, and set quiet hours to avoid disturbances during specific times.",
      category: "settings"
    },
    {
      id: 5,
      question: "Can I export my data?",
      answer: "Yes! Go to Settings > App Settings > Data & Storage > Export My Data. You'll receive a downloadable file containing all your tasks, achievements, circles data, and settings in a portable format.",
      category: "privacy"
    },
    {
      id: 6,
      question: "What are XP and Levels?",
      answer: "XP (Experience Points) are earned by completing tasks, maintaining streaks, achieving goals, and participating in circles. As you accumulate XP, you level up and unlock achievements. Higher levels unlock new features and customizations.",
      category: "gamification"
    },
    {
      id: 7,
      question: "How do I reset my day?",
      answer: "Use the Reset feature from the Hub to recalibrate your day. This is useful when plans change - MYPA will help you reprioritize tasks and adjust your schedule without losing progress. It's not a hard reset, just a smart adjustment.",
      category: "features"
    },
    {
      id: 8,
      question: "Is my data private?",
      answer: "Absolutely. Your personal data is encrypted and stored securely. In Circles, you control exactly what you share - you can choose to share only metrics (like task completion rates) without revealing specific task details. Check Privacy Controls for granular settings.",
      category: "privacy"
    },
  ];

  const filteredFaqs = searchQuery 
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const quickLinks = [
    { id: 'guide', label: 'Getting Started Guide', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
    { id: 'video', label: 'Video Tutorials', icon: Video, color: 'from-red-500 to-red-600' },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck, color: 'from-emerald-500 to-emerald-600' },
    { id: 'terms', label: 'Terms of Service', icon: FileText, color: 'from-slate-500 to-slate-600' },
  ];

  const handleSubmitContact = () => {
    // Simulate sending
    setMessageSent(true);
    setTimeout(() => {
      setShowContactForm(false);
      setMessageSent(false);
      setContactMessage('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-ios-bg pb-28">
      <IOSStatusBar />
      
      <style>{`
        .ios-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
        }
      `}</style>

      {/* Header */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate?.('profile')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-[24px] font-bold text-slate-900">Help & Support</h1>
        </div>
      </div>

      <div className="px-5 space-y-5">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help articles..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white shadow-sm outline-none text-slate-900 placeholder-slate-400 text-[15px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => { setContactType('general'); setShowContactForm(true); }}
            className="ios-card p-4 text-center shadow-sm active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-purple-500/20">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <p className="text-[13px] font-semibold text-slate-800">Chat</p>
            <p className="text-[11px] text-slate-500">Message us</p>
          </button>

          <button
            onClick={() => { setContactType('bug'); setShowContactForm(true); }}
            className="ios-card p-4 text-center shadow-sm active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-red-500/20">
              <Bug className="w-6 h-6 text-white" />
            </div>
            <p className="text-[13px] font-semibold text-slate-800">Bug</p>
            <p className="text-[11px] text-slate-500">Report issue</p>
          </button>

          <button
            onClick={() => { setContactType('feature'); setShowContactForm(true); }}
            className="ios-card p-4 text-center shadow-sm active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-amber-500/20">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <p className="text-[13px] font-semibold text-slate-800">Idea</p>
            <p className="text-[11px] text-slate-500">Suggest feature</p>
          </button>
        </div>

        {/* Response Time Notice */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
          <Clock className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-[13px] font-medium text-emerald-800">Typical response time</p>
            <p className="text-[12px] text-emerald-600">Under 24 hours</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Frequently Asked Questions
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            {filteredFaqs.length === 0 ? (
              <div className="p-6 text-center">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-[14px] text-slate-500">No results found</p>
                <p className="text-[12px] text-slate-400">Try a different search term</p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <button
                  key={faq.id}
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className={`w-full text-left p-4 active:bg-slate-50 transition-colors ${
                    index < filteredFaqs.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-slate-900">{faq.question}</p>
                      {expandedFaq === faq.id && (
                        <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 text-slate-300 flex-shrink-0 transition-transform ${
                        expandedFaq === faq.id ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Resources
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  className={`w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors ${
                    index < quickLinks.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-900">{link.label}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Community & Social */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Community
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            <button className="w-full flex items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">MYPA Community</p>
                  <p className="text-[12px] text-slate-500">Join discussions & tips</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-300" />
            </button>
            <button className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-900">Rate MYPA</p>
                  <p className="text-[12px] text-slate-500">Leave a review</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="ios-card p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-5 h-5 text-slate-400" />
            <p className="text-[14px] text-slate-600">support@mypa.app</p>
          </div>
          <p className="text-[12px] text-slate-400">
            For urgent matters, you can email us directly. We typically respond within 24 hours on business days.
          </p>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => !messageSent && setShowContactForm(false)}
          />
          <div className="fixed inset-0 flex items-end z-50 pointer-events-none">
            <div 
              className="w-full bg-white rounded-t-[32px] p-6 pointer-events-auto max-h-[85vh] overflow-y-auto"
              style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}
            >
              <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              
              {messageSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-[20px] font-bold text-slate-900">Message Sent!</h3>
                  <p className="text-[14px] text-slate-500 mt-2">We'll get back to you within 24 hours</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[20px] font-bold text-slate-900">
                      {contactType === 'bug' ? 'Report a Bug' : 
                       contactType === 'feature' ? 'Suggest a Feature' : 
                       'Contact Us'}
                    </h2>
                    <button 
                      onClick={() => setShowContactForm(false)}
                      className="p-2 hover:bg-slate-100 rounded-full"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  {/* Contact Type Pills */}
                  <div className="flex gap-2 mb-5">
                    {[
                      { id: 'general', label: 'General', icon: MessageCircle },
                      { id: 'bug', label: 'Bug', icon: Bug },
                      { id: 'feature', label: 'Feature', icon: Lightbulb },
                    ].map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setContactType(type.id as 'general' | 'bug' | 'feature')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                            contactType === type.id
                              ? 'bg-gradient-to-r from-primary to-secondary text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Email */}
                  <div className="mb-4">
                    <label className="text-[13px] font-semibold text-slate-700 block mb-2">
                      Your Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 outline-none text-slate-900 text-[15px]"
                    />
                  </div>

                  {/* Message */}
                  <div className="mb-5">
                    <label className="text-[13px] font-semibold text-slate-700 block mb-2">
                      {contactType === 'bug' ? 'Describe the issue' : 
                       contactType === 'feature' ? 'Your idea' : 
                       'Message'}
                    </label>
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={
                        contactType === 'bug' 
                          ? "What happened? What did you expect to happen?"
                          : contactType === 'feature'
                          ? "Describe the feature you'd like to see..."
                          : "How can we help?"
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 outline-none text-slate-900 text-[15px] h-32 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSubmitContact}
                    disabled={!contactMessage.trim()}
                    className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
