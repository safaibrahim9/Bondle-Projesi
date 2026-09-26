import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, User, Calendar, X } from 'lucide-react';
import api from '../../services/api';

const AdminFeedbackPage = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            const data = await api.getAllGeneralFeedback();
            setFeedbacks(data);
        } catch (err) {
            console.error('Error fetching feedback:', err);
            setError('Geri bildirimler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="page"><div className="container">Yükleniyor...</div></div>;
    if (error) return <div className="page"><div className="container text-danger">{error}</div></div>;

    return (
        <div className="page">
            <div className="container">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Genel Geri Bildirimler</h1>
                        <p className="text-secondary">Kullanıcılardan gelen platform geri bildirimleri</p>
                    </div>
                    <div className="card" style={{ padding: 'var(--spacing-sm) var(--spacing-md)', background: 'var(--color-bg-tertiary)' }}>
                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600' }}>Toplam</div>
                        <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700' }}>{feedbacks.length}</div>
                    </div>
                </div>

                {feedbacks.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare size={48} className="text-secondary" />
                        <p>Henüz geri bildirim alınmadı.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                        {feedbacks.map((fb) => (
                            <div key={fb.id} className=" admin-list-item" style={{ padding: 'var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={20} className="text-secondary" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{fb.user?.name} {fb.user?.surname}</div>
                                            <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>{fb.user?.email}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star 
                                                    key={star} 
                                                    size={16} 
                                                    fill={star <= fb.rating ? '#fbbf24' : 'none'} 
                                                    color={star <= fb.rating ? '#fbbf24' : 'var(--color-border)'} 
                                                />
                                            ))}
                                        </div>
                                        <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                            <Calendar size={12} />
                                            {new Date(fb.createdAt).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ 
                                    background: 'var(--color-bg-tertiary)', 
                                    padding: 'var(--spacing-md)', 
                                    borderRadius: 'var(--radius-lg)',
                                    fontSize: 'var(--font-size-md)',
                                    lineHeight: '1.6'
                                }}>
                                    {fb.comment || <span className="text-secondary" style={{ fontStyle: 'italic' }}>Yorum bırakılmadı.</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFeedbackPage;
