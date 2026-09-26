import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Check, X, User, Mail, Phone, Calendar, GraduationCap, BookOpen, FileText, Trash2, Clock, CheckCircle } from 'lucide-react';

const AdminEventApplicationsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [registrations, setRegistrations] = useState([]);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [sortBy, setSortBy] = useState('date'); // date, score, rate

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const data = await api.getEventRegistrations(id);
            setRegistrations(data || []);
            
            if (data && data.length > 0 && data[0].event) {
                setEvent(data[0].event);
            } else {
                // Fetch event details if no registrations yet
                const eventData = await api.get(`/events/${id}`);
                setEvent(eventData);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (regId, action) => {
        const actionText = action === 'verify' ? 'onaylamak' : 'reddetmek';
        if (!window.confirm(`Başvuruyu ${actionText} istediğinize emin misiniz?`)) return;

        try {
            if (action === 'verify') {
                await api.verifyRegistration(regId);
            } else {
                await api.rejectRegistration(regId);
            }
            
            setRegistrations(prev => prev.map(reg =>
                reg.id === regId ? { ...reg, status: action === 'verify' ? 'APPROVED' : 'REJECTED' } : reg
            ));
        } catch (err) {
            alert('Durum güncellenemedi: ' + (err.response?.data?.message || err.message));
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            APPROVED: { bg: '#10b981', text: 'Onaylandı', icon: <CheckCircle size={14} /> },
            REJECTED: { bg: '#ef4444', text: 'Reddedildi', icon: <X size={14} /> },
            PENDING: { bg: '#f59e0b', text: 'Bekliyor', icon: <Clock size={14} /> },
        };
        const s = styles[status?.toUpperCase()] || styles.PENDING;
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: s.bg,
                color: 'var(--color-text-on-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                {s.icon} {s.text}
            </span>
        );
    };

    if (loading) return <div className="page"><div className="container">Yükleniyor...</div></div>;

    return (
        <div className="page">
            <div className="container">
                <button
                    onClick={() => window.history.back()}
                    className="btn btn-ghost"
                    style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ArrowLeft size={20} />
                    Geri Dön
                </button>

                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Başvuru Formu Yanıtları</h1>
                        <p className="text-secondary">
                            {event ? event.title : `Etkinlik ID: ${id}`} — {registrations.length} Başvuru
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                            className="input" 
                            style={{ padding: '8px', fontSize: '0.9rem', borderRadius: '8px' }}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="date">Tarihe Göre</option>
                            <option value="score">Puana Göre (Azalan)</option>
                            <option value="rate">Katılıma Göre (Azalan)</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {registrations.length === 0 ? (
                        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Henüz başvuru yok.</div>
                    ) : (
                        [...registrations].sort((a, b) => {
                            if (sortBy === 'score') return (b.user?.score || 0) - (a.user?.score || 0);
                            if (sortBy === 'rate') return (b.user?.participationRate || 0) - (a.user?.participationRate || 0);
                            return new Date(b.registeredAt) - new Date(a.registeredAt);
                        }).map(reg => (
                            <div key={reg.id} className=" admin-list-item" style={{
                                padding: 0,
                                overflow: 'hidden',
                                border: expandedId === reg.id ? '1px solid var(--color-accent-primary)' : undefined,
                            }}>
                                <div
                                    style={{
                                        padding: 'var(--spacing-lg)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}
                                >
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '50%',
                                            background: 'var(--color-accent-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--color-text-on-accent)', fontWeight: '700'
                                        }}>
                                            {(reg.firstName || reg.user?.name || 'U').charAt(0).toUpperCase()}
                                            {(reg.lastName || reg.user?.surname || '').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {reg.firstName || reg.user?.name || 'İsimsiz'} {reg.lastName || reg.user?.surname || 'Kullanıcı'}
                                                
                                                {(reg.user?.score !== undefined || reg.user?.participationRate !== undefined) && (
                                                    <span style={{ fontSize: '11px', display: 'flex', gap: '6px' }}>
                                                        <span style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>🏆 {reg.user?.score || 0} Puan</span>
                                                        <span style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>🎯 %{Number(reg.user?.participationRate || 0).toFixed(0)}</span>
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-secondary" style={{ fontSize: '13px', margin: 0, marginTop: '4px' }}>
                                                {reg.university || 'Üniversite Belirtilmemiş'} • {reg.department || 'Bölüm Belirtilmemiş'}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {getStatusBadge(reg.status)}
                                        <span style={{ transform: expandedId === reg.id ? 'rotate(180deg)' : '' }}>▼</span>
                                    </div>
                                </div>

                                {expandedId === reg.id && (
                                    <div style={{
                                        borderTop: '1px solid var(--color-bg-tertiary)',
                                        padding: 'var(--spacing-lg)',
                                        backgroundColor: 'var(--color-subtle-bg)',
                                    }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: 'var(--spacing-md)',
                                            marginBottom: 'var(--spacing-lg)',
                                        }}>
                                            <InfoItem icon={<Mail size={16} />} label="Email" value={reg.email} />
                                            <InfoItem icon={<Phone size={16} />} label="Telefon" value={reg.phone} />
                                            <InfoItem icon={<GraduationCap size={16} />} label="Sınıf" value={reg.classLevel} />
                                            <InfoItem icon={<Calendar size={16} />} label="Başvuru" value={new Date(reg.registeredAt).toLocaleDateString('tr-TR')} />
                                        </div>

                                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                            <h5 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FileText size={14} /> Motivasyon
                                            </h5>
                                            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                                                {reg.motivation}
                                            </p>
                                        </div>

                                        {reg.expectations && (
                                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                                <h5 style={{ marginBottom: '4px' }}>Beklentiler</h5>
                                                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                                                    {reg.expectations}
                                                </p>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {reg.status?.toUpperCase() !== 'APPROVED' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(reg.id, 'verify')}
                                                    className="btn btn-primary"
                                                    style={{ background: '#10b981' }}
                                                >
                                                    <Check size={18} /> {reg.status?.toUpperCase() === 'REJECTED' ? 'Tekrar Onayla' : 'Onayla'}
                                                </button>
                                            )}
                                            {reg.status?.toUpperCase() !== 'REJECTED' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(reg.id, 'reject')}
                                                    className="btn btn-outline-danger"
                                                >
                                                    <X size={18} /> {reg.status?.toUpperCase() === 'APPROVED' ? 'İptal Et' : 'Reddet'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ icon, label, value }) => (
    <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ color: 'var(--color-accent-primary)' }}>{icon}</div>
        <div>
            <div className="text-secondary" style={{ fontSize: '12px' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>{value}</div>
        </div>
    </div>
);

export default AdminEventApplicationsPage;
