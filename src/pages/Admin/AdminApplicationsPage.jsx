import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Check, X, User, Mail, Phone, Calendar, GraduationCap, BookOpen, FileText, StickyNote, Trash2, RotateCcw } from 'lucide-react';

const AdminApplicationsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [competition, setCompetition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const subs = await api.getCompetitionApplications(id);
            setApplications(subs || []);

            // Get competition title from first submission or fetch separately
            if (subs && subs.length > 0 && subs[0].competition) {
                setCompetition(subs[0].competition);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (subId, newStatus) => {
        const actionText = newStatus === 'approved' ? 'onaylamak' : newStatus === 'pending' ? 'geri almak' : 'reddetmek';
        if (!window.confirm(`Başvuruyu ${actionText} istediğinize emin misiniz?`)) return;

        try {
            await api.updateSubmissionStatus(subId, newStatus);
            setApplications(prev => prev.map(app =>
                app.id === subId ? { ...app, status: newStatus } : app
            ));
        } catch (err) {
            alert('Durum güncellenemedi.');
        }
    };

    const handleDelete = async (subId) => {
        if (!window.confirm('Bu başvuruyu kalıcı olarak silmek istediğinize emin misiniz?')) return;

        try {
            await api.deleteSubmission(subId);
            setApplications(prev => prev.filter(app => app.id !== subId));
        } catch (err) {
            alert('Başvuru silinemedi.');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            approved: { bg: '#10b981', text: 'Onaylandı' },
            rejected: { bg: '#ef4444', text: 'Reddedildi' },
            pending: { bg: '#f59e0b', text: 'Bekliyor' },
        };
        const s = styles[status] || styles.pending;
        return (
            <span style={{
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: s.bg,
                color: 'var(--color-text-on-accent)',
                whiteSpace: 'nowrap',
            }}>
                {s.text}
            </span>
        );
    };

    return (
        <div className="page">
            <div className="container">
                <button
                    onClick={() => navigate('/admin/competitions')}
                    className="btn btn-ghost"
                    style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ArrowLeft size={20} />
                    Geri Dön
                </button>

                <div className="page-header">
                    <h1>Başvurular</h1>
                    <p className="text-secondary">
                        {competition ? competition.title : `Yarışma ID: ${id}`}
                        {applications.length > 0 && ` — ${applications.length} başvuru`}
                    </p>
                </div>

                {/* Stats summary */}
                {!loading && applications.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-xl)',
                    }}>
                        {[
                            { label: 'Bekleyen', count: applications.filter(a => a.status === 'pending').length, color: '#f59e0b' },
                            { label: 'Onaylanan', count: applications.filter(a => a.status === 'approved').length, color: '#10b981' },
                            { label: 'Reddedilen', count: applications.filter(a => a.status === 'rejected').length, color: '#ef4444' },
                        ].map(({ label, count, color }) => (
                            <div key={label} className=" admin-list-item" style={{
                                padding: 'var(--spacing-md)',
                                textAlign: 'center',
                                borderTop: `3px solid ${color}`
                            }}>
                                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color }}>{count}</div>
                                <div className="text-secondary" style={{ fontSize: '13px' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {loading ? (
                        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>
                    ) : applications.length === 0 ? (
                        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Henüz başvuru yok.</div>
                    ) : (
                        applications.map(app => (
                            <div key={app.id} className=" admin-list-item" style={{
                                padding: 0,
                                overflow: 'hidden',
                                border: expandedId === app.id ? '1px solid var(--color-accent-primary)' : undefined,
                                transition: 'border 0.2s ease',
                            }}>
                                {/* Header row */}
                                <div
                                    style={{
                                        padding: 'var(--spacing-lg)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                                >
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary, #ff8c00))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--color-text-on-accent)', fontWeight: '700', fontSize: '16px',
                                        }}>
                                            {app.name?.charAt(0)?.toUpperCase()}{app.surname?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '15px' }}>{app.name} {app.surname}</h4>
                                            <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
                                                {app.university || 'Belirtilmedi'} {app.department ? `• ${app.department}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {getStatusBadge(app.status)}
                                        <span style={{ fontSize: '18px', transition: 'transform 0.2s', transform: expandedId === app.id ? 'rotate(180deg)' : '' }}>▼</span>
                                    </div>
                                </div>

                                {/* Expanded detail panel */}
                                {expandedId === app.id && (
                                    <div style={{
                                        borderTop: '1px solid var(--color-border)',
                                        padding: 'var(--spacing-lg)',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                    }}>
                                        {/* Info grid */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 'var(--spacing-md)',
                                            marginBottom: 'var(--spacing-lg)',
                                        }}>
                                            <InfoItem icon={<User size={16} />} label="Ad Soyad" value={`${app.name} ${app.surname}`} />
                                            <InfoItem icon={<Mail size={16} />} label="Email" value={app.email || app.user?.email || 'N/A'} />
                                            <InfoItem icon={<Phone size={16} />} label="Telefon" value={app.phone || 'Belirtilmedi'} />
                                            <InfoItem icon={<GraduationCap size={16} />} label="Üniversite" value={app.university || 'Belirtilmedi'} />
                                            <InfoItem icon={<BookOpen size={16} />} label="Bölüm" value={app.department || 'Belirtilmedi'} />
                                            <InfoItem icon={<Calendar size={16} />} label="Başvuru Tarihi" value={new Date(app.createdAt).toLocaleDateString('tr-TR', {
                                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })} />
                                        </div>

                                        {/* Motivation */}
                                        <div style={{
                                            backgroundColor: 'var(--color-bg-tertiary)',
                                            padding: 'var(--spacing-md)',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: app.notes ? 'var(--spacing-md)' : 'var(--spacing-lg)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <FileText size={16} color="var(--color-accent-primary)" />
                                                <h4 style={{ margin: 0, fontSize: '14px' }}>Motivasyon</h4>
                                            </div>
                                            <p style={{
                                                margin: 0,
                                                lineHeight: '1.7',
                                                whiteSpace: 'pre-wrap',
                                                fontSize: '14px',
                                            }}>
                                                {app.motivation}
                                            </p>
                                        </div>

                                        {/* Notes */}
                                        {app.notes && (
                                            <div style={{
                                                backgroundColor: 'var(--color-bg-tertiary)',
                                                padding: 'var(--spacing-md)',
                                                borderRadius: 'var(--radius-md)',
                                                marginBottom: 'var(--spacing-lg)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <StickyNote size={16} color="var(--color-accent-primary)" />
                                                    <h4 style={{ margin: 0, fontSize: '14px' }}>Ek Notlar</h4>
                                                </div>
                                                <p style={{
                                                    margin: 0,
                                                    lineHeight: '1.7',
                                                    whiteSpace: 'pre-wrap',
                                                    fontSize: '14px',
                                                }}>
                                                    {app.notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            {app.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(app.id, 'approved')}
                                                        className="btn"
                                                        style={{
                                                            backgroundColor: '#10b981',
                                                            color: 'var(--color-text-on-accent)',
                                                            padding: '10px 24px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                        }}
                                                    >
                                                        <Check size={18} /> Kabul Et
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                        className="btn"
                                                        style={{
                                                            backgroundColor: '#ef4444',
                                                            color: 'var(--color-text-on-accent)',
                                                            padding: '10px 24px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                        }}
                                                    >
                                                        <X size={18} /> Reddet
                                                    </button>
                                                </>
                                            )}

                                            {app.status === 'approved' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(app.id, 'pending')}
                                                    className="btn"
                                                    style={{
                                                        backgroundColor: '#f59e0b',
                                                        color: 'var(--color-text-on-accent)',
                                                        padding: '10px 24px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                    }}
                                                >
                                                    <RotateCcw size={18} /> Kabul İptal
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleDelete(app.id)}
                                                className="btn"
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    color: '#ef4444',
                                                    padding: '10px 24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    border: '1px solid #ef4444',
                                                    borderRadius: '8px',
                                                    marginLeft: 'auto',
                                                }}
                                            >
                                                <Trash2 size={18} /> Sil
                                            </button>
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

// Reusable info item component
const InfoItem = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ color: 'var(--color-accent-primary)', marginTop: '2px', flexShrink: 0 }}>{icon}</div>
        <div>
            <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>{value}</div>
        </div>
    </div>
);

export default AdminApplicationsPage;
