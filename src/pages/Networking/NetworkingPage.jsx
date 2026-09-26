import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNetworking } from '../../contexts/NetworkingContext';
import { Bell, Search, Sparkles, Filter, Film, UserPlus, Users, Zap, Calendar, X, MapPin, ChevronDown, ChevronRight, ChevronLeft, Check, Star, Shield, AlertTriangle, Clock, Trash2 } from 'lucide-react';
import SuggestedUserCard from '../../components/SuggestedUserCard';
import UserAvatar from '../../components/UserAvatar';
import PremiumBadge from '../../components/PremiumBadge';
import { interestCategories } from '../../data/interestCategories.js';
import api from '../../services/api';
import './NetworkingPage.css';
import { BADGE_META } from '../Home/HomePage';
import UserProfileModal from '../../components/UserProfileModal';
import Toast from '../../components/Toast';

const getUnreadCount = () => 0; // Notification mock removed

const NetworkingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { credits, connections, sendConnectionRequest, cancelConnectionRequest, incomingRequests = [], incomingMeetings = [], outgoingMeetings = [], acceptConnectionRequest, rejectConnectionRequest, matchHistory = [], cancelMeetingReq, rescheduleMeetingReq, refreshNetworkingData } = useNetworking();

    // Toast state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToastMessage = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const handleAddConnection = async (targetUser) => {
        const result = await sendConnectionRequest(targetUser.id);
        if (result.success) {
            setSelectedUser(null);
            showToastMessage('İstek gönderildi!', 'success');
        } else {
            showToastMessage(`İstek gönderilemedi: ${result.error}`, 'error');
        }
    };

    const handleCancelRequest = async (matchId) => {
        try {
            const result = await cancelConnectionRequest(matchId);
            if (!result.success) {
                console.error('Cancel failed:', result.error);
                throw new Error(result.error);
            }
            // No reload needed - context updates state automatically
        } catch (error) {
            console.error('Cancel request error:', error);
            throw error;
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [scrollContainerRef, setScrollContainerRef] = useState(null);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [aiLoading, setAiLoading] = useState(true);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [referralInfo, setReferralInfo] = useState({ code: '', loading: true });
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [rescheduleModal, setRescheduleModal] = useState({ isOpen: false, meeting: null, dateTime: '', notes: '' });
    const [referralInput, setReferralInput] = useState('');
    const [referralStatus, setReferralStatus] = useState({ loading: false, error: null, success: false });

    // Reporting & Blocking States (must be declared before scroll useEffect below)
    const [showReportModal, setShowReportModal] = useState(false);


    const location = useLocation();
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        return ['discover', 'connections', 'requests'].includes(tab) ? tab : 'discover';
    });
    const [discoveryView, setDiscoveryView] = useState('deck'); // 'grid', 'deck'
    const [currentDeckIndex, setCurrentDeckIndex] = useState(0);

    // Show toast passed via navigation state (e.g. from ScheduleMeetingPage)
    useEffect(() => {
        if (location.state?.toast) {
            showToastMessage(location.state.toast, 'success');
            // Clear state so toast doesn't re-show on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (['discover', 'connections', 'requests'].includes(tab) && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    // Lock body scroll when modals are open
    useEffect(() => {
        if (showReferralModal || showReportModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showReferralModal, showReportModal]);
    const [reportData, setReportData] = useState({
        userToReport: null,
        reason: 'other',
        details: '',
        submitting: false
    });

    useEffect(() => {
        document.title = 'Bondle | Network';
        const fetchReferral = async () => {
            try {
                const data = await api.getEngagementSummary();
                if (data && data.referralCode) {
                    setReferralInfo({ code: data.referralCode, loading: false });
                } else {
                    // If still empty, wait a bit and retry once
                    setTimeout(async () => {
                        const retryData = await api.getEngagementSummary();
                        setReferralInfo({ code: retryData.referralCode || '', loading: false });
                    }, 2000);
                }
            } catch (err) {
                console.error("Referral fetch error:", err);
                setReferralInfo({ code: '', loading: false });
            }
        };
        fetchReferral();
    }, []);

    const handleUseReferral = async (e) => {
        e.preventDefault();
        if (!referralInput.trim()) return;
        setReferralStatus({ loading: true, error: '', success: '' });
        try {
            const result = await api.useReferralCode(referralInput);
            if (result.success) {
                setReferralStatus({ loading: false, error: '', success: result.message });
                setTimeout(() => setShowReferralModal(false), 2000);
            } else {
                setReferralStatus({ loading: false, error: result.message, success: '' });
            }
        } catch (err) {
            setReferralStatus({ loading: false, error: 'Bir hata oluştu.', success: '' });
        }
    };

    const copyReferralCode = () => {
        if (!referralInfo.code) {
            showToastMessage('Referans kodun henüz hazır değil, lütfen sayfayı yenilemeyi dene.', 'error');
            return;
        }
        navigator.clipboard.writeText(referralInfo.code);
        showToastMessage(`Kopyalandı! Davet Kodun: ${referralInfo.code}`, 'success');
    };

    const { availableMatches, loading: contextLoading } = useNetworking();

    useEffect(() => {
        // Use available matches from context if already loaded to avoid double fetching
        if (availableMatches && !contextLoading) {
            setSuggestedUsers(availableMatches);
            setLoading(false);
        }
    }, [availableMatches, contextLoading]);

    useEffect(() => {
        const fetchAiSuggestions = async () => {
            try {
                const data = await api.getAiSuggestions();
                if (data && Array.isArray(data)) {
                    setAiSuggestions(data);
                }
            } catch (err) {
                console.error("AI Suggestions fetch error:", err);
            } finally {
                setAiLoading(false);
            }
        };
        fetchAiSuggestions();
    }, []);

    // Backend search: when user types, re-fetch from backend with search query (debounced)
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const data = await api.getAvailableUsers(searchQuery.trim() || undefined);
                if (Array.isArray(data)) {
                    setSuggestedUsers(data);
                }
            } catch (err) {
                console.error('Search fetch error:', err);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleScroll = (e) => {
        setShowLeftArrow(e.target.scrollLeft > 0);
    };

    // Turkish translation for interests using interestCategories data
    const interestMap = useMemo(() => {
        const map = {};
        interestCategories.forEach(cat => {
            map[cat.id] = { label: cat.label, emoji: cat.emoji };
        });
        return map;
    }, []);

    const translateInterest = (interest) => {
        const found = interestMap[interest];
        return found ? `${found.emoji} ${found.label}` : interest;
    };

    // Check if user is already a connection
    const isConnection = (userId) => {
        return connections?.some(c => 
            String(c.user1Id) === String(userId) || 
            String(c.user2Id) === String(userId) ||
            String(c.user1?.id) === String(userId) ||
            String(c.user2?.id) === String(userId)
        ) || false;
    };

    const getRequestStatus = (targetUserId) => {
        // Find if there is any match with this user
        const match = matchHistory.find(m =>
            (String(m.user1Id) === String(targetUserId) || String(m.user2Id) === String(targetUserId)) &&
            (m.status === 'pending' || m.status === 'PENDING') // Check both just in case
        );

        if (match) {
            // Check if we are the sender
            if (String(match.user1Id) === String(user?.id) || String(match.user1Id) === String(user?.sub)) {
                return 'sent';
            }
            return 'received';
        }
        return 'none';
    };

    const getMatchId = (targetUserId) => {
        const match = matchHistory.find(m =>
            (String(m.user1Id) === String(targetUserId) || String(m.user2Id) === String(targetUserId)) &&
            (m.status === 'pending' || m.status === 'PENDING')
        );
        return match?.id;
    };

    const filteredUsers = useMemo(() => {
        let filtered = [...suggestedUsers];

        // Merge AI suggestions
        if (aiSuggestions && aiSuggestions.length > 0) {
            const aiIds = new Set(aiSuggestions.map(a => a.user.id));
            filtered = filtered.map(u => ({
                ...u,
                isAiSuggestion: aiIds.has(u.id),
                aiReason: aiIds.has(u.id) ? aiSuggestions.find(a => a.user.id === u.id)?.reason : null
            }));

            // Add any AI suggestions that aren't in the suggestedUsers list
            const existingIds = new Set(filtered.map(u => u.id));
            const newAiUsers = aiSuggestions
                .filter(a => !existingIds.has(a.user.id))
                .map(a => ({ ...a.user, isAiSuggestion: true, aiReason: a.reason }));
            
            filtered = [...newAiUsers, ...filtered];
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(u =>
                u.name?.toLowerCase().includes(query) ||
                u.title?.toLowerCase().includes(query) ||
                u.profileId?.toLowerCase().includes(query)
            );
        }

        if (selectedInterests.length > 0) {
            filtered = filtered.filter(u => {
                const userInterests = u.interests || [];
                return selectedInterests.some(interest => userInterests.includes(interest));
            });
        }

        // Sort so AI suggestions appear first in the deck
        filtered.sort((a, b) => {
            if (a.isAiSuggestion && !b.isAiSuggestion) return -1;
            if (!a.isAiSuggestion && b.isAiSuggestion) return 1;
            return 0;
        });

        return filtered;
    }, [suggestedUsers, searchQuery, selectedInterests, aiSuggestions]);
    
    useEffect(() => {
        setCurrentDeckIndex(0);
    }, [searchQuery, selectedInterests]);

    const allInterests = useMemo(() => {
        const interests = new Set();
        suggestedUsers.forEach(u => {
            (u.interests || []).forEach(interest => interests.add(interest));
        });
        return Array.from(interests).sort();
    }, [suggestedUsers]);



    const handleScheduleMeeting = (targetUser) => {
        const conn = connections?.find(c => 
            String(c.user1Id) === String(targetUser.id) || 
            String(c.user2Id) === String(targetUser.id) ||
            String(c.user1?.id) === String(targetUser.id) ||
            String(c.user2?.id) === String(targetUser.id)
        );
        
        if (conn) {
            navigate(`/network/connections/${conn.id}/schedule`);
        } else {
            // No connection required — schedule directly by userId
            navigate(`/network/users/${targetUser.id}/schedule`);
        }
    };

    const handleAcceptRequest = async (request) => {
        const result = await acceptConnectionRequest(request.id);
        if (result.success) {
            showToastMessage(`${request.sender.name} ile bağlantı kuruldu!`, 'success');
        } else {
            showToastMessage(`Hata: ${result.error}`, 'error');
        }
    };

    const handleRejectRequest = async (request) => {
        await rejectConnectionRequest(request.id);
    };

    const handleWatchAd = () => {
        showToastMessage('Reklam izleme özelliği yakında aktif olacak!', 'info');
    };

    const handleInviteFriend = () => {
        setShowReferralModal(true);
    };

    const toggleInterestFilter = (interest) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleReportUser = (targetUser) => {
        setReportData({
            ...reportData,
            userToReport: targetUser,
            reason: 'other',
            details: ''
        });
        setShowReportModal(true);
        setSelectedUser(null); // Close the profile modal if open
    };

    const submitReport = async () => {
        if (!reportData.userToReport) return;
        setReportData(prev => ({ ...prev, submitting: true }));
        try {
            await api.reportUser(reportData.userToReport.id, reportData.reason, reportData.details);
            showToastMessage('Raporunuz başarıyla iletildi. İnceleme başlatılacaktır.', 'success');
            setShowReportModal(false);
        } catch (error) {
            console.error('Report error:', error);
            showToastMessage('Rapor iletilirken bir hata oluştu.', 'error');
        } finally {
            setReportData(prev => ({ ...prev, submitting: false }));
        }
    };

    const handleBlockUser = async (targetUser) => {
        const confirmed = window.confirm(`${targetUser.name} adlı kullanıcıyı engellemek istediğinizden emin misiniz?`);
        if (!confirmed) return;

        try {
            await api.blockUser(targetUser.id);
            showToastMessage('Kullanıcı engellendi. Artık birbirinizi göremeyeceksiniz.', 'success');
            window.location.reload(); 
        } catch (error) {
            console.error('Block error:', error);
            showToastMessage('Kullanıcı engellenirken bir hata oluştu.', 'error');
        }
    };

    const handleRemoveConnection = async (connectionId) => {
        if (!window.confirm('Bu bağlantıyı kaldırmak istediğinizden emin misiniz?')) return;
        
        try {
            await cancelConnectionRequest(connectionId);
            showToastMessage('Bağlantı silindi.', 'success');
            setSelectedUser(null);
        } catch (error) {
            showToastMessage('Bağlantı silinirken hata oluştu.', 'error');
        }
    };

    const isSearching = searchQuery.trim() !== '' || selectedInterests.length > 0;

    const getOtherUser = (connection) => {
        if (!connection.user1 || !connection.user2 || !user) {
            return null;
        }
        const currentUserId = user.id || user.sub;
        return String(connection.user1.id) === String(currentUserId)
            ? connection.user2
            : connection.user1;
    };

    const handleDeleteConnection = async (connectionId) => {
        if (!window.confirm('Bu bağlantıyı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/networking/connections/${connectionId}`);
            alert('Bağlantı silindi.');
            window.location.reload();
        } catch (error) {
            alert('Bağlantı silinirken hata oluştu.');
        }
    };

    const handleAcceptMeeting = async (meeting) => {
        try {
            await api.acceptMeeting(meeting.id);
            showToastMessage('Toplantı kabul edildi.');
            refreshNetworkingData();
        } catch (error) {
            showToastMessage('Bir hata oluştu.', 'error');
        }
    };

    const handleRejectMeeting = async (meeting) => {
        if (!window.confirm('Bu toplantı isteğini reddetmek istediğinize emin misiniz?')) return;
        try {
            await api.rejectMeeting(meeting.id);
            showToastMessage('Toplantı reddedildi.', 'error');
            refreshNetworkingData();
        } catch (error) {
            showToastMessage('Bir hata oluştu.', 'error');
        }
    };

    const handleCancelMeeting = async (meeting) => {
        if (!window.confirm('Bu toplantı isteğini iptal etmek istediğinize emin misiniz?')) return;
        try {
            await cancelMeetingReq(meeting.id);
            showToastMessage('Toplantı isteği iptal edildi.', 'error');
            refreshNetworkingData();
        } catch (error) {
            showToastMessage('Bir hata oluştu.', 'error');
        }
    };

    const handleRescheduleMeeting = (meeting) => {
        setRescheduleModal({
            isOpen: true,
            meeting: meeting,
            dateTime: new Date(meeting.scheduledDate).toISOString().slice(0, 16),
            notes: meeting.notes || ''
        });
    };

    const handleRescheduleSubmit = async () => {
        if (!rescheduleModal.dateTime) {
            showToastMessage('Lütfen yeni bir tarih seçin.', 'error');
            return;
        }
        try {
            await rescheduleMeetingReq(rescheduleModal.meeting.id, {
                dateTime: rescheduleModal.dateTime,
                notes: rescheduleModal.notes
            });
            showToastMessage('Toplantı başarıyla revize edildi.');
            setRescheduleModal({ isOpen: false, meeting: null, dateTime: '', notes: '' });
            refreshNetworkingData();
        } catch (error) {
            showToastMessage('Revize işlemi başarısız oldu.', 'error');
        }
    };

    return (
        <div className="page networking-page">
            <div className="container">
                <div className="networking-header-card">
                    <div className="networking-header-top">
                        <div className="networking-header-left">
                            <div className="networking-user-info">
                                <div className="networking-avatar-wrapper">
                                    <UserAvatar user={user} size="lg" className="networking-avatar" />
                                    {user?.isPremium && <div className="premium-badge-pos"><PremiumBadge size="sm" /></div>}
                                </div>
                                <div className="networking-text-info">
                                    <h1 className="networking-title">Networking</h1>
                                    <p className="networking-subtitle">{user?.title || 'Profilini tamamla!'}</p>
                                </div>
                            </div>
                            <div className="networking-stats-row-compact">
                                <div className="stat-pill" title={(credits || 0) + " Kredi"}>
                                    <Zap size={14} color="var(--color-accent-primary)" />
                                    <span className="stat-text-hide-mobile">{credits || 0} Kredi</span>
                                    <span className="stat-text-mobile-only">{credits || 0}</span>
                                </div>
                                <div className="stat-pill" title={(connections?.length || 0) + " Bağlantı"}>
                                    <Users size={14} color="#06b6d4" />
                                    <span className="stat-text-hide-mobile">{connections?.length || 0} Bağlantı</span>
                                    <span className="stat-text-mobile-only">{connections?.length || 0}</span>
                                </div>
                                <div className="stat-pill" title={matchHistory.filter(m => m.status === "APPROVED" || m.status === "approved").length + " Eşleşme"}>
                                    <Star size={14} color="#f59e0b" />
                                    <span className="stat-text-hide-mobile">{matchHistory.filter(m => m.status === "APPROVED" || m.status === "approved").length} Eşleşme</span>
                                    <span className="stat-text-mobile-only">{matchHistory.filter(m => m.status === "APPROVED" || m.status === "approved").length}</span>
                                </div>
                                <button onClick={handleInviteFriend} className="stat-pill btn-invite-mini" title="Davet Et">
                                    <UserPlus size={14} color="var(--color-purple)" />
                                    <span className="stat-text-hide-mobile">Davet Et</span>
                                </button>
                            </div>
                        </div>
                        <div className="networking-header-right">
                            <button 
                                onClick={() => navigate('/network/connections')} 
                                className="btn-plan-meeting-main"
                            >
                                <div className="btn-plan-icon-wrapper">
                                    <Calendar size={22} color="#fff" />
                                </div>
                                <div className="btn-plan-text">
                                    <span className="btn-plan-title">Görüşme Planla</span>
                                    <span className="btn-plan-subtitle">Bağlantılarınla takvimlendir</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="tab-nav-container">
                    <button className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>
                        <Search size={18} /> Keşfet
                    </button>
                    <button className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`} onClick={() => setActiveTab('connections')}>
                        <Users size={18} /> Bağlantılarım
                        {connections?.length > 0 && <span className="tab-count">{connections.length}</span>}
                    </button>
                    <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                        <Bell size={18} /> İstekler
                        {incomingRequests.length > 0 && <span className="tab-count badge-red">{incomingRequests.length}</span>}
                    </button>
                </div>

                {activeTab === 'discover' && (
                    <>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                <input
                                    type="text"
                                    className="search-input-alt"
                                    placeholder="Ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button 
                                className={`filter-toggle-btn ${showFilterDropdown ? 'active' : ''}`} 
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                style={{
                                    background: showFilterDropdown ? 'rgba(147, 51, 234, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                                    color: showFilterDropdown ? '#9333ea' : '#4c1d95',
                                    border: showFilterDropdown ? '1px solid rgba(147, 51, 234, 0.3)' : '1px solid rgba(255, 255, 255, 0.5)'
                                }}
                            >
                                <Filter size={18} />
                            </button>
                        </div>

                        {showFilterDropdown && (
                            <div style={{
                                position: 'fixed',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 9999,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '20px'
                            }} onClick={() => setShowFilterDropdown(false)}>
                                <div className="glass-card" style={{
                                    background: 'linear-gradient(150deg, #ffffff 0%, #f5f3ff 40%, #e9d5ff 100%)',
                                    borderRadius: '24px',
                                    padding: '24px',
                                    width: '100%',
                                    maxWidth: '500px',
                                    maxHeight: '80vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 25px 50px -12px rgba(109, 40, 217, 0.25)',
                                    border: '1px solid rgba(255, 255, 255, 0.9)'
                                }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, color: '#4c1d95', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Filter size={20} /> İlgi Alanlarına Göre Filtrele
                                        </h3>
                                        <button onClick={() => setShowFilterDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b21a8' }}>
                                            <X size={24} />
                                        </button>
                                    </div>
                                    
                                    <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }} className="hide-scrollbar">
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {interestCategories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    className={`interest-chip ${selectedInterests.includes(cat.id) ? 'active' : ''}`}
                                                    onClick={() => toggleInterestFilter(cat.id)}
                                                    style={{ margin: 0, padding: '8px 16px', fontSize: '0.9rem' }}
                                                >
                                                    {cat.emoji} {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(147, 51, 234, 0.1)' }}>
                                        {selectedInterests.length > 0 ? (
                                            <button 
                                                onClick={() => setSelectedInterests([])}
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                Temizle ({selectedInterests.length})
                                            </button>
                                        ) : (
                                            <div></div>
                                        )}
                                        <button 
                                            onClick={() => setShowFilterDropdown(false)}
                                            style={{ background: 'var(--color-primary)', border: 'none', color: 'white', padding: '10px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}
                                        >
                                            Uygula
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="chips-container hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: 'var(--spacing-xl)', paddingBottom: '4px' }}>
                            {allInterests.slice(0, 15).map(interest => (
                                <button
                                    key={interest}
                                    className={`interest-chip ${selectedInterests.includes(interest) ? 'active' : ''}`}
                                    onClick={() => toggleInterestFilter(interest)}
                                >
                                    {translateInterest(interest)}
                                </button>
                            ))}
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <div className="discovery-section-header">
                                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                                    {isSearching ? 'Arama Sonuçları' : 'Yeni İnsanlar Tanı'}
                                </h2>
                                {!isSearching && filteredUsers.length > 0 && (
                                    <div className="discovery-view-toggle">
                                        <button 
                                            className={`view-btn ${discoveryView === 'deck' ? 'active' : ''}`}
                                            onClick={() => setDiscoveryView('deck')}
                                        >
                                            <Zap size={14} /> Keşfet
                                        </button>
                                        <button 
                                            className={`view-btn ${discoveryView === 'grid' ? 'active' : ''}`}
                                            onClick={() => setDiscoveryView('grid')}
                                        >
                                            <Users size={14} /> Liste
                                        </button>
                                    </div>
                                )}
                            </div>

                            {loading ? (
                                <div className="text-center py-5"><div className="loading-spinner"></div></div>
                            ) : filteredUsers.length > 0 ? (
                                discoveryView === 'deck' && !isSearching ? (
                                    <div className="discovery-deck">
                                        {currentDeckIndex < filteredUsers.length ? (
                                            (() => {
                                                const u = filteredUsers[currentDeckIndex];
                                                return (
                                                    <div className="deck-card" key={u.id}>
                                                        <div 
                                                            className="deck-card-inner" 
                                                            onClick={() => setSelectedUser(u)}
                                                            style={{ cursor: 'pointer', position: 'relative' }}
                                                        >
                                                            {u.isAiSuggestion && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '16px',
                                                                    left: '50%',
                                                                    transform: 'translateX(-50%)',
                                                                    background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                                                    color: '#fff',
                                                                    padding: '6px 16px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 'bold',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                                                                    zIndex: 10,
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    ✨ AI Önerisi
                                                                </div>
                                                            )}
                                                            <div className="deck-card-content">
                                                                <div className="deck-card-avatar" style={{ marginTop: u.isAiSuggestion ? '24px' : '0' }}>
                                                                    <UserAvatar user={u} size="xl" style={{ border: '4px solid #fff' }} />
                                                                </div>
                                                                <h3 className="deck-card-name">
                                                                    {u.name} {u.surname}
                                                                    {u.isPremium && <PremiumBadge size="sm" />}
                                                                </h3>
                                                                <p className="deck-card-title">{u.title || 'Bondle Üyesi'}</p>
                                                                <div className="deck-card-tags">
                                                                    {u.interests?.slice(0, 4).map(interest => (
                                                                        <span key={interest} className="deck-tag">
                                                                            {translateInterest(interest)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                                                                                {u.isAiSuggestion && u.aiReason && (
                                                                    <div style={{
                                                                        padding: '12px 14px',
                                                                        background: 'var(--color-bg-tertiary)',
                                                                        borderRadius: '12px',
                                                                        border: '1px solid rgba(147, 51, 234, 0.2)',
                                                                        fontSize: '0.85rem',
                                                                        lineHeight: '1.4',
                                                                        color: 'var(--color-text-primary)',
                                                                        fontWeight: '500',
                                                                        display: 'flex',
                                                                        gap: '10px',
                                                                        marginTop: '-4px',
                                                                        marginBottom: '16px',
                                                                        textAlign: 'left',
                                                                        boxShadow: '0 2px 8px rgba(147, 51, 234, 0.05)'
                                                                    }}>
                                                                        <Sparkles size={18} color="#9333ea" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                                        <span>{u.aiReason}</span>
                                                                    </div>
                                                                )}
                                                                <div className="deck-controls">
                                                                    <button className="control-btn pass" onClick={(e) => { e.stopPropagation(); setCurrentDeckIndex(prev => prev + 1); }}>
                                                                        <X size={24} />
                                                                    </button>
                                                                    <button className="control-btn info" onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}>
                                                                        <Search size={20} />
                                                                    </button>
                                                                    <button className="control-btn schedule" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.1)', flex: 1, padding: '16px', borderRadius: '50%' }} onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleScheduleMeeting(u);
                                                                    }}>
                                                                        <Calendar size={24} />
                                                                    </button>
                                                                    <button className="control-btn connect" onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAddConnection(u);
                                                                        setCurrentDeckIndex(prev => prev + 1);
                                                                    }}>
                                                                        <UserPlus size={24} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p style={{ textAlign: 'center', marginTop: '12px', opacity: 0.5, fontSize: '0.8rem' }}>
                                                            {currentDeckIndex + 1} / {filteredUsers.length} kişi
                                                        </p>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div className="empty-state">
                                                <Zap size={48} color="var(--color-accent-primary)" />
                                                <h3>Harika!</h3>
                                                <p>Bugünlük tüm yeni insanları gördün. Yarın tekrar gel veya listeye göz at!</p>
                                                <button className="btn btn-primary" onClick={() => { setDiscoveryView('grid'); setCurrentDeckIndex(0); }}>Listeye Dön</button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <div 
                                            className="horizontal-users-list" 
                                            ref={setScrollContainerRef}
                                            onScroll={(e) => {
                                                if (e.target.scrollLeft > 20) {
                                                    setShowLeftArrow(true);
                                                } else {
                                                    setShowLeftArrow(false);
                                                }
                                            }}
                                        >
                                            {filteredUsers.map(u => (
                                                <div key={u.id} className="discovery-card-wrapper" onClick={() => setSelectedUser(u)}>
                                                    <SuggestedUserCard 
                                                        user={u} 
                                                        onAddClick={() => handleAddConnection(u)} 
                                                        requestStatus={getRequestStatus(u.id)} 
                                                        onCancelClick={handleCancelRequest} onScheduleClick={handleScheduleMeeting} 
                                                        matchId={getMatchId(u.id)} 
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {showLeftArrow && (
                                            <button 
                                                className="scroll-arrow left" 
                                                onClick={() => scrollContainerRef?.scrollBy({ left: -340, behavior: 'smooth' })}
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                        )}
                                        {filteredUsers.length > 2 && (
                                            <button 
                                                className="scroll-arrow right" 
                                                onClick={() => scrollContainerRef?.scrollBy({ left: 340, behavior: 'smooth' })}
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="empty-state">
                                    <Search size={48} />
                                    <p>Aradığın kriterlerde kimseyi bulamadık.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'connections' && (
                    <div className="tab-content-fade">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Bağlantıda Olduklarım</h2>
                        </div>
                        {connections?.length > 0 ? (
                            <div className="connections-list-alt">
                                {connections.map(conn => {
                                    const other = getOtherUser(conn);
                                    if (!other) return null;
                                    return (
                                        <div 
                                            key={conn.id} 
                                            className="connection-item-card"
                                            onClick={() => setSelectedUser(other)}
                                            style={{ 
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                border: '1px solid transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--color-bg-secondary)';
                                                e.currentTarget.style.borderColor = 'var(--color-subtle-border)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.borderColor = 'transparent';
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                                <UserAvatar user={other} size="lg" />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{other.name} {other.surname}</h4>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>{other.title || 'Üye'}</p>
                                                </div>
                                                <div 
                                                    style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button 
                                                        className="btn-action-pill" 
                                                        style={{ 
                                                            background: 'rgba(139, 92, 246, 0.1)', 
                                                            color: 'var(--color-accent-primary)', 
                                                            border: '1px solid rgba(139, 92, 246, 0.2)',
                                                            padding: '8px 16px'
                                                        }}
                                                        onClick={() => navigate(`/network/connections/${conn.id}/schedule`)}
                                                    >
                                                        <Calendar size={16} /> 
                                                        <span>Görüşme Planla</span>
                                                    </button>
                                                    <button 
                                                        className="btn-circle btn-danger-soft" 
                                                        style={{ width: '36px', height: '36px' }}
                                                        onClick={() => handleDeleteConnection(conn.id)}
                                                        title="Bağlantıyı Sil"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Users size={48} />
                                <p>Henüz bir bağlantın yok.</p>
                                <button className="btn btn-primary" onClick={() => setActiveTab('discover')}>Kullanıcıları Keşfet</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="tab-content-fade">
                        {/* 1. Toplantı İstekleri (Mock) */}
                        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                            <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={20} color="#10b981" />
                                Gelen Toplantı İstekleri
                            </h2>
                            {incomingMeetings.length > 0 ? (
                                <div className="requests-grid">
                                    {incomingMeetings.map(meeting => {
                                        const otherUser = meeting.connection 
                                            ? (meeting.connection.user1?.id === user.id ? meeting.connection.user2 : meeting.connection.user1)
                                            : meeting.participants?.find(p => String(p.id) !== String(user.id));
                                        return (
                                            <div key={meeting.id} className="request-card-alt" style={{ borderLeft: '4px solid #10b981' }}>
                                                <UserAvatar user={otherUser || {}} size="lg" />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0 }}>{otherUser?.name} {otherUser?.surname}</h4>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                                                        <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/>
                                                        {new Date(meeting.scheduledDate).toLocaleString('tr-TR')}
                                                    </p>
                                                    {meeting.notes && (
                                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', opacity: 0.6, fontStyle: 'italic' }}>
                                                            "{meeting.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn-circle btn-success" onClick={() => handleAcceptMeeting(meeting)} title="Kabul Et"><Check size={18} /></button>
                                                    <button className="btn-circle" style={{ backgroundColor: 'var(--color-background-soft)', color: 'var(--color-text)' }} onClick={() => handleRescheduleMeeting(meeting)} title="Revize Et"><Calendar size={18} /></button>
                                                    <button className="btn-circle btn-danger" onClick={() => handleRejectMeeting(meeting)} title="Reddet"><X size={18} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: 'var(--spacing-xl) 0', background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed rgba(16, 185, 129, 0.2)', borderRadius: '16px' }}>
                                    <Calendar size={48} color="rgba(16, 185, 129, 0.5)" />
                                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '12px' }}>Şu an için bekleyen toplantı isteğiniz bulunmuyor.</p>
                                </div>
                            )}

                            <h2 style={{ marginBottom: 'var(--spacing-md)', marginTop: 'var(--spacing-2xl)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={20} color="var(--color-accent-primary)" />
                                Gönderilen Toplantı İstekleri
                            </h2>
                            {outgoingMeetings.length > 0 ? (
                                <div className="requests-grid">
                                    {outgoingMeetings.map(meeting => {
                                        const otherUser = meeting.connection 
                                            ? (meeting.connection.user1?.id === user.id ? meeting.connection.user2 : meeting.connection.user1)
                                            : meeting.participants?.find(p => String(p.id) !== String(user.id));
                                        return (
                                            <div key={meeting.id} className="request-card-alt" style={{ borderLeft: '4px solid var(--color-accent-primary)' }}>
                                                <UserAvatar user={otherUser || {}} size="lg" />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0 }}>{otherUser?.name} {otherUser?.surname}</h4>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                                                        <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/>
                                                        {new Date(meeting.scheduledDate).toLocaleString('tr-TR')}
                                                    </p>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-warning)' }}>
                                                        Onay Bekleniyor
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn-circle" style={{ backgroundColor: 'var(--color-background-soft)', color: 'var(--color-text)' }} onClick={() => handleRescheduleMeeting(meeting)} title="Revize Et"><Calendar size={18} /></button>
                                                    <button className="btn-circle btn-danger" onClick={() => handleCancelMeeting(meeting)} title="İptal Et"><X size={18} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: 'var(--spacing-xl) 0', background: 'rgba(139, 92, 246, 0.05)', border: '1px dashed rgba(139, 92, 246, 0.2)', borderRadius: '16px' }}>
                                    <Calendar size={48} color="rgba(139, 92, 246, 0.5)" />
                                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '12px' }}>Gönderdiğiniz bekleyen bir toplantı isteği bulunmuyor.</p>
                                </div>
                            )}
                        </div>

                        {/* 2. Ba�lant� �stekleri */}
                        <div>
                            <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserPlus size={20} color="var(--color-accent-primary)" />
                                Gelen Bağlantı İstekleri
                            </h2>
                            {incomingRequests.length > 0 ? (
                                <div className="requests-grid">
                                    {incomingRequests.map(req => {
                                        const sender = req.sender || req.user1 || {};
                                        return (
                                            <div key={req.id} className="request-card-alt">
                                                <UserAvatar user={sender} size="lg" />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0 }}>{sender.name} {sender.surname}</h4>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>{sender.title || 'Üye'}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn-circle btn-success" onClick={() => handleAcceptRequest(req)}><Check size={18} /></button>
                                                    <button className="btn-circle btn-danger" onClick={() => handleRejectRequest(req)}><X size={18} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Bell size={48} />
                                    <p>Bekleyen bir isteğiniz bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Shared Profile Modal */}
            <UserProfileModal 
                isOpen={!!selectedUser} 
                onClose={() => setSelectedUser(null)} 
                user={selectedUser}
                footerActions={
                    selectedUser && (
                        <>
                            {(() => {
                                const status = getRequestStatus(selectedUser.id);
                                const isConn = isConnection(selectedUser.id);
                                
                                if (isConn) {
                                    return (
                                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                            <button className="btn btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '14px' }} onClick={() => {
                                                setSelectedUser(null);
                                                handleScheduleMeeting(selectedUser);
                                            }}>
                                                <Calendar size={18} style={{ marginRight: '8px' }} /> Toplantı Planla
                                            </button>
                                        </div>
                                    );
                                }
                                
                                if (status === 'sent') return (
                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                        <button className="btn btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: '14px' }} onClick={() => handleCancelRequest(getMatchId(selectedUser.id))}>
                                            <Clock size={18} style={{ marginRight: '8px' }} /> İstek Gönderildi
                                        </button>
                                        <button 
                                            className="btn btn-primary" 
                                            style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #059669)' }} 
                                            onClick={() => {
                                                setSelectedUser(null);
                                                handleScheduleMeeting(selectedUser);
                                            }}
                                        >
                                            <Calendar size={18} style={{ marginRight: '8px' }} /> Görüşme Planla
                                        </button>
                                    </div>
                                );

                                if (status === 'received') return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button className="btn btn-success" style={{ flex: 1, padding: '14px', borderRadius: '14px' }} onClick={() => handleAcceptRequest({id: getMatchId(selectedUser.id), sender: selectedUser})}>
                                                Onayla
                                            </button>
                                            <button className="btn btn-danger" style={{ flex: 1, padding: '14px', borderRadius: '14px' }} onClick={() => handleRejectRequest({id: getMatchId(selectedUser.id)})}>
                                                Reddet
                                            </button>
                                        </div>
                                        <button 
                                            className="btn btn-primary" 
                                            style={{ width: '100%', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #059669)' }} 
                                            onClick={() => {
                                                setSelectedUser(null);
                                                handleScheduleMeeting(selectedUser);
                                            }}
                                        >
                                            <Calendar size={18} style={{ marginRight: '8px' }} /> Görüşme Planla
                                        </button>
                                    </div>
                                );
                                
                                return (
                                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                        <button 
                                            style={{ 
                                                flex: 1, 
                                                padding: '14px', 
                                                borderRadius: '100px', 
                                                fontWeight: '800',
                                                background: 'linear-gradient(135deg, #9333ea, #4c1d95)',
                                                color: '#ffffff',
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 8px 24px rgba(109, 40, 217, 0.4)',
                                                transition: 'transform 0.2s',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            onClick={() => handleAddConnection(selectedUser)}
                                        >
                                            <UserPlus size={18} style={{ marginRight: '8px' }} />
                                            Arkadaş Ekle
                                        </button>
                                        <button 
                                            style={{ 
                                                flex: 1,
                                                padding: '14px', 
                                                borderRadius: '100px', 
                                                fontWeight: '800',
                                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                                color: '#ffffff',
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                                                transition: 'transform 0.2s',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            onClick={() => {
                                                setSelectedUser(null);
                                                if (handleScheduleMeeting) handleScheduleMeeting(selectedUser);
                                            }}
                                        >
                                            <Calendar size={18} style={{ marginRight: '8px' }} />
                                            Görüşme (1⚡)
                                        </button>
                                    </div>
                                );
                            })()}
                            
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button 
                                    style={{ 
                                        flex: 1, 
                                        color: '#ef4444', 
                                        background: 'rgba(255, 255, 255, 0.6)', 
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '100px',
                                        padding: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
                                    }} 
                                    onClick={() => handleReportUser(selectedUser)}
                                >
                                    <AlertTriangle size={16} style={{ marginRight: '6px' }} /> Raporla
                                </button>
                                <button 
                                    style={{ 
                                        flex: 1, 
                                        color: '#4c1d95',
                                        background: 'rgba(255, 255, 255, 0.6)', 
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        border: '1px solid rgba(147, 51, 234, 0.2)',
                                        borderRadius: '100px',
                                        padding: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(109, 40, 217, 0.05)'
                                    }} 
                                    onClick={() => handleBlockUser(selectedUser)}
                                >
                                    <Shield size={16} style={{ marginRight: '6px' }} /> Engelle
                                </button>
                            </div>
                        </>
                    )
                }
            />

            {rescheduleModal.isOpen && (
                <div className="modal-overlay" onClick={() => setRescheduleModal({ isOpen: false, meeting: null, dateTime: '', notes: '' })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <button className="modal-close" onClick={() => setRescheduleModal({ isOpen: false, meeting: null, dateTime: '', notes: '' })}><X size={24} /></button>
                        <h2 style={{ marginBottom: '16px' }}>Toplantıyı Revize Et</h2>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Yeni Tarih ve Saat</label>
                            <input 
                                type="datetime-local" 
                                className="form-input" 
                                style={{ width: '100%' }}
                                value={rescheduleModal.dateTime} 
                                onChange={(e) => setRescheduleModal({ ...rescheduleModal, dateTime: e.target.value })}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Ek Not (İsteğe Bağlı)</label>
                            <textarea 
                                className="form-input" 
                                style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                                placeholder="Revize sebebi veya notunuz..."
                                value={rescheduleModal.notes} 
                                onChange={(e) => setRescheduleModal({ ...rescheduleModal, notes: e.target.value })}
                            />
                        </div>
                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleRescheduleSubmit}>
                            Değişiklikleri Kaydet
                        </button>
                    </div>
                </div>
            )}

            {showReferralModal && (
                <div className="modal-overlay" onClick={() => setShowReferralModal(false)}>
                    <div className="modal-content referral-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowReferralModal(false)}><X size={24} /></button>
                        
                        <div className="referral-header">
                            <div className="referral-icon-wrapper">
                                <UserPlus size={32} />
                            </div>
                            <h2 className="referral-title">Arkadaşlarını Davet Et</h2>
                            <p className="referral-subtitle">Bondle'e arkadaşlarını davet et, hem sen hem arkadaşın 5 ⚡ kredi kazanın!</p>
                        </div>

                        <div className="referral-code-section">
                            <div className="referral-code-label">SENİN DAVET KODUN</div>
                            <div className="referral-code-display" onClick={copyReferralCode} title="Kopyalamak için tıkla">
                                <span className="code-text">{referralInfo.code || 'YÜKLENİYOR...'}</span>
                                <div className="copy-hint">Kopyalamak için tıkla</div>
                            </div>
                        </div>

                        <div className="referral-divider">
                            <span>VEYA</span>
                        </div>

                        <form onSubmit={handleUseReferral} className="referral-form">
                            <label className="referral-form-label">Arkadaşından kodun mu var?</label>
                            <div className="referral-input-group">
                                <input 
                                    type="text" 
                                    className="referral-input" 
                                    placeholder="DAVET KODU GİR" 
                                    value={referralInput} 
                                    onChange={e => setReferralInput(e.target.value.toUpperCase())} 
                                />
                                <button 
                                    type="submit" 
                                    className="btn btn-primary referral-submit-btn"
                                    disabled={referralStatus.loading}
                                >
                                    {referralStatus.loading ? '...' : 'Kullan'}
                                </button>
                            </div>
                            {referralStatus.error && <p className="referral-error">{referralStatus.error}</p>}
                            {referralStatus.success && <p className="referral-success">{referralStatus.success}</p>}
                        </form>
                    </div>
                </div>
            )}
            {showReportModal && (
                <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <button className="modal-close" onClick={() => setShowReportModal(false)}><X size={24} /></button>
                        
                        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <AlertTriangle size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Kullanıcıyı Raporla</h2>
                            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                                <strong>{reportData.userToReport?.name} {reportData.userToReport?.surname}</strong> hakkındaki şikayetinizi belirtin.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Rapor Nedeni</label>
                                <select 
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                                    value={reportData.reason}
                                    onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                                >
                                    <option value="spam">Spam veya Gereksiz İçerik</option>
                                    <option value="harassment">Taciz veya Rahatsız Edici Davranış</option>
                                    <option value="inappropriate_content">Uygunsuz Profil İçeriği</option>
                                    <option value="fake_profile">Sahte Hesap</option>
                                    <option value="other">Diğer</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Detaylar (Opsiyonel)</label>
                                <textarea 
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', minHeight: '100px' }}
                                    placeholder="Neden raporladığınızı biraz daha detaylandırın..."
                                    value={reportData.details}
                                    onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button 
                                    className="btn btn-ghost" 
                                    style={{ flex: 1 }} 
                                    onClick={() => setShowReportModal(false)}
                                    disabled={reportData.submitting}
                                >
                                    İptal
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ flex: 2, background: '#ef4444', border: 'none', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                                    onClick={submitReport}
                                    disabled={reportData.submitting}
                                >
                                    {reportData.submitting ? 'Gönderiliyor...' : 'Raporu Gönder'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default NetworkingPage;







