import React, { useState, useEffect } from 'react';
import { usePolar, useAuth } from '../context';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { EmergencyIncident, EmergencySeverity, EmergencyWorkflowStatus } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchBar } from '../components/common/SearchBar';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { emergencyCommsService } from '../services/emergency-comms/emergencyCommsService';
import { EmergencyPacket, RadioGatewayStatus } from '../services/emergency-comms/emergencyMessageTypes';
import {
  AlertOctagon,
  ShieldAlert,
  Radio,
  Eye,
  CheckCircle2,
  Users,
  ThermometerSnowflake,
  Plus,
  Compass,
  Edit2,
  Trash2,
  ArrowRight,
  Save,
  Send
} from 'lucide-react';

const workflowSteps: EmergencyWorkflowStatus[] = [
  'REPORTED',
  'ACKNOWLEDGED',
  'RESPONSE STARTED',
  'UNDER CONTROL',
  'RESOLVED',
  'CLOSED'
];

export const EmergencyPage: React.FC = () => {
  const {
    emergencies,
    createEmergency,
    updateEmergency,
    deleteEmergency,
    resolveEmergency,
    changeEmergencyWorkflowStatus,
    assignEmergencyTeam,
    setIsSOSModalOpen,
    stations
  } = usePolar();
  const { userProfile } = useAuth();

  const canCreateEmergency = canCreate(userProfile, 'emergency');
  const canEditEmergency = canEdit(userProfile, 'emergency');
  const canDeleteEmergency = canDelete(userProfile, 'emergency');

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [stationFilter, setStationFilter] = useState('All Stations');

  // Modals
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [editingIncident, setEditingIncident] = useState<EmergencyIncident | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Emergency State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStation, setNewStation] = useState(stations[0]?.name || 'Maitri Research Base');
  const [newSeverity, setNewSeverity] = useState<EmergencySeverity>('Critical');
  const [newTeam, setNewTeam] = useState('SAR Rapid Response Team Alpha');
  const [newPersonnelText, setNewPersonnelText] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newWeather] = useState('-35°C, Katabatic wind 80 km/h, Low Visibility');

  const filteredData = emergencies.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.incidentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.stationOrRegion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reportedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.assignedTeam && item.assignedTeam.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeverity = severityFilter === 'All Severities' || item.severity.includes(severityFilter);
    const matchesStatus = statusFilter === 'All Statuses' || item.status === statusFilter;
    const matchesStation = stationFilter === 'All Stations' || item.stationOrRegion.includes(stationFilter);
    return matchesSearch && matchesSeverity && matchesStatus && matchesStation;
  });

  // Emergency Comms Gateway State
  const [gateways, setGateways] = useState<RadioGatewayStatus[]>(emergencyCommsService.getGateways());
  const [packets, setPackets] = useState<EmergencyPacket[]>(emergencyCommsService.getPackets());
  const [isTransmittingTest, setIsTransmittingTest] = useState(false);

  useEffect(() => {
    const unsub = emergencyCommsService.subscribe((pkts) => {
      setPackets(pkts);
      setGateways(emergencyCommsService.getGateways());
    });
    return () => unsub();
  }, []);

  const handleBroadcastTestPacket = async () => {
    setIsTransmittingTest(true);
    await emergencyCommsService.queuePacket(
      'SOS',
      -70.767,
      11.733,
      'FLASH',
      'TEST SOS BEACON - FIELD DRILL'
    );
    setIsTransmittingTest(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    createEmergency({
      title: newTitle,
      stationOrRegion: newStation,
      severity: newSeverity,
      status: 'REPORTED',
      reportedBy: 'Mission Operations Control',
      assignedTeam: newTeam,
      involvedPersonnel: newPersonnelText ? newPersonnelText.split(',').map((s) => s.trim()) : ['Field Party'],
      summary: newSummary,
      weatherCondition: newWeather,
      protocolsTriggered: [
        'Satellite Emergency Beacon Initialized',
        'Direct Audio Channel Opened with Base Commander',
        'Standby Protocol for SAR Convoy Unit'
      ]
    });

    setNewTitle('');
    setNewSummary('');
    setNewPersonnelText('');
    setIsNewModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident) return;

    updateEmergency(editingIncident.id, editingIncident);
    if (selectedIncident?.id === editingIncident.id) {
      setSelectedIncident(editingIncident);
    }
    setEditingIncident(null);
  };

  const getWorkflowStepIndex = (status: EmergencyWorkflowStatus) => {
    const index = workflowSteps.indexOf(status);
    if (index !== -1) return index;
    if (status === 'Active SAR Dispatched') return 2;
    if (status === 'Investigating' || status === 'Shelter-In-Place') return 1;
    if (status === 'Resolved') return 4;
    return 0;
  };

  const advanceWorkflow = (incident: EmergencyIncident) => {
    const currentIndex = getWorkflowStepIndex(incident.status);
    if (currentIndex < workflowSteps.length - 1) {
      const nextStep = workflowSteps[currentIndex + 1];
      changeEmergencyWorkflowStatus(incident.id, nextStep);
      setSelectedIncident({ ...incident, status: nextStep });
    }
  };

  const activeIncidents = emergencies.filter(
    (e) => e.status !== 'RESOLVED' && e.status !== 'Resolved' && e.status !== 'CLOSED'
  );
  const criticalCount = emergencies.filter(
    (e) => (e.severity === 'Critical' || e.severity.includes('Code Red')) && e.status !== 'RESOLVED' && e.status !== 'Resolved' && e.status !== 'CLOSED'
  ).length;

  const columns: Column<EmergencyIncident>[] = [
    {
      key: 'incidentCode',
      header: 'Incident Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-xs text-rose-400 bg-rose-950/80 px-2 py-1 rounded border border-rose-500/30">
          {row.incidentCode}
        </span>
      )
    },
    {
      key: 'title',
      header: 'Incident Summary & Sector',
      sortable: true,
      render: (row) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white group-hover:text-rose-300 transition-colors">
              {row.title}
            </span>
            {(row as any)._isSeededDemo && (
              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                SEEDED DEMO
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
            <span className="text-cyan-400 font-semibold">{row.stationOrRegion}</span>
            <span>•</span>
            <span className="text-slate-500">{row.reportedAt}</span>
          </div>
        </div>
      )
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (row) => (
        <StatusBadge
          status={row.severity}
          size="sm"
          pulse={row.severity === 'Critical' || row.severity.includes('Code Red')}
        />
      )
    },
    {
      key: 'status',
      header: 'Workflow Stage',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      key: 'assignedTeam',
      header: 'Assigned Team',
      sortable: true,
      render: (row) => (
        <div className="text-xs font-mono text-slate-300">
          <span className="text-slate-200 font-semibold truncate max-w-[160px] block">
            {row.assignedTeam || 'SAR Quick Response Alpha'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedIncident(row)}
            className="p-1.5 rounded-lg text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 transition-colors"
            title="Inspect Crisis Workflow"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEditEmergency && (
            <button
              type="button"
              onClick={() => setEditingIncident(row)}
              className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Edit Incident"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDeleteEmergency && (
            <button
              type="button"
              onClick={() => setDeletingId(row.id)}
              className="p-1.5 rounded-lg text-rose-400 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 transition-colors"
              title="Archive / Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Emergency SOS & Crisis Response Command"
        subtitle="Search & Rescue (SAR) mission coordination, blizzard lockdown protocols, and medical evacuations"
        icon={AlertOctagon}
        badge={`${activeIncidents.length} ACTIVE CRISES`}
      >
        {canCreateEmergency && (
          <>
            <button
              type="button"
              onClick={() => setIsSOSModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/60 transition-all active:scale-95 animate-pulse"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Broadcast Emergency SOS</span>
            </button>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Log Incident Record</span>
            </button>
          </>
        )}
      </PageHeader>

      {/* Primary Crisis Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Emergencies"
          value={activeIncidents.length}
          subtitle="Ongoing response cases"
          icon={AlertOctagon}
          variant="rose"
        />
        <StatCard
          title="Critical Severity (Code Red)"
          value={criticalCount}
          subtitle="Immediate life-safety SAR"
          icon={ShieldAlert}
          variant="rose"
          trend={{ value: criticalCount > 0 ? 'CRITICAL' : 'CLEAR', isPositive: criticalCount === 0 }}
        />
        <StatCard
          title="SAR Teams Deployed"
          value={emergencies.filter((e) => e.status === 'RESPONSE STARTED' || e.status === 'Active SAR Dispatched').length}
          subtitle="Ground / air extraction units"
          icon={Compass}
          variant="amber"
        />
        <StatCard
          title="Resolved & Closed Cases"
          value={emergencies.filter((e) => e.status === 'RESOLVED' || e.status === 'Resolved' || e.status === 'CLOSED').length}
          subtitle="Stabilized mission cases"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Critical Active Alert Banner */}
      {criticalCount > 0 && emergencies.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/60 shadow-xl shadow-rose-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                CRITICAL RESCUE PROTOCOL ACTIVE: {(emergencies.find(e => e.severity === 'Critical' || e.severity?.includes('Code Red')) || emergencies[0])?.title}
              </h4>
              <p className="text-xs text-rose-200 mt-0.5">
                {(emergencies.find(e => e.severity === 'Critical' || e.severity?.includes('Code Red')) || emergencies[0])?.summary} (Assigned: {(emergencies.find(e => e.severity === 'Critical' || e.severity?.includes('Code Red')) || emergencies[0])?.assignedTeam || 'SAR Alpha'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedIncident(emergencies.find(e => e.severity === 'Critical' || e.severity?.includes('Code Red')) || emergencies[0])}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-rose-300 hover:bg-white transition-colors flex-shrink-0"
          >
            Manage Response Workflow
          </button>
        </div>
      )}

      {/* Emergency Radio Gateway Hub (Low-Bandwidth Multi-Band Network) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-sans">LOW-BANDWIDTH EMERGENCY RADIO GATEWAYS</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  AX.25 • ALE • SBD • MESH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-band telemetry and packet radio transmission pipeline with automated ACK and exponential backoff retry.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isTransmittingTest}
            onClick={handleBroadcastTestPacket}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-950/40 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isTransmittingTest ? 'Transmitting Packet...' : 'Test Emergency Radio SOS'}</span>
          </button>
        </div>

        {/* Gateway Provider Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {gateways.map((gw) => (
            <div key={gw.gatewayType} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{gw.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                  gw.status === 'SIMULATED'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {gw.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2">{gw.frequencyOrBand}</p>
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-900 text-slate-500">
                <span>Signal: {gw.signalQualityPercent}%</span>
                <span>{gw.isHardwareAttached ? 'Hardware Online' : 'No Hardware'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Packet Log Stream */}
        {packets.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Recent Low-Bandwidth Radio Packets ({packets.length})
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {packets.slice(0, 5).map((pkt) => (
                <div
                  key={pkt.messageId}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-rose-400">{pkt.messageType}</span>
                    <span className="text-slate-400 font-mono text-[11px] truncate">
                      [{pkt.latitude.toFixed(3)}°, {pkt.longitude.toFixed(3)}°] {pkt.payloadText}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                      pkt.status === 'ACKNOWLEDGED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : pkt.status === 'TRANSMITTING'
                        ? 'bg-cyan-950 text-cyan-300 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {pkt.status}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {new Date(pkt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search incident code, region, reporter, protocol, team..."
          className="flex-1 w-full"
        />
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <FilterDropdown
            value={severityFilter}
            options={['All Severities', 'Critical', 'High', 'Medium', 'Low']}
            onChange={setSeverityFilter}
            className="w-full sm:w-36"
          />
          <FilterDropdown
            value={statusFilter}
            options={[
              'All Statuses',
              'REPORTED',
              'ACKNOWLEDGED',
              'RESPONSE STARTED',
              'UNDER CONTROL',
              'RESOLVED',
              'CLOSED'
            ]}
            onChange={setStatusFilter}
            className="w-full sm:w-48"
          />
          <FilterDropdown
            value={stationFilter}
            options={['All Stations', ...stations.map((s) => s.name)]}
            onChange={setStationFilter}
            className="w-full sm:w-44"
          />
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedIncident(item)}
        pageSize={8}
      />

      {/* Incident Protocol & Workflow Modal */}
      {selectedIncident && (
        <Modal
          isOpen={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
          title={selectedIncident.title}
          subtitle={`Incident Code: ${selectedIncident.incidentCode} | Reported By: ${selectedIncident.reportedBy}`}
          maxWidth="2xl"
          isEmergency={selectedIncident.severity === 'Critical' || selectedIncident.severity.includes('Code Red')}
        >
          <div className="space-y-5">
            {/* Visual 6-Stage Workflow Progress Bar */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Crisis Response Workflow Progression
                </span>
                {getWorkflowStepIndex(selectedIncident.status) < workflowSteps.length - 1 && (
                  <button
                    type="button"
                    onClick={() => advanceWorkflow(selectedIncident)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow transition-all active:scale-95"
                  >
                    <span>Advance Next Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 6 Step Interactive Pills */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                {workflowSteps.map((step, idx) => {
                  const currentIdx = getWorkflowStepIndex(selectedIncident.status);
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => {
                        changeEmergencyWorkflowStatus(selectedIncident.id, step);
                        setSelectedIncident({ ...selectedIncident, status: step });
                      }}
                      className={`p-2 rounded-lg text-[10px] font-mono font-bold flex flex-col items-center justify-center text-center transition-all ${
                        isCurrent
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-950 ring-2 ring-rose-400'
                          : isDone
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      <span>{isDone ? '✓' : idx + 1}</span>
                      <span className="truncate w-full mt-0.5">{step}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Assignment & Status change bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Assigned Response Team:</span>
                <select
                  value={selectedIncident.assignedTeam || 'SAR Rapid Response Team Alpha'}
                  onChange={(e) => {
                    assignEmergencyTeam(selectedIncident.id, e.target.value);
                    setSelectedIncident({ ...selectedIncident, assignedTeam: e.target.value });
                  }}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-cyan-300 font-semibold focus:outline-none"
                >
                  <option value="SAR Rapid Response Team Alpha">SAR Rapid Response Team Alpha</option>
                  <option value="Aviation Evacuation Squad (Twin Otter)">Aviation Evacuation Squad (Twin Otter)</option>
                  <option value="Base Engineering & Medical Unit">Base Engineering & Medical Unit</option>
                  <option value="Station Disaster Management Cell">Station Disaster Management Cell</option>
                </select>
              </div>

              {selectedIncident.status !== 'RESOLVED' && selectedIncident.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={() => setResolvingId(selectedIncident.id)}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md transition-colors"
                >
                  Resolve Crisis
                </button>
              )}
            </div>

            {/* Weather & Situation details */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 block">Atmospheric & Environmental Telemetry</span>
              <div className="flex items-center gap-2 text-xs text-rose-300 font-mono">
                <ThermometerSnowflake className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>{selectedIncident.weatherCondition}</span>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5 text-xs">
              <span className="font-mono font-bold text-slate-300 uppercase tracking-wider block">Incident Narrative & Situation</span>
              <p className="text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans">
                {selectedIncident.summary}
              </p>
            </div>

            {/* Involved Personnel */}
            <div className="space-y-2 text-xs font-mono">
              <span className="font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Involved Field Personnel</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedIncident.involvedPersonnel.map((p, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-200 border border-slate-800">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Executed SAR Protocols Checklist */}
            <div className="space-y-2 text-xs">
              <span className="font-mono font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Triggered Crisis & SAR Protocols</span>
              </span>
              <div className="space-y-1.5">
                {selectedIncident.protocolsTriggered.map((proto, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 font-mono"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{proto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Incident Modal */}
      {editingIncident && (
        <Modal
          isOpen={!!editingIncident}
          onClose={() => setEditingIncident(null)}
          title={`Edit Crisis Record: ${editingIncident.incidentCode}`}
          subtitle="Modify severity, response team, and weather telemetry"
          maxWidth="2xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Incident Code / Headline *</label>
                <input
                  type="text"
                  required
                  value={editingIncident.title}
                  onChange={(e) => setEditingIncident({ ...editingIncident, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Severity Level *</label>
                <select
                  value={editingIncident.severity}
                  onChange={(e) =>
                    setEditingIncident({ ...editingIncident, severity: e.target.value as EmergencySeverity })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Workflow Stage</label>
                <select
                  value={editingIncident.status}
                  onChange={(e) =>
                    setEditingIncident({ ...editingIncident, status: e.target.value as EmergencyWorkflowStatus })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                >
                  {workflowSteps.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Assigned Team</label>
                <input
                  type="text"
                  value={editingIncident.assignedTeam || ''}
                  onChange={(e) => setEditingIncident({ ...editingIncident, assignedTeam: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Incident Narrative</label>
              <textarea
                rows={3}
                value={editingIncident.summary}
                onChange={(e) => setEditingIncident({ ...editingIncident, summary: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingIncident(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Incident</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Log New Incident Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Log Incident / Emergency Protocol"
        subtitle="Report hazard, machinery failure, or stranded party"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Incident Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Crevasse Boundary Hazard Detected"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Location / Sector *</label>
              <select
                value={newStation}
                onChange={(e) => setNewStation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Severity *</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as EmergencySeverity)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Assigned Team</label>
              <select
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="SAR Rapid Response Team Alpha">SAR Rapid Response Team Alpha</option>
                <option value="Aviation Evacuation Squad (Twin Otter)">Aviation Evacuation Squad (Twin Otter)</option>
                <option value="Base Engineering & Medical Unit">Base Engineering & Medical Unit</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Involved Personnel</label>
            <input
              type="text"
              value={newPersonnelText}
              onChange={(e) => setNewPersonnelText(e.target.value)}
              placeholder="e.g. Dr. Anand, Arun Roy"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Summary & Situation *</label>
            <textarea
              rows={3}
              required
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Describe event and immediate assistance required..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-lg text-sm text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Incident</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Resolving Emergency */}
      {resolvingId && (
        <ConfirmationDialog
          isOpen={!!resolvingId}
          onClose={() => setResolvingId(null)}
          onConfirm={() => {
            resolveEmergency(resolvingId);
            if (selectedIncident?.id === resolvingId) {
              setSelectedIncident(null);
            }
            setResolvingId(null);
          }}
          title="Resolve Emergency Incident"
          message="Are you sure you want to mark this polar emergency incident as RESOLVED? This will stand down SAR extraction units and archive the incident record."
          confirmLabel="Yes, Resolve Incident"
          type="warning"
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <ConfirmationDialog
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={() => {
            deleteEmergency(deletingId);
            if (selectedIncident?.id === deletingId) setSelectedIncident(null);
            setDeletingId(null);
          }}
          title="Archive Emergency Record"
          message="Are you sure you want to remove this incident from the active log?"
          confirmLabel="Yes, Remove Record"
          type="danger"
        />
      )}
    </div>
  );
};
