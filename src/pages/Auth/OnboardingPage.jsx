import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, ArrowLeft, LogOut } from 'lucide-react';
import ProfileInfoStep from './ProfileInfoStep';
import RoleSelectionStep from './RoleSelectionStep';
import InterestSelectionStep from './InterestSelectionStep';
import './Onboarding.css';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { completeOnboarding, user, logout } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [profileInfo, setProfileInfo] = useState({
        name: user?.name || '',
        surname: user?.surname || '',
        title: user?.title || '',
        city: user?.city || 'İstanbul',
        bio: user?.bio || '',
    });
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pre-fill / Update profile info when user data is available
    React.useEffect(() => {
        if (user) {
            setProfileInfo(prev => ({
                ...prev,
                name: user.name || prev.name,
                surname: user.surname || prev.surname,
                title: user.title || prev.title,
                city: user.city || prev.city,
                bio: user.bio || prev.bio,
            }));
        }
    }, [user]);

    const totalSteps = 2;
    const progress = (currentStep / totalSteps) * 100;

    const handleProfileInfoChange = (info) => {
        setProfileInfo(info);
    };

    const handleInterestToggle = (interestId) => {
        setSelectedInterests((prev) =>
            prev.includes(interestId)
                ? prev.filter((id) => id !== interestId)
                : [...prev, interestId]
        );
    };

    const handleNext = () => {
        if (canProceedFromCurrentStep()) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        if (!canProceedFromCurrentStep()) {
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name: profileInfo.name,
                surname: profileInfo.surname,
                title: profileInfo.title || '',
                bio: profileInfo.bio || '',
                city: profileInfo.city || 'İstanbul',
                phone: profileInfo.phone || '',
                interests: selectedInterests,
            };
            
            if (profileInfo.profilePicture) {
                payload.profilePicture = profileInfo.profilePicture;
            }

            const result = await completeOnboarding(payload);

            if (result.success) {
                const returnUrl = localStorage.getItem('redirectAfterAuth');
                if (returnUrl) {
                    localStorage.removeItem('redirectAfterAuth');
                    navigate(returnUrl);
                } else {
                    navigate('/');
                }
            } else {
                alert('Kaydınız tamamlanırken bir sorun oluştu: ' + (result.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const isStandRegistration = (localStorage.getItem('redirectAfterAuth') || '').includes('ref=stant');

    const canProceedFromCurrentStep = () => {
        if (currentStep === 1) {
            const isCityValid = !!profileInfo.city;
            const isPhoneValid = isStandRegistration ? !!profileInfo.phone : true;
            const isNameValid = isStandRegistration ? !!(profileInfo.name && profileInfo.name.trim()) : true;
            const isSurnameValid = isStandRegistration ? !!(profileInfo.surname && profileInfo.surname.trim()) : true;
            return isCityValid && isPhoneValid && isNameValid && isSurnameValid;
        }
        if (currentStep === 2) {
            return selectedInterests.length >= 3;
        }
        return false;
    };

    const getStepLabel = (step) => {
        const labels = {
            1: 'Profil',
            2: 'İlgi Alanları',
        };
        return labels[step];
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-container" style={{ position: 'relative' }}>
                <button 
                    onClick={logout}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }}
                >
                    <LogOut size={16} />
                    Çıkış Yap
                </button>

                {/* Header */}
                <div className="onboarding-header">
                    <div className="onboarding-logo" style={{ width: '100%', marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'center' }}>
                        <img 
                            src="/assets/bondle-logo-black.png" 
                            alt="Bondle" 
                            className="brand-logo-img" 
                        />
                    </div>
                    <h1>Bondle'e Hoş Geldin</h1>
                    <p>Deneyimini kişiselleştirelim</p>
                </div>

                {/* Progress Bar */}
                <div className="progress-container">
                    <div className="progress-steps">
                        {[1, 2].map((step) => (
                            <div
                                key={step}
                                className={`progress-step ${currentStep >= step ? 'active' : ''
                                    } ${currentStep > step ? 'completed' : ''}`}
                            >
                                <div className="step-number">{step}</div>
                                <span>{getStepLabel(step)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Step Content */}
                {currentStep === 1 && (
                    <ProfileInfoStep
                        profileInfo={profileInfo}
                        onProfileInfoChange={handleProfileInfoChange}
                        isStandRegistration={isStandRegistration}
                    />
                )}

                {currentStep === 2 && (
                    <InterestSelectionStep
                        selectedInterests={selectedInterests}
                        onInterestToggle={handleInterestToggle}
                    />
                )}

                {/* Actions */}
                <div className="onboarding-actions">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            className="btn-onboarding btn-onboarding-secondary"
                            onClick={handleBack}
                        >
                            <ArrowLeft size={20} />
                            Geri
                        </button>
                    )}

                    {currentStep < totalSteps ? (
                        <button
                            type="button"
                            className="btn-onboarding btn-onboarding-primary"
                            onClick={handleNext}
                            disabled={!canProceedFromCurrentStep()}
                        >
                            Devam
                            <ArrowRight size={20} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn-onboarding btn-onboarding-primary"
                            onClick={handleComplete}
                            disabled={!canProceedFromCurrentStep() || loading}
                        >
                            {loading ? 'Tamamlanıyor...' : 'Tamamla'}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;




