import React, { useState, useEffect } from 'react';
import './ConnectionsPage.css';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Calendar, MessageCircle, Trash2, Star, 
    MapPin, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyConnections, deleteConnection } from '../../services/networkingService';
import UserProfileModal from '../../components/UserProfileModal';

const ConnectionsPage = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);

    // Profile modal state
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const data = await getMyConnections();
            setConnections(data);
        } catch (error) {
            console.error('Error fetching connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConnection = async (connectionId) => {
        if (!window.confirm('Bu bağlantıyı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteConnection(connectionId);
            setConnections(connections.filter(c => c.id !== connectionId));
        } catch (error) {
            console.error('Error deleting connection:', error);
            alert('Bağlantı silinirken bir hata oluştu');
        }
    };

    const getOtherUser = (connection) => {
        if (!connection.user1 || !connection.user2 || !currentUser) return null;
        return String(connection.user1.id) === String(currentUser.id) ? connection.user2 : connection.user1;
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Bağlantılarım</h1>
                    <p className="text-secondary">Kabul ettiğiniz eşleşmeler ve planlanan toplantılar</p>
                </div>

                {connections.length === 0 ? (
                    <div className="empty-state">
                        <MessageCircle size={48} />
                        <p>Henüz hiç bağlantınız yok</p>
                        <Link to="/network" className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
                            Network'e Git
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {connections.map((connection) => {
                            const otherUser = getOtherUser(connection);
                            if (!otherUser) return null;

                            return (
                                <div 
                                    key={connection.id} 
                                    className="card connection-list-card connection-card-clickable"
                                    onClick={() => setSelectedUser(otherUser)}
                                >
                                    <div className="connection-card-inner">
                                        {/* Avatar */}
                                        <div className="connection-avatar-wrapper">
                                            {otherUser.profilePicture ? (
                                                <img
                                                    src={otherUser.profilePicture}
                                                    alt={otherUser.name}
                                                    className="connection-avatar-img"
                                                />
                                            ) : (
                                                <div className="connection-avatar-fallback">
                                                    {otherUser.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* User Info */}
                                        <div className="connection-info-container">
                                            <h3 className="connection-name">
                                                {otherUser.name} {otherUser.surname || ''}
                                                {otherUser.isPremium && (
                                                    <Star size={16} fill="var(--color-warning)" color="var(--color-warning)" title="Premium Üye" />
                                                )}
                                            </h3>
                                            <p className="connection-title">
                                                {otherUser.title || 'Kullanıcı'}
                                            </p>
                                            
                                            {otherUser.bio && (
                                                <p className="connection-bio">
                                                    {otherUser.bio}
                                                </p>
                                            )}

                                            <div className="connection-meta-row">
                                                {otherUser.city && (
                                                    <p className="connection-location">
                                                        <MapPin size={15} /> {otherUser.city}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="connection-actions-container" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="btn btn-primary btn-sm connection-plan-btn" onClick={() => navigate(`/network/connections/${connection.id}/schedule`)}
                                            >
                                                <Calendar size={16} />
                                                Toplantı Planla
                                            </button>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDeleteConnection(connection.id)}
                                                    title="Bağlantıyı Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Shared Profile Modal */}
            <UserProfileModal 
                isOpen={!!selectedUser} 
                onClose={() => setSelectedUser(null)} 
                user={selectedUser}
            />
        </div>
    );
};

export default ConnectionsPage;
