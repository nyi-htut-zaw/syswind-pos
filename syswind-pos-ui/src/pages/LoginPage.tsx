import React, { useState } from 'react';
import { Wind, Lock, User, AlertCircle, ShieldCheck, Building2 } from 'lucide-react';
import { api, setAuthToken, setStoredUser } from '../api/client';
import { User as UserType } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('ကျေးဇူးပြု၍ အသုံးပြုသူအမည်နှင့် စကားဝှက်ကို ထည့်သွင်းပေးပါရန်။');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      if (res.success && res.token) {
        setAuthToken(res.token);
        setStoredUser(res.user);
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'ဝင်ရောက်မှု မအောင်မြင်ပါ။ စကားဝှက် သို့မဟုတ် အကောင့် မှန်မမှန် စစ်ဆေးပေးပါ။');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Background glow ornaments */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand logo & header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-emerald-400 flex items-center justify-center shadow-xl shadow-brand-500/25 mx-auto ring-1 ring-white/20">
            <Wind className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            SYSWIND <span className="text-brand-400">OPERATIONS</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Myanmar E-Commerce Operations & Multi-Tenant Management Hub
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-brand-400" />
            <span>Syswind Myanmar Retail & Logistics Group</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl relative">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Sign In to Your Workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              စနစ်သို့ ဝင်ရောက်ရန် သင့်အကောင့်အချက်အလက်ကို ထည့်သွင်းပါ
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Username or Work Email (အသုံးပြုသူအမည် သို့မဟုတ် အီးမေးလ်)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. sysadmin or your employee username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Password (စကားဝှက်)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
            >
              <span>{loading ? 'စစ်ဆေးနေပါသည်...' : 'Sign In / စနစ်တွင်းသို့ ဝင်ရောက်မည်'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <span className="font-mono text-slate-400">v2.0 Enterprise</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400">
          Syswind Management Platform © 2026. Tailored for Myanmar Online Businesses.
        </p>
      </div>
    </div>
  );
};
