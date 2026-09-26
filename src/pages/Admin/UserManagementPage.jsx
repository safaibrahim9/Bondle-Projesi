import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Ban, CheckCircle, Shield, AlertTriangle, Trash2, Users, X, Calendar } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../../components/UserAvatar';

const UserManagementPage = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [selectedTeamUser, setSelectedTeamUser] = useState(null);
    const [teamForm, setTeamForm] = useState({ team: '', branch: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getAdminUsers();
            setUsers(data || []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async (user) => {
        const action = user.isBanned ? 'erişim engelini kaldırmak' : 'erişim engeli getirmek';
        if (window.confirm(`${user.name} kullanıcısına ${action} istediğinize emin misiniz?`)) {
            try {
                if (user.isBanned) {
                    await api.unbanUser(user.id);
                } else {
                    await api.banUser(user.id);
                }
                fetchUsers();
            } catch (error) {
                console.error('Action failed', error);
                alert('İşlem başarısız oldu.');
            }
        }
    };

    const handleDeleteUser = async (user) => {
        if (window.confirm(`${user.name} kullanıcısını KALICI olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm ilişkili veriler silinir.`)) {
            try {
                await api.deleteUser(user.id);
                alert('Kullanıcı başarıyla silindi.');
                fetchUsers();
            } catch (error) {
                console.error('Delete failed', error);
                alert('Silme işlemi başarısız oldu.');
            }
        }
    };

    const handleOpenReport = async (user) => {
        setReportModalOpen(true);
        setReportData({ ambassador: user, referrals: [] });
        setLoadingReport(true);
        try {
            const data = await api.getAmbassadorReferrals(user.id);
            setReportData({ ambassador: user, referrals: data.referrals || [], total: data.totalReferrals });
        } catch (error) {
            alert('Rapor alınırken hata oluştu.');
        } finally {
            setLoadingReport(false);
        }
    };

    const handleOpenTeamModal = (user) => {
        setSelectedTeamUser(user);
        setTeamForm({ team: user.team || '', branch: user.branch || '', isBranchRepresentative: user.isBranchRepresentative || false, canCreateEvents: user.canCreateEvents || false });
        setTeamModalOpen(true);
    };

    const handleSaveTeam = async () => {
        try {
            await api.updateUserTeamBranch(selectedTeamUser.id, teamForm.team, teamForm.branch, teamForm.isBranchRepresentative, teamForm.canCreateEvents);
            alert('Ekip bilgileri güncellendi!');
            setTeamModalOpen(false);
            fetchUsers();
        } catch (e) {
            alert('Hata: ' + e.message);
        }
    };

    const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="page">
            <div className="container">
                <button
                    onClick={() => navigate('/admin')}
                    className="btn btn-ghost"
                    style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ArrowLeft size={20} />
                    Panele Dön
                </button>

                <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h1>Kullanıcı Yönetimi</h1>
                    <p className="text-secondary">Sistemdeki tüm kullanıcıları görüntüle ve yönet</p>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: 'var(--spacing-xl)' }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="İsim, soyisim veya e-posta ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input-modern"
                        style={{ paddingLeft: '48px' }}
                    />
                </div>

                <div className="card poster-card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>Yükleniyor...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            Kullanıcı bulunamadı.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {filteredUsers.map((user, index) => (
                                <div key={user.id} className=" admin-list-item" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-md)',
                                    borderBottom: index !== filteredUsers.length - 1 ? '1px solid var(--color-border)' : 'none',
                                    backgroundColor: user.isBanned ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-bg-secondary)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <UserAvatar user={user} size="md" />
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h4 style={{ margin: 0, fontSize: '16px' }}>
                                                    {user.name} {user.surname}
                                                </h4>
                                                {user.role === 'admin' && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        background: 'var(--color-accent-primary)',
                                                        color: 'var(--color-text-on-accent)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: 'bold'
                                                    }}>ADMIN</span>
                                                )}
                                                {user.role === 'campus_ambassador' && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        background: '#8b5cf6',
                                                        color: '#fff',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: 'bold'
                                                    }}>ELÇİ</span>
                                                )}
                                                {user.role === 'mentor' && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        background: '#ec4899',
                                                        color: '#fff',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: 'bold'
                                                    }}>MENTOR</span>
                                                )}
                                                {user.isBanned && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        background: '#ef4444',
                                                        color: 'var(--color-text-on-accent)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <AlertTriangle size={10} /> YASAKLI
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                                {user.email} • {user.city || 'Şehir Yok'}
                                            </div>
                                            {(user.team || user.branch || user.isBranchRepresentative || user.canCreateEvents) && (
                                                <div style={{ marginTop: '8px', fontSize: '13px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {user.branch && <span style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>🏢 {user.branch}</span>}
                                                    {user.team && <span style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>👥 {user.team}</span>}
                                                    {user.isBranchRepresentative && <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>{user.branch ? (user.branch.includes('Bondle') ? `${user.branch} - İl Temsilcisi` : `Bondle ${user.branch} - İl Temsilcisi`) : 'İl Temsilcisi'}</span>}
                                                    {user.canCreateEvents && <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px' }}>Etkinlik Yetkilisi</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {user.role !== 'admin' && (currentUser?.role === 'admin' || currentUser?.isBranchRepresentative) && (
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {currentUser?.role === 'admin' && user.role !== 'campus_ambassador' && user.role !== 'mentor' ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm(`${user.name} kullanıcısını Kampüs Elçisi yapmak istiyor musunuz?`)) {
                                                                try {
                                                                    await api.updateUserRole(user.id, 'campus_ambassador');
                                                                    alert('Kampüs Elçisi yapıldı!');
                                                                    fetchUsers();
                                                                } catch (e) { alert('Hata: ' + e.message); }
                                                            }
                                                        }}
                                                        className="btn btn-sm"
                                                        style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <Shield size={14} /> Elçi Yap
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm(`${user.name} kullanıcısını Mentor yapmak istiyor musunuz?`)) {
                                                                try {
                                                                    await api.updateUserRole(user.id, 'mentor');
                                                                    alert('Mentor yapıldı!');
                                                                    fetchUsers();
                                                                } catch (e) { alert('Hata: ' + e.message); }
                                                            }
                                                        }}
                                                        className="btn btn-sm"
                                                        style={{ backgroundColor: '#ec4899', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <Shield size={14} /> Mentor Yap
                                                    </button>
                                                </div>
                                            ) : currentUser?.role === 'admin' && user.role === 'campus_ambassador' ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleOpenReport(user)}
                                                        className="btn btn-sm"
                                                        style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <Users size={14} /> Elçi Raporu
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm(`${user.name} kullanıcısının Elçi statüsünü iptal etmek istiyor musunuz?`)) {
                                                                try {
                                                                    await api.updateUserRole(user.id, 'user');
                                                                    alert('Elçi statüsü iptal edildi!');
                                                                    fetchUsers();
                                                                } catch (e) { alert('Hata: ' + e.message); }
                                                            }
                                                        }}
                                                        className="btn btn-sm btn-outline"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        Elçiliği İptal Et
                                                    </button>
                                                </div>
                                            ) : currentUser?.role === 'admin' && user.role === 'mentor' ? (
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm(`${user.name} kullanıcısının Mentor statüsünü iptal etmek istiyor musunuz?`)) {
                                                            try {
                                                                await api.updateUserRole(user.id, 'user');
                                                                alert('Mentor statüsü iptal edildi!');
                                                                fetchUsers();
                                                            } catch (e) { alert('Hata: ' + e.message); }
                                                        }
                                                    }}
                                                    className="btn btn-sm btn-outline"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    Mentorluğu İptal Et
                                                </button>
                                            ) : null}

                                            {currentUser?.role === 'admin' && !user.isPremium ? (
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm(`${user.name} kullanıcısını Premium yapmak istiyor musunuz?`)) {
                                                            try {
                                                                await api.grantUserPremium(user.id);
                                                                alert('Premium yapıldı!');
                                                                fetchUsers();
                                                            } catch (e) { alert('Hata: ' + e.message); }
                                                        }
                                                    }}
                                                    className="btn btn-sm"
                                                    style={{ backgroundColor: '#fbbf24', color: '#000', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Shield size={14} /> Premium Yap
                                                </button>
                                            ) : currentUser?.role === 'admin' ? (
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm(`${user.name} kullanıcısının Premium statüsünü iptal etmek istiyor musunuz?`)) {
                                                            try {
                                                                await api.revokeUserPremium(user.id);
                                                                alert('Premium iptal edildi!');
                                                                fetchUsers();
                                                            } catch (e) { alert('Hata: ' + e.message); }
                                                        }
                                                    }}
                                                    className="btn btn-sm btn-outline"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    Premium İptal
                                                </button>
                                            ) : null}

                                            <button
                                                onClick={() => handleOpenTeamModal(user)}
                                                className="btn btn-sm"
                                                style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                                            >
                                                {currentUser?.role === 'admin' ? 'Ekip Ata' : 'Yetkileri Düzenle'}
                                            </button>

                                            {currentUser?.role === 'admin' && (
                                                <>
                                                    <button
                                                onClick={async () => {
                                                    const amount = window.prompt(`${user.name} kullanıcısına ne kadar kredi eklemek istiyorsunuz?`);
                                                    if (amount && !isNaN(parseInt(amount))) {
                                                        try {
                                                            await api.addUserCredits(user.id, parseInt(amount), 'Admin manuel ekleme');
                                                            alert(`${amount} kredi başarıyla eklendi!`);
                                                            fetchUsers();
                                                        } catch (e) { alert('Hata: ' + e.message); }
                                                    }
                                                }}
                                                className="btn btn-sm"
                                                style={{ backgroundColor: '#3b82f6', color: 'var(--color-text-on-accent)', border: 'none' }}
                                            >
                                                Kredi Ekle
                                            </button>

                                            <button
                                                onClick={() => handleBanUser(user)}
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: user.isBanned ? '#22c55e' : '#ef4444',
                                                    color: 'var(--color-text-on-accent)',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                }}
                                            >
                                                {user.isBanned ? (
                                                    <>
                                                        <CheckCircle size={14} /> Engeli Kaldır
                                                    </>
                                                ) : (
                                                    <>
                                                        <Ban size={14} /> Engelle
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => handleDeleteUser(user)}
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: '#dc2626',
                                                    color: 'var(--color-text-on-accent)',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                }}
                                                title="Hesabı Kalıcı Olarak Sil"
                                            >
                                                <Trash2 size={14} /> Sil
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {reportModalOpen && reportData && (
                <div className="modal-overlay">
                    <div className="modal-content poster-card glass-card" style={{ maxWidth: '500px', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(16px)' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={20} color="#8b5cf6" />
                                {reportData.ambassador.name} - Elçi Raporu
                            </h2>
                            <button className="btn-close" onClick={() => setReportModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {loadingReport ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>Yükleniyor...</div>
                            ) : (
                                <div>
                                    <div style={{ padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--color-subtle-border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Referansıyla Kayıt Olan Kişi Sayısı</div>
                                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-accent-primary)' }}>{reportData.total}</div>
                                    </div>
                                    
                                    <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>Kayıt Olan Kullanıcılar</h3>
                                    {reportData.referrals.length === 0 ? (
                                        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--color-bg-secondary)', borderRadius: '12px', color: 'var(--color-text-tertiary)' }}>
                                            Henüz kimseyi davet etmemiş.
                                        </div>
                                    ) : (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                                            {reportData.referrals.map(r => (
                                                <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--color-subtle-border)', borderRadius: '8px' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{r.name} {r.surname}</div>
                                                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Calendar size={12} /> {r.createdAt ? new Date(r.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {teamModalOpen && selectedTeamUser && (
                <div className="modal-overlay" onClick={() => setTeamModalOpen(false)}>
                    <div className="modal-content poster-card glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(16px)' }}>
                        <div className="modal-header">
                            <h2>Ekip ve Şube Ata</h2>
                            <button className="btn-icon" onClick={() => setTeamModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                                {selectedTeamUser.name} {selectedTeamUser.surname} için yetkileri düzenleyin.
                            </p>
                            {currentUser?.role === 'admin' && (
                                <div className="form-group">
                                <label>Şube (Örn: Bondle İstanbul, Bondle Kayseri)</label>
                                <select 
                                    className="form-input-modern"
                                    value={teamForm.branch}
                                    onChange={(e) => setTeamForm({ ...teamForm, branch: e.target.value })}
                                >
                                    <option value="">Şube Seçin...</option>
                                    <option value="Bondle Genel">Bondle Genel</option>
                                    <option value="Bondle İstanbul">Bondle İstanbul</option>
                                    <option value="Bondle Ankara">Bondle Ankara</option>
                                    <option value="Bondle İzmir">Bondle İzmir</option>
                                    <option value="Bondle Kayseri">Bondle Kayseri</option>
                                    <option value="Bondle Nevşehir">Bondle Nevşehir</option>
                                    <option value="Bondle Mardin">Bondle Mardin</option>
                                </select>
                            </div>
                            )}
                            <div className="form-group">
                                <label>Ekip</label>
                                <select 
                                    className="form-input-modern"
                                    value={teamForm.team}
                                    onChange={(e) => setTeamForm({ ...teamForm, team: e.target.value })}
                                >
                                    <option value="">Ekip Seçin...</option>
                                    <option value="İletişim ve Sponsorluk">İletişim ve Sponsorluk</option>
                                    <option value="Etkinlik Organizasyon">Etkinlik Organizasyon</option>
                                    <option value="Sosyal Medya">Sosyal Medya</option>
                                </select>
                            </div>
                            {currentUser?.role === 'admin' && (
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <input 
                                    type="checkbox" 
                                    id="isBranchRepresentative"
                                    checked={teamForm.isBranchRepresentative}
                                    onChange={(e) => setTeamForm({ ...teamForm, isBranchRepresentative: e.target.checked })}
                                />
                                <label htmlFor="isBranchRepresentative" style={{ margin: 0, cursor: 'pointer' }}>Bu kişiyi İl Temsilcisi (Şube Temsilcisi) yap</label>
                            </div>
                            )}
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <input 
                                    type="checkbox" 
                                    id="canCreateEvents"
                                    checked={teamForm.canCreateEvents}
                                    onChange={(e) => setTeamForm({ ...teamForm, canCreateEvents: e.target.checked })}
                                />
                                <label htmlFor="canCreateEvents" style={{ margin: 0, cursor: 'pointer' }}>Bu kişiye Etkinlik Ekleme yetkisi ver</label>
                            </div>
                            <button onClick={handleSaveTeam} className="btn btn-primary" style={{ marginTop: '8px' }}>
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
