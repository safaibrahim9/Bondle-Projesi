import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Calendar, 
    CreditCard, 
    Users, 
    BarChart3, 
    Trophy, 
    Shield, 
    Megaphone, 
    GraduationCap, 
    MessageSquare,
    ChevronRight,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Video,
    Building2,
    AlertTriangle,
    Copy,
    Award
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/Toast';

const AdminDashboard = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [statsData, setStatsData] = React.useState({
        totalEvents: 0,
        pendingPayments: 0,
        totalUsers: 0
    });
    const [pendingPaymentsList, setPendingPaymentsList] = React.useState([]);
    const [eventsList, setEventsList] = React.useState([]);
    const [branchRepsPerformance, setBranchRepsPerformance] = React.useState([]);
    const [pendingRegistrationsCount, setPendingRegistrationsCount] = React.useState(0);
    const [referralsData, setReferralsData] = React.useState(null);
    const [showReferralsModal, setShowReferralsModal] = React.useState(false);
    const [toastConfig, setToastConfig] = React.useState({ isOpen: false, message: '', type: 'success' });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            if (currentUser?.role === 'admin' || currentUser?.isBranchRepresentative) {
                try {
                    const stats = await api.getAdminDashboardStats();
                    setStatsData(stats);
                    
                    const payments = await api.getAdminPendingPayments();
                    setPendingPaymentsList(payments || []);
                } catch (e) {
                    console.warn('Could not fetch stats or payments', e);
                }

                try {
                    const pendingRegs = await api.getPendingRegistrations();
                    const regs = Array.isArray(pendingRegs) ? pendingRegs.length : 0;
                    
                    const pendingEvents = await api.getAdminEvents();
                    const events = Array.isArray(pendingEvents) ? pendingEvents.length : 0;
                    
                    setPendingRegistrationsCount(regs + events);
                } catch (e) {
                    console.warn('Could not fetch pending counts', e);
                }
            }

            if (currentUser?.role === 'campus_ambassador' || currentUser?.role === 'admin') {
                try {
                    const allEvents = await api.getAllAdminEvents();
                    setEventsList(allEvents || []);
                } catch (e) {
                    console.warn('Could not fetch events for representative', e);
                }
                
                try {
                    const referrals = await api.getMyReferrals();
                    setReferralsData(referrals);
                } catch (e) {
                    console.warn('Could not fetch referrals', e);
                }
            }

            if (currentUser?.role === 'admin') {
                // branchRepsPerformance logic moved to AdminAmbassadorsPage
            }
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = async (id) => {
        if (window.confirm('Ödemeyi onaylıyor musunuz?')) {
            try {
                await api.verifyAdminPayment(id);
                alert('Ödeme onaylandı. Kullanıcı artık etkinliğe kayıtlı.');
                fetchDashboardData();
            } catch (error) {
                console.error('Error verifying payment', error);
                alert('İşlem başarısız.');
            }
        }
    };

    const handleRejectPayment = async (id) => {
        if (window.confirm('Ödemeyi reddetmek istediğinize emin misiniz?')) {
            try {
                await api.rejectAdminPayment(id);
                alert('Ödeme reddedildi.');
                fetchDashboardData();
            } catch (error) {
                console.error('Error rejecting payment', error);
                alert('İşlem başarısız.');
            }
        }
    };

    const stats = [
        { 
            label: 'Toplam Etkinlik', 
            value: statsData.totalEvents, 
            icon: Calendar, 
            color: '#8b5cf6',
            bg: 'rgba(139, 92, 246, 0.1)'
        },
        { 
            label: 'Bekleyen Ödemeler', 
            value: statsData.pendingPayments, 
            icon: CreditCard, 
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.1)'
        },
        { 
            label: 'Toplam Kullanıcı', 
            value: statsData.totalUsers, 
            icon: Users, 
            color: '#10b981',
            bg: 'rgba(16, 185, 129, 0.1)'
        },
        {
            label: 'Bekleyen Başvurular',
            value: pendingRegistrationsCount,
            icon: CheckCircle2,
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.1)',
            link: '/admin/event-approvals'
        },
    ];

    const allQuickLinks = [
        { 
            to: "/admin/events", 
            title: "Etkinlik Yönetimi", 
            desc: "Etkinlik oluştur, düzenle, sil", 
            icon: Calendar, 
            color: "#8b5cf6" 
        },
        { 
            to: "/admin/event-approvals", 
            title: "Etkinlik Onayları", 
            desc: "Bekleyen katılım başvuruları", 
            icon: BarChart3, 
            color: "#f59e0b" 
        },
        { 
            to: "/admin/competitions", 
            title: "Yarışma & Eğitim", 
            desc: "Yarışma ve eğitim programlarını yönet", 
            icon: Trophy, 
            color: "#ec4899" 
        },
        { 
            to: "/admin/mentorship", 
            title: "Mentorluk Yönetimi", 
            desc: "Programlar ve başvurular", 
            icon: GraduationCap, 
            color: "#6366f1" 
        },
        { 
            to: "/admin/announcements", 
            title: "Duyuru Yönetimi", 
            desc: "Ana sayfa afişlerini yönet", 
            icon: Megaphone, 
            color: "#f43f5e" 
        },
        { 
            to: "/admin/feedback", 
            title: "Geri Bildirimler", 
            desc: "Kullanıcı öneri ve şikayetleri", 
            icon: MessageSquare, 
            color: "#3b82f6" 
        },
        { 
            to: "/admin/tasks", 
            title: "Görev Yönetimi (Ekip)", 
            desc: "Ekip üyelerine görev ata", 
            icon: CheckCircle2, 
            color: "#8b5cf6" 
        },
        { 
            to: "/my-tasks", 
            title: "Bana Atanan Görevler", 
            desc: "Kendi görevlerimi gör", 
            icon: CheckCircle2, 
            color: "#f43f5e" 
        },
        { 
            to: "/admin/users", 
            title: "Kullanıcı Yönetimi", 
            desc: "Kullanıcıları yönet, banla", 
            icon: Users, 
            color: "#14b8a6" 
        },
        { 
            to: "/admin/premium-approvals", 
            title: "Premium Onayları", 
            desc: "Bekleyen premium başvuruları", 
            icon: Shield, 
            color: "#f97316" 
        },
        { 
            to: "/admin/club-management", 
            title: "Kulüp Yönetimi", 
            desc: "Kulüpleri yönet, yetkili ata", 
            icon: Building2, 
            color: "#10b981" 
        },
        { 
            to: "/admin/pending-clubs", 
            title: "Kulüp Başvuruları", 
            desc: "Yeni kulüp isteklerini onayla", 
            icon: CheckCircle2, 
            color: "#06b6d4" 
        },
        { 
            to: "/admin/assign-meeting", 
            title: "Görüşme Atama", 
            desc: "İki kullanıcıya manuel görüşme ata", 
            icon: Video, 
            color: "#38bdf8" 
        },
        { 
            to: "/admin/daily-answers", 
            title: "Günün Sorusu Yanıtları", 
            desc: "Kullanıcıların sesli ve metin yanıtları", 
            icon: MessageSquare, 
            color: "#10b981" 
        },
        { 
            to: "/admin/reports", 
            title: "Kullanıcı Raporları", 
            desc: "Şikayetleri incele ve yönet", 
            icon: AlertTriangle, 
            color: "#ef4444" 
        },
        { 
            to: "/admin/analytics", 
            title: "Kullanım Analizi", 
            desc: "Uygulama ve sayfa bazlı istatistikler", 
            icon: BarChart3, 
            color: "#3b82f6" 
        },
        { 
            to: "/admin/ambassadors", 
            title: "Kampüs Elçileri", 
            desc: "Kampüs elçisi performansları", 
            icon: Award, 
            color: "#ec4899" 
        }
    ];

    const quickLinks = currentUser?.role === 'admin' 
        ? allQuickLinks 
        : allQuickLinks.filter(l => 
            l.to === '/admin/tasks' || 
            l.to === '/my-tasks' ||
            l.to === '/admin/users' || 
            ((currentUser?.canCreateEvents || currentUser?.isBranchRepresentative) && l.to === '/admin/events')
        );

    return (
        <div className="page" style={{ background: 'linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)' }}>
            {toastConfig.isOpen && (
                <Toast 
                    message={toastConfig.message} 
                    type={toastConfig.type} 
                    onClose={() => setToastConfig({ ...toastConfig, isOpen: false })} 
                />
            )}
            <div className="container">
                <div className="page-header" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xs)' }}>
                        <div style={{ padding: '8px', background: 'var(--color-accent-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={20} color="white" />
                        </div>
                        <h1 style={{ fontSize: 'var(--font-size-3xl)', margin: 0, background: 'linear-gradient(90deg, var(--gradient-text-start), var(--gradient-text-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {currentUser?.role === 'admin' ? 'Admin Paneli' : 'Temsilci Paneli'}
                        </h1>
                    </div>
                    <p className="text-secondary">
                        {currentUser?.role === 'admin' ? 'Bondle platformunun genel durumunu izleyin ve yönetin.' : 'Şubenizdeki etkinlikleri, görevleri ve kullanıcıları yönetin.'}
                    </p>
                </div>

                {/* Stats Cards - Admin Only */}
                {currentUser?.role === 'admin' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-3xl)' }}>
                        {stats.map(({ label, value, icon: Icon, color, bg, link }) => (
                            <div
                                key={label}
                                className="card poster-card glass-card"
                                onClick={() => link && navigate(link)}
                                style={{ 
                                    padding: 'var(--spacing-xl)', 
                                    position: 'relative', 
                                    overflow: 'hidden',
                                    border: link && value > 0 ? `1px solid ${color}55` : '1px solid var(--color-subtle-border)',
                                    background: link && value > 0 ? 'var(--color-subtle-bg)' : 'var(--color-subtle-bg)',
                                    backdropFilter: 'blur(10px)',
                                    cursor: link ? 'pointer' : 'default',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => { if (link) e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={(e) => { if (link) e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: color, filter: 'blur(60px)', opacity: link && value > 0 ? 0.2 : 0.1 }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={32} color={color} />
                                    </div>
                                    <div>
                                        <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', marginBottom: '4px' }}>{label}</div>
                                        <div style={{ fontSize: '32px', fontWeight: '800', color: link && value > 0 ? color : 'var(--color-text-primary)', letterSpacing: '-1px' }}>{value}</div>
                                        {link && value > 0 && (
                                            <div style={{ fontSize: '11px', color, marginTop: '2px', fontWeight: '600' }}>İncele →</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {(!currentUser || currentUser.role !== 'campus_ambassador' || currentUser.role === 'admin') && (
                <div style={{ display: 'grid', gridTemplateColumns: currentUser?.role === 'admin' ? '2fr 1fr' : '1fr', gap: 'var(--spacing-2xl)', alignItems: 'start' }}>
                    
                    {/* Left: Quick Access Grid */}
                    <div>
                        <h2 style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <BarChart3 size={24} color="var(--color-accent-primary)" />
                            Hızlı Erişim
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                            {quickLinks.map((link) => (
                                <Link 
                                    key={link.to} 
                                    to={link.to} 
                                    className="card poster-card glass-card" 
                                    style={{ 
                                        padding: 'var(--spacing-lg)', 
                                        textDecoration: 'none', 
                                        display: 'block',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.borderColor = link.color + '44';
                                        e.currentTarget.style.background = 'var(--color-subtle-bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'var(--color-subtle-border)';
                                        e.currentTarget.style.background = 'var(--color-subtle-bg)';
                                    }}
                                >
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: link.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
                                        <link.icon size={24} color={link.color} />
                                    </div>
                                    <h3 style={{ fontSize: '16px', marginBottom: '4px', color: 'var(--color-text-primary)' }}>{link.title}</h3>
                                    <p className="text-secondary" style={{ fontSize: '12px', marginBottom: 0, lineHeight: '1.4' }}>
                                        {link.desc}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right: Pending Payments List */}
                    {currentUser?.role === 'admin' && (
                    <div>
                        <h2 style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CreditCard size={24} color="#f59e0b" />
                            Ödeme Doğrulama
                        </h2>
                        <div className="card poster-card glass-card" style={{ padding: 'var(--spacing-md)' }}>
                            {pendingPaymentsList.length === 0 ? (
                                <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                                    <div style={{ marginBottom: 'var(--spacing-sm)', opacity: 0.5 }}><CheckCircle2 size={40} style={{ margin: '0 auto' }} /></div>
                                    <p className="text-secondary" style={{ fontSize: '14px' }}>Bekleyen ödeme bulunmuyor.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    {pendingPaymentsList.map((registration) => {
                                        const u = registration.user || registration.User || {};
                                        const e = registration.event || registration.Event || {};
                                        const displayName = u.name || u.surname ? `${u.name || ''} ${u.surname || ''}`.trim() : (registration.userId ? `Kullanıcı ID: ${registration.userId}` : 'Bilinmeyen Kullanıcı');
                                        const initial = (u.name || 'U').charAt(0).toUpperCase();
                                        const eventTitle = e.title || e.name || (registration.eventId ? `Etkinlik ID: ${registration.eventId}` : 'Bilinmeyen Etkinlik');
                                        const price = e.price || registration.price || registration.amount || '0';

                                        return (
                                            <div key={registration.id} className=" admin-list-item" style={{
                                                padding: 'var(--spacing-md)',
                                                borderRadius: '12px',
                                                background: 'var(--color-subtle-bg)',
                                                border: '1px solid var(--color-subtle-border)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #475569, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--color-text-on-accent)' }}>
                                                        {initial}
                                                    </div>
                                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                                        <h4 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</h4>
                                                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{eventTitle}</div>
                                                    </div>
                                                    <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '14px' }}>₺{price}</div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleVerifyPayment(registration.id)}
                                                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                                    >
                                                        <CheckCircle2 size={14} /> Onayla
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectPayment(registration.id)}
                                                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                                    >
                                                        <XCircle size={14} /> Reddet
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => window.open('https://www.shopier.com', '_blank')}
                                                    style={{ width: '100%', marginTop: '8px', padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                                                >
                                                    Shopier'i Kontrol Et
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                </div>
                )}



                {/* Kampüs Elçisi Paneli */}
                {currentUser?.role === 'campus_ambassador' && (
                    <div className="card glass-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)', background: 'var(--color-bg-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-xl)' }}>
                            <Award size={24} color="#8b5cf6" />
                            <h2 style={{ margin: 0, color: '#8b5cf6', fontSize: '20px' }}>Kampüs Elçisi Paneli</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                            {/* Genel Davet Linki */}
                            <div style={{ 
                                background: 'var(--color-bg-primary)', 
                                border: '1px solid var(--color-subtle-border)', 
                                borderRadius: '12px', 
                                padding: 'var(--spacing-lg)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '13px', color: '#8b5cf6', marginBottom: '8px', fontWeight: '500' }}>Genel Davet Linki</div>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#8b5cf6', letterSpacing: '0.5px' }}>{currentUser?.referralCode || 'UNV-XXXXXX'}</div>
                                </div>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        const url = `https://bondlecommunity.com/register?ref=${currentUser?.referralCode || ''}`;
                                        navigator.clipboard.writeText(url);
                                        setToastConfig({ isOpen: true, message: 'Genel davet linki kopyalandı!', type: 'success' });
                                    }}
                                    style={{
                                        background: '#8b5cf6',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Kopyala
                                </button>
                            </div>

                            {/* Kulüp Kurma Linki */}
                            <div style={{ 
                                background: 'var(--color-bg-primary)', 
                                border: '1px solid var(--color-subtle-border)', 
                                borderRadius: '12px', 
                                padding: 'var(--spacing-lg)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '13px', color: '#8b5cf6', marginBottom: '8px', fontWeight: '500' }}>Kulüp Kurma Linki</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#8b5cf6' }}>/clubs/create</div>
                                </div>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        const url = `https://bondlecommunity.com/clubs/create?ref=${currentUser?.referralCode || ''}`;
                                        navigator.clipboard.writeText(url);
                                        setToastConfig({ isOpen: true, message: 'Kulüp kurma linki kopyalandı!', type: 'success' });
                                    }}
                                    style={{
                                        background: '#8b5cf6',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Kopyala
                                </button>
                            </div>

                            {/* Referansla Kayıt Olanlar */}
                            {referralsData && (
                                <div style={{ 
                                    background: 'var(--color-bg-primary)', 
                                    border: '1px solid var(--color-subtle-border)', 
                                    borderRadius: '12px', 
                                    padding: 'var(--spacing-lg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ fontSize: '13px', color: '#8b5cf6', marginBottom: '8px', fontWeight: '500' }}>Referansla Kayıt Olan Kişiler</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#4c1d95', marginBottom: '8px' }}>
                                        {referralsData.totalReferrals} Kişi
                                    </div>
                                    {referralsData.referrals && referralsData.referrals.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {referralsData.referrals.slice(0, 3).map(u => (
                                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                        {u.profilePicture ? <img src={u.profilePicture} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : u.name.charAt(0)}
                                                    </div>
                                                    <span style={{ fontWeight: '500' }}>{u.name} {u.surname}</span>
                                                </div>
                                            ))}
                                            {referralsData.totalReferrals > 3 && (
                                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                                    ve {referralsData.totalReferrals - 3} kişi daha...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Events List for Branch Representatives */}
                {(currentUser?.role === 'campus_ambassador' || currentUser?.role === 'admin') && (
                    <div style={{ marginTop: 'var(--spacing-2xl)' }}>
                        <h2 style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Calendar size={24} color="#8b5cf6" />
                            Etkinlik Davet Linkleri
                        </h2>
                        <div className="card poster-card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            {eventsList.length === 0 ? (
                                <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    Henüz etkinlik bulunmuyor.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {eventsList.map((event, index) => (
                                        <div key={event.id} className="admin-list-item" style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: 'var(--spacing-md)',
                                            borderBottom: index !== eventsList.length - 1 ? '1px solid var(--color-subtle-border)' : 'none',
                                            backgroundColor: 'var(--color-subtle-bg)',
                                            transition: 'background-color 0.2s ease',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1 }}>
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                    border: '1px solid var(--color-subtle-border)'
                                                }}>
                                                    <img
                                                        src={event.posterImage || event.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                                                        alt={event.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '15px', color: 'var(--color-text-primary)' }}>{event.title}</h4>
                                                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                                        {new Date(event.date).toLocaleDateString('tr-TR')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                <button
                                                    onClick={() => {
                                                        const url = `https://bondlecommunity.com/events/${event.id}?ref=${currentUser?.referralCode || ''}`;
                                                        navigator.clipboard.writeText(url);
                                                        setToastConfig({ isOpen: true, message: 'Davet linki kopyalandı!', type: 'success' });
                                                    }}
                                                    className="btn"
                                                    style={{
                                                        padding: '8px 12px',
                                                        fontSize: '13px',
                                                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                                        color: '#8b5cf6',
                                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <Copy size={14} />
                                                    Davet Linkini Kopyala
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
