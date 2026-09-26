import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem('token');
        if (token) {
            loadCurrentUser();
        } else {
            setLoading(false);
        }

        const handleAuthExpired = () => {
            setUser(null);
            navigate('/login', { replace: true });
        };

        window.addEventListener('auth-expired', handleAuthExpired);
        return () => window.removeEventListener('auth-expired', handleAuthExpired);
    }, [navigate]);

    const loadCurrentUser = async () => {
        try {
            const userData = await api.getCurrentUser();
            // Backend returns user directly, not wrapped
            console.log('🔍 User Data:', userData);
            console.log('📸 Photo fields:', {
                picture: userData?.picture,
                profilePicture: userData?.profilePicture,
                photo: userData?.photo,
                avatar: userData?.avatar
            });
            setUser(userData);
        } catch (error) {
            console.error('Failed to load user:', error);
            // api.js automatically dispatches 'auth-expired' for 401s.
            // Do not force logout on 500/network errors.
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.login(email, password);
            if (response.user) {
                setUser(response.user);
            }
            return { success: true, ...response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.register(userData);
            // If registration requires email verification, don't set user yet
            if (response.requiresVerification) {
                return { success: true, ...response };
            }
            if (response.user) {
                setUser(response.user);
            }
            return { success: true, ...response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const completeOnboarding = async (onboardingData) => {
        try {
            const response = await api.completeOnboarding(onboardingData);
            // Use the response user data (now includes interests)
            if (response.user) {
                setUser(response.user);
            } else {
                // Fallback: reload from /auth/me
                await loadCurrentUser();
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const loginWithGoogle = async (googleData) => {
        try {
            const response = await api.googleAuth(googleData.accessToken, googleData.referralCode);
            setUser(response.user);
            return {
                success: true,
                user: response.user,
                isNewUser: response.isNewUser
            };
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, error: error.message };
        }
    };

    const loginWithDevUser = async (devUser) => {
        try {
            const response = await api.devLogin(devUser.email, devUser.name, devUser.role);
            setUser(response.user);
            return {
                success: true,
                user: response.user,
                isNewUser: false
            };
        } catch (error) {
            console.error('Dev login error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        api.logout();
        setUser(null);
        setTimeout(() => {
            navigate('/login', { replace: true });
        }, 50);
    };

    const updateUserProfile = async (profileData) => {
        try {
            const response = await api.updateProfile(profileData);
            const updatedUser = response.user || response;
            setUser(updatedUser);
            return { success: true, user: updatedUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const isPremium = () => {
        return user?.isPremium || user?.role === 'premium_user' || user?.role === 'campus_ambassador';
    };

    const value = {
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        loginWithDevUser,
        logout,
        completeOnboarding,
        updateUserProfile,
        isPremium,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    width: '100vw',
                    backgroundColor: 'var(--color-bg-primary)',
                    gap: '20px',
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid rgba(124, 58, 237, 0.15)',
                        borderLeftColor: '#7c3aed',
                        borderRadius: '50%',
                        animation: 'authSpin 1s linear infinite'
                    }} />
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.5px', color: 'var(--color-text-primary)' }}>
                        Bondle Yükleniyor...
                    </div>
                    <style>{`
                        @keyframes authSpin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
