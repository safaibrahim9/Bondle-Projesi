import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import './StreakWidget.css';

const BADGE_META = {
    first_login:       { emoji: '🌱', label: 'İlk Adım' },
    streak_3:          { emoji: '🔥', label: '3 Günlük Seri' },
    streak_7:          { emoji: '⚡', label: '7 Günlük Seri' },
    streak_30:         { emoji: '💎', label: '30 Günlük Seri' },
    networker:         { emoji: '🤝', label: 'Networkçi' },
    super_networker:   { emoji: '🌐', label: 'Süper Networkçi' },
    event_goer:        { emoji: '📅', label: 'Etkinlik Dostu' },
    event_enthusiast:  { emoji: '🎉', label: 'Etkinlik Tutkunu' },
    mentee:            { emoji: '🎓', label: 'Mentee' },
    competitor:        { emoji: '🏆', label: 'Yarışmacı' },
    club_member:       { emoji: '👥', label: 'Kulüp Üyesi' },
    profile_complete:  { emoji: '⭐', label: 'Tam Profil' },
    premium:           { emoji: '💫', label: 'Premium' },
};

const StreakWidget = ({ onCreditEarned, isMinimized = false, isTransparent = false }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showChallenges, setShowChallenges] = useState(false);
    const [showBadges, setShowBadges] = useState(false);
    const [streakAnim, setStreakAnim] = useState(false);

    const load = useCallback(async () => {
        try {
            // Record daily login (idempotent — backend ignores if already done today)
            const loginResult = await api.recordDailyLogin();
            const summaryData = await api.getEngagementSummary();
            setSummary(summaryData);

            if (loginResult.creditsAwarded > 0) {
                setStreakAnim(true);
                setTimeout(() => setStreakAnim(false), 2000);
                onCreditEarned?.(loginResult.creditsAwarded);
            }
        } catch (err) {
            console.error('Engagement load error:', err);
        } finally {
            setLoading(false);
        }
    }, [onCreditEarned]);

    useEffect(() => { load(); }, [load]);

    if (loading || !summary) return null;

    const { streak, challenges, badges, newBadgesCount } = summary;
    const completedChallenges = challenges.filter(c => c.completed).length;
    const earnedBadges = badges.filter(b => b.earned);
    const currentStreak = streak?.currentStreak || 0;

    // Streak flame color based on length
    const streakColor = currentStreak >= 30 ? '#a855f7'
        : currentStreak >= 7 ? '#f97316'
        : currentStreak >= 3 ? '#ef4444'
        : '#6b7280';

    return (
        <>
            {/* Main Widget Card */}
            <div className={`streak-widget ${isMinimized ? 'minimized' : ''} ${isTransparent ? 'transparent' : ''}`}>
                {/* Streak Block */}
                <div
                    className={`streak-block${streakAnim ? ' streak-anim' : ''}`}
                    style={{ '--streak-color': streakColor }}
                    title={`${currentStreak} günlük giriş serisi`}
                >
                    <div className="streak-flame">
                        {currentStreak >= 7 ? '⚡' : currentStreak >= 3 ? '🔥' : '🌱'}
                    </div>
                    <div className="streak-number">{currentStreak}</div>
                    <div className="streak-label">Gün Serisi</div>
                </div>

                {/* Divider */}
                <div className="streak-divider" />

                {/* Weekly Challenges */}
                <button
                    className="streak-stat-btn"
                    onClick={() => setShowChallenges(true)}
                    title="Haftalık Görevler"
                >
                    <div className="streak-stat-icon">🎯</div>
                    <div className="streak-stat-number">
                        {completedChallenges}<span className="streak-stat-total">/{challenges.length}</span>
                    </div>
                    <div className="streak-stat-label">Görev</div>
                    {completedChallenges === challenges.length && (
                        <div className="streak-complete-badge">✓</div>
                    )}
                </button>

                {/* Divider */}
                <div className="streak-divider" />

                {/* Badges */}
                <button
                    className="streak-stat-btn"
                    onClick={() => setShowBadges(true)}
                    title="Rozetlerim"
                >
                    <div className="streak-stat-icon">🏅</div>
                    <div className="streak-stat-number">
                        {earnedBadges.length}<span className="streak-stat-total">/{badges.length}</span>
                    </div>
                    <div className="streak-stat-label">Rozet</div>
                    {newBadgesCount > 0 && (
                        <div className="streak-new-badge">{newBadgesCount}</div>
                    )}
                </button>
            </div>

            {/* Weekly Challenges Modal */}
            {showChallenges && (
                <div className="engagement-modal-overlay" onClick={() => setShowChallenges(false)}>
                    <div className="engagement-modal" onClick={e => e.stopPropagation()}>
                        <div className="engagement-modal-header">
                            <h3>🎯 Bu Haftaki Görevler</h3>
                            <button className="engagement-modal-close" onClick={() => setShowChallenges(false)}>✕</button>
                        </div>
                        <p className="engagement-modal-subtitle">
                            Tüm görevleri tamamla ve <strong>+15 ⚡ Kredi</strong> kazan!
                        </p>
                        <div className="challenge-list">
                            {challenges.map(ch => (
                                <div key={ch.key} className={`challenge-item${ch.completed ? ' completed' : ''}`}>
                                    <div className="challenge-check">
                                        {ch.completed ? '✅' : '⬜'}
                                    </div>
                                    <div className="challenge-info">
                                        <div className="challenge-label">{ch.label}</div>
                                        {ch.completed && ch.completedAt && (
                                            <div className="challenge-date">
                                                {new Date(ch.completedAt).toLocaleDateString('tr-TR')}
                                            </div>
                                        )}
                                    </div>
                                    {/* Bireysel kredi etiketleri kaldırıldı */}
                                </div>
                            ))}
                        </div>
                        <div className="challenge-total" style={{ textAlign: 'center', background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '12px', marginTop: '16px' }}>
                            {completedChallenges === challenges.length 
                                ? <strong style={{ color: '#22c55e' }}>🎉 Tüm görevler tamamlandı! (Kazanılan: 15 ⚡)</strong>
                                : <strong>{challenges.length - completedChallenges} görev kaldı. Tamamla ve 15 ⚡ kazan!</strong>}
                        </div>
                    </div>
                </div>
            )}

            {/* Badges Modal */}
            {showBadges && (
                <div className="engagement-modal-overlay" onClick={() => { setShowBadges(false); api.markBadgesSeen().catch(() => {}); }}>
                    <div className="engagement-modal" onClick={e => e.stopPropagation()}>
                        <div className="engagement-modal-header">
                            <h3>🏅 Rozetlerim</h3>
                            <button className="engagement-modal-close" onClick={() => { setShowBadges(false); api.markBadgesSeen().catch(() => {}); }}>✕</button>
                        </div>
                        <p className="engagement-modal-subtitle">
                            Başarılarını topla ve profilinde göster!
                        </p>
                        <div className="badge-grid">
                            {badges.map(b => {
                                const meta = BADGE_META[b.badge] || { emoji: '🏅', label: b.badge };
                                return (
                                    <div 
                                        key={b.badge} 
                                        className={`badge-item${b.earned ? ' earned' : ' locked'}`}
                                        onClick={() => alert(`${BADGE_META[b.badge]?.emoji || '🏅'} ${BADGE_META[b.badge]?.label || b.badge}\n\n${b.description}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="badge-emoji">{meta.emoji}</div>
                                        <div className="badge-name">{meta.label}</div>
                                        {b.earned && b.earnedAt && (
                                            <div className="badge-date">
                                                {new Date(b.earnedAt).toLocaleDateString('tr-TR')}
                                            </div>
                                        )}
                                        {!b.earned && <div className="badge-locked-overlay">🔒</div>}
                                        {b.earned && !b.seen && <div className="badge-new-dot" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StreakWidget;
