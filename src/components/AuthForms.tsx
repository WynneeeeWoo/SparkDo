import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Sparkles, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { AuthView } from '../types';

interface AuthFormsProps {
  defaultView?: AuthView;
}

export default function AuthForms({ defaultView = 'login' }: AuthFormsProps) {
  const { login, register, resetPassword } = useAuth();
  const [view, setView] = useState<AuthView>(defaultView);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary text-on-primary mb-6 shadow-xl shadow-primary/20">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-black text-on-surface tracking-tight">SparkDo</h1>
          <p className="text-on-surface-variant mt-2 font-medium">Your scholastic command center</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/10 overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex border-b border-outline-variant/10">
            {(['login', 'register'] as AuthView[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${
                  view === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
                {view === tab && (
                  <motion.div
                    layoutId="authTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {view === 'login' && (
                <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <LoginForm onForgot={() => setView('forgot')} />
                </motion.div>
              )}
              {view === 'register' && (
                <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <RegisterForm />
                </motion.div>
              )}
              {view === 'forgot' && (
                <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <ForgotForm onBack={() => setView('login')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-on-surface-variant mt-8"
        >
          Local accounts stay on this device. Microsoft login uses your school&apos;s secure identity system.
        </motion.p>
      </div>
    </div>
  );
}

// --- Login Form ---

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { login, loginWithMicrosoft, requestAdminConsent, msalEnabled, adminConsentRequired } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msalLoading, setMsalLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.error || 'Login failed.');
    }
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm font-medium"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full pl-11 pr-12 py-3.5 bg-surface-container-low rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm font-medium"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-on-surface-variant hover:text-primary transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onForgot} className="text-xs font-bold text-primary hover:underline">
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <ArrowRight size={20} className="opacity-50" />
          </motion.div>
        ) : (
          <>
            Sign In <ArrowRight size={18} />
          </>
        )}
      </button>

      {msalEnabled && (
        <>
          <div className="relative flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-outline-variant/20"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">or</span>
            <div className="h-px flex-1 bg-outline-variant/20"></div>
          </div>

          <button
            type="button"
            onClick={async () => {
              setError('');
              setMsalLoading(true);
              const result = await loginWithMicrosoft();
              if (!result.success) {
                setError(result.error || 'Microsoft login failed.');
              }
              setMsalLoading(false);
            }}
            disabled={msalLoading}
            className="w-full py-4 bg-surface-container-lowest text-on-surface rounded-2xl font-bold flex items-center justify-center gap-3 border border-outline-variant/20 hover:bg-surface-container-low hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
          >
            {msalLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <ArrowRight size={20} className="opacity-50" />
              </motion.div>
            ) : (
              <>
                <MicrosoftLogo />
                Sign in with Microsoft
              </>
            )}
          </button>

          {adminConsentRequired && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <ShieldAlert size={20} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-bold text-amber-800">Admin Approval Required</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Your school&apos;s IT admin must approve SparkDo before it can access Teams assignments and class data.
                  </p>
                  <button
                    type="button"
                    onClick={requestAdminConsent}
                    className="text-xs font-bold text-amber-900 underline hover:no-underline"
                  >
                    Send admin consent request →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </form>
  );
}

// --- Register Form ---

function RegisterForm() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(name.trim(), email.trim(), password);
    if (!result.success) {
      setError(result.error || 'Registration failed.');
    }
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Archivist Julian"
            className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm font-medium"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm font-medium"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            className="w-full pl-11 pr-12 py-3.5 bg-surface-container-low rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm font-medium"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-on-surface-variant hover:text-primary transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {/* Strength bar */}
        {password && (
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  passwordStrength >= level
                    ? passwordStrength <= 2
                      ? 'bg-red-400'
                      : passwordStrength === 3
                        ? 'bg-orange-400'
                        : 'bg-green-500'
                    : 'bg-surface-container-high'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm font-medium"
            required
          />
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-500 font-medium ml-1">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <ArrowRight size={20} className="opacity-50" />
          </motion.div>
        ) : (
          <>
            Create Account <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}

// --- Forgot Password Form ---

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setIsSubmitting(true);
    const result = await resetPassword(email.trim());
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Something went wrong.');
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="text-xs font-bold text-primary hover:underline mb-4 flex items-center gap-1"
      >
        <ArrowRight size={14} className="rotate-180" /> Back to Sign In
      </button>

      <h3 className="text-xl font-bold text-on-surface mb-2">Reset Password</h3>
      <p className="text-sm text-on-surface-variant mb-6">
        Enter your email and we’ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-600 text-sm font-medium">
            <CheckCircle size={16} />
            Reset link sent! Check your inbox.
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm font-medium"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || success}
          className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <ArrowRight size={20} className="opacity-50" />
            </motion.div>
          ) : (
            <>Send Reset Link <ArrowRight size={18} /></>
          )}
        </button>
      </form>
    </div>
  );
}

// --- Helpers ---

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}
