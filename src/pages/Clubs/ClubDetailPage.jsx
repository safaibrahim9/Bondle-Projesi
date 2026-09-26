import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getClubById } from '../../services/clubService';
const getEventById = () => null; // Mock event removed
const mockAnnouncements = []; // Mock announcements removed
import { MapPin, Users, Instagram, Linkedin, BarChart, Megaphone, Calendar, X, Camera, Plus, Edit2, ChevronLeft, ChevronRight, Edit, UserPlus } from 'lucide-react';
import PremiumBadge from '../../components/PremiumBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useNetworking } from '../../contexts/NetworkingContext';
import ClubActivitiesTab from './tabs/ClubActivitiesTab';
import ClubAnalyticsTab from './tabs/ClubAnalyticsTab';
import ClubMembersTab from './tabs/ClubMembersTab';
import { updateClub, uploadClubLogo } from '../../services/clubService';
import Toast from '../../components/Toast';
import RequireAuthModal from '../../components/RequireAuthModal';
import UserProfileModal from '../../components/UserProfileModal';
import api from '../../services/api';
import { useAnalytics } from '../../hooks/useAnalytics';
import './ClubDetailPage.css';

const turkishCities = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 
    'Mersin', 'Kayseri', 'Eskişehir', 'Samsun', 'Denizli', 'Şanlıurfa', 'Sakarya', 
    'Malatya', 'Kocaeli', 'Diyarbakır', 'Trabzon', 'Online'
];

const clubCategories = [
    'Yazılım', 'Girişimcilik', 'Sanat', 'Spor', 'Kariyer', 
    'Sosyal Sorumluluk', 'Teknoloji', 'Eğlence', 'Müzik',
    'Havacılık', 'Uzay', 'Tiyatro', 'Sinema', 'Mühendislik', 
    'Bilim', 'Tasarım', 'E-Spor', 'Yabancı Dil', 'Gönüllülük', 
    'Fotoğrafçılık', 'Doğa & Çevre', 'Münazara', 'Edebiyat'
];

const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        // Eğer dosya 2 MB'dan küçükse hiç sıkıştırma yapmadan orijinalini dön
        if (file.size < 2 * 1024 * 1024) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                // 1200 yerine 1920 yaparak çözünürlüğü yüksek tutalım (sadece çok büyük dosyalar için)
                const max_size = 1920; 

                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Canvas to Blob failed'));
                        return;
                    }
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                }, 'image/jpeg', 0.9); // Kaliteyi 0.85'ten 0.9'a çıkardık
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const ClubDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setPageOverride } = useAnalytics();
    const [searchParams] = useSearchParams();
    const refCode = searchParams.get('ref');
    const [activeTab, setActiveTab] = useState('about');
    const [club, setClub] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [events, setEvents] = useState([]);
    const [members, setMembers] = useState([]);
    const [officials, setOfficials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [isEditingActivity, setIsEditingActivity] = useState(false);
    const [editingActivityId, setEditingActivityId] = useState(null);
    const [error, setError] = useState(null);
    const galleryInputRef = useRef(null);
    const activityFileRef = useRef(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const { 
        connections, 
        incomingRequests, 
        matchHistory,
        sendConnectionRequest, 
        acceptConnectionRequest, 
        rejectConnectionRequest, 
        cancelConnectionRequest 
    } = useNetworking();

    const getMatchId = (uid) => {
        const inc = incomingRequests.find(r => r.senderId === uid);
        if (inc) return inc.id;
        const out = matchHistory.find(m => m.receiverId === uid);
        if (out) return out.id;
        return null;
    };

    const getRequestStatus = (uid) => {
        if (incomingRequests.some(r => r.senderId === uid)) return 'received';
        const outgoing = matchHistory.find(m => m.receiverId === uid);
        if (outgoing && outgoing.status === 'pending') return 'sent';
        return null;
    };

    const isConnection = (uid) => {
        return connections.some(c => (c.senderId === uid || c.receiverId === uid));
    };

    const handleSendRequest = async (targetId) => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        try {
            await sendConnectionRequest(targetId);
            showToast('İstek gönderildi!', 'success');
        } catch (err) {
            showToast('İstek gönderilemedi', 'error');
        }
    };

    const handleCancelRequest = async (matchId) => {
        try {
            await cancelConnectionRequest(matchId);
            showToast('İstek iptal edildi', 'info');
        } catch (err) {
            showToast('İstek iptal edilemedi', 'error');
        }
    };

    const handleAcceptRequest = async (req) => {
        try {
            await acceptConnectionRequest(req.id);
            showToast('İstek kabul edildi!', 'success');
        } catch (err) {
            showToast('İstek kabul edilemedi', 'error');
        }
    };

    const handleRejectRequest = async (req) => {
        try {
            await rejectConnectionRequest(req.id);
            showToast('İstek reddedildi', 'info');
        } catch (err) {
            showToast('İstek reddedilemedi', 'error');
        }
    };

    const [selectedUser, setSelectedUser] = useState(null);
    const [activityType, setActivityType] = useState('announcement'); // 'announcement' or 'event'
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };
    
    // Edit Form Data
    const [editData, setEditData] = useState({
        name: '',
        description: '',
        memberCount: 0,
        city: '',
        instagramUrl: '',
        linkedinUrl: '',
        categories: []
    });

    // Activity Form Data
    const [activityData, setActivityData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        zoomLink: '',
        price: 0,
        type: 'free',
        participantLimit: 100,
        isOnline: false,
        posterImage: '',
        linkTo: '',
        file: null,
        preview: null,
        requiresForm: false
    });

    const [galleryData, setGalleryData] = useState({
        caption: '',
        eventName: '',
        file: null,
        preview: null
    });
    const [showGalleryModal, setShowGalleryModal] = useState(false);

    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const logoInputRef = useRef(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [editingGalleryItem, setEditingGalleryItem] = useState(null);
    const [showGalleryEditModal, setShowGalleryEditModal] = useState(false);
    const [galleryEditData, setGalleryEditData] = useState({ caption: '', eventName: '' });

    useEffect(() => {
        if (id) {
            fetchClub();
        }
    }, [id]);

    useEffect(() => {
        if (club) {
            document.title = `Bondle | ${club.name}`;
            setPageOverride(`Kulüp Detay: ${club.name}`);
        } else if (error) {
            document.title = 'Bondle | Kulüp Bulunamadı';
        }
    }, [club, error, setPageOverride]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedImageIndex === null) return;
            if (e.key === 'Escape') setSelectedImageIndex(null);
            if (e.key === 'ArrowRight') handleNextImage();
            if (e.key === 'ArrowLeft') handlePrevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIndex]);

    const handleNextImage = () => {
        if (selectedImageIndex === null || !club?.gallery) return;
        setSelectedImageIndex((selectedImageIndex + 1) % club.gallery.length);
    };

    const handlePrevImage = () => {
        if (selectedImageIndex === null || !club?.gallery) return;
        setSelectedImageIndex((selectedImageIndex - 1 + club.gallery.length) % club.gallery.length);
    };

    const fetchClub = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch club data, announcements, events, members, officials and analytics in parallel
            const [clubData, announcementsData, eventsData, membersData, officialsData, analyticsData] = await Promise.all([
                getClubById(parseInt(id)),
                api.get(`/announcements/club/${id}`).catch(() => []),
                api.get(`/events?clubId=${id}`).catch(() => []),
                api.get(`/clubs/${id}/members`).catch(() => []),
                api.get(`/clubs/${id}/officials`).catch(() => []),
                api.get(`/clubs/${id}/analytics`).catch(() => null)
            ]);

            setClub({ ...clubData, analytics: analyticsData || clubData.analytics });
            setAnnouncements(announcementsData || []);
            setEvents(eventsData || []);
            setMembers(membersData || []);
            setOfficials(officialsData || []);
            setIsMember(clubData.isMember);

            // Stant linki ile gelen kullanıcı giriş yapmamışsa login'e yönlendir
            if (refCode && !user) {
                localStorage.setItem('redirectAfterAuth', window.location.pathname + window.location.search);
                navigate('/login?mode=register');
                return;
            }

            // Stant linki ile gelen kullanıcıyı otomatik üye yap
            if (refCode && user && !clubData.isMember) {
                try {
                    await api.post(`/clubs/${id}/join?source=stant`);
                    setIsMember(true);
                    showToast('Stant bağlantısı ile kulübe otomatik katıldınız! 🎉', 'success');
                    // Üye listesini yeniden çek
                    const updatedMembers = await api.get(`/clubs/${id}/members`).catch(() => []);
                    setMembers(updatedMembers || []);
                } catch (autoJoinErr) {
                    // Zaten üye ise veya başka bir hata → sessizce geç
                    console.log('Auto-join skipped:', autoJoinErr.message);
                }
            }

            setEditData({
                name: clubData.name,
                description: clubData.description || '',
                memberCount: clubData.memberCount || 0,
                city: clubData.city || '',
                instagramUrl: clubData.instagramUrl || '',
                linkedinUrl: clubData.linkedinUrl || '',
                categories: clubData.categories || []
            });
            setLogoPreview(clubData.logoUrl || clubData.logo);
        } catch (error) {
            console.error('Error fetching club details:', error);
            setError('Kulüp bilgileri yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateClub = async () => {
        setSaving(true);
        try {
            await updateClub(club.id, editData);
            if (logoFile) {
                await uploadClubLogo(club.id, logoFile);
            }
            showToast('Kulüp bilgileri güncellendi!', 'success');
            setShowEditModal(false);
            fetchClub();
        } catch (err) {
            showToast('Hata: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleJoinClub = async () => {
        setSaving(true);
        try {
            await api.post(`/clubs/${id}/join`);
            setIsMember(true);
            fetchClub();
        } catch (err) {
            showToast('Hata: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLeaveClub = async () => {
        if (!confirm('Kulüpten ayrılmak istediğinize emin misiniz?')) return;
        setSaving(true);
        try {
            await api.delete(`/clubs/${id}/leave`);
            setIsMember(false);
            fetchClub();
        } catch (err) {
            showToast('Hata: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleAddActivity = async () => {
        setSaving(true);
        try {
            // Handle image upload if a file is selected
            let imageUrl = activityData.posterImage;
            if (activityData.file) {
                const formData = new FormData();
                formData.append('file', activityData.file);
                const uploadRes = await api.post('/announcements/upload', formData);
                imageUrl = uploadRes.url;
            }

            if (isEditingActivity) {
                const endpoint = activityType === 'announcement' ? `/announcements/${editingActivityId}` : `/events/${editingActivityId}`;
                const payload = activityType === 'announcement' ? {
                    title: activityData.title,
                    description: activityData.description,
                    linkTo: activityData.linkTo,
                    image: imageUrl || activityData.preview
                } : {
                    title: activityData.title,
                    description: activityData.description,
                    date: `${activityData.date}T${activityData.time}:00Z`,
                    isOnline: activityData.isOnline,
                    location: activityData.isOnline ? null : activityData.location,
                    zoomLink: activityData.isOnline ? activityData.zoomLink : null,
                    posterImage: imageUrl || activityData.preview,
                    requiresForm: activityData.requiresForm
                };
                await api.put(endpoint, payload);
                showToast('Güncellendi!', 'success');
            } else if (activityType === 'announcement') {
                await api.post('/announcements', {
                    title: activityData.title,
                    description: activityData.description,
                    image: imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
                    linkTo: activityData.linkTo,
                    clubId: club.id
                });
                showToast('Duyuru paylaşıldı!', 'success');
            } else {
                await api.post('/events', {
                    title: activityData.title,
                    description: activityData.description,
                    date: `${activityData.date}T${activityData.time}:00Z`,
                    isOnline: activityData.isOnline,
                    location: activityData.isOnline ? null : activityData.location,
                    zoomLink: activityData.isOnline ? activityData.zoomLink : null,
                    posterImage: imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
                    participantLimit: 100,
                    topics: club.categories || [],
                    clubId: club.id,
                    requiresForm: activityData.requiresForm,
                    eventType: 'standard',
                    paymentType: 'free'
                });
                showToast('Etkinlik eklendi!', 'success');
            }
            setShowActivityModal(false);
            setIsEditingActivity(false);
            setEditingActivityId(null);
            setActivityData({
                title: '',
                description: '',
                date: '',
                time: '',
                isOnline: false,
                location: '',
                zoomLink: '',
                posterImage: '',
                linkTo: '',
                file: null,
                preview: null,
                requiresForm: false
            });
            fetchClub();
        } catch (err) {
            showToast('Hata: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteActivity = async (type, id) => {
        if (!confirm('Bunu silmek istediğinize emin misiniz?')) return;
        try {
            const endpoint = type === 'event' ? `/events/${id}` : `/announcements/${id}`;
            await api.delete(endpoint);
            fetchClub();
        } catch (err) {
            showToast('Silme hatası: ' + err.message, 'error');
        }
    };

    const handleEditActivity = async (type, data) => {
        setActivityType(type);
        setEditingActivityId(data.id);
        setIsEditingActivity(true);
        
        if (type === 'announcement') {
            setActivityData({
                title: data.title,
                description: data.description,
                linkTo: data.linkTo || '',
                preview: data.image
            });
        } else {
            const dateObj = new Date(data.date);
            setActivityData({
                title: data.title,
                description: data.description,
                date: dateObj.toISOString().split('T')[0],
                time: dateObj.toISOString().split('T')[1].substring(0, 5),
                isOnline: data.isOnline,
                location: data.location || '',
                zoomLink: data.zoomLink || '',
                preview: data.posterImage,
                requiresForm: data.requiresForm || false
            });
        }
        setShowActivityModal(true);
    };

    const handleGalleryUpload = async () => {
        if (!galleryData.file) return;

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('file', galleryData.file);
            if (galleryData.caption) formData.append('caption', galleryData.caption);
            if (galleryData.eventName) formData.append('eventName', galleryData.eventName);

            await api.post(`/clubs/${club.id}/gallery`, formData);
            showToast('Görsel galeriye eklendi!', 'success');
            setShowGalleryModal(false);
            setGalleryData({ caption: '', eventName: '', file: null, preview: null });
            fetchClub();
        } catch (err) {
            showToast('Yükleme hatası: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveGalleryImage = async (imageId) => {
        if (!confirm('Bu görseli galeriden silmek istediğinize emin misiniz?')) return;
        
        try {
            await api.delete(`/clubs/gallery/${imageId}`);
            setSelectedImageIndex(null);
            fetchClub();
        } catch (err) {
            showToast('Silme hatası: ' + err.message, 'error');
        }
    };

    const handleEditGalleryImage = (img) => {
        setEditingGalleryItem(img);
        setGalleryEditData({
            caption: img.caption || '',
            eventName: img.eventName || ''
        });
        setShowGalleryEditModal(true);
    };

    const handleUpdateGalleryImage = async () => {
        setSaving(true);
        try {
            await api.put(`/clubs/gallery/${editingGalleryItem.id}`, galleryEditData);
            setShowGalleryEditModal(false);
            fetchClub();
        } catch (err) {
            showToast('Güncelleme hatası: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleMoveGalleryImage = async (index, direction) => {
        if (!club?.gallery) return;
        
        const newGallery = [...club.gallery];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= newGallery.length) return;
        
        // Swap
        [newGallery[index], newGallery[targetIndex]] = [newGallery[targetIndex], newGallery[index]];
        
        // Prepare order data
        const orderData = newGallery.map((img, idx) => ({
            imageId: img.id,
            displayOrder: idx
        }));
        
        try {
            await api.put(`/clubs/${club.id}/gallery/order`, orderData);
            fetchClub();
        } catch (err) {
            showToast('Sıralama hatası: ' + err.message, 'error');
        }
    };

    const handleToggleOfficial = async (userId, makeOfficial) => {
        try {
            const currentOfficialIds = officials.map(o => o.user?.id || o.userId);
            let newOfficialIds;
            
            if (makeOfficial) {
                newOfficialIds = [...new Set([...currentOfficialIds, userId])];
            } else {
                newOfficialIds = currentOfficialIds.filter(id => id !== userId);
            }
            
            await api.put(`/clubs/${club.id}/officials`, { officialUserIds: newOfficialIds });
            showToast(makeOfficial ? 'Üye yönetici yapıldı.' : 'Yöneticilik yetkisi alındı.', 'success');
            fetchClub();
        } catch (err) {
            showToast('Yetki güncelleme hatası: ' + (err.response?.data?.message || err.message), 'error');
        }
    };


    if (loading) return (
        <div className="page"><div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, border: '3px solid rgba(255,107,53,0.2)', borderTop: '3px solid var(--color-accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>Kulüp bilgileri yükleniyor...</p>
            </div>
        </div></div>
    );
    if (error || !club) return (
        <div className="page"><div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="glass-card poster-card" style={{ textAlign: 'center', padding: 'var(--spacing-xl) var(--spacing-xxl)', maxWidth: 420 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
                <h2 style={{ marginBottom: 8 }}>Kulüp Bulunamadı</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>{error || 'Bu kulüp mevcut değil veya kaldırılmış olabilir.'}</p>
                <Link to="/clubs" className="btn btn-primary mentorship-btn-primary">Kulüplere Dön</Link>
            </div>
        </div></div>
    );

    const canViewAnalytics = club.isOfficial || user?.role === 'admin';
    const categories = typeof club.categories === 'string' ? club.categories.split(',').filter(Boolean) : (Array.isArray(club.categories) ? club.categories : []);

    return (
        <div className="page">
            <div className="container">
                <div style={{ maxWidth: '860px', margin: '0 auto' }}>

                    {/* Hero Header Card */}
                    <div className="glass-card poster-card" style={{
                        position: 'relative',
                        overflow: 'hidden',
                        marginBottom: 'var(--spacing-xl)',
                        padding: 0,
                        background: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(139,92,246,0.08) 100%)',
                        border: '1px solid rgba(255,107,53,0.15)'
                    }}>
                        {/* Gradient accent bar */}
                        <div style={{ height: 4, background: 'linear-gradient(90deg, #FF6B35, #8B5CF6)', width: '100%' }} />

                        <div style={{ padding: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
                            {/* Logo */}
                            <div style={{
                                width: 100, height: 100, borderRadius: '50%',
                                background: club.logoUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #8B5CF6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', flexShrink: 0,
                                boxShadow: '0 8px 24px rgba(255,107,53,0.2)'
                            }}>
                                {club.logoUrl ? (
                                    <img src={club.logoUrl} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{club.name?.charAt(0)}</span>
                                )}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                                    <h1 className="mentorship-title" style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }}>{club.name}</h1>
                                    {club.isPremium && <PremiumBadge />}
                                </div>
                                <div style={{ display: 'flex', gap: 20, color: 'var(--color-text-secondary)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <MapPin size={15} /> {club.city || 'Belirtilmemiş'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Users size={15} /> <strong>{club.memberCount || 0}</strong> üye
                                    </div>
                                    
                                    {/* Social Links */}
                                    {club.instagramUrl && (
                                        <a href={club.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#E1306C', textDecoration: 'none', fontWeight: 600 }}>
                                            <Instagram size={15} /> Instagram
                                        </a>
                                    )}
                                    {club.linkedinUrl && (
                                        <a href={club.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0077B5', textDecoration: 'none', fontWeight: 600 }}>
                                            <Linkedin size={15} /> LinkedIn
                                        </a>
                                    )}
                                </div>

                                {/* Categories */}
                                {categories.length > 0 && (
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                                        {categories.map(cat => (
                                            <span key={cat} style={{
                                                padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600,
                                                background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(139,92,246,0.15))',
                                                color: 'var(--color-accent-primary)', borderRadius: 20,
                                                border: '1px solid rgba(255,107,53,0.2)'
                                            }}>{cat.trim()}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                {(club.isOfficial || user?.role === 'admin') && (
                                    <>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Edit2 size={15} /> Düzenle
                                        </button>
                                        <button className="btn btn-primary btn-sm"
                                            onClick={() => { setActivityType('announcement'); setShowActivityModal(true); }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Plus size={15} /> Ekle
                                        </button>
                                    </>
                                )}
                                {(!club.isOfficial && user?.role !== 'admin') && (
                                    <button 
                                        className={`btn btn-sm ${isMember ? 'btn-secondary' : 'btn-primary'}`}
                                        onClick={() => {
                                            if (!user) {
                                                setShowAuthModal(true);
                                                return;
                                            }
                                            isMember ? handleLeaveClub() : handleJoinClub();
                                        }}
                                        disabled={saving}
                                        style={{ minWidth: 100 }}
                                    >
                                        {isMember ? 'Ayrıl' : 'Katıl'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div style={{
                        display: 'flex', gap: 8, marginBottom: 'var(--spacing-xl)',
                        background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)', borderRadius: 16, padding: 4, flexWrap: 'wrap'
                    }}>
                        {[
                            { key: 'about', label: 'Hakkında' },
                            { key: 'activities', label: 'Etkinlikler' },
                            { key: 'gallery', label: 'Galeri' },
                            { key: 'members', label: 'Üyeler' },
                            ...(canViewAnalytics ? [{ key: 'analytics', label: '📊 Analitik' }] : [])
                        ].map(tab => (
                            <button key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer',
                                    borderRadius: 10, fontWeight: 600, fontSize: '0.85rem',
                                    transition: 'all 0.2s ease',
                                    background: activeTab === tab.key ? '#4c1d95' : 'transparent',
                                    color: activeTab === tab.key ? '#fff' : '#6b21a8',
                                }}
                            >{tab.label}</button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div>
                        {activeTab === 'about' && (
                            <div className="animate-fade-in">
                                <div className="glass-card poster-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
                                    <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Açıklama</h3>
                                    <div style={{ 
                                        marginBottom: '24px', 
                                        padding: '16px', 
                                        background: 'var(--color-subtle-bg)', 
                                        borderRadius: '12px', 
                                        borderLeft: '4px solid var(--color-accent-primary)',
                                        lineHeight: '1.7',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem'
                                    }}>
                                        {club.name?.includes('Animasyon ve Film Atölyesi') ? (
                                            "Animasyon ve Film Atölyesi Kulübü; teknoloji ve sanat odaklı, eğlenceyi merkeze alan sosyal bir topluluktur. Ünides projesi kapsamında TEDx Derinkuyu ve NEVFEST 2025 gibi büyük etkinlikler gerçekleştirilmiştir. Film geceleri, yarışmalar, cosplay etkinlikleri ve sosyal buluşmalarla üyelerine keyifli vakit geçirme ve yeni insanlarla tanışma fırsatı sunar."
                                        ) : (
                                            club.description || 'Kulüp açıklaması bulunmuyor.'
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-lg)' }}>
                                    <div className="glass-card poster-card" style={{ padding: 'var(--spacing-lg)' }}>
                                        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Users size={18} color="var(--color-accent-primary)" /> Yönetim Ekibi
                                        </h3>
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                            {/* President */}
                                            <div onClick={() => setSelectedUser(club.president)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.1)', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-highlight">
                                                <div style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', flexShrink: 0, borderRadius: '50%', background: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                                                    {club.president?.profilePicture ? (
                                                        <img src={club.president.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={club.president.name} />
                                                    ) : (
                                                        club.president?.name?.[0]
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{`${club.president?.name || ""} ${club.president?.surname || ""}`.trim()}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Kulüp Başkanı</div>
                                                </div>
                                            </div>

                                            {/* Officials */}
                                            {officials && officials.length > 0 && officials.map((off, idx) => (
                                                <div key={idx} onClick={() => setSelectedUser(off.user || off)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.1)', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-highlight">
                                                    <div style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', flexShrink: 0, borderRadius: '50%', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', overflow: 'hidden' }}>
                                                        {off.user?.profilePicture ? (
                                                            <img src={off.user.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={off.user.name} />
                                                        ) : (
                                                            off.user?.name?.[0]
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{`${off.user?.name || ""} ${off.user?.surname || ""}`.trim()}</div>
                                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{off.role === 'admin' ? 'Kulüp Temsilcisi' : off.role}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="glass-card poster-card" style={{ padding: 'var(--spacing-lg)' }}>
                                        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={18} color="var(--color-accent-primary)" /> En İlgi Çekici Etkinlikler
                                        </h3>
                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            {(events || []).sort((a, b) => (b.currentParticipants || 0) - (a.currentParticipants || 0)).slice(0, 3).map((event, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--color-subtle-bg)', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {event.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Users size={14} /> {event.currentParticipants || 0}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!events || events.length === 0) && (
                                                <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Henüz etkinlik bulunmuyor.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                            {activeTab === 'activities' && (
                                <div className="animate-fade-in">
                                    <ClubActivitiesTab 
                                        events={events} 
                                        announcements={announcements} 
                                        user={user}
                                        onRefresh={fetchClub}
                                        onDelete={handleDeleteActivity}
                                        onEdit={handleEditActivity}
                                        club={club}
                                        officials={officials}
                                    />
                                </div>
                            )}

                        {activeTab === 'analytics' && canViewAnalytics && (
                            <div className="animate-fade-in">
                                <ClubAnalyticsTab analytics={club.analytics} />
                            </div>
                        )}

                        {activeTab === 'gallery' && (
                            <div className="animate-fade-in">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                    <h3 style={{ margin: 0 }}>Fotoğraflar</h3>
                                    {(club.isOfficial || user?.role === 'admin') && (
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setShowGalleryModal(true)}
                                        >
                                            <Plus size={16} /> Fotoğraf Ekle
                                        </button>
                                    )}
                                </div>

                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                                    gap: 'var(--spacing-md)' 
                                }}>
                                    {(club.gallery || []).map((img, index) => (
                                        <div 
                                            key={img.id} 
                                            className="club-gallery-item"
                                            style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer' }}
                                            onClick={() => setSelectedImageIndex(index)}
                                        >
                                            <img 
                                                src={img.imageUrl} 
                                                alt={img.caption} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            />
                                            {img.eventName && (
                                                <div style={{
                                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                                    padding: '8px', color: 'white', fontSize: '0.75rem', fontWeight: '600'
                                                }}>
                                                    {img.eventName}
                                                </div>
                                            )}
                                            {(club.isOfficial || user?.role === 'admin') && (
                                                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleEditGalleryImage(img); }}
                                                        style={{ 
                                                            background: 'rgba(139, 92, 246, 0.8)', color: 'white', border: 'none', 
                                                            borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                        title="Düzenle"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveGalleryImage(img.id); }}
                                                        style={{ 
                                                            background: 'rgba(239, 68, 68, 0.8)', color: 'white', border: 'none', 
                                                            borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                        title="Sil"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {(club.isOfficial || user?.role === 'admin') && (
                                                <div style={{ 
                                                    position: 'absolute', bottom: '8px', right: '8px', 
                                                    display: 'flex', gap: '4px', opacity: 0, transition: 'opacity 0.2s' 
                                                }} className="gallery-order-controls">
                                                    {index > 0 && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleMoveGalleryImage(index, 'left'); }}
                                                            style={{ 
                                                                background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', 
                                                                borderRadius: '4px', padding: '4px', cursor: 'pointer'
                                                            }}
                                                        >
                                                            <ChevronLeft size={16} />
                                                        </button>
                                                    )}
                                                    {index < club.gallery.length - 1 && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleMoveGalleryImage(index, 'right'); }}
                                                            style={{ 
                                                                background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', 
                                                                borderRadius: '4px', padding: '4px', cursor: 'pointer'
                                                            }}
                                                        >
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(!club.gallery || club.gallery.length === 0) && (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
                                            Henüz fotoğraf yüklenmemiş.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div className="animate-fade-in">
                                <ClubMembersTab 
                                    clubId={club.id}
                                    showToast={showToast}
                                    onUserClick={(u) => setSelectedUser(u)} 
                                    members={members} 
                                    memberCount={club.memberCount || 0}
                                    isPresident={user?.id === (club.president?.id || club.presidentId) || user?.role === 'admin' || user?.email === 'ibrahimsafa1903@gmail.com'}
                                    presidentId={club.president?.id || club.presidentId}
                                    officials={officials}
                                    onToggleOfficial={handleToggleOfficial}
                                    canManageOfficials={user?.id === (club.president?.id || club.presidentId) || club.isOfficial || user?.role === 'admin' || user?.email === 'ibrahimsafa1903@gmail.com'}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            
            <UserProfileModal 
                isOpen={!!selectedUser} 
                onClose={() => setSelectedUser(null)} 
                user={selectedUser} 
                footerActions={
                    selectedUser && user?.id !== (selectedUser.id || selectedUser.userId) && (
                        <div style={{ marginTop: '20px' }}>
                            {(() => {
                                const uid = selectedUser.id || selectedUser.userId;
                                if (!uid) return null;
                                const status = getRequestStatus(uid);
                                const isConn = isConnection(uid);
                                
                                if (isConn) return (
                                    <button className="btn btn-secondary" disabled style={{ width: '100%', padding: '14px', borderRadius: '14px' }}>
                                        Bağlantılı ✓
                                    </button>
                                );
                                
                                if (status === 'sent') return (
                                    <button className="btn btn-secondary" style={{ width: '100%', padding: '14px', borderRadius: '14px' }} onClick={() => handleCancelRequest(getMatchId(uid))}>
                                        İstek Gönderildi (İptal Et)
                                    </button>
                                );

                                if (status === 'received') return (
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button className="btn btn-success" style={{ flex: 1, padding: '14px', borderRadius: '14px' }} onClick={() => handleAcceptRequest({id: getMatchId(uid), sender: selectedUser})}>
                                            Onayla
                                        </button>
                                        <button className="btn btn-danger" style={{ flex: 1, padding: '14px', borderRadius: '14px' }} onClick={() => handleRejectRequest({id: getMatchId(uid)})}>
                                            Reddet
                                        </button>
                                    </div>
                                );

                                return (
                                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                        <button
                                            style={{
                                                flex: 1, padding: '14px', borderRadius: '100px', fontWeight: '800',
                                                background: 'linear-gradient(135deg, #9333ea, #4c1d95)', color: '#ffffff',
                                                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', boxShadow: '0 8px 24px rgba(109, 40, 217, 0.4)',
                                                transition: 'transform 0.2s', fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            onClick={() => handleSendRequest(uid)}
                                        >
                                            <UserPlus size={18} style={{ marginRight: '8px' }} />
                                            Arkadaş Ekle
                                        </button>
                                        <button
                                            style={{
                                                flex: 1, padding: '14px', borderRadius: '100px', fontWeight: '800',
                                                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff',
                                                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                                                transition: 'transform 0.2s', fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            onClick={() => navigate(`/networking?schedule=${uid}`)}
                                        >
                                            <Calendar size={18} style={{ marginRight: '8px' }} />
                                            Görüşme (1⚡)
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    )
                }
            />


            <RequireAuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                message="Bu kulübe katılmak için giriş yapmalısınız." 
            />

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="glass-card poster-card" style={{ maxWidth: '500px', width: '100%', padding: 'var(--spacing-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                            <h3 style={{ margin: 0 }}>Kulüp Bilgilerini Düzenle</h3>
                            <button onClick={() => setShowEditModal(false)} className="btn-close"><X /></button>
                        </div>

                        <div className="form-group" style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <label>Kulüp Logosu</label>
                            <div 
                                onClick={() => logoInputRef.current?.click()}
                                style={{
                                    width: '100px', height: '100px', margin: '10px auto', borderRadius: '15px',
                                    border: '2px dashed var(--color-border)', cursor: 'pointer', overflow: 'hidden',
                                    background: logoPreview ? `url(${logoPreview}) center/cover` : 'var(--color-bg-tertiary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                {!logoPreview && <Camera size={24} color="var(--color-text-secondary)" />}
                            </div>
                            <input 
                                type="file" 
                                ref={logoInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={async e => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        try {
                                            const compressed = await compressImage(file);
                                            setLogoFile(compressed);
                                            setLogoPreview(URL.createObjectURL(compressed));
                                        } catch (err) {
                                            console.error("Görsel sıkıştırma hatası", err);
                                            setLogoFile(file);
                                            setLogoPreview(URL.createObjectURL(file));
                                        }
                                    }
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Kulüp Adı</label>
                            <input 
                                type="text" 
                                value={editData.name} 
                                onChange={e => setEditData({...editData, name: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label>Açıklama</label>
                            <textarea 
                                rows={3} 
                                value={editData.description} 
                                onChange={e => setEditData({...editData, description: e.target.value})}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>Şehir</label>
                                <select 
                                    value={editData.city} 
                                    onChange={e => setEditData({...editData, city: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                                >
                                    {turkishCities.map(city => <option key={city} value={city}>{city}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Üye Sayısı</label>
                                <input 
                                    type="number" 
                                    value={editData.memberCount} 
                                    onChange={e => setEditData({...editData, memberCount: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Instagram URL</label>
                            <input 
                                type="text" 
                                value={editData.instagramUrl} 
                                onChange={e => setEditData({...editData, instagramUrl: e.target.value})}
                                placeholder="https://instagram.com/..."
                            />
                        </div>

                        <div className="form-group">
                            <label>LinkedIn URL</label>
                            <input 
                                type="text" 
                                value={editData.linkedinUrl} 
                                onChange={e => setEditData({...editData, linkedinUrl: e.target.value})}
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Kategoriler</label>
                            <div className="hide-scrollbar" style={{ 
                                display: 'flex', flexWrap: 'nowrap', gap: '10px', marginTop: '8px',
                                overflowX: 'auto', overflowY: 'hidden', padding: '12px 4px',
                                width: '100%', WebkitOverflowScrolling: 'touch'
                            }}>
                                {clubCategories.map(cat => {
                                    const isSelected = editData.categories.includes(cat);
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                const newCats = isSelected 
                                                    ? editData.categories.filter(c => c !== cat)
                                                    : [...editData.categories, cat];
                                                setEditData({...editData, categories: newCats});
                                            }}
                                            style={{
                                                flexShrink: 0,
                                                padding: '8px 16px', fontSize: '0.85rem', borderRadius: '24px',
                                                border: '1px solid', borderColor: isSelected ? 'var(--color-accent-primary)' : 'var(--color-subtle-border)',
                                                background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'var(--color-bg-secondary)',
                                                color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>


                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
                            <button className="btn btn-ghost mentorship-btn-secondary" onClick={() => setShowEditModal(false)} style={{ flex: 1 }}>İptal</button>
                            <button className="btn btn-primary mentorship-btn-primary" onClick={handleUpdateClub} disabled={saving} style={{ flex: 2 }}>
                                {saving ? 'Kaydediliyor...' : 'Güncelle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {showActivityModal && (
                <div className="modal-overlay">
                    <div className="glass-card poster-card" style={{ maxWidth: '600px', width: '100%', padding: 'var(--spacing-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                            <h3 style={{ margin: 0 }}>{isEditingActivity ? 'Duyuru/Etkinlik Düzenle' : (activityType === 'announcement' ? 'Yeni Duyuru Paylaş' : 'Yeni Etkinlik Oluştur')}</h3>
                            <button onClick={() => { setShowActivityModal(false); setIsEditingActivity(false); }} className="btn-close"><X /></button>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                            <button 
                                className={`btn ${activityType === 'announcement' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActivityType('announcement')}
                                style={{ flex: 1 }}
                            >
                                <Megaphone size={16} /> Duyuru
                            </button>
                            <button 
                                className={`btn ${activityType === 'event' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActivityType('event')}
                                style={{ flex: 1 }}
                            >
                                <Calendar size={16} /> Etkinlik
                            </button>
                        </div>

                        <div className="form-group">
                            <label>Başlık</label>
                            <input 
                                type="text" 
                                value={activityData.title} 
                                onChange={e => setActivityData({...activityData, title: e.target.value})}
                                placeholder="Başlık giriniz..."
                            />
                        </div>

                        <div className="form-group">
                            <label>İçerik/Açıklama</label>
                            <textarea 
                                rows={4} 
                                value={activityData.description} 
                                onChange={e => setActivityData({...activityData, description: e.target.value})}
                                placeholder="Detaylı bilgi giriniz..."
                            />
                        </div>

                        {activityType === 'announcement' && (
                            <div className="form-group">
                                <label>Yönlendirme Linki (Opsiyonel)</label>
                                <input 
                                    type="text" 
                                    value={activityData.linkTo} 
                                    onChange={e => setActivityData({...activityData, linkTo: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                        )}

                        {activityType === 'event' && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label>Tarih</label>
                                        <input type="date" className="input date-time-input" value={activityData.date} onChange={e => setActivityData({...activityData, date: e.target.value})} style={{ colorScheme: 'light', color: 'var(--color-accent-primary)' }} />
                                    </div>
                                    <div className="form-group">
                                        <label>Saat</label>
                                        <input type="time" className="input date-time-input" value={activityData.time} onChange={e => setActivityData({...activityData, time: e.target.value})} style={{ colorScheme: 'light', color: 'var(--color-accent-primary)' }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Konum / Online</label>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <button 
                                            className={`btn btn-sm ${!activityData.isOnline ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setActivityData({...activityData, isOnline: false})}
                                            style={{ flex: 1, background: !activityData.isOnline ? 'var(--color-accent-primary)' : 'rgba(255, 255, 255, 0.5)', color: !activityData.isOnline ? 'white' : 'var(--color-accent-primary)' }}
                                        >Fiziksel</button>
                                        <button 
                                            className={`btn btn-sm ${activityData.isOnline ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setActivityData({...activityData, isOnline: true})}
                                            style={{ flex: 1, background: activityData.isOnline ? 'var(--color-accent-primary)' : 'rgba(255, 255, 255, 0.5)', color: activityData.isOnline ? 'white' : 'var(--color-accent-primary)' }}
                                        >Online</button>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={activityData.isOnline ? activityData.zoomLink : activityData.location} 
                                        onChange={e => setActivityData({
                                            ...activityData, 
                                            [activityData.isOnline ? 'zoomLink' : 'location']: e.target.value
                                        })}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-subtle-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-subtle-border)', cursor: 'pointer' }} onClick={() => setActivityData({...activityData, requiresForm: !activityData.requiresForm})}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Kayıt Formu Zorunlu Olsun mu?</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Aktif edilirse katılımcıların başvuru formunu doldurması gerekir.</div>
                                    </div>
                                    <div style={{ 
                                        width: '40px', height: '22px', borderRadius: '20px', 
                                        background: activityData.requiresForm ? 'var(--color-accent-primary)' : 'rgba(139, 92, 246, 0.2)',
                                        position: 'relative', transition: 'all 0.2s'
                                    }}>
                                        <div style={{ 
                                            width: '18px', height: '18px', borderRadius: '50%', background: activityData.requiresForm ? 'white' : 'var(--color-accent-primary)',
                                            position: 'absolute', top: '2px', left: activityData.requiresForm ? '20px' : '2px',
                                            transition: 'all 0.2s'
                                        }} />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Görsel (Afiş)</label>
                            <div 
                                onClick={() => activityFileRef.current?.click()}
                                style={{
                                    width: '100%', height: '140px', borderRadius: '12px', border: '2px dashed rgba(255,107,53,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                                    background: activityData.preview ? 'none' : 'rgba(255,107,53,0.05)', marginBottom: '10px'
                                }}
                            >
                                {activityData.preview ? (
                                    <img src={activityData.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                        <Camera size={24} style={{ marginBottom: '4px' }} />
                                        <div style={{ fontSize: '12px' }}>Görsel Seç</div>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={activityFileRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={async e => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        try {
                                            const compressed = await compressImage(file);
                                            setActivityData({
                                                ...activityData, 
                                                file: compressed, 
                                                preview: URL.createObjectURL(compressed)
                                            });
                                        } catch (err) {
                                            console.error("Görsel sıkıştırma hatası", err);
                                            setActivityData({
                                                ...activityData, 
                                                file, 
                                                preview: URL.createObjectURL(file)
                                            });
                                        }
                                    }
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
                            <button className="btn btn-ghost mentorship-btn-secondary" onClick={() => { setShowActivityModal(false); setIsEditingActivity(false); }} style={{ flex: 1 }}>İptal</button>
                            <button className="btn btn-primary mentorship-btn-primary" onClick={handleAddActivity} disabled={saving} style={{ flex: 2 }}>
                                {saving ? 'Kaydediliyor...' : (isEditingActivity ? 'Güncelle' : 'Ekle')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Gallery Modal */}
            {showGalleryModal && (
                <div className="modal-overlay">
                    <div className="glass-card poster-card" style={{ maxWidth: '500px', width: '100%', padding: 'var(--spacing-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                            <h3 style={{ margin: 0 }}>Galeriye Fotoğraf Ekle</h3>
                            <button onClick={() => setShowGalleryModal(false)} className="btn-close"><X /></button>
                        </div>

                        <div className="form-group" style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <div 
                                onClick={() => galleryInputRef.current?.click()}
                                style={{
                                    width: '100%', height: '200px', borderRadius: '12px', border: '2px dashed rgba(255,107,53,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                                    background: galleryData.preview ? 'none' : 'rgba(255,107,53,0.05)'
                                }}
                            >
                                {galleryData.preview ? (
                                    <img src={galleryData.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ color: 'var(--color-text-secondary)' }}>
                                        <Camera size={32} style={{ marginBottom: '8px' }} />
                                        <div>Fotoğraf Seç</div>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={galleryInputRef} 
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        try {
                                            const compressed = await compressImage(file);
                                            setGalleryData({
                                                ...galleryData, 
                                                file: compressed, 
                                                preview: URL.createObjectURL(compressed)
                                            });
                                        } catch (err) {
                                            console.error("Görsel sıkıştırma hatası", err);
                                            setGalleryData({
                                                ...galleryData, 
                                                file, 
                                                preview: URL.createObjectURL(file)
                                            });
                                        }
                                    }
                                }} 
                                style={{ display: 'none' }} 
                                accept="image/*"
                            />
                        </div>

                        <div className="form-group">
                            <label>Etkinlik Adı</label>
                            <input 
                                type="text" 
                                value={galleryData.eventName} 
                                onChange={e => setGalleryData({...galleryData, eventName: e.target.value})}
                                placeholder="Hangi etkinliğe ait? (Opsiyonel)"
                            />
                        </div>

                        <div className="form-group">
                            <label>Açıklama</label>
                            <input 
                                type="text" 
                                value={galleryData.caption} 
                                onChange={e => setGalleryData({...galleryData, caption: e.target.value})}
                                placeholder="Fotoğraf hakkında kısa bilgi..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
                            <button className="btn btn-ghost mentorship-btn-secondary" onClick={() => setShowGalleryModal(false)} style={{ flex: 1 }}>İptal</button>
                            <button className="btn btn-primary mentorship-btn-primary" onClick={handleGalleryUpload} disabled={saving || !galleryData.file} style={{ flex: 2 }}>
                                {saving ? 'Yükleniyor...' : 'Yükle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImageIndex !== null && club?.gallery?.[selectedImageIndex] && (
                <div className="club-lightbox" onClick={() => setSelectedImageIndex(null)}>
                    <button 
                        className="club-lightbox-close"
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(null); }}
                    >
                        <X size={24} />
                    </button>

                    {club.gallery.length > 1 && (
                        <>
                            <button 
                                className="club-lightbox-nav prev"
                                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                            >
                                <ChevronLeft size={32} />
                            </button>
                            <button 
                                className="club-lightbox-nav next"
                                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                            >
                                <ChevronRight size={32} />
                            </button>
                        </>
                    )}

                    <div className="club-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={club.gallery[selectedImageIndex].imageUrl} 
                            alt={club.gallery[selectedImageIndex].caption} 
                        />
                        {(club.gallery[selectedImageIndex].caption || club.gallery[selectedImageIndex].eventName) && (
                            <div className="club-lightbox-caption">
                                {club.gallery[selectedImageIndex].eventName && <strong>{club.gallery[selectedImageIndex].eventName}</strong>}
                                {club.gallery[selectedImageIndex].caption && (
                                    <span style={{ marginLeft: club.gallery[selectedImageIndex].eventName ? '8px' : '0' }}>
                                        {club.gallery[selectedImageIndex].caption}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Gallery Item Edit Modal */}
            {showGalleryEditModal && (
                <div className="modal-overlay">
                    <div className="glass-card poster-card" style={{ maxWidth: '450px', width: '100%', padding: 'var(--spacing-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                            <h3 style={{ margin: 0 }}>Görsel Bilgilerini Düzenle</h3>
                            <button onClick={() => setShowGalleryEditModal(false)} className="btn-close"><X /></button>
                        </div>

                        <div className="form-group">
                            <label>Etkinlik Adı</label>
                            <input 
                                type="text" 
                                value={galleryEditData.eventName} 
                                onChange={e => setGalleryEditData({...galleryEditData, eventName: e.target.value})}
                                placeholder="Etkinlik adı..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Açıklama</label>
                            <textarea 
                                rows={3} 
                                value={galleryEditData.caption} 
                                onChange={e => setGalleryEditData({...galleryEditData, caption: e.target.value})}
                                placeholder="Görsel açıklaması..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
                            <button className="btn btn-ghost mentorship-btn-secondary" onClick={() => setShowGalleryEditModal(false)} style={{ flex: 1 }}>İptal</button>
                            <button className="btn btn-primary mentorship-btn-primary" onClick={handleUpdateGalleryImage} disabled={saving} style={{ flex: 2 }}>
                                {saving ? 'Kaydediliyor...' : 'Güncelle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {toast && (

                <Toast 

                    message={toast.message} 

                    type={toast.type} 

                    onClose={() => setToast(null)}

                    duration={4000}

                />

            )}
</div>
    );
};

export default ClubDetailPage;
