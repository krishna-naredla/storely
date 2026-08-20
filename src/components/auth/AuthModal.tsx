import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        onClose();
      } else if (mode === 'signup') {
        if (!email.trim() || !password) {
          throw new Error('Please provide email and password');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await signup(email.trim(), password, displayName.trim());
        onClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your registered email address');
        }
        await resetPassword(email.trim());
        setSuccessMsg('Password reset instructions sent to your email.');
      }
    } catch (err: any) {
      let msg = err.message || 'Authentication error';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        msg = 'Invalid email or password. Please try again.';
      } else if (msg.includes('email-already-in-use')) {
        msg = 'An account with this email already exists. Please login.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-lg mb-3 shadow-md shadow-emerald-600/20">
            S
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            {mode === 'login'
              ? 'Vendor Sign In'
              : mode === 'signup'
              ? 'Create Storelly Account'
              : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Sign in to access your business dashboard, catalog, and orders.'
              : mode === 'signup'
              ? 'Start managing your digital store, instant WhatsApp checkout & bookings.'
              : 'Enter your email to receive a password reset link.'}
          </p>
          {mode === 'login' && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Master Admin Note:</span> If you are logging in with <span className="font-mono font-bold">localride369@gmail.com</span> (or maninaredla218@gmail.com) for the first time, click <button type="button" onClick={() => setMode('signup')} className="underline font-bold text-emerald-700 hover:text-emerald-800">Sign up free</button> to create your password, or use <span className="font-bold">Continue with Google</span> above!
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        {mode !== 'forgot' && (
          <div className="space-y-4 mb-4">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-3 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                Or with email
              </span>
            </div>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('forgot');
                    }}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Please wait...</span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? 'Sign In to Dashboard'
                    : mode === 'signup'
                    ? 'Create Free Store'
                    : 'Send Reset Link'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signup');
                }}
                className="font-bold text-emerald-600 hover:text-emerald-700"
              >
                Sign up free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="font-bold text-emerald-600 hover:text-emerald-700"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
