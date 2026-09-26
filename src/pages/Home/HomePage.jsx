import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';
import { useNetworking } from '../../contexts/NetworkingContext';
import { Calendar, Users, Zap, Star, TrendingUp, MessageCircle, MapPin, ChevronRight, ChevronLeft, Video, Clock, Bell, Sparkles, Target, Globe, LogIn, Shield, X, Plus, Award } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import FeedbackModal from '../../components/FeedbackModal';
import UserAvatar from '../../components/UserAvatar';
import RequireAuthModal from '../../components/RequireAuthModal';
import StreakWidget from '../../components/StreakWidget';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import api from '../../services/api';

import DailyInterviewWidget from '../../components/DailyInterviewWidget';
import './HomePage.css';

export const BADGE_META = {
    first_login:       { emoji: '🌱', label: 'İlk Adım' },
    streak_3:          { emoji: '🔥', label: '3 Günlük Seri' },
    streak_7:          { emoji: '⚡', label: '7 Günlük Seri' },
    streak_30:         { emoji: '💎', label: '30 Günlük Seri' },
    networker:         { emoji: '🤝', label: 'Networkçi' },
    super_networker:   { emoji: '🌐', label: 'Süper Networkçi' },
    event_goer:        { emoji: '📅', label: 'Etkinlik Dostu' },
    event_enthusiast:  { emoji: '🎉', label: 'Etkinlik Tutkunu' },
    mentee:            { emoji: '🎓', label: 'Mentee' },
    competitor:        { emoji: '🏆', label: 'Yarışmacı' },
    club_member:       { emoji: '👥', label: 'Kulüp Üyesi' },
    profile_complete:  { emoji: '⭐', label: 'Tam Profil' },
    premium:           { emoji: '💫', label: 'Premium' },
};

const HomePage = () => {
    const { user, isPremium, loading } = useAuth();
    const announcementsRef = useRef(null);
    const { registeredEvents, needsFeedback, submitFeedback, fetchUserRegistrations } = useEvents();
    const { credits, getUpcomingMeetings, matchHistory, connections } = useNetworking();
    const navigate = useNavigate();
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackEvent, setFeedbackEvent] = useState(null);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [creditToast, setCreditToast] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalContent, setAuthModalContent] = useState({
        title: 'Giriş Yapmanız Gerekiyor',
        message: 'Bu sayfayı görüntülemek için giriş yapmalısınız.',
        icon: LogIn
    });
    const [smartRecommendations, setSmartRecommendations] = useState([]);
    const [aiEventsLoading, setAiEventsLoading] = useState(false);
    const [engagementData, setEngagementData] = useState(null);
    const [showChallenges, setShowChallenges] = useState(false);
    const [showBadges, setShowBadges] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [toastConfig, setToastConfig] = useState({ isOpen: false, message: '', type: 'success' });

    const [myTasks, setMyTasks] = useState([]);
    const [taskNotes, setTaskNotes] = useState({});
    const [showTasksModal, setShowTasksModal] = useState(false);

    // Load announcements and enhance with event data
    useEffect(() => {
        document.title = 'Bondle | Where Bonds Begin';
        const fetchAnnouncements = async () => {
            try {
                const [announcementsData, eventsData] = await Promise.all([
                    api.get('/announcements'),
                    api.get('/events').catch(() => []) // Fallback to empty array if events fail
                ]);

                const enhancedAnnouncements = announcementsData.map(ann => {
                    if (ann.linkTo && ann.linkTo.startsWith('/events/')) {
                        const eventId = ann.linkTo.split('/').pop();
                        const matchingEvent = (eventsData || []).find(e => e.id.toString() === eventId);
                        if (matchingEvent) {
                            return { ...ann, paymentType: matchingEvent.paymentType, price: matchingEvent.price, premiumPrice: matchingEvent.premiumPrice };
                        }
                    }
                    return ann;
                });

                setAnnouncements(enhancedAnnouncements);
            } catch (err) {
                console.error('Error fetching announcements:', err);
            }
        };
        fetchAnnouncements();
    }, []);

    // Load unread notification count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const data = await api.getUnreadNotificationCount();
                setUnreadCount(typeof data === 'number' ? data : (data?.count || 0));
            } catch (err) {
                console.error('Error fetching unread count:', err);
            }
        };
        if (user) fetchUnreadCount();
    }, [user]);

    // Load meetings
    useEffect(() => {
        const loadData = async () => {
            const meetings = await getUpcomingMeetings();
            setUpcomingMeetings(meetings);
            if (fetchUserRegistrations) await fetchUserRegistrations();
        };

        if (user) {
            loadData();
        }
    }, [user, getUpcomingMeetings]);

    // Load engagement data (streak etc)
    useEffect(() => {
        const fetchEngagement = async () => {
            if (!user) return;
            try {
                // Record login then get summary
                await api.recordDailyLogin();
                const data = await api.getEngagementSummary();
                setEngagementData(data);
            } catch (err) {
                console.error('Error fetching engagement:', err);
            }
        };
        fetchEngagement();
    }, [user]);

    // Load AI smart recommendations
    useEffect(() => {
        const fetchAiRecommendations = async () => {
            if (!user) return;
            setAiEventsLoading(true);
            try {
                const data = await api.getSmartRecommendations();
                setSmartRecommendations(data);
            } catch (err) {
                console.error('Error fetching AI recommendations:', err);
            } finally {
                setAiEventsLoading(false);
            }
        };
        fetchAiRecommendations();
    }, [user]);

    // Load my tasks
    useEffect(() => {
        const loadMyTasks = async () => {
            try {
                const tasks = await api.getMyTasks();
                setMyTasks(tasks || []);
            } catch (err) {
                console.warn('Could not fetch tasks:', err);
            }
        };
        if (user && (user.team || user.branch)) {
            loadMyTasks();
        }
    }, [user]);

    const handleProtectedNavigation = (path, feature = null) => {
        if (!user) {
            let content = {
                title: 'Giriş Yapmanız Gerekiyor',
                message: 'Bu sayfayı görüntülemek için giriş yapmalısınız.',
                icon: LogIn
            };
            
            if (feature === 'ai-coach') {
                content = {
                    title: 'AI Kariyer Koçu',
                    message: 'Özgeçmişinizi yapay zeka ile analiz edin, mülakat simülasyonları yapın ve kariyer yolculuğunuzda size özel tavsiyeler alın.',
                    icon: Sparkles
                };
            } else if (feature === 'projects') {
                content = {
                    title: 'Proje Ortağı Bul',
                    message: 'Fikirlerinizi hayata geçirmek için yetenekli ekip arkadaşları bulun, yeteneklerinizi sergileyin ve yeni projelere dahil olun.',
                    icon: Target
                };
            }
            setAuthModalContent(content);
            setShowAuthModal(true);
        } else {
            navigate(path);
        }
    };

    const handleCancelMeeting = (meetingId) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Toplantıyı İptal Et',
            message: 'Bu toplantıyı iptal etmek istediğinize emin misiniz?',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                try {
                    // Use the dedicated cancelMeeting method for clearer notifications
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
                    setTimeout(() => window.location.reload(), 1500); // Quick refresh after showing toast
                } catch (err) {
                    console.error('Error cancelling event:', err);
                    setToastConfig({ isOpen: true, message: 'Etkinlik kaydı silinirken bir hata oluştu.', type: 'error' });
                }
            }
        });
    };

    const handleCreditEarned = useCallback((amount) => {
        setCreditToast(amount);
        setTimeout(() => setCreditToast(null), 4000);
    }, []);

    const handleChallengeClick = (key, completed) => {
        if (completed) return;
        
        setShowChallenges(false);
        
        switch(key) {
            case 'register_event':
                navigate('/events');
                break;
            case 'send_connection':
                navigate('/network');
                break;
            case 'complete_profile':
                navigate('/profile');
                break;
            case 'join_club':
                navigate('/clubs');
                break;
            case 'apply_mentorship':
                navigate('/mentorship');
                break;
            default:
                break;
        }
    };

    // Combine events and meetings, filter out past ones, then sort by date
    const now = new Date();

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

            // Try from populated backend connection
            if (!connectionName && meeting.connection) {
                if (String(meeting.connection.user1?.id) === String(user?.id)) {
                    connectionName = `${meeting.connection.user2?.name || ''} ${meeting.connection.user2?.surname || ''}`.trim();
                } else if (meeting.connection.user1) {
                    connectionName = `${meeting.connection.user1?.name || ''} ${meeting.connection.user1?.surname || ''}`.trim();
                }
            }

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

            // Fallback: Try in matchHistory array
            if (!connectionName || connectionName === '') {
                const match = matchHistory?.find(m =>
                    String(m.userId) === cIdStr ||
                    String(m.user2Id) === cIdStr ||
                    String(m.user1Id) === cIdStr
                );

                if (match) {
                    connectionName = match.userName ||
                        match.user2?.name ||
                        match.user1?.name ||
                        match.user?.name;
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
            };
        }),
    ];

    const upcomingItems = allItems
        .filter(item => {
            // Safely parse date considering UTC string from backend
            const itemDate = new Date(item.date);
            const nowTime = now.getTime();

            // Etkinlikler ve Toplantılar için 2 saat (7200000 ms) tolerans
            const MathToleranceMs = 2 * 60 * 60 * 1000;
            const expirationTime = itemDate.getTime() + MathToleranceMs;

            return expirationTime > nowTime;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    useEffect(() => {
        const eventsNeedingFeedback = needsFeedback();
        if (eventsNeedingFeedback.length > 0) {
            setFeedbackEvent(eventsNeedingFeedback[0]);
            setShowFeedbackModal(true);
        }
    }, []);

    const renderAnnouncementDescription = (desc) => {
        if (!desc) return null;

        // "Son başvuru: ..." formatı (mentorship / competition)
        if (desc.toLowerCase().startsWith('son başvuru:')) {
            const dateStr = desc.replace(/son başvuru:/i, '').trim();
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    <Clock size={14} />
                    <span style={{ fontWeight: '600' }}>Son başvuru: {dateStr}</span>
                </div>
            );
        }

        // "... tarihinde açılacak" formatı (mentorship)
        if (desc.includes('tarihinde açılacak')) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    <Calendar size={14} />
                    <span style={{ fontWeight: '600' }}>{desc}</span>
                </div>
            );
        }

        // "Başvuru: ... - ..." formatı (mentorship date range)
        if (desc.toLowerCase().startsWith('başvuru:')) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    <Calendar size={14} />
                    <span style={{ fontWeight: '600' }}>{desc}</span>
                </div>
            );
        }

        // "01 Mart 2026 14:00 - İstanbul" (event format)
        const parts = desc.split(' - ');
        if (parts.length === 2) {
            const dateTime = parts[0];
            const location = parts[1];

            // Extract time if it ends with HH:mm
            const timeMatch = dateTime.match(/(\d{2}:\d{2})$/);
            if (timeMatch) {
                const time = timeMatch[1];
                const date = dateTime.replace(time, '').trim();
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                            <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                            <span>{date}</span>
                            <Clock size={14} style={{ color: 'var(--color-primary)', marginLeft: 'var(--spacing-xs)' }} />
                            <span>{time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                            <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                            <span style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%'
                            }}>{location}</span>
                        </div>
                    </div>
                );
            }

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                        <span>{dateTime}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                        <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                        }}>{location}</span>
                    </div>
                </div>
            );
        }

        // Default text
        return (
            <p style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 0,
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}>
                {desc}
            </p>
        );
    };

    const handleFeedbackSubmit = (feedbackData) => {
        submitFeedback(feedbackEvent.id, feedbackData);
        setShowFeedbackModal(false);
        setFeedbackEvent(null);
    };

    return (
        <div className="page home-page">
            {/* Credit Toast Notification */}
            {creditToast && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    color: 'var(--color-text-on-accent)',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: '0 8px 24px rgba(139,92,246,0.4)',
                    zIndex: 2000,
                    animation: 'slideDown 0.4s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                }}>
                    ⚡ +{creditToast} kredi kazandın! Seri devam ediyor 🔥
                </div>
            )}
            <div className="container">
                {/* Hero Header with Profile Picture and Welcome Card */}
                <div className="hero-card">
                    {/* Welcome Section */}
                    <div className="hero-welcome">
                            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: 0 }}>
                                {user ? (
                                    <span>Merhaba{user.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋</span>
                                ) : (
                                    <span>Bondle'a Hoş Geldin! 👋</span>
                                )}
                                {user?.role === 'campus_ambassador' && (
                                    <span style={{
                                        fontSize: '14px',
                                        background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                        color: '#fff',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontWeight: '800',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        letterSpacing: '0.5px',
                                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                                    }}>
                                        <Shield size={16} fill="#fff" /> <span style={{ WebkitTextFillColor: '#fff' }}>Kampüs Elçisi</span>
                                    </span>
                                )}
                                {user?.role === 'mentor' && (
                                    <span style={{
                                        fontSize: '14px',
                                        background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                                        color: '#fff',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontWeight: '800',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        letterSpacing: '0.5px',
                                        boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
                                    }}>
                                        <Shield size={16} fill="#fff" /> <span style={{ WebkitTextFillColor: '#fff' }}>Mentor</span>
                                    </span>
                                )}
                                {(user?.team || user?.branch || user?.isBranchRepresentative) && (
                                    <span style={{
                                        fontSize: '12px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3b82f6',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                        border: '1px solid rgba(59, 130, 246, 0.3)'
                                    }}>
                                        {user?.isBranchRepresentative
                                            ? `${user.branch ? (user.branch.includes('Bondle') ? user.branch : `Bondle ${user.branch}`) : ''} - İl Temsilcisi`.trim()
                                            : `${user.branch ? user.branch : ''} ${user.team ? `- ${user.team}` : ''}`
                                        }
                                    </span>
                                )}
                            </h1>
                        <div className="hero-welcome-sub" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                            <p className="text-secondary" style={{ marginBottom: 0, fontSize: 'var(--font-size-sm)' }}>
                                {user 
                                    ? "Bondle'de bugün neler yapacaksın?" 
                                    : "Bondle, kariyerini şekillendirebileceğin, yeni insanlarla tanışıp projelere katılabileceğin yeni nesil bir topluluk ve networking platformudur."}
                            </p>
                            {user && (isPremium() ? (
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    background: 'var(--color-premium-gradient)',
                                    borderRadius: 'var(--radius-full)',
                                    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)'
                                }}>
                                    <Star size={14} fill="#000" color="#000" />
                                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', color: '#000' }}>Premium</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/premium')}
                                    className="btn-premium-small"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)',
                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                        borderRadius: 'var(--radius-full)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Star size={14} fill="#000" color="#000" />
                                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', color: '#000' }}>Premium Ol</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats, Bell & Profile - Action Bar */}
                    <div className="hero-actions">
                        {/* Engagement Stats Bar */}
                        {(engagementData || (user && (user.team || user.branch))) && (
                            <div className="engagement-stats-bar">
                                {/* Streak */}
                                {engagementData && (
                                    <>
                                        <div 
                                            className="stat-item"
                                            onClick={() => navigate('/leaderboard')}
                                            title="Liderlik Tablosu"
                                        >
                                            <span className="stat-icon">
                                                {engagementData.streak.currentStreak >= 7 ? '⚡' : engagementData.streak.currentStreak >= 3 ? '🔥' : '🌱'}
                                            </span>
                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                                <span className="stat-value">{engagementData.streak.currentStreak}</span>
                                                <span className="stat-label">Seri</span>
                                            </div>
                                        </div>

                                        {/* Challenges */}
                                        <div 
                                            className="stat-item"
                                            onClick={() => setShowChallenges(true)}
                                            title="Haftalık Görevler"
                                        >
                                            <span className="stat-icon">🎯</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                                <span className="stat-value">
                                                    {engagementData.challenges.filter(c => c.completed).length}/{engagementData.challenges.length}
                                                </span>
                                                <span className="stat-label">Görev</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Notification Bell */}
                        {user && (
                            <button
                                className={`notification-bell-btn hero-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                                onClick={() => navigate('/notifications')}
                                aria-label="Bildirimler"
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    background: 'var(--color-subtle-bg)',
                                    border: '1px solid var(--color-subtle-border)',
                                    borderRadius: 'var(--radius-xl)',
                                    flexShrink: 0
                                }}
                            >
                                <Bell />
                                {unreadCount > 0 && (
                                    <span className="notification-badge" style={{ top: '12px', right: '12px' }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {!user && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => navigate('/login')}
                                    style={{ fontSize: '13px', padding: '6px 14px' }}
                                >
                                    Giriş Yap
                                </button>
                            </div>
                        )}

                        {/* Profile Picture */}
                        <div className="user-avatar-wrapper">
                            <UserAvatar 
                                user={user} 
                                size="lg" 
                                onClick={() => navigate('/profile')}
                                style={{ 
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    border: '3px solid rgba(139, 92, 246, 0.3)'
                                }}
                            />
                        </div>
                    </div>
                </div>
                
            <DailyInterviewWidget user={user} />

            <RequireAuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                title={authModalContent.title}
                message={authModalContent.message}
                icon={authModalContent.icon}
            />

            {/* Görevlerim Modal */}
            {showTasksModal && (
                <div className="modal-overlay" onClick={() => setShowTasksModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Target size={20} color="#10b981" />
                                <h2 style={{ margin: 0 }}>Görevlerim</h2>
                            </div>
                            <button className="btn-icon" onClick={() => setShowTasksModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {myTasks.length === 0 ? (
                                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px' }}>Henüz atanmış bir görev bulunmuyor.</p>
                            ) : (
                                myTasks.map(task => {
                                    // Parse or init table data
                                    let currentTable = taskNotes[task.id]?.tableData || task.tableData;
                                    if (!currentTable || Array.isArray(currentTable)) {
                                        // Migration from old or init new
                                        currentTable = {
                                            headers: ['Sütun 1', 'Sütun 2', 'Sütun 3'],
                                            rows: Array.isArray(currentTable) && currentTable.length > 0
                                                ? currentTable.map(r => [r.col1 || '', r.col2 || '', r.col3 || ''])
                                                : [['', '', '']]
                                        };
                                    }

                                    return (
                                        <div key={task.id} className="card" style={{ padding: 'var(--spacing-lg)', borderLeft: task.isCompleted ? '4px solid #10b981' : '4px solid #f59e0b', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div>
                                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {task.title}
                                                        {task.isCompleted && <CheckCircle size={16} color="#10b981" />}
                                                    </h3>
                                                    {task.description && <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>{task.description}</p>}
                                                </div>
                                                <button 
                                                    className="btn btn-sm"
                                                    style={{ backgroundColor: task.isCompleted ? 'var(--color-bg-tertiary)' : '#10b981', color: task.isCompleted ? 'var(--color-text-primary)' : '#fff', border: 'none' }}
                                                    onClick={async () => {
                                                        try {
                                                            const newStatus = !task.isCompleted;
                                                            const currentNotes = taskNotes[task.id]?.notes ?? task.notes ?? '';
                                                            await api.completeTask(task.id, { isCompleted: newStatus, notes: currentNotes, tableData: currentTable });
                                                            setMyTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: newStatus } : t));
                                                            setToastConfig({ isOpen: true, message: newStatus ? 'Görev tamamlandı!' : 'Görev durumu güncellendi.', type: 'success' });
                                                        } catch(e) { setToastConfig({ isOpen: true, message: 'Hata: ' + e.message, type: 'error' }); }
                                                    }}
                                                >
                                                    {task.isCompleted ? 'Tamamlanmayı Kaldır' : 'Tamamla'}
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                                <div>
                                                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Görev Notu / Açıklama:</label>
                                                    <textarea 
                                                        className="form-input-modern"
                                                        rows="3"
                                                        placeholder="Bu görevle ilgili neler yaptın?"
                                                        value={taskNotes[task.id]?.notes !== undefined ? taskNotes[task.id].notes : (task.notes || '')}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setTaskNotes(prev => ({ ...prev, [task.id]: { ...prev[task.id], notes: val } }));
                                                        }}
                                                        onBlur={async () => {
                                                            try {
                                                                const currentNotes = taskNotes[task.id]?.notes;
                                                                if (currentNotes !== undefined) {
                                                                    await api.completeTask(task.id, { isCompleted: task.isCompleted, notes: currentNotes, tableData: currentTable });
                                                                }
                                                            } catch(e) {}
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Excel Tablosu (Özet Veri):</label>
                                                    <div style={{ overflowX: 'auto', background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                                                        <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr>
                                                                    {currentTable.headers.map((header, hIdx) => (
                                                                        <th key={hIdx} style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                                                                            <input
                                                                                type="text"
                                                                                className="form-input-modern"
                                                                                style={{ padding: '4px 8px', fontWeight: 'bold', background: 'transparent', border: '1px solid transparent' }}
                                                                                value={header}
                                                                                placeholder={`Sütun ${hIdx + 1}`}
                                                                                onChange={(e) => {
                                                                                    const newTable = { ...currentTable, headers: [...currentTable.headers] };
                                                                                    newTable.headers[hIdx] = e.target.value;
                                                                                    setTaskNotes(prev => ({ ...prev, [task.id]: { ...prev[task.id], tableData: newTable } }));
                                                                                }}
                                                                                onBlur={async () => {
                                                                                    try {
                                                                                        const currentNotes = taskNotes[task.id]?.notes ?? task.notes;
                                                                                        await api.completeTask(task.id, { isCompleted: task.isCompleted, notes: currentNotes, tableData: currentTable });
                                                                                    } catch(e) {}
                                                                                }}
                                                                            />
                                                                        </th>
                                                                    ))}
                                                                    <th style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', width: '40px' }}>
                                                                        <button 
                                                                            title="Sütun Ekle"
                                                                            className="btn-icon"
                                                                            onClick={() => {
                                                                                const newTable = { 
                                                                                    headers: [...currentTable.headers, `Sütun ${currentTable.headers.length + 1}`],
                                                                                    rows: currentTable.rows.map(r => [...r, ''])
                                                                                };
                                                                                setTaskNotes(prev => ({ ...prev, [task.id]: { ...prev[task.id], tableData: newTable } }));
                                                                            }}
                                                                        >
                                                                            <Plus size={16} />
                                                                        </button>
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {currentTable.rows.map((row, rIdx) => (
                                                                    <tr key={rIdx}>
                                                                        {row.map((cell, cIdx) => (
                                                                            <td key={cIdx} style={{ padding: '4px' }}>
                                                                                <input 
                                                                                    type="text" 
                                                                                    className="form-input-modern" 
                                                                                    style={{ padding: '6px' }} 
                                                                                    value={cell} 
                                                                                    onChange={(e) => {
                                                                                        const newTable = { ...currentTable, rows: [...currentTable.rows] };
                                                                                        newTable.rows[rIdx] = [...newTable.rows[rIdx]];
                                                                                        newTable.rows[rIdx][cIdx] = e.target.value;
                                                                                        setTaskNotes(prev => ({ ...prev, [task.id]: { ...prev[task.id], tableData: newTable } }));
                                                                                    }} 
                                                                                    onBlur={async () => {
                                                                                        try {
                                                                                            const currentNotes = taskNotes[task.id]?.notes ?? task.notes;
                                                                                            await api.completeTask(task.id, { isCompleted: task.isCompleted, notes: currentNotes, tableData: currentTable });
                                                                                        } catch(e) {}
                                                                                    }} 
                                                                                />
                                                                            </td>
                                                                        ))}
                                                                        <td></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        <button 
                                                            className="btn btn-sm btn-outline" 
                                                            style={{ marginTop: '12px' }}
                                                            onClick={() => {
                                                                const newTable = {
                                                                    ...currentTable,
                                                                    rows: [...currentTable.rows, new Array(currentTable.headers.length).fill('')]
                                                                };
                                                                setTaskNotes(prev => ({ ...prev, [task.id]: { ...prev[task.id], tableData: newTable } }));
                                                            }}
                                                        >
                                                            + Satır Ekle
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Smart Recommendations */}
                {(smartRecommendations.length > 0 || aiEventsLoading) && (
                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            marginBottom: 'var(--spacing-md)' 
                        }}>
                            <Zap size={20} fill="#f59e0b" color="#f59e0b" />
                            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', margin: 0 }}>Sana Özel Fırsatlar</h2>
                        </div>

                        {aiEventsLoading ? (
                            <div style={{ 
                                background: 'var(--color-bg-secondary)', 
                                borderRadius: 'var(--radius-xl)', 
                                padding: 'var(--spacing-xl)',
                                textAlign: 'center',
                                border: '1px dashed var(--color-border)'
                            }}>
                                <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
                                <p className="text-secondary">Sana en uygun fırsatları analiz ediyoruz...</p>
                            </div>
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                gap: 'var(--spacing-md)', 
                                overflowX: 'auto', 
                                paddingBottom: 'var(--spacing-sm)',
                                scrollSnapType: 'x mandatory',
                                WebkitOverflowScrolling: 'touch'
                            }} className="hide-scrollbar">
                                {smartRecommendations.map((rec, index) => {
                                    const typeConfig = {
                                        event: { icon: <Calendar size={14} />, label: 'ETKİNLİK', color: '#8b5cf6', path: `/events/${rec.item.id}` },
                                        mentorship: { icon: <Users size={14} />, label: 'MENTORLUK', color: '#06b6d4', path: '/mentorship' },
                                        competition: { icon: <Zap size={14} />, label: 'YARIŞMA', color: '#f59e0b', path: '/events' }
                                    }[rec.type] || { icon: <Star size={14} />, label: 'ÖNERİ', color: '#8b5cf6', path: '/' };

                                    return (
                                        <div 
                                            key={`${rec.type}-${rec.item.id}`}
                                            onClick={() => navigate(typeConfig.path)}
                                            style={{
                                                minWidth: '280px',
                                                maxWidth: '280px',
                                                background: 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--radius-xl)',
                                                overflow: 'hidden',
                                                border: '1px solid var(--color-border)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                scrollSnapAlign: 'start',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.borderColor = typeConfig.color;
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                            }}
                                        >
                                            <div style={{ 
                                                height: '120px', 
                                                background: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${rec.item.imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500'})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                padding: 'var(--spacing-md)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div style={{ 
                                                    background: typeConfig.color, 
                                                    color: 'var(--color-text-on-accent)', 
                                                    padding: '4px 10px', 
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '10px',
                                                    fontWeight: '800',
                                                    alignSelf: 'flex-start',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    boxShadow: `0 2px 8px ${typeConfig.color}44`
                                                }}>
                                                    {typeConfig.icon} {typeConfig.label}
                                                </div>
                                                <h3 style={{ color: 'var(--color-text-on-accent)', fontSize: '0.95rem', fontWeight: '700', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                                    {rec.item.title}
                                                </h3>
                                            </div>
                                            <div style={{ padding: 'var(--spacing-md)', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <p style={{ 
                                                    margin: 0, 
                                                    fontSize: '0.85rem', 
                                                    color: 'var(--color-text-primary)', 
                                                    background: `${typeConfig.color}11`,
                                                    padding: '10px',
                                                    borderRadius: 'var(--radius-lg)',
                                                    borderLeft: `3px solid ${typeConfig.color}`,
                                                    lineHeight: '1.4',
                                                    fontStyle: 'italic'
                                                }}>
                                                    "{rec.recommendationReason}"
                                                </p>
                                                <div style={{ 
                                                    marginTop: 'auto', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'flex-end',
                                                    fontSize: '0.75rem',
                                                    color: typeConfig.color,
                                                    fontWeight: '700'
                                                }}>
                                                    İncele <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Admin/Branch Rep/Campus Ambassador Quick Access */}
                {(user?.role === 'admin' || user?.isBranchRepresentative || user?.role === 'campus_ambassador') && (
                    <Link 
                        to="/admin" 
                        style={{ 
                            display: 'block', 
                            background: 'var(--color-subtle-bg)', 
                            border: '1px solid var(--color-subtle-border-hover)', 
                            borderRadius: 'var(--radius-xl)', 
                            padding: 'var(--spacing-lg)', 
                            marginBottom: 'var(--spacing-xl)',
                            textDecoration: 'none',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: 'var(--radius-lg)', 
                                    background: 'var(--color-accent-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    <TrendingUp size={24} color="#fff" />
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                                        {user?.role === 'admin' ? 'Admin Paneli' : (user?.role === 'campus_ambassador' ? 'Kampüs Elçisi Paneli' : 'Temsilci Paneli')}
                                    </h3>
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 0 }}>
                                        {user?.role === 'admin' ? 'Etkinlik ekle, ödemeleri onayla, kullanıcıları yönet' : (user?.role === 'campus_ambassador' ? 'Davet linklerini kopyala ve performansını takip et' : 'Etkinlik ekle, görev ata, kullanıcıları yönet')}
                                    </p>
                                </div>
                            </div>
                            <div style={{ 
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: 'var(--color-accent-primary)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-text-on-accent)',
                                fontWeight: '600',
                                fontSize: 'var(--font-size-sm)'
                            }}>
                                Yönet →
                            </div>
                        </div>
                    </Link>
                )}


                {/* Görevlerim Quick Access - shown to users with team/branch, but not branch reps (they have it in their panel) */}
                {user && (user.team || user.branch) && !user.isBranchRepresentative && (
                    <div
                        onClick={() => navigate('/my-tasks')}
                        style={{
                            display: 'block',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(109, 40, 217, 0.1) 100%)',
                            border: '2px solid #8b5cf6',
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--spacing-lg)',
                            marginBottom: 'var(--spacing-xl)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                                    position: 'relative'
                                }}>
                                    <Target size={24} color="#fff" />
                                    {myTasks.filter(t => !t.isCompleted).length > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-6px',
                                            right: '-6px',
                                            background: '#ef4444',
                                            color: '#fff',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            border: '2px solid var(--color-bg-primary)'
                                        }}>
                                            {myTasks.filter(t => !t.isCompleted).length}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                                        Ekip Görevlerim
                                    </h3>
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 0 }}>
                                        {myTasks.filter(t => !t.isCompleted).length > 0
                                            ? `${myTasks.filter(t => !t.isCompleted).length} bekleyen görevin var`
                                            : 'Tüm görevler tamamlandı 🎉'}
                                    </p>
                                </div>
                            </div>
                            <div style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: '#8b5cf6',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-text-on-accent)',
                                fontWeight: '600',
                                fontSize: 'var(--font-size-sm)'
                            }}>
                                Görüntüle →
                            </div>
                        </div>
                    </div>
                )}

                <div className="quick-access-grid">
                    {/* Kulüpler (Sadece Masaüstü) */}
                    <div
                        className="card quick-access-card desktop-only-card"
                        onClick={() => navigate('/clubs')}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(6,182,212,0.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div className="qa-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                            <Users className="qa-svg" color="#fff" />
                        </div>
                        <div className="qa-title">Kulüpleri Keşfet</div>
                        <div className="text-secondary qa-desc">
                            İlgi alanlarına göre katıl
                        </div>
                    </div>

                    {/* Topluluk (Sadece Mobil) */}
                    <div
                        className="card quick-access-card mobile-only-card"
                        onClick={() => handleProtectedNavigation('/community')}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(6,182,212,0.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div className="qa-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                            <MessageCircle className="qa-svg" color="#fff" />
                        </div>
                        <div className="qa-title">Topluluk</div>
                        <div className="text-secondary qa-desc">
                            Sorular sor, tartışmalara katıl
                        </div>
                    </div>

                    {/* Mentorluk */}
                    <div
                        className="card quick-access-card"
                        onClick={() => navigate('/mentorship')}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(217,70,239,0.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div className="qa-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', fontSize: '22px' }}>
                            🎓
                        </div>
                        <div className="qa-title">Mentorluk</div>
                        <div className="text-secondary qa-desc">
                            Uzman mentörlerden rehberlik al
                        </div>
                    </div>

                    {/* AI Kariyer Koçu */}
                    <div
                        className="card quick-access-card"
                        onClick={() => handleProtectedNavigation('/premium/ai-coach', 'ai-coach')}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(251,191,36,0.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div className="qa-icon" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                            <Sparkles className="qa-svg" color="#fff" />
                        </div>
                        <div className="qa-title">AI Kariyer Koçu</div>
                        <div className="text-secondary qa-desc">
                            Mülakat pratiği & CV analizi
                        </div>
                    </div>

                    {/* Proje Ortağı — Premium Feature */}
                    <div
                        className="card quick-access-card"
                        onClick={() => handleProtectedNavigation('/projects', 'projects')}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        style={{ position: 'relative', overflow: 'visible' }}
                    >
                        <div className="qa-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', fontSize: '22px' }}>
                            🚀
                        </div>
                        <div className="qa-title">Proje Ortağı</div>
                        <div className="text-secondary qa-desc">
                            Takım kur, proje geliştir
                        </div>
                    </div>
                </div>

                {/* Announcements Section (Duyurular) */}
                {announcements.length > 0 && (
                    <div className="section announcements-section" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                        <h2 style={{
                            marginBottom: 'var(--spacing-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)'
                        }}>
                            <span style={{
                                width: '4px',
                                height: '24px',
                                background: 'var(--color-accent-gradient)',
                                borderRadius: 'var(--radius-full)'
                            }}></span>
                            Duyurular
                        </h2>
                        <div style={{ position: 'relative' }}>
                            {/* Left arrow removed per user request */}
                            {/* Right Arrow */}
                            {announcements.length > 1 && (
                                <button
                                    className="carousel-arrow"
                                    onClick={() => announcementsRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                                    style={{
                                        position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
                                        border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--color-text-on-accent)', cursor: 'pointer', zIndex: 5,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.3s',
                                    }}
                                >
                                    <ChevronRight size={22} />
                                </button>
                            )}
                            <div ref={announcementsRef} className="announcements-scroll" style={{
                                display: 'flex',
                                gap: 'var(--spacing-md)',
                                overflowX: 'auto',
                                paddingBottom: 'var(--spacing-md)',
                                scrollbarWidth: 'thin',
                                WebkitOverflowScrolling: 'touch'
                            }}>
                                {announcements.map((announcement) => (
                                    <Link
                                        key={announcement.id}
                                        to={announcement.linkTo || '#'}
                                        className="announcement-card"
                                        style={{
                                            minWidth: '280px',
                                            maxWidth: '280px',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-xl)',
                                            overflow: 'hidden',
                                            textDecoration: 'none',
                                            border: '1px solid var(--color-bg-tertiary)',
                                            transition: 'all 0.3s ease',
                                            flexShrink: 0,
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                                            const img = e.currentTarget.querySelector('.announcement-bg');
                                            if (img) img.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                            const img = e.currentTarget.querySelector('.announcement-bg');
                                            if (img) img.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <div style={{ width: '100%', height: '140px', overflow: 'hidden', position: 'relative' }}>
                                            <div
                                                className="announcement-bg"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    background: `url(${announcement.image})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    transition: 'transform 0.5s ease',
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: 'var(--spacing-sm)',
                                                left: 'var(--spacing-sm)',
                                                display: 'flex',
                                                gap: '6px'
                                            }}>
                                                <div style={{
                                                    padding: '4px 10px',
                                                    background: 'var(--color-primary)',
                                                    borderRadius: 'var(--radius-full)',
                                                    color: 'var(--color-text-on-accent)',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                }}>
                                                    Duyuru
                                                </div>
                                                {announcement.city && (
                                                    <div style={{
                                                        padding: '4px 10px',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        backdropFilter: 'blur(4px)',
                                                        borderRadius: 'var(--radius-full)',
                                                        color: 'var(--color-text-on-accent)',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <MapPin size={10} />
                                                        {announcement.city}
                                                    </div>
                                                )}
                                                {announcement.paymentType === 'free' && (
                                                    <div style={{
                                                        padding: '4px 10px',
                                                        background: 'rgba(34, 197, 94, 0.9)',
                                                        backdropFilter: 'blur(4px)',
                                                        borderRadius: 'var(--radius-full)',
                                                        color: '#fff',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        textTransform: 'uppercase',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }}>
                                                        Ücretsiz
                                                    </div>
                                                )}
                                                {announcement.paymentType === 'paid' && (
                                                    <div style={{
                                                        padding: '4px 10px',
                                                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                        backdropFilter: 'blur(4px)',
                                                        borderRadius: 'var(--radius-full)',
                                                        color: '#000',
                                                        fontSize: '10px',
                                                        fontWeight: '900',
                                                        textTransform: 'uppercase',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }}>
                                                        ₺{isPremium && announcement.premiumPrice ? announcement.premiumPrice : announcement.price}
                                                    </div>
                                                )}
                                            </div>
                                            {announcement.isPinned && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 'var(--spacing-sm)',
                                                    right: 'var(--spacing-sm)',
                                                    width: '24px',
                                                    height: '24px',
                                                    background: 'var(--color-premium-gradient)',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                                }}>
                                                    <Star size={14} fill="#000" color="#000" />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: 'var(--spacing-md)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{
                                                fontSize: 'var(--font-size-md)',
                                                fontWeight: '700',
                                                color: 'var(--color-text-primary)',
                                                marginBottom: 'var(--spacing-sm)',
                                                lineHeight: '1.3'
                                            }}>
                                                {announcement.title}
                                            </h3>
                                            <div style={{ marginTop: 'auto' }}>
                                                {renderAnnouncementDescription(announcement.description)}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Upcoming Events & Meetings */}
                <div className="section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                        <h2>Yaklaşan Etkinlikler & Toplantılar</h2>
                        <Link to="/activities" className="text-link">
                            Tümünü Gör →
                        </Link>
                    </div>
                    {upcomingItems.length > 0 ? (
                        <div className="upcoming-events" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-md)'
                        }}>
                            {upcomingItems.map((item) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    className="event-item"
                                    onClick={() => item.type === 'event' ? navigate(`/events/${item.id}`) : null}
                                    style={{
                                        cursor: item.type === 'event' ? 'pointer' : 'default',
                                        background: 'var(--color-card-bg)',
                                        backdropFilter: 'blur(24px)',
                                        WebkitBackdropFilter: 'blur(24px)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: 'var(--spacing-md)',
                                        border: '1px solid var(--color-card-border)',
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
                                        minWidth: '70px', height: '70px', 
                                        background: item.type === 'event' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
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
                                                    className="btn btn-danger-outline btn-sm"
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
                                                    className="btn btn-danger-outline btn-sm"
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
                    ) : (
                        <div className="empty-state">
                            <Calendar size={48} />
                            {!user ? (
                                <>
                                    <p style={{ marginBottom: 'var(--spacing-md)' }}>Yaklaşan etkinliklerinizi ve toplantılarınızı görmek için giriş yapmalısınız.</p>
                                    <button 
                                        className="btn btn-primary btn-sm" 
                                        onClick={() => navigate('/login')}
                                    >
                                        Giriş Yap
                                    </button>
                                </>
                            ) : (
                                <p>Henüz yaklaşan bir etkinlik veya toplantınız yok</p>
                            )}
                        </div>
                    )}
                </div>

            {/* Weekly Challenges Modal */}
            {showChallenges && engagementData && (
                <div className="engagement-modal-overlay" onClick={() => setShowChallenges(false)}>
                    <div className="engagement-modal" onClick={e => e.stopPropagation()}>
                        <div className="engagement-modal-header">
                            <h3>🎯 Bu Haftaki Görevler</h3>
                            <button className="engagement-modal-close" onClick={() => setShowChallenges(false)}>✕</button>
                        </div>
                        <p className="engagement-modal-subtitle">
                            Her hafta Pazartesi sıfırlanır. Tamamlayarak kredi kazan!
                        </p>
                        <div className="challenge-list">
                            {engagementData.challenges.map(ch => (
                                <div 
                                    key={ch.key} 
                                    className={`challenge-item${ch.completed ? ' completed' : ''}`}
                                    onClick={() => handleChallengeClick(ch.key, ch.completed)}
                                    style={{ cursor: ch.completed ? 'default' : 'pointer' }}
                                >
                                    <div className="challenge-check">
                                        {ch.completed ? '✅' : '⬜'}
                                    </div>
                                    <div className="challenge-info">
                                        <div className="challenge-label">{ch.label}</div>
                                        {ch.completed && ch.completedAt && (
                                            <div className="challenge-date">
                                                {new Date(ch.completedAt).toLocaleDateString('tr-TR')}
                                            </div>
                                        )}
                                    </div>
                                    {/* Bireysel kredi etiketleri kaldırıldı */}
                                </div>
                            ))}
                        </div>
                        <div className="challenge-total" style={{ textAlign: 'center', background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '12px', marginTop: '16px' }}>
                            {engagementData.challenges.filter(c => c.completed).length === engagementData.challenges.length 
                                ? <strong style={{ color: '#22c55e' }}>🎉 Tüm görevler tamamlandı! (Kazanılan: 15 ⚡)</strong>
                                : <strong>{engagementData.challenges.length - engagementData.challenges.filter(c => c.completed).length} görev kaldı. Tamamla ve 15 ⚡ kazan!</strong>}
                        </div>
                    </div>
                </div>
            )}

            {/* Badges Modal */}
            {showBadges && engagementData && (
                <div className="engagement-modal-overlay" onClick={() => { setShowBadges(false); api.markBadgesSeen().catch(() => {}); }}>
                    <div className="engagement-modal" onClick={e => e.stopPropagation()}>
                        <div className="engagement-modal-header">
                            <h3>🏅 Rozetlerim</h3>
                            <button className="engagement-modal-close" onClick={() => { setShowBadges(false); api.markBadgesSeen().catch(() => {}); }}>✕</button>
                        </div>
                        <p className="engagement-modal-subtitle">
                            Başarılarını topla ve profilinde göster!
                        </p>
                        <div className="badge-grid">
                            {engagementData.badges.map(b => {
                                const meta = BADGE_META[b.badge] || { emoji: '🏅', label: b.badge };
                                return (
                                    <div 
                                        key={b.badge} 
                                        className={`badge-item${b.earned ? ' earned' : ' locked'}`}
                                        onClick={() => setSelectedBadge({ ...b, meta })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="badge-emoji">{meta.emoji}</div>
                                        <div className="badge-name">{meta.label}</div>
                                        {b.earned && b.earnedAt && (
                                            <div className="badge-date">
                                                {new Date(b.earnedAt).toLocaleDateString('tr-TR')}
                                            </div>
                                        )}
                                        {!b.earned && <div className="badge-locked-overlay">🔒</div>}
                                        {b.earned && !b.seen && <div className="badge-new-dot" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Selected Badge Detail Modal */}
                    {selectedBadge && (
                        <div className="badge-detail-modal-overlay" onClick={(e) => { e.stopPropagation(); setSelectedBadge(null); }}>
                            <div className="badge-detail-card" onClick={e => e.stopPropagation()}>
                                <div className="badge-detail-header">
                                    <div className="badge-detail-emoji">{selectedBadge.meta.emoji}</div>
                                    <button className="badge-detail-close" onClick={() => setSelectedBadge(null)}>✕</button>
                                </div>
                                <div className="badge-detail-content">
                                    <h3 className="badge-detail-title">{selectedBadge.meta.label}</h3>
                                    <p className="badge-detail-desc">{selectedBadge.description}</p>
                                    
                                    <div className="badge-detail-status">
                                        {selectedBadge.earned ? (
                                            <div className="status-earned">
                                                <div className="status-icon">✨</div>
                                                <div className="status-text">
                                                    <strong>Kazanıldı</strong>
                                                    <span>{new Date(selectedBadge.earnedAt).toLocaleDateString('tr-TR')}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="status-locked">
                                                <div className="status-icon">🔒</div>
                                                <div className="status-text">
                                                    <strong>Kilitli</strong>
                                                    <span>Görevlere devam et!</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showFeedbackModal && feedbackEvent && (
                <FeedbackModal
                    event={feedbackEvent}
                    onSubmit={handleFeedbackSubmit}
                />
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
        </div>
    );
};

export default HomePage;





