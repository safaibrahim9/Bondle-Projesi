import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Clock, Users, ChevronRight, Calendar, Check, X, AlertCircle, MapPin, Tag, CreditCard, FileText } from 'lucide-react';

const AdminEventApprovalsSummaryPage = () => {
    const navigate = useNavigate();
    const [eventsWithPending, setEventsWithPending] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch pending registrations (moderation)
            let allPending = [];
            try {
                const pendingResult = await api.getPendingRegistrations();
                allPending = Array.isArray(pendingResult) ? pendingResult : [];
                console.log('[EventApprovals] Pending registrations:', allPending.length, allPending);
            } catch (regErr) {
                console.error('[EventApprovals] Error fetching pending registrations:', regErr);
            }

            const eventGroups = allPending.reduce((acc, reg) => {
                if (!reg || !reg.event) return acc;
                const eventId = reg.event.id;
                if (!acc[eventId]) {
                    acc[eventId] = {
                        ...reg.event,
                        pendingCount: 0
                    };
                }
                acc[eventId].pendingCount += 1;
                return acc;
            }, {});
            setEventsWithPending(Object.values(eventGroups));

            // 2. Fetch pending events (status = PENDING)
            let pendingEventsResult = [];
            try {
                const eventsResult = await api.getAdminEvents();
                pendingEventsResult = Array.isArray(eventsResult) ? eventsResult : [];
                console.log('[EventApprovals] Pending events (awaiting approval):', pendingEventsResult.length, pendingEventsResult);
            } catch (evtErr) {
                console.error('[EventApprovals] Error fetching pending events:', evtErr);
            }
            setPendingEvents(pendingEventsResult);

        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveEvent = async (id) => {
        setActionLoading(id);
        try {
            await api.approveEvent(id);
            await fetchData();
        } catch (err) {
            alert('Hata: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectEvent = async (id) => {
        if (!window.confirm('Bu etkinliği reddetmek istediğinize emin misiniz?')) return;
        setActionLoading(id);
        try {
            await api.rejectEvent(id);
            await fetchData();
        } catch (err) {
            alert('Hata: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="page">
            <div className="container">
                <button
                    onClick={() => navigate('/admin')}
                    className="btn btn-ghost"
                    style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ArrowLeft size={20} />
                    Panele Dön
                </button>

                <div className="page-header">
                    <h1>Etkinlik Onayları</h1>
                    <p className="text-secondary">Onay bekleyen etkinlikler ve katılımcı başvuruları</p>
                </div>

                {loading ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>
                ) : (
                    <>
                        {/* Section 1: Pending New Events */}
                        <section style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <AlertCircle size={22} color="#f59e0b" />
                                <h2 style={{ margin: 0 }}>Onay Bekleyen Yeni Etkinlikler ({pendingEvents.length})</h2>
                            </div>
                            <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                Kulüp yöneticileri tarafından oluşturulan ve admin onayı bekleyen etkinlikler burada görünür. Admin tarafından oluşturulan etkinlikler otomatik onaylanır.
                            </p>
                            
                            {pendingEvents.length === 0 ? (
                                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    Onay bekleyen yeni etkinlik yok.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {pendingEvents.map(event => (
                                        <div key={event.id} className=" admin-list-item" style={{ padding: '24px', borderLeft: '4px solid #f59e0b' }}>
                                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                                {/* Left: Image */}
                                                <div style={{ width: '120px', height: '160px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                                                    <img 
                                                        src={event.posterImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'} 
                                                        alt="" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>

                                                {/* Middle: Details */}
                                                <div style={{ flex: 1, minWidth: '300px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                        <div>
                                                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{event.title}</h3>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent-primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                                                                {event.club?.name || 'Kulüpsüz Etkinlik'}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button 
                                                                onClick={() => handleRejectEvent(event.id)}
                                                                className="btn btn-outline btn-sm"
                                                                disabled={actionLoading === event.id}
                                                                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                                            >
                                                                <X size={16} /> Reddet
                                                            </button>
                                                            <button 
                                                                onClick={() => handleApproveEvent(event.id)}
                                                                className="btn btn-primary btn-sm"
                                                                disabled={actionLoading === event.id}
                                                            >
                                                                <Check size={16} /> Onayla
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 16px 0', color: 'var(--color-text-secondary)' }}>
                                                        {event.description}
                                                    </p>

                                                    <div style={{ 
                                                        display: 'grid', 
                                                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                                                        gap: '12px',
                                                        padding: '12px',
                                                        background: 'var(--color-subtle-bg)',
                                                        borderRadius: '12px'
                                                    }}>
                                                        <DetailItem icon={<Calendar size={14} />} label="Tarih" value={new Date(event.date).toLocaleDateString('tr-TR')} />
                                                        <DetailItem icon={<MapPin size={14} />} label="Konum" value={event.isOnline ? 'Online' : (event.location || event.city)} />
                                                        <DetailItem icon={<Users size={14} />} label="Kontenjan" value={`${event.participantLimit || '∞'} Kişi`} />
                                                        <DetailItem icon={<Tag size={14} />} label="Tür" value={event.eventType === 'paid' ? 'Ücretli' : 'Ücretsiz'} />
                                                        {event.eventType === 'paid' && (
                                                            <DetailItem icon={<CreditCard size={14} />} label="Ücret" value={`${event.price} TL`} />
                                                        )}
                                                        <DetailItem icon={<FileText size={14} />} label="Form" value={event.requiresForm ? 'Gerekli' : 'Gerekli Değil'} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Section 2: Pending Applications */}
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <Users size={22} color="#3b82f6" />
                                <h2 style={{ margin: 0 }}>Katılımcı Başvuruları ({eventsWithPending.length} Etkinlik)</h2>
                            </div>
                            <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                "Başvuru Formu Gerektirir" seçeneği aktif olan etkinliklere gelen katılımcı başvuruları burada görünür.
                            </p>

                            {eventsWithPending.length === 0 ? (
                                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    Bekleyen katılımcı başvurusu yok.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                    {eventsWithPending.map(event => (
                                        <div 
                                            key={event.id} 
                                            className="card" 
                                            onClick={() => navigate(`/admin/events/${event.id}/applications`)}
                                            style={{
                                                padding: 'var(--spacing-lg)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'transform 0.2s ease',
                                                borderLeft: '4px solid #3b82f6'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                        >
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden' }}>
                                                    <img 
                                                        src={event.posterImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'} 
                                                        alt="" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '18px' }}>{event.title}</h3>
                                                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }} className="text-secondary">
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                                            <Calendar size={14} /> {new Date(event.date).toLocaleDateString('tr-TR')}
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                                            <Users size={14} /> {event.currentParticipants}/{event.participantLimit} Katılımcı
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{
                                                    background: '#3b82f6',
                                                    color: 'var(--color-text-on-accent)',
                                                    padding: '6px 14px',
                                                    borderRadius: '20px',
                                                    fontSize: '14px',
                                                    fontWeight: '700',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <Clock size={16} /> {event.pendingCount} Başvuru
                                                </div>
                                                <ChevronRight size={24} className="text-secondary" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ color: 'var(--color-accent-primary)', display: 'flex' }}>{icon}</div>
        <div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>{label}</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{value}</div>
        </div>
    </div>
);

export default AdminEventApprovalsSummaryPage;
