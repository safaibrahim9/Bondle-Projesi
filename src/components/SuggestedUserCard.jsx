import React, { useState, useEffect } from 'react';
import {  MapPin, UserPlus, Clock, X, Loader2, Star, Crown , Calendar } from 'lucide-react';
import UserAvatar from './UserAvatar';
import PremiumBadge from './PremiumBadge';
import { interestCategories } from '../data/interestCategories.js';

// Build a lookup map: English ID -> Turkish label with emoji
const interestMap = {};
interestCategories.forEach(cat => {
    interestMap[cat.id] = `${cat.emoji} ${cat.label}`;
});

const SuggestedUserCard = ({ user, onAddClick, onCancelClick, onAcceptClick, onScheduleClick, requestStatus = 'none', matchId, onClick }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [localRequestStatus, setLocalRequestStatus] = useState(requestStatus);
    const [isHoveringCancel, setIsHoveringCancel] = useState(false);

    // Sync with parent state
    useEffect(() => {
        setLocalRequestStatus(requestStatus);
    }, [requestStatus]);

    const handleSendRequest = async (e) => {
        e.stopPropagation();
        setIsLoading(true);
        try {
            await onAddClick(user);
            setLocalRequestStatus('sent');
        } catch (error) {
            console.error('Send request error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelRequest = async (e) => {
        e.stopPropagation();
        if (!matchId) return;

        setIsLoading(true);
        try {
            await onCancelClick(matchId);
            setLocalRequestStatus('none');
        } catch (error) {
            console.error('Cancel request error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const displayName = user.surname ? `${user.name} ${user.surname}` : user.name;

    return (
        <div className="suggested-user-card" style={{
            background: 'linear-gradient(150deg, #ffffff 0%, #f5f3ff 40%, #e9d5ff 100%)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--spacing-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 24px rgba(109, 40, 217, 0.12)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer'
        }}
            onClick={onClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(109, 40, 217, 0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(109, 40, 217, 0.12)';
            }}
        >
            {user.isAiSuggestion && (
                <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                    zIndex: 2,
                    whiteSpace: 'nowrap'
                }}>
                    ✨ AI Önerisi
                </div>
            )}
            {/* Profile Photo and Info */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', marginTop: user.isAiSuggestion ? '8px' : '0', width: '100%' }}>
                <UserAvatar user={user} size="md" />
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <h4 style={{
                        marginBottom: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-md)',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '6px'
                    }}>
                        {displayName}
                        {user.isPremium && (
                            <PremiumBadge size="sm" />
                        )}
                    </h4>
                    <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: '#6b21a8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: 0
                    }}>
                        {user.title || 'Kullanıcı'}
                    </p>
                </div>
            </div>

            {/* City */}
            {user.city && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                    color: '#6b21a8'
                }}>
                    <MapPin size={14} />
                    <span>{user.city}</span>
                </div>
            )}

            {/* Top 3 Interests */}
            {(() => {
                const interestsArray = Array.isArray(user.interests) ? user.interests : (typeof user.interests === 'string' ? user.interests.split(',').map(i => i.trim()) : []);
                if (interestsArray.length === 0) return null;
                
                const displayInterests = interestsArray.slice(0, 3);
                const extraCount = interestsArray.length - 3;
                
                return (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '8px',
                        marginBottom: '12px',
                        minHeight: '26px'
                    }}>
                        {displayInterests.map((interest, index) => {
                            const found = interestCategories.find(c => 
                                c.id.toLowerCase() === String(interest).toLowerCase() || 
                                c.label.toLowerCase() === String(interest).toLowerCase()
                            );
                            const label = found ? `${found.emoji} ${found.label}` : interest;
                            
                            return (
                                <span
                                    key={index}
                                    style={{
                                        padding: '4px 10px',
                                        background: 'rgba(255, 255, 255, 0.6)',
                                        borderRadius: '100px',
                                        fontSize: '11px',
                                        color: '#4c1d95',
                                        fontWeight: '600',
                                        border: '1px solid rgba(255, 255, 255, 0.8)',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {label}
                                </span>
                            );
                        })}
                        {extraCount > 0 && (
                            <span style={{
                                padding: '4px 10px',
                                background: 'rgba(147, 51, 234, 0.1)',
                                borderRadius: '100px',
                                fontSize: '11px',
                                color: '#9333ea',
                                fontWeight: '700',
                                border: '1px solid rgba(147, 51, 234, 0.2)',
                                whiteSpace: 'nowrap'
                            }}>
                                +{extraCount}
                            </span>
                        )}
                    </div>
                );
            })()}

            {user.isAiSuggestion && user.aiReason && (
                <div style={{
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.05), rgba(76, 29, 149, 0.02))',
                    borderRadius: '12px',
                    border: '1px solid rgba(147, 51, 234, 0.1)',
                    borderLeft: '4px solid #9333ea',
                    fontSize: '0.82rem',
                    color: '#4c1d95',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    lineHeight: '1.45',
                    marginBottom: '16px',
                    textAlign: 'left'
                }}>
                    <Star size={16} color="#9333ea" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{user.aiReason}</span>
                </div>
            )}

            {/* Action Button */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
            {localRequestStatus === 'sent' ? (
                <button
                    onClick={handleCancelRequest}
                    disabled={isLoading}
                    onMouseEnter={() => setIsHoveringCancel(true)}
                    onMouseLeave={() => setIsHoveringCancel(false)}
                    style={{
                        width: '100%',
                        marginTop: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: isHoveringCancel ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.7)',
                        color: isHoveringCancel ? 'var(--color-error)' : '#6b21a8',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        cursor: isLoading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--spacing-xs)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="spin-animation" />
                            İptal ediliyor...
                        </>
                    ) : (
                        <>
                            <Clock size={16} style={{ display: isHoveringCancel ? 'none' : 'block' }} />
                            <span style={{ display: isHoveringCancel ? 'none' : 'block' }}>İstek Gönderildi</span>

                            <X size={16} style={{ display: isHoveringCancel ? 'block' : 'none' }} />
                            <span style={{ display: isHoveringCancel ? 'block' : 'none' }}>İsteği İptal Et</span>
                        </>
                    )}
                </button>
            ) : localRequestStatus === 'received' ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onAcceptClick) {
                            setIsLoading(true);
                            onAcceptClick(matchId).finally(() => setIsLoading(false));
                        }
                    }}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        marginTop: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: 'var(--color-success)',
                        color: '#fff',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        cursor: isLoading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--spacing-xs)',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                    }}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="spin-animation" />
                            Kabul ediliyor...
                        </>
                    ) : (
                        <>
                            {/* Check icon or similar */}
                            <span>Kabul Et</span>
                        </>
                    )}
                </button>
            ) : (
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: 'var(--spacing-sm)' }}>
                    <button
                        onClick={handleSendRequest}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: 'var(--spacing-sm)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(249, 115, 22, 0.4)',
                            background: 'transparent',
                            color: 'var(--color-accent-primary)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: isLoading ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {isLoading ? (
                            <Loader2 size={14} className="spin-animation" />
                        ) : (
                            <>
                                <UserPlus size={14} />
                                Arkadaş Ekle
                            </>
                        )}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onScheduleClick) onScheduleClick(user);
                        }}
                        disabled={isLoading}
                        style={{
                            flex: 1.5,
                            padding: 'var(--spacing-sm)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
                            color: 'var(--color-text-on-accent)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: isLoading ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                        }}
                    >
                        <Calendar size={14} />
                        Görüşme (1⚡)
                    </button>
                </div>
            )}
            </div>

            {/* Add keyframes for spin animation */}
            <style>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div >
    );
};

export default SuggestedUserCard;


