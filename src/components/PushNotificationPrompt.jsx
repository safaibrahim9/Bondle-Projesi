import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PushNotificationPrompt = () => {
    const { isSupported, permission, isSubscribed, loading, subscribeToPush } = usePushNotifications();
    const [showPrompt, setShowPrompt] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (!user || !isSupported) return;

        const hasAsked = localStorage.getItem('push_prompt_dismissed_v2');
        if (!hasAsked && permission !== 'denied' && !isSubscribed) {
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [isSupported, permission, isSubscribed, user]);

    const handleSubscribe = async () => {
        const result = await subscribeToPush();
        if (result && result.success) {
            setShowPrompt(false);
            localStorage.setItem('push_prompt_dismissed_v2', 'true');
        } else if (result && result.message) {
            alert(result.message);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('push_prompt_dismissed_v2', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-accent-primary)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '90%',
            maxWidth: '350px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '8px', borderRadius: '50%', color: 'var(--color-accent-primary)' }}>
                        <Bell size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Bildirimleri Aç 🚀</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                            Etkinlik hatırlatmalarını ve yeni mentor eşleşmelerini anında öğren!
                        </p>
                    </div>
                </div>
                <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px' }}>
                    <X size={16} />
                </button>
            </div>
            <button 
                className="btn btn-primary btn-sm" 
                onClick={handleSubscribe}
                disabled={loading}
                style={{ width: '100%' }}
            >
                {loading ? 'İzin İsteniyor...' : 'Bildirimlere İzin Ver'}
            </button>
        </div>
    );
};

export default PushNotificationPrompt;
