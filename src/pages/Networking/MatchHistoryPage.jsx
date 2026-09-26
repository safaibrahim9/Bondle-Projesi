import React, { useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
    Clock, CheckCircle2, XCircle, Search, 
    ArrowRight, MessageSquare, Star, Trash2
} from 'lucide-react';
import { useNetworking } from '../../contexts/NetworkingContext';
import { useAuth } from '../../contexts/AuthContext';
import UserProfileModal from '../../components/UserProfileModal';
import UserAvatar from '../../components/UserAvatar';
import ConfirmDialog from '../../components/ConfirmDialog';
import './MatchHistoryPage.css';

const MatchHistoryPage = () => {
    const { matchHistory, cancelConnectionRequest } = useNetworking();
    const { user: currentUser } = useAuth();
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, matchId: null });

    const getOtherUser = (match) => {
        if (!match.user1 || !match.user2 || !currentUser) return null;
        return String(match.user1Id) === String(currentUser.id) ? match.user2 : match.user1;
    };

    const getStatusLabel = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING':
                return { label: 'Bekliyor', color: '#fbbf24', icon: <Clock size={14} /> };
            case 'ACCEPTED':
                return { label: 'Kabul Edildi', color: '#10b981', icon: <CheckCircle2 size={14} /> };
            case 'REJECTED':
                return { label: 'Reddedildi', color: '#ef4444', icon: <XCircle size={14} /> };
            case 'CANCELLED':
                return { label: 'İptal Edildi', color: '#6b7280', icon: <XCircle size={14} /> };
            default:
                return { label: status, color: '#9ca3af', icon: null };
        }
    };

    const filteredHistory = matchHistory.filter(match => {
        const other = getOtherUser(match);
        if (!other) return false;
        const nameMatch = `${other.name} ${other.surname}`.toLowerCase().includes(searchQuery.toLowerCase());
        const emailMatch = other.email?.toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || emailMatch;
    });

    const handleCancel = (e, matchId) => {
        e.stopPropagation();
        setConfirmConfig({ isOpen: true, matchId });
    };

    const confirmCancel = async () => {
        const { matchId } = confirmConfig;
        setConfirmConfig({ isOpen: false, matchId: null });
        if (matchId) {
            await cancelConnectionRequest(matchId);
        }
    };

    return (
        <div className="page match-history-page">
            <div className="container">
                <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '850', marginBottom: '8px' }}>Eşleşme Geçmişi</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>Gönderdiğin ve aldığın tüm bağlantı istekleri</p>
                </div>

                <div className="search-bar-wrapper" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <Search size={20} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="İsim veya e-posta ile ara..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {filteredHistory.length > 0 ? (
                    <div className="match-history-list">
                        {filteredHistory.map((match) => {
                            const other = getOtherUser(match);
                            const status = getStatusLabel(match.status);
                            const isSender = String(match.user1Id) === String(currentUser?.id);

                            return (
                                <div 
                                    key={match.id} 
                                    className="match-history-card"
                                    onClick={() => setSelectedUser(other)}
                                >
                                    <div className="card-inner">
                                        <div className="user-info-section">
                                            <UserAvatar user={other} size="lg" />
                                            <div className="user-text">
                                                <h3>
                                                    {other?.name} {other?.surname}
                                                    {other?.isPremium && <Star size={14} fill="#fbbf24" color="#fbbf24" style={{ marginLeft: '6px' }} />}
                                                </h3>
                                                <p className="user-title">{other?.title || 'Bondle Üyesi'}</p>
                                            </div>
                                        </div>

                                        <div className="match-details-section">
                                            <div className="match-meta">
                                                <div className="meta-item">
                                                    <span className="label">İşlem:</span>
                                                    <span className="value">
                                                        {isSender ? (
                                                            <><ArrowRight size={12} /> İstek Gönderildi</>
                                                        ) : (
                                                            <><ArrowRight size={12} style={{ transform: 'rotate(180deg)' }} /> İstek Alındı</>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="meta-item">
                                                    <span className="label">Tarih:</span>
                                                    <span className="value">
                                                        {format(new Date(match.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="status-badge" style={{ backgroundColor: `${status.color}15`, color: status.color }}>
                                                {status.icon}
                                                <span>{status.label}</span>
                                            </div>
                                        </div>

                                        {isSender && match.status === 'PENDING' && (
                                            <button 
                                                className="cancel-btn"
                                                onClick={(e) => handleCancel(e, match.id)}
                                                title="İsteği İptal Et"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <h3>Eşleşme Bulunamadı</h3>
                        <p>Henüz herhangi bir eşleşme geçmişin bulunmuyor.</p>
                    </div>
                )}
            </div>

            <UserProfileModal 
                isOpen={!!selectedUser} 
                onClose={() => setSelectedUser(null)} 
                user={selectedUser}
            />

            {confirmConfig.isOpen && (
                <ConfirmDialog
                    title="İsteği İptal Et"
                    message="Bu isteği iptal etmek istediğinize emin misiniz?"
                    onConfirm={confirmCancel}
                    onCancel={() => setConfirmConfig({ isOpen: false, matchId: null })}
                    confirmText="İptal Et"
                    cancelText="Vazgeç"
                    variant="danger"
                />
            )}
        </div>
    );
};

export default MatchHistoryPage;
