import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';
import { useNetworking } from '../../contexts/NetworkingContext';
import { Calendar, Video, Clock, MapPin, ChevronLeft, CalendarDays, ExternalLink, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';

const UpcomingActivitiesPage = () => {
    const { user } = useAuth();
    const { registeredEvents } = useEvents();
    const { getUpcomingMeetings, connections, matchHistory } = useNetworking();
    const navigate = useNavigate();
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [toastConfig, setToastConfig] = useState({ isOpen: false, message: '', type: 'success' });

    useEffect(() => {
        document.title = 'Bondle | Activities';
        const loadData = async () => {
            try {
                const meetings = await getUpcomingMeetings();
                setUpcomingMeetings(meetings);
            } catch (err) {
                console.error('Error loading meetings:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadData();
        }
    }, [user, getUpcomingMeetings]);

    const handleCancelMeeting = (meetingId) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Toplantıyı İptal Et',
            message: 'Bu toplantıyı iptal etmek istediğinize emin misiniz?',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.cancelMeeting(meetingId);
                    const updatedMeetings = await getUpcomingMeetings();
                    setUpcomingMeetings(updatedMeetings);
                    setToastConfig({ isOpen: true, message: 'Toplantı başarıyla iptal edildi.', type: 'success' });
                } catch (err) {
                    console.error('Error cancelling meeting:', err);
                    setToastConfig({ isOpen: true, message: 'Toplantı iptal edilirken bir hata oluştu.', type: 'error' });
                }
            }
        });
    };

    const handleCancelEvent = (eventId) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Etkinliği İptal Et',
            message: 'Bu etkinliğin kaydını iptal etmek istediğinize emin misiniz?',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.unregisterFromEvent(eventId);
                    setToastConfig({ isOpen: true, message: 'Etkinlik kaydı silindi.', type: 'success' });
                    setTimeout(() => window.location.reload(), 1500);
                } catch (err) {
                    console.error('Error cancelling event:', err);
                    setToastConfig({ isOpen: true, message: 'Etkinlik kaydı silinirken bir hata oluştu.', type: 'error' });
                }
            }
        });
    };

    const now = new Date();
    
    // Combine events and meetings
    const allItems = [
        ...registeredEvents
            .filter(event => (event.registrationStatus || event.status) === 'APPROVED')
            .map(event => ({
                type: 'event',
                id: event.id,
                title: event.title,
                date: event.date,
                location: event.location,
                isOnline: event.isOnline,
                zoomLink: event.zoomLink,
                description: event.description
            })),
        ...upcomingMeetings.map(meeting => {
            let connectionName = meeting.connectionName || meeting.otherUserName;

            // Çoklu katılımcı desteği
            if (!connectionName && meeting.participants && meeting.participants.length > 0) {
                const otherParticipants = meeting.participants.filter(p => String(p.id) !== String(user?.id));
                if (otherParticipants.length > 1) {
                    connectionName = `${otherParticipants[0].name} ve ${otherParticipants.length - 1} kişi daha`;
                } else if (otherParticipants.length === 1) {
                    connectionName = `${otherParticipants[0].name} ${otherParticipants[0].surname || ''}`.trim();
                }
            }

            // Find the connection details to get the name
            const cIdStr = String(meeting.connectionId);

            // Try in connections array
            if (!connectionName) {
                const conn = connections?.find(c => String(c.id) === cIdStr);
                if (conn) {
                    // Check if current user is user1 or user2
                    if (String(conn.user1?.id) === String(user?.id)) {
                        connectionName = `${conn.user2?.name || ''} ${conn.user2?.surname || ''}`.trim();
                    } else if (conn.user1) {
                        connectionName = `${conn.user1?.name || ''} ${conn.user1?.surname || ''}`.trim();
                    }
                }
            }

            return {
                type: 'meeting',
                id: meeting.id,
                title: meeting.title || `${connectionName || 'Bağlantı'} ile toplantı`,
                meetingType: meeting.meetingType || 'networking',
                date: meeting.scheduledDate,
                location: meeting.location,
                isOnline: meeting.isOnline,
                zoomLink: meeting.zoomLink,
                notes: meeting.notes
            };
        }),
    ];

    const upcomingItems = allItems
        .filter(item => {
            const itemDate = new Date(item.date);
            const MathToleranceMs = item.type === 'meeting' ? 2 * 60 * 60 * 1000 : 0;
            return (itemDate.getTime() + MathToleranceMs) > now.getTime();
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="page" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                    <ChevronLeft size={28} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Aktivitelerim</h1>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--color-text-secondary)' }}>Yükleniyor...</div>
            ) : upcomingItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px', background: 'var(--color-bg-secondary)', borderRadius: '24px', border: '1px dashed var(--color-border)' }}>
                    <CalendarDays size={64} color="var(--color-text-tertiary)" style={{ marginBottom: '20px' }} />
                    <h3 style={{ margin: '0 0 10px 0' }}>Yaklaşan Aktivite Yok</h3>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Yeni etkinliklere katılabilir veya networking yapabilirsin.</p>
                    <button 
                        onClick={() => navigate('/events')}
                        style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '12px', background: 'var(--color-primary)', color: 'var(--color-text-on-accent)', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Etkinlikleri Keşfet
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {upcomingItems.map((item) => (
                        <div
                                    key={`${item.type}-${item.id}`}
                                    className="event-item"
                                    onClick={() => item.type === 'event' ? navigate(`/events/${item.id}`) : null}
                                    style={{
                                        cursor: item.type === 'event' ? 'pointer' : 'default',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: 'var(--spacing-md)',
                                        border: '1px solid var(--color-bg-tertiary)',
                                        display: 'flex',
                                        gap: 'var(--spacing-md)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (item.type === 'event') {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {/* Date Badge */}
                                    <div style={{ 
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                                        minWidth: '70px', height: '70px', background: item.type === 'event' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid ' + (item.type === 'event' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                                        borderRadius: '16px', flexShrink: 0
                                    }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: item.type === 'event' ? '#3b82f6' : '#ef4444', textTransform: 'uppercase' }}>
                                            {format(new Date(item.date), 'MMM', { locale: tr })}
                                        </span>
                                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                                            {format(new Date(item.date), 'dd')}
                                        </span>
                                    </div>
                                    <div className="event-details" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                                            <h3 style={{
                                                fontSize: 'var(--font-size-md)',
                                                fontWeight: '600',
                                                color: 'var(--color-text-primary)',
                                                margin: 0
                                            }}>
                                                {item.title}
                                            </h3>
                                            {item.type === 'meeting' && (
                                                <span style={{ 
                                                    padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, 
                                                    background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' 
                                                }}>
                                                    {{ mentorship: 'Mentorluk Görüşmesi', event: 'Özel Etkinlik', meeting: 'Toplantı', seminar: 'Seminer', networking: 'Networking' }[item.meetingType] || 'Network Toplantısı'}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                            fontSize: 'var(--font-size-sm)',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            {!item.isOnline && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                    <MapPin size={14} />
                                                    {item.location}
                                                </span>
                                            )}
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                                                <Clock size={15} />
                                                {format(new Date(item.date), 'HH:mm')}
                                            </span>
                                            {item.isOnline && (
                                                <span style={{
                                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                    background: 'rgba(34, 197, 94, 0.1)',
                                                    color: '#22c55e',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: 'var(--font-size-xs)',
                                                    fontWeight: '600'
                                                }}>
                                                    Online
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                                            {item.type === 'meeting' && (
                                                (!item.zoomLink || item.zoomLink === 'BONDLE_MEET') ? (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/meeting/${item.id}`);
                                                        }}
                                                    >
                                                        <Video size={16} />
                                                        Toplantıya Katıl
                                                    </button>
                                                ) : (
                                                    <a
                                                        href={item.zoomLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-primary btn-sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                                                    >
                                                        <Video size={16} />
                                                        Toplantıya Katıl
                                                    </a>
                                                )
                                            )}
                                            {item.type === 'meeting' && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-error)' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancelMeeting(item.id);
                                                    }}
                                                >
                                                    İptal Et
                                                </button>
                                            )}
                                            {item.type === 'event' && item.isOnline && item.zoomLink && (
                                                item.zoomLink === 'BONDLE_MEET' ? (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/meeting/event-${item.id}`);
                                                        }}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                                                    >
                                                        <Video size={16} />
                                                        Etkinliğe Katıl
                                                    </button>
                                                ) : (
                                                    <a
                                                        href={item.zoomLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-primary btn-sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                                                    >
                                                        <Video size={16} />
                                                        Etkinliğe Katıl
                                                    </a>
                                                )
                                            )}
                                            {item.type === 'event' && (
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/events/${item.id}?tab=chat`);
                                                    }}
                                                >
                                                    💬 Sohbet
                                                </button>
                                            )}
                                            {item.type === 'event' && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-error)' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancelEvent(item.id);
                                                    }}
                                                >
                                                    İptal Et
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                    ))}
                </div>
            )}

            {confirmConfig.isOpen && (
                <ConfirmDialog
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.onConfirm}
                    onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                    confirmText="İptal Et"
                    cancelText="Vazgeç"
                    variant="danger"
                />
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

export default UpcomingActivitiesPage;




