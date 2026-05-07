/**
 * Role-Based Access Control (RBAC) Module
 * Defines roles and permissions for the system
 */

export const ROLES = {
  ADMIN: 'admin',
  OPERATIVE: 'operative',
  ANALYST: 'analyst',
};

export const PERMISSIONS = {
  // Scan permissions
  SCAN_UPLOAD: 'scan:upload',
  SCAN_VIEW: 'scan:view',
  SCAN_VIEW_ALL: 'scan:view:all',
  SCAN_EDIT: 'scan:edit',
  SCAN_DELETE: 'scan:delete',
  SCAN_EXPORT: 'scan:export',
  SCAN_ASSIGN: 'scan:assign',
  SCAN_ANNOTATE: 'scan:annotate',

  // User permissions
  USER_CREATE: 'user:create',
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_ACTIVITY_VIEW: 'user:activity',

  // Case permissions
  CASE_CREATE: 'case:create',
  CASE_VIEW: 'case:view',
  CASE_EDIT: 'case:edit',
  CASE_ASSIGN: 'case:assign',
  CASE_DELETE: 'case:delete',

  // Report permissions
  REPORT_GENERATE: 'report:generate',

  // Evidence permissions
  EVIDENCE_VIEW_ALL: 'evidence:view:all',
  EVIDENCE_MANAGE: 'evidence:manage',

  // Audit permissions
  AUDIT_VIEW: 'audit:view',

  // Session permissions
  SESSION_MANAGE: 'session:manage',

  // System permissions
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_EXPORT_ALL: 'system:export:all',
  VIEW_ANALYTICS: 'view:analytics',
};

/**
 * Role permissions mapping
 */
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Scan permissions
    PERMISSIONS.SCAN_UPLOAD,
    PERMISSIONS.SCAN_VIEW,
    PERMISSIONS.SCAN_VIEW_ALL,
    PERMISSIONS.SCAN_EDIT,
    PERMISSIONS.SCAN_DELETE,
    PERMISSIONS.SCAN_EXPORT,
    PERMISSIONS.SCAN_ASSIGN,
    PERMISSIONS.SCAN_ANNOTATE,
    // User permissions
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_ACTIVITY_VIEW,
    // Case permissions
    PERMISSIONS.CASE_CREATE,
    PERMISSIONS.CASE_VIEW,
    PERMISSIONS.CASE_EDIT,
    PERMISSIONS.CASE_ASSIGN,
    PERMISSIONS.CASE_DELETE,
    // Report permissions
    PERMISSIONS.REPORT_GENERATE,
    // Evidence permissions
    PERMISSIONS.EVIDENCE_VIEW_ALL,
    PERMISSIONS.EVIDENCE_MANAGE,
    // Audit permissions
    PERMISSIONS.AUDIT_VIEW,
    // Session permissions
    PERMISSIONS.SESSION_MANAGE,
    // System permissions
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_EXPORT_ALL,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  [ROLES.OPERATIVE]: [
    PERMISSIONS.SCAN_UPLOAD,
    PERMISSIONS.SCAN_VIEW,
    PERMISSIONS.SCAN_EXPORT,
  ],
  [ROLES.ANALYST]: [
    // Scan permissions
    PERMISSIONS.SCAN_VIEW,
    PERMISSIONS.SCAN_VIEW_ALL,
    PERMISSIONS.SCAN_EDIT,
    PERMISSIONS.SCAN_EXPORT,
    PERMISSIONS.SCAN_ASSIGN,
    PERMISSIONS.SCAN_ANNOTATE,
    // Case permissions
    PERMISSIONS.CASE_CREATE,
    PERMISSIONS.CASE_VIEW,
    PERMISSIONS.CASE_EDIT,
    PERMISSIONS.CASE_ASSIGN,
    // Report permissions
    PERMISSIONS.REPORT_GENERATE,
    // Evidence permissions
    PERMISSIONS.EVIDENCE_VIEW_ALL,
    // Audit permissions
    PERMISSIONS.AUDIT_VIEW,
    // Analytics
    PERMISSIONS.VIEW_ANALYTICS,
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if user has any of the required permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if role has at least one permission
 */
export const hasAnyPermission = (role, permissions) => {
  return permissions.some((permission) => hasPermission(role, permission));
};

/**
 * Check if user has all required permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if role has all permissions
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every((permission) => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} Array of permissions
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Middleware factory for permission checking
 * @param {string|string[]} requiredPermissions - Required permission(s)
 * @returns {Function} Express middleware
 */
export const requirePermission = (requiredPermissions) => {
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      return res.status(401).json({ error: 'Unauthorized: No role assigned' });
    }

    if (!hasAllPermissions(userRole, permissions)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        required: permissions,
        current: getRolePermissions(userRole),
      });
    }

    next();
  };
};

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  requirePermission,
};

