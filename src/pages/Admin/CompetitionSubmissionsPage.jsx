import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Eye, User } from 'lucide-react';

const CompetitionSubmissionsPage = () => {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchSubmissions();
        }
    }, [user]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const data = await api.getCompetitionSubmissions();
            setSubmissions(data);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="page">
                <div className="container">
                    <p>Bu sayfaya erişim yetkiniz yok.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Yarışma Başvuruları</h1>

                {loading ? (
                    <p>Yükleniyor...</p>
                ) : submissions.length === 0 ? (
                    <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                        <p className="text-secondary">Henüz başvuru yok</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {submissions.map(submission => (
                            <div key={submission.id} className=" admin-list-item" style={{ padding: 'var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                            <User size={20} color="var(--color-accent-primary)" />
                                            <h3 style={{ marginBottom: 0 }}>{submission.name} {submission.surname}</h3>
                                        </div>

                                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                            <strong>Yarışma:</strong> {submission.competition?.title || 'N/A'}
                                        </p>

                                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                            <strong>Email:</strong> {submission.user?.email || 'N/A'}
                                        </p>

                                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                            <strong>Başvuru Tarihi:</strong> {new Date(submission.createdAt).toLocaleDateString('tr-TR')}
                                        </p>

                                        {selectedSubmission === submission.id && (
                                            <div style={{
                                                marginTop: 'var(--spacing-md)',
                                                padding: 'var(--spacing-md)',
                                                background: 'var(--color-bg-tertiary)',
                                                borderRadius: 'var(--radius-md)'
                                            }}>
                                                <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Motivasyon:</h4>
                                                <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{submission.motivation}</p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setSelectedSubmission(selectedSubmission === submission.id ? null : submission.id)}
                                        style={{ marginLeft: 'var(--spacing-md)' }}
                                    >
                                        <Eye size={18} />
                                        {selectedSubmission === submission.id ? 'Gizle' : 'Görüntüle'}
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

export default CompetitionSubmissionsPage;
