// Application Routes

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  ABOUT: '/about',
  SERVICES: '/services',
  ITEMS: '/items',
  ITEMS_SAMPLE: '/items-sample',
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    STAFF: '/admin/staff',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
    AUDIT_LOGS: '/admin/audit-logs',
    RECEPTION: '/admin/reception'
  },
  
  // Receptionist routes
  RECEPTION: {
    DASHBOARD: '/reception/dashboard',
    ORDERS: '/reception/orders',
    ORDER_DETAIL: '/reception/orders/:id',
    NEW_ORDER: '/reception/orders/new',
    CLIENTS: '/reception/clients',
    INVENTORY: '/reception/inventory',
    PAYMENTS: '/reception/payments',
    ANNOUNCEMENTS: '/reception/announcements'
  },
  
  // Tailor routes
  TAILOR: {
    DASHBOARD: '/tailor/dashboard',
    TASKS: '/tailor/tasks',
    TASK_DETAIL: '/tailor/tasks/:id',
    COMPLETED: '/tailor/completed'
  },
  
  // Customer routes
  CUSTOMER: {
    DASHBOARD: '/customer/dashboard',
    ORDERS: '/customer/orders',
    MEASUREMENTS: '/customer/measurements',
    PROFILE: '/customer/profile'
  }
};

// Route patterns for programmatic use
export const ROUTE_PATTERNS = {
  ORDER_DETAIL: (id) => `/reception/orders/${id}`,
  TASK_DETAIL: (id) => `/tailor/tasks/${id}`,
  USER_DETAIL: (id) => `/admin/users/${id}`,
  CLIENT_DETAIL: (id) => `/reception/clients/${id}`
};

// Navigation items for sidebar
export const NAV_ITEMS = {
  ADMIN: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'HiOutlineHome' },
    { path: '/admin/users', label: 'User Management', icon: 'HiOutlineUsers' },
    { path: '/admin/staff', label: 'Staff Management', icon: 'HiOutlineUserGroup' },
    { path: '/admin/analytics', label: 'Analytics', icon: 'HiOutlineChartBar' },
    { path: '/admin/reception', label: 'Reception', icon: 'HiOutlineBuildingOffice2' },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: 'HiOutlineClipboardDocumentList' }
  ],
  RECEPTIONIST: [
    { path: '/reception/dashboard', label: 'Dashboard', icon: 'HiOutlineHome' },
    { path: '/reception/orders', label: 'Orders', icon: 'HiOutlineShoppingBag' },
    { path: '/reception/clients', label: 'Clients', icon: 'HiOutlineUserGroup' },
    { path: '/reception/inventory', label: 'Inventory', icon: 'HiOutlineCube' },
    { path: '/reception/payments', label: 'Payments', icon: 'HiOutlineCurrencyDollar' }
  ],
  TAILOR: [
    { path: '/tailor/dashboard', label: 'Dashboard', icon: 'HiOutlineHome' },
    { path: '/tailor/tasks', label: 'My Tasks', icon: 'HiOutlineClipboardDocumentList' },
    { path: '/tailor/completed', label: 'Completed', icon: 'HiOutlineCheckCircle' }
  ]
};

export default ROUTES;