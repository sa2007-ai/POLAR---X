import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PolarContext } from './polarContextInstance';
import {
  Expedition,
  Personnel,
  CargoItem,
  InventoryItem,
  PolarAsset,
  EmergencyIncident,
  PolarStation,
  PolarReport,
  PolarNotification,
  PolarActivityLog,
  getInventoryCalculatedStatus,
  EmergencyWorkflowStatus
} from '../types';
import { GeofenceZone, GeofenceBreach } from '../types/geofence';
import { TraverseRoute, RouteStatus } from '../types/route';
import { mockExpeditions } from '../data/mockExpeditions';
import { mockPersonnel } from '../data/mockPersonnel';
import { mockCargo } from '../data/mockCargo';
import { mockInventory } from '../data/mockInventory';
import { mockAssets } from '../data/mockAssets';
import { mockEmergencies } from '../data/mockEmergencies';
import { mockStations } from '../data/mockStations';
import { mockReports } from '../data/mockReports';
import { mockNotifications } from '../data/mockNotifications';
import { mockGeofences } from '../data/mockGeofences';
import { mockRoutes } from '../data/mockRoutes';
import { isFirebaseConfigured } from '../firebase/config';
import { evaluateAllGeofenceBreaches, TrackableEntity } from '../utils/geofenceDetection';

// Offline Cache & Sync Queue
import { cacheService } from '../services/offline/cacheService';
import { syncQueueService } from '../services/offline/syncQueueService';

// Firebase Services
import * as expService from '../services/firebase/expeditionService';
import * as persService from '../services/firebase/personnelService';
import * as cargoService from '../services/firebase/cargoService';
import * as invService from '../services/firebase/inventoryService';
import * as assetService from '../services/firebase/assetService';
import * as emgService from '../services/firebase/emergencyService';
import * as notifService from '../services/firebase/notificationService';
import * as logService from '../services/firebase/activityLogService';
import * as geoService from '../services/firebase/geofenceService';
import * as routeService from '../services/firebase/routeService';
import { seedFirestoreDatabase, resetFirestoreDemoData, SeedResult } from '../services/firebase/seedService';

export interface DashboardMetrics {
  activeExpeditions: number;
  totalPersonnel: number;
  inFieldPersonnel: number;
  cargoInTransit: number;
  lowStockItems: number;
  criticalStockItems: number;
  activeAssets: number;
  assetsNeedingMaintenance: number;
  activeEmergencies: number;
  criticalEmergencies: number;
  totalBudgetAllocated: number;
  fleetReadinessScore: number;
  activeGeofenceCount: number;
  activeBreachesCount: number;
}

export interface PolarContextType {
  // Firebase Integration State
  isFirebaseActive: boolean;
  dbLoading: boolean;
  dbError: string | null;
  triggerDatabaseSeed: () => Promise<SeedResult>;
  triggerDatabaseReset: (token?: string) => Promise<SeedResult>;
  retryFirestoreConnection: () => void;

  // Station Filter
  stations: PolarStation[];
  selectedStation: string;
  setSelectedStation: (station: string) => void;

  // Dynamic Metrics
  dashboardMetrics: DashboardMetrics;

  // Traverse Routes CRUD & Workflow
  routes: TraverseRoute[];
  addRoute: (route: Omit<TraverseRoute, 'id'>) => Promise<void> | void;
  updateRoute: (id: string, updates: Partial<TraverseRoute>) => Promise<void> | void;
  deleteRoute: (id: string) => Promise<void> | void;
  updateRouteStatus: (id: string, status: RouteStatus, extra?: Partial<TraverseRoute>) => Promise<void> | void;
  // Expeditions CRUD
  expeditions: Expedition[];
  addExpedition: (exp: Omit<Expedition, 'id'>) => Promise<void> | void;
  updateExpedition: (id: string, updates: Partial<Expedition>) => Promise<void> | void;
  deleteExpedition: (id: string) => Promise<void> | void;
  updateExpeditionStatus: (id: string, status: Expedition['status']) => Promise<void> | void;

  // Personnel CRUD
  personnel: Personnel[];
  addPersonnel: (p: Omit<Personnel, 'id'>) => Promise<void> | void;
  updatePersonnel: (id: string, updates: Partial<Personnel>) => Promise<void> | void;
  deletePersonnel: (id: string) => Promise<void> | void;
  updatePersonnelStatus: (id: string, status: Personnel['status']) => Promise<void> | void;

  // Cargo CRUD
  cargo: CargoItem[];
  addCargo: (c: Omit<CargoItem, 'id'>) => Promise<void> | void;
  updateCargo: (id: string, updates: Partial<CargoItem>) => Promise<void> | void;
  deleteCargo: (id: string) => Promise<void> | void;
  updateCargoStatus: (id: string, status: CargoItem['status']) => Promise<void> | void;

  // Inventory CRUD
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'status'>) => Promise<void> | void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void> | void;
  deleteInventoryItem: (id: string) => Promise<void> | void;
  updateInventoryStock: (id: string, delta: number) => Promise<void> | void;

  // Assets CRUD
  assets: PolarAsset[];
  addAsset: (asset: Omit<PolarAsset, 'id'>) => Promise<void> | void;
  updateAsset: (id: string, updates: Partial<PolarAsset>) => Promise<void> | void;
  deleteAsset: (id: string) => Promise<void> | void;
  updateAssetStatus: (id: string, status: PolarAsset['status']) => Promise<void> | void;

  // Emergencies CRUD & Workflow
  emergencies: EmergencyIncident[];
  createEmergency: (emergency: Omit<EmergencyIncident, 'id' | 'incidentCode' | 'reportedAt' | 'lastUpdate'>) => Promise<void> | void;
  triggerEmergency: (emergency: Omit<EmergencyIncident, 'id' | 'incidentCode' | 'reportedAt' | 'lastUpdate'>) => Promise<void> | void;
  updateEmergency: (id: string, updates: Partial<EmergencyIncident>) => Promise<void> | void;
  deleteEmergency: (id: string) => Promise<void> | void;
  resolveEmergency: (id: string) => Promise<void> | void;
  changeEmergencyWorkflowStatus: (id: string, status: EmergencyWorkflowStatus) => Promise<void> | void;
  assignEmergencyTeam: (id: string, team: string) => Promise<void> | void;

  // Geofences & Hazards
  geofences: GeofenceZone[];
  geofenceBreaches: GeofenceBreach[];
  addGeofence: (geofence: Omit<GeofenceZone, 'id' | 'createdAt'>) => Promise<void> | void;
  updateGeofence: (id: string, updates: Partial<GeofenceZone>) => Promise<void> | void;
  deleteGeofence: (id: string) => Promise<void> | void;
  toggleGeofenceStatus: (id: string) => Promise<void> | void;

  // Reports
  reports: PolarReport[];

  // Notifications
  notifications: PolarNotification[];
  addNotification: (notif: Omit<PolarNotification, 'id' | 'timestamp' | 'read'>) => Promise<void> | void;
  markNotificationRead: (id: string) => Promise<void> | void;
  clearAllNotifications: () => Promise<void> | void;
  deleteNotification: (id: string) => Promise<void> | void;

  // Activity Logs
  activityLogs: PolarActivityLog[];
  logActivity: (
    module: PolarActivityLog['module'],
    action: string,
    details: string,
    severity?: PolarActivityLog['severity'],
    user?: string
  ) => Promise<void> | void;

  // Real-time Clocks
  polarTimeUTC: string;
  stationTimeMaitri: string;
  stationTimeBharati: string;

  // Modals & Demo
  isSOSModalOpen: boolean;
  setIsSOSModalOpen: (open: boolean) => void;
  resetDemoState: () => void;
}

const initialActivityLogs: PolarActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '12 mins ago',
    module: 'emergency',
    action: 'SAR Convoy Dispatched',
    details: 'PistonBully #09 mobilized towards Erebus sector coordinate.',
    severity: 'critical',
    user: 'Capt. Marcus Vance'
  },
  {
    id: 'log-2',
    timestamp: '45 mins ago',
    module: 'inventory',
    action: 'Stock Alert Generated',
    details: 'Freeze-Dried Blood Plasma in Maitri dropped to 14 units.',
    severity: 'warning',
    user: 'Automated Sensor'
  },
  {
    id: 'log-3',
    timestamp: '2 hours ago',
    module: 'cargo',
    action: 'Icebreaker Vessel Position Ping',
    details: 'MV Vasiliy Golovnin reached Antarctic convergence latitude.',
    severity: 'info',
    user: 'Satellite Uplink'
  },
  {
    id: 'log-4',
    timestamp: '4 hours ago',
    module: 'expeditions',
    action: 'Ice Core Horizon Verified',
    details: 'Dr. Anand logged 348m deep core recovery with zero contamination.',
    severity: 'success',
    user: 'Dr. Vikram Anand'
  }
];

import { useAuth } from './useAuth';

export const PolarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firebaseReady = isFirebaseConfigured();
  const { currentUser, isDemoMode, profileStatus } = useAuth();
  const [isFirebaseActive] = useState<boolean>(firebaseReady);
  const [dbLoading, setDbLoading] = useState<boolean>(firebaseReady && !!currentUser);
  const [dbError, setDbError] = useState<string | null>(null);
  const [subscriptionRetryCount, setSubscriptionRetryCount] = useState<number>(0);

  const [stations] = useState<PolarStation[]>(mockStations);
  const [selectedStation, setSelectedStation] = useState<string>('All Stations');

  const [expeditions, setExpeditions] = useState<Expedition[]>(() => (!firebaseReady ? mockExpeditions : []));
  const [personnel, setPersonnel] = useState<Personnel[]>(() => (!firebaseReady ? mockPersonnel : []));
  const [cargo, setCargo] = useState<CargoItem[]>(() => (!firebaseReady ? mockCargo : []));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => (!firebaseReady ? mockInventory : []));
  const [assets, setAssets] = useState<PolarAsset[]>(() => (!firebaseReady ? mockAssets : []));
  const [emergencies, setEmergencies] = useState<EmergencyIncident[]>(() => (!firebaseReady ? mockEmergencies : []));
  const [geofences, setGeofences] = useState<GeofenceZone[]>(() => (!firebaseReady ? mockGeofences : []));
  const [routes, setRoutes] = useState<TraverseRoute[]>(() => (!firebaseReady ? mockRoutes : []));
  const [reports] = useState<PolarReport[]>(mockReports);
  const [notifications, setNotifications] = useState<PolarNotification[]>(() => (!firebaseReady ? mockNotifications : []));
  const [activityLogs, setActivityLogs] = useState<PolarActivityLog[]>(() => (!firebaseReady ? initialActivityLogs : []));
  const [isSOSModalOpen, setIsSOSModalOpen] = useState<boolean>(false);

  // Live polar clocks
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const polarTimeUTC = currentTime.toUTCString().slice(17, 25) + ' UTC';
  const maitriDate = new Date(currentTime.getTime() + 5 * 60 * 60 * 1000);
  const stationTimeMaitri = maitriDate.toISOString().slice(11, 19) + ' (Maitri)';
  const bharatiDate = new Date(currentTime.getTime() + 5.5 * 60 * 60 * 1000);
  const stationTimeBharati = bharatiDate.toISOString().slice(11, 19) + ' (Bharati)';

  // ================= OFFLINE INITIALIZATION & CACHE AUTO-PERSISTENCE =================
  useEffect(() => {
    const initLocalCache = async () => {
      // If offline or Firestore is unconfigured, hydrate from IndexedDB
      if (!navigator.onLine || !firebaseReady) {
        const cached = await cacheService.loadDomainSnapshot();
        if (cached.expeditions.length > 0) setExpeditions(cached.expeditions);
        if (cached.personnel.length > 0) setPersonnel(cached.personnel);
        if (cached.cargo.length > 0) setCargo(cached.cargo);
        if (cached.inventory.length > 0) setInventory(cached.inventory);
        if (cached.assets.length > 0) setAssets(cached.assets);
        if (cached.emergencies.length > 0) setEmergencies(cached.emergencies);
        if (cached.geofences.length > 0) setGeofences(cached.geofences);
        if (cached.routes.length > 0) setRoutes(cached.routes);
        if (cached.notifications.length > 0) setNotifications(cached.notifications);
        if (cached.activityLogs.length > 0) setActivityLogs(cached.activityLogs);
      }
    };
    initLocalCache();
  }, [firebaseReady]);

  // Persist domain state snapshot to IndexedDB cache
  useEffect(() => {
    cacheService.cacheDomainSnapshot({
      expeditions,
      personnel,
      cargo,
      inventory,
      assets,
      emergencies,
      geofences,
      notifications,
      activityLogs,
      routes
    });
  }, [expeditions, personnel, cargo, inventory, assets, emergencies, geofences, notifications, activityLogs, routes]);

  // ================= FIRESTORE REAL-TIME SUBSCRIPTIONS =================
  useEffect(() => {
    if (!firebaseReady || isDemoMode) {
      return;
    }

    if (!currentUser || profileStatus !== 'READY') {
      return;
    }

    const unsubscribers: (() => void)[] = [];

    const initSubscriptions = () => {
      try {
        setDbLoading(true);
        unsubscribers.push(
          expService.subscribeExpeditions(
            (data) => {
              setExpeditions(data || []);
              setDbLoading(false);
              setDbError(null);
            },
            (err) => {
              console.warn('[POLAR-X] expeditions subscription error:', err);
              setDbError(`expeditions: ${err.message}`);
              setDbLoading(false);
            }
          )
        );

        unsubscribers.push(
          persService.subscribePersonnel(
            (data) => {
              setPersonnel(data || []);
              setDbLoading(false);
              setDbError(null);
            },
            (err) => {
              console.warn('[POLAR-X] personnel subscription error:', err);
              setDbError(`personnel: ${err.message}`);
              setDbLoading(false);
            }
          )
        );

        unsubscribers.push(
          cargoService.subscribeCargo(
            (data) => {
              setCargo(data || []);
              setDbLoading(false);
              setDbError(null);
            },
            (err) => {
              console.warn('[POLAR-X] cargo subscription error:', err);
              setDbError(`cargo: ${err.message}`);
              setDbLoading(false);
            }
          )
        );

        unsubscribers.push(
          invService.subscribeInventory(
            (data) => {
              setInventory(data || []);
              setDbLoading(false);
              setDbError(null);
            },
            (err) => {
              console.warn('[POLAR-X] inventory subscription error:', err);
              setDbError(`inventory: ${err.message}`);
              setDbLoading(false);
            }
          )
        );

        unsubscribers.push(
          assetService.subscribeAssets(
            (data) => {
              setAssets(data || []);
              setDbLoading(false);
              setDbError(null);
            },
            (err) => {
              console.warn('[POLAR-X] assets subscription error:', err);
              setDbError(`assets: ${err.message}`);
              setDbLoading(false);
            }
          )
        );

        unsubscribers.push(
          emgService.subscribeEmergencies(
            (data) => {
              setEmergencies(data || []);
              setDbLoading(false);
              setDbError(null);
            },
            (err) => {
              console.warn('[POLAR-X] emergencies subscription error:', err);
              setDbError(`emergencies: ${err.message}`);
              setDbLoading(false);
            }
          )
        );

        unsubscribers.push(
          geoService.subscribeGeofences(
            (data) => {
              setGeofences(data || []);
              setDbLoading(false);
              setDbError(null);
            },
            (err) => {
              console.warn('[POLAR-X] geofences subscription error:', err);
              setDbError(`geofences: ${err.message}`);
              setDbLoading(false);
            }
          )
        );

        unsubscribers.push(
          routeService.subscribeRoutes(
            (data) => {
              setRoutes(data || []);
              setDbLoading(false);
              setDbError(null);
            },
            (err) => {
              console.warn('[POLAR-X] routes subscription error:', err);
              setDbError(`routes: ${err.message}`);
              setDbLoading(false);
            }
          )
        );

        unsubscribers.push(
          notifService.subscribeNotifications(
            (data) => {
              setNotifications(data || []);
              setDbLoading(false);
              setDbError(null);
            },
            (err) => {
              console.warn('[POLAR-X] notifications subscription error:', err);
              setDbError(`notifications: ${err.message}`);
              setDbLoading(false);
            }
          )
        );

        unsubscribers.push(
          logService.subscribeActivityLogs(
            (data) => {
              setActivityLogs(data || []);
              setDbLoading(false);
              setDbError(null);
            },
            (err) => {
              console.warn('[POLAR-X] activityLogs subscription error:', err);
              setDbError(`activityLogs: ${err.message}`);
              setDbLoading(false);
            }
          )
        );
      } catch (err: any) {
        console.warn('[POLAR-X] Could not establish real-time Firestore listeners:', err);
        setDbError(err.message || 'Firestore connection refused');
        setDbLoading(false);
      }
    };

    initSubscriptions();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [firebaseReady, currentUser, isDemoMode, profileStatus, subscriptionRetryCount]);

  const retryFirestoreConnection = useCallback(() => {
    setDbLoading(true);
    setDbError(null);
    setSubscriptionRetryCount((prev) => prev + 1);
  }, []);

  // Safe Explicit Seeding Action
  const triggerDatabaseSeed = useCallback(async (): Promise<SeedResult> => {
    const result = await seedFirestoreDatabase();
    return result;
  }, []);

  // Safe Explicit Reset Action
  const triggerDatabaseReset = useCallback(async (token: string = 'CONFIRM_POLAR_DEMO_RESET'): Promise<SeedResult> => {
    const result = await resetFirestoreDemoData(token);
    return result;
  }, []);


  // Reusable Activity Logger
  const logActivity = useCallback(
    async (
      module: PolarActivityLog['module'],
      action: string,
      details: string,
      severity: PolarActivityLog['severity'] = 'info',
      user: string = 'Mission Operator'
    ) => {
      const newLog: PolarActivityLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: 'Just now',
        module,
        action,
        details,
        severity,
        user
      };

      setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);

      if (firebaseReady) {
        try {
          await logService.createActivityLog(newLog);
        } catch (err) {
          console.error('Failed to persist activity log to Firestore:', err);
        }
      }
    },
    [firebaseReady]
  );

  // Reusable Notification Adder
  const addNotification = useCallback(
    async (notif: Omit<PolarNotification, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: PolarNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: 'Just now',
        read: false,
        ...notif
      };

      setNotifications((prev) => [newNotif, ...prev]);

      if (firebaseReady) {
        try {
          await notifService.createNotification(newNotif);
        } catch (err) {
          console.error('Failed to persist notification to Firestore:', err);
        }
      }
    },
    [firebaseReady]
  );

  // ================= REAL-TIME GEOFENCE BREACH DETECTION =================
  const geofenceBreaches: GeofenceBreach[] = useMemo(() => {
    const trackableEntities: TrackableEntity[] = [];

    // Add active expeditions with valid coordinates
    expeditions.forEach((exp) => {
      if (exp.coordinates && exp.status === 'Active') {
        trackableEntities.push({
          id: exp.id,
          name: `${exp.code}: ${exp.title}`,
          type: 'expedition',
          coordinates: {
            lat: exp.coordinates.lat,
            lng: exp.coordinates.lng
          }
        });
      }
    });

    return evaluateAllGeofenceBreaches(trackableEntities, geofences);
  }, [expeditions, geofences]);

  // Dynamic Dashboard Calculations
  const dashboardMetrics: DashboardMetrics = useMemo(() => {
    const activeExps = expeditions.filter((e) => e.status === 'Active' || e.status === 'Scheduled').length;
    const totalPers = personnel.length;
    const inFieldPers = personnel.filter(
      (p) => p.status === 'In Field' || p.status === 'In Transit' || p.status === 'Active'
    ).length;
    const inTransitCrg = cargo.filter(
      (c) => c.status === 'In Transit' || c.status === 'Loaded' || c.status === 'Air-Dropped'
    ).length;
    const lowStock = inventory.filter(
      (i) => i.status === 'LOW STOCK' || i.status === 'Low Stock' || i.status === 'Expiring Soon'
    ).length;
    const criticalStock = inventory.filter(
      (i) => i.status === 'CRITICAL' || i.status === 'Critical Shortage' || i.status === 'EXPIRED'
    ).length;
    const activeAst = assets.filter(
      (a) => a.status === 'Operational' || a.status === 'In Field Use' || a.status === 'Available' || a.status === 'In Use'
    ).length;
    const astMaintenance = assets.filter(
      (a) => a.status === 'Maintenance Required' || a.status === 'Under Maintenance' || (typeof a.healthScore === 'number' && a.healthScore < 70)
    ).length;
    const activeEmg = emergencies.filter((e) => e.status !== 'RESOLVED' && e.status !== 'Resolved' && e.status !== 'CLOSED').length;
    const critEmg = emergencies.filter(
      (e) => (e.severity === 'Critical' || (typeof e.severity === 'string' && e.severity.includes('Code Red'))) && e.status !== 'RESOLVED' && e.status !== 'Resolved' && e.status !== 'CLOSED'
    ).length;
    const totalBudget = expeditions.reduce((sum, e) => sum + (e.budgetAllocated || 0), 0);
    const avgHealth = Math.round(assets.reduce((sum, a) => sum + (a.healthScore || 0), 0) / (assets.length || 1));

    return {
      activeExpeditions: activeExps,
      totalPersonnel: totalPers,
      inFieldPersonnel: inFieldPers,
      cargoInTransit: inTransitCrg,
      lowStockItems: lowStock + criticalStock,
      criticalStockItems: criticalStock,
      activeAssets: activeAst,
      assetsNeedingMaintenance: astMaintenance,
      activeEmergencies: activeEmg,
      criticalEmergencies: critEmg,
      totalBudgetAllocated: totalBudget,
      fleetReadinessScore: avgHealth,
      activeGeofenceCount: geofences.filter((g) => g.status === 'active').length,
      activeBreachesCount: geofenceBreaches.length
    };
  }, [expeditions, personnel, cargo, inventory, assets, emergencies, geofences, geofenceBreaches]);

  // ================= EXPEDITIONS ACTIONS =================
  const addExpedition = useCallback(
    async (newExp: Omit<Expedition, 'id'>) => {
      const id = `exp-${Date.now()}`;
      const item: Expedition = { id, ...newExp };
      setExpeditions((prev) => [item, ...prev]);

      if (firebaseReady) {
        await expService.createExpedition(item);
      }

      await addNotification({
        title: `New Expedition Staged: ${item.title}`,
        description: `Mission code ${item.code} registered under ${item.station}.`,
        type: 'info',
        link: '/expeditions'
      });
      await logActivity('expeditions', 'Expedition Created', `${item.code}: ${item.title}`, 'info');
    },
    [firebaseReady, addNotification, logActivity]
  );

  const updateExpedition = useCallback(
    async (id: string, updates: Partial<Expedition>) => {
      setExpeditions((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          return { ...e, ...updates };
        })
      );

      if (firebaseReady) {
        await expService.updateExpedition(id, updates);
      }

      await logActivity('expeditions', 'Expedition Updated', `Expedition ID: ${id} modified`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const deleteExpedition = useCallback(
    async (id: string) => {
      const exp = expeditions.find((e) => e.id === id);
      setExpeditions((prev) => prev.filter((e) => e.id !== id));

      if (firebaseReady) {
        await expService.deleteExpedition(id);
      }

      if (exp) {
        await logActivity('expeditions', 'Expedition Removed', `Expedition ${exp.code} deleted from cloud registry`, 'warning');
      }
    },
    [expeditions, firebaseReady, logActivity]
  );

  const updateExpeditionStatus = useCallback(
    async (id: string, status: Expedition['status']) => {
      setExpeditions((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          return { ...e, status };
        })
      );

      if (firebaseReady) {
        await expService.updateExpedition(id, { status });
      }

      const exp = expeditions.find((e) => e.id === id);
      if (exp) {
        await addNotification({
          title: `Expedition Status Change: ${exp.code}`,
          description: `${exp.title} transitioned to ${status}.`,
          type: status === 'Active' ? 'success' : status === 'Cancelled' ? 'warning' : 'info',
          link: '/expeditions'
        });
        await logActivity('expeditions', 'Status Changed', `${exp.code} changed status to ${status}`, 'info');
      }
    },
    [expeditions, firebaseReady, addNotification, logActivity]
  );

  // ================= PERSONNEL ACTIONS =================
  const addPersonnel = useCallback(
    async (newPers: Omit<Personnel, 'id'>) => {
      const id = `pers-${Date.now()}`;
      const item: Personnel = { id, ...newPers };
      setPersonnel((prev) => [item, ...prev]);

      if (firebaseReady) {
        await persService.createPersonnel(item);
      }

      await logActivity('personnel', 'Crew Member Enrolled', `${item.name} (${item.role})`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const updatePersonnel = useCallback(
    async (id: string, updates: Partial<Personnel>) => {
      setPersonnel((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

      if (firebaseReady) {
        await persService.updatePersonnel(id, updates);
      }

      await logActivity('personnel', 'Crew Record Updated', `Personnel ID: ${id} updated`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const deletePersonnel = useCallback(
    async (id: string) => {
      const pers = personnel.find((p) => p.id === id);
      setPersonnel((prev) => prev.filter((p) => p.id !== id));

      if (firebaseReady) {
        await persService.deletePersonnel(id);
      }

      if (pers) {
        await logActivity('personnel', 'Personnel Discharged', `${pers.name} (${pers.badgeId}) removed from roster`, 'warning');
      }
    },
    [personnel, firebaseReady, logActivity]
  );

  const updatePersonnelStatus = useCallback(
    async (id: string, status: Personnel['status']) => {
      setPersonnel((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));

      if (firebaseReady) {
        await persService.updatePersonnel(id, { status });
      }

      const pers = personnel.find((p) => p.id === id);
      if (pers) {
        await logActivity('personnel', 'Duty Status Changed', `${pers.name} is now ${status}`, 'info');
      }
    },
    [personnel, firebaseReady, logActivity]
  );

  // ================= CARGO ACTIONS =================
  const addCargo = useCallback(
    async (newCargo: Omit<CargoItem, 'id'>) => {
      const id = `crg-${Date.now()}`;
      const item: CargoItem = { id, ...newCargo };
      setCargo((prev) => [item, ...prev]);

      if (firebaseReady) {
        await cargoService.createCargoItem(item);
      }

      await addNotification({
        title: `Cargo Manifest Staged: ${item.trackingNumber}`,
        description: `${item.title} routed to ${item.destinationStation}.`,
        type: 'info',
        link: '/cargo'
      });
      await logActivity('cargo', 'Consignment Logged', `${item.trackingNumber} to ${item.destinationStation}`, 'info');
    },
    [firebaseReady, addNotification, logActivity]
  );

  const updateCargo = useCallback(
    async (id: string, updates: Partial<CargoItem>) => {
      setCargo((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

      if (firebaseReady) {
        await cargoService.updateCargoItem(id, updates);
      }

      await logActivity('cargo', 'Manifest Updated', `Cargo ID ${id} updated`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const deleteCargo = useCallback(
    async (id: string) => {
      const item = cargo.find((c) => c.id === id);
      setCargo((prev) => prev.filter((c) => c.id !== id));

      if (firebaseReady) {
        await cargoService.deleteCargoItem(id);
      }

      if (item) {
        await logActivity('cargo', 'Consignment Deleted', `${item.trackingNumber} removed from manifest`, 'warning');
      }
    },
    [cargo, firebaseReady, logActivity]
  );

  const updateCargoStatus = useCallback(
    async (id: string, status: CargoItem['status']) => {
      setCargo((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

      if (firebaseReady) {
        await cargoService.updateCargoItem(id, { status });
      }

      const item = cargo.find((c) => c.id === id);
      if (item) {
        if (status === 'Delayed' || status === 'Delayed by Weather') {
          await addNotification({
            title: `Cargo Weather Delay: ${item.trackingNumber}`,
            description: `${item.title} delayed en route to ${item.destinationStation}.`,
            type: 'warning',
            link: '/cargo'
          });
          await logActivity('cargo', 'Cargo Delayed', `${item.trackingNumber} delayed by weather`, 'warning');
        } else if (status === 'Delivered') {
          await addNotification({
            title: `Cargo Delivered: ${item.trackingNumber}`,
            description: `${item.title} successfully delivered at ${item.destinationStation}.`,
            type: 'success',
            link: '/cargo'
          });
          await logActivity('cargo', 'Cargo Delivered', `${item.trackingNumber} delivered safely`, 'success');
        } else {
          await logActivity('cargo', 'Cargo Status Updated', `${item.trackingNumber} is now ${status}`, 'info');
        }
      }
    },
    [cargo, firebaseReady, addNotification, logActivity]
  );

  // ================= INVENTORY ACTIONS =================
  const addInventoryItem = useCallback(
    async (newItem: Omit<InventoryItem, 'id' | 'status'>) => {
      const id = `inv-${Date.now()}`;
      const status = getInventoryCalculatedStatus(newItem.quantity, newItem.minimumThreshold, newItem.expiryDate);
      const item: InventoryItem = { id, ...newItem, status };
      setInventory((prev) => [item, ...prev]);

      if (firebaseReady) {
        await invService.createInventoryItem(item);
      }

      await logActivity('inventory', 'SKU Added', `${item.name} (${item.sku})`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const updateInventoryItem = useCallback(
    async (id: string, updates: Partial<InventoryItem>) => {
      let updatedItem: InventoryItem | undefined;
      setInventory((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const merged = { ...item, ...updates };
          const status = getInventoryCalculatedStatus(merged.quantity, merged.minimumThreshold, merged.expiryDate);
          updatedItem = { ...merged, status };
          return updatedItem;
        })
      );

      if (firebaseReady && updatedItem) {
        await invService.updateInventoryItem(id, updatedItem);
      }

      await logActivity('inventory', 'Inventory SKU Updated', `SKU ID ${id} modified`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const deleteInventoryItem = useCallback(
    async (id: string) => {
      const item = inventory.find((i) => i.id === id);
      setInventory((prev) => prev.filter((i) => i.id !== id));

      if (firebaseReady) {
        await invService.deleteInventoryItem(id);
      }

      if (item) {
        await logActivity('inventory', 'SKU Deleted', `${item.name} (${item.sku}) deleted`, 'warning');
      }
    },
    [inventory, firebaseReady, logActivity]
  );

  const updateInventoryStock = useCallback(
    async (id: string, delta: number) => {
      let calculatedItem: InventoryItem | undefined;

      setInventory((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const newQty = Math.max(0, item.quantity + delta);
          const newStatus = getInventoryCalculatedStatus(newQty, item.minimumThreshold, item.expiryDate);

          calculatedItem = { ...item, quantity: newQty, status: newStatus };

          // Cross-module triggers
          if (newStatus === 'CRITICAL' || newStatus === 'Critical Shortage') {
            addNotification({
              title: `Critical Stock Alert: ${item.name}`,
              description: `${item.station} reserves down to ${newQty} ${item.unit} (Min: ${item.minimumThreshold}).`,
              type: 'emergency',
              link: '/inventory'
            });
            logActivity('inventory', 'Critical Stock Shortage', `${item.name} dropped to critical level (${newQty})`, 'critical');
          } else if (newStatus === 'LOW STOCK' || newStatus === 'Low Stock') {
            addNotification({
              title: `Low Stock Warning: ${item.name}`,
              description: `${item.station} has ${newQty} ${item.unit} remaining.`,
              type: 'warning',
              link: '/inventory'
            });
            logActivity('inventory', 'Stock Level Warning', `${item.name} low stock warning (${newQty})`, 'warning');
          }

          return calculatedItem;
        })
      );

      if (firebaseReady && calculatedItem) {
        await invService.updateInventoryItem(id, {
          quantity: calculatedItem.quantity,
          status: calculatedItem.status
        });
      }
    },
    [firebaseReady, addNotification, logActivity]
  );

  // ================= ASSETS ACTIONS =================
  const addAsset = useCallback(
    async (newAsset: Omit<PolarAsset, 'id'>) => {
      const id = `ast-${Date.now()}`;
      const item: PolarAsset = { id, ...newAsset };
      setAssets((prev) => [item, ...prev]);

      if (firebaseReady) {
        await assetService.createAsset(item);
      }

      await logActivity('assets', 'Asset Registered', `${item.name} (${item.assetTag})`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const updateAsset = useCallback(
    async (id: string, updates: Partial<PolarAsset>) => {
      setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));

      if (firebaseReady) {
        await assetService.updateAsset(id, updates);
      }

      await logActivity('assets', 'Asset Updated', `Asset ID ${id} modified`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const deleteAsset = useCallback(
    async (id: string) => {
      const item = assets.find((a) => a.id === id);
      setAssets((prev) => prev.filter((a) => a.id !== id));

      if (firebaseReady) {
        await assetService.deleteAsset(id);
      }

      if (item) {
        await logActivity('assets', 'Asset Decommissioned', `${item.name} (${item.assetTag})`, 'warning');
      }
    },
    [assets, firebaseReady, logActivity]
  );

  const updateAssetStatus = useCallback(
    async (id: string, status: PolarAsset['status']) => {
      setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));

      if (firebaseReady) {
        await assetService.updateAsset(id, { status });
      }

      const asset = assets.find((a) => a.id === id);
      if (asset) {
        if (status === 'Under Maintenance' || status === 'Maintenance Required' || status === 'Severe Breakdown') {
          await addNotification({
            title: `Asset Maintenance Alert: ${asset.assetTag}`,
            description: `${asset.name} at ${asset.currentStation} is now ${status}.`,
            type: 'warning',
            link: '/assets'
          });
          await logActivity('assets', 'Asset Maintenance Required', `${asset.name} marked ${status}`, 'warning');
        } else {
          await logActivity('assets', 'Asset Status Changed', `${asset.name} is now ${status}`, 'info');
        }
      }
    },
    [assets, firebaseReady, addNotification, logActivity]
  );

  // ================= EMERGENCY ACTIONS =================
  const createEmergency = useCallback(
    async (data: Omit<EmergencyIncident, 'id' | 'incidentCode' | 'reportedAt' | 'lastUpdate'>) => {
      const code = `SOS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newIncident: EmergencyIncident = {
        id: `emg-${Date.now()}`,
        incidentCode: code,
        reportedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
        lastUpdate: 'Just now: Alert dispatched across Antarctic mesh network',
        ...data
      };
      setEmergencies((prev) => [newIncident, ...prev]);

      if (firebaseReady) {
        await emgService.createEmergencyIncident(newIncident);
      }

      const isCritical = data.severity === 'Critical' || data.severity.includes('Code Red');

      await addNotification({
        title: `EMERGENCY ALERT: ${data.title}`,
        description: `${data.stationOrRegion} triggered ${data.severity}`,
        type: isCritical ? 'emergency' : 'warning',
        link: '/emergency'
      });

      await logActivity(
        'emergency',
        `Emergency Alert ${newIncident.incidentCode}`,
        `${data.title} (${data.severity}) at ${data.stationOrRegion}`,
        isCritical ? 'critical' : 'warning'
      );
    },
    [firebaseReady, addNotification, logActivity]
  );

  const triggerEmergency = createEmergency; // Alias for backwards compatibility

  const updateEmergency = useCallback(
    async (id: string, updates: Partial<EmergencyIncident>) => {
      const updatedInfo = {
        ...updates,
        lastUpdate: `Updated: ${new Date().toISOString().slice(11, 16)} UTC by Mission Control`
      };

      setEmergencies((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          return { ...e, ...updatedInfo };
        })
      );

      if (firebaseReady) {
        await emgService.updateEmergencyIncident(id, updatedInfo);
      }

      await logActivity('emergency', 'Emergency Record Updated', `Incident ID: ${id}`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const deleteEmergency = useCallback(
    async (id: string) => {
      const emg = emergencies.find((e) => e.id === id);
      setEmergencies((prev) => prev.filter((e) => e.id !== id));

      if (firebaseReady) {
        await emgService.deleteEmergencyIncident(id);
      }

      if (emg) {
        await logActivity('emergency', 'Emergency Record Archived', `Incident ${emg.incidentCode} archived`, 'info');
      }
    },
    [emergencies, firebaseReady, logActivity]
  );

  const resolveEmergency = useCallback(
    async (id: string) => {
      const resolutionUpdate = {
        status: 'RESOLVED' as EmergencyWorkflowStatus,
        lastUpdate: `Incident resolved by Mission Control at ${new Date().toISOString().slice(11, 16)} UTC`
      };

      setEmergencies((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...resolutionUpdate } : e))
      );

      if (firebaseReady) {
        await emgService.updateEmergencyIncident(id, resolutionUpdate);
      }

      const emg = emergencies.find((e) => e.id === id);
      if (emg) {
        await addNotification({
          title: `Emergency Resolved: ${emg.incidentCode}`,
          description: `${emg.title} marked resolved. SAR units standing down.`,
          type: 'success',
          link: '/emergency'
        });
        await logActivity('emergency', 'Emergency Resolved', `${emg.incidentCode} stabilized and resolved`, 'success');
      }
    },
    [emergencies, firebaseReady, addNotification, logActivity]
  );

  const changeEmergencyWorkflowStatus = useCallback(
    async (id: string, status: EmergencyWorkflowStatus) => {
      const statusUpdate = {
        status,
        lastUpdate: `Workflow status shifted to ${status} at ${new Date().toISOString().slice(11, 16)} UTC`
      };

      setEmergencies((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...statusUpdate } : e))
      );

      if (firebaseReady) {
        await emgService.updateEmergencyIncident(id, statusUpdate);
      }

      const emg = emergencies.find((e) => e.id === id);
      if (emg) {
        await logActivity('emergency', 'Workflow Progression', `${emg.incidentCode} transitioned to ${status}`, 'info');
      }
    },
    [emergencies, firebaseReady, logActivity]
  );

  const assignEmergencyTeam = useCallback(
    async (id: string, team: string) => {
      const teamUpdate = {
        assignedTeam: team,
        lastUpdate: `Assigned rescue team: ${team}`
      };

      setEmergencies((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...teamUpdate } : e))
      );

      if (firebaseReady) {
        await emgService.updateEmergencyIncident(id, teamUpdate);
      }

      const emg = emergencies.find((e) => e.id === id);
      if (emg) {
        await logActivity('emergency', 'Rescue Team Assigned', `${team} deployed for ${emg.incidentCode}`, 'info');
      }
    },
    [emergencies, firebaseReady, logActivity]
  );

  // ================= GEOFENCES ACTIONS =================
  const addGeofence = useCallback(
    async (newGeo: Omit<GeofenceZone, 'id' | 'createdAt'>) => {
      const id = `geo-${Date.now()}`;
      const item: GeofenceZone = {
        id,
        createdAt: new Date().toISOString(),
        ...newGeo
      };
      setGeofences((prev) => [item, ...prev]);

      if (firebaseReady) {
        await geoService.createGeofence(item);
      }

      await logActivity('system', 'Geofence Zone Established', `${item.code}: ${item.name}`, 'warning');
      await addNotification({
        title: `Geofence Zone Active: ${item.name}`,
        description: `Sector boundaries defined under ${item.stationOrRegion}.`,
        type: item.type === 'hazard' ? 'warning' : 'info',
        link: '/map'
      });
    },
    [firebaseReady, addNotification, logActivity]
  );

  const updateGeofence = useCallback(
    async (id: string, updates: Partial<GeofenceZone>) => {
      setGeofences((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));

      if (firebaseReady) {
        await geoService.updateGeofence(id, updates);
      }

      await logActivity('system', 'Geofence Modified', `Zone ID: ${id} updated`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const deleteGeofence = useCallback(
    async (id: string) => {
      const target = geofences.find((g) => g.id === id);
      setGeofences((prev) => prev.filter((g) => g.id !== id));

      if (firebaseReady) {
        await geoService.deleteGeofence(id);
      }

      if (target) {
        await logActivity('system', 'Geofence Removed', `Zone ${target.name} deactivated`, 'info');
      }
    },
    [geofences, firebaseReady, logActivity]
  );

  const toggleGeofenceStatus = useCallback(
    async (id: string) => {
      let nextStatus: GeofenceZone['status'] = 'active';
      setGeofences((prev) =>
        prev.map((g) => {
          if (g.id !== id) return g;
          nextStatus = g.status === 'active' ? 'inactive' : 'active';
          return { ...g, status: nextStatus };
        })
      );

      if (firebaseReady) {
        await geoService.updateGeofence(id, { status: nextStatus });
      }
    },
    [firebaseReady]
  );

  // ================= NOTIFICATION ACTIONS =================
  const markNotificationRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      if (firebaseReady) {
        await notifService.markNotificationAsReadInDb(id);
      }
    },
    [firebaseReady]
  );

  const clearAllNotifications = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (firebaseReady) {
      notifications.forEach(async (n) => {
        if (!n.read) await notifService.markNotificationAsReadInDb(n.id);
      });
    }
  }, [firebaseReady, notifications]);

  const deleteNotification = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (firebaseReady) {
        await notifService.deleteNotificationFromDb(id);
      }
    },
    [firebaseReady]
  );

  // ================= TRAVERSE ROUTES ACTIONS =================
  const addRoute = useCallback(
    async (newRoute: Omit<TraverseRoute, 'id'>) => {
      const id = `trv-${Date.now()}`;
      const item: TraverseRoute = { id, ...newRoute };
      setRoutes((prev) => [item, ...prev]);

      if (firebaseReady && navigator.onLine) {
        try {
          await routeService.createRoute(item);
        } catch (err) {
          console.warn('Network error creating route, enqueuing to offline mutation queue:', err);
          await syncQueueService.enqueue('routes', item.id, 'CREATE', item, item.createdBy);
        }
      } else {
        await syncQueueService.enqueue('routes', item.id, 'CREATE', item, item.createdBy);
      }

      await logActivity('expeditions', 'Traverse Route Created', `${item.code}: ${item.title}`, 'info');
      await addNotification({
        title: `Route Staged: ${item.code}`,
        description: `${item.title} (${item.originStation} → ${item.destinationStation}) registered as DRAFT.`,
        type: 'info',
        link: '/routes'
      });
    },
    [firebaseReady, logActivity, addNotification]
  );

  const updateRoute = useCallback(
    async (id: string, updates: Partial<TraverseRoute>) => {
      setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)));

      if (firebaseReady && navigator.onLine) {
        try {
          await routeService.updateRoute(id, updates);
        } catch {
          await syncQueueService.enqueue('routes', id, 'UPDATE', updates);
        }
      } else {
        await syncQueueService.enqueue('routes', id, 'UPDATE', updates);
      }

      await logActivity('expeditions', 'Route Modified', `Route ID: ${id} updated`, 'info');
    },
    [firebaseReady, logActivity]
  );

  const deleteRoute = useCallback(
    async (id: string) => {
      const target = routes.find((r) => r.id === id);
      setRoutes((prev) => prev.filter((r) => r.id !== id));

      if (firebaseReady && navigator.onLine) {
        try {
          await routeService.deleteRoute(id);
        } catch {
          await syncQueueService.enqueue('routes', id, 'DELETE', { id });
        }
      } else {
        await syncQueueService.enqueue('routes', id, 'DELETE', { id });
      }

      if (target) {
        await logActivity('expeditions', 'Route Removed', `Route ${target.code} deleted`, 'warning');
      }
    },
    [routes, firebaseReady, logActivity]
  );

  const updateRouteStatus = useCallback(
    async (id: string, status: RouteStatus, extra?: Partial<TraverseRoute>) => {
      const updates = {
        status,
        ...extra,
        updatedAt: new Date().toISOString()
      };

      setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));

      if (firebaseReady && navigator.onLine) {
        try {
          await routeService.updateRoute(id, updates);
        } catch {
          await syncQueueService.enqueue('routes', id, 'UPDATE', updates);
        }
      } else {
        await syncQueueService.enqueue('routes', id, 'UPDATE', updates);
      }

      const route = routes.find((r) => r.id === id);
      if (route) {
        await logActivity(
          'expeditions',
          `Route Transition: ${status}`,
          `${route.code} shifted to ${status}`,
          status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'warning' : 'info'
        );
        await addNotification({
          title: `Traverse Route ${status}: ${route.code}`,
          description: `${route.title} status updated to ${status}.`,
          type: status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'warning' : 'info',
          link: '/routes'
        });
      }
    },
    [routes, firebaseReady, logActivity, addNotification]
  );

  const resetDemoState = useCallback(() => {
    setExpeditions(mockExpeditions);
    setPersonnel(mockPersonnel);
    setCargo(mockCargo);
    setInventory(mockInventory);
    setAssets(mockAssets);
    setEmergencies(mockEmergencies);
    setGeofences(mockGeofences);
    setRoutes(mockRoutes);
    setNotifications(mockNotifications);
    setActivityLogs(initialActivityLogs);
    logActivity('SYSTEM' as any, 'RESET_DEMO_STATE', 'In-memory demonstration state restored to pristine defaults.', 'info');
  }, [logActivity]);

  return (
    <PolarContext.Provider
      value={{
        isFirebaseActive,
        dbLoading,
        dbError,
        triggerDatabaseSeed,
        triggerDatabaseReset,
        retryFirestoreConnection,
        stations,
        selectedStation,
        setSelectedStation,
        dashboardMetrics,
        routes,
        addRoute,
        updateRoute,
        deleteRoute,
        updateRouteStatus,
        expeditions,
        addExpedition,
        updateExpedition,
        deleteExpedition,
        updateExpeditionStatus,
        personnel,
        addPersonnel,
        updatePersonnel,
        deletePersonnel,
        updatePersonnelStatus,
        cargo,
        addCargo,
        updateCargo,
        deleteCargo,
        updateCargoStatus,
        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        updateInventoryStock,
        assets,
        addAsset,
        updateAsset,
        deleteAsset,
        updateAssetStatus,
        emergencies,
        createEmergency,
        triggerEmergency,
        updateEmergency,
        deleteEmergency,
        resolveEmergency,
        changeEmergencyWorkflowStatus,
        assignEmergencyTeam,
        geofences,
        geofenceBreaches,
        addGeofence,
        updateGeofence,
        deleteGeofence,
        toggleGeofenceStatus,
        reports,
        notifications,
        addNotification,
        markNotificationRead,
        clearAllNotifications,
        deleteNotification,
        activityLogs,
        logActivity,
        polarTimeUTC,
        stationTimeMaitri,
        stationTimeBharati,
        isSOSModalOpen,
        setIsSOSModalOpen,
        resetDemoState
      }}
    >
      {children}
    </PolarContext.Provider>
  );
};
