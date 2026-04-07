// Role enum - must match backend exactly
export enum Role {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  BUSINESS_ADMIN = 'BUSINESS_ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  TEAM_MEMBER = 'TEAM_MEMBER',
}

// Role groups for easier management
export const AdminRoles = [Role.PLATFORM_ADMIN];
export const BusinessRoles = [
  Role.BUSINESS_OWNER,
  Role.BUSINESS_ADMIN,
  Role.ACCOUNTANT,
  Role.TEAM_MEMBER,
];
export const AllRoles = [...AdminRoles, ...BusinessRoles];

// Navigation item interface
export interface NavItem {
  name: string;
  path?: string;
  icon?: string; // icon identifier
  roles: Role[];
  subItems?: NavSubItem[];
}

export interface NavSubItem {
  name: string;
  path: string;
  roles: Role[];
  new?: boolean;
  pro?: boolean;
  ai?: boolean;
}

// ============================================
// PLATFORM ADMIN ONLY MENU ITEMS
// ============================================
export const adminMenuItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/admin/dashboard',
    icon: 'GridIcon',
    roles: [Role.PLATFORM_ADMIN],
  },
  {
    name: 'Users Management',
    path: '/admin/users',
    icon: 'GroupIcon',
    roles: [Role.PLATFORM_ADMIN],
  },
  {
    name: 'Businesses',
    path: '/admin/businesses',
    icon: 'BoxIcon',
    roles: [Role.PLATFORM_ADMIN],
  },
  {
    name: 'Activity Logs',
    path: '/admin/activity',
    icon: 'CalenderIcon',
    roles: [Role.PLATFORM_ADMIN],
  },
  {
    name: 'Settings',
    path: '/admin/settings',
    icon: 'SettingsIcon',
    roles: [Role.PLATFORM_ADMIN],
  },
];

// ============================================
// BUSINESS USER MENU ITEMS
// ============================================
export const businessMenuItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'GridIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER],
  },
  {
    name: 'User Profile',
    path: '/profile',
    icon: 'UserCircleIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER],
  },
  // Team Management - Admin and Owner only
  {
    name: 'Team Management',
    path: '/team-invitations',
    icon: 'TeamIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN],
  },
  // Business Management - Admin and Owner only
  {
    name: 'Business Management',
    path: '/business-management',
    icon: 'BuildingIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN],
  },
  // Documents Group
  {
    name: 'Documents',
    icon: 'DocumentIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER],
    subItems: [
      {
        name: 'AI Scanner',
        path: '/ai-scanner',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER],
        new: true,
        pro: true,
        ai: true,
      },
      {
        name: 'Quotes',
        path: '/quotes',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
        new: true,
      },
      {
        name: 'Sales Orders',
        path: '/sales-orders',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
        new: true,
      },
      {
        name: 'Invoices',
        path: '/invoices',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
      },
    ],
  },
  // Clients
  {
    name: 'Clients',
    path: '/clients',
    icon: 'ClientIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER],
  },
  // Products
  {
    name: 'Products',
    path: '/products',
    icon: 'ProductIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER],
  },
  // Suppliers
  {
    name: 'Suppliers',
    path: '/suppliers',
    icon: 'SupplierIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER],
  },
  // Stock Group
  {
    name: 'Stock',
    icon: 'StockIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER],
    subItems: [
      {
        name: 'Stock Management',
        path: '/stock',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
        new: true,
      },
      {
        name: 'Stock Movement',
        path: '/stock-movements',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
        new: true,
      },
      {
        name: 'Purchase Orders',
        path: '/purchase-orders',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
        new: true,
      },
      {
        name: 'Stock Take',
        path: '/stock-take',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
        new: true,
      },
    ],
  },
  // Financial Group
  {
    name: 'Financial',
    icon: 'DollarIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
    subItems: [
      {
        name: 'Payments & Cash',
        path: '/payments',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
        new: true,
      },
      {
        name: 'Credit Notes',
        path: '/credit-notes',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
        new: true,
      },
      {
        name: 'Audit Logs',
        path: '/audit-logs',
        roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN],
        new: true,
      },
    ],
  },
  // Expenses
  {
    name: 'Expenses',
    path: '/expenses',
    icon: 'ExpenseIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
  },
  // Report Generator - Quick reports with CKEditor
  {
    name: 'Report Generator',
    path: '/report-generator',
    icon: 'ReportIcon',
    roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT],
  },
];

// ============================================
// ALL MENU ITEMS COMBINED
// ============================================
export const allMenuItems: NavItem[] = [...adminMenuItems, ...businessMenuItems];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Filter menu items based on user role
 * Also filters subItems based on role
 */
export function filterMenuByRole(menuItems: NavItem[], userRole: Role): NavItem[] {
  return menuItems
    .filter((item) => item.roles.includes(userRole))
    .map((item) => {
      // If item has subItems, filter those too
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter((sub) =>
          sub.roles.includes(userRole)
        );
        return {
          ...item,
          subItems: filteredSubItems.length > 0 ? filteredSubItems : undefined,
        };
      }
      return item;
    })
    .filter((item) => {
      // Remove items with empty subItems arrays
      if (item.subItems && item.subItems.length === 0) {
        return false;
      }
      return true;
    });
}

/**
 * Get allowed routes for a role (for route protection)
 */
export function getAllowedRoutes(role: Role): string[] {
  const allowedPaths: string[] = [];

  allMenuItems.forEach((item) => {
    if (item.roles.includes(role)) {
      if (item.path) allowedPaths.push(item.path);
      item.subItems?.forEach((sub) => {
        if (sub.roles.includes(role)) {
          allowedPaths.push(sub.path);
        }
      });
    }
  });

  return allowedPaths;
}

/**
 * Check if a role is an admin role
 */
export function isAdminRole(role: Role): boolean {
  return AdminRoles.includes(role);
}

/**
 * Check if a role is a business role
 */
export function isBusinessRole(role: Role): boolean {
  return BusinessRoles.includes(role);
}

/**
 * Get home route for role
 */
export function getHomeRouteForRole(role: Role): string {
  if (isAdminRole(role)) {
    return '/admin/dashboard';
  }
  return '/dashboard';
}
