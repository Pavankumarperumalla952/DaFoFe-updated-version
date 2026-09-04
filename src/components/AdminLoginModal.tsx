import React, { useState } from 'react';
import { Shield, Lock, Mail, Key, X, AlertCircle, CheckCircle2, UserPlus, LogIn, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { signInAdmin, registerAdmin, PRIMARY_SUPER_ADMIN_EMAIL } from '../firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email address and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await signInAdmin(email, password);
        setSuccessMsg('Authentication successful. Redirecting to Admin Console...');
        setTimeout(() => {
          setLoading(false);
          onLoginSuccess();
          onClose();
        }, 500);
      } else {
        await registerAdmin(email, password);
        setSuccessMsg('Admin account created successfully! Signing in...');
        setTimeout(() => {
          setLoading(false);
          onLoginSuccess();
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setLoading(false);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid admin email or password. Please verify your credentials.');
      } else if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please switch to Sign In.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError(err?.message || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2B22]/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#F4F1E6] border-4 border-[#1E2B22] shadow-[8px_8px_0px_0px_rgba(30,43,34,1)] rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1E2B22] text-[#EDEEE8] p-4 flex items-center justify-between border-b-4 border-[#E8A93A]">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#E8A93A] text-[#1E2B22] p-1.5 rounded">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-oswald font-black text-lg sm:text-xl uppercase tracking-wide text-white leading-none">
                Admin Portal Login
              </h3>
              <p className="font-mono-plex text-[10px] text-[#E8A93A] tracking-wider uppercase font-semibold">
                DaFoFe Hostel Management & Quality Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded hover:bg-[#2B3A2E] text-[#D9DBD1] hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 bg-[#EDEEE8] p-1 rounded-xl border-2 border-[#1E2B22]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-oswald font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#1E2B22] text-white shadow-xs'
                  : 'text-[#585B52] hover:text-[#1E2B22]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-[#E8A93A]" />
              <span>Admin Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-oswald font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#1E2B22] text-white shadow-xs'
                  : 'text-[#585B52] hover:text-[#1E2B22]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#E8A93A]" />
              <span>Register Admin</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[#B5484D]/10 border-2 border-[#B5484D] text-[#B5484D] p-3 rounded-xl flex items-start gap-2.5 text-xs font-mono-plex">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="bg-[#5C8A56]/15 border-2 border-[#5C8A56] text-[#1E2B22] p-3 rounded-xl flex items-start gap-2.5 text-xs font-mono-plex font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5C8A56] mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="font-mono-plex text-xs font-bold text-[#1E2B22] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#E8A93A]" />
                <span>Admin Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="warden@hostel.edu or admin@daffofe.com"
                className="w-full bg-white border-2 border-[#1E2B22] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono-plex text-[#1E2B22] placeholder:text-[#888B80] focus:outline-hidden focus:border-[#E8A93A] focus:ring-2 focus:ring-[#E8A93A]/30 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono-plex text-xs font-bold text-[#1E2B22] uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#E8A93A]" />
                <span>Admin Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-[#1E2B22] rounded-xl px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-mono-plex text-[#1E2B22] placeholder:text-[#888B80] focus:outline-hidden focus:border-[#E8A93A] focus:ring-2 focus:ring-[#E8A93A]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#585B52] hover:text-[#1E2B22] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' ? (
              <div className="bg-[#E8A93A]/15 border-2 border-[#E8A93A] p-3 rounded-xl text-[11px] font-mono-plex text-[#1E2B22] space-y-1.5">
                <p className="font-bold flex items-center gap-1 text-[#1E2B22]">
                  <Lock className="w-3.5 h-3.5 text-[#E8A93A]" />
                  Designated Admin & Whitelist Notice:
                </p>
                <p className="text-[#3A4036] leading-tight">
                  Only the primary designated owner email (<strong className="font-bold text-[#1E2B22]">{PRIMARY_SUPER_ADMIN_EMAIL}</strong>) or emails pre-authorized by an existing Admin can register as an active Hostel Admin.
                </p>
              </div>
            ) : (
              <div className="bg-[#EDEEE8] border border-[#1E2B22]/20 p-2.5 rounded-xl text-[11px] font-mono-plex text-[#585B52] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#1E2B22] shrink-0" />
                <span>Only authorized Warden & Committee accounts can log in.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E2B22] hover:bg-[#2B3A2E] text-white border-2 border-[#1E2B22] font-oswald font-bold uppercase tracking-wider text-sm py-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(232,169,58,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4 text-[#E8A93A]" />
                  <span>Authenticate & Open Dashboard</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-[#E8A93A]" />
                  <span>Create Admin Account</span>
                </>
              )}
            </button>
          </form>

          {/* Privacy & Security Note */}
          <div className="border-t border-[#1E2B22]/15 pt-3 text-center">
            <p className="font-mono-plex text-[10px] text-[#585B52]">
              🔒 Protected by Firebase Firestore RBAC Security Rules.
              <br />
              Normal students cannot read administrative analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
