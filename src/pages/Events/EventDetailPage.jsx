import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, MapPin, Users, ExternalLink, Check, Clock, Star, ArrowLeft, Share2, Info, X, Building2, Globe, Sparkles, Mic, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '../../services/api';
import { getEventById } from '../../services/eventService';
import { useEvents } from '../../contexts/EventContext';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import EventRegistrationModal from '../../components/EventRegistrationModal';
import RequireAuthModal from '../../components/RequireAuthModal';
import { useAnalytics } from '../../hooks/useAnalytics';
import EventChatTab from '../../components/EventChatTab';
import { QRCodeSVG } from 'qrcode.react';
import './EventDetailPage.css';

const EventDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isPremium } = useAuth();
    const { registerForEvent, unregisterFromEvent, registeredEvents, fetchUserRegistrations, submitFeedback, adminAddParticipant } = useEvents();
    const { logEvent, setPageOverride } = useAnalytics();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [showUnregisterDialog, setShowUnregisterDialog] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [unregistering, setUnregistering] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState(null); // null, 'PENDING', 'APPROVED', 'REJECTED'
    const [showParticipants, setShowParticipants] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [showAdminAddModal, setShowAdminAddModal] = useState(false);
    const [adminAddEmail, setAdminAddEmail] = useState('');
    const [adminAddLoading, setAdminAddLoading] = useState(false);
    const [paymentReported, setPaymentReported] = useState(() => {
        return localStorage.getItem(`payment_reported_${id}`) === 'true';
    });
    const [reportingPayment, setReportingPayment] = useState(false);
    
    // Check if there's a tab query param
    const queryParams = new URLSearchParams(window.location.search);
    const initialTab = queryParams.get('tab') || 'details';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        fetchEvent();
        checkRegistrationStatus();
    }, [id]);

    useEffect(() => {
        if (event) {
            document.title = `Bondle | ${event.title}`;
            setPageOverride(`Etkinlik Detay: ${event.title}`);
        } else if (error) {
            document.title = 'Bondle | Etkinlik Bulunamadı';
        }
    }, [event, error, setPageOverride]);

    useEffect(() => {
        if (event && registeredEvents.length > 0) {
            const reg = registeredEvents.find(r => r.id === parseInt(id));
            if (reg) {
                setIsRegistered(true);
                setRegistrationStatus(reg.registrationStatus || 'PENDING');
            }
        }
    }, [event, registeredEvents, id]);

    const checkRegistrationStatus = async () => {
        try {
            const registrations = await api.getUserRegistrations();
            if (Array.isArray(registrations)) {
                const reg = registrations.find(r => r.eventId === parseInt(id));
                if (reg) {
                    setIsRegistered(true);
                    setRegistrationStatus(reg.status || 'PENDING');
                }
            }
        } catch (error) {
            console.error('Registration status check failed:', error);
        }
    };

    const fetchEvent = async () => {
        try {
            const data = await getEventById(parseInt(id));
            setEvent(data);
        } catch (err) {
            setError('Etkinlik yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const showToastMessage = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    const handleSeeParticipants = async () => {
        if (!user || (user.role !== 'admin' && event.createdBy !== user.id && event.assignedRepresentativeId !== user.id)) return;
        
        setShowParticipants(true);
        setLoadingParticipants(true);
        try {
            const data = await api.get(`/events/${event.id}/registrations`);
            setParticipants(data || []);
        } catch (err) {
            console.error('Katılımcı listesi yüklenemedi:', err);
            if (err.response?.status === 403) {
                showToastMessage('Katılımcıları görme yetkiniz yok.', 'error');
                setShowParticipants(false);
            }
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleAdminAddParticipant = async () => {
        if (!adminAddEmail.trim()) return;
        setAdminAddLoading(true);
        const res = await adminAddParticipant(event.id, adminAddEmail.trim());
        setAdminAddLoading(false);
        
        if (res.success) {
            showToastMessage('Katılımcı başarıyla eklendi!', 'success');
            setShowAdminAddModal(false);
            setAdminAddEmail('');
            if (showParticipants) {
                handleSeeParticipants();
            }
            fetchEvent();
        } else {
            showToastMessage(res.error || 'Katılımcı eklenirken hata oluştu.', 'error');
        }
    };

    const handleShare = async () => {
        let shareUrl = window.location.href;
        if (user && user.referralCode) {
            shareUrl = `${shareUrl}${shareUrl.includes('?') ? '&' : '?'}ref=${user.referralCode}`;
        }
        
        const shareData = {
            title: event?.title || 'Bondle Etkinliği',
            text: `${event?.title} etkinliğine göz at!`,
            url: shareUrl,
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                showToastMessage('Etkinlik linki panoya kopyalandı!', 'success');
            }
        } catch (err) {
            console.error('Paylaşım hatası:', err);
            if (err.name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    showToastMessage('Etkinlik linki panoya kopyalandı!', 'success');
                } catch (e) {
                    showToastMessage('Link kopyalanamadı.', 'error');
                }
            }
        }
    };

    const handleRegistrationSubmit = async (formData) => {
        setRegistering(true);
        try {
            const result = await registerForEvent(event.id, formData);
            if (result.success) {
                const status = result.data?.status || (event.requiresForm ? 'PENDING' : 'APPROVED');
                setIsRegistered(true);
                setRegistrationStatus(status);
                setShowRegistrationModal(false);
                logEvent('event_register_success', 'conversion', { eventId: event.id, title: event.title, status });
                
                let msg = status === 'APPROVED' 
                    ? 'Etkinliğe başarıyla kaydoldunuz! İyi eğlenceler. 🎉' 
                    : 'Başvurunuz alındı! Admin onayından sonra size bildirim gönderilecektir. 🎉';
                    
                if (event.paymentType === 'paid') {
                    const targetUrl = isPremium() && event.premiumShopierUrl ? event.premiumShopierUrl : event.shopierUrl;
                    
                    if (targetUrl) {
                        msg = 'Shopier ödeme sayfasına yönlendiriliyorsunuz... 💳';
                        setTimeout(() => {
                            window.open(targetUrl, '_blank');
                        }, 1500);
                    }
                }
                
                showToastMessage(msg, 'success');
                
                fetchUserRegistrations();
                fetchEvent(); // Refresh local event data to show registered state
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            showToastMessage(`Başvuru başarısız: ${err.message || 'Bir hata oluştu'}`, 'error');
        } finally {
            setRegistering(false);
        }
    };

    const handleUnregister = async () => {
        if (unregistering) return;
        setShowUnregisterDialog(false);
        setUnregistering(true);
        try {
            const result = await unregisterFromEvent(event.id);
            if (result.success) {
                setIsRegistered(false);
                setRegistrationStatus(null);
                showToastMessage('Etkinlikten ayrıldın', 'info');
                fetchEvent();
                fetchUserRegistrations();
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            showToastMessage(`İşlem başarısız: ${err.message || 'Bir hata oluştu'}`, 'error');
        } finally {
            setUnregistering(false);
        }
    };

    const handleFeedbackSubmit = async () => {
        if (feedbackRating === 0) return;
        setFeedbackSubmitting(true);
        try {
            const result = await submitFeedback(event.id, {
                rating: feedbackRating,
                comment: feedbackComment
            });
            if (result.success) {
                setFeedbackSubmitted(true);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            showToastMessage('Geri bildirim gönderilemedi: ' + err.message, 'error');
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const isEventEnded = event ? new Date(event.date) < new Date() : false;

    if (loading) return <div className="loading-screen">Yükleniyor...</div>;
    if (error || !event) return <div className="error-screen">{error || 'Etkinlik bulunamadı'}</div>;

    return (
        <div className="event-detail-page">
            <div className="detail-hero">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} color="#ffffff" />
                </button>
                {/* Blurred background fill */}
                <div 
                    className="hero-bg-blur"
                    style={{ backgroundImage: `url(${event.posterImage || event.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'})` }}
                />
                <div className="hero-overlay"></div>
                <div className="hero-image-container">
                    <img 
                        src={event.posterImage || event.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'} 
                        alt={event.title} 
                        className="hero-image"
                    />
                </div>
            </div>

            <div className="detail-content-wrapper">
                <div className="detail-container">
                    <div className="detail-main">
                        <div className="event-header-info">
                            <div className="category-badges">
                                <span className={`type-badge ${event.paymentType}`}>
                                    {event.paymentType === 'free' ? 'Ücretsiz' : (isPremium() && event.premiumPrice !== undefined && event.premiumPrice !== null ? (Number(event.premiumPrice) === 0 ? 'Ücretsiz' : `₺${event.premiumPrice}`) : `₺${event.price}`)}
                                </span>
                                {event.paymentType === 'paid' && !isPremium() && event.premiumPrice !== undefined && event.premiumPrice !== null && (
                                    <span className="type-badge" style={{ background: 'var(--color-bg-tertiary)', color: '#fbbf24', border: '1px solid #fbbf24' }}>
                                        Premium: {Number(event.premiumPrice) === 0 ? 'Ücretsiz' : `₺${event.premiumPrice}`}
                                    </span>
                                )}
                                {event.eventType === 'circle' && <span className="circle-badge">Circle</span>}
                                {event.topics && event.topics.length > 0 && event.topics[0] !== 'General' && event.topics[0] !== 'circle' && (
                                    <span className="type-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                        {event.topics[0]}
                                    </span>
                                )}
                                {event.isOnline && <span className="online-badge">Online</span>}
                            </div>
                            <h1 className="event-title">{event.title}</h1>
                            
                            <div className="event-tabs-container" style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px', marginTop: '16px' }}>
                                <button 
                                    className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('details')}
                                    style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', borderBottom: activeTab === 'details' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'details' ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === 'details' ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Info size={18} /> Detaylar
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('chat')}
                                    style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', borderBottom: activeTab === 'chat' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'chat' ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === 'chat' ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <MessageSquare size={18} /> Sohbet
                                </button>
                            </div>
                        </div>

                        {activeTab === 'details' && (
                                <>
                                    <div className="quick-stats">
                                        <div className="stat-item">
                                            <Calendar size={18} />
                                            <span>{format(new Date(event.date), 'dd MMMM yyyy', { locale: tr })}</span>
                                        </div>
                                        <div className="stat-item">
                                            <Clock size={18} />
                                            <span>{format(new Date(event.date), 'HH:mm', { locale: tr })}</span>
                                        </div>
                                        {!event.isOnline && (
                                            <>
                                                <div className="stat-item">
                                                    <MapPin size={18} />
                                                    <span>{event.location}</span>
                                                </div>
                                                {event.city && (
                                                    <div className="stat-item">
                                                        <Building2 size={18} />
                                                        <span>{event.city}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="description-section">
                                        <div className="section-header">
                                            <Info size={22} color="#a78bfa" style={{ flexShrink: 0 }} />
                                            <h3>Etkinlik Hakkında</h3>
                                        </div>
                                        <div className="description-text">
                                            {event.description.split('\n').map((para, i) => (
                                                para.trim() ? <p key={i}>{para}</p> : null
                                            ))}
                                        </div>
                                    </div>

                                    {event.speakers && event.speakers.length > 0 && (
                                        <div className="speakers-section">
                                            <div className="section-header">
                                                <Mic size={22} color="#22d3ee" style={{ flexShrink: 0 }} />
                                                <h3>Konuşmacılar</h3>
                                            </div>
                                            <div className="speakers-list">
                                                {event.speakers.map((speaker, i) => (
                                                    <div key={i} className="speaker-card">
                                                        <div className="speaker-avatar">
                                                            {speaker.charAt(0)}
                                                        </div>
                                                        <span className="speaker-name">{speaker}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'chat' && (
                                <EventChatTab 
                                    eventId={event.id} 
                                    isRegistered={isRegistered} 
                                    user={user} 
                                    onRegisterClick={() => {
                                        if (!user) {
                                            setShowAuthModal(true);
                                            return;
                                        }
                                        setShowRegistrationModal(true);
                                    }}
                                />
                            )}
                        </div>

                    <div className="detail-sidebar">
                        <div className="sticky-sidebar">
                            <div className="registration-card">
                                <div 
                                    className="participant-info"
                                    onClick={handleSeeParticipants}
                                    style={{ 
                                        cursor: (user?.role === 'admin' || event.createdBy === user?.id || event.assignedRepresentativeId === user?.id) ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: (user?.role === 'admin' || event.createdBy === user?.id || event.assignedRepresentativeId === user?.id) ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        margin: '-8px'
                                    }}
                                    title={(user?.role === 'admin' || event.createdBy === user?.id) ? 'Katılımcıları Gör' : ''}
                                >
                                    <Users size={20} />
                                    {user ? (
                                        <span>{event.currentParticipants} / {event.participantLimit} Katılımcı</span>
                                    ) : (
                                        <span>Giriş Yaparak Kontenjanı Gör</span>
                                    )}
                                </div>
                                
                                {user && (
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${(event.currentParticipants / event.participantLimit) * 100}%` }}
                                        ></div>
                                    </div>
                                )}

                                {!isRegistered ? (
                                    <button
                                        className="btn btn-primary register-cta"
                                        onClick={() => {
                                            if (!user) {
                                                setShowAuthModal(true);
                                                return;
                                            }
                                            setShowRegistrationModal(true);
                                            logEvent('event_register_click', 'click', { eventId: event.id, title: event.title });
                                        }}
                                        disabled={isEventEnded || event.currentParticipants >= event.participantLimit || registering}
                                    >
                                        {registering ? 'Kaydolunuyor...' : 
                                         isEventEnded ? 'Etkinlik Sona Erdi' : 
                                         event.currentParticipants >= event.participantLimit ? 'Kontenjan Dolu' : 'Etkinliğe Katıl'}
                                    </button>
                                ) : (
                                    <div className="registered-actions">
                                        {registrationStatus?.toUpperCase() === 'PENDING' ? (
                                            <div className="pending-registration-notice">
                                                <div className="status-badge pending">
                                                    <Clock size={16} />
                                                    Onay Bekliyor
                                                </div>
                                                <p className="notice-text">
                                                    Başvurunuz admin/kulüp yöneticisine iletildi. Onaylandıktan sonra bildirim alacaksınız ve etkinlik takviminize eklenecektir.
                                                </p>
                                                {event.paymentType === 'paid' && (isPremium() && event.premiumShopierUrl ? event.premiumShopierUrl : event.shopierUrl) && (
                                                    <>
                                                        <a 
                                                            href={isPremium() && event.premiumShopierUrl ? event.premiumShopierUrl : event.shopierUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => logEvent('event_payment_click', 'click', { eventId: event.id, title: event.title })}
                                                            style={{ marginTop: 'var(--spacing-sm)', width: '100%' }}
                                                        >
                                                            <Globe size={16} /> Ödemeyi Tamamla (Shopier)
                                                        </a>
                                                        <button
                                                            className={`btn btn-sm ${paymentReported ? 'btn-success' : 'btn-secondary'}`}
                                                            style={{ marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: paymentReported ? 'var(--color-success)' : 'transparent', border: paymentReported ? 'none' : '1px solid var(--color-border)', color: paymentReported ? '#fff' : 'inherit' }}
                                                            disabled={paymentReported || reportingPayment}
                                                            onClick={async () => {
                                                                setReportingPayment(true);
                                                                try {
                                                                    await api.reportEventPayment(event.id);
                                                                    setPaymentReported(true);
                                                                    localStorage.setItem(`payment_reported_${event.id}`, 'true');
                                                                    showToastMessage('Ödeme bildiriminiz yöneticiye iletildi.', 'success');
                                                                } catch(err) {
                                                                    showToastMessage('Bildirim gönderilirken hata oluştu.', 'error');
                                                                } finally {
                                                                    setReportingPayment(false);
                                                                }
                                                            }}
                                                        >
                                                            {paymentReported ? <><Check size={16} /> Bildirildi</> : <><Check size={16} /> Ödemeyi Yaptım, Bildir</>}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ) : registrationStatus?.toUpperCase() === 'REJECTED' ? (
                                            <div className="status-badge rejected">
                                                <X size={16} />
                                                Başvuru Reddedildi
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <div className="status-badge success" style={{ alignSelf: 'center' }}>
                                                    <Check size={16} />
                                                    Kayıtlısın
                                                </div>
                                                {event.paymentType !== 'paid' || paymentReported ? (
                                                    <div style={{ 
                                                        background: '#fff', padding: '15px', borderRadius: '12px', 
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' 
                                                    }}>
                                                        <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>GİRİŞ BİLETİNİZ</div>
                                                        <QRCodeSVG 
                                                            value={JSON.stringify({ eventId: event.id, userId: user?.id })}
                                                            size={150}
                                                            bgColor={"#ffffff"}
                                                            fgColor={"#000000"}
                                                            level={"M"}
                                                        />
                                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>Lütfen girişte bu kodu okutun.</div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                        
                                        {!isEventEnded && (
                                            <button 
                                                className="btn-unregister"
                                                onClick={() => setShowUnregisterDialog(true)}
                                            >
                                                {registrationStatus?.toUpperCase() === 'PENDING' ? 'Başvuruyu Geri Çek' : 'Etkinlikten Ayrıl'}
                                            </button>
                                        )}

                                        {isEventEnded && registrationStatus === 'APPROVED' && (
                                            <div className="feedback-container">
                                                {feedbackSubmitted ? (
                                                    <div className="feedback-thanks">
                                                        <Check size={24} />
                                                        <p>Geri bildiriminiz için teşekkürler!</p>
                                                    </div>
                                                ) : (
                                                    <div className="feedback-form">
                                                        <h4>Deneyimini Paylaş</h4>
                                                        <div className="star-rating">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star 
                                                                    key={s} 
                                                                    size={24} 
                                                                    fill={s <= feedbackRating ? '#fbbf24' : 'none'}
                                                                    color={s <= feedbackRating ? '#fbbf24' : 'var(--color-bg-tertiary)'}
                                                                    onClick={() => setFeedbackRating(s)}
                                                                />
                                                            ))}
                                                        </div>
                                                        <textarea 
                                                            placeholder="Düşüncelerini yaz..."
                                                            value={feedbackComment}
                                                            onChange={(e) => setFeedbackComment(e.target.value)}
                                                        />
                                                        <button 
                                                            className="btn btn-primary btn-sm"
                                                            onClick={handleFeedbackSubmit}
                                                            disabled={feedbackSubmitting || feedbackRating === 0}
                                                        >
                                                            Gönder
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ height: '1px', background: 'var(--color-subtle-border)', margin: '8px 0' }} />

                                <button className="btn btn-ghost share-btn" onClick={handleShare}>
                                    <Share2 size={18} />
                                    Arkadaşlarınla Paylaş
                                </button>
                                {event.isOnline && isRegistered && (
                                    <div style={{ marginTop: '20px', padding: '15px', background: 'var(--color-bg-tertiary)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                                        {event.zoomLink === 'BONDLE_MEET' ? (
                                            <>
                                                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem' }}>💻 Canlı Görüşme (Bondle Meet)</h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '15px' }}>
                                                    Etkinlik saatinde bu odaya katılarak diğer katılımcılarla görüntülü sohbet edebilir ve moderatörün "Odalara Dağıt" (Circle) özelliğiyle rastgele kişilerle tanışabilirsiniz.
                                                </p>
                                                <Link to={`/meeting/event-${event.id}`} className="btn btn-accent" style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                                                    Görüşmeye Katıl
                                                </Link>
                                            </>
                                        ) : (
                                            <>
                                                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem' }}>🌐 Online Etkinlik Linki</h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '15px' }}>
                                                    Etkinlik saatinde aşağıdaki butona tıklayarak yayın platformuna (Zoom, Google Meet vb.) gidebilirsiniz.
                                                </p>
                                                {event.zoomLink ? (
                                                    <a href={event.zoomLink} target="_blank" rel="noopener noreferrer" className="btn btn-accent" style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                                                        Etkinlik Linkine Git
                                                    </a>
                                                ) : (
                                                    <div style={{ padding: '10px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                                        Link henüz eklenmedi.
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showRegistrationModal && (
                <EventRegistrationModal
                    event={event}
                    user={user}
                    onClose={() => setShowRegistrationModal(false)}
                    onSubmit={handleRegistrationSubmit}
                    loading={registering}
                />
            )}

            <RequireAuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                message="Bu etkinliğe katılmak için giriş yapmalısınız." 
            />

            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}

            {showParticipants && (
                <div className="modal-overlay" onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ width: '90%', maxWidth: '350px', padding: 'var(--spacing-lg)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={18} color="var(--color-primary)" />
                                Katılımcılar
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {(user?.role === 'admin' || event.createdBy === user?.id || event.assignedRepresentativeId === user?.id) && (
                                    <button onClick={() => setShowAdminAddModal(true)} className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Kişi Ekle</button>
                                )}
                                <button onClick={() => setShowParticipants(false)} className="btn-close" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%' }}><X size={20} /></button>
                            </div>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                            {loadingParticipants ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                    <div className="spinner" style={{ width: '24px', height: '24px', border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                </div>
                            ) : (
                                participants.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {participants.filter(p => p.status !== 'REJECTED').map((p, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'var(--color-bg-primary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                                <div style={{ 
                                                    width: '36px', height: '36px', borderRadius: '50%', 
                                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-primary))', 
                                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                    fontSize: '1rem', fontWeight: 'bold' 
                                                }}>
                                                    {(p.firstName || p.user?.name || '?').charAt(0).toUpperCase()}
                                                    {(p.lastName || p.user?.surname || '').charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                        {p.firstName || p.user?.name || 'İsimsiz'} {p.lastName || p.user?.surname || 'Kullanıcı'}
                                                    </span>
                                                    {p.status === 'PENDING' && <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Bekliyor</span>}
                                                    {p.status === 'APPROVED' && <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>Onaylandı</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                        Henüz katılan yok.
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showUnregisterDialog && (
                <ConfirmDialog
                    isOpen={showUnregisterDialog}
                    title="Etkinlik İptali"
                    message="Bu etkinlikten kaydınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                    confirmText={unregistering ? 'İptal Ediliyor...' : 'Evet, İptal Et'}
                    cancelText="Vazgeç"
                    onConfirm={handleUnregister}
                    onCancel={() => setShowUnregisterDialog(false)}
                    variant="danger"
                    type="danger"
                />
            )}

            {showAdminAddModal && (
                <div className="modal-overlay" onClick={() => setShowAdminAddModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', padding: 'var(--spacing-lg)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Katılımcı Ekle</h3>
                            <button onClick={() => setShowAdminAddModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' }}><X size={20} /></button>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '15px' }}>
                            Kişiyi etkinliğe doğrudan onaylanmış olarak eklemek için sistemde kayıtlı e-posta adresini girin.
                        </p>
                        <input
                            type="email"
                            placeholder="E-posta adresi"
                            value={adminAddEmail}
                            onChange={(e) => setAdminAddEmail(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', marginBottom: '15px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAdminAddModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer' }}>İptal</button>
                            <button onClick={handleAdminAddParticipant} disabled={adminAddLoading || !adminAddEmail.trim()} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', opacity: (adminAddLoading || !adminAddEmail.trim()) ? 0.5 : 1 }}>
                                {adminAddLoading ? 'Ekleniyor...' : 'Ekle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetailPage;
