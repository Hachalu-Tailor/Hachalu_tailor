// API Configuration
export const API_BASE_URL = 'http://127.0.0.1:8000/api';

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  ready_for_pickup: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  ready_for_pickup: 'bg-green-500',
  completed: 'bg-emerald-600',
  cancelled: 'bg-red-500',
  expired: 'bg-gray-500',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer',
};

export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  card: 'Card',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
};

// Material Types
export const MATERIAL_TYPES = {
  FABRIC: 'fabric',
  THREAD: 'thread',
  BUTTON: 'button',
  ZIPPER: 'zipper',
  LINING: 'lining',
  OTHER: 'other',
};

export const MATERIAL_TYPE_LABELS = {
  fabric: 'Fabric',
  thread: 'Thread',
  button: 'Button',
  zipper: 'Zipper',
  lining: 'Lining',
  other: 'Other',
};

// Measurement Types (for suits)
export const MEASUREMENT_TYPES = {
  CHEST: 'chest',
  WAIST: 'waist',
  HIPS: 'hips',
  SHOULDER: 'shoulder',
  SLEEVE_LENGTH: 'sleeve_length',
  JACKET_LENGTH: 'jacket_length',
  INSEAM: 'inseam',
  OUTSEAM: 'outseam',
  NECK: 'neck',
  BICEP: 'bicep',
  WRIST: 'wrist',
};

export const MEASUREMENT_LABELS = {
  chest: 'Chest',
  waist: 'Waist',
  hips: 'Hips',
  shoulder: 'Shoulder Width',
  sleeve_length: 'Sleeve Length',
  jacket_length: 'Jacket Length',
  inseam: 'Inseam',
  outseam: 'Outseam',
  neck: 'Neck',
  bicep: 'Bicep',
  wrist: 'Wrist',
};

// Suit Types
export const SUIT_TYPES = {
  TWO_PIECE: 'two_piece',
  THREE_PIECE: 'three_piece',
  TUXEDO: 'tuxedo',
  BLAZER: 'blazer',
  WAISTCOAT: 'waistcoat',
  TROUSERS: 'trousers',
  SHIRT: 'shirt',
};

export const SUIT_TYPE_LABELS = {
  two_piece: 'Two-Piece Suit',
  three_piece: 'Three-Piece Suit',
  tuxedo: 'Tuxedo',
  blazer: 'Blazer',
  waistcoat: 'Waistcoat',
  trousers: 'Trousers',
  shirt: 'Shirt',
};

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_COLORS = {
  low: 'bg-gray-400',
  normal: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-500',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  REMINDER: 'reminder',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ROLE: 'user_role',
  USER_ID: 'user_id',
  USER_NAME: 'user_name',
  USER_EMAIL: 'user_email',
  CART: 'cart',
  THEME: 'theme',
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  INPUT: 'YYYY-MM-DD',
  TIME: 'HH:mm',
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// Currency
export const CURRENCY = {
  SYMBOL: 'ETB',
  CODE: 'ETB',
  NAME: 'Ethiopian Birr',
};

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^(\+251|0)?[0-9]{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'You have been logged out.',
  ORDER_CREATED: 'Order created successfully!',
  ORDER_UPDATED: 'Order updated successfully!',
  PAYMENT_SUCCESS: 'Payment processed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ITEMS: '/items',
  SERVICES: '/services',
  ABOUT: '/about',
  MY_ORDERS: '/my-orders',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_STAFF: '/admin/staff',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_RECEPTION: '/admin/admin-reception',
  RECEPTION_DASHBOARD: '/reception',
  RECEPTION_INVENTORY: '/reception/inventory',
  RECEPTION_ORDERS: '/reception/orders',
  RECEPTION_CLIENTS: '/reception/clients',
  RECEPTION_ANNOUNCEMENT: '/reception/announcement',
};

export default {
  API_BASE_URL,
  ROLES,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  MATERIAL_TYPES,
  MATERIAL_TYPE_LABELS,
  MEASUREMENT_TYPES,
  MEASUREMENT_LABELS,
  SUIT_TYPES,
  SUIT_TYPE_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  NOTIFICATION_TYPES,
  STORAGE_KEYS,
  DATE_FORMATS,
  PAGINATION,
  CURRENCY,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
};
