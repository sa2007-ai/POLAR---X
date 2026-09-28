import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context';
import { UserRole } from '../types/auth';
import {
  Compass,
  Lock,
  Mail,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Activity,
  Package,
  Layers,
  Eye
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isDemoMode, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both mission email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication rejected by Polar Gateway.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    switchDemoRole(role);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Arctic Glow & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4915_1px,transparent_1px),linear-gradient(to_bottom,#082f4915_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-lg shadow-cyan-950/80 mb-2">
            <Compass className="w-8 h-8 text-cyan-400 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white uppercase font-sans">
            POLAR<span className="text-cyan-400 font-mono">-X</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Integrated Polar Expedition Logistics & Asset Management
          </p>
          {isDemoMode && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive Evaluation & Demo Mode Active</span>
            </div>
          )}
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white">Operator Sign In</h2>
            <p className="text-xs text-slate-400">Authenticate using your scientific or defense credentials</p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Mission Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator.name@polar-x.ncpor.gov.in"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold text-slate-300">Security Clearance Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-950/80 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span>Validating Mesh Credentials...</span>
              ) : (
                <>
                  <span>Authenticate & Enter Command Grid</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Role Switcher for Hackathon Evaluation (Enabled in Demo Mode) */}
          {isDemoMode && (
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Quick Role Evaluator (1-Click)
                </span>
                <span className="text-[10px] font-mono text-cyan-400">SIH Fast Access</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('ADMIN')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-white block text-[11px] truncate">Admin Commander</span>
                    <span className="text-[9px] text-slate-400 font-mono">Full Access</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('EXPEDITION_MANAGER')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/50 text-left transition-colors flex items-center gap-2"
                >
                  <Compass className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-white block text-[11px] truncate">Expedition Mgr</span>
                    <span className="text-[9px] text-slate-400 font-mono">Ops & Traverses</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('LOGISTICS_OFFICER')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-left transition-colors flex items-center gap-2"
                >
                  <Package className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-white block text-[11px] truncate">Logistics Officer</span>
                    <span className="text-[9px] text-slate-400 font-mono">Cargo & Stock</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('MEDICAL_OFFICER')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-left transition-colors flex items-center gap-2"
                >
                  <Activity className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-white block text-[11px] truncate">Medical Officer</span>
                    <span className="text-[9px] text-slate-400 font-mono">Health & SOS</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('SCIENTIST')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-white block text-[11px] truncate">Scientist / Lead</span>
                    <span className="text-[9px] text-slate-400 font-mono">Research Data</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('VIEWER')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-left transition-colors flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-white block text-[11px] truncate">Observer / Viewer</span>
                    <span className="text-[9px] text-slate-400 font-mono">Read-Only</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 text-center text-xs text-slate-400">
            Need operator access?{' '}
            <Link to="/register" className="text-cyan-400 font-semibold hover:underline">
              Register New Personnel
            </Link>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="text-center text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>NCPOR Polar Telemetry Mesh • Encrypted Protocol 2026</span>
        </div>
      </div>
    </div>
  );
};
