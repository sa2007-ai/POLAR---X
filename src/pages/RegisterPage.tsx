import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { UserRole } from '../types/auth';
import { isSihDemoRoleRegistrationEnabled } from '../firebase/config';
import {
  Compass,
  Lock,
  Mail,
  User,
  Shield,
  Building2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  IdCard,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

const AVAILABLE_ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'ADMIN',
    label: 'ADMIN (Station Command & Executive Director)',
    description: 'Full administrative authority across all operational modules, clearances, and cloud settings.'
  },
  {
    value: 'EXPEDITION_MANAGER',
    label: 'EXPEDITION_MANAGER (Operations & Field Lead)',
    description: 'Autonomous management of traverses, personnel assignments, routes, SAR deployments, and incident protocols.'
  },
  {
    value: 'LOGISTICS_OFFICER',
    label: 'LOGISTICS_OFFICER (Supply & Fuel Manager)',
    description: 'Authority over cargo manifests, inventory reserves, asset provisioning, fuel supply, and depot transfers.'
  },
  {
    value: 'SCIENTIST',
    label: 'SCIENTIST (Glaciology & Research Lead)',
    description: 'Operational access to satellite telemetry, UAV reconnaissance, 3D ice models, and scientific research logging.'
  },
  {
    value: 'MEDICAL_OFFICER',
    label: 'MEDICAL_OFFICER (Polar Emergency Physician)',
    description: 'Direct authority over personnel health records, biometric monitoring, medical stock, and emergency SOS.'
  },
  {
    value: 'VIEWER',
    label: 'VIEWER (Scientific Observer / Read-Only)',
    description: 'Strictly read-only monitoring access to public mission telemetry, radar maps, and summary reports.'
  }
];

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const isSihDemoMode = isSihDemoRoleRegistrationEnabled();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('SCIENTIST');
  const [station, setStation] = useState('Maitri Station (Antarctica)');
  const [badgeId, setBadgeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success summary modal state
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    displayName: string;
    email: string;
    requestedRole: UserRole;
    currentRole: UserRole;
    approvalStatus: 'PENDING' | 'APPROVED';
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName || !email || !password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Security clearance password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await register(email, password, displayName, requestedRole, badgeId, station);
      const effectiveRole: UserRole = isSihDemoMode ? requestedRole : 'VIEWER';
      const status = isSihDemoMode || requestedRole === 'VIEWER' ? 'APPROVED' : 'PENDING';

      setRegistrationSuccess({
        displayName,
        email,
        requestedRole,
        currentRole: effectiveRole,
        approvalStatus: status
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration rejected by Polar Command.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Arctic Glow & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4915_1px,transparent_1px),linear-gradient(to_bottom,#082f4915_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-lg shadow-cyan-950/80 mb-1">
            <Compass className="w-6 h-6 text-cyan-400 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white uppercase font-sans">
            POLAR<span className="text-cyan-400 font-mono">-X</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Expedition Personnel Registration & Credential Provisioning
          </p>
        </div>

        {registrationSuccess ? (
          /* Registration Success Summary Screen */
          <div className="rounded-2xl bg-slate-900/95 border border-emerald-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Registration Successful</h2>
                <p className="text-xs text-slate-400">Security credentials initialized in Cloud Firestore</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Operator:</span>
                <span className="text-white font-bold">{registrationSuccess.displayName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Account:</span>
                <span className="text-cyan-300">{registrationSuccess.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Selected Role:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                  {registrationSuccess.requestedRole}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Authoritative Role:</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold">
                  {registrationSuccess.currentRole}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Clearance Status:</span>
                {registrationSuccess.approvalStatus === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    APPROVED & ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    PENDING APPROVAL
                  </span>
                )}
              </div>
            </div>

            {registrationSuccess.approvalStatus === 'APPROVED' ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200/90 leading-relaxed">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Clearance Granted:</strong> Operational access level{' '}
                    <span className="text-emerald-300 font-bold">{registrationSuccess.currentRole}</span> is active and provisioned in Firestore.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 leading-relaxed">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Approval Pending:</strong> Role request queued for Command approval. Current access level is VIEWER.
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleProceedToDashboard}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-950/80 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Enter Mission Control Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Standard Registration Form */
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Enroll Operator</h2>
              <p className="text-xs text-slate-400">Register in the central Antarctic logistics and asset directory</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono font-semibold text-slate-300">Full Name & Title</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Dr. Rajesh Sharma"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white placeholder:text-slate-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono font-semibold text-slate-300">Mission Badge ID</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={badgeId}
                      onChange={(e) => setBadgeId(e.target.value)}
                      placeholder="NCPOR-SCI-882"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white placeholder:text-slate-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono font-semibold text-slate-300">Official Mission Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@polar-x.ncpor.gov.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white placeholder:text-slate-600 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono font-semibold text-slate-300">Clearance Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-2.5 w-4 h-4 text-cyan-400" />
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white focus:outline-none font-mono text-xs"
                    >
                      {AVAILABLE_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono leading-relaxed mt-1">
                    {isSihDemoMode
                      ? '⚡ SIH Demo Mode: Selected clearance role is activated immediately upon registration.'
                      : 'Privileged roles require administrator approval. Account will remain VIEWER until approved.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-mono font-semibold text-slate-300">Home Base Station</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-cyan-400" />
                    <select
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white focus:outline-none font-mono"
                    >
                      <option value="Maitri Station (Antarctica)">Maitri Station (Antarctica)</option>
                      <option value="Bharati Station (Larsemann Hills)">Bharati Station (Larsemann Hills)</option>
                      <option value="Himadri Station (Ny-Ålesund, Arctic)">Himadri Station (Ny-Ålesund, Arctic)</option>
                      <option value="Dakshin Gangotri Ice Shelf Depot">Dakshin Gangotri Ice Shelf Depot</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white placeholder:text-slate-600 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono font-semibold text-slate-300">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white placeholder:text-slate-600 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-950/80 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>Registering with Firestore Mesh...</span>
                ) : (
                  <>
                    <span>Create Account & Activate Clearance</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              Already have security clearance?{' '}
              <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
                Sign In Here
              </Link>
            </div>
          </div>
        )}

        <div className="text-center text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Role-Based Clearance Enforced by Firestore Security Engine</span>
        </div>
      </div>
    </div>
  );
};
