import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Globe, Building2, User, Trophy, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RequireAuthModal from '../RequireAuthModal';
import './BottomNav.css';

const BottomNav = () => {
    const { user } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalContent, setAuthModalContent] = useState({
        title: 'Giriş Yapmanız Gerekiyor',
        message: 'Bu sayfayı görüntülemek için giriş yapmalısınız.',
        icon: undefined
    });

    // Show Clubs for everyone as the 4th item
    const fourthNavItem = { path: '/clubs', icon: Building2, label: 'Kulüpler', protected: true };

    // Network button is now in the CENTER (3rd position)
    const navItems = [
        { path: '/', icon: Home, label: 'Ana Sayfa' },
        { path: '/events', icon: Calendar, label: 'Etkinlikler' },
        { path: '/network', icon: Globe, label: 'Network', isCenter: true, protected: true }, // CENTER & PROMINENT
        fourthNavItem,
        { path: '/profile', icon: User, label: 'Profil', protected: true },
    ];

    const handleNavClick = (e, item) => {
        if (item.protected && !user) {
            e.preventDefault();
            let content = {
                title: 'Giriş Yapmanız Gerekiyor',
                message: 'Bu sayfayı görüntülemek için giriş yapmalısınız.',
                icon: undefined
            };
            if (item.path === '/network') {
                content = {
                    title: 'Networking & Bağlantılar',
                    message: 'Sizinle aynı ilgi alanlarına sahip profesyonellerle tanışın ve ağınızı genişleterek kariyerinizde öne geçin.',
                    icon: Globe
                };
            } else if (item.path === '/events') {
                content = {
                    title: 'Etkinlikler & Fırsatlar',
                    message: 'Kariyerinize yön verecek eğitimlere, yarışmalara ve özel networking etkinliklerine katılmak için giriş yapın.',
                    icon: Calendar
                };
            } else if (item.path === '/clubs') {
                content = {
                    title: 'Kulüpler',
                    message: 'Üniversitendeki kulüpleri keşfetmek, üye olmak ve etkinliklerine katılmak için giriş yapmalısın.',
                    icon: Building2
                };
            }
            setAuthModalContent(content);
            setShowAuthModal(true);
        }
    };

    return (
        <>
            <nav className="bottom-nav">
                <div className="bottom-nav-container">
                    {navItems.map((item) => {
                        const { path, icon: Icon, label, isCenter } = item;
                        return (
                            <NavLink
                                key={path}
                                to={path}
                                replace
                                onClick={(e) => handleNavClick(e, item)}
                                className={({ isActive }) =>
                                    `bottom-nav-item ${isActive ? 'active' : ''} ${isCenter ? 'center-item' : ''}`
                                }
                                end={path === '/'}
                            >
                                <Icon size={isCenter ? 28 : 24} />
                                <span className="bottom-nav-label">{label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </nav>
            <RequireAuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                title={authModalContent.title}
                message={authModalContent.message}
                icon={authModalContent.icon}
            />
        </>
    );
};

export default BottomNav;
