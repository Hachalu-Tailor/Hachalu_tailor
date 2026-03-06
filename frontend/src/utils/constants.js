// Application Constants

// API Configuration
export const API_BASE_URL = '/api';

// Route Constants
export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  ITEMS: '/items',
  SERVICES: '/services',
  ABOUT: '/about',
  MY_ORDERS: '/my-orders',
  MEASUREMENTS: '/measurements',
  ADMIN: '/admin',
  RECEPTION: '/reception',
  GARMENT: '/garment',
  NOT_FOUND: '/not-found'
};

// Role Constants
export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPTIONIST: 'RECEPTIONIST',
  TAILOR: 'TAILOR',
  CUSTOMER: 'CUSTOMER',
  GARMENT: 'GARMENT'
};

// Currency Configuration
export const CURRENCY = {
  CODE: 'ETB',
  SYMBOL: 'Br',
  LOCALE: 'en-ET'
};

// Order Status Values (matching backend)
export const ORDER_STATUS = {
  INITIATED: 'INITIATED',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  IN_PROGRESS: 'IN_PROGRESS',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED'
};

// Order Status Labels for Display
export const ORDER_STATUS_LABELS = {
  initiated: 'Initiated',
  awaiting_payment: 'Awaiting Payment',
  pending_approval: 'Pending Approval',
  in_progress: 'In Progress',
  ready_for_pickup: 'Ready for Pickup',
  completed: 'Completed',
  expired: 'Expired',
  INITIATED: 'Initiated',
  AWAITING_PAYMENT: 'Awaiting Payment',
  PENDING_APPROVAL: 'Pending Approval',
  IN_PROGRESS: 'In Progress',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired'
};

// Order Status Colors (Tailwind classes)
export const ORDER_STATUS_COLORS = {
  INITIATED: 'bg-yellow-500/20 text-yellow-600',
  AWAITING_PAYMENT: 'bg-orange-500/20 text-orange-600',
  PENDING_APPROVAL: 'bg-yellow-500/20 text-yellow-600',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-600',
  READY_FOR_PICKUP: 'bg-green-500/20 text-green-600',
  COMPLETED: 'bg-emerald-500/20 text-emerald-600',
  EXPIRED: 'bg-gray-500/20 text-gray-600'
};

// Payment Status Values
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Payment Status Labels
export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded'
};

// Payment Status Colors
export const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-600',
  completed: 'bg-green-500/20 text-green-600',
  failed: 'bg-red-500/20 text-red-600',
  refunded: 'bg-purple-500/20 text-purple-600'
};

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

// Priority Labels
export const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
};

// Priority Colors
export const PRIORITY_COLORS = {
  LOW: 'bg-gray-500/20 text-gray-600',
  MEDIUM: 'bg-blue-500/20 text-blue-600',
  HIGH: 'bg-orange-500/20 text-orange-600',
  URGENT: 'bg-red-500/20 text-red-600'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  RECEPTIONIST: 'RECEPTIONIST',
  TAILOR: 'TAILOR',
  CUSTOMER: 'CUSTOMER'
};

// User Role Labels
export const USER_ROLE_LABELS = {
  ADMIN: 'Administrator',
  RECEPTIONIST: 'Receptionist',
  TAILOR: 'Tailor',
  CUSTOMER: 'Customer'
};

// Material Types
export const MATERIAL_TYPES = [
  'Cotton',
  'Silk',
  'Wool',
  'Linen',
  'Polyester',
  'Denim',
  'Velvet',
  'Leather',
  'Satin',
  'Chiffon'
];

// Color Categories for Material Selection
export const COLOR_CATEGORIES = {
  NEUTRALS: 'neutrals',
  BLUES: 'blues',
  REDS: 'reds',
  GREENS: 'greens',
  PURPLES: 'purples',
  PINKS: 'pinks',
  YELLOWS: 'yellows',
  ORANGES: 'oranges',
  BROWNS: 'browns',
  TEALS: 'teals'
};

// Color Category Labels
export const COLOR_CATEGORY_LABELS = {
  neutrals: 'Neutrals',
  blues: 'Blues',
  reds: 'Reds',
  greens: 'Greens',
  purples: 'Purples',
  pinks: 'Pinks',
  yellows: 'Yellows',
  oranges: 'Oranges',
  browns: 'Browns',
  teals: 'Teals'
};

// Common Texture Options
export const TEXTURE_OPTIONS = [
  'Soft',
  'Rough',
  'Smooth',
  'Textured',
  'Glossy',
  'Matte'
];

// Measurement Types for Tailoring
export const MEASUREMENT_TYPES = {
  UPPER_BODY: {
    chest: 'Chest',
    waist: 'Waist',
    shoulder: 'Shoulder Width',
    arm_length: 'Arm Length',
    arm_circumference: 'Arm Circumference',
    neck: 'Neck',
    back_width: 'Back Width',
    front_length: 'Front Length'
  },
  LOWER_BODY: {
    hip: 'Hip',
    inseam: 'Inseam',
    outseam: 'Outseam',
    thigh: 'Thigh',
    knee: 'Knee',
    calf: 'Calf',
    ankle: 'Ankle'
  },
  FULL_BODY: {
    total_height: 'Total Height',
    torso_length: 'Torso Length'
  }
};

// Garment Types
export const GARMENT_TYPES = [
  { id: 'shirt', name: 'Shirt', category: 'upper' },
  { id: 'blouse', name: 'Blouse', category: 'upper' },
  { id: 'jacket', name: 'Jacket', category: 'upper' },
  { id: 'coat', name: 'Coat', category: 'upper' },
  { id: 'dress', name: 'Dress', category: 'full' },
  { id: 'trousers', name: 'Trousers', category: 'lower' },
  { id: 'skirt', name: 'Skirt', category: 'lower' },
  { id: 'shorts', name: 'Shorts', category: 'lower' },
  { id: 'suit', name: 'Suit', category: 'full' },
  { id: 'traditional', name: 'Traditional Wear', category: 'full' }
];

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
};

// Date Format Options
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  INPUT: 'YYYY-MM-DD',
  TIME: 'HH:mm'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed'
};

// Toast Notification Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_LENGTH: 9,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100
};

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  SESSION_EXPIRED: 'Your session has expired. Please login again.'
};

export default {
  API_BASE_URL,
  CURRENCY,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  USER_ROLES,
  USER_ROLE_LABELS,
  MATERIAL_TYPES,
  COLOR_CATEGORIES,
  COLOR_CATEGORY_LABELS,
  TEXTURE_OPTIONS,
  MEASUREMENT_TYPES,
  GARMENT_TYPES,
  PAGINATION,
  DATE_FORMATS,
  STORAGE_KEYS,
  TOAST_TYPES,
  VALIDATION,
  ERROR_MESSAGES
};
