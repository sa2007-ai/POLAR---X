# POLAR-X — Integrated Polar Expedition Logistics & Field Safety Command System

> **Smart India Hackathon (SIH) — Production Release v10.0.0**  
> An enterprise-grade, offline-first command and control system engineered for extreme Antarctic conditions, multi-bearer communications, autonomous UAV reconnaissance, and 3D glaciological crevasse modeling.

---

## 1. Project Overview

**POLAR-X** is an integrated mission-critical command and safety platform designed for polar research stations (e.g., *Maitri*, *Bharati*, *Amundsen-Scott*, *Concordia*) and field traverse convoys operating in Antarctica. The platform unites real-time cloud data, progressive web application (PWA) offline execution, multi-priority satellite failover, autonomous UAV safety corridors, and 3D terrain reconstruction into a unified, high-reliability command center.

---

## 2. Architecture Overview

```text
                                  ┌───────────────────────────────┐
                                  │      POLAR-X COMMAND CORE     │
                                  └───────────────┬───────────────┘
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 │                                │                                │
  ┌──────────────▼──────────────┐  ┌──────────────▼──────────────┐  ┌──────────────▼──────────────┐
  │         CLOUD TIER          │  │       OFFLINE PWA TIER      │  │        FIELD EDGE TIER      │
  ├─────────────────────────────┤  ├─────────────────────────────┤  ├─────────────────────────────┤
  │ • Firebase Auth & Security  │  │ • Service Worker (AppShell) │  │ • Direct Serial GNSS/GPS    │
  │ • Firestore Real-time DB    │  │ • IndexedDB Cache & Queue   │  │ • Multi-Priority Satellite  │
  │ • Append-only Audit Logs    │  │ • Conflict Resolution Engine│  │ • UAV MAVLink / RTL Safety  │
  │ • Google Maps Platform      │  │ • Offline Vector Tile Cache │  │ • WebGPU / ONNX Edge AI     │
  │ • Cloud Seed Engine         │  │ • Tactical Radar Fallback   │  │ • LoRa / AFSK 1200 Gateways │
  └─────────────────────────────┘  └─────────────────────────────┘  └─────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend Core:** React 19, TypeScript 5.8+, Vite 8, React Router v7
- **Styling & Design System:** Tailwind CSS v4, Lucide Icons, Custom Polar Command Glassmorphism
- **Cloud & Auth Backend:** Firebase v12 (Authentication, Cloud Firestore, Security Rules)
- **Offline & Storage Engine:** Service Worker (Cache API), IndexedDB (`idb` schema v5)
- **Geospatial & Visualization:** Google Maps JavaScript API Loader, Polar Radar Canvas, WebGL 3D Engine
- **Field & Hardware Interop:** Web Serial API (NMEA GNSS), Web Audio API (AFSK 1200 Modem), Web Bluetooth (BLE Health Telemetry), WebGPU (Tensor Acceleration)
- **Code Quality & Verification:** Oxlint, TypeScript strict mode compiler, Custom Automated Test Harness

---

## 4. Key Capabilities & Features

1. **Mission & Expedition Command:** End-to-end expedition lifecycle management, waypoint tracking, and schedule monitoring.
2. **Personnel & Roster Logistics:** Role-based duty assignment, medical fitness clearance, and vital telemetry monitoring.
3. **Cold-Chain & Cargo Tracking:** Hazardous/sub-zero temperature threshold monitoring, weight balance, and manifests.
4. **Base Station Inventory & Assets:** Critical spare parts, fuel reserves, snowcat/sledge fleet readiness scores.
5. **Emergency SOS & Crisis Dispatch:** Code Red/Orange triage, automated beacon alerts, and P0 Satellite dispatch.
6. **Multi-Bearer Communications:** Automatic failover between Broadband Satellite, LoRa Mesh, and AFSK 1200 Audio.
7. **Satellite Broadband (Iridium Certus Architecture):** P0–P5 prioritized fair-queuing with transactional ACKs.
8. **Autonomous UAV Safety Hub:** Heartbeat watchdog, link-loss fail-safe, and Return-To-Home (RTL) safety interlocks.
9. **3D Crevasse & Terrain Reconstruction:** Photogrammetric/LiDAR surface mesh and thermal point-cloud synthesis with glaciologist human review.
10. **Tactical Polar Radar & Geofencing:** Dynamic ASPA/wildlife, hazard, and crevassed zone breach alarms.
11. **Traverse Route Optimizer:** Multi-factor Dijkstra/A* routing balancing elevation gradient, weather storms, and confirmed hazards.

---

## 5. Installation & Setup

### Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher

```bash
# Clone the repository
git clone https://github.com/your-org/polar-x.git
cd polar-x

# Install dependencies
npm install

# Launch development server
npm run dev
```

---

## 6. Environment Configuration

Create a `.env` file in the project root based on [`.env.example`](file:///.env.example):

```env
# Firebase Configuration (Optional - Omit to run in Mock Demo Mode)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Google Maps Platform (Optional - Omit to use Tactical Radar Grid)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

> **Security Note:** Secrets are never hardcoded. All keys are loaded through Vite environment variables and ignored via `.gitignore`.

---

## 7. Firebase & Security Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password Authentication**.
3. Create a **Cloud Firestore** database.
4. Deploy security rules from [`firestore.rules`](file:///firestore.rules):
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```
5. Navigate to `/settings` inside POLAR-X and click **"Seed Firestore"** to populate initial operational datasets.

---

## 8. Role-Based Access Control (RBAC)

| Role | Read Scope | Write Scope | Special Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | Full Access | Full Access | User management, security rules, audit log purge |
| **EXPEDITION_MANAGER** | All Modules | Expeditions, Routes, Convoys, Geofences, Cargo | Emergency escalation, flight planning |
| **LOGISTICS_OFFICER** | Logistics Modules | Cargo, Inventory, Assets, Convoys, Routes | Manifest sign-off, fuel balance |
| **SCIENTIST** | Science & Field | AI Models, UAV Detections, 3D Reconstruction | Hazard review & confirmation |
| **MEDICAL_OFFICER** | Base & Crew | Personnel records, Wearable Biometrics, SOS | Medical triage & emergency response |
| **VIEWER** | Read-Only | None | Masked coordinates, locked command triggers |

---

## 9. Offline PWA Architecture

- **App Shell Cache:** Static assets, HTML, styling, and icons cached via Service Worker (`public/sw.js`).
- **Data Persistence:** Operational collections cached in IndexedDB (`polarx_offline_db`).
- **Mutation Queue:** When offline, create/update actions are stored in `mutationQueue` and auto-synchronized upon reconnection.
- **Conflict Handling:** Server-authoritative timestamp ordering with manual conflict review.

---

## 10. Multi-Priority Satellite Architecture

Messages routed through the satellite bearer are managed by a strict multi-tier priority queue:
- **P0 Emergency / SOS:** Immediate preemption, instant dispatch.
- **P1 Vital Signs:** Crew health alerts and critical biometrics.
- **P2 Tactical Telemetry:** Vehicle coordinates and UAV telemetry.
- **P3 Science Data:** Thermal anomalies and sensor telemetry.
- **P4 File Transmit:** Mesh logs and compressed image frames.
- **P5 Low Priority Sync:** System diagnostics and background telemetry.

---

## 11. Autonomous UAV & RTL Safety Workflow

1. **Heartbeat Monitoring:** Watchdog tracks telemetry interval. Timeout $> 10\text{s}$ triggers `LINK_LOST`.
2. **Safety Interlock Checklist:**
   - Evaluates designated Home Point (Fixed Station Pad or Mobile Sledge Pad).
   - Verifies battery percentage vs. required return corridor power (minimum 15% reserve).
   - Verifies GNSS 3D fix (HDOP $< 2.5$).
   - Checks flight corridor for Antarctic Protected Areas (ASPA) and active hazards.
3. **Autopilot Dispatch:** Commands dispatched via MAVLink emulation (`RTL_REQUESTED` $\rightarrow$ `RTL_ACTIVE` $\rightarrow$ `LANDING` $\rightarrow$ `RECOVERED`).

---

## 12. 3D Terrain & Crevasse Reconstruction

- **Generation:** Structure-from-Motion (SfM) + LiDAR synthesis generates 3D elevation meshes and thermal point clouds.
- **Interactive 3D Viewer:** WebGL canvas with orbit rotation, wireframe overlay, false-color thermal palettes (`IRONBOW`, `RAINBOW`, `WHITE_HOT`), and route corridor projections.
- **Human-in-the-Loop Review:** Glaciologists review depth, shear angle, and width before promoting AI detections into active hazard geofences.

---

## 13. Strict Data Honesty Classification

POLAR-X explicitly stamps every data stream with its true operational status:

| Status Badge | Meaning |
| :--- | :--- |
| `LIVE` | Real hardware or physical sensor stream active. |
| `READY` | Software engine initialized and awaiting hardware link. |
| `SIMULATED` | Scientifically realistic synthetic model or emulation fixture. |
| `CACHED` | Valid local IndexedDB cache retrieved during offline operation. |
| `OFFLINE` | Disconnected from cloud; queuing mutations locally. |
| `HARDWARE_REQUIRED` | Feature implemented in software, requires physical transceiver. |
| `CONFIGURATION_REQUIRED` | Missing required API key or credentials. |

---

## 14. Testing & Verification

Run the comprehensive test harness:

```bash
# Execute Phase 9 & Phase 10 verification test suite
npx tsx src/test/phase9/index.ts

# Run static lint analysis
npm run lint

# Compile and build production bundle
npm run build
```

---

## 15. Production Deployment

```bash
# Build the production distribution
npm run build

# Preview the production build locally
npm run preview
```

The compiled assets in `dist/` are ready for hosting on **Firebase Hosting**, **Vercel**, **Cloudflare Pages**, or on-premise local servers.

---

## 16. Hardware Integration Requirements & Known Limitations

### Supported Hardware Interop
- **GNSS / GPS:** Standard NMEA 0183 serial stream over Web Serial (Baud 4800/9600/115200).
- **Satellite Modem:** Iridium 9603 / 9523 / Certus 100 serial AT command set.
- **UAV Autopilot:** PX4 / ArduPilot via MAVLink v2.0 telemetry bridge.
- **LoRa Mesh:** SX1262 / SX1276 transceivers over USB-UART / Meshtastic API.
- **Biometric Wearables:** Standard BLE GATT Heart Rate and Body Temperature services.

### Known Limitations
- High-resolution photogrammetry requires browser WebGL2 support.
- Web Serial and Web Bluetooth APIs require secure HTTPS context or `localhost`.
- Satellite hardware communication in simulated mode emulates polar LEO orbits based on realistic propagation models.
