import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, Users, Building2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import './AuthPages.css';

/**
 * Enhanced Google Sign-In Page
 * Uses native Capacitor Google Auth on Android, web OAuth popup on browser.
 */

const GoogleSignInPage = () => {
    const navigate = useNavigate();
    const { loginWithGoogle, loginWithDevUser, isAuthenticated, user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isNative = Capacitor.isNativePlatform();

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
                const returnUrl = localStorage.getItem('redirectAfterAuth');
                if (returnUrl) {
                    localStorage.removeItem('redirectAfterAuth');
                    navigate(returnUrl);
                } else {
                    navigate('/');
                }
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    const processGoogleToken = async (accessToken) => {
        setLoading(true);
        setError('');
        try {
            const result = await loginWithGoogle({ accessToken });
            if (result.success) {
                const returnUrl = localStorage.getItem('redirectAfterAuth');
                if (result.isNewUser) {
                    navigate('/onboarding');
                } else {
                    if (returnUrl) {
                        localStorage.removeItem('redirectAfterAuth');
                        navigate(returnUrl);
                    } else {
                        navigate('/');
                    }
                }
            } else {
                setError(result.error || 'Giriş başarısız');
            }
        } catch (err) {
            setError('Giriş sırasında bir hata oluştu');
            console.error('Google Sign-In error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Web fallback: popup-based OAuth
    const webLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => processGoogleToken(tokenResponse.access_token),
        onError: (err) => {
            console.error('Web Google Login Failed:', err);
            setError('Google girişi başarısız oldu');
            setLoading(false);
        },
        flow: 'implicit'
    });

    const handleGoogleSignIn = async () => {
        if (isNative) {
            // Native Android: use Capacitor plugin (no popup needed)
            try {
                setLoading(true);
                setError('');
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
                const googleUser = await GoogleAuth.signIn();
                const accessToken = googleUser?.authentication?.accessToken;
                if (!accessToken) {
                    throw new Error('Google token alınamadı');
                }
                await processGoogleToken(accessToken);
            } catch (err) {
                console.error('Native Google Sign-In error:', err);
                setError('Google girişi başarısız oldu. Lütfen tekrar deneyin.');
                setLoading(false);
            }
        } else {
            // Browser: use popup
            setLoading(true);
            webLogin();
        }
    };

    const handleQuickLogin = async (userType) => {
        setLoading(true);
        setError('');

        const mockUsers = {
            new: {
                name: 'Yeni Kullanıcı',
                email: 'yeni@example.com',
                role: 'user'
            },
            existing: {
                name: 'Ahmet Yılmaz',
                email: 'ahmet@example.com',
                role: 'user'
            },
            club: {
                name: 'Mehmet Demir',
                email: 'mehmet@example.com',
                role: 'club_management' // Use correct role enum value
            },
        };

        try {
            const result = await loginWithDevUser(mockUsers[userType]);

            if (result.success) {
                if (result.isNewUser) {
                    navigate('/onboarding');
                } else {
                    navigate('/');
                }
            }
        } catch (err) {
            setError('Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page enhanced">
            <div className="auth-background-pattern"></div>

            <div className="auth-container enhanced">
                {/* Header with animated elements */}
                <div className="auth-header enhanced">
                    <div className="auth-logo enhanced">
                        <img 
                            src="/assets/bondle-logo.png" 
                            alt="Bondle" 
                            style={{ height: '80px', width: 'auto', objectFit: 'contain' }} 
                        />
                    </div>
                    <h1 className="auth-title">Bondle'e Hoş Geldin</h1>
                    <p className="auth-subtitle">
                        <Sparkles size={16} style={{ display: 'inline', marginRight: '4px' }} />
                        Etkinlikler, Networking ve Mentorluk
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error enhanced">
                        {error}
                    </div>
                )}

                {/* Main Google Sign-In Button - Enhanced */}
                <button
                    onClick={handleGoogleSignIn}
                    className="btn-google-signin enhanced"
                    disabled={loading}
                >
                    <div className="btn-google-content">
                        <svg width="24" height="24" viewBox="0 0 24 24" className="google-icon">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span>{loading ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}</span>
                    </div>
                    <div className="btn-shine"></div>
                </button>

                {/* Divider */}
                <div className="auth-divider enhanced">
                    <span>veya demo ile dene</span>
                </div>

                {/* Enhanced Quick Login Buttons */}
                <div className="quick-login-grid">
                    <button
                        className="quick-login-card"
                        onClick={() => handleQuickLogin('new')}
                        disabled={loading}
                    >
                        <div className="quick-login-icon">
                            <Users size={24} />
                        </div>
                        <span className="quick-login-text">Yeni Kullanıcı</span>
                        <div className="quick-login-glow"></div>
                    </button>

                    <button
                        className="quick-login-card"
                        onClick={() => handleQuickLogin('existing')}
                        disabled={loading}
                    >
                        <div className="quick-login-icon">
                            <Sparkles size={24} />
                        </div>
                        <span className="quick-login-text">Mevcut Kullanıcı</span>
                        <div className="quick-login-glow"></div>
                    </button>

                    <button
                        className="quick-login-card"
                        onClick={() => handleQuickLogin('club')}
                        disabled={loading}
                    >
                        <div className="quick-login-icon">
                            <Building2 size={24} />
                        </div>
                        <span className="quick-login-text">Kulüp Yöneticisi</span>
                        <div className="quick-login-glow"></div>
                    </button>
                </div>

                {/* Footer */}
                <div className="auth-footer enhanced">
                    <p>
                        Giriş yaparak <span className="text-accent">Kullanım Şartları</span> ve{' '}
                        <span className="text-accent">Gizlilik Politikası</span>'nı kabul etmiş olursunuz
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GoogleSignInPage;
