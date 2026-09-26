import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Check, X, User, ExternalLink, Trash2 } from 'lucide-react';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';

const AdminReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [showResolveModal, setShowResolveModal] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const data = await api.getAdminReports();
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (reportId) => {
        setResolvingId(reportId);
        try {
            await api.resolveReport(reportId, adminNote);
            setReports(reports.filter(r => r.id !== reportId));
            setShowResolveModal(null);
            setAdminNote('');
            alert('Rapor çözüldü olarak işaretlendi.');
        } catch (error) {
            alert('İşlem başarısız.');
        } finally {
            setResolvingId(null);
        }
    };

    const handleBan = async (userId) => {
        if (!window.confirm('Bu kullanıcıyı banlamak istediğinizden emin misiniz?')) return;
        try {
            await api.banUser(userId);
            alert('Kullanıcı banlandı.');
            fetchReports();
        } catch (error) {
            alert('İşlem başarısız.');
        }
    };

    if (loading) return <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Yükleniyor...</div>;

    return (
        <div className="page">
            <div className="container">
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Kullanıcı Raporları</h1>
                    <p className="text-secondary">Platformdaki şikayetleri ve kötüye kullanım raporlarını buradan yönetebilirsiniz.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reports.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                            <Check size={48} color="var(--color-accent-primary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <p className="text-secondary">Bekleyen rapor bulunmuyor. Her şey yolunda! ✨</p>
                        </div>
                    ) : (
                        reports.map(report => (
                            <div key={report.id} className=" admin-list-item" style={{ padding: 'var(--spacing-lg)', borderLeft: '4px solid #ef4444' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                                                {report.reason === 'spam' ? 'Spam' : 
                                                 report.reason === 'harassment' ? 'Taciz' : 
                                                 report.reason === 'inappropriate_content' ? 'Uygunsuz İçerik' : 
                                                 report.reason === 'fake_profile' ? 'Sahte Profil' : 'Diğer'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>
                                                {new Date(report.createdAt).toLocaleString('tr-TR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setShowResolveModal(report)}
                                        >
                                            <Check size={16} /> Kapat
                                        </button>
                                        <button 
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' }}
                                            onClick={() => handleBan(report.reportedUserId)}
                                        >
                                            <Shield size={16} /> Banla
                                        </button>
                                    </div>
                                </div>

                                <div style={{ 
                                    background: 'var(--color-bg-tertiary)', 
                                    padding: '16px', 
                                    borderRadius: '12px',
                                    marginBottom: '16px',
                                    fontSize: '0.95rem'
                                }}>
                                    <strong>Şikayet Detayı:</strong>
                                    <p style={{ marginTop: '8px', marginBottom: 0 }}>{report.details || 'Detay belirtilmemiş.'}</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ background: 'var(--color-subtle-bg)', padding: '12px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Raporlayan</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <UserAvatar user={report.reporter} size="sm" />
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{report.reporter.name} {report.reporter.surname}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{report.reporter.email}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(239, 68, 68, 0.03)', padding: '12px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Raporlanan</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <UserAvatar user={report.reportedUser} size="sm" />
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{report.reportedUser.name} {report.reportedUser.surname}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{report.reportedUser.email}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Resolve Modal */}
            {showResolveModal && (
                <div className="modal-overlay" onClick={() => setShowResolveModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <button className="modal-close" onClick={() => setShowResolveModal(null)}><X size={24} /></button>
                        <h2 style={{ marginBottom: '16px' }}>Raporu Kapat</h2>
                        <p className="text-secondary" style={{ marginBottom: '20px' }}>Raporu çözüldü olarak işaretlemeden önce bir not bırakabilirsiniz.</p>
                        
                        <textarea 
                            style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '12px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', marginBottom: '20px' }}
                            placeholder="Admin notu (Opsiyonel)..."
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                        />

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowResolveModal(null)}>İptal</button>
                            <button 
                                className="btn btn-primary" 
                                style={{ flex: 2 }} 
                                onClick={() => handleResolve(showResolveModal.id)}
                                disabled={resolvingId}
                            >
                                {resolvingId ? 'İşleniyor...' : 'Raporu Kapat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReportsPage;
