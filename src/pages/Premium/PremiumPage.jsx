import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Zap, Check, Brain, Users, Ticket, FolderGit2, MessageSquarePlus, Eye } from 'lucide-react';
import api from '../../services/api';
import Toast from '../../components/Toast';

const PremiumPage = () => {
    const { user, isPremium } = useAuth();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [toastConfig, setToastConfig] = useState({ isOpen: false, message: '', type: 'success' });
    const [hasRequested, setHasRequested] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');

    useEffect(() => {
        document.title = 'Bondle | Premium';
    }, []);

    const handleUpgrade = () => {
        setIsProcessing(true);
        try {
            const url = billingCycle === 'yearly'
                ? 'https://www.shopier.com/Bondle/49048080'
                : 'https://www.shopier.com/Bondle/49047847';
            window.open(url, '_blank');
        } catch (error) {
            setToastConfig({ isOpen: true, message: 'Ödeme sayfasına yönlendirilirken bir hata oluştu.', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentDone = async () => {
        try {
            setIsProcessing(true);
            await api.createPremiumRequest({ plan: billingCycle });
            setToastConfig({ isOpen: true, message: 'Ödeme bildiriminiz iletildi. Hesabınız kısa süre içinde onaylanacak.', type: 'success' });
            setHasRequested(true);
        } catch (error) {
            setToastConfig({ isOpen: true, message: error.message || 'Bildirim iletilirken bir hata oluştu.', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const benefits = [
        { icon: Brain, title: 'AI Kariyer Koçu', desc: 'Sınırsız CV & mülakat koçu' },
        { icon: Users, title: 'Sınırsız Eşleşme', desc: 'Herkesle bağlantı kur' },
        { icon: Ticket, title: 'Ücretsiz Etkinlikler', desc: 'Circle & Quiz Night bedava' },
        { icon: FolderGit2, title: 'Proje Ortağı', desc: 'Takım kur, proje bul' },
        { icon: MessageSquarePlus, title: 'Süper Mesaj', desc: 'Ayda 3 direkt mesaj' },
        { icon: Eye, title: 'Profil Görünürlüğü', desc: 'Kim baktı, en üste çık' },
    ];

    const features = [
        { label: 'AI Koç', free: 'Günlük 1', premium: 'Sınırsız' },
        { label: 'Eşleşme', free: 'Ayda 5', premium: 'Sınırsız' },
        { label: 'Etkinlik', free: 'Normal sıra', premium: '24 saat erken' },
        { label: 'Circle & Quiz', free: 'Ücretli', premium: 'Ücretsiz' },
        { label: 'Proje Ortağı', free: '✗', premium: '✓' },
        { label: 'Workshop İndirimi', free: '✗', premium: '%10-20' },
    ];

    if (isPremium()) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: '400px', textAlign: 'center', paddingTop: '60px' }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto var(--spacing-lg)',
                        boxShadow: '0 12px 28px rgba(251, 191, 36, 0.35)'
                    }}>
                        <Zap size={32} fill="#000" color="#000" />
                    </div>
                    <h2 style={{ fontWeight: '800', marginBottom: '8px' }}>Premium Üyesiniz! ✨</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                        Tüm ayrıcalıklara erişiminiz açık.
                    </p>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ background: 'transparent' }}>
            {toastConfig.isOpen && (
                <Toast
                    message={toastConfig.message}
                    type={toastConfig.type}
                    onClose={() => setToastConfig({ ...toastConfig, isOpen: false })}
                />
            )}

            <div className="container" style={{ maxWidth: '440px', paddingBottom: '80px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', padding: 'var(--spacing-lg) 0 var(--spacing-xl)' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '18px',
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto var(--spacing-md)',
                        boxShadow: '0 8px 20px rgba(251, 191, 36, 0.3)'
                    }}>
                        <Zap size={26} fill="#000" color="#000" />
                    </div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '6px' }}>Bondle Premium</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        Ayrıcalıklı topluluk deneyimine katıl
                    </p>
                </div>

                {/* Benefits Grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '10px', marginBottom: 'var(--spacing-xl)'
                }}>
                    {benefits.map(({ icon: Icon, title, desc }) => (
                        <div key={title} style={{
                            padding: '14px',
                            background: 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(109, 40, 217, 0.1)',
                            borderRadius: '16px',
                            backdropFilter: 'blur(8px)'
                        }}>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '10px',
                                background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '8px'
                            }}>
                                <Icon size={17} color="#d97706" />
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--color-text-primary)', marginBottom: '2px' }}>{title}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{desc}</div>
                        </div>
                    ))}
                </div>

                {/* Feature Table */}
                <div style={{
                    background: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(109, 40, 217, 0.12)',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    marginBottom: 'var(--spacing-xl)',
                    backdropFilter: 'blur(8px)'
                }}>
                    {/* Header Row */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 80px 90px',
                        padding: '10px 14px',
                        background: 'rgba(109, 40, 217, 0.06)',
                        borderBottom: '1px solid rgba(109, 40, 217, 0.1)'
                    }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#4c1d95', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Özellik</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Free</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>⚡ Premium</span>
                    </div>
                    {features.map((f, i) => (
                        <div key={f.label} style={{
                            display: 'grid', gridTemplateColumns: '1fr 80px 90px',
                            padding: '10px 14px',
                            borderBottom: i < features.length - 1 ? '1px solid rgba(109, 40, 217, 0.07)' : 'none',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '0.82rem', color: '#2e1065', fontWeight: '600' }}>{f.label}</span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>{f.free}</span>
                            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '700', textAlign: 'center' }}>{f.premium}</span>
                        </div>
                    ))}
                </div>

                {/* Billing Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{
                        display: 'flex',
                        background: 'rgba(255,255,255,0.7)',
                        padding: '4px',
                        borderRadius: '100px',
                        border: '1px solid rgba(109, 40, 217, 0.15)'
                    }}>
                        {[
                            { key: 'monthly', label: 'Aylık' },
                            { key: 'yearly', label: 'Yıllık' }
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setBillingCycle(key)}
                                style={{
                                    padding: '8px 20px', border: 'none', borderRadius: '100px',
                                    background: billingCycle === key ? 'linear-gradient(135deg, #4c1d95, #7c3aed)' : 'transparent',
                                    color: billingCycle === key ? '#fff' : 'var(--color-text-secondary)',
                                    fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                {label}
                                {key === 'yearly' && (
                                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(52,168,83,0.2)', color: '#34A853', borderRadius: '8px', fontWeight: '800' }}>%20</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#2e1065' }}>
                        {billingCycle === 'yearly' ? '₺1.199,99' : '₺149,99'}
                        <span style={{ fontSize: '0.9rem', fontWeight: '400', color: 'var(--color-text-secondary)' }}>
                            {billingCycle === 'yearly' ? '/yıl' : '/ay'}
                        </span>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.8rem', fontWeight: '600', color: billingCycle === 'yearly' ? '#34A853' : 'var(--color-text-secondary)' }}>
                        {billingCycle === 'yearly' ? '✨ Aylık ₺99,99\u2019a denk — 3 ay bedava!' : 'İstediğin zaman iptal et'}
                    </div>
                </div>

                {/* CTAs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        onClick={handleUpgrade}
                        disabled={isProcessing}
                        style={{
                            width: '100%', padding: '15px',
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            border: 'none', color: '#000', fontWeight: '800', fontSize: '1rem',
                            borderRadius: '100px',
                            boxShadow: '0 6px 18px rgba(251, 191, 36, 0.35)',
                            cursor: isProcessing ? 'wait' : 'pointer',
                            opacity: isProcessing ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Zap size={18} fill="#000" />
                        {isProcessing ? 'Yönlendiriliyor...' : "Premium'u Satın Al"}
                    </button>

                    {!hasRequested ? (
                        <button
                            onClick={handlePaymentDone}
                            disabled={isProcessing}
                            style={{
                                width: '100%', padding: '13px',
                                background: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(109, 40, 217, 0.2)',
                                color: '#5b21b6', fontWeight: '600', fontSize: '0.9rem',
                                borderRadius: '100px',
                                cursor: isProcessing ? 'wait' : 'pointer',
                                opacity: isProcessing ? 0.7 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            {isProcessing ? 'İşleniyor...' : 'Ödeme Yaptım, Bildir'}
                        </button>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#34A853', fontSize: '0.9rem', fontWeight: '600' }}>
                            <Check size={18} /> Ödeme bildirimi alındı
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PremiumPage;
