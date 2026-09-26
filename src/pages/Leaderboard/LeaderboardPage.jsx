import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNetworking } from '../../contexts/NetworkingContext';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import { Trophy, Flame, Award, Network, Star, HelpCircle, Zap, X, Shield, UserPlus, Calendar } from 'lucide-react';
import UserProfileModal from '../../components/UserProfileModal';
import './LeaderboardPage.css';

const SCORING_RULES = [
    { icon: <Flame size={16} color="#ef4444" />, label: 'Günlük Seri', points: '4 Puan / Gün', desc: 'Her gün giriş yaparak serini koru.' },
    { icon: <Award size={16} color="#8b5cf6" />, label: 'Rozetler', points: '3 Puan / Rozet', desc: 'Başarılar kazanarak rozet topla.' },
    { icon: <Network size={16} color="#3b82f6" />, label: 'Bağlantılar', points: '2 Puan / Kişi', desc: 'Ağını genişlet ve bağ kur.' },
    { icon: <Zap size={16} color="#06b6d4" />, label: 'Aktiflik', points: '1 Puan / Gün', desc: 'Platformdaki toplam gün sayın.' },
];

const LeaderboardPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { 
        connections, 
        incomingRequests, 
        matchHistory,
        sendConnectionRequest, 
        acceptConnectionRequest, 
        rejectConnectionRequest, 
        cancelConnectionRequest 
    } = useNetworking();

    const getMatchId = (uid) => {
        const inc = incomingRequests.find(r => r.senderId === uid);
        if (inc) return inc.id;
        const out = matchHistory.find(m => m.receiverId === uid);
        if (out) return out.id;
        return null;
    };
    const getRequestStatus = (uid) => {
        if (incomingRequests.some(r => r.senderId === uid)) return 'received';
        const out = matchHistory.find(m => m.receiverId === uid);
        if (out && out.status === 'pending') return 'sent';
        return null;
    };
    const isConnection = (uid) => connections.some(c => c.senderId === uid || c.receiverId === uid);
    const handleSendRequest = async (uid) => {
        try { await sendConnectionRequest(uid); } catch (e) {}
    };
    const handleCancelRequest = async (mId) => {
        try { await cancelConnectionRequest(mId); } catch (e) {}
    };
    const handleAcceptRequest = async (mId) => {
        try { await acceptConnectionRequest(mId); } catch (e) {}
    };
    const handleRejectRequest = async (mId) => {
        try { await rejectConnectionRequest(mId); } catch (e) {}
    };

    const [leaderboard, setLeaderboard] = useState([]);
    const [clubLeaderboard, setClubLeaderboard] = useState([]);
    const [activeTab, setActiveTab] = useState('users'); // users, clubs
    const [currentUserRank, setCurrentUserRank] = useState(null);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showRules, setShowRules] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        document.title = 'Bondle | Liderlik Tablosu';
        const fetchLeaderboard = async () => {
            try {
                const [userData, clubData] = await Promise.all([
                    api.getLeaderboard().catch(() => ({ ranking: [], currentUser: null, totalParticipants: 0 })),
                    api.get('/clubs/leaderboard').catch(() => [])
                ]);
                
                const rankingData = userData.ranking || userData.leaderboard || [];
                setLeaderboard(rankingData);
                setCurrentUserRank(userData.currentUser);
                setTotalParticipants(userData.totalParticipants || 0);
                setClubLeaderboard(clubData || []);
            } catch (err) {
                console.error("Leaderboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="page leaderboard-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    const ranking = leaderboard;
    const top3 = ranking.slice(0, 3);
    const rest = ranking.slice(3);

    const podium = [];
    if (top3[1]) podium.push({ ...top3[1], pos: 2 });
    if (top3[0]) podium.push({ ...top3[0], pos: 1 });
    if (top3[2]) podium.push({ ...top3[2], pos: 3 });

    return (
        <div className="page leaderboard-page">
            <div className="container">
                <div className="leaderboard-header">

                    <h1>Liderlik Tablosu 🏆</h1>
                    <p>En aktif üyeler ve kulüpler arasında yerini al ve zirveye tırman!</p>
                    
                    <div style={{ display: 'inline-flex', gap: '4px', marginTop: '16px', background: 'rgba(255, 255, 255, 0.5)', padding: '4px', borderRadius: '30px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                        <button 
                            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ borderRadius: '24px', padding: '8px 24px', fontWeight: '700', fontSize: '0.9rem', border: 'none', background: activeTab === 'users' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'transparent', color: activeTab === 'users' ? '#fff' : '#6b21a8' }}
                            onClick={() => setActiveTab('users')}
                        >
                            Kullanıcılar
                        </button>
                        <button 
                            className={`btn ${activeTab === 'clubs' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ borderRadius: '24px', padding: '8px 24px', fontWeight: '700', fontSize: '0.9rem', border: 'none', background: activeTab === 'clubs' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'transparent', color: activeTab === 'clubs' ? '#fff' : '#6b21a8' }}
                            onClick={() => setActiveTab('clubs')}
                        >
                            Kulüpler
                        </button>
                    </div>
                    {activeTab === 'users' && (
                        <div className="rules-container" style={{ position: 'absolute', top: '10px', right: '16px', zIndex: 50 }}>
                            <button onClick={() => setShowRules(!showRules)} style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#6b21a8', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                <HelpCircle size={16} />
                            </button>

                            {showRules && (
                                <div className="rules-popover">
                                    <div className="popover-header">
                                        <h3>Nasıl Puan Kazanılır?</h3>
                                        <button className="close-btn" onClick={() => setShowRules(false)}><X size={16} /></button>
                                    </div>
                                    <div className="rules-grid">
                                        {SCORING_RULES.map(rule => (
                                            <div key={rule.label} className="rule-card">
                                                <div className="rule-icon">{rule.icon}</div>
                                                <div className="rule-info">
                                                    <div className="rule-label">{rule.label}</div>
                                                    <div className="rule-points">{rule.points}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="rules-footer">Puanın her girişinde otomatik güncellenir.</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {activeTab === 'clubs' ? (
                    <div className="leaderboard-container">
                        <div className="leaderboard-list-wrapper">
                            <ul className="leaderboard-list">
                                {clubLeaderboard.map((c, index) => (
                                    <li 
                                        key={c.id} 
                                        className="leaderboard-item"
                                        onClick={() => navigate(`/clubs/${c.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="item-rank">#{index + 1}</div>
                                        <div className="item-user">
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#6d28d9', fontWeight: '700' }}>
                                                {c.logoUrl || c.logo ? (
                                                    <img src={c.logoUrl || c.logo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    (c.name || 'C').charAt(0)
                                                )}
                                            </div>
                                            <div className="item-info">
                                                <div className="item-name" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                                    {c.name}
                                                </div>
                                                <div className="item-stats">
                                                    <div className="stat-badge text-secondary">{c.city || 'Konum Yok'}</div>
                                                    <div className="stat-badge text-secondary"><Network size={12} /> {c.memberCount || 0} Üye</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item-score">
                                            {c.score}
                                        </div>
                                    </li>
                                ))}
                                {clubLeaderboard.length === 0 && (
                                    <div className="empty-leaderboard">
                                        <Trophy size={48} opacity={0.2} />
                                        <p>Henüz onaylanmış kulüp bulunmuyor.</p>
                                    </div>
                                )}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="leaderboard-container">
                        {/* Podium */}
                    {podium.length > 0 && (
                        <div className="leaderboard-top-three">
                            {podium.map(u => (
                                <div 
                                    key={u.userId} 
                                    className={`top-rank-card rank-${u.pos}`}
                                    onClick={() => setSelectedUser({ ...u, id: u.userId })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {u.pos === 1 && <div className="crown">👑</div>}
                                    <div className="avatar-wrapper">
                                        <UserAvatar user={u} size={u.pos === 1 ? 'xl' : 'lg'} />
                                        <div className="rank-badge">{u.pos}</div>
                                    </div>
                                    <div className="name">
                                        {u.name} {u.surname?.charAt(0)}.
                                        {u.role === 'campus_ambassador' && <Shield size={14} fill="#8b5cf6" color="#8b5cf6" style={{marginLeft: '4px'}} title="Kampüs Elçisi" />}
                                    </div>
                                    <div className="score-pill">
                                        {u.score} PTS
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* List */}
                    <div className="leaderboard-list-wrapper">
                        <ul className="leaderboard-list">
                            {rest.map(u => (
                                <li 
                                    key={u.userId} 
                                    className={`leaderboard-item ${user?.id === u.userId ? 'is-current-user' : ''}`}
                                    onClick={() => setSelectedUser({ ...u, id: u.userId })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="item-rank">#{u.rank}</div>
                                    <div className="item-user">
                                        <UserAvatar user={u} size="md" />
                                        <div className="item-info">
                                            <div className="item-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {u.name} {u.surname}
                                                {u.isPremium && <Star size={14} fill="#fbbf24" color="#fbbf24" />}
                                                {u.role === 'campus_ambassador' && <Shield size={14} fill="#8b5cf6" color="#8b5cf6" title="Kampüs Elçisi" />}
                                            </div>
                                            <div className="item-stats">
                                                <div className="stat-badge"><Flame size={12} color="#ef4444" /> {u.currentStreak}</div>
                                                <div className="stat-badge"><Award size={12} color="#8b5cf6" /> {u.badges}</div>
                                                <div className="stat-badge"><Network size={12} color="#3b82f6" /> {u.connections}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="item-score">
                                        {u.score}
                                    </div>
                                </li>
                            ))}
                            {ranking.length === 0 && (
                                <div className="empty-leaderboard">
                                    <Trophy size={48} opacity={0.2} />
                                    <p>Henüz kimse sıralamaya girmedi. İlk sen ol!</p>
                                </div>
                            )}
                        </ul>
                    </div>
                </div>
                )}
                
                {/* My Rank Sticky Banner */}
                {activeTab === 'users' && currentUserRank && (
                    <div className="my-rank-banner">
                        <div className="my-rank-info">
                            <div className="my-rank-number">#{currentUserRank.rank}</div>
                            <div>
                                <div className="my-rank-title">Senin Sıran</div>
                                <div className="my-rank-subtitle">
                                    {totalParticipants} kişi arasındasın. Yükselmek için serini koru!
                                </div>
                            </div>
                        </div>
                        <div className="my-rank-score">
                            <div className="score-val">{currentUserRank.score}</div>
                            <div className="score-lbl">PUAN</div>
                        </div>
                    </div>
                )}
            </div>

            <UserProfileModal 
                isOpen={!!selectedUser} 
                onClose={() => setSelectedUser(null)} 
                user={selectedUser}
                footerActions={
                    selectedUser && user?.id !== selectedUser?.id && (
                        <div style={{ marginTop: '20px' }}>
                            {(() => {
                                const uid = selectedUser.id || selectedUser.userId;
                                if (!uid) return null;
                                const status = getRequestStatus(uid);
                                const isConn = isConnection(uid);
                                if (isConn) return (
                                    <button className="btn btn-secondary" disabled style={{ width: '100%', padding: '14px', borderRadius: '14px' }}>
                                        Bağlantılı ✓
                                    </button>
                                );
                                if (status === 'sent') return (
                                    <button className="btn btn-secondary" style={{ width: '100%', padding: '14px', borderRadius: '14px' }} onClick={() => handleCancelRequest(getMatchId(uid))}>
                                        İstek Gönderildi (İptal Et)
                                    </button>
                                );
                                if (status === 'received') return (
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button className="btn btn-success" style={{ flex: 1, padding: '14px', borderRadius: '14px' }} onClick={() => handleAcceptRequest(getMatchId(uid))}>
                                            Onayla
                                        </button>
                                        <button className="btn btn-danger" style={{ flex: 1, padding: '14px', borderRadius: '14px' }} onClick={() => handleRejectRequest(getMatchId(uid))}>
                                            Reddet
                                        </button>
                                    </div>
                                );
                                return (
                                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                        <button
                                            style={{
                                                flex: 1, padding: '14px', borderRadius: '100px', fontWeight: '800',
                                                background: 'linear-gradient(135deg, #9333ea, #4c1d95)', color: '#ffffff',
                                                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', boxShadow: '0 8px 24px rgba(109, 40, 217, 0.4)',
                                                transition: 'transform 0.2s', fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            onClick={() => handleSendRequest(uid)}
                                        >
                                            <UserPlus size={18} style={{ marginRight: '8px' }} />
                                            Arkadaş Ekle
                                        </button>
                                        <button
                                            style={{
                                                flex: 1, padding: '14px', borderRadius: '100px', fontWeight: '800',
                                                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff',
                                                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                                                transition: 'transform 0.2s', fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            onClick={() => navigate(`/networking?schedule=${uid}`)}
                                        >
                                            <Calendar size={18} style={{ marginRight: '8px' }} />
                                            Görüşme (1⚡)
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    )
                }
            />
        </div>
    );
};

export default LeaderboardPage;

