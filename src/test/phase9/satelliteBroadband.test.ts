/**
 * POLAR-X Phase 9 — Satellite Broadband & Multi-Priority Queue Tests
 */

import { SatellitePriorityQueue } from '../../services/satellite/satelliteQueue';
import { SimulatedSatelliteProvider } from '../../services/satellite/simulatedSatelliteProvider';
import { SATELLITE_PRIORITIES } from '../../services/satellite/satelliteTypes';

export function runSatelliteTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let passed = true;

  const log = (name: string, ok: boolean, msg?: string) => {
    if (!ok) passed = false;
    results.push(`${ok ? '✓ PASS' : '✗ FAIL'}: ${name}${msg ? ` — ${msg}` : ''}`);
  };

  // Test 1: Priority Definition Integrity
  const hasAllPriorities = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'].every((p) => p in SATELLITE_PRIORITIES);
  log('SATELLITE-01: P0-P5 Priorities Defined', hasAllPriorities);

  // Test 2: Multi-Priority Queue Ordering (P0 must preempt P5)
  const queue = new SatellitePriorityQueue();
  queue.enqueue('P5', 'BG_SYNC', { data: 'sync_log' });
  queue.enqueue('P3', 'ROUTE_ALERT', { alert: 'crevasse' });
  queue.enqueue('P0', 'MAYDAY_SOS', { distress: true });

  const firstOut = queue.peek();
  const isP0First = firstOut?.priority === 'P0';
  log('SATELLITE-02: P0 Emergency Preempts Lower Priorities', isP0First, `First out: ${firstOut?.priority}`);

  // Test 3: FIFO within Same Priority
  queue.enqueue('P0', 'SECOND_SOS', { distress: 2 }, { customId: 'SOS-02' });
  const allP0s = queue.getAll().filter((m) => m.priority === 'P0');
  const fifoCorrect = allP0s[0]?.topic === 'MAYDAY_SOS' && allP0s[1]?.topic === 'SECOND_SOS';
  log('SATELLITE-03: FIFO Order Preserved Within Priority Tier', fifoCorrect);

  // Test 4: Simulated Satellite Provider Initial State
  const provider = new SimulatedSatelliteProvider();
  const session = provider.getSessionInfo();
  const isSimulated = session.dataState === 'SIMULATED' && session.connectionState === 'SIMULATED';
  log('SATELLITE-04: Explicit SIMULATED Data State Stamped', isSimulated);

  // Test 5: Transmit & ACK Handshake
  provider
    .sendMessage({
      id: 'TEST-MSG-01',
      priority: 'P0',
      topic: 'HEALTH_CHECK',
      payload: { status: 'nominal' },
      byteSize: 64,
      createdAt: new Date().toISOString(),
      status: 'QUEUED',
      retryCount: 0,
      traceId: 'TRC-TEST',
      destination: 'NCPOR',
      sourceStationOrAsset: 'MAITRI'
    })
    .then((res) => {
      log('SATELLITE-05: Gateway Transmission ACK Generated', res.success && Boolean(res.ackId), `ACK ID: ${res.ackId}`);
      provider.destroy();
    });

  return { passed, results };
}
