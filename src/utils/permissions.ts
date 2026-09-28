import { UserProfile, UserRole, AppModule, ActionType } from '../types/auth';

/**
 * Check if the user has one of the allowed roles.
 */
export const hasRole = (user: UserProfile | null, allowedRoles: UserRole[]): boolean => {
  if (!user) return false;
  return allowedRoles.includes(user.role);
};

/**
 * Reusable permission evaluation helper adhering to the POLAR-X Role-Based Access Control matrix
 */
export const hasPermission = (
  user: UserProfile | null,
  module: AppModule,
  action: ActionType
): boolean => {
  if (!user) return false;

  // ADMIN has full access across all modules and actions
  if (user.role === 'ADMIN') {
    return true;
  }

  // VIEWER is strictly read-only on permitted modules
  if (user.role === 'VIEWER') {
    if (action !== 'view') return false;
    return module === 'dashboard' || module === 'map' || module === 'expeditions' || module === 'reports';
  }

  // Role-specific and module-specific matrix
  switch (module) {
    case 'dashboard':
    case 'map':
      return action === 'view';

    case 'expeditions':
      if (user.role === 'EXPEDITION_MANAGER') return true;
      if (user.role === 'SCIENTIST') {
        return action === 'view' || action === 'create' || action === 'edit';
      }
      if (user.role === 'LOGISTICS_OFFICER') {
        return action === 'view';
      }
      return false;

    case 'routes':
    case 'conflicts':
      if (user.role === 'EXPEDITION_MANAGER') return true;
      return false;

    case 'personnel':
      if (user.role === 'EXPEDITION_MANAGER') return true;
      if (user.role === 'MEDICAL_OFFICER') return true;
      return false;

    case 'cargo':
      if (user.role === 'LOGISTICS_OFFICER') return true;
      return false;

    case 'inventory':
      if (user.role === 'LOGISTICS_OFFICER') return true;
      return false;

    case 'assets':
      if (user.role === 'LOGISTICS_OFFICER') return true;
      return false;

    case 'emergency':
      if (user.role === 'EXPEDITION_MANAGER' || user.role === 'MEDICAL_OFFICER') return true;
      return false;

    case 'field-safety':
      if (
        user.role === 'EXPEDITION_MANAGER' ||
        user.role === 'MEDICAL_OFFICER' ||
        user.role === 'SCIENTIST'
      ) {
        return true;
      }
      return false;

    case 'telemetry':
      if (user.role === 'SCIENTIST') return true;
      return false;

    case 'uav':
      if (user.role === 'SCIENTIST') return true;
      return false;

    case 'reconstruction':
      if (user.role === 'SCIENTIST') return true;
      return false;

    case 'convoy':
      return false;

    case 'offline-maps':
      return false;

    case 'reports':
      if (action === 'view') return true;
      if (
        user.role === 'EXPEDITION_MANAGER' ||
        user.role === 'SCIENTIST' ||
        user.role === 'LOGISTICS_OFFICER' ||
        user.role === 'MEDICAL_OFFICER'
      ) {
        return action === 'create';
      }
      return false;

    case 'settings':
    case 'users':
      return false;

    default:
      return false;
  }
};

export const canView = (user: UserProfile | null, module: AppModule): boolean => {
  return hasPermission(user, module, 'view');
};

export const canCreate = (user: UserProfile | null, module: AppModule): boolean => {
  return hasPermission(user, module, 'create');
};

export const canEdit = (user: UserProfile | null, module: AppModule): boolean => {
  return hasPermission(user, module, 'edit');
};

export const canDelete = (user: UserProfile | null, module: AppModule): boolean => {
  return hasPermission(user, module, 'delete');
};

export const canManage = (user: UserProfile | null, module: AppModule): boolean => {
  return hasPermission(user, module, 'manage');
};

export const canManageUsers = (user: UserProfile | null): boolean => {
  return hasPermission(user, 'users', 'manage');
};

export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return 'Polar Base Commander (ADMIN)';
    case 'EXPEDITION_MANAGER':
      return 'Expedition Operations Lead';
    case 'LOGISTICS_OFFICER':
      return 'Polar Logistics & Supply Officer';
    case 'SCIENTIST':
      return 'Chief Glaciologist / Scientist';
    case 'MEDICAL_OFFICER':
      return 'Station Medical Specialist';
    case 'VIEWER':
      return 'Scientific Observer / Viewer';
    default:
      return role;
  }
};

export const getRoleBadgeColor = (role: UserRole): { bg: string; text: string; border: string } => {
  switch (role) {
    case 'ADMIN':
      return { bg: 'bg-cyan-950', text: 'text-cyan-300', border: 'border-cyan-500/40' };
    case 'EXPEDITION_MANAGER':
      return { bg: 'bg-sky-950', text: 'text-sky-300', border: 'border-sky-500/40' };
    case 'LOGISTICS_OFFICER':
      return { bg: 'bg-amber-950', text: 'text-amber-300', border: 'border-amber-500/40' };
    case 'SCIENTIST':
      return { bg: 'bg-purple-950', text: 'text-purple-300', border: 'border-purple-500/40' };
    case 'MEDICAL_OFFICER':
      return { bg: 'bg-rose-950', text: 'text-rose-300', border: 'border-rose-500/40' };
    case 'VIEWER':
      return { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-700' };
    default:
      return { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-800' };
  }
};

