import React from 'react';
import { TrendingUp, Users, Target, Activity } from 'lucide-react';

const ClubAnalyticsTab = ({ analytics }) => {
    if (!analytics) {
        return (
            <div className="empty-state text-center py-5">
                <p className="text-secondary">Analitik verisi bulunamadı.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                <div className="card" style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: 'rgba(255, 107, 53, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-xs)' }}>
                        <Users size={20} color="var(--color-accent-primary)" />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{analytics.monthlyParticipation}</div>
                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>Aylık Katılım</div>
                </div>

                <div className="card" style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-xs)' }}>
                        <TrendingUp size={20} color="var(--color-success)" />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>%{analytics.engagementRate}</div>
                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>Etkileşim</div>
                </div>
            </div>

            <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                    <Target size={20} color="var(--color-info)" />
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>Popüler İlgi Alanları</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {(Array.isArray(analytics.topInterests) ? analytics.topInterests : []).slice(0, 5).map((interest, idx) => (
                        <div key={interest} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.9rem' }}>{idx + 1}. {interest}</span>
                            <div style={{ height: '6px', width: '100px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${100 - (idx * 15)}%`, background: 'var(--color-accent-primary)' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                    <Activity size={20} color="var(--color-warning)" />
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>Haftalık Aktivite</h3>
                </div>
                {/* Simplified Chart Placeholder */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', gap: '4px' }}>
                    {[40, 65, 30, 85, 50, 90, 60].map((h, i) => (
                        <div key={i} style={{ width: '100%', height: `${h}%`, background: 'var(--color-bg-tertiary)', borderRadius: '4px 4px 0 0' }}></div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xs)', fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                    <span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span>
                </div>
            </div>

        </div>
    );
};

export default ClubAnalyticsTab;
