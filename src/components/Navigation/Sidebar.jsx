import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Globe, Building2, User, Trophy, Bell, LogOut, LogIn, GraduationCap, ShieldCheck, Award, MessageSquare, BarChart3, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RequireAuthModal from '../RequireAuthModal';
import api from '../../services/api';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalContent, setAuthModalContent] = useState({
        title: 'Giriş Yapmanız Gerekiyor',
        message: 'Bu sayfayı görüntülemek için giriş yapmalısınız.',
        icon: undefined
    });
    const navItems = [
        { path: '/', icon: Home, label: 'Ana Sayfa' },
        { path: '/community', icon: MessageSquare, label: 'Topluluk', protected: true },
        { path: '/events', icon: Calendar, label: 'Etkinlikler' },
        { path: '/network', icon: Globe, label: 'Network', protected: true },
        { path: '/mentorship', icon: GraduationCap, label: 'Mentorluk' },
        { path: '/clubs', icon: Building2, label: 'Kulüpler' },

        { path: '/premium/ai-coach', icon: Sparkles, label: 'AI Kariyer Koçu', protected: true },
        { path: '/notifications', icon: Bell, label: 'Bildirimler', badge: unreadCount, protected: true },
        { path: '/leaderboard', icon: Award, label: 'Liderlik Tablosu', protected: true },
        { path: '/profile', icon: User, label: 'Profil', protected: true },
    ];

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            // Polling removed to prevent excessive DB egress (Supabase limit issue)
        }
    }, [user]);

    const fetchUnreadCount = async () => {
        try {
            const data = await api.getUnreadNotificationCount();
            setUnreadCount(data?.count || 0);
        } catch (err) {
            // Silently fail
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl) 0' }}>
                <img 
                    src="/assets/bondle-logo-black.png" 
                    alt="Bondle" 
                    style={{ height: '50px', width: 'auto', objectFit: 'contain' }} 
                />
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const { path, icon: Icon, label, badge } = item;
                    return (
                    <NavLink
                        key={path}
                        to={path}
                        replace
                        className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'active' : ''}`
                        }
                        end={path === '/'}
                        onClick={(e) => {
                            if (item.protected && !user) {
                                e.preventDefault();
                                let content = {
                                    title: 'Giriş Yapmanız Gerekiyor',
                                    message: 'Bu sayfayı görüntülemek için giriş yapmalısınız.',
                                    icon: undefined
                                };
                                if (path === '/network') {
                                    content = {
                                        title: 'Networking & Bağlantılar',
                                        message: 'Sizinle aynı ilgi alanlarına sahip profesyonellerle tanışın ve ağınızı genişleterek kariyerinizde öne geçin.',
                                        icon: Globe
                                    };
                                } else if (path === '/events') {
                                    content = {
                                        title: 'Etkinlikler & Fırsatlar',
                                        message: 'Kariyerinize yön verecek eğitimlere, yarışmalara ve özel networking etkinliklerine katılmak için giriş yapın.',
                                        icon: Calendar
                                    };
                                } else if (path === '/mentorship') {
                                    content = {
                                        title: 'Mentorluk Programı',
                                        message: 'Sektör profesyonellerinden birebir mentorluk almak ve tecrübelerinden faydalanmak için giriş yapın.',
                                        icon: GraduationCap
                                    };
                                } else if (path === '/premium/ai-coach') {
                                    content = {
                                        title: 'AI Kariyer Koçu',
                                        message: 'Özgeçmişinizi yapay zeka ile analiz edin, mülakat simülasyonları yapın ve kariyer yolculuğunuzda size özel tavsiyeler alın.',
                                        icon: Sparkles
                                    };
                                } else if (path === '/community') {
                                    content = {
                                        title: 'Topluluk',
                                        message: 'Kariyeriniz ve eğitiminiz hakkında sorular sorun, dilediğiniz görsellerle paylaşımlar yapın ve tartışmalara katılın.',
                                        icon: MessageSquare
                                    };
                                } else if (path === '/leaderboard') {
                                    content = {
                                        title: 'Liderlik Tablosu',
                                        message: 'Platformdaki en aktif üyeleri görün, puan durumunuzu takip edin ve diğerleriyle rekabet ederek zirveye ulaşın.',
                                        icon: Award
                                    };
                                }
                                setAuthModalContent(content);
                                setShowAuthModal(true);
                            } else if (path === '/notifications') {
                                setUnreadCount(0);
                            }
                        }}
                    >
                        <div style={{ position: 'relative', display: 'inline-flex' }}>
                            <Icon size={24} className="sidebar-icon" />
                            {badge > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-8px',
                                    backgroundColor: '#ef4444',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    minWidth: '18px',
                                    height: '18px',
                                    borderRadius: '9px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 4px',
                                }}>
                                    {badge > 9 ? '9+' : badge}
                                </span>
                            )}
                        </div>
                        <span className="sidebar-label">{label}</span>
                    </NavLink>
                )})}

                {/* Admin & Club Management Links */}
                {(user?.role === 'admin' || user?.role === 'club_management' || user?.role === 'club_president' || user?.isBranchRepresentative || user?.role === 'campus_ambassador') && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ padding: '0 25px', marginBottom: '10px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            YÖNETİM
                        </div>
                        
                        {user?.role === 'admin' && (
                            <NavLink
                                to="/admin/assign-meeting"
                                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                            >
                                <ShieldCheck size={24} className="sidebar-icon" />
                                <span className="sidebar-label">Görüşme Atama</span>
                            </NavLink>
                        )}

                        {(user?.role === 'admin' || user?.role === 'club_management' || user?.role === 'club_president') && (
                            <NavLink
                                to="/admin/club-management"
                                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                            >
                                <Building2 size={24} className="sidebar-icon" />
                                <span className="sidebar-label">Kulüp Yönetimi</span>
                            </NavLink>
                        )}

                        {(user?.role === 'admin' || user?.isBranchRepresentative || user?.role === 'campus_ambassador' || user?.canCreateEvents) && (
                            <NavLink
                                to="/admin"
                                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                            >
                                <ShieldCheck size={24} className="sidebar-icon" />
                                <span className="sidebar-label">{user?.role === 'admin' ? 'Admin Panel' : ((user?.isBranchRepresentative || user?.role === 'campus_ambassador') ? 'Temsilci Paneli' : 'Etkinlik Yönetimi')}</span>
                            </NavLink>
                        )}

                        {user?.role === 'admin' && (
                            <NavLink
                                to="/admin/analytics"
                                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                            >
                                <BarChart3 size={24} className="sidebar-icon" />
                                <span className="sidebar-label">Kullanım Analizi</span>
                            </NavLink>
                        )}
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                {user ? (
                    <button onClick={logout} className="sidebar-item logout-btn">
                        <LogOut size={24} className="sidebar-icon" />
                        <span className="sidebar-label">Çıkış Yap</span>
                    </button>
                ) : (
                    <button onClick={() => navigate('/login')} className="sidebar-item" style={{ background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '12px' }}>
                        <LogIn size={24} className="sidebar-icon" />
                        <span className="sidebar-label">Giriş Yap / Kayıt Ol</span>
                    </button>
                )}
            </div>
            <RequireAuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                title={authModalContent.title}
                message={authModalContent.message}
                icon={authModalContent.icon}
            />
        </aside>
    );
};

export default Sidebar;

