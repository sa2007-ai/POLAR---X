# POLAR-X — System Architecture & Data Flow Specification

> **SIH Production Technical Specification**  
> Complete architecture documentation detailing subsystem boundaries, data flow pipelines, state management, and failover topologies.

---

## 1. High-Level Subsystem Topology

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       POLAR-X FRONTEND SHELL                                    │
│  React 19 • TypeScript Strict • Tailwind CSS v4 • WebGL 3D Engine • Service Worker (PWA Shell)  │
└────────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                                 │
      ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
      │                                          │                                          │
┌─────▼─────────────────────────┐  ┌─────────────▼─────────────┐  ┌─────────────────────────▼─────┐
│       DATA & STATE TIER       │  │    COMMUNICATIONS TIER    │  │       SAFETY & AI TIER        │
├───────────────────────────────┤  ├───────────────────────────┤  ├───────────────────────────────┤
│ • PolarContext / AuthContext  │  │ • Multi-Priority Sat Queue│  │ • UAV Autonomy & RTL Engine   │
│ • IndexedDB v5 Offline Cache  │  │ • AFSK 1200 Audio Modem   │  │ • 3D Terrain & Crevasse SfM   │
│ • Mutation Queue & Sync Engine│  │ • LoRa / Meshtastic Bridge│  │ • Edge AI Crevasse Classifier │
│ • Conflict Resolution Handler │  │ • Web Serial GNSS Stream  │  │ • Geofence Breach Evaluator   │
│ • Firebase Cloud Firestore    │  │ • Web BLE GATT Wearables  │  │ • Traverse Route Optimizer    │
└───────────────────────────────┘  └───────────────────────────┘  └───────────────────────────────┘
```

---

## 2. Real-Time Data Flow Pipelines

### A. Emergency SOS Multi-Bearer Failover Pipeline
```text
[User Triggers SOS / Automated Beacon Breach]
                   │
                   ▼
       [Priority Tagger: Assigns P0]
                   │
                   ▼
         [Bearer Availability Check]
      ┌────────────┬────────────┐
      ▼            ▼            ▼
[VHF / Local] [LoRa Mesh]  [Satellite Modem]
(Unavailable) (Unavailable)  (Iridium Certus)
                                │
                                ▼
                   [P0 Preempts Satellite Queue]
                                │
                                ▼
                  [Direct SBD / Broadband Transmit]
                                │
                                ▼
                     [Gateway Returns ACK Hash]
                                │
                                ▼
                [Appends to Immutable Audit Log]
```

---

### B. Autonomous UAV Link-Loss & RTL Pipeline
```text
[UAV-RECON-ALPHA Airborne Telemetry Stream]
                   │
                   ▼
       [Watchdog Heartbeat Monitor]
                   │
      ┌────────────┴────────────┐
   [Ping < 10s]              [Ping > 10s]
      │                         │
      ▼                         ▼
[MISSION_ACTIVE]         [LINK_LOST State]
                                │
                                ▼
                   [Safety Interlock Checklist]
                   ├── 1. Verify Home Point ID
                   ├── 2. Battery vs Range Math (Margin > 15%)
                   ├── 3. GNSS 3D Fix Check (HDOP < 2.5)
                   └── 4. ASPA / Geofence Clearance
                                │
                   ┌────────────┴────────────┐
                [PASS]                    [FAIL]
                   │                         │
                   ▼                         ▼
           [RTL_REQUESTED]          [Fail-Safe Hover Hold]
                   │
                   ▼
           [MAVLink Dispatched]
                   │
                   ▼
             [RTL_ACTIVE]
                   │
                   ▼
           [LANDING $\rightarrow$ RECOVERED]
```

---

### C. 3D Glacial Reconstruction & Route Optimization Pipeline
```text
[Multi-View Aerial Images (RGB + Radiometric IR)]
                   │
                   ▼
      [SfM Elevation Grid & LiDAR Synthesizer]
                   │
                   ▼
        [3D Surface Mesh & Thermal Point Cloud]
                   │
                   ▼
      [Edge AI Crevasse Fissure Detection]
                   │
                   ▼
        [Glaciologist Human Review Panel]
                   │
      ┌────────────┴────────────┐
 [CONFIRMED]                [REJECTED]
      │                         │
      ▼                         ▼
[Create Active Geofence]   [Archived Anomaly]
      │
      ▼
[Traverse Route Engine Ingests Hazard Penalty]
      │
      ▼
[Optimal Detour Path Computed & Broadcasted]
```

---

## 3. Database Schema & Firestore Security Architecture

All collections adhere to strict Role-Based Access Control (RBAC) enforced at both the client layer and cloud database security rules:

- `users`: User profiles and assigned operational roles.
- `expeditions`: Active polar missions, waypoints, and operational logistics.
- `personnel`: Crew members, roles, sub-zero equipment clearance, medical records.
- `cargo`: Cold-chain cargo manifests, weight limits, temperature logging.
- `inventory`: Station stores, spare components, emergency rations.
- `assets`: Snowcats, sledges, power generators, scientific sensors.
- `emergencies`: Incident tracking, triage status, assigned response teams.
- `geofences`: Dynamic polygonal and circular exclusion and warning zones.
- `routes`: Field traverse paths with hazard matrices and elevation profiles.
- `satelliteMessages`: P0-P5 queued and transmitted satellite packets with transaction hashes.
- `uavCommands`: Autonomous flight logs and safety command audit records.
- `terrainReconstructions`: 3D point cloud & mesh metadata for glaciological review.
- `crevasseHazards`: Confirmed glaciological fissures with depth, width, and shear angles.
- `activityLogs`: Immutable, append-only system audit events.
