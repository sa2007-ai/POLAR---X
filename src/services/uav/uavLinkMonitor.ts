/**
 * POLAR-X Phase 9 — UAV Link Monitor & Loss Detector
 * Detects telemetry degradation and timeouts (LINK_DEGRADED > 4s, LINK_LOST > 10s)
 */

export interface LinkHealthReport {
  status: 'HEALTHY' | 'LINK_DEGRADED' | 'LINK_LOST';
  qualityPercent: number;
  freshnessMs: number;
  lastHeartbeat: string;
  isStale: boolean;
}

export class UavLinkMonitor {
  private lastHeartbeatTimestamp: number = Date.now();
  private degradedThresholdMs = 4000;
  private lossThresholdMs = 10000;
  private manualSimulationLoss = false;

  public registerHeartbeat(): void {
    if (!this.manualSimulationLoss) {
      this.lastHeartbeatTimestamp = Date.now();
    }
  }

  public setSimulatedLinkLost(lost: boolean): void {
    this.manualSimulationLoss = lost;
    if (lost) {
      this.lastHeartbeatTimestamp = Date.now() - (this.lossThresholdMs + 2000);
    } else {
      this.lastHeartbeatTimestamp = Date.now();
    }
  }

  public evaluateLink(): LinkHealthReport {
    const elapsed = Date.now() - this.lastHeartbeatTimestamp;

    if (elapsed > this.lossThresholdMs) {
      return {
        status: 'LINK_LOST',
        qualityPercent: 0,
        freshnessMs: elapsed,
        lastHeartbeat: new Date(this.lastHeartbeatTimestamp).toISOString(),
        isStale: true
      };
    }

    if (elapsed > this.degradedThresholdMs) {
      const degradedPct = Math.max(15, Math.round(100 - (elapsed / this.lossThresholdMs) * 80));
      return {
        status: 'LINK_DEGRADED',
        qualityPercent: degradedPct,
        freshnessMs: elapsed,
        lastHeartbeat: new Date(this.lastHeartbeatTimestamp).toISOString(),
        isStale: false
      };
    }

    return {
      status: 'HEALTHY',
      qualityPercent: 96,
      freshnessMs: elapsed,
      lastHeartbeat: new Date(this.lastHeartbeatTimestamp).toISOString(),
      isStale: false
    };
  }
}

export const uavLinkMonitor = new UavLinkMonitor();
