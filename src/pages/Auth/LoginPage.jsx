import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, UserPlus, ArrowLeft, Mail, KeyRound, RefreshCw, Shield } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useEffect } from 'react';
import api from '../../services/api';
import { Capacitor } from '@capacitor/core';
import LegalModal from '../../components/LegalModal';
import './AuthPages.css';

const AnimatedCounter = ({ end, suffix = "", duration = 2000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        let animationFrame;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const current = Math.min(Math.floor((progress / duration) * end), end);
            setCount(current);
            if (current < end) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <span className="stat-number">{count}{suffix}</span>;
};

const AuthHero = () => (
    <div className="auth-hero">
        <div className="hero-content">
            <div className="hero-logo" style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <img 
                    src="/assets/bondle-logo-black.png" 
                    alt="Bondle" 
                    style={{ height: '100px', width: 'auto', objectFit: 'contain' }} 
                />
            </div>
            <h1>Bireylerin ve Toplulukların<br/><span className="text-gradient">Networkü</span></h1>
            <p>
                Kendi ekosistemini yarat. Topluluklara katıl, etkinlikleri keşfet, mentorluk ve CV analizi ile kariyerine yön ver.
                <br /><br />
                <span style={{ fontWeight: '600', fontStyle: 'italic', color: '#6d28d9', fontSize: '1.3rem' }}>"Where bonds begin."</span>
            </p>
            
            <div className="hero-stats">
                <div className="stat-card">
                    <AnimatedCounter end={20} suffix="+" />
                    <span className="stat-label">Topluluk</span>
                </div>
                <div className="stat-card">
                    <AnimatedCounter end={500} suffix="+" />
                    <span className="stat-label">Kullanıcı</span>
                </div>
                <div className="stat-card">
                    <AnimatedCounter end={300} suffix="+" />
                    <span className="stat-label">Etkinlik</span>
                </div>
            </div>
        </div>
    </div>
);

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, loginWithGoogle, isAuthenticated, user, loading: authLoading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const isNative = Capacitor.isNativePlatform();
    const [legalModalConfig, setLegalModalConfig] = useState({ isOpen: false, type: 'terms' });
    const [referralCode, setReferralCode] = useState(() => localStorage.getItem('bondle_referral') || '');

    // Check for referral code and register path
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const ref = searchParams.get('ref');
        const mode = searchParams.get('mode');
        
        if (ref) {
            setReferralCode(ref);
            localStorage.setItem('bondle_referral', ref);
            setIsLogin(false);
        }
        if (location.pathname === '/register' || mode === 'register') {
            setIsLogin(false);
        }
    }, [location]);

    // Initialize Google Auth for Native
    useEffect(() => {
        if (isNative) {
            import('@codetrix-studio/capacitor-google-auth').then(({ GoogleAuth }) => {
                GoogleAuth.initialize({
                    clientId: '921641907126-25rsdrbo8etvtb9b05qp1msj9g35qo7v.apps.googleusercontent.com',
                    scopes: ['profile', 'email'],
                    grantOfflineAccess: true,
                }).catch(err => console.error('Google Auth init error:', err));
            }).catch(console.error);
        }
    }, [isNative]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            if (!user?.onboardingComplete) {
                navigate('/onboarding');
            } else {
                navigate('/');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    // Check for Google OAuth redirect token in URL hash (Mobile Web Fallback)
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            if (accessToken) {
                // Clear the hash from URL securely
                window.history.replaceState(null, null, window.location.pathname);
                // We need to wait a tiny bit to ensure contexts are loaded
                setTimeout(() => processGoogleToken(accessToken), 100);
            }
        }
    }, []);

    // View: 'form' | 'verify-email' | 'forgot-password' | 'reset-password'
    const [view, setView] = useState('form');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');

    // Verification States
    const [verificationCode, setVerificationCode] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');

    // Reset Password States
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // UI States
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isLogin) {
                const result = await login(email, password);
                if (result.success) {
                    if (result.require2FA) {
                        setPendingEmail(email);
                        setView('verify-2fa');
                        return;
                    }

                    if (result.isNewUser || !result.user?.onboardingComplete) {
                        navigate('/onboarding');
                    } else {
                        const returnUrl = localStorage.getItem('redirectAfterAuth');
                        if (returnUrl) {
                            localStorage.removeItem('redirectAfterAuth');
                            navigate(returnUrl);
                        } else {
                            navigate('/');
                        }
                    }
                } else {
                    // Check if email verification is needed
                    if (result.error && result.error.includes('doğrulanmamış')) {
                        setPendingEmail(email);
                        setView('verify-email');
                    } else {
                        setError(result.error || 'Giriş başarısız');
                    }
                }
            } else {
                const result = await register({ email, password, name, surname, referralCode });
                if (result.success) {
                    localStorage.removeItem('bondle_referral');
                    // If registration requires verification
                    if (result.requiresVerification) {
                        setPendingEmail(email);
                        setView('verify-email');
                    } else if (!result.user?.onboardingComplete) {
                        navigate('/onboarding');
                    } else {
                        const returnUrl = localStorage.getItem('redirectAfterAuth');
                        if (returnUrl) {
                            localStorage.removeItem('redirectAfterAuth');
                            navigate(returnUrl);
                        } else {
                            navigate('/');
                        }
                    }
                } else {
                    setError(result.error || 'Kayıt başarısız');
                }
            }
        } catch (err) {
            setError('Bir hata oluştu');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.verify2FA(pendingEmail, verificationCode);
            if (data.access_token) {
                setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
                
                // Update local auth context (the login method usually does this, but we need to do it here manually for 2FA)
                // Actually, our API client already sets the token, but we need to trigger state change in AuthContext
                // Let's check AuthContext for a 'setAuthenticatedUser' or similar
                window.location.href = '/'; // Simplest way to refresh app state with new token
            }
        } catch (err) {
            setError(err.message || '2FA doğrulaması başarısız');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.verifyEmail(pendingEmail, verificationCode);
            if (data.access_token) {
                setSuccess('E-posta doğrulandı! Yönlendiriliyorsunuz...');
                setTimeout(() => navigate('/onboarding'), 1500);
            }
        } catch (err) {
            setError(err.message || 'Doğrulama başarısız');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setLoading(true);
        try {
            await api.resendVerification(pendingEmail);
            setSuccess('Yeni doğrulama kodu e-postanıza gönderildi!');
        } catch (err) {
            setError(err.message || 'Kod gönderilemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.forgotPassword(email);
            setPendingEmail(email);
            setSuccess('Şifre sıfırlama kodu e-postanıza gönderildi!');
            setView('reset-password');
        } catch (err) {
            setError(err.message || 'İşlem başarısız');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.resetPassword(pendingEmail, resetCode, newPassword);
            setSuccess('Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.');
            setTimeout(() => {
                setView('form');
                setIsLogin(true);
                setSuccess('');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Şifre sıfırlama başarısız');
        } finally {
            setLoading(false);
        }
    };

    const processGoogleToken = async (accessToken) => {
        setLoading(true);
        setError('');
        try {
            const result = await loginWithGoogle({ accessToken, referralCode });
            if (result.success) {
                localStorage.removeItem('bondle_referral');
                if (result.isNewUser || !result.user?.onboardingComplete) {
                    navigate('/onboarding');
                } else {
                    navigate('/');
                }
            } else {
                setError(result.error || 'Google girişi başarısız');
            }
        } catch (err) {
            setError('Google girişi sırasında hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Web fallback: popup-based OAuth
    const googleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => processGoogleToken(tokenResponse.access_token),
        onError: (err) => {
            console.error('Login Failed:', err);
            setError('Google girişi başarısız oldu');
            setLoading(false);
        },
        onNonOAuthError: (err) => {
            console.log('Login cancelled or popup closed:', err);
            setLoading(false);
        },
        flow: 'implicit'
    });

    const handleNativeGoogleLogin = async () => {
        if (isNative) {
            try {
                setLoading(true);
                setError('');
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
                const googleUser = await GoogleAuth.signIn();
                const accessToken = googleUser?.authentication?.accessToken;
                if (!accessToken) throw new Error('Google token alınamadı');
                await processGoogleToken(accessToken);
            } catch (err) {
                console.error('Native Google Sign-In error:', err);
                setError('Google girişi başarısız oldu. Lütfen tekrar deneyin.');
                setLoading(false);
            }
        } else {
            setLoading(true);
            setError('');
            
            // Timeout to reset loading state if Google Auth hangs (e.g. popup blocked silently)
            setTimeout(() => {
                setLoading((prev) => {
                    if (prev) {
                        setError('Google ile bağlantı kurulamadı veya zaman aşımına uğradı. Lütfen tekrar deneyin.');
                        return false;
                    }
                    return prev;
                });
            }, 15000); // 15 seconds timeout

            // Check if user is on a mobile browser
            const isMobileBrowser = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobileBrowser) {
                // Use redirect flow for mobile web to prevent popup blocking & memory wipe
                const clientId = '921641907126-25rsdrbo8etvtb9b05qp1msj9g35qo7v.apps.googleusercontent.com';
                const redirectUri = window.location.origin + '/login';
                const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email profile`;
                window.location.href = authUrl;
            } else {
                // Desktop web: use popup
                googleLogin();
            }
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setSuccess('');
        setPassword('');
    };

    const goBackToForm = () => {
        setView('form');
        setError('');
        setSuccess('');
        setVerificationCode('');
        setResetCode('');
        setNewPassword('');
    };

    // ===================== 2FA VERIFICATION VIEW =====================
    if (view === 'verify-2fa') {
        return (
            <div className="auth-page">
                <AuthHero />
                <div className="auth-form-wrapper">
                    <div className="auth-container">
                        <div className="auth-header">
                            <div className="auth-logo mobile-logo">
                                <div className="logo-circle" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    <Shield size={28} color="white" />
                                </div>
                            </div>
                            <h1>İki Aşamalı Doğrulama</h1>
                            <p className="text-secondary">Hesabınızı güvende tutmak için kodu girin</p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleVerify2FA} className="auth-form">
                            <div className="form-group">
                                <label>Doğrulama Kodu</label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    required
                                    maxLength={6}
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        letterSpacing: '8px',
                                        padding: '16px',
                                    }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || verificationCode.length !== 6}>
                                <Shield size={20} />
                                {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <button onClick={goBackToForm} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                <ArrowLeft size={14} />
                                Giriş sayfasına dön
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===================== EMAIL VERIFICATION VIEW =====================
    if (view === 'verify-email') {
        return (
            <div className="auth-page">
                <AuthHero />
                <div className="auth-form-wrapper">
                    <div className="auth-container">
                        <div className="auth-header">
                            <div className="auth-logo mobile-logo">
                                <div className="logo-circle" style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}>
                                    <Mail size={28} color="white" />
                                </div>
                            </div>
                            <h1>E-posta Doğrulama</h1>
                            <p className="text-secondary">
                                <strong>{pendingEmail}</strong> adresine 6 haneli bir kod gönderdik
                            </p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

                        <form onSubmit={handleVerifyEmail} className="auth-form">
                            <div className="form-group">
                                <label>Doğrulama Kodu</label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    required
                                    maxLength={6}
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        letterSpacing: '8px',
                                        padding: '16px',
                                    }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || verificationCode.length !== 6}>
                                <Shield size={20} />
                                {loading ? 'Doğrulanıyor...' : 'Hesabı Onayla'}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button 
                                onClick={handleResendCode}
                                disabled={loading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#8b5cf6',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '14px',
                                }}
                            >
                                <RefreshCw size={16} />
                                Tekrar Gönder
                            </button>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <button onClick={goBackToForm} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                <ArrowLeft size={14} />
                                Giriş sayfasına dön
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===================== FORGOT PASSWORD VIEW =====================
    if (view === 'forgot-password') {
        return (
            <div className="auth-page">
                <AuthHero />
                <div className="auth-form-wrapper">
                    <div className="auth-container">
                        <div className="auth-header">
                            <div className="auth-logo mobile-logo">
                                <div className="logo-circle" style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' }}>
                                    <KeyRound size={28} color="white" />
                                </div>
                            </div>
                            <h1>Şifremi Unuttum</h1>
                            <p className="text-secondary">E-posta adresinize şifre sıfırlama kodu göndereceğiz</p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

                        <form onSubmit={handleForgotPassword} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="reset-email">E-posta</label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@uni.edu.tr"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !email}>
                                <KeyRound size={20} />
                                {loading ? 'Gönderiliyor...' : 'Kodu Gönder'}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button onClick={goBackToForm} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                <ArrowLeft size={14} />
                                Giriş sayfasına dön
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===================== RESET PASSWORD VIEW =====================
    if (view === 'reset-password') {
        return (
            <div className="auth-page">
                <AuthHero />
                <div className="auth-form-wrapper">
                    <div className="auth-container">
                        <div className="auth-header">
                            <div className="auth-logo mobile-logo">
                                <div className="logo-circle" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                                    <KeyRound size={28} color="white" />
                                </div>
                            </div>
                            <h1>Yeni Şifre Belirle</h1>
                            <p className="text-secondary">
                                <strong>{pendingEmail}</strong> adresine gönderilen kodu girin
                            </p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="form-group">
                                <label>Sıfırlama Kodu</label>
                                <input
                                    type="text"
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    required
                                    maxLength={6}
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        letterSpacing: '8px',
                                        padding: '16px',
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="new-password">Yeni Şifre</label>
                                <input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={7}
                                />
                                <div className="password-hint">
                                    6 karakterden büyük olmalıdır
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || resetCode.length !== 6}>
                                <KeyRound size={20} />
                                {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button onClick={goBackToForm} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                <ArrowLeft size={14} />
                                Giriş sayfasına dön
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===================== MAIN LOGIN/REGISTER FORM =====================
    return (
        <div className="auth-page">
            <div className="auth-floating-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            <AuthHero />

            <div className="auth-form-wrapper">
                <div className="auth-container">
                    <div className="auth-header mobile-logo">
                        <div className="auth-logo" style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}>
                            <img 
                                src="/assets/bondle-logo-black.png" 
                                alt="Bondle" 
                                style={{ height: '80px', width: 'auto', objectFit: 'contain' }} 
                            />
                        </div>
                    </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <div className="auth-toggle-container">
                    <button
                        className={`auth-toggle-btn ${isLogin ? 'active' : ''}`}
                        onClick={() => !isLogin && toggleMode()}
                    >
                        Giriş Yap
                    </button>
                    <button
                        className={`auth-toggle-btn ${!isLogin ? 'active' : ''}`}
                        onClick={() => isLogin && toggleMode()}
                    >
                        Kayıt Ol
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Ad</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Adınız"
                                    required={!isLogin}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="surname">Soyad</label>
                                <input
                                    id="surname"
                                    type="text"
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    placeholder="Soyadınız"
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">E-posta</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Şifre</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={isLogin ? 1 : 7}
                        />
                        {!isLogin && (
                            <div className="password-hint">
                                6 karakterden büyük olmalıdır
                            </div>
                        )}
                    </div>


                    {!isLogin && (
                        <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                            <input
                                id="terms"
                                type="checkbox"
                                required
                                style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <label htmlFor="terms" style={{ display: 'block', fontSize: '12px', color: '#64748b', lineHeight: '1.4', cursor: 'pointer', textTransform: 'none', margin: 0, marginTop: '2px' }}>
                                Bondle <span className="text-accent" style={{ textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); setLegalModalConfig({ isOpen: true, type: 'terms' }); }}>Kullanım Şartları</span>, <span className="text-accent" style={{ textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); setLegalModalConfig({ isOpen: true, type: 'privacy' }); }}>Gizlilik Politikası</span> ve <span className="text-accent" style={{ textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); setLegalModalConfig({ isOpen: true, type: 'kvkk' }); }}>KVKK Aydınlatma Metni</span>'ni okudum, kabul ediyorum.
                            </label>
                        </div>
                    )}

                    {isLogin && (
                        <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                            <button
                                type="button"
                                onClick={() => { setView('forgot-password'); setError(''); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#8b5cf6',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                Şifremi Unuttum
                            </button>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                        {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>veya</span>
                </div>

                <button
                    onClick={handleNativeGoogleLogin}
                    className="btn-google-signin enhanced"
                    style={{ width: '100%' }}
                    disabled={loading}
                >
                    <div className="btn-google-content">
                        <svg width="24" height="24" viewBox="0 0 24 24" className="google-icon">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Google ile {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</span>
                    </div>
                </button>
            </div>
            </div>

            <LegalModal 
                isOpen={legalModalConfig.isOpen} 
                type={legalModalConfig.type} 
                onClose={() => setLegalModalConfig({ ...legalModalConfig, isOpen: false })} 
            />
        </div>
    );
};

export default LoginPage;
