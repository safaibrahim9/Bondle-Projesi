// Simulated push notification system
export const sendNotification = (type, message) => {
    // In production, this would integrate with FCM or OneSignal
    console.log(`[NOTIFICATION - ${type}]:`, message);

    // Browser notification simulation (requires permission)
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Bondle', {
            body: message,
            icon: '/universe-icon.png',
        });
    }
};

export const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
};

export const notificationTypes = {
    EVENT_APPROVED: 'event_approved',
    MATCH_FOUND: 'match_found',
    CREDITS_EXHAUSTED: 'credits_exhausted',
    PAYMENT_APPROVED: 'payment_approved',
};
