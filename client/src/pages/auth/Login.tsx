import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield, User, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login({ email, password });
    setLoading(false);

    if (res.success) {
      success('Welcome back to ProjectForge AI!');
      navigate('/dashboard');
    } else {
      setErrorMsg(res.error || 'Invalid credentials');
    }
  };

  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem('projectforge_api_base') || '');

  const handleDemoStudent = () => {
    setEmail('student@projectforge.ai');
    setPassword('Password123!');
  };

  const handleDemoAdmin = () => {
    setEmail('admin@projectforge.ai');
    setPassword('AdminSecure2026!');
  };

  const handleSaveServerUrl = () => {
    if (serverUrl.trim()) {
      localStorage.setItem('projectforge_api_base', serverUrl.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('projectforge_api_base');
    }
    setShowServerConfig(false);
    window.location.reload();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-2 sm:px-4">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-3 shadow-lg shadow-indigo-600/20">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Sign in to continue building your portfolio projects</p>
        </div>

        {/* Quick Demo Fill Credentials Cards (Standalone & Mobile Ready) */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              ⚡ Preloaded Login Credentials
            </span>
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              className="text-[10px] text-slate-400 hover:text-indigo-300 underline"
            >
              {showServerConfig ? 'Close Server' : 'Backend URL'}
            </button>
          </div>

          {showServerConfig && (
            <div className="mb-3 p-2.5 bg-slate-900 rounded-xl border border-slate-700/60 text-xs">
              <label className="block text-[10px] text-slate-400 mb-1">API Backend URL (for APK / Remote):</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="http://192.168.1.4:5000/api"
                  value={serverUrl}
                  onChange={e => setServerUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleSaveServerUrl}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDemoStudent}
              className="text-left p-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Student</span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono truncate">student@projectforge.ai</div>
              <div className="text-[10px] text-slate-400 font-mono">Password123!</div>
            </button>

            <button
              type="button"
              onClick={handleDemoAdmin}
              className="text-left p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono truncate">admin@projectforge.ai</div>
              <div className="text-[10px] text-slate-400 font-mono">AdminSecure2026!</div>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In to ProjectForge</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
