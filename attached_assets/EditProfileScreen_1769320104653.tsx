import { 
  ArrowLeft, 
  User,
  Mail,
  Phone,
  Camera,
  ChevronRight,
  Check,
  X,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  Shield
} from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";
import { MYPAOrb } from "../components/MYPAOrb";
import { useState } from "react";

interface EditProfileScreenProps {
  onNavigate?: (screen: string) => void;
}

export function EditProfileScreen({ onNavigate }: EditProfileScreenProps) {
  const [displayName, setDisplayName] = useState('Khalid Ahmed');
  const [username, setUsername] = useState('khalid_m');
  const [email, setEmail] = useState('khalid@email.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [bio, setBio] = useState('Productivity enthusiast');
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const handleUsernameChange = (value: string) => {
    setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    if (value.length >= 3) {
      setCheckingUsername(true);
      // Simulate availability check
      setTimeout(() => {
        setUsernameAvailable(value !== 'taken_username');
        setCheckingUsername(false);
      }, 500);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onNavigate?.('profile');
    }, 1500);
  };

  const handleChangePassword = () => {
    if (newPassword === confirmPassword && newPassword.length >= 8) {
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate?.('profile')}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-[24px] font-bold text-slate-900">Edit Profile</h1>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[14px] font-semibold active:scale-95 transition-transform"
          >
            Save
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-emerald-500 text-white text-[14px] font-semibold flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
          <Check className="w-5 h-5" />
          Profile Updated!
        </div>
      )}

      <div className="px-5 space-y-5">
        
        {/* Profile Picture */}
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden">
              <MYPAOrb size="lg" showGlow={false} />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-lg border-2 border-white">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <button className="mt-3 text-[14px] font-semibold text-purple-600">
            Change Photo
          </button>
        </div>

        {/* Basic Info */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Basic Information
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            {/* Display Name */}
            <div className="p-4 border-b border-slate-100">
              <label className="text-[12px] font-medium text-slate-500 block mb-1">
                Display Name
              </label>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 outline-none text-[16px] text-slate-900 bg-transparent"
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Username */}
            <div className="p-4 border-b border-slate-100">
              <label className="text-[12px] font-medium text-slate-500 block mb-1">
                Username
              </label>
              <div className="flex items-center gap-3">
                <AtSign className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="flex-1 outline-none text-[16px] text-slate-900 bg-transparent"
                  placeholder="username"
                />
                {checkingUsername && (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-purple-500 rounded-full animate-spin" />
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <Check className="w-5 h-5 text-emerald-500" />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <X className="w-5 h-5 text-red-500" />
                )}
              </div>
              {usernameAvailable === false && (
                <p className="text-[12px] text-red-500 mt-1 pl-8">Username is taken</p>
              )}
              {usernameAvailable === true && (
                <p className="text-[12px] text-emerald-600 mt-1 pl-8">Username is available!</p>
              )}
            </div>

            {/* Bio */}
            <div className="p-4">
              <label className="text-[12px] font-medium text-slate-500 block mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full outline-none text-[16px] text-slate-900 bg-transparent resize-none h-16"
                placeholder="Tell us about yourself..."
                maxLength={100}
              />
              <p className="text-[11px] text-slate-400 text-right">{bio.length}/100</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Contact Information
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            {/* Email */}
            <div className="p-4 border-b border-slate-100">
              <label className="text-[12px] font-medium text-slate-500 block mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 outline-none text-[16px] text-slate-900 bg-transparent"
                  placeholder="your@email.com"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 pl-8">Used for account recovery & notifications</p>
            </div>

            {/* Phone */}
            <div className="p-4">
              <label className="text-[12px] font-medium text-slate-500 block mb-1">
                Phone Number
              </label>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 outline-none text-[16px] text-slate-900 bg-transparent"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 pl-8">Optional • For 2FA & SMS alerts</p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            Security
          </h2>
          <div className="ios-card overflow-hidden shadow-sm">
            {/* Change Password */}
            <button 
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-medium text-slate-900">Change Password</p>
                  <p className="text-[12px] text-slate-500">Last changed 30 days ago</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>

            {/* Two-Factor Auth */}
            <button className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-medium text-slate-900">Two-Factor Authentication</p>
                  <p className="text-[12px] text-emerald-600 font-medium">Enabled</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-[13px] font-semibold text-red-500 uppercase tracking-wide mb-2 px-1">
            Danger Zone
          </h2>
          <div className="ios-card overflow-hidden shadow-sm border border-red-100">
            <button 
              onClick={() => setShowDeleteAccount(true)}
              className="w-full flex items-center justify-between p-4 active:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                  <X className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-medium text-red-600">Delete Account</p>
                  <p className="text-[12px] text-slate-500">Permanently delete your account & data</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setShowChangePassword(false)}
          />
          <div className="fixed inset-0 flex items-end z-50 pointer-events-none">
            <div 
              className="w-full bg-white rounded-t-[32px] p-6 pointer-events-auto"
              style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}
            >
              <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              
              <h2 className="text-[20px] font-bold text-slate-900 mb-5">Change Password</h2>

              <div className="space-y-4 mb-6">
                {/* Current Password */}
                <div>
                  <label className="text-[13px] font-semibold text-slate-700 block mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-100 outline-none text-slate-900 text-[15px]"
                      placeholder="Enter current password"
                    />
                    <button
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5 text-slate-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-[13px] font-semibold text-slate-700 block mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-100 outline-none text-slate-900 text-[15px]"
                      placeholder="At least 8 characters"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5 text-slate-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-[12px] text-red-500 mt-1">Password must be at least 8 characters</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-[13px] font-semibold text-slate-700 block mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 outline-none text-slate-900 text-[15px]"
                    placeholder="Confirm new password"
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[12px] text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 py-4 rounded-full bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="flex-1 py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-semibold disabled:opacity-50"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setShowDeleteAccount(false)}
          />
          <div className="fixed inset-0 flex items-end z-50 pointer-events-none">
            <div 
              className="w-full bg-white rounded-t-[32px] p-6 pointer-events-auto"
              style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}
            >
              <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              
              <div className="text-center mb-5">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-900">Delete Account?</h2>
                <p className="text-[14px] text-slate-500 mt-2">
                  This action cannot be undone. All your data, including tasks, achievements, and circle memberships will be permanently deleted.
                </p>
              </div>

              <div className="mb-6">
                <label className="text-[13px] font-semibold text-slate-700 block mb-2">
                  Type "DELETE" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 outline-none text-slate-900 text-[15px] text-center font-semibold tracking-widest"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 py-4 rounded-full bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="flex-1 py-4 rounded-full bg-red-500 text-white font-semibold disabled:opacity-50"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
