import { useApp } from '../context/AppContext';
import { getUserScope, hasModuleAccess } from '../services/accessPolicy';
import {
  canAccessAdmin,
  hasUserTag,
} from '../services/operationalWorkflow';

export const usePermissions = () => {
  const { user } = useApp();

  const hasPermission = (module) => {
    return hasModuleAccess(user, module);
  };

  const isAdmin = canAccessAdmin(user);

  return { hasPermission, hasUserTag: (tag) => hasUserTag(user, tag), isAdmin, role: user?.role, scope: getUserScope(user) };
};
