import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Utility to convert Base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const usePushNotifications = () => {
    const { user } = useAuth();
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if push notifications are supported
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, [user]);

    const checkSubscription = async () => {
        if (!user) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (err) {
            console.error('Error checking push subscription:', err);
        }
    };

    const subscribeToPush = async () => {
        if (!isSupported || !user) return { success: false, message: 'Desteklenmiyor veya kullanıcı girişi yok.' };
        
        setLoading(true);
        try {
            // Ask for permission
            const currentPermission = await Notification.requestPermission();
            setPermission(currentPermission);

            if (currentPermission === 'denied') {
                throw new Error('Tarayıcı ayarlarından bildirim izni reddedilmiş. Lütfen site ayarlarına gidip bildirimlere izin verin.');
            }
            if (currentPermission !== 'granted') {
                throw new Error('Bildirim izni verilmedi.');
            }

            // Register service worker if not already registered
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // Get VAPID public key from backend (fallback to env if backend endpoint not used)
            let applicationServerKey;
            try {
                const response = await api.get('/push/vapid-public-key');
                if (!response || !response.publicKey) {
                    throw new Error("API yanıtında public key bulunamadı.");
                }
                applicationServerKey = urlBase64ToUint8Array(response.publicKey);
            } catch (err) {
                // Fallback to env var if API fails
                const fallbackKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
                if (!fallbackKey) {
                    throw new Error("Sunucu bağlantısı kurulamadı (VAPID Key eksik).");
                }
                applicationServerKey = urlBase64ToUint8Array(fallbackKey);
            }

            // Subscribe via PushManager
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            // Send subscription to backend
            await api.post('/push/subscribe', subscription.toJSON());
            
            setIsSubscribed(true);
            setLoading(false);
            return { success: true, message: 'Bildirimler başarıyla açıldı.' };
        } catch (err) {
            console.error('Failed to subscribe to push notifications', err);
            setLoading(false);
            return { success: false, message: err.message || 'Bildirimler açılırken bir hata oluştu.' };
        }
    };

    const unsubscribeFromPush = async () => {
        if (!isSupported || !user) return;
        
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                await api.delete('/push/unsubscribe', { data: { endpoint: subscription.endpoint } });
                await subscription.unsubscribe();
                setIsSubscribed(false);
            }
        } catch (err) {
            console.error('Failed to unsubscribe', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        isSupported,
        permission,
        isSubscribed,
        loading,
        subscribeToPush,
        unsubscribeFromPush
    };
};
