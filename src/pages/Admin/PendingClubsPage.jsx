import React, { useState, useEffect } from 'react';
import { getPendingClubs, approveClub, rejectClub } from '../../services/clubService';
import { Instagram, Linkedin, Users } from 'lucide-react';
import './PendingClubsPage.css';

const PendingClubsPage = () => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPendingClubs();
    }, []);

    const fetchPendingClubs = async () => {
        setLoading(true);
        try {
            const data = await getPendingClubs();
            setClubs(data);
        } catch (err) {
            setError('Kulüpler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (clubId) => {
        if (!window.confirm('Bu kulübü onaylamak istediğinize emin misiniz?')) return;

        try {
            await approveClub(clubId);
            alert('Kulüp onaylandı!');
            fetchPendingClubs();
        } catch (err) {
            alert('Onaylama başarısız: ' + err.message);
        }
    };

    const handleReject = async (clubId) => {
        const reason = window.prompt('Red nedeni:');
        if (!reason) return;

        try {
            await rejectClub(clubId, reason);
            alert('Kulüp reddedildi');
            fetchPendingClubs();
        } catch (err) {
            alert('Reddetme başarısız: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page pending-clubs-page">
            <div className="container">
                <div className="page-header">
                    <h1>Onay Bekleyen Kulüpler</h1>
                    <p className="text-secondary">
                        Kulüp yöneticileri tarafından oluşturulan kulüpleri onaylayın veya reddedin
                    </p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {clubs.length === 0 ? (
                    <div className="empty-state">
                        <p>Onay bekleyen kulüp bulunmuyor</p>
                    </div>
                ) : (
                    <div className="pending-clubs-list" style={{ display: 'grid', gap: '20px' }}>
                        {clubs.map((club) => (
                            <div key={club.id} className=" admin-list-item" style={{ padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                                <div className="club-header" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                    {club.logoUrl ? (
                                        <img
                                            src={club.logoUrl}
                                            alt={club.name}
                                            className="club-logo"
                                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                                            {club.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="club-info" style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{club.name}</h3>
                                        <p className="club-city" style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)' }}>📍 {club.city}</p>
                                        <p className="club-president" style={{ margin: '0', color: 'var(--color-primary)', fontWeight: '500' }}>
                                            👑 Kurucu: {club.president?.name} {club.president?.surname}
                                        </p>
                                    </div>
                                </div>

                                <div className="club-description" style={{ marginBottom: '16px', padding: '16px', background: 'var(--color-bg-tertiary)', borderRadius: '12px' }}>
                                    <p style={{ margin: 0, lineHeight: '1.6' }}>{club.description || 'Açıklama girilmemiş.'}</p>
                                </div>

                                {/* Ekstra Detaylar: Üye Sayısı, Sosyal Medya ve Kategoriler */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    {/* Sol Kolon: Metrikler ve Sosyal */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                                            <Users size={18} /> 
                                            <span>Mevcut Üye: <strong style={{ color: 'var(--color-text-primary)' }}>{club.memberCount || 0}</strong></span>
                                        </div>
                                        
                                        {(club.instagramUrl || club.linkedinUrl) && (
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                {club.instagramUrl && (
                                                    <a href={club.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E1306C', textDecoration: 'none', fontWeight: '500' }}>
                                                        <Instagram size={18} /> Instagram
                                                    </a>
                                                )}
                                                {club.linkedinUrl && (
                                                    <a href={club.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0077B5', textDecoration: 'none', fontWeight: '500' }}>
                                                        <Linkedin size={18} /> LinkedIn
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sağ Kolon: Kategoriler */}
                                    <div>
                                        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Seçilen Kategoriler:</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {club.categories && club.categories.length > 0 ? (
                                                club.categories.map(cat => (
                                                    <span key={cat} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                                        {cat}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Kategori seçilmemiş</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="club-actions" style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                    <button
                                        onClick={() => handleApprove(club.id)}
                                        className="btn btn-success"
                                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        ✓ Onayla ve Yayına Al
                                    </button>
                                    <button
                                        onClick={() => handleReject(club.id)}
                                        className="btn btn-danger"
                                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        ✗ Reddet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingClubsPage;
