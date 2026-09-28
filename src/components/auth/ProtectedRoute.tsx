import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { AppModule } from '../../types/auth';
import { canView, getRoleDisplayName } from '../../utils/permissions';
import { ShieldAlert, ArrowLeft, RefreshCw, Compass } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: AppModule;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, module }) => {
  const { userProfile, loading, profileStatus, isDemoMode, switchDemoRole } = useAuth();
  const location = useLocation();

  if (loading || profileStatus === 'LOADING') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center animate-pulse">
          <Compass className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
        <div className="text-center font-mono">
          <p className="text-xs font-bold text-white uppercase tracking-wider">Verifying Security Clearance</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Resolving Authoritative Profile from Cloud Firestore...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check module permission if specified
  if (module && !canView(userProfile, module)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center mb-4 shadow-xl">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Security Clearance Required</h2>
        <p className="text-xs font-mono text-slate-400 max-w-md mt-2 leading-relaxed">
          Your current clearance level (<strong className="text-cyan-300">{getRoleDisplayName(userProfile.role)}</strong>) does not have authorization to access the <strong className="text-white uppercase font-sans">[{module}]</strong> telemetry grid.
        </p>

        {isDemoMode && (
          <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 max-w-lg w-full space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
              <RefreshCw className="w-4 h-4" />
              <span>Demo Mode Role Switcher (Simulated Elevation)</span>
            </div>
            <p className="text-[11px] text-slate-400 text-left">
              Switch clearance level to test and evaluate module authorization:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => switchDemoRole('ADMIN')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors truncate"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('EXPEDITION_MANAGER')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors truncate"
              >
                Expedition Lead
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('LOGISTICS_OFFICER')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors truncate"
              >
                Logistics
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('SCIENTIST')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors truncate"
              >
                Scientist
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('MEDICAL_OFFICER')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors truncate"
              >
                Medical Lead
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('VIEWER')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-400 bg-slate-950 hover:bg-slate-900 border border-slate-800 transition-colors truncate"
              >
                Viewer
              </button>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Mission Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
