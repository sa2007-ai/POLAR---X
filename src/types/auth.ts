export type UserRole =
  | 'ADMIN'
  | 'EXPEDITION_MANAGER'
  | 'LOGISTICS_OFFICER'
  | 'SCIENTIST'
  | 'MEDICAL_OFFICER'
  | 'VIEWER';

export type RoleApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProfileLoadStatus = 'IDLE' | 'LOADING' | 'READY' | 'ERROR' | 'MISSING';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  name?: string;
  role: UserRole;
  requestedRole?: UserRole;
  approvalStatus?: RoleApprovalStatus;
  status?: 'ACTIVE' | 'SUSPENDED';
  station?: string;
  badgeId?: string;
  department?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  photoURL?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
}

export type AppModule =
  | 'dashboard'
  | 'map'
  | 'expeditions'
  | 'personnel'
  | 'cargo'
  | 'inventory'
  | 'assets'
  | 'emergency'
  | 'reports'
  | 'settings'
  | 'routes'
  | 'conflicts'
  | 'telemetry'
  | 'convoy'
  | 'uav'
  | 'reconstruction'
  | 'offline-maps'
  | 'field-safety'
  | 'users';

export type ActionType = 'view' | 'create' | 'edit' | 'delete' | 'manage';

export interface AuthContextType {
  currentUser: any;
  userProfile: UserProfile | null;
  role: UserRole;
  profileStatus: ProfileLoadStatus;
  isDemoMode: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole,
    badgeId?: string,
    station?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  updateCurrentUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

