import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';
import EventCard from '../../components/EventCard';
import CompetitionCard from '../../components/CompetitionCard';
import JoinCompetitionModal from '../../components/JoinCompetitionModal';
import { useAnalytics } from '../../hooks/useAnalytics';
import api from '../../services/api';
import './EventsPage.css';

const EventsPage = () => {
    const { user } = useAuth();
    const { events, loading: eventsLoading } = useEvents();
    const { logEvent } = useAnalytics();
    
    const [filter, setFilter] = useState('all');
    const [competitions, setCompetitions] = useState([]);
    const [competitionsLoading, setCompetitionsLoading] = useState(true);
    const [userSubmissions, setUserSubmissions] = useState([]);
    
    // Competition Modal State
    const [selectedCompetition, setSelectedCompetition] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const filterOptions = [
        { value: 'all', label: 'Tümü' },
        { value: 'Yarışma', label: 'Yarışma' },
        { value: 'Workshop', label: 'Workshop' },
        { value: 'Bootcamp', label: 'Bootcamp' },
        { value: 'Seminer', label: 'Seminer' },
        { value: 'Zirve & Konferans', label: 'Zirve & Konferans' },
        { value: 'Networking', label: 'Networking' },
        { value: 'Eğlence & Sosyal', label: 'Eğlence & Sosyal' },
        { value: 'Sosyal Sorumluluk', label: 'Sosyal Sorumluluk' },
    ];

    useEffect(() => {
        document.title = 'Bondle | Events';
        fetchCompetitions();
        fetchUserSubmissions();
    }, []);

    const fetchCompetitions = async () => {
        try {
            setCompetitionsLoading(true);
            const data = await api.getAllCompetitions();
            setCompetitions(data || []);
        } catch (err) {
            console.error('Failed to fetch competitions', err);
        } finally {
            setCompetitionsLoading(false);
        }
    };

    const fetchUserSubmissions = async () => {
        if (!user) return;
        try {
            const data = await api.getMyCompetitionSubmissions();
            setUserSubmissions(data || []);
        } catch (err) {
            console.error('Failed to fetch user submissions', err);
        }
    };

    const getSubmissionStatus = (competitionId) => {
        const submission = userSubmissions.find(s => s.competitionId === competitionId);
        return submission ? submission.status : null;
    };

    const isLoading = eventsLoading || competitionsLoading;

    const handleJoinClick = (competition) => {
        const status = getSubmissionStatus(competition.id);
        if (status) return;
        setSelectedCompetition(competition);
        setShowModal(true);
    };

    const handleSubmitCompetition = async (formData) => {
        if (!user) {
            alert('Lütfen giriş yapın');
            return;
        }
        try {
            await api.submitCompetition(selectedCompetition.id, formData);
            setSuccessMessage('Başvurunuz başarıyla gönderildi! Admin incelemesinden sonra bilgilendirileceksiniz.');
            setShowModal(false);
            setSelectedCompetition(null);
            fetchUserSubmissions();
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error('Error submitting join request:', error);
            if (error.message && error.message.includes('Already submitted')) {
                alert('Bu yarışmaya zaten başvurdunuz!');
            } else {
                alert('Bir hata oluştu: ' + (error.message || 'Lütfen tekrar deneyin.'));
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCompetition(null);
    };

    // Prepare Events based on topics mapping
    const getFilteredEvents = () => {
        if (filter === 'all') return events;

        const keywordMap = {
            'Yarışma': ['yarışma', 'competition', 'hackathon'],
            'Workshop': ['workshop', 'education', 'course', 'eğitim', 'ders', 'atölye'],
            'Bootcamp': ['bootcamp', 'kamp'],
            'Seminer': ['seminer', 'seminar', 'technology', 'ai', 'blockchain', 'web3', 'webinar', 'sunum'],
            'Zirve & Konferans': ['zirve', 'konferans', 'summit', 'conference', 'panel'],
            'Networking': ['networking', 'community', 'topluluk', 'meetup', 'tanışma', 'bondle', 'circle'],
            'Eğlence & Sosyal': ['eğlence & sosyal', 'film', 'quiz', 'eğlence', 'sosyal', 'oyun', 'sinema', 'fun', 'party'],
            'Sosyal Sorumluluk': ['sosyal sorumluluk', 'temizlik', 'gönüllü', 'yardım', 'doğa']
        };

        const keywords = keywordMap[filter] || [];

        return events.filter(e => {
            if (e.topics && e.topics.includes(filter)) return true;
            
            const searchString = `
                ${(e.title || '').toLowerCase()} 
                ${(e.description || '').toLowerCase()} 
                ${(e.category || '').toLowerCase()} 
                ${(e.type || '').toLowerCase()} 
                ${(e.topics || []).join(' ').toLowerCase()}
            `;
            return keywords.some(kw => searchString.includes(kw.toLowerCase()));
        });
    };

    const getFilteredCompetitions = () => {
        if (filter === 'all' || filter === 'Yarışma') return competitions;
        return [];
    };

    const filteredEvents = getFilteredEvents();
    const filteredCompetitions = getFilteredCompetitions();

    // Map all items to a common format for sorting
    const now = new Date();
    
    const mappedEvents = filteredEvents.map(e => ({ ...e, _itemType: 'event' }));
    const mappedCompetitions = filteredCompetitions.map(c => ({ 
        ...c, 
        _itemType: 'competition',
        date: c.deadline || c.date // Fallback for date sorting
    }));

    const allItems = [...mappedEvents, ...mappedCompetitions];

    // Upcoming
    const upcomingItems = allItems
        .filter(item => new Date(item.date) >= now)
        .sort((a, b) => {
            const aIsPriority = a._itemType === 'event' ? (!a.clubId || a.isGlobal) : false;
            const bIsPriority = b._itemType === 'event' ? (!b.clubId || b.isGlobal) : false;
            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;
            return new Date(a.date) - new Date(b.date);
        });

    // Past
    const pastItems = allItems
        .filter(item => new Date(item.date) < now)
        .sort((a, b) => {
            const aIsPriority = a._itemType === 'event' ? (!a.clubId || a.isGlobal) : false;
            const bIsPriority = b._itemType === 'event' ? (!b.clubId || b.isGlobal) : false;
            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;
            return new Date(b.date) - new Date(a.date);
        });

    const renderItem = (item) => {
        if (item._itemType === 'competition') {
            return (
                <CompetitionCard
                    key={`comp-${item.id}`}
                    competition={item}
                    onJoin={handleJoinClick}
                    submissionStatus={getSubmissionStatus(item.id)}
                />
            );
        } else {
            return (
                <EventCard
                    key={`event-${item.id}`}
                    event={item}
                    isPast={new Date(item.date) < now}
                />
            );
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header" style={{ marginBottom: 'var(--spacing-md)' }}>
                    <h1>Etkinlikler & Fırsatlar</h1>
                    <p className="text-secondary">Sana en uygun fırsatları, eğitimleri ve yarışmaları keşfet.</p>
                </div>

                {/* Filter Chips */}
                <div className="filter-chips-container hide-scrollbar" style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    overflowX: 'auto',
                    paddingBottom: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {filterOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => {
                                const newFilter = filter === option.value && option.value !== 'all' ? 'all' : option.value;
                                setFilter(newFilter);
                                logEvent(`events_filter_${newFilter}`, 'click', { category: option.label });
                            }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                background: filter === option.value ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                color: filter === option.value ? '#fff' : 'var(--color-text-primary)',
                                border: `1px solid ${filter === option.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: filter === option.value ? '600' : '500',
                                transition: 'all 0.2s ease',
                                boxShadow: filter === option.value ? '0 4px 12px rgba(139,92,246,0.2)' : 'none'
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {successMessage && (
                    <div className="success-message" style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '8px' }}>
                        {successMessage}
                    </div>
                )}

                {isLoading ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 'var(--spacing-lg)',
                    }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="event-card-skeleton" style={{
                                background: 'var(--color-card-bg)',
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                                border: '1px solid var(--color-card-border)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                animation: 'pulse 1.5s infinite ease-in-out'
                            }}>
                                <div style={{ width: '100%', height: '180px', background: 'var(--color-bg-tertiary)' }} />
                                <div style={{ padding: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <div style={{ width: '60px', height: '24px', background: 'var(--color-bg-tertiary)', borderRadius: '12px' }} />
                                        <div style={{ width: '80px', height: '24px', background: 'var(--color-bg-tertiary)', borderRadius: '12px' }} />
                                    </div>
                                    <div style={{ width: '80%', height: '20px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', marginBottom: '8px' }} />
                                    <div style={{ width: '60%', height: '20px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', marginBottom: '16px' }} />
                                    <div style={{ width: '40%', height: '16px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', marginBottom: '12px' }} />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ width: '30px', height: '30px', background: 'var(--color-bg-tertiary)', borderRadius: '50%' }} />
                                        <div style={{ width: '30px', height: '30px', background: 'var(--color-bg-tertiary)', borderRadius: '50%' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <style>{`
                            @keyframes pulse {
                                0% { opacity: 1; }
                                50% { opacity: 0.5; }
                                100% { opacity: 1; }
                            }
                        `}</style>
                    </div>
                ) : (
                    <>
                        {/* Upcoming Section */}
                        {upcomingItems.length > 0 && (
                            <section className="events-section" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                                <h2 className="section-title" style={{ 
                                    fontSize: 'var(--font-size-xl)', 
                                    marginBottom: 'var(--spacing-lg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)'
                                }}>
                                    Yaklaşan Fırsatlar
                                    <span className="count-badge" style={{ 
                                        fontSize: 'var(--font-size-xs)', 
                                        background: 'var(--color-bg-tertiary)', 
                                        padding: '2px 8px', 
                                        borderRadius: '10px' 
                                    }}>{upcomingItems.length}</span>
                                </h2>
                                <div className="events-list" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: 'var(--spacing-lg)',
                                }}>
                                    {upcomingItems.map(renderItem)}
                                </div>
                            </section>
                        )}
                        {/* Past Section */}
                        {pastItems.length > 0 && (
                            <section className="events-section">
                                <h2 className="section-title" style={{ 
                                    fontSize: 'var(--font-size-xl)', 
                                    marginBottom: 'var(--spacing-lg)',
                                    color: 'var(--color-text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)'
                                }}>
                                    Geçmiş Fırsatlar
                                    <span className="count-badge" style={{ 
                                        fontSize: 'var(--font-size-xs)', 
                                        background: 'var(--color-bg-tertiary)', 
                                        padding: '2px 8px', 
                                        borderRadius: '10px' 
                                    }}>{pastItems.length}</span>
                                </h2>
                                <div className="events-list" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: 'var(--spacing-lg)',
                                    opacity: 0.8
                                }}>
                                    {pastItems.map(renderItem)}
                                </div>
                            </section>
                        )}

                        {upcomingItems.length === 0 && pastItems.length === 0 && (
                            <div className="empty-state" style={{ 
                                textAlign: 'center', 
                                padding: '40px 20px', 
                                background: 'var(--color-card-bg)', 
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                                border: '1px solid var(--color-card-border)',
                                borderRadius: 'var(--radius-lg)' 
                            }}>
                                <p className="text-secondary">Bu filtreye uygun fırsat bulunamadı.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showModal && selectedCompetition && (
                <JoinCompetitionModal
                    competition={selectedCompetition}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitCompetition}
                />
            )}
        </div>
    );
};

export default EventsPage;
