/**
 * POLAR-X Field Safety Rule Engine
 * Evaluates multi-sensor correlation rules and generates deduplicated safety alerts.
 */

import { FieldSafetyRule, FieldSafetyAlert, PersonnelSafetyState } from './fieldSafetyTypes';
import { WearableTelemetryRecord } from '../wearables/bleTypes';

export const DEFAULT_SAFETY_RULES: FieldSafetyRule[] = [
  {
    ruleId: 'RULE-GPS-STALE',
    name: 'GPS Telemetry Inactivity',
    severity: 'WARNING',
    thresholdText: 'Last fix > 10 minutes old',
    enabled: true
  },
  {
    ruleId: 'RULE-COMMS-LOST',
    name: 'Mesh / Radio Heartbeat Silence',
    severity: 'CRITICAL',
    thresholdText: 'No heartbeat packet within 15 minutes',
    enabled: true
  },
  {
    ruleId: 'RULE-WEARABLE-HYPOTHERMIA',
    name: 'Peripheral Skin Temperature Anomaly',
    severity: 'CRITICAL',
    thresholdText: 'Skin temperature < 29.0°C (Hypothermia risk)',
    enabled: true
  },
  {
    ruleId: 'RULE-BATTERY-LOW',
    name: 'Field Device Critical Low Battery',
    severity: 'WARNING',
    thresholdText: 'Device battery < 20%',
    enabled: true
  }
];

export class FieldSafetyRuleEngine {
  private rules: FieldSafetyRule[] = [...DEFAULT_SAFETY_RULES];
  private alertDeduplicationMap: Map<string, number> = new Map(); // dedupKey -> timestamp
  private dedupCooldownMs = 300000; // 5 minutes cooldown to avoid notification storms

  public evaluatePersonnelState(
    personnelId: string,
    personnelName: string,
    gpsAgeMinutes: number,
    commsOnline: boolean,
    wearable?: WearableTelemetryRecord
  ): { state: PersonnelSafetyState; alerts: FieldSafetyAlert[] } {
    const alerts: FieldSafetyAlert[] = [];
    let state: PersonnelSafetyState = 'NORMAL';
    const now = Date.now();

    // 1. Check Comms Silence
    if (!commsOnline) {
      state = 'COMMUNICATION_LOST';
      const key = `${personnelId}-COMMS-LOST`;
      if (this.shouldTriggerAlert(key, now)) {
        alerts.push({
          alertId: `ALT-COM-${now}`,
          dedupKey: key,
          personnelId,
          personnelName,
          severity: 'CRITICAL',
          title: 'Communication Link Lost',
          description: `Radio/LoRa mesh heartbeat lost for ${personnelName}.`,
          source: 'LORA_MESH',
          timestamp: new Date().toISOString(),
          isResolved: false
        });
      }
    }

    // 2. Check GPS Freshness
    if (gpsAgeMinutes > 10) {
      if (state === 'NORMAL') state = 'GPS_LOST';
      const key = `${personnelId}-GPS-STALE`;
      if (this.shouldTriggerAlert(key, now)) {
        alerts.push({
          alertId: `ALT-GPS-${now}`,
          dedupKey: key,
          personnelId,
          personnelName,
          severity: 'WARNING',
          title: 'GPS Fix Stale',
          description: `No fresh satellite coordinates for ${personnelName} (>10m).`,
          source: 'GPS',
          timestamp: new Date().toISOString(),
          isResolved: false
        });
      }
    }

    // 3. Check Biometrics / Environmental Temp
    if (wearable && wearable.hasHypothermiaRisk) {
      state = 'ATTENTION';
      const key = `${personnelId}-HYPOTHERMIA`;
      if (this.shouldTriggerAlert(key, now)) {
        alerts.push({
          alertId: `ALT-BIO-${now}`,
          dedupKey: key,
          personnelId,
          personnelName,
          severity: 'CRITICAL',
          title: 'Peripheral Temperature Drop Warning',
          description: `Skin temperature dropped to ${wearable.skinTempC}°C for ${personnelName}. Field shelter advisory.`,
          source: 'WEARABLE',
          timestamp: new Date().toISOString(),
          isResolved: false
        });
      }
    }

    // 4. Check Battery
    if (wearable && wearable.batteryPercent < 20) {
      const key = `${personnelId}-BATTERY-LOW`;
      if (this.shouldTriggerAlert(key, now)) {
        alerts.push({
          alertId: `ALT-BAT-${now}`,
          dedupKey: key,
          personnelId,
          personnelName,
          severity: 'ADVISORY',
          title: 'Wearable Battery Low',
          description: `Wearable battery at ${wearable.batteryPercent}% for ${personnelName}.`,
          source: 'WEARABLE',
          timestamp: new Date().toISOString(),
          isResolved: false
        });
      }
    }

    return { state, alerts };
  }

  private shouldTriggerAlert(key: string, now: number): boolean {
    const last = this.alertDeduplicationMap.get(key);
    if (!last || now - last > this.dedupCooldownMs) {
      this.alertDeduplicationMap.set(key, now);
      return true;
    }
    return false;
  }
}

export const fieldSafetyRuleEngine = new FieldSafetyRuleEngine();
