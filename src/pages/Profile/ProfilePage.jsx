import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNetworking } from '../../contexts/NetworkingContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import api from '../../services/api';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { interestCategories } from '../../data/interestCategories.js';
import UserAvatar from '../../components/UserAvatar';
import UserProfileModal from '../../components/UserProfileModal';
import { BADGE_META } from '../Home/HomePage';
import './ProfilePage.css';
import {
    LogOut,
    Star,
    MapPin,
    Edit2,
    Save,
    X,
    Camera,
    CalendarDays,
    Network,
    Zap,
    Linkedin,
    Settings,
    Trash2,
    ExternalLink,
    ChevronDown,
    MessageSquare,
    Award,
    Shield,
    Flame,
    Lock,
    Download,
    Sun,
    Moon,
    Bell,
    BellOff,
    Link as LinkIcon,
    Copy
} from 'lucide-react';
// Turkish cities import removed
const turkishCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli', 'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri', 'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın', 'Tekirdağ', 'Sakarya', 'Denizli', 'Muğla', 'Eskişehir', 'Mardin', 'Trabzon', 'Malatya', 'Ordu', 'Erzurum', 'Afyonkarahisar', 'Sivas', 'Adıyaman', 'Batman', 'Zonguldak', 'Tokat', 'Elazığ', 'Kütahya', 'Çanakkale', 'Osmaniye', 'Çorum', 'Şırnak', 'Ağrı', 'Giresun', 'Isparta', 'Aksaray', 'Yozgat', 'Edirne', 'Muş', 'Düzce', 'Kastamonu', 'Uşak', 'Niğde', 'Kırklareli', 'Bitlis', 'Rize', 'Amasya', 'Siirt', 'Bolu', 'Nevşehir', 'Yalova', 'Bingöl', 'Kırıkkale', 'Hakkari', 'Kars', 'Burdur', 'Karaman', 'Karabük', 'Kırşehir', 'Erzincan', 'Bilecik', 'Sinop', 'Iğdır', 'Bartın', 'Çankırı', 'Artvin', 'Gümüşhane', 'Kilis', 'Ardahan', 'Tunceli', 'Bayburt'].sort();
import PremiumBadge from '../../components/PremiumBadge';
import Toast from '../../components/Toast';

const ProfilePage = () => {
    const { user, logout, isPremium, updateUserProfile } = useAuth();
    const { credits, connections } = useNetworking();
    const { theme, toggleTheme } = useTheme();
    const { isSupported, isSubscribed, loading: pushLoading, subscribeToPush, unsubscribeFromPush } = usePushNotifications();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isBadgesExpanded, setIsBadgesExpanded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState((user?.profilePicture || user?.picture) || null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [toastConfig, setToastConfig] = useState({ isOpen: false, message: '', type: 'success' });



    // Feedback State
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');

    // New Modals State
    const [showConnectionsModal, setShowConnectionsModal] = useState(false);
    const [showEventsModal, setShowEventsModal] = useState(false);
    const [showBlockedModal, setShowBlockedModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [attendedEvents, setAttendedEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [badgeStatus, setBadgeStatus] = useState([]);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [streakData, setStreakData] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showGoogleWarning, setShowGoogleWarning] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    // Ambassador referrals state
    const [referralsData, setReferralsData] = useState(null);
    const [showReferralsModal, setShowReferralsModal] = useState(false);

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleViewUser = (otherUser) => {
        setSelectedUser(otherUser);
    };

    useEffect(() => {
        document.title = 'Bondle | Profil';
    }, []);

    // Load badges and streak
    useEffect(() => {
        const loadEngagement = async () => {
            try {
                const [badges, streak, registrations] = await Promise.all([
                    api.getBadges(),
                    api.getStreak(),
                    api.getUserRegistrations().catch(() => []),
                ]);
                setBadgeStatus(badges || []);
                setStreakData(streak);
                if (registrations && Array.isArray(registrations)) {
                    setAttendedEvents(registrations.filter(reg => reg.status === 'APPROVED'));
                }
            } catch (e) {
                console.error('Engagement load error:', e);
            }
        };
        if (user) loadEngagement();
    }, [user]);

    // Load ambassador referrals
    useEffect(() => {
        const fetchReferrals = async () => {
            if (user?.role === 'campus_ambassador' || user?.role === 'admin') {
                try {
                    const data = await api.getMyReferrals();
                    setReferralsData(data);
                } catch (e) {
                    console.error('Failed to load referrals', e);
                }
            }
        };
        fetchReferrals();
    }, [user]);

    // Lock body scroll when any modal is open (NOT editing - editing is inline and needs scroll)
    useEffect(() => {
        if (showConnectionsModal || showEventsModal || showFeedbackModal || showPasswordModal || showBlockedModal || showReferralsModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showConnectionsModal, showEventsModal, showFeedbackModal, showPasswordModal, showBlockedModal, showReferralsModal]);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        surname: user?.surname || '',
        title: user?.title || '',
        bio: user?.bio || '',
        city: user?.city || 'İstanbul',
        interests: user?.interests || [],
    });

    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loadingBlocked, setLoadingBlocked] = useState(false);

    useEffect(() => {
        const fetchBlocked = async () => {
            setLoadingBlocked(true);
            try {
                const data = await api.getMyBlocks();
                setBlockedUsers(data || []);
            } catch (e) {
                console.error('Blocked users load error:', e);
            } finally {
                setLoadingBlocked(false);
            }
        };
        if (user) fetchBlocked();
    }, [user]);

    const handleUnblock = async (targetId) => {
        try {
            await api.unblockUser(targetId);
            setBlockedUsers(prev => prev.filter(b => b.blockedUser.id !== targetId));
            alert('Engelleme kaldırıldı.');
        } catch (e) {
            alert('İşlem başarısız.');
        }
    };

    const stats = {
        attendedEvents: attendedEvents.length || user?.stats?.attendedEvents || 0,
        connections: connections?.length || 0,
        networkingCredits: credits || 0
    };

    const handleLogout = () => {
        logout();
    };

    const handlePhotoClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleInterestToggle = (interestId) => {
        const newInterests = formData.interests.includes(interestId)
            ? formData.interests.filter((i) => i !== interestId)
            : [...formData.interests, interestId];
        setFormData({ ...formData, interests: newInterests });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (uploadedFile) {
                setIsUploading(true);
                await userService.uploadAvatar(uploadedFile);
                setIsUploading(false);
            }
            const result = await updateUserProfile(formData);
            if (!result.success) {
                throw new Error(result.error);
            }
            setIsEditing(false);
            setUploadedFile(null);
            setToastConfig({ isOpen: true, message: 'Profil başarıyla güncellendi!', type: 'success' });
        } catch (error) {
            console.error('Profile update error:', error);
            setToastConfig({ isOpen: true, message: 'Profil güncellenirken hata oluştu: ' + (error.response?.data?.message || error.message), type: 'error' });
        } finally {
            setIsSaving(false);
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            surname: user?.surname || '',
            title: user?.title || '',
            bio: user?.bio || '',
            city: user?.city || 'İstanbul',
            interests: user?.interests || [],
        });
        setProfilePhoto((user?.profilePicture || user?.picture) || null);
        setIsEditing(false);
    };

    const handleDeleteAccount = async () => {
        try {
            const confirmed = window.confirm('Hesabınızı silmek istediğinizden emin misiniz?');
            if (confirmed) {
                await api.deleteAccount();
                alert('Hesabınız başarıyla silindi.');
                logout();
                navigate('/login');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Hesap silinirken bir hata oluştu.');
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    const handlePremiumClick = () => {
        navigate('/premium');
    };

    const handleFeedbackSubmit = async () => {
        if (feedbackRating === 0) {
            alert('Lütfen bir puan verin');
            return;
        }
        setIsSubmittingFeedback(true);
        try {
            await api.submitGeneralFeedback(feedbackRating, feedbackComment);
            alert('Geri bildiriminiz için teşekkürler! 🌟');
            setShowFeedbackModal(false);
            setFeedbackRating(0);
            setFeedbackComment('');
        } catch (error) {
            console.error('Feedback error:', error);
            alert('Geri bildirim gönderilemedi.');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const fetchAttendedEvents = async () => {
        setLoadingEvents(true);
        try {
            const data = await api.getUserRegistrations();
            setAttendedEvents(data.filter(reg => reg.status === 'APPROVED'));
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoadingEvents(false);
        }
    };

    const calculateCompleteness = () => {
        let score = 0;
        if (user?.name) score += 20;
        if (user?.title) score += 20;
        if (user?.city) score += 10;
        if (user?.bio) score += 20;
        if (user?.interests?.length > 0) score += 15;
        if (profilePhoto) score += 15;
        return score;
    };
    const completenessScore = calculateCompleteness();

    const handlePasswordChange = async () => {
        if (!passwordData.oldPassword || !passwordData.newPassword) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Yeni şifreler eşleşmiyor.');
            return;
        }
        if (passwordData.newPassword.length < 7) {
            alert('Yeni şifre 6 karakterden büyük olmalıdır.');
            return;
        }

        try {
            setIsSaving(true);
            await api.changePassword(passwordData.oldPassword, passwordData.newPassword);
            alert('✅ Şifreniz başarıyla değiştirildi!');
            setShowPasswordModal(false);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            alert('❌ ' + (error.message || 'Şifre değiştirilemedi.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportData = async () => {
        try {
            setIsExporting(true);
            const data = await api.exportUserData();
            
            // Create a blob and download it
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bondle_data_${user.name.toLowerCase()}_${new Date().getTime()}.json`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            alert('✅ Verileriniz başarıyla hazırlandı ve indirildi.');
        } catch (error) {
            console.error('Export error:', error);
            alert('❌ Veri dışa aktarma sırasında bir hata oluştu.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="page">
            {toastConfig.isOpen && (
                <Toast 
                    message={toastConfig.message} 
                    type={toastConfig.type} 
                    onClose={() => setToastConfig({ ...toastConfig, isOpen: false })} 
                />
            )}
            <div className="container">
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                    {/* Header Section with Cover */}
                    <div className="card poster-card glass-card" style={{ 
                        padding: 0, 
                        marginBottom: 'var(--spacing-xl)', 
                        overflow: 'hidden',
                        border: '1px solid var(--color-subtle-border)',
                        background: 'rgba(255, 255, 255, 0.4)'
                    }}>
                        {/* Cover Image / Gradient */}
                        <div style={{ 
                            height: '140px', 
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
                            position: 'relative',
                            overflow: 'hidden',
                            borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
                        }}>
                            {/* Ambient Light Orbs */}
                            <div style={{ position: 'absolute', top: '-40px', right: '10%', width: '180px', height: '180px', background: 'rgba(139, 92, 246, 0.4)', filter: 'blur(60px)', borderRadius: '50%' }}></div>
                            <div style={{ position: 'absolute', bottom: '-30px', left: '15%', width: '150px', height: '150px', background: 'rgba(251, 191, 36, 0.25)', filter: 'blur(50px)', borderRadius: '50%' }}></div>
                        </div>

                        {/* Profile Info Overlay */}
                        <div style={{ 
                            padding: '0 var(--spacing-xl) var(--spacing-xl)', 
                            marginTop: '-60px',
                            textAlign: 'center',
                            position: 'relative'
                        }}>

                            <div 
                                style={{
                                    position: 'relative',
                                    width: '120px',
                                    height: '120px',
                                    margin: '0 auto var(--spacing-md)',
                                    cursor: isEditing ? 'pointer' : 'default',
                                    borderRadius: '50%',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                                }}
                                onClick={handlePhotoClick}
                            >
                                <UserAvatar 
                                    user={{
                                        ...user,
                                        profilePicture: profilePhoto,
                                        name: isEditing ? formData.name : user?.name,
                                        surname: isEditing ? formData.surname : user?.surname
                                    }} 
                                    size="2xl" 
                                />

                                {isPremium() && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-12px',
                                        right: '-12px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                                        border: '2px solid rgba(255, 255, 255, 0.7)',
                                        zIndex: 2
                                    }}>
                                        <Award size={18} color="#000" />
                                    </div>
                                )}

                                {isEditing && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'var(--color-accent-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid rgba(255, 255, 255, 0.7)',
                                        cursor: 'pointer'
                                    }}>
                                        <Camera size={16} color="var(--color-text-on-accent)" />
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                />
                            </div>

                             <div style={{ 
                                 marginBottom: 'var(--spacing-xs)',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 gap: '12px',
                                 flexWrap: 'wrap'
                             }}>
                                 <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     {isEditing ? `${formData.name} ${formData.surname}` : `${user?.name || ''} ${user?.surname || ''}`.trim()}
                                     {user?.role === 'mentor' && !isEditing && (
                                         <span style={{
                                             fontSize: '12px',
                                             background: '#ec4899',
                                             color: '#fff',
                                             padding: '2px 8px',
                                             borderRadius: '4px',
                                             fontWeight: 'bold',
                                             letterSpacing: '0.5px'
                                         }}>MENTOR</span>
                                     )}
                                     {user?.role === 'campus_ambassador' && !isEditing && (
                                         <span style={{
                                             fontSize: '12px',
                                             background: '#8b5cf6',
                                             color: '#fff',
                                             padding: '2px 8px',
                                             borderRadius: '4px',
                                             fontWeight: 'bold',
                                             letterSpacing: '0.5px'
                                         }}>ELÇİ</span>
                                     )}
                                 </h1>
                                 
                                 {!isPremium() && !isEditing && (
                                     <button 
                                         className="btn btn-primary btn-sm" 
                                         onClick={handlePremiumClick}
                                         style={{
                                             background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                             color: '#000',
                                             fontWeight: '700',
                                             border: 'none',
                                             boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)',
                                             padding: '4px 12px',
                                             borderRadius: 'var(--radius-full)',
                                             fontSize: '11px',
                                             textTransform: 'uppercase',
                                             letterSpacing: '0.05em'
                                         }}
                                     >
                                         <Star size={12} fill="#000" />
                                         Premium'a Geç
                                     </button>
                                 )}
                             </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <p style={{
                                    marginBottom: '0',
                                    color: 'var(--color-accent-secondary)',
                                    fontSize: 'var(--font-size-md)',
                                    fontWeight: '600'
                                }}>
                                    {isEditing ? formData.title : user?.title || 'Ünvan Belirtilmedi'}
                                </p>
                                
                                {!isEditing && (user?.isBranchRepresentative ? (
                                    <div style={{
                                        background: 'rgba(239, 68, 68, 0.1)', 
                                        color: '#ef4444', 
                                        padding: '4px 12px', 
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        marginTop: '4px',
                                        marginBottom: 'var(--spacing-xs)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)'
                                    }}>
                                        {user?.branch ? (user.branch.includes('Bondle') ? `${user.branch} - İl Temsilcisi` : `Bondle ${user.branch} - İl Temsilcisi`) : 'İl Temsilcisi'}
                                    </div>
                                ) : (user?.team || user?.branch) ? (
                                    <div style={{
                                        background: 'rgba(59, 130, 246, 0.1)', 
                                        color: '#3b82f6', 
                                        padding: '4px 12px', 
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        marginTop: '4px',
                                        marginBottom: 'var(--spacing-xs)',
                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}>
                                        {`${user.branch ? (user.branch.includes('Bondle') ? user.branch : `Bondle ${user.branch}`) : ''} ${user.team ? `- ${user.team}` : ''}`.trim().replace(/^-|-$/g, '').trim()}
                                    </div>
                                ) : null)}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                <MapPin size={14} />
                                <span style={{ 
                                    color: '#4c1d95', 
                                    fontWeight: '700',
                                    fontSize: 'var(--font-size-md)'
                                }}>{isEditing ? formData.city : user?.city || 'Şehir Belirtilmedi'}</span>
                                <span>•</span>
                                <span style={{ 
                                    color: '#4c1d95', 
                                    fontWeight: '700',
                                    fontSize: 'var(--font-size-md)'
                                }}>{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Profile Completeness (Gamification) */}
                    {completenessScore < 100 && !isEditing && (
                        <div className="card poster-card glass-card" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.05) 0%, rgba(217, 70, 239, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: '#4c1d95' }}>Profil Doluluğu</span>
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: '#4c1d95' }}>%{completenessScore}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.5)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                                <div style={{ width: `${completenessScore}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6 0%, #d946ef 100%)', borderRadius: 'var(--radius-full)', transition: 'width 1s ease-in-out' }}></div>
                            </div>
                            <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-sm)', marginBottom: 0 }}>
                                Profilinizi 100% tamamlayarak ağınızda daha fazla öne çıkabilirsiniz!
                            </p>
                        </div>
                    )}

                    {/* Stats Section - Dashboard Style */}
                    <div className="profile-stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-xl)'
                    }}>
                        {/* Attended Events */}
                        <div 
                            className="card profile-stat-card" 
                            onClick={() => {
                                fetchAttendedEvents();
                                setShowEventsModal(true);
                            }}
                            style={{
                                padding: 'var(--spacing-lg) var(--spacing-md)',
                                textAlign: 'center',
                                background: 'rgba(16, 185, 129, 0.05)',
                                border: '1px solid rgba(16, 185, 129, 0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.background = 'var(--color-subtle-border)';
                                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.1)';
                            }}
                        >
                            <CalendarDays size={24} color="#10b981" style={{ marginBottom: 'var(--spacing-sm)' }} />
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4c1d95' }}>{stats.attendedEvents}</div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: '700', marginTop: '4px' }}>Etkinlikler</div>
                        </div>

                        {/* Connections */}
                        <div 
                            className="card profile-stat-card" 
                            onClick={() => setShowConnectionsModal(true)}
                            style={{
                                padding: 'var(--spacing-lg) var(--spacing-md)',
                                textAlign: 'center',
                                background: 'rgba(59, 130, 246, 0.05)',
                                border: '1px solid rgba(59, 130, 246, 0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.1)';
                            }}
                        >
                            <Network size={24} color="#3b82f6" style={{ marginBottom: 'var(--spacing-sm)' }} />
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4c1d95' }}>{stats.connections}</div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: '700', marginTop: '4px' }}>Bağlantılar</div>
                        </div>

                        {/* Networking Credits */}
                        <div 
                            className="card profile-stat-card" 
                            style={{
                                padding: 'var(--spacing-lg) var(--spacing-md)',
                                textAlign: 'center',
                                background: 'rgba(245, 158, 11, 0.05)',
                                border: '1px solid rgba(245, 158, 11, 0.1)',
                            }}
                        >
                            <Zap size={24} color="#f59e0b" style={{ marginBottom: 'var(--spacing-sm)' }} />
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4c1d95' }}>{stats.networkingCredits}</div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: '700', marginTop: '4px' }}>Krediler</div>
                        </div>
                    </div>

                    {/* ── Streak & Badges ── */}
                    {(streakData || badgeStatus.length > 0) && (
                        <div className="card poster-card glass-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
                            <div 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => setIsBadgesExpanded(!isBadgesExpanded)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <Flame size={20} color="#ef4444" />
                                    <h3 style={{ marginBottom: 0 }}>Seri & Rozetler</h3>
                                    <ChevronDown size={20} color="var(--color-text-tertiary)" style={{ transform: isBadgesExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                </div>
                                {streakData && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 14px',
                                        background: streakData.currentStreak >= 7 ? 'rgba(249,115,22,0.12)' : 'rgba(239,68,68,0.1)',
                                        borderRadius: 'var(--radius-full)',
                                        border: `1px solid ${streakData.currentStreak >= 7 ? 'rgba(249,115,22,0.3)' : 'rgba(239,68,68,0.2)'}`,
                                    }}>
                                        <span style={{ fontSize: '1.1rem' }}>{streakData.currentStreak >= 7 ? '⚡' : streakData.currentStreak >= 3 ? '🔥' : '🌱'}</span>
                                        <span style={{ fontWeight: '800', fontSize: '15px', color: '#4c1d95' }}>{streakData.currentStreak}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: '600' }}>günlük seri</span>
                                    </div>
                                )}
                            </div>

                            {/* Collapsible Content */}
                            {isBadgesExpanded && (
                                <div style={{ marginTop: 'var(--spacing-lg)', animation: 'fadeIn 0.3s ease-out' }}>
                                    {badgeStatus.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {badgeStatus.map(b => (
                                                <div
                                                    key={b.badge}
                                                    className="profile-badge-item"
                                                    onClick={() => setSelectedBadge({ ...b, meta: { emoji: b.emoji, label: b.label } })}
                                                    style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                                        padding: '12px 16px',
                                                        background: b.earned ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                                                        border: `1px solid ${b.earned ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                                        borderRadius: 'var(--radius-lg)',
                                                        minWidth: '72px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        opacity: b.earned ? 1 : 0.6,
                                                        position: 'relative',
                                                    }}
                                                    onMouseEnter={e => { 
                                                        e.currentTarget.style.transform = 'translateY(-2px)'; 
                                                        if (b.earned) e.currentTarget.style.boxShadow = '0 8px 20px rgba(139,92,246,0.15)';
                                                    }}
                                                    onMouseLeave={e => { 
                                                        e.currentTarget.style.transform = 'none'; 
                                                        e.currentTarget.style.boxShadow = 'none'; 
                                                    }}
                                                >
                                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '1.6rem', filter: b.earned ? 'none' : 'grayscale(1) blur(1px)' }}>
                                                            {b.emoji}
                                                        </span>
                                                        {!b.earned && (
                                                            <span style={{ 
                                                                position: 'absolute', 
                                                                fontSize: '1rem',
                                                                textShadow: '0 0 10px rgba(76, 29, 149, 0.2)' 
                                                            }}>🔒</span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: '700', color: b.earned ? '#6b21a8' : 'var(--color-text-tertiary)', textAlign: 'center', lineHeight: 1.2 }}>{b.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                                            Henüz rozet sistemi yüklenmedi.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}                    {/* Premium Button */}

                    {/* Two Column Layout for Profile Info + Settings */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                        gap: 'var(--spacing-lg)',
                    }}>

                        {/* Profile Information Card */}
                        <div className="card poster-card glass-card" style={{ padding: 'var(--spacing-xl)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid rgba(139, 92, 246, 0.15)' }}>
                                <h3 style={{ marginBottom: 0, color: '#4c1d95', fontWeight: 800, fontSize: '1.25rem' }}>Profil Bilgileri</h3>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>

                                    {!isEditing ? (
                                        <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                                            <Edit2 size={16} />
                                            Düzenle
                                        </button>
                                    ) : (
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={handleSave}
                                                disabled={isSaving || isUploading}
                                            >
                                                <Save size={16} />
                                                {isUploading ? '...' : isSaving ? '...' : 'Kaydet'}
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={handleCancel}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isEditing ? (
                                // Edit Mode
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                                    <div>
                                        <label htmlFor="name">Ad</label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Adınız"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="surname">Soyad</label>
                                        <input
                                            id="surname"
                                            name="surname"
                                            type="text"
                                            value={formData.surname}
                                            onChange={handleChange}
                                            placeholder="Soyadınız"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="title">Ünvan</label>
                                        <input
                                            id="title"
                                            name="title"
                                            type="text"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Örn: Öğrenci, Yazılım Geliştirici"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="city">Şehir</label>
                                        <select
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                        >
                                            {turkishCities.map((city) => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                    </div>


                                    <div>
                                        <label htmlFor="bio">Hakkında</label>
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            placeholder="Kısaca bahsedin..."
                                            rows={4}
                                        />
                                    </div>

                                    <div>
                                        <label>İlgi Alanları</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'var(--spacing-sm)' }}>
                                            {interestCategories.map((category) => {
                                                const isSelected = formData.interests.includes(category.id);
                                                return (
                                                    <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => handleInterestToggle(category.id)}
                                                        style={{
                                                            padding: '8px 14px',
                                                            borderRadius: '20px',
                                                            border: isSelected ? '2px solid #8b5cf6' : '2px solid rgba(139, 92, 246, 0.2)',
                                                            background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.5)',
                                                            color: isSelected ? '#a78bfa' : '#6b21a8',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: isSelected ? '600' : '500',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '16px' }}>{category.emoji}</span>
                                                        {category.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <>
                                    {user?.title && (
                                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Award size={20} color="#ec4899" />
                                            </div>
                                            <div>
                                                <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Ünvan</div>
                                                <div style={{ fontWeight: '600' }}>{user.title}</div>
                                            </div>
                                        </div>
                                    )}

                                    {user?.city && (
                                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <MapPin size={20} color="#f43f5e" />
                                            </div>
                                            <div>
                                                <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Şehir</div>
                                                <div style={{ fontWeight: '600' }}>{user.city}</div>
                                            </div>
                                        </div>
                                    )}

                                    {user?.linkedIn && (
                                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Linkedin size={20} color="#3b82f6" />
                                            </div>
                                            <div>
                                                <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>LinkedIn</div>
                                                <a
                                                    href={user.linkedIn}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}
                                                >
                                                    Profili Görüntüle
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {user?.clubAffiliation && (
                                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Users size={20} color="#8b5cf6" />
                                            </div>
                                            <div>
                                                <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Kulüp</div>
                                                <div style={{ fontWeight: '600' }}>{user.clubAffiliation}</div>
                                            </div>
                                        </div>
                                    )}

                                    {user?.bio && (
                                        <div style={{ marginTop: 'var(--spacing-lg)', background: 'rgba(255, 255, 255, 0.5)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)' }}>
                                            <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>Hakkında</div>
                                            <p style={{ marginBottom: 0, lineHeight: 1.6 }}>{user.bio}</p>
                                        </div>
                                    )}

                                    {user?.interests && user.interests.length > 0 && (
                                        <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                            <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>İlgi Alanları</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {user.interests.map((interestId) => {
                                                    const category = interestCategories.find(c => c.id === interestId);
                                                    return category ? (
                                                        <span key={interestId} style={{
                                                            padding: '6px 14px',
                                                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
                                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                                            borderRadius: '20px',
                                                            fontSize: '13px',
                                                            fontWeight: '500',
                                                            color: '#4c1d95',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                        }}>
                                                            <span style={{ fontSize: '16px' }}>{category.emoji}</span>
                                                            {category.label}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Settings Card */}
                        <div className="card poster-card glass-card" style={{ padding: 'var(--spacing-xl)', alignSelf: 'start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                                <Settings size={20} />
                                <h3 style={{ marginBottom: 0 }}>Ayarlar</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                                {/* Admin Panel Button - Only for Admins */}
                                {user?.role === 'admin' && (
                                    <button
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: 'var(--spacing-md)',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            border: '1px solid rgba(245, 158, 11, 0.2)',
                                            borderRadius: 'var(--radius-lg)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            color: '#f59e0b',
                                            width: '100%'
                                        }}
                                        onClick={() => navigate('/admin')}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Shield size={18} color="#f59e0b" />
                                            </div>
                                            <span style={{ fontWeight: '600' }}>Yönetim Paneli</span>
                                        </div>
                                        <ChevronDown size={18} style={{ transform: 'rotate(-90deg)', color: '#f59e0b' }} />
                                    </button>
                                )}

                                {/* Feedback Button */}
                                <button
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(255, 255, 255, 0.5)',
                                        border: '1px solid transparent',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        color: '#4c1d95',
                                        width: '100%'
                                    }}
                                    onClick={() => setShowFeedbackModal(true)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MessageSquare size={18} color="#3b82f6" />
                                        </div>
                                        <span style={{ fontWeight: '500' }}>Geri Bildirim Gönder</span>
                                    </div>
                                    <ChevronDown size={18} style={{ transform: 'rotate(-90deg)', color: '#6b21a8' }} />
                                </button>

                                {/* Advanced Settings Toggle */}
                                <details style={{ width: '100%', cursor: 'pointer' }}>
                                    <summary style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(255, 255, 255, 0.5)',
                                        border: '1px solid transparent',
                                        borderRadius: 'var(--radius-lg)',
                                        color: '#4c1d95',
                                        listStyle: 'none'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Settings size={18} color="#ef4444" />
                                            </div>
                                            <span style={{ fontWeight: '500' }}>Gelişmiş Ayarlar</span>
                                        </div>
                                        <ChevronDown size={18} color="#6b21a8" />
                                    </summary>
                                    <div style={{ padding: 'var(--spacing-md) 0 var(--spacing-xs) 0', display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.3s ease' }}>
                                        {/* Notifications Toggle */}
                                        {isSupported && (
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    if (isSubscribed) {
                                                        await unsubscribeFromPush();
                                                        alert("Bildirimler başarıyla kapatıldı.");
                                                    } else {
                                                        const result = await subscribeToPush();
                                                        if (result && result.message) {
                                                            alert(result.message);
                                                        }
                                                    }
                                                }}
                                                disabled={pushLoading}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                                    background: isSubscribed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                                                    border: `1px solid ${isSubscribed ? 'rgba(16, 185, 129, 0.2)' : 'transparent'}`,
                                                    borderRadius: 'var(--radius-lg)',
                                                    cursor: pushLoading ? 'not-allowed' : 'pointer',
                                                    color: isSubscribed ? '#10b981' : '#4c1d95',
                                                    width: '100%'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                    {isSubscribed ? <Bell size={16} /> : <BellOff size={16} />}
                                                    <span style={{ fontWeight: '600' }}>
                                                        {pushLoading ? 'Bekleniyor...' : (isSubscribed ? 'Bildirimler Açık' : 'Bildirimleri Aç')}
                                                    </span>
                                                </div>
                                            </button>
                                        )}

                                        {/* Change Password */}
                                        <button
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                borderRadius: 'var(--radius-lg)',
                                                color: '#3b82f6',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                gap: 'var(--spacing-sm)'
                                            }}
                                            onClick={() => {
                                                // Robust check for Google users
                                                const isGoogleUser = user?.authProvider === 'google' || user?.googleId;
                                                
                                                if (isGoogleUser) {
                                                    setShowGoogleWarning(true);
                                                } else {
                                                    setShowPasswordModal(true);
                                                }
                                            }}
                                        >
                                            <Lock size={16} />
                                            Şifre Değiştir
                                        </button>

                                        <button
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                borderRadius: 'var(--radius-lg)',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                gap: 'var(--spacing-sm)',
                                                marginTop: '8px'
                                            }}
                                            onClick={() => setShowBlockedModal(true)}
                                        >
                                            <Shield size={16} />
                                            Engellenenleri Yönet ({blockedUsers.length})
                                        </button>

                                        {/* Export Data */}
                                        <button
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                                borderRadius: 'var(--radius-lg)',
                                                color: '#10b981',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                gap: 'var(--spacing-sm)'
                                            }}
                                            onClick={handleExportData}
                                            disabled={isExporting}
                                        >
                                            <Download size={16} />
                                            {isExporting ? 'Hazırlanıyor...' : 'Verilerimi Dışa Aktar'}
                                        </button>

                                        {/* Delete Account */}
                                        <button
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                borderRadius: 'var(--radius-lg)',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                gap: 'var(--spacing-sm)'
                                            }}
                                            onClick={() => setShowDeleteConfirm(true)}
                                        >
                                            <Trash2 size={16} />
                                            Hesabı Sil
                                        </button>
                                    </div>
                                </details>

                                {/* Logout Button */}
                                <button
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(255, 255, 255, 0.5)',
                                        border: '1px solid transparent',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2sease',
                                        color: '#4c1d95'
                                    }}
                                    onClick={handleLogout}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(107, 114, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <LogOut size={18} color="#4c1d95" />
                                        </div>
                                        <span style={{ fontWeight: '500' }}>Çıkış Yap</span>
                                    </div>
                                    <ChevronDown size={18} style={{ transform: 'rotate(-90deg)', color: '#6b21a8' }} />
                                </button>
                            </div>
                        </div>

                    </div> {/* End Two Column Grid */}

                    {/* Delete Confirmation Dialog */}
                    {showDeleteConfirm && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(76, 29, 149, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: 'var(--spacing-lg)'
                        }}>
                            <div className="card poster-card glass-card" style={{
                                padding: 'var(--spacing-xl)',
                                maxWidth: '400px',
                                width: '100%'
                            }}>
                                <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#ef4444' }}>
                                    Hesabı Sil
                                </h3>
                                <p style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ flex: 1 }}
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        style={{
                                            flex: 1,
                                            background: '#ef4444'
                                        }}
                                        onClick={handleDeleteAccount}
                                    >
                                        Sil
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}



                    {/* Connections Modal */}
                    {showConnectionsModal && (
                        <div className="profile-modal-overlay" onClick={() => setShowConnectionsModal(false)}>
                            <div className="profile-modal-card" onClick={e => e.stopPropagation()}>
                                <div className="profile-modal-header">
                                    <h3 style={{ margin: 0, color: '#4c1d95', fontWeight: '800', letterSpacing: '-0.01em' }}>Bağlantılarım</h3>
                                    <button className="profile-modal-close" onClick={() => setShowConnectionsModal(false)}><X size={18} /></button>
                                </div>
                                {connections.length === 0 ? (
                                    <p className="text-secondary" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>Henüz hiç bağlantınız yok.</p>
                                ) : (
                                    <div className="custom-scroll" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {connections.map(conn => {
                                            const otherUser = String(conn.user1.id) === String(user.id) ? conn.user2 : conn.user1;
                                            return (
                                                <div 
                                                    key={conn.id} 
                                                    className="profile-list-item" style={{ justifyContent: "space-between", cursor: "pointer", background: "rgba(255, 255, 255, 0.6)", padding: '10px 14px' }}
                                                    onClick={() => handleViewUser(otherUser)}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                                                        e.currentTarget.style.borderColor = 'var(--color-subtle-border-hover)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                                                        e.currentTarget.style.borderColor = 'transparent';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden' }}>
                                                            {otherUser.profilePicture ? (
                                                                <img src={otherUser.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', background: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-on-accent)', fontSize: '14px' }}>
                                                                    {otherUser.name.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{otherUser.name} {otherUser.surname}</div>
                                                            <div className="text-secondary" style={{ fontSize: '12px' }}>{otherUser.title || 'Kullanıcı'}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ color: 'var(--color-text-tertiary)' }}>
                                                        <ExternalLink size={14} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attended Events Modal */}
                    {showEventsModal && (
                        <div className="profile-modal-overlay" onClick={() => setShowEventsModal(false)}>
                            <div className="profile-modal-card" onClick={e => e.stopPropagation()}>
                                <div className="profile-modal-header">
                                    <h3 style={{ margin: 0, color: '#4c1d95', fontWeight: '800', letterSpacing: '-0.01em' }}>Katıldığım Etkinlikler</h3>
                                    <button className="profile-modal-close" onClick={() => setShowEventsModal(false)}><X size={18} /></button>
                                </div>
                                {loadingEvents ? (
                                    <p style={{ textAlign: 'center' }}>Yükleniyor...</p>
                                ) : attendedEvents.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl) var(--spacing-xl)' }}>
                                        <div style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-sm)' }}>
                                            <CalendarDays size={48} style={{ opacity: 0.2, marginBottom: 'var(--spacing-md)' }} />
                                        </div>
                                        <p style={{ color: '#6b21a8', fontSize: 'var(--font-size-md)', fontWeight: '500' }}>Henüz onaylanmış bir etkinlik kaydınız bulunmuyor.</p>
                                    </div>
                                ) : (
                                    <div className="custom-scroll" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {attendedEvents.map(reg => (
                                            <div key={reg.id} className="card poster-card glass-card" onClick={() => navigate(`/events/${reg.event.id}`)} style={{ padding: '10px 14px', display: 'flex', gap: '12px', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.5)' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden' }}>
                                                    <img src={reg.event.posterImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600', fontSize: '14px', lineHeight: '1.2', marginBottom: '2px' }}>{reg.event.title}</div>
                                                    <div className="text-secondary" style={{ fontSize: '12px' }}>{new Date(reg.event.date).toLocaleDateString('tr-TR')}</div>
                                                    <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', fontWeight: '600' }}>✓ Katılım Onaylandı</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* User Profile Detail Modal */}
                    <UserProfileModal 
                        isOpen={!!selectedUser}
                        user={selectedUser} 
                        onClose={() => setSelectedUser(null)} 
                    />

                    {/* Feedback Modal */}
                    {showFeedbackModal && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(76, 29, 149, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: 'var(--spacing-lg)'
                        }}>
                            <div className="card poster-card glass-card" style={{
                                padding: 'var(--spacing-xl)',
                                maxWidth: '400px',
                                width: '100%'
                            }}>
                                <div className="profile-modal-header">
                                    <h3 style={{ marginBottom: 0 }}>Geri Bildirim</h3>
                                    <button
                                        onClick={() => setShowFeedbackModal(false)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b21a8' }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="profile-modal-body">
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)', marginBottom: '24px' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setFeedbackRating(star)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    transform: star <= feedbackRating ? 'scale(1.1)' : 'scale(1)',
                                                    transition: 'transform 0.2s ease'
                                                }}
                                            >
                                                <Star
                                                    size={36}
                                                    fill={star <= feedbackRating ? '#fbbf24' : 'none'}
                                                    color={star <= feedbackRating ? '#fbbf24' : 'rgba(139, 92, 246, 0.4)'}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        placeholder="Uygulamayı geliştirmemiz için önerileriniz..."
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: 'var(--spacing-md)',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'rgba(255, 255, 255, 0.4)',
                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                            color: '#4c1d95',
                                            minHeight: '120px',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            outline: 'none',
                                            boxShadow: 'inset 0 2px 4px rgba(139, 92, 246, 0.05)'
                                        }}
                                    />

                                    <button
                                        onClick={handleFeedbackSubmit}
                                        disabled={isSubmittingFeedback || !feedbackComment.trim() || feedbackRating === 0}
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            background: 'linear-gradient(135deg, #a855f7, #6d28d9)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 'var(--radius-full)',
                                            fontWeight: '700',
                                            marginTop: '16px',
                                            opacity: (!feedbackComment.trim() || feedbackRating === 0) ? 0.6 : 1,
                                            boxShadow: (!feedbackComment.trim() || feedbackRating === 0) ? 'none' : '0 8px 16px rgba(109, 40, 217, 0.3)',
                                            transition: 'all 0.3s ease',
                                            cursor: (!feedbackComment.trim() || feedbackRating === 0) ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {isSubmittingFeedback ? 'Gönderiliyor...' : 'Gönder'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
                    {/* Password Change Modal */}
                    {showPasswordModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(76, 29, 149, 0.3)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', zIndex: 1100,
                            padding: 'var(--spacing-lg)'
                        }}>
                            <div className="card poster-card glass-card" style={{ padding: 'var(--spacing-xl)', maxWidth: '400px', width: '100%' }}>
                                <div className="profile-modal-header">
                                    <h3 style={{ marginBottom: 0 }}>Şifre Değiştir</h3>
                                    <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b21a8' }}><X size={20} /></button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Mevcut Şifre</label>
                                        <input 
                                            type="password" 
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                                            placeholder="••••••••"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(255, 255, 255, 0.5)', color: '#4c1d95' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Yeni Şifre</label>
                                        <input 
                                            type="password" 
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                            placeholder="••••••••"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(255, 255, 255, 0.5)', color: '#4c1d95' }}
                                        />
                                        <div style={{ fontSize: '12px', color: '#6b21a8', marginTop: '4px', padding: '8px 12px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
                                            6 karakterden büyük olmalıdır
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Yeni Şifre (Tekrar)</label>
                                        <input 
                                            type="password" 
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                            placeholder="••••••••"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(255, 255, 255, 0.5)', color: '#4c1d95' }}
                                        />
                                    </div>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%', marginTop: '10px', background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', border: 'none' }}
                                        onClick={handlePasswordChange}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Google User Warning Modal */}
                    {showGoogleWarning && (
                        <div className="profile-modal-overlay" onClick={() => setShowGoogleWarning(false)}>
                            <div className="profile-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px", textAlign: 'center' }}>
                                <div className="profile-modal-header" style={{ justifyContent: 'center' }}>
                                    <h3 style={{ marginBottom: 0 }}>Giriş Yöntemi Sınırlaması</h3>
                                </div>
                                <div className="profile-modal-body">
                                    <div style={{ paddingBottom: '20px', color: '#6b21a8' }}>
                                        Google hesabınız ile giriş yaptığınız için şifre değiştirme özelliğini kullanamazsınız. Lütfen Google hesap ayarlarınızdan güvenliğinizi yönetin.
                                    </div>
                                    <button
                                        onClick={() => setShowGoogleWarning(false)}
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: '12px' }}
                                    >
                                        Tamam, Anladım
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            {/* Blocked Users Modal */}
            {showBlockedModal && (
                <div className="profile-modal-overlay" onClick={() => setShowBlockedModal(false)}>
                    <div className="profile-modal-card profile-modal-body" onClick={e => e.stopPropagation()} style={{ maxWidth: "450px" }}>
                        <button className="profile-modal-close" style={{ position: "absolute", top: "16px", right: "16px" }} onClick={() => setShowBlockedModal(false)}><X size={20} /></button>
                        
                        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Shield size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Engellenen Kişiler</h2>
                            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                                Engellediğiniz kişileri buradan görebilir ve engellerini kaldırabilirsiniz.
                            </p>
                        </div>

                        <div style={{ 
                            maxHeight: '400px', 
                            overflowY: 'auto', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '12px',
                            padding: '4px'
                        }}>
                            {blockedUsers.length > 0 ? (
                                blockedUsers.map(block => (
                                    <div key={block.blockedUser.id} className="profile-list-item" style={{ justifyContent: "space-between", padding: "12px", background: "rgba(255, 255, 255, 0.6)" }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <UserAvatar user={block.blockedUser} size="md" />
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '15px' }}>{block.blockedUser.name} {block.blockedUser.surname}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{block.blockedUser.title}</div>
                                            </div>
                                        </div>
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            style={{ 
                                                padding: '6px 12px', 
                                                fontSize: '12px', 
                                                color: '#3b82f6',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.1)'
                                            }}
                                            onClick={() => handleUnblock(block.blockedUser.id)}
                                        >
                                            Engeli Kaldır
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '40px 20px', 
                                    color: 'var(--color-text-tertiary)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <Shield size={48} style={{ opacity: 0.2 }} />
                                    <p>Henüz kimseyi engellemediniz.</p>
                                </div>
                            )}
                        </div>

                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', marginTop: '24px' }} 
                            onClick={() => setShowBlockedModal(false)}
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
