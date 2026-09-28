import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context';
import {
  Compass,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Send
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please provide your registered mission email.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch password recovery link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Arctic Glow & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4915_1px,transparent_1px),linear-gradient(to_bottom,#082f4915_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-lg shadow-cyan-950/80 mb-1">
            <Compass className="w-6 h-6 text-cyan-400 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white uppercase font-sans">
            POLAR<span className="text-cyan-400 font-mono">-X</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Security Clearance Recovery
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white">Reset Security Clearance</h2>
            <p className="text-xs text-slate-400">
              Receive an encrypted password recovery link via satellite comms
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {success ? (
            <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white">Recovery Link Dispatched</h3>
                <p className="text-xs text-slate-300 mt-1">
                  We have transmitted a password reset link to <strong className="text-emerald-300">{email}</strong>.
                  Follow the instructions to update your clearance.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Registered Mission Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@polar-x.ncpor.gov.in"
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
                  <span>Dispatching Reset Request...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Reset Instructions</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                <Link to="/login" className="inline-flex items-center gap-1 text-cyan-400 hover:underline">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
