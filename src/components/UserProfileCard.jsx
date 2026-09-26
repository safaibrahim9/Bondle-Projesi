import React from 'react';
import { Users, Zap, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNetworking } from '../contexts/NetworkingContext';
import UserAvatar from './UserAvatar';

const UserProfileCard = () => {
    const { user } = useAuth();
    const { credits, connections } = useNetworking();

    if (!user) return null;

    return (
        <div style={{
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-lg)',
            display: 'flex',
            gap: 'var(--spacing-md)',
            alignItems: 'center'
        }}>
            {/* Profile Photo */}
            <UserAvatar user={user} size="xl" />

            {/*Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    {user.name || 'Kullanıcı'}
                    {user.isPremium && (
                        <Star
                            size={16}
                            fill="var(--color-warning)"
                            color="var(--color-warning)"
                            title="Premium Üye"
                        />
                    )}
                </h3>
                <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--spacing-sm)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {user.title || 'Ünvan belirtilmemiş'}
                </p>

                {/* Stats */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-md)',
                    fontSize: 'var(--font-size-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Users size={16} color="var(--color-accent-primary)" />
                        <span style={{ fontWeight: '600' }}>{connections?.length || 0}</span>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>bağlantı</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Zap size={16} color="var(--color-accent-primary)" />
                        <span style={{ fontWeight: '600' }}>{credits || 0}</span>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>kredi</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileCard;
