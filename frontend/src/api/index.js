// API Index - Export all API functions from a single entry point

export {
    // Auth
    login,
    logout,
    setTokens,
    clearTokens,
    getAccessToken,
    getRefreshToken,

    // Staff Management
    addStaff,
    listStaff,
    getStaffDetail,
    updateStaff,
    deleteStaff,
    resetPassword,
    updateProfile,
    changePassword,

    // Audit Logs
    getAuditLogs,
    getAuditLogDetail,

    // Notifications
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,

    // Inventory
    getMaterials,
    createMaterial,
    getMaterialDetail,
    updateMaterial,
    deleteMaterial,
    adjustStock,

    // Orders
    createOrder,
    getOrders,
    getOrderDetail,
    updateOrder,
    deleteOrder,
    processOrder,
    expireOrders,

    // Suit Types
    getSuitTypes,
    createSuitType,

    // Payments
    getPayments,
    createPayment,
    verifyPayment,

    // Utilities
    handleApiError,
    getErrorMessage,

    // Default axios instance
    default as api,
} from './api';
