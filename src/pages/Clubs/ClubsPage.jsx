import React, { useState, useEffect } from 'react';
import { getClubs } from '../../services/clubService';
import ClubCard from '../../components/ClubCard';
import api from '../../services/api';
import { Megaphone, Calendar, ChevronRight, Plus } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useNavigate } from 'react-router-dom';

const ClubsPage = () => {
    const [cityFilter, setCityFilter] = useState('all');
    const [clubs, setClubs] = useState([]);
    const [recentAnnouncements, setRecentAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { logEvent } = useAnalytics();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Bondle | Clubs';
        fetchClubs();
        fetchRecentAnnouncements();
    }, [cityFilter]);

    const fetchRecentAnnouncements = async () => {
        try {
            const data = await api.get('/announcements/clubs-recent');
            setRecentAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching recent announcements:', error);
        }
    };

    const fetchClubs = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getClubs(cityFilter);
            setClubs(data);
        } catch (err) {
            console.error('Error fetching clubs:', err);
            setError('Kulüpler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tümü');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const categories = [
        'Tümü', 'Bilim & Araştırma', 'Blockchain & Kripto', 'Çevre & Sürdürülebilirlik', 'Dans', 'E-Spor & Oyun',
        'Edebiyat', 'Ekonomi & Finans', 'Fotoğrafçılık', 'Gastronomi', 'Gezi & Doğa',
        'Girişimcilik', 'Gönüllülük', 'Hayvan Hakları', 'Hukuk', 'Kariyer & Gelişim',
        'Kültür', 'Liderlik', 'Mimarlık', 'Mühendislik', 'Münazara',
        'Müzik', 'Oyun Geliştirme', 'Pazarlama & İletişim', 'Psikoloji', 'Robotik',
        'Sanat & Tasarım', 'Satranç', 'Siber Güvenlik', 'Sinema & Tiyatro', 'Sosyal Sorumluluk',
        'Spor', 'Tıp & Sağlık', 'Veri Bilimi', 'Yabancı Dil', 'Yapay Zeka',
        'Yazılım & Teknoloji'
    ];

    // Debounced Search Tracking
    useEffect(() => {
        if (searchTerm.length < 3) return;
        const timer = setTimeout(() => {
            logEvent('search', 'search', { query: searchTerm, page: 'clubs' });
        }, 1500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredClubs = (clubs || []).filter(club => {
        const matchesCity = cityFilter === 'all' || club.city === cityFilter;
        const matchesSearch = club.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             club.description?.toLowerCase().includes(searchTerm.toLowerCase());
        // Handling category filter - ensuring club.categories is an array
        const matchesCategory = activeCategory === 'Tümü' || (Array.isArray(club.categories) && club.categories.includes(activeCategory));
        return matchesCity && matchesSearch && matchesCategory;
    });

    return (
        <div className="page clubs-page">
            <div className="container">
                <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <h1 className="mentorship-title" style={{ fontSize: '2.5rem', margin: 0 }}>
                            Kulüpler
                        </h1>
                        <p className="mentorship-subtitle" style={{ fontSize: '1.1rem', margin: '8px 0 0 0' }}>Seni ileriye taşıyacak kulübü keşfet ve katıl.</p>
                    </div>
                    <button 
                        className="btn btn-primary mentorship-btn-primary" 
                        onClick={() => navigate('/clubs/create')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-full)', fontWeight: '600' }}
                    >
                        <Plus size={20} />
                        Kulübünü Ekle
                    </button>
                </div>

                {/* Recent Club Activities Section */}
                {recentAnnouncements.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-xxl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Megaphone size={24} color="var(--color-accent-primary)" />
                                Kulüplerden Son Duyurular
                            </h2>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            gap: 'var(--spacing-lg)', 
                            overflowX: 'auto', 
                            paddingBottom: 'var(--spacing-md)',
                            marginLeft: '-4px',
                            paddingLeft: '4px'
                        }} className="hide-scrollbar">
                            {recentAnnouncements.map(ann => (
                                <div key={ann.id} className="glass-card" style={{ 
                                    minWidth: '280px', 
                                    maxWidth: '280px', 
                                    padding: 'var(--spacing-md)',
                                    display: 'flex', flexDirection: 'column',
                                    background: 'linear-gradient(150deg, #ffffff 0%, #f5f3ff 40%, #e9d5ff 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.9)',
                                    boxShadow: '0 15px 35px -5px rgba(109, 40, 217, 0.15)',
                                    borderRadius: '24px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => ann.clubId && (window.location.href = `/clubs/${ann.clubId}`)}
                                >
                                    <div style={{ position: 'relative', height: '120px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--spacing-md)' }}>
                                        <img src={ann.image} alt={ann.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '600', height: '40px', overflow: 'hidden' }}>{ann.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                        <span>{new Date(ann.createdAt).toLocaleDateString('tr-TR')}</span>
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search & Category Filter */}
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{ position: 'relative', marginBottom: 'var(--spacing-lg)' }}>
                        <input 
                            type="text" 
                            placeholder="Kulüplerde veya ilgi alanı ara..." 
                            className="form-control"
                            style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)', color: '#4c1d95', padding: '16px 20px', borderRadius: 'var(--radius-xl)', fontSize: '1rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Custom Dropdown for Categories */}
                    <div style={{ position: 'relative', marginBottom: 'var(--spacing-lg)' }}>
                        <div 
                            className="form-control"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{ 
                                width: '100%', 
                                background: 'rgba(255, 255, 255, 0.8)', 
                                border: '1px solid rgba(147, 51, 234, 0.3)', 
                                color: '#4c1d95', 
                                padding: '14px 20px', 
                                borderRadius: 'var(--radius-xl)', 
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxShadow: '0 4px 12px rgba(147, 51, 234, 0.1)'
                            }}
                        >
                            <span>{activeCategory}</span>
                            <span style={{ fontSize: '12px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                        </div>
                        
                        {isDropdownOpen && (
                            <div 
                                className="custom-scroll"
                                style={{ 
                                    position: 'absolute', 
                                    top: '100%', 
                                    left: 0, 
                                    right: 0, 
                                    marginTop: '8px',
                                    background: '#fff',
                                    border: '1px solid rgba(147, 51, 234, 0.2)',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 25px rgba(147, 51, 234, 0.15)',
                                    maxHeight: '250px',
                                    overflowY: 'auto',
                                    zIndex: 100,
                                    padding: '8px'
                                }}
                            >
                                {categories.map(cat => (
                                    <div 
                                        key={cat}
                                        onClick={() => {
                                            setActiveCategory(cat);
                                            setIsDropdownOpen(false);
                                            logEvent(`club_filter_${cat}`, 'click', { category: cat });
                                        }}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            borderRadius: '8px',
                                            fontWeight: activeCategory === cat ? '700' : '500',
                                            color: activeCategory === cat ? '#fff' : '#4c1d95',
                                            background: activeCategory === cat ? '#9333ea' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (activeCategory !== cat) e.currentTarget.style.background = 'rgba(147, 51, 234, 0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (activeCategory !== cat) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        {cat}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: 'var(--spacing-lg)',
                        background: 'var(--color-error-bg)',
                        color: 'var(--color-error)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--spacing-lg)'
                    }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl) 0' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
                        <p className="mentorship-subtitle">Kulüpler keşfediliyor...</p>
                    </div>
                ) : filteredClubs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl) 0' }}>
                        <h3 className="mentorship-title">Kulüp Bulunamadı</h3>
                        <p className="mentorship-subtitle">Filtreleri değiştirmeyi veya farklı bir anahtar kelime kullanmayı dene.</p>
                        <button 
                            className="btn btn-outline mentorship-btn-secondary" 
                            onClick={() => { setSearchTerm(''); setActiveCategory('Tümü'); setCityFilter('all'); }}
                            style={{ marginTop: 'var(--spacing-md)', borderRadius: 'var(--radius-full)' }}
                        >
                            Filtreleri Temizle
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
                        {filteredClubs.map((club) => (
                            <ClubCard key={club.id} club={club} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubsPage;
