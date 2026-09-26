import React from 'react';
import { useParams } from 'react-router-dom';
const getClubById = () => null; // Mock clubs removed
import { TrendingUp, Users, Target } from 'lucide-react';

const ClubAnalyticsDashboard = () => {
    const { id } = useParams();
    const club = getClubById(parseInt(id));

    if (!club || !club.analytics) {
        return <div className="page"><div className="container"><p>Analitik verisi bulunamadı</p></div></div>;
    }

    const { analytics } = club;

    return (
        <div className="page">
            <div className="container">
                <h1>{club.name} - Analitikler</h1>
                <p className="text-secondary" style={{ marginBottom: 'var(--spacing-xl)' }}>Premium kulüp analiz paneliniz</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 107, 53, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={24} color="var(--color-accent-primary)" />
                            </div>
                            <div>
                                <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Aylık Katılım</div>
                                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>{analytics.monthlyParticipation}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={24} color="var(--color-success)" />
                            </div>
                            <div>
                                <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Etkileşim Oranı</div>
                                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>{analytics.engagementRate}%</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                <Target size={20} color="var(--color-info)" />
                                <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Popüler İlgi Alanları</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                {analytics.topInterests.slice(0, 5).map((interest, idx) => (
                                    <div key={interest} style={{ fontSize: 'var(--font-size-sm)' }}>
                                        {idx + 1}. {interest}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubAnalyticsDashboard;
