import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users as UsersIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './EventCard.css';

const EventCard = ({ event, isPast }) => {
    const navigate = useNavigate();
    const { user, isPremium } = useAuth();
    const isCircle = event.eventType === 'circle';

    const getValidImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) return url;
        return null;
    };
    
    const validPoster = getValidImageUrl(event.posterImage) || getValidImageUrl(event.poster) || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80';

    const [showParticipants, setShowParticipants] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    const handleSeeParticipants = async (eventId) => {
        setShowParticipants(true);
        setLoadingParticipants(true);
        try {
            const data = await api.get(`/events/${eventId}/registrations`);
            setParticipants(data || []);
        } catch (err) {
            console.error('Katılımcı listesi yüklenemedi:', err);
        } finally {
            setLoadingParticipants(false);
        }
    };

    return (
        <div
            className={`event-card card ${isCircle ? 'event-card-circle' : ''} ${isPast ? 'is-past' : ''}`}
            onClick={() => navigate(`/events/${event.id}`)}
            style={{
                border: isCircle ? '2px solid #8b5cf6' : '1px solid var(--color-card-border)',
                transition: 'all 0.3s ease',
                opacity: isPast ? 0.7 : 1,
                filter: isPast ? 'grayscale(0.4)' : 'none'
            }}
        >
            <div className="event-card-image" style={{ position: 'relative' }}>
                <img src={validPoster} alt={event.title} style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                }} />

                <div style={{
                    position: 'absolute',
                    top: 'var(--spacing-md)',
                    left: 'var(--spacing-md)',
                    background: isPast ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    padding: 'var(--spacing-xs) var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '700',
                    color: '#fff',
                    letterSpacing: '0.5px'
                }}>
                    {isPast ? 'TAMAMLANDI' : 'KAYIT'}
                </div>

                <div className="event-card-badges" style={{
                    position: 'absolute',
                    top: 'var(--spacing-md)',
                    right: 'var(--spacing-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-xs)',
                    alignItems: 'flex-end'
                }}>
                    {event.paymentType === 'paid' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                            <span style={{
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                color: '#000',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '800',
                                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                            }}>
                                {isPremium() && event.premiumPrice !== undefined && event.premiumPrice !== null
                                    ? (Number(event.premiumPrice) === 0 ? 'Ücretsiz' : `₺${event.premiumPrice}`)
                                    : `₺${event.price}`}
                            </span>
                            {!isPremium() && event.premiumPrice !== undefined && event.premiumPrice !== null && (
                                <span style={{
                                    fontSize: '0.7rem',
                                    color: '#fbbf24',
                                    fontWeight: '700',
                                    background: 'rgba(0,0,0,0.8)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(4px)'
                                }}>
                                    Premium: {Number(event.premiumPrice) === 0 ? 'Bedava' : `₺${event.premiumPrice}`}
                                </span>
                            )}
                        </div>
                    )}
                    {event.paymentType === 'free' && (
                        <span style={{
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            background: 'rgba(34, 197, 94, 0.9)',
                            color: '#fff',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '700'
                        }}>
                            Ücretsiz
                        </span>
                    )}
                    {isCircle && (
                        <span style={{
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            color: '#fff',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '700',
                            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
                        }}>
                            ⭕ Circle
                        </span>
                    )}
                    {event.topics && event.topics.length > 0 && event.topics[0] !== 'General' && event.topics[0] !== 'circle' && (
                        <span style={{
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            background: 'rgba(59, 130, 246, 0.9)',
                            color: '#fff',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '700'
                        }}>
                            {event.topics[0]}
                        </span>
                    )}
                    {user && (event.creatorId === user.id || event.createdBy === user.id) && (
                        <span style={{
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                            color: '#fff',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '700',
                            boxShadow: '0 2px 8px rgba(244, 63, 94, 0.4)'
                        }}>
                            👑 Senin Etkinliğin
                        </span>
                    )}
                </div>
            </div>

            <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
                <h3 className="event-card-title" style={{
                    fontSize: 'var(--font-size-md)',
                    fontWeight: '600',
                    marginBottom: event.club ? '4px' : 'var(--spacing-sm)',
                    color: 'var(--color-text-primary)'
                }}>
                    {event.title}
                </h3>

                {event.club && (
                    <div className="event-club-name" style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-accent-primary)',
                        fontWeight: '700',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-accent-primary)', opacity: 0.2 }}></div>
                        {event.club.name}
                    </div>
                )}
                
                {event.creator && (
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--spacing-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: 'var(--color-bg-tertiary)', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {event.creator.profilePicture || event.creator.profilePhoto || event.creator.avatar ? (
                                <img src={event.creator.profilePicture || event.creator.profilePhoto || event.creator.avatar} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            ) : (
                                <span style={{fontSize: '0.6rem', fontWeight: 'bold'}}>{(event.creator.name?.[0] || 'A').toUpperCase()}</span>
                            )}
                        </div>
                        Oluşturan: {event.creator.name} {event.creator.surname}
                    </div>
                )}

                <div className="event-card-meta" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-secondary)',
                    fontWeight: '500',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-subtle-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: 'var(--color-bg-tertiary)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                            <Calendar size={14} color="var(--color-accent-primary)" />
                        </div>
                        <span style={{ color: 'var(--color-text-primary)' }}>{format(new Date(event.date), 'dd MMMM yyyy, HH:mm', { locale: tr })}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: 'var(--color-bg-tertiary)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                            <MapPin size={14} color="var(--color-accent-primary)" />
                        </div>
                        <span style={{ color: 'var(--color-text-primary)' }}>{event.isOnline ? 'Online' : event.location}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ background: 'var(--color-bg-tertiary)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                                <UsersIcon size={14} color="var(--color-accent-primary)" />
                            </div>
                            <span style={{ color: 'var(--color-text-primary)' }}>
                                {user ? (
                                    <>{event.currentParticipants || 0} / {event.participantLimit || 100} katılımcı</>
                                ) : (
                                    <>Kayıt olarak kontenjanı gör</>
                                )}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                        {(user?.role === 'admin' || user?.isBranchRepresentative) && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `https://bondlecommunity.com/events/${event.id}?ref=${user?.referralCode || ''}`;
                                    navigator.clipboard.writeText(url);
                                    alert('Davet linki kopyalandı!');
                                }}
                                className="btn btn-icon"
                                title="Davet Linkini Kopyala"
                                style={{ 
                                    background: 'var(--color-bg-secondary)', 
                                    color: 'var(--color-accent-primary)', 
                                    border: '1px solid var(--color-accent-primary)', 
                                    cursor: 'pointer', 
                                    padding: '8px', 
                                    borderRadius: '10px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        )}
                        {user?.role === 'admin' && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSeeParticipants(event.id);
                                }}
                                className="btn btn-icon"
                                title="Katılımcı Listesi"
                                style={{ 
                                    background: 'linear-gradient(135deg, var(--color-accent-primary) 0%, #4c1d95 100%)', 
                                    color: '#ffffff', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    padding: '8px', 
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 12px rgba(109, 40, 217, 0.25)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <UsersIcon size={14} />
                            </button>
                        )}
                        </div>
                    </div>
                </div>
            </div>

            {showParticipants && createPortal(
                <div 
                    className="modal-overlay" 
                    onClick={(e) => { e.stopPropagation(); setShowParticipants(false); }} 
                    style={{ 
                        position: 'fixed', 
                        inset: 0, 
                        zIndex: 9999, 
                        background: 'rgba(30, 27, 75, 0.3)', 
                        backdropFilter: 'blur(12px)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}
                >
                    <div 
                        className="card" 
                        onClick={(e) => e.stopPropagation()} 
                        style={{ 
                            width: '90%', 
                            maxWidth: '340px', 
                            padding: '24px', 
                            background: 'linear-gradient(150deg, #ffffff 0%, #f5f3ff 40%, #e9d5ff 100%)', 
                            border: '1px solid rgba(255, 255, 255, 0.8)', 
                            borderRadius: '24px',
                            boxShadow: '0 25px 50px -12px rgba(109, 40, 217, 0.25)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.6)' }}>
                            <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#4c1d95', fontWeight: '800' }}>Katılımcılar</h4>
                            <button 
                                onClick={() => setShowParticipants(false)} 
                                style={{ 
                                    border: 'none', 
                                    background: 'rgba(255, 255, 255, 0.5)', 
                                    color: '#6b21a8', 
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                            {loadingParticipants ? (
                                <div style={{ color: '#6b21a8', textAlign: 'center', fontWeight: '500', padding: '20px' }}>Yükleniyor...</div>
                            ) : (
                                participants.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {participants.filter(p => p.status !== 'REJECTED').map((p, i) => {
                                            const displayName = (p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : null) || (p.user?.name ? `${p.user.name} ${p.user.surname || ''}`.trim() : null) || 'İsimsiz Katılımcı';
                                            const initial = displayName.charAt(0).toUpperCase();
                                            return (
                                                <div key={i} style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '12px',
                                                    background: 'rgba(255, 255, 255, 0.6)',
                                                    padding: '8px 12px',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(255, 255, 255, 0.9)'
                                                }}>
                                                    <div style={{ 
                                                        width: '28px', 
                                                        height: '28px', 
                                                        borderRadius: '50%', 
                                                        background: 'linear-gradient(135deg, #9333ea 0%, #4c1d95 100%)', 
                                                        color: '#ffffff', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        fontSize: '0.8rem',
                                                        fontWeight: '700',
                                                        flexShrink: 0
                                                    }}>
                                                        {initial}
                                                    </div>
                                                    <span style={{ color: '#4c1d95', fontWeight: '600', fontSize: '0.9rem' }}>{displayName}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ color: '#6b21a8', textAlign: 'center', fontWeight: '500', padding: '20px' }}>Henüz katılan yok</div>
                                )
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default EventCard;
