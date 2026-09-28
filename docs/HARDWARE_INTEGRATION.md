# POLAR-X — Hardware Integration & Field Interoperability Guide

> **SIH Production Field Integration Manual**  
> Complete technical reference detailing software abstractions, supported hardware chipsets, connection protocols, and hardware grounding statuses for polar deployment.

---

## Hardware Interoperability Matrix

| Subsystem | Software Interface | Supported Physical Hardware | Current Status | Integration / Deployment Path |
| :--- | :--- | :--- | :---: | :--- |
| **Direct GNSS / GPS** | Web Serial API (`navigator.serial`) | u-blox ZED-F9P, NEO-M8N, Garmin GPS 18x USB, standard NMEA 0183 serial | `READY` (Hardware Required) | Connect USB-UART bridge; select COM port at 9600/115200 baud; parses standard `$GPGGA` / `$GPRMC` sentences. |
| **Satellite Broadband** | `ISatelliteBroadbandProvider` / Serial AT Commands | Iridium 9603 SBD, Iridium 9523, Iridium Certus 100/200 Transceivers, Inmarsat BGAN | `SIMULATED` / `READY` | Connect serial modem via RS-232 / USB interface; initialize AT command session (`AT+SBDIX`, `AT+CSQ`). |
| **UAV Autopilot** | `IUavFlightControllerProvider` / MAVLink v2.0 | PX4 Autopilot (Pixhawk 6X / Cube Orange), ArduPilot Plane/Copter | `SIMULATED` / `READY` | Connect telemetry radio (915 MHz / 433 MHz SiK radio) via Web Serial or WebSocket MAVLink bridge (`mavlink-router`). |
| **LoRa Mesh Gateway** | Web Serial / Web Bluetooth / HTTP API | Semtech SX1262 / SX1276, Heltec WiFi LoRa 32, RAK Wireless Meshtastic Nodes | `SIMULATED` / `READY` | Connect USB Meshtastic node; exchange protobuf telemetry packets over serial stream or local BLE GATT. |
| **AFSK 1200 Audio Modem** | Web Audio API (`AudioContext` / DSP) | Baofeng UV-5R, Yaesu FT-60R, Motorola MOTOTRBO via standard 3.5mm TRRS audio cable | `LIVE` (Software DSP) | Connect radio speaker/mic to PC audio jack; software demodulator performs real-time Bell 202 tone decoding at 1200 baud. |
| **Wearable Biometrics** | Web Bluetooth API (`navigator.bluetooth`) | Polar H10, Garmin HRM-Pro, Movesense Medical Sensor (Heart Rate & Temp GATT) | `READY` (Hardware Required) | Click "Connect BLE Sensor"; pair standard `0x180D` (Heart Rate) and `0x1809` (Health Thermometer) GATT services. |
| **Thermal Radiometric Camera** | WebGL / Canvas / ONNX Engine | FLIR Boson 320/640, Seek Thermal CompactPRO, DJI Zenmuse H20T radiometric streams | `SIMULATED` (Sensor) / `LIVE` (Render) | Stream radiometric TIFF / 16-bit grayscale thermal frames; client shader maps temperatures to `IRONBOW` / `RAINBOW` palettes. |
| **Edge AI Acceleration** | WebGPU (`navigator.gpu`) / ONNX Runtime Web | Apple Silicon Metal, NVIDIA RTX (Vulkan/DirectX12), Intel Iris Xe | `LIVE` (Local Client GPU) | Automatically detects WebGPU support; falls back to CPU SIMD WebAssembly if hardware GPU is unavailable. |

---

## 1. Web Serial GNSS Integration Guide

```typescript
// Sample connection snippet (available in src/services/gps/serialGpsService.ts)
const port = await navigator.serial.requestPort({
  filters: [{ usbVendorId: 0x1546 }] // u-blox AG USB Vendor ID
});
await port.open({ baudRate: 9600 });
const reader = port.readable.getReader();
// NMEA Parser continuously extracts latitude, longitude, altitude, HDOP, and fix quality
```

---

## 2. Satellite SBD Transmission Protocol

For low-bandwidth Iridium Short Burst Data (SBD) transmission:
1. `AT+SBDWT=<Payload>` — Writes binary packet to outbound modem buffer.
2. `AT+SBDIX` — Initiates satellite communication handshake with LEO constellation.
3. Response `+SBDIX: 0, <MO_MSN>, 0, <MT_MSN>, 0, <MT_LEN>` confirms successful delivery to land earth station gateway.

---

## 3. UAV MAVLink Return-To-Home (RTL) Interlock

```text
Message ID: 176 (MAV_CMD_DO_SET_MODE)
Param 1: MAV_MODE_FLAG_CUSTOM_MODE_ENABLED (1)
Param 2: PX4_CUSTOM_MAIN_MODE_AUTO (4)
Param 3: PX4_CUSTOM_SUB_MODE_AUTO_RTL (5)
```

The POLAR-X software interlock ensures that the command is never transmitted to the physical autopilot if:
- Battery margin $< 15\%$ of return requirements
- HDOP $> 2.5$ (GNSS fix degraded)
- Home point coordinates are unverified
- Airspace corridor intersects prohibited Antarctic Specially Protected Areas (ASPA)
