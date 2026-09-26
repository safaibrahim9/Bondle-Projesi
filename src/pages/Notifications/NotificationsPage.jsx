import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getMyProfileViews } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { useNetworking } from '../../contexts/NetworkingContext';
import { Bell, CheckCheck, Trophy, XCircle, Clock, UserPlus, Users, Save, Eye } from 'lucide-react';
import Toast from '../../components/Toast';

const NotificationsPage = () => {
    const { isPremium } = useAuth();
    const { refreshNetworkingData, loadIncomingMeetings, loadOutgoingMeetings } = useNetworking();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [rescheduleData, setRescheduleData] = useState(null); // { notificationId, meetingId, date, note }
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [toastConfig, setToastConfig] = useState({ isOpen: false, message: '', type: 'success' });
    const [processedMeetings, setProcessedMeetings] = useState(() => {
        const saved = localStorage.getItem('universe_processed_meetings');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    const markAsProcessed = (meetingId) => {
        setProcessedMeetings(prev => {
            const next = new Set(prev);
            next.add(meetingId);
            localStorage.setItem('universe_processed_meetings', JSON.stringify([...next]));
            return next;
        });
    };

    useEffect(() => {
        document.title = 'Bondle | Bildirimler';
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const [notifsData, viewsData] = await Promise.all([
                api.getNotifications().catch(() => []),
                getMyProfileViews().catch(() => [])
            ]);
            
            const viewsNotifications = (viewsData || []).map(pv => ({
                id: `pv_${pv.id}`,
                type: 'profile_view',
                title: 'Profilin Dikkat Çekiyor 👀',
                message: isPremium() 
                    ? `${pv.viewer?.name || 'Biri'} profilinize göz attı.` 
                    : "Seninle aynı ilgi alanlarına sahip biri profiline baktı. Kim olduğunu görmek için Premium'a geç.",
                createdAt: pv.createdAt,
                isRead: true,
                viewer: pv.viewer
            }));

            const combined = [...(notifsData || []), ...viewsNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setNotifications(combined);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const getIcon = (type, viewer) => {
        if (type === 'profile_view') {
            if (viewer?.profilePicture) {
                return <img src={viewer.profilePicture} alt="viewer" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', filter: isPremium() ? 'none' : 'blur(8px)' }} />;
            }
            return <Eye size={22} color="var(--color-accent-primary)" style={{ filter: isPremium() ? 'none' : 'blur(2px)' }} />;
        }
        switch (type) {
            case 'competition_approved':
                return <Trophy size={22} color="#10b981" />;
            case 'competition_rejected':
                return <XCircle size={22} color="#ef4444" />;
            case 'connection_request':
                return <UserPlus size={22} color="var(--color-accent-primary)" />;
            case 'connection_accepted':
                return <Users size={22} color="#10b981" />;
            default:
                return <Bell size={22} color="var(--color-accent-primary)" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="page">
            <div className="container">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div>
                        <h1 style={{ margin: 0, marginBottom: '4px' }}>Bildirimler</h1>
                        <p className="text-secondary" style={{ margin: 0 }}>
                            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
                        </p>
                    </div>
                    {(!loading && unreadCount > 0) && (
                        <button
                            onClick={handleMarkAllRead}
                            className="btn btn-ghost"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
                        >
                            <CheckCheck size={18} />
                            Hepsini Okundu İşaretle
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                        Yükleniyor...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                        <Bell size={48} color="var(--color-text-secondary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Bildirim Yok</h3>
                        <p className="text-secondary">Henüz bildiriminiz bulunmuyor.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className="card"
                                onClick={() => {
                                    if (notification.type === 'profile_view') {
                                        if (isPremium()) {
                                            if (notification.viewer?.id) navigate(`/profile/${notification.viewer.id}`);
                                        } else {
                                            navigate('/premium');
                                        }
                                        return;
                                    }
                                    if (!notification.isRead && notification.type !== 'meeting_request') {
                                        handleMarkRead(notification.id);
                                    }
                                    if (notification.type === 'connection_request' || notification.type === 'connection_accepted') {
                                        navigate('/network');
                                    }
                                    if (notification.type === 'EVENT_REGISTRATION') {
                                        navigate(`/admin/events/${notification.referenceId}/applications`);
                                    }
                                }}
                                style={{
                                    padding: 'var(--spacing-md) var(--spacing-lg)',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 'var(--spacing-md)',
                                    cursor: notification.isRead ? 'default' : 'pointer',
                                    borderLeft: notification.isRead ? '3px solid transparent' : '3px solid var(--color-accent-primary)',
                                    backgroundColor: notification.isRead ? 'transparent' : 'var(--color-bg-elevated)',
                                    opacity: processedMeetings.has(notification.referenceId) ? 0.85 : 1,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    overflow: 'hidden'
                                }}>
                                    {getIcon(notification.type, notification.viewer)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: notification.isRead ? '500' : '700', color: notification.isRead ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                                            {notification.title}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                            <Clock size={12} color="var(--color-text-secondary)" />
                                            <span className="text-secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                                                {formatTimeAgo(notification.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{
                                        margin: '6px 0 0 0',
                                        fontSize: '14px',
                                        color: 'var(--color-text-secondary)',
                                        lineHeight: '1.5',
                                    }}>
                                        {notification.message}
                                    </p>

                                    {/* Meeting Request Action Buttons */}
                                    {notification.type === 'meeting_request' && notification.referenceId && !processedMeetings.has(notification.referenceId) && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                            <button
                                                className="btn"
                                                style={{ padding: '6px 16px', fontSize: '13px', background: '#10b981', color: '#ffffff', border: 'none' }}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await api.acceptMeeting(notification.referenceId);
                                                        handleMarkRead(notification.id);
                                                        markAsProcessed(notification.referenceId);
                                                        // Sync NetworkingContext so NetworkingPage shows updated state
                                                        refreshNetworkingData();
                                                        setToastConfig({ isOpen: true, message: "Toplantı talebi kabul edildi!", type: "success" });
                                                    } catch (err) {
                                                        setToastConfig({ isOpen: true, message: "Onaylanırken hata oluştu.", type: "error" });
                                                    }
                                                }}
                                            >
                                                Kabul Et
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: '6px 16px', fontSize: '13px', background: '#f59e0b', color: '#ffffff', border: 'none' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRescheduleData({ notificationId: notification.id, meetingId: notification.referenceId, date: '', note: '' });
                                                }}
                                            >
                                                Yeniden Planla
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: '6px 16px', fontSize: '13px', background: '#ef4444', color: '#ffffff', border: 'none' }}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await api.rejectMeeting(notification.referenceId);
                                                        handleMarkRead(notification.id);
                                                        markAsProcessed(notification.referenceId);
                                                        // Sync NetworkingContext so NetworkingPage shows updated state
                                                        refreshNetworkingData();
                                                        setToastConfig({ isOpen: true, message: "Toplantı talebi reddedildi.", type: "success" });
                                                    } catch (err) {
                                                        setToastConfig({ isOpen: true, message: "Reddedilirken hata oluştu.", type: "error" });
                                                    }
                                                }}
                                            >
                                                Reddet
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {!notification.isRead && (
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--color-accent-primary)',
                                        flexShrink: 0,
                                        marginTop: '6px',
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reschedule Modal */}
            {rescheduleData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, padding: 'var(--spacing-md)'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', padding: 'var(--spacing-xl)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>Toplantıyı Yeniden Planla</h3>
                        
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Yeni Tarih ve Saat *</label>
                            <style>{`
                                .reschedule-date-input::-webkit-calendar-picker-indicator {
                                    cursor: pointer;
                                }
                            `}</style>
                            <input
                                type="datetime-local"
                                className="form-input reschedule-date-input"
                                value={rescheduleData.date}
                                onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                style={{ width: '100%', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', colorScheme: 'dark', color: 'var(--color-text-primary)' }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>İptal / Yeniden Planlama Notu</label>
                            <textarea
                                className="form-input"
                                placeholder="Örn: Bu saatte toplantım var, yarın aynı saat uygun mu?"
                                value={rescheduleData.note}
                                onChange={(e) => setRescheduleData({ ...rescheduleData, note: e.target.value })}
                                style={{ width: '100%', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', minHeight: '80px', resize: 'vertical', color: 'var(--color-text-primary)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-start' }}>
                            <button
                                className="btn"
                                disabled={!rescheduleData.date || isRescheduling}
                                style={{ 
                                    padding: '12px 24px', 
                                    borderRadius: '12px', 
                                    background: 'linear-gradient(to right, #8b5cf6, #06b6d4)', 
                                    color: '#ffffff', 
                                    border: 'none', 
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    boxShadow: '0 8px 20px -5px rgba(249, 115, 22, 0.4)',
                                    opacity: (!rescheduleData.date || isRescheduling) ? 0.6 : 1,
                                    cursor: (!rescheduleData.date || isRescheduling) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onClick={async () => {
                                    if (isRescheduling) return;
                                    setIsRescheduling(true);
                                    try {
                                        await api.rescheduleMeeting(rescheduleData.meetingId, {
                                            scheduledDate: rescheduleData.date,
                                            notes: rescheduleData.note
                                        });
                                        handleMarkRead(rescheduleData.notificationId);
                                        markAsProcessed(rescheduleData.meetingId);
                                        setRescheduleData(null);
                                        // Sync NetworkingContext so NetworkingPage shows updated state
                                        refreshNetworkingData();
                                        setToastConfig({ isOpen: true, message: "Yeniden planlama talebiniz başarıyla gönderildi!", type: "success" });
                                    } catch (err) {
                                        setToastConfig({ isOpen: true, message: "Hata: " + (err.message || 'İşlem gerçekleştirilemedi.'), type: "error" });
                                    } finally {
                                        setIsRescheduling(false);
                                    }
                                }}
                            >
                                <Save size={18} />
                                Teklif Gönder
                            </button>
                            <button
                                className="btn"
                                style={{ 
                                    padding: '12px 24px', 
                                    borderRadius: '12px', 
                                    background: 'transparent', 
                                    color: 'var(--color-text-secondary)', 
                                    border: '1px solid rgba(99, 102, 241, 0.3)', 
                                    fontWeight: 500,
                                    fontSize: '15px'
                                }}
                                onClick={() => setRescheduleData(null)}
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {toastConfig.isOpen && (
                <Toast
                    message={toastConfig.message}
                    type={toastConfig.type}
                    onClose={() => setToastConfig({ ...toastConfig, isOpen: false })}
                />
            )}
        </div>
    );
};

function formatTimeAgo(dateString) {
    if (!dateString) return '';
    
    // Ensure we parse as UTC if the DB returned a naive timestamp string
    let parsedString = dateString;
    if (typeof dateString === 'string' && !dateString.includes('Z') && !dateString.includes('+')) {
        parsedString += 'Z';
    }
    
    const now = new Date();
    const date = new Date(parsedString);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Az önce';
    if (diffMin < 60) return `${diffMin} dk önce`;
    if (diffHour < 24) return `${diffHour} saat önce`;
    if (diffDay < 7) return `${diffDay} gün önce`;
    return date.toLocaleDateString('tr-TR');
}

export default NotificationsPage;
