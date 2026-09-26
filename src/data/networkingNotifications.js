// Networking notifications data storage
let notifications = [];
let nextId = 1;

// Notification types
export const NOTIFICATION_TYPES = {
    CONNECTION_REQUEST: 'connection_request',
    CONNECTION_ACCEPTED: 'connection_accepted',
    MEETING_REQUEST: 'meeting_request'
};

// Add a new notification
export const addNotification = (type, fromUser, metadata = {}) => {
    const notification = {
        id: nextId++,
        type,
        fromUserId: fromUser.id,
        fromUserName: fromUser.name,
        fromUserPhoto: fromUser.picture,
        timestamp: new Date().toISOString(),
        read: false,
        metadata
    };

    notifications.unshift(notification); // Add to beginning
    return notification;
};

// Get all notifications
export const getAllNotifications = () => {
    return [...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

// Get unread count
export const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
};

// Mark notification as read
export const markAsRead = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        return notification;
    }
    return null;
};

// Mark all as read
export const markAllAsRead = () => {
    notifications.forEach(n => n.read = true);
};

// Clear all notifications
export const clearAllNotifications = () => {
    notifications = [];
};

// Get notifications by type
export const getNotificationsByType = (type) => {
    return notifications.filter(n => n.type === type);
};

export default {
    addNotification,
    getAllNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    getNotificationsByType,
    NOTIFICATION_TYPES
};
