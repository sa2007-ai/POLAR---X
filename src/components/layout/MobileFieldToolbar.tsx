import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Navigation,
  AlertOctagon,
  Radio,
  ShieldAlert
} from 'lucide-react';
import { usePolar } from '../../context';

export const MobileFieldToolbar: React.FC = () => {
  const { emergencies, setIsSOSModalOpen } = usePolar();

  const activeEmergencies = emergencies.filter(
    (e) => e.status !== 'RESOLVED' && e.status !== 'Resolved' && e.status !== 'CLOSED'
  ).length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg lg:hidden px-2 py-1 flex items-center justify-between shadow-2xl safe-bottom overflow-x-auto">
      {/* Dashboard */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-1.5 rounded-xl text-[9px] font-mono transition-colors min-w-[44px] ${
            isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <LayoutDashboard className="w-4 h-4 mb-0.5" />
        <span>Dash</span>
      </NavLink>

      {/* GNSS Telemetry */}
      <NavLink
        to="/telemetry"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-1.5 rounded-xl text-[9px] font-mono transition-colors min-w-[44px] ${
            isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Radio className="w-4 h-4 mb-0.5" />
        <span>GNSS</span>
      </NavLink>

      {/* Tactical Map */}
      <NavLink
        to="/map"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-1.5 rounded-xl text-[9px] font-mono transition-colors min-w-[44px] ${
            isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Compass className="w-4 h-4 mb-0.5" />
        <span>Map</span>
      </NavLink>

      {/* AI Thermal Scan */}
      <NavLink
        to="/uav"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-1.5 rounded-xl text-[9px] font-mono transition-colors min-w-[44px] ${
            isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Navigation className="w-4 h-4 mb-0.5" />
        <span>AI</span>
      </NavLink>

      {/* Centered SOS Field Trigger */}
      <button
        type="button"
        onClick={() => setIsSOSModalOpen(true)}
        className="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-lg shadow-rose-950/80 border-2 border-slate-950 active:scale-95 transition-transform flex-shrink-0"
        title="Field Emergency SOS Trigger"
      >
        <AlertOctagon className="w-5 h-5 animate-pulse" />
        <span className="text-[8px] font-black uppercase tracking-tighter">SOS</span>
      </button>

      {/* Emergency / Comms Hub */}
      <NavLink
        to="/emergency"
        className={({ isActive }) =>
          `relative flex flex-col items-center justify-center p-1.5 rounded-xl text-[9px] font-mono transition-colors min-w-[44px] ${
            isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <AlertOctagon className={`w-4 h-4 mb-0.5 ${activeEmergencies > 0 ? 'text-rose-400 animate-pulse' : ''}`} />
        <span>Comms</span>
        {activeEmergencies > 0 && (
          <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
        )}
      </NavLink>

      {/* Field Safety */}
      <NavLink
        to="/field-safety"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-1.5 rounded-xl text-[9px] font-mono transition-colors min-w-[44px] ${
            isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <ShieldAlert className="w-4 h-4 mb-0.5" />
        <span>Safety</span>
      </NavLink>
    </nav>
  );
};
