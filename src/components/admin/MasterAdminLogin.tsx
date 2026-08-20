import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, AlertCircle, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { verifyAdminInFirestore } from '../../services/adminService';

interface MasterAdminLoginProps {
  onLoginSuccess: () => void;
  onBackToApp: () => void;
}

export const MasterAdminLogin: React.FC<MasterAdminLoginProps> = ({ onLoginSuccess, onBackToApp }) => {
  const [email, setEmail] = useState('localride369@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both admin email and secure password.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify admin role against Firestore / security registry
      const isAuthorized = await verifyAdminInFirestore(email.trim());
      if (!isAuthorized) {
        setError('Access Denied: This email address is not authorized as a verified Master Admin.');
        setIsLoading(false);
        return;
      }

      // 2. Attempt authentication with Firebase Auth
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onLoginSuccess();
      } catch (signInErr: any) {
        const code = signInErr.code || '';
        // If user doesn't exist or invalid credential for authorized admin, bootstrap the account automatically
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
          try {
            await createUserWithEmailAndPassword(auth, email.trim(), password);
            onLoginSuccess();
            return;
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              setError('Incorrect password. For instant access without passwords, click "Continue with Google" below!');
            } else {
              setError(`Authentication failed: ${signInErr.message || 'Invalid credentials'}`);
            }
          }
        } else if (code === 'auth/invalid-email') {
          setError('Invalid email address format.');
        } else if (code === 'auth/too-many-requests') {
          setError('Too many failed login attempts. Please try again later.');
        } else {
          setError(signInErr.message || 'Authentication failed. Please verify your password or use Google Sign-In.');
        }
      }
    } catch (err: any) {
      console.error('Master Admin login error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;
      
      const isAuthorized = await verifyAdminInFirestore(userEmail);
      if (!isAuthorized) {
        setError('Access Denied: The Google account signed in is not authorized as a Master Admin.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      console.error('Google admin login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    setSuccessMessage(null);
    if (!email.trim()) {
      setError('Please enter your admin email address first.');
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage('Password reset email sent! Please check your inbox / spam folder for maninaredla218@gmail.com.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />
      </div>

      <div className="w-full max-w-md relative z-10 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToApp}
            className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storelly
          </button>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Secure Access
          </span>
        </div>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30 text-2xl font-black">
            S
          </div>
          <h1 className="text-2xl font-black text-white font-heading tracking-tight">
            Master Admin Control Center
          </h1>
          <p className="text-xs text-slate-400">
            Authorized Storelly Platform Ownership & SaaS Management Portal
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@storelly.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 pl-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Secure Password</label>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isResetting}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer flex items-center gap-1"
              >
                {isResetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                Reset Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 pl-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                Access Control Center <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500 font-bold">Or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.19v3.15C3.17 21.31 7.27 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.19C.43 8.15 0 9.89 0 12s.43 3.85 1.19 5.4l4.08-3.16z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.27 0 3.17 2.69 1.19 6.6l4.08 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          Continue with Google (Instant Admin Login)
        </button>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-500">
            Restricted System. All administrative actions are logged with audit metadata for platform security.
          </p>
        </div>
      </div>
    </div>
  );
};
