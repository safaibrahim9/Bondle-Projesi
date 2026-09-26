import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Award } from 'lucide-react';
import api from '../../services/api';

const AdminAmbassadorsPage = () => {
    const navigate = useNavigate();
    const [branchRepsPerformance, setBranchRepsPerformance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const allUsers = await api.getAdminUsers();
            const reps = allUsers.filter(u => u.role === 'campus_ambassador');
            const repsPerf = await Promise.all(reps.map(async (rep) => {
                try {
                    const referralData = await api.getAmbassadorReferrals(rep.id);
                    return { 
                        ...rep, 
                        referralCount: referralData?.totalReferrals || 0,
                        referralsList: referralData?.referrals || []
                    };
                } catch(e) {
                    return { ...rep, referralCount: 0, referralsList: [] };
                }
            }));
            setBranchRepsPerformance(repsPerf.sort((a,b) => b.referralCount - a.referralCount));
        } catch (error) {
            console.error('Error fetching ambassadors:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: 'var(--spacing-xl) 0' }}>
            <button className="btn-back" onClick={() => navigate('/admin')} style={{ marginBottom: 'var(--spacing-md)' }}>
                <ChevronLeft size={20} />
                <span>Admin Paneli</span>
            </button>

            <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Award size={32} color="#ec4899" />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px' }}>Kampüs Elçileri Performansı</h1>
                        <p className="text-secondary" style={{ margin: 0 }}>Elçilerin getirdikleri kayıt sayıları ve detayları</p>
                    </div>
                </div>
            </div>

            <div className="admin-content">
                {loading ? (
                    <div className="loading-state">Yükleniyor...</div>
                ) : branchRepsPerformance.length === 0 ? (
                    <div className="empty-state">Kayıtlı kampüs temsilcisi bulunmuyor.</div>
                ) : (
                    <div className="card poster-card glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {branchRepsPerformance.map((rep, index) => (
                                <details key={rep.id} style={{
                                    borderBottom: index !== branchRepsPerformance.length - 1 ? '1px solid var(--color-subtle-border)' : 'none',
                                    background: 'var(--color-subtle-bg)'
                                }}>
                                    <summary style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--spacing-md) var(--spacing-xl)',
                                        cursor: 'pointer',
                                        listStyle: 'none'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {rep.name ? rep.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '15px' }}>{rep.name} {rep.surname}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{rep.branch || 'Şube belirtilmemiş'}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div>
                                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ec4899' }}>{rep.referralCount}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Kayıt / Referans</div>
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--color-accent-primary)', textDecoration: 'underline' }}>
                                                Detayları Gör
                                            </div>
                                        </div>
                                    </summary>
                                    <div style={{ padding: '0 var(--spacing-xl) var(--spacing-lg) var(--spacing-xl)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                        <h4 style={{ margin: '12px 0 8px 0', fontSize: '13px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Getirdiği Kullanıcılar</h4>
                                        {rep.referralsList && rep.referralsList.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {rep.referralsList.map(r => (
                                                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--color-bg-primary)', borderRadius: '8px', border: '1px solid var(--color-subtle-border)' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#6b7280' }}>
                                                            {r.name ? r.name.charAt(0).toUpperCase() : 'U'}
                                                        </div>
                                                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{r.name} {r.surname}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                                                            {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Henüz kimse bu temsilcinin referansıyla kayıt olmamış.</div>
                                        )}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAmbassadorsPage;
