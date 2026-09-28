import React, { useState } from 'react';
import { usePolar } from '../../context';
import { Modal } from '../common/Modal';
import { EmergencySeverity, EmergencyWorkflowStatus } from '../../types';
import { ShieldAlert, Send } from 'lucide-react';

export const QuickSOSModal: React.FC = () => {
  const { isSOSModalOpen, setIsSOSModalOpen, createEmergency, stations } = usePolar();

  const [title, setTitle] = useState('');
  const [stationOrRegion, setStationOrRegion] = useState(stations[0]?.name || 'Maitri Research Base');
  const [severity, setSeverity] = useState<EmergencySeverity>('Critical');
  const [status] = useState<EmergencyWorkflowStatus>('REPORTED');
  const [reportedBy] = useState('Dr. Rajesh Sharma (Polar Ops Director)');
  const [assignedTeam, setAssignedTeam] = useState('SAR Rapid Response Team Alpha');
  const [involvedPersonnelText, setInvolvedPersonnelText] = useState('');
  const [summary, setSummary] = useState('');
  const [weatherCondition, setWeatherCondition] = useState('Katabatic storm gusts 85+ km/h, -38°C, Visibility < 10m');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const involved = involvedPersonnelText
      ? involvedPersonnelText.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Field Survey Party'];

    createEmergency({
      title,
      stationOrRegion,
      severity,
      status,
      reportedBy,
      assignedTeam,
      involvedPersonnel: involved,
      summary,
      weatherCondition,
      protocolsTriggered: [
        'Protocol SOS-ALPHA: Instant satellite SAR beacon broadcast',
        'Direct satellite voice channel opened with Base Station Commander',
        'Emergency shelter-in-place order activated for sector'
      ]
    });

    // Reset form
    setTitle('');
    setSummary('');
    setInvolvedPersonnelText('');
    setIsSOSModalOpen(false);
  };

  return (
    <Modal
      isOpen={isSOSModalOpen}
      onClose={() => setIsSOSModalOpen(false)}
      title="EMERGENCY SOS: BROADCAST POLAR CRISIS PROTOCOL"
      subtitle="Dispatches highest priority alarm across Antarctic mesh and informs National Crisis Cell"
      isEmergency={true}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-start gap-3 text-xs text-rose-200">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p>
            WARNING: Triggering this emergency protocol immediately prioritizes satellite bandwidth,
            logs the incident with official timestamps, and notifies all research base commanders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Incident Code / Headline *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Crevasse Fall during Traverse sortie"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Location / Station *</label>
            <select
              value={stationOrRegion}
              onChange={(e) => setStationOrRegion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.name}>
                  {st.name} ({st.country})
                </option>
              ))}
              <option value="Princess Elizabeth Land Traverse Corridor">Princess Elizabeth Land Traverse Corridor</option>
              <option value="Schirmacher Oasis Glacier Boundary">Schirmacher Oasis Glacier Boundary</option>
              <option value="Prydz Bay Sea Ice Outer Edge">Prydz Bay Sea Ice Outer Edge</option>
              <option value="Ross Island Sector 4">Ross Island Sector 4</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Severity Level *</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as EmergencySeverity)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none font-mono"
            >
              <option value="Critical">Critical (Immediate Threat to Life / Mission)</option>
              <option value="High">High (Severe Risk / Extreme Weather / Breakdown)</option>
              <option value="Medium">Medium (Moderate Hazard / Equipment Failure)</option>
              <option value="Low">Low (Advisory / Route Restriction)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Response Team Assignment</label>
            <select
              value={assignedTeam}
              onChange={(e) => setAssignedTeam(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none font-mono"
            >
              <option value="SAR Rapid Response Team Alpha">SAR Rapid Response Team Alpha (PistonBully 09)</option>
              <option value="Aviation Evacuation Squad (Twin Otter)">Aviation Evacuation Squad (Twin Otter)</option>
              <option value="Base Engineering & Medical Unit">Base Engineering & Medical Unit</option>
              <option value="Station Disaster Management Cell">Station Disaster Management Cell</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono font-semibold text-slate-300">Involved Personnel (comma separated)</label>
          <input
            type="text"
            value={involvedPersonnelText}
            onChange={(e) => setInvolvedPersonnelText(e.target.value)}
            placeholder="e.g. Dr. Rajesh Verma, Pilot Arun Roy, Mechanic S. Nair"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono font-semibold text-slate-300">Current Weather & Environment Conditions</label>
          <input
            type="text"
            value={weatherCondition}
            onChange={(e) => setWeatherCondition(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono font-semibold text-slate-300">Situation Summary & Actions Taken *</label>
          <textarea
            rows={3}
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Describe what occurred, exact coordinates if known, and immediate assistance needed..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setIsSOSModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-950 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast SOS Alert</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
