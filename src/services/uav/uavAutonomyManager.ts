/**
 * POLAR-X Phase 9 — UAV Autonomy Manager
 * Autonomous Link-Loss Evaluator • RTL Safety Interlock • Append-Only Audit Logging
 */

import { IUavFlightControllerProvider } from './uavFlightControllerProvider';
import { SimulatedFlightControllerProvider } from './simulatedFlightControllerProvider';
import { uavLinkMonitor } from './uavLinkMonitor';
import { uavReturnHomeService } from './uavReturnHomeService';
import {
  UavAutonomyStatus,
  UavFlightCommand,
  UavCommandAuditRecord
} from './uavAutonomyTypes';
import { UserRole } from '../../types/auth';

export class UavAutonomyManager {
  private provider: IUavFlightControllerProvider;
  private currentStatus: UavAutonomyStatus;
  private auditHistory: UavCommandAuditRecord[] = [];
  private listeners: Set<(status: UavAutonomyStatus) => void> = new Set();
  private auditListeners: Set<(audit: UavCommandAuditRecord[]) => void> = new Set();
  private pollTimer: any = null;

  constructor() {
    this.provider = new SimulatedFlightControllerProvider();

    const homePoint = uavReturnHomeService.getSelectedHomePoint();
    if (homePoint) {
      this.provider.setHomePoint(homePoint);
    }

    this.currentStatus = {
      uavId: 'UAV-RECON-ALPHA',
      flightState: 'MISSION_ACTIVE',
      dataState: 'SIMULATED',
      telemetryFreshnessMs: 120,
      linkHealth: 'HEALTHY',
      linkQualityPercent: 96,
      linkTimeoutSeconds: 10,
      selectedHomePoint: homePoint,
      currentCoordinates: {
        lat: -70.92,
        lng: 11.85,
        altitudeMeters: 145
      },
      batteryPercent: 76.5,
      gpsSatellites: 14,
      activeMissionId: 'msn-01',
      rtlReadiness: uavReturnHomeService.evaluateRtlReadiness(
        { lat: -70.92, lng: 11.85, altitudeMeters: 145 },
        76.5,
        14
      ),
      flightControllerName: this.provider.name,
      isHardwareConnected: this.provider.isHardwareConnected
    };

    this.provider.subscribe((telem) => {
      uavLinkMonitor.registerHeartbeat();
      this.currentStatus.currentCoordinates = {
        lat: telem.lat,
        lng: telem.lng,
        altitudeMeters: telem.altitudeMeters
      };
      this.currentStatus.batteryPercent = telem.batteryPercent;
      this.currentStatus.gpsSatellites = telem.gpsSats;
      this.currentStatus.flightState = telem.flightState;
      this.currentStatus.selectedHomePoint = uavReturnHomeService.getSelectedHomePoint();

      this.currentStatus.rtlReadiness = uavReturnHomeService.evaluateRtlReadiness(
        this.currentStatus.currentCoordinates,
        this.currentStatus.batteryPercent,
        this.currentStatus.gpsSatellites
      );

      this.notify();
    });

    this.startLinkSupervisor();
  }

  public setProvider(provider: IUavFlightControllerProvider): void {
    this.provider = provider;
    this.currentStatus.flightControllerName = provider.name;
    this.currentStatus.isHardwareConnected = provider.isHardwareConnected;
    this.currentStatus.dataState = provider.isHardwareConnected ? 'LIVE' : 'SIMULATED';
    this.notify();
  }

  public getStatus(): UavAutonomyStatus {
    return { ...this.currentStatus };
  }

  public getAuditHistory(): UavCommandAuditRecord[] {
    return [...this.auditHistory];
  }

  /**
   * Execute flight command with RBAC enforcement and safety checks
   */
  public async executeCommand(
    command: UavFlightCommand,
    operator: string,
    role: UserRole,
    reason: string = 'Operator command input'
  ): Promise<{ success: boolean; message: string; audit: UavCommandAuditRecord }> {
    const prevState = this.currentStatus.flightState;

    // RBAC check: VIEWER is strictly forbidden
    if (role === 'VIEWER') {
      const rejectedAudit: UavCommandAuditRecord = {
        id: `UAV-CMD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator,
        operatorRole: role,
        uavId: this.currentStatus.uavId,
        command,
        reason: 'Unauthorized: VIEWER role lacks flight command authority.',
        previousState: prevState,
        resultingState: prevState,
        provider: this.provider.name,
        executionStatus: 'REJECTED_RBAC',
        dataState: this.currentStatus.dataState
      };
      this.recordAudit(rejectedAudit);
      return {
        success: false,
        message: 'Security Violation: VIEWER role lacks flight authorization.',
        audit: rejectedAudit
      };
    }

    // RTL Safety Interlock Check
    if (command === 'REQUEST_RTL' || command === 'RETURN_HOME') {
      const readiness = uavReturnHomeService.evaluateRtlReadiness(
        this.currentStatus.currentCoordinates,
        this.currentStatus.batteryPercent,
        this.currentStatus.gpsSatellites
      );

      if (!readiness.canExecuteRtl) {
        const blockedAudit: UavCommandAuditRecord = {
          id: `UAV-CMD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          operator,
          operatorRole: role,
          uavId: this.currentStatus.uavId,
          command,
          reason: `RTL Blocked: ${readiness.blockedReasons.join(', ')}`,
          previousState: prevState,
          resultingState: prevState,
          provider: this.provider.name,
          executionStatus: 'BLOCKED',
          dataState: this.currentStatus.dataState
        };
        this.recordAudit(blockedAudit);
        return {
          success: false,
          message: `RTL Blocked by Safety Interlock: ${readiness.blockedReasons.join(', ')}`,
          audit: blockedAudit
        };
      }
    }

    // Dispatch to flight controller provider
    const result = await this.provider.sendCommand(command);

    const auditRecord: UavCommandAuditRecord = {
      id: `UAV-CMD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operator,
      operatorRole: role,
      uavId: this.currentStatus.uavId,
      command,
      reason,
      previousState: prevState,
      resultingState: result.newState,
      provider: this.provider.name,
      executionStatus: result.success ? 'SIMULATED_SUCCESS' : 'BLOCKED',
      dataState: this.currentStatus.dataState
    };

    this.recordAudit(auditRecord);
    this.currentStatus.lastCommand = auditRecord;
    this.notify();

    return {
      success: result.success,
      message: result.success
        ? `Command ${command} accepted by autopilot. State: ${result.newState}`
        : `Command failed: ${result.error}`,
      audit: auditRecord
    };
  }

  private startLinkSupervisor(): void {
    this.pollTimer = setInterval(() => {
      const link = uavLinkMonitor.evaluateLink();
      this.currentStatus.linkHealth = link.status === 'HEALTHY' ? 'HEALTHY' : link.status === 'LINK_DEGRADED' ? 'DEGRADED' : 'LOST';
      this.currentStatus.linkQualityPercent = link.qualityPercent;
      this.currentStatus.telemetryFreshnessMs = link.freshnessMs;

      // Autonomous Link-Loss Failover logic
      if (link.status === 'LINK_LOST' && this.currentStatus.flightState === 'MISSION_ACTIVE') {
        this.currentStatus.flightState = 'LINK_LOST';

        // Check if RTL can be autonomously requested
        const readiness = uavReturnHomeService.evaluateRtlReadiness(
          this.currentStatus.currentCoordinates,
          this.currentStatus.batteryPercent,
          this.currentStatus.gpsSatellites
        );

        if (readiness.canExecuteRtl) {
          this.executeCommand(
            'REQUEST_RTL',
            'AUTONOMOUS_LINK_LOSS_DAEMON',
            'ADMIN',
            'Telemetry timeout exceeded 10.0s. Autonomous safety RTL initiated.'
          );
        }
      } else if (link.status === 'LINK_DEGRADED' && this.currentStatus.flightState === 'MISSION_ACTIVE') {
        this.currentStatus.flightState = 'LINK_DEGRADED';
      } else if (link.status === 'HEALTHY' && (this.currentStatus.flightState === 'LINK_DEGRADED' || this.currentStatus.flightState === 'LINK_LOST')) {
        this.currentStatus.flightState = 'MISSION_ACTIVE';
      }

      this.notify();
    }, 1500);
  }

  private recordAudit(record: UavCommandAuditRecord): void {
    this.auditHistory.unshift(record);
    if (this.auditHistory.length > 200) {
      this.auditHistory = this.auditHistory.slice(0, 200);
    }
    this.auditListeners.forEach((cb) => cb([...this.auditHistory]));
  }

  public subscribe(callback: (status: UavAutonomyStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.getStatus());
    return () => this.listeners.delete(callback);
  }

  public subscribeAudit(callback: (audit: UavCommandAuditRecord[]) => void): () => void {
    this.auditListeners.add(callback);
    callback(this.getAuditHistory());
    return () => this.auditListeners.delete(callback);
  }

  private notify(): void {
    const snap = this.getStatus();
    this.listeners.forEach((cb) => cb(snap));
  }

  public destroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }
}

export const uavAutonomyManager = new UavAutonomyManager();
