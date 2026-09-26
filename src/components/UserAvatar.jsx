import React, { useState } from 'react';

/**
 * A consistent User Avatar component for the entire application.
 * Handles profile picture display, fallback to initials, and premium styling.
 */
const UserAvatar = ({ user, size = 'md', className = '', style = {}, onClick = null }) => {
    const [hasError, setHasError] = useState(false);

    // Determine sizes based on prop
    const sizeMap = {
        'xs': { width: '24px', height: '24px', fontSize: '10px' },
        'sm': { width: '32px', height: '32px', fontSize: '12px' },
        'md': { width: '48px', height: '48px', fontSize: '16px' },
        'lg': { width: '56px', height: '56px', fontSize: '20px' },
        'xl': { width: '64px', height: '64px', fontSize: '24px' },
        '2xl': { width: '120px', height: '120px', fontSize: '42px' },
    };

    const currentSize = sizeMap[size] || sizeMap['md'];
    
    // Get the photo URL from all possible fields (for backward compatibility)
    const photoUrl = user?.profilePicture || user?.picture || user?.avatar || user?.photo;
    
    // Get initials
    const getInitials = () => {
        const name = (user?.name || '').trim();
        const surname = (user?.surname || '').trim();
        
        if (name && surname) {
            return (name[0] + surname[0]).toUpperCase();
        }
        
        if (name) {
            const parts = name.split(/\s+/);
            if (parts.length > 1) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return name[0].toUpperCase();
        }
        return 'B';
    };

    const baseStyle = {
        width: currentSize.width,
        height: currentSize.height,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        ...style
    };

    // Premium users get a special border/glow
    const isPremium = user?.isPremium || user?.role === 'premium_user';
    const premiumStyle = isPremium ? {
        border: '2px solid #fbbf24',
        boxShadow: '0 0 10px rgba(251, 191, 36, 0.4)'
    } : {
        border: '2px solid rgba(139, 92, 246, 0.2)'
    };

    // Render initials fallback
    const renderFallback = () => (
        <div 
            className={`user-avatar fallback ${className}`} 
            style={{ 
                ...baseStyle, 
                ...premiumStyle,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                color: 'white',
                fontWeight: '700',
                fontSize: currentSize.fontSize
            }}
            onClick={onClick}
        >
            {getInitials()}
        </div>
    );

    if (photoUrl && !hasError) {
        return (
            <div 
                className={`user-avatar ${className}`} 
                style={{ ...baseStyle, ...premiumStyle }}
                onClick={onClick}
            >
                <img 
                    src={photoUrl} 
                    alt={user?.name || 'User'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setHasError(true)}
                />
            </div>
        );
    }

    return renderFallback();
};

export default UserAvatar;
