import React, { useState } from 'react';
import { Edit2, Trash2, Calendar, Bell, MapPin, Link as LinkIcon, CheckCircle, Megaphone, ExternalLink, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEvents } from '../../../contexts/EventContext';
import api from '../../../services/api';

import QRScannerModal from '../../../components/QRScannerModal';

const ClubActivitiesTab = ({ events, announcements, user, onRefresh, onDelete, onEdit, club, officials }) => {
    const navigate = useNavigate();
    const { fetchUserRegistrations } = useEvents();
    const isOfficial = user?.role === 'admin' || (club && (Number(club.presidentId) === Number(user?.id) || officials?.some(o => Number(o.userId) === Number(user?.id))));
    const [registering, setRegistering] = useState({});
    const [registered, setRegistered] = useState({});
    const [promoting, setPromoting] = useState({});
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [scannerOpenForEvent, setScannerOpenForEvent] = useState(null);

    const renderAnnouncementDescription = (desc) => {
        if (!desc) return null;

        // "Son başvuru: ..." formatı
        if (desc.toLowerCase().startsWith('son başvuru:')) {
            const dateStr = desc.replace(/son başvuru:/i, '').trim();
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#fbbf24' }}>
                    <Calendar size={12} />
                    <span style={{ fontWeight: '600' }}>Son başvuru: {dateStr}</span>
                </div>
            );
        }

        // "01 Mart 2026 14:00 - İstanbul"
        const parts = desc.split(' - ');
        if (parts.length === 2) {
            const dateTime = parts[0];
            const location = parts[1];
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#fbbf24' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} style={{ color: 'var(--color-accent-primary)' }} />
                        <span>{dateTime}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} style={{ color: 'var(--color-accent-primary)' }} />
                        <span>{location}</span>
                    </div>
                </div>
            );
        }

        return (
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '8px', lineHeight: '1.4', opacity: 0.8 }}>
                {desc}
            </p>
        );
    };

    const handleSeeParticipants = async (event) => {
        setSelectedEvent(event);
        setShowParticipantsModal(true);
        setLoadingParticipants(true);
        try {
            const data = await api.get(`/events/${event.id}/registrations`);
            setParticipants(data || []);
        } catch (err) {
            alert('Katılımcı listesi yüklenemedi: ' + err.message);
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleRegister = async (event) => {
        // Always redirect to event details to show the mandatory registration form
        navigate(`/events/${event.id}`);
        return;

        const eventId = event.id;
        setRegistering(prev => ({ ...prev, [eventId]: true }));
        try {
            await api.post(`/events/${eventId}/register`);
            setRegistered(prev => ({ ...prev, [eventId]: true }));
            
            // Refresh global registrations for Home page
            if (fetchUserRegistrations) await fetchUserRegistrations();
            
            // Immediate feedback and redirect
            const successToast = document.createElement('div');
            successToast.className = 'credit-toast';
            successToast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:var(--color-accent-gradient); color:white; padding:12px 24px; borderRadius:30px; fontWeight:700; zIndex:10000; boxShadow:0 4px 15px rgba(0,0,0,0.3); animation:slideDown 0.3s ease;';
            successToast.innerHTML = '✨ Kaydınız başarıyla oluşturuldu! Ana sayfaya yönlendiriliyorsunuz...';
            document.body.appendChild(successToast);
            
            setTimeout(() => {
                successToast.style.animation = 'slideUp 0.3s ease forwards';
                setTimeout(() => {
                    successToast.remove();
                    navigate('/'); // Redirect to home page as requested
                }, 300);
            }, 2000);

            if (onRefresh) onRefresh();
        } catch (err) {
            alert('Kayıt hatası: ' + (err.response?.data?.message || err.message));
        } finally {
            setRegistering(prev => ({ ...prev, [eventId]: false }));
        }
    };

    const handleToggleGlobal = async (type, id) => {
        setPromoting(prev => ({ ...prev, [id]: true }));
        try {
            const endpoint = type === 'event' ? `/events/${id}/toggle-global` : `/announcements/${id}/toggle-global`;
            await api.put(endpoint);
            if (onRefresh) onRefresh();
        } catch (err) {
            alert('İşlem başarısız: ' + err.message);
        } finally {
            setPromoting(prev => ({ ...prev, [id]: false }));
        }
    };

    const hasContent = (events && events.length > 0) || (announcements && announcements.length > 0);

    if (!hasContent) {
        return (
            <div className="empty-state text-center py-5">
                <p className="text-secondary">Henüz bir etkinlik veya duyuru paylaşılmamış.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-xl)' }}>

            {/* Announcements Section */}
            {announcements && announcements.length > 0 && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                        <Bell size={20} color="var(--color-accent-primary)" />
                        <h3 style={{ margin: 0 }}>Duyurular</h3>
                    </div>
                    <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                        {announcements.map((announcement) => (
                            <div 
                                key={announcement.id} 
                                className="card hover-scale" 
                                style={{ 
                                    display: 'flex', 
                                    overflow: 'hidden', 
                                    padding: 0, 
                                    border: '1px solid var(--color-subtle-border)', 
                                    background: 'var(--color-subtle-bg)',
                                    cursor: announcement.linkTo ? 'pointer' : 'default'
                                }}
                                onClick={() => {
                                    if (announcement.linkTo) {
                                        let url = announcement.linkTo;
                                        // Eğer link bir route ise (örn: /events/1) navigate kullan
                                        if (url.startsWith('/')) {
                                            navigate(url);
                                            return;
                                        }
                                        
                                        if (url.startsWith('www.')) {
                                            url = 'https://' + url;
                                        } else if (!url.startsWith('http')) {
                                            url = 'https://' + url;
                                        }
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                    }
                                }}
                            >
                                <div style={{ padding: 'var(--spacing-md)', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ marginBottom: '4px', fontSize: '1rem', fontWeight: '700' }}>{announcement.title}</h4>
                                            {renderAnnouncementDescription(announcement.description)}
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            {announcement.linkTo && (
                                                <a href={announcement.linkTo} target="_blank" rel="noopener noreferrer" className="btn btn-icon btn-sm" title="Linki Aç">
                                                    <ExternalLink size={14} />
                                                </a>
                                            )}
                                            {user?.role === 'admin' && (
                                                <button 
                                                    onClick={() => handleToggleGlobal('announcement', announcement.id)}
                                                    className={`btn btn-icon btn-sm ${announcement.isGlobal ? 'active' : ''}`}
                                                    style={{ 
                                                        color: announcement.isGlobal ? '#8b5cf6' : 'var(--color-text-secondary)',
                                                        background: announcement.isGlobal ? 'rgba(139, 92, 246, 0.1)' : 'var(--color-subtle-bg)',
                                                        border: '1px solid',
                                                        borderColor: announcement.isGlobal ? '#8b5cf6' : 'var(--color-subtle-border)'
                                                    }}
                                                    title={announcement.isGlobal ? "Anasayfadan Kaldır" : "Anasayfaya Ekle"}
                                                    disabled={promoting[announcement.id]}
                                                >
                                                    <Megaphone size={14} />
                                                </button>
                                            )}
                                            {isOfficial && (
                                                <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => onEdit?.('announcement', announcement)} className="btn btn-icon btn-sm" title="Düzenle" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => onDelete?.('announcement', announcement.id)} className="btn btn-icon btn-sm" title="Sil" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-secondary" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                        {new Date(announcement.createdAt || announcement.date).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Events Section */}
            {events && events.length > 0 && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                        <Calendar size={20} color="var(--color-accent-primary)" />
                        <h3 style={{ margin: 0 }}>Etkinlikler</h3>
                    </div>
                    <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                        {events.map((event) => (
                            <div 
                                key={event.id} 
                                className="card hover-scale" 
                                style={{ 
                                    padding: 0, 
                                    overflow: 'hidden', 
                                    border: '1px solid var(--color-subtle-border)', 
                                    background: 'var(--color-subtle-bg)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/events/${event.id}`)}
                            >
                                <div style={{ display: 'flex', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)' }}>
                                    {/* Event Image or Date Box */}
                                    <div style={{ 
                                        width: '80px', height: '80px', borderRadius: '12px', 
                                        background: 'var(--color-bg-tertiary)', display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-subtle-border)',
                                        overflow: 'hidden'
                                    }}>
                                        {event.posterImage ? (
                                            <img src={event.posterImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <>
                                                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-accent-primary)', lineHeight: 1 }}>
                                                    {new Date(event.date).getDate()}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', opacity: 0.6 }}>
                                                    {new Date(event.date).toLocaleDateString('tr-TR', { month: 'short' })}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <h4 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>{event.title}</h4>
                                                    {user && (event.creatorId === user.id || event.createdBy === user.id) && (
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                                                            color: '#fff',
                                                            borderRadius: '12px',
                                                            fontSize: '0.65rem',
                                                            fontWeight: '700',
                                                            boxShadow: '0 2px 8px rgba(244, 63, 94, 0.4)',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            👑 Senin Etkinliğin
                                                        </span>
                                                    )}
                                                </div>
                                                {event.creator && (
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--color-text-secondary)',
                                                        marginBottom: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}>
                                                        <div style={{
                                                            width: '16px', height: '16px', borderRadius: '50%',
                                                            background: 'var(--color-bg-tertiary)', overflow: 'hidden',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            {event.creator.profilePicture || event.creator.profilePhoto || event.creator.avatar ? (
                                                                <img src={event.creator.profilePicture || event.creator.profilePhoto || event.creator.avatar} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                            ) : (
                                                                <span style={{fontSize: '0.5rem', fontWeight: 'bold'}}>{(event.creator.name?.[0] || 'A').toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        Oluşturan: {event.creator.name} {event.creator.surname}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {user?.role === 'admin' && (
                                                    <button 
                                                        onClick={() => handleToggleGlobal('event', event.id)}
                                                        className={`btn btn-icon btn-sm ${event.isGlobal ? 'active' : ''}`}
                                                        style={{ 
                                                            color: event.isGlobal ? '#8b5cf6' : 'var(--color-text-secondary)',
                                                            background: event.isGlobal ? 'rgba(139, 92, 246, 0.1)' : 'var(--color-subtle-bg)',
                                                            border: '1px solid',
                                                            borderColor: event.isGlobal ? '#8b5cf6' : 'var(--color-subtle-border)'
                                                        }}
                                                        title={event.isGlobal ? "Anasayfadan Kaldır" : "Anasayfaya Ekle"}
                                                        disabled={promoting[event.id]}
                                                    >
                                                        <Megaphone size={14} />
                                                    </button>
                                                )}
                                                {isOfficial && (
                                                    <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => onEdit?.('event', event)} className="btn btn-icon btn-sm" title="Düzenle" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => onDelete?.('event', event.id)} className="btn btn-icon btn-sm" title="Sil" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '12px', opacity: 0.8, lineHeight: '1.4' }}>
                                            {event.description}
                                        </p>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.8rem', opacity: 0.7, marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPin size={14} /> {event.isOnline ? 'Online' : event.location}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Users size={14} /> {event.currentParticipants || 0} / {event.participantLimit || '∞'} Katılımcı
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                className={`btn ${registered[event.id] || event.isUserRegistered ? 'btn-ghost' : 'btn-primary'}`}
                                                style={{ 
                                                    flex: 1, padding: '8px', fontSize: '0.85rem', fontWeight: '700',
                                                    boxShadow: registered[event.id] || event.isUserRegistered ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.3)'
                                                }}
                                                onClick={() => handleRegister(event)}
                                                disabled={registering[event.id] || registered[event.id] || event.isUserRegistered}
                                            >
                                                {registering[event.id] ? 'Kayıt Yapılıyor...' : (registered[event.id] || event.isUserRegistered ? 'Kayıtlısınız' : 'Kayıt Ol')}
                                            </button>
                                            
                                            {isOfficial && (
                                                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                                    <button 
                                                        className="btn btn-ghost"
                                                        style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                                                        onClick={(e) => { e.stopPropagation(); handleSeeParticipants(event); }}
                                                    >
                                                        Katılımcılar
                                                    </button>
                                                    <button 
                                                        className="btn btn-outline"
                                                        style={{ flex: 1, padding: '8px', fontSize: '0.85rem', color: 'var(--color-accent-primary)', borderColor: 'var(--color-accent-primary)' }}
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${event.id}/applications`); }}
                                                    >
                                                        Başvurular
                                                    </button>
                                                    <button 
                                                        className="btn btn-primary"
                                                        style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                                                        onClick={(e) => { e.stopPropagation(); setScannerOpenForEvent(event.id); }}
                                                    >
                                                        QR Tara
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Participants Modal */}
            {showParticipantsModal && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '600px', width: '100%', padding: 'var(--spacing-xl)', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Katılımcı Listesi</h3>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '4px' }}>{selectedEvent?.title}</p>
                            </div>
                            <button onClick={() => setShowParticipantsModal(false)} className="btn-close"><X size={20} /></button>
                        </div>
                        
                        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                            {loadingParticipants ? (
                                <div className="text-center py-5">
                                    <div className="loading-spinner" style={{ margin: '0 auto 15px' }}></div>
                                    <p>Yükleniyor...</p>
                                </div>
                            ) : participants.length > 0 ? (
                                <div style={{ display: 'grid', gap: '15px' }}>
                                    {participants.map((reg, idx) => (
                                        <div key={idx} style={{ 
                                            padding: '15px', 
                                            background: 'var(--color-subtle-bg)', 
                                            borderRadius: '16px',
                                            border: '1px solid var(--color-subtle-border)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <div style={{ 
                                                    width: '40px', height: '40px', borderRadius: '12px', 
                                                    background: 'var(--color-accent-gradient)', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                    fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-text-on-accent)' 
                                                }}>
                                                    {((reg.firstName || reg.user?.name || '?')[0]).toUpperCase()}
                                                    {((reg.lastName || reg.user?.surname || '')[0])?.toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600' }}>
                                                        {(reg.firstName ? `${reg.firstName} ${reg.lastName || ''}`.trim() : null) || (reg.user?.name ? `${reg.user.name} ${reg.user.surname || ''}`.trim() : null) || 'İsimsiz'}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{reg.email || reg.user?.email}</div>
                                                </div>
                                                <div className={`status-badge-mini ${reg.status?.toLowerCase() || 'pending'}`} style={{
                                                    fontSize: '0.7rem', padding: '4px 8px', borderRadius: '20px',
                                                    background: reg.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                                    color: reg.status === 'APPROVED' ? '#22c55e' : '#fbbf24'
                                                }}>
                                                    {reg.status === 'APPROVED' ? 'Onaylı' : reg.status === 'REJECTED' ? 'Reddedildi' : 'Bekliyor'}
                                                </div>
                                            </div>

                                            {(reg.phone || reg.university || reg.motivation) && (
                                                <div style={{ display: 'grid', gap: '8px', fontSize: '0.85rem', padding: '12px', background: 'var(--color-subtle-bg)', borderRadius: '12px' }}>
                                                    {reg.phone && <div><strong>Telefon:</strong> {reg.phone}</div>}
                                                    {reg.university && <div><strong>Eğitim:</strong> {reg.university} {reg.department ? `- ${reg.department}` : ''} ({reg.classLevel})</div>}
                                                    {reg.motivation && (
                                                        <div style={{ marginTop: '4px' }}>
                                                            <strong>Motivasyon:</strong>
                                                            <p style={{ marginTop: '4px', opacity: 0.8, fontStyle: 'italic' }}>"{reg.motivation}"</p>
                                                        </div>
                                                    )}
                                                    {reg.expectations && (
                                                        <div style={{ marginTop: '4px' }}>
                                                            <strong>Beklentiler:</strong>
                                                            <p style={{ marginTop: '4px', opacity: 0.8, fontStyle: 'italic' }}>"{reg.expectations}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 opacity-50">
                                    <Users size={48} style={{ marginBottom: '15px', opacity: 0.2 }} />
                                    <p>Henüz kayıtlı katılımcı yok.</p>
                                </div>
                            )}
                        </div>
                        
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-lg)' }} onClick={() => setShowParticipantsModal(false)}>
                            Kapat
                        </button>
                    </div>
                </div>
            )}

            <QRScannerModal 
                isOpen={!!scannerOpenForEvent}
                onClose={() => setScannerOpenForEvent(null)}
                eventId={scannerOpenForEvent}
            />
        </div>
    );
};

export default ClubActivitiesTab;
