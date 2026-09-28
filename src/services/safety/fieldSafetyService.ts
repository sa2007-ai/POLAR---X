/**
 * POLAR-X Field Safety Service
 * Correlates Personnel + GPS + Communications + Wearables into a centralized safety matrix.
 */

import { PersonnelSafetyStatusSummary, FieldSafetyAlert } from './fieldSafetyTypes';
import { fieldSafetyRuleEngine } from './fieldSafetyRuleEngine';
import { wearableTelemetryService } from '../wearables/wearableTelemetryService';

export const INITIAL_PERSONNEL_SAFETY: PersonnelSafetyStatusSummary[] = [
  {
    personnelId: 'PER-001',
    personnelName: 'Dr. Rajesh Sharma',
    role: 'Lead Glaciologist',
    expeditionCode: 'EXP-2026-MAITRI-01',
    safetyState: 'NORMAL',
    lastKnownCoordinates: { lat: -70.767, lng: 11.733 },
    gpsStatus: 'LIVE',
    commsStatus: 'CONNECTED',
    activeAlerts: [],
    lastSeenAt: new Date().toISOString()
  },
  {
    personnelId: 'PER-002',
    personnelName: 'Capt. Vikram Singh',
    role: 'Convoy Lead Driver',
    expeditionCode: 'EXP-2026-MAITRI-01',
    safetyState: 'NORMAL',
    lastKnownCoordinates: { lat: -70.825, lng: 11.890 },
    gpsStatus: 'LIVE',
    commsStatus: 'CONNECTED',
    activeAlerts: [],
    lastSeenAt: new Date().toISOString()
  },
  {
    personnelId: 'PER-003',
    personnelName: 'Dr. Ananya Roy',
    role: 'Meteorologist & Radar Operator',
    expeditionCode: 'EXP-2026-BHARATI-02',
    safetyState: 'NORMAL',
    lastKnownCoordinates: { lat: -69.407, lng: 76.190 },
    gpsStatus: 'LIVE',
    commsStatus: 'CONNECTED',
    activeAlerts: [],
    lastSeenAt: new Date().toISOString()
  }
];

export class FieldSafetyService {
  private roster: Map<string, PersonnelSafetyStatusSummary> = new Map();
  private alertsHistory: FieldSafetyAlert[] = [];
  private subscribers: Set<(roster: PersonnelSafetyStatusSummary[], alerts: FieldSafetyAlert[]) => void> = new Set();

  constructor() {
    INITIAL_PERSONNEL_SAFETY.forEach((p) => this.roster.set(p.personnelId, p));
    this.initCorrelationListener();
  }

  private initCorrelationListener(): void {
    wearableTelemetryService.subscribe((wearables) => {
      wearables.forEach((w) => {
        const p = this.roster.get(w.personnelId);
        if (p) {
          p.wearable = w;
          const evaluation = fieldSafetyRuleEngine.evaluatePersonnelState(
            p.personnelId,
            p.personnelName,
            0, // Fresh GPS
            true, // Comms online
            w
          );
          p.safetyState = evaluation.state;
          if (evaluation.alerts.length > 0) {
            p.activeAlerts = evaluation.alerts;
            this.alertsHistory.unshift(...evaluation.alerts);
          }
        }
      });
      this.notifySubscribers();
    });
  }

  public getRoster(): PersonnelSafetyStatusSummary[] {
    return Array.from(this.roster.values());
  }

  public getAlerts(): FieldSafetyAlert[] {
    return [...this.alertsHistory];
  }

  public subscribe(cb: (roster: PersonnelSafetyStatusSummary[], alerts: FieldSafetyAlert[]) => void): () => void {
    this.subscribers.add(cb);
    cb(Array.from(this.roster.values()), [...this.alertsHistory]);
    return () => this.subscribers.delete(cb);
  }

  private notifySubscribers(): void {
    const r = Array.from(this.roster.values());
    const a = [...this.alertsHistory];
    this.subscribers.forEach((cb) => cb(r, a));
  }
}

export const fieldSafetyService = new FieldSafetyService();
