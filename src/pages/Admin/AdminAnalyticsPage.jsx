import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    Clock, 
    TrendingUp, 
    Users, 
    BarChart3, 
    Loader2,
    Search,
    X,
    ChevronRight,
    MapPin,
    Zap,
    MousePointer2,
    Filter,
    Sparkles,
    ArrowDown,
    Download,
    Activity,
    Eye,
    Target,
    UserMinus,
    Calendar
} from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';
import './AdminAnalyticsPage.css';

const PAGE_NAMES = {
    '/': 'Ana Sayfa',
    '/community': 'Topluluk Akışı',
    '/events': 'Etkinlikler Listesi',
    '/network': 'Bondle Networking',
    '/network/history': 'Eşleşme Geçmişi',
    '/network/connections': 'Bağlantılarım',
    '/mentorship': 'Mentorluk Sayfası',
    '/clubs': 'Kulüpler Listesi',
    '/clubs/create': 'Kulüp Oluşturma',
    '/competitions': 'Yarışma & Eğitim',
    '/profile': 'Profilim',
    '/premium': 'Premium Üyelik',
    '/notifications': 'Bildirimler',
    '/leaderboard': 'Liderlik Tablosu',
    '/projects': 'Projeler',
    '/activities': 'Yaklaşan Etkinlikler',
    '/onboarding': 'Hoş Geldiniz Paneli'
};

const getPageDisplayName = (path) => {
    if (PAGE_NAMES[path]) return PAGE_NAMES[path];
    if (path?.startsWith('/events/')) return 'Etkinlik Detay Sayfası';
    if (path?.startsWith('/clubs/')) return 'Kulüp Detay Sayfası';
    if (path?.startsWith('/meeting/')) return 'Görüşme Odası';
    return path || '-';
};

const AdminAnalyticsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [period, setPeriod] = useState('all');
    
    const [selectedUserList, setSelectedUserList] = useState(null);
    const [userListTitle, setUserListTitle] = useState("");
    const [userListSubTitle, setUserListSubTitle] = useState("");

    const [selectedUser, setSelectedUser] = useState(null);
    const [userSummary, setUserSummary] = useState(null);
    const [loadingUser, setLoadingUser] = useState(false);

    const [selectedPage, setSelectedPage] = useState(null);
    const [pageUsers, setPageUsers] = useState(null);
    const [loadingPage, setLoadingPage] = useState(false);

    const [activeTab, setActiveTab] = useState('overview');
    const [aiInsights, setAiInsights] = useState('');
    const [loadingAI, setLoadingAI] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchAiInsights();
    }, [period]);

    const fetchAiInsights = async () => {
        try {
            setLoadingAI(true);
            const data = await api.getAdminAIInsights(period);
            setAiInsights(data.insights);
        } catch (err) {
            console.error('Failed to fetch AI insights:', err);
            setAiInsights('AI analizi şu an kullanılamıyor.');
        } finally {
            setLoadingAI(false);
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await api.getAdminAnalytics(period);
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetail = async (user) => {
        try {
            setSelectedUser(user);
            setLoadingUser(true);
            const data = await api.getUserAdminAnalytics(user.userId, period);
            setUserSummary(data);
        } catch (err) {
            console.error('Failed to fetch user detail:', err);
        } finally {
            setLoadingUser(false);
        }
    };

    const fetchPageDetail = async (pageData) => {
        try {
            setSelectedPage(pageData);
            setLoadingPage(true);
            const data = await api.getPageAdminAnalytics(pageData.page, period);
            setPageUsers(data);
        } catch (err) {
            console.error('Failed to fetch page detail:', err);
        } finally {
            setLoadingPage(false);
        }
    };

    const formatDuration = (seconds) => {
        const s = Number(seconds) || 0;
        if (s < 60) return `${s}sn`;
        if (s < 3600) return `${Math.floor(s / 60)}dk`;
        const hours = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        return `${hours}sa ${mins}dk`;
    };

    const exportCSV = () => {
        if (!stats?.userStats?.length) return;
        const rows = [
            ['Kullanıcı', 'Toplam Süre (sn)', 'Ziyaret Edilen Sayfa Sayısı'],
            ...stats.userStats.map(u => [
                `${u.userName} ${u.userSurname}`,
                u.totalDuration,
                u.uniquePages
            ])
        ];
        const csvContent = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="admin-analytics-loading">
                <Loader2 className="animate-spin" size={48} />
                <p>Analiz verileri yükleniyor...</p>
            </div>
        );
    }

    const filteredUsers = stats?.userStats?.filter(u => 
        u.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.userSurname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const publicPageStats = stats?.pageStats?.filter(p => !p.page?.startsWith('/admin'));
    const totalVisits = publicPageStats?.reduce((acc, p) => acc + (Number(p.visitCount) || 0), 0) || 0;
    const avgSessionSec = stats?.retention?.activeUsers > 0
        ? Math.round((stats?.totalDuration || 0) / stats.retention.activeUsers)
        : 0;

    return (
        <div className="admin-analytics-page page-container">
            <header className="analytics-header">
                <div>
                    <h1>Uygulama Kullanım Analizi</h1>
                    <div className="period-selector">
                        {[
                            { key: 'daily', label: 'Günlük' },
                            { key: 'weekly', label: 'Haftalık' },
                            { key: 'monthly', label: 'Aylık' },
                            { key: 'all', label: 'Tümü' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                className={period === key ? 'active' : ''}
                                onClick={() => setPeriod(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="header-actions">
                    <button className="export-btn" onClick={exportCSV} title="CSV olarak indir">
                        <Download size={16} /> CSV
                    </button>
                    <button className="refresh-btn" onClick={() => { fetchStats(); fetchAiInsights(); }}>
                        Yenile
                    </button>
                </div>
            </header>

            <div className="analytics-tabs">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    <BarChart3 size={18} /> Genel Bakış
                </button>
                <button className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`} onClick={() => setActiveTab('daily')}>
                    <Calendar size={18} /> Günlük Kullanım
                </button>
                <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
                    <Zap size={18} /> Etkinlikler & Funnel
                </button>
                <button className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
                    <Search size={18} /> Arama Analizi
                </button>
                <button className={`tab-btn ${activeTab === 'cohort' ? 'active' : ''}`} onClick={() => setActiveTab('cohort')}>
                    <Target size={18} /> Kohort Analizi
                </button>
            </div>

            {activeTab === 'daily' && (
                <div className="analytics-card main-card">
                    <div className="card-header">
                        <h2>Günlük Kullanım Analizi</h2>
                        <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                            Gün gün aktif kullanıcı sayıları ve toplam geçirilen süreler
                        </span>
                    </div>
                    
                    <div className="cohort-table-wrapper">
                        <table className="cohort-table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Aktif Kullanıcı</th>
                                    <th>Toplam Süre</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.dailyUsage?.map((day, i) => (
                                    <tr 
                                        key={i} 
                                        className="clickable-cell"
                                        style={{ cursor: 'pointer' }}
                                        onClick={async () => {
                                            try {
                                                const data = await api.getDailyAdminAnalytics(day.date);
                                                // backend returns { userId, userName, userSurname, totalDuration }
                                                const mappedData = data.map(u => ({
                                                    id: u.userId,
                                                    name: u.userName,
                                                    surname: u.userSurname,
                                                    email: u.totalDuration ? formatDuration(parseInt(u.totalDuration)) + ' süre geçirdi' : ''
                                                }));
                                                setSelectedUserList(mappedData);
                                                setUserListTitle(`${new Date(day.date).toLocaleDateString('tr-TR')} Tarihli Kullanım`);
                                                setUserListSubTitle(`O gün aktif olan toplam ${mappedData.length} kullanıcı`);
                                            } catch (err) {
                                                console.error(err);
                                                alert("Kullanıcılar yüklenemedi.");
                                            }
                                        }}
                                    >
                                        <td className="cohort-date">{new Date(day.date).toLocaleDateString('tr-TR')}</td>
                                        <td className="cohort-cell">{day.activeUsers} Kişi</td>
                                        <td className="cohort-cell">{formatDuration(parseInt(day.totalDuration))}</td>
                                    </tr>
                                ))}
                                {!stats?.dailyUsage?.length && (
                                    <tr>
                                        <td colSpan="3" style={{ padding: '20px', color: 'var(--color-text-tertiary)' }}>Veri bulunamadı</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'overview' && (
                <>
                    {/* AI Insights */}
                    <div className="analytics-card ai-insight-card">
                        <div className="card-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Sparkles size={20} color="var(--color-primary)" />
                                AI Kullanım Analizi
                            </h2>
                            {loadingAI && <Loader2 className="animate-spin" size={16} />}
                        </div>
                        <div className="ai-content">
                            {aiInsights ? (
                                <div className="markdown-content">
                                    {aiInsights.split('\n').filter(l => l.trim()).map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-secondary">Analiz hazırlanıyor...</p>
                            )}
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="analytics-overview-grid">
                        <div className="analytics-card stat-card">
                            <div className="stat-icon-wrapper blue"><Clock size={24} /></div>
                            <div className="stat-content">
                                <h3>Toplam Süre</h3>
                                <p className="stat-value">{formatDuration(stats?.totalDuration || 0)}</p>
                            </div>
                        </div>
                        <div className="analytics-card stat-card">
                            <div className="stat-icon-wrapper purple"><Users size={24} /></div>
                            <div className="stat-content">
                                <h3>Aktif Kullanıcı</h3>
                                <p className="stat-value">{stats?.retention?.activeUsers || 0}</p>
                            </div>
                        </div>
                        <div className="analytics-card stat-card">
                            <div className="stat-icon-wrapper green"><Eye size={24} /></div>
                            <div className="stat-content">
                                <h3>Sayfa Ziyareti</h3>
                                <p className="stat-value">{totalVisits.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="analytics-card stat-card">
                            <div className="stat-icon-wrapper orange"><Activity size={24} /></div>
                            <div className="stat-content">
                                <h3>Ort. Oturum Süresi</h3>
                                <p className="stat-value">{formatDuration(avgSessionSec)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="analytics-main-grid">
                        {/* Page Stats */}
                        <div className="analytics-card main-card">
                            <div className="card-header">
                                <h2>Sayfa Kullanım Süreleri</h2>
                                <TrendingUp size={20} className="text-secondary" />
                            </div>
                            {publicPageStats?.length === 0 ? (
                                <div className="empty-state">
                                    <BarChart3 size={40} opacity={0.2} />
                                    <p>Bu dönemde henüz veri yok.</p>
                                </div>
                            ) : (
                                <div className="page-stats-list">
                                    {publicPageStats?.map((p, idx) => (
                                        <div key={idx} className="page-stat-item clickable" onClick={() => fetchPageDetail(p)}>
                                            <div className="page-info">
                                                <span className="page-rank">{idx + 1}</span>
                                                <span className="page-name">{getPageDisplayName(p.page)}</span>
                                            </div>
                                            <div className="page-metrics">
                                                <span className="page-visit-count">{Number(p.visitCount).toLocaleString()} ziyaret</span>
                                                <span className="page-duration">{formatDuration(parseInt(p.totalDuration))}</span>
                                            </div>
                                            <div className="page-progress-bg">
                                                <div className="page-progress-bar" style={{ width: `${Math.max(2, (p.totalDuration / (stats.totalDuration || 1)) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* User Stats */}
                        <div className="analytics-card main-card">
                            <div className="card-header">
                                <h2>Aktif Kullanıcılar</h2>
                                <div className="search-wrapper">
                                    <Search size={16} />
                                    <input type="text" placeholder="Kullanıcı ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            {filteredUsers?.length === 0 ? (
                                <div className="empty-state">
                                    <Users size={40} opacity={0.2} />
                                    <p>{searchTerm ? 'Kullanıcı bulunamadı.' : 'Bu dönemde aktif kullanıcı yok.'}</p>
                                </div>
                            ) : (
                                <div className="user-stats-list">
                                    {filteredUsers?.map((u) => (
                                        <div key={u.userId} className="user-stat-item clickable" onClick={() => fetchUserDetail(u)}>
                                            <UserAvatar user={{ name: u.userName, surname: u.userSurname }} size="sm" />
                                            <div className="user-info">
                                                <span className="user-name">{u.userName} {u.userSurname}</span>
                                                <span className="user-detail">{u.uniquePages} sayfa • {formatDuration(parseInt(u.totalDuration))}</span>
                                            </div>
                                            <div className="user-duration">
                                                <ChevronRight size={16} className="text-secondary" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'events' && (
                <div className="analytics-main-grid">
                    <div className="analytics-card main-card">
                        <div className="card-header">
                            <h2>Buton & Etkileşim Tıklamaları</h2>
                            <MousePointer2 size={20} />
                        </div>
                        {stats?.eventStats?.length === 0 ? (
                            <div className="empty-state">
                                <MousePointer2 size={40} opacity={0.2} />
                                <p>Bu dönemde tıklama verisi yok.</p>
                            </div>
                        ) : (
                            <div className="page-stats-list">
                                {stats?.eventStats?.map((ev, idx) => (
                                    <div key={idx} className="page-stat-item">
                                        <div className="page-info">
                                            <span className="page-rank">{idx + 1}</span>
                                            <span className="page-name">{ev.name}</span>
                                        </div>
                                        <div className="page-metrics">
                                            <span className="page-visit-count">{Number(ev.count).toLocaleString()} tıklama</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="analytics-card main-card">
                        <div className="card-header">
                            <h2>Kayıt Dönüşüm Hunisi</h2>
                            <Filter size={20} />
                        </div>
                        {stats?.funnels?.length === 0 ? (
                            <div className="empty-state">
                                <Filter size={40} opacity={0.2} />
                                <p>Funnel verisi bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="funnel-container">
                                {stats?.funnels?.map((step, idx) => {
                                    const pct = Math.max(8, (step.count / (stats.funnels[0].count || 1)) * 100);
                                    const dropoff = idx > 0
                                        ? Math.round((1 - step.count / (stats.funnels[idx - 1].count || 1)) * 100)
                                        : null;
                                    return (
                                        <div key={idx} className="funnel-step-group">
                                            <div className="funnel-step">
                                                <div className="step-info">
                                                    <span className="step-label">{step.label}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {dropoff !== null && dropoff > 0 && (
                                                            <span className="step-dropoff">▼ %{dropoff} kayıp</span>
                                                        )}
                                                        <span className="step-count">{step.count} kişi</span>
                                                    </div>
                                                </div>
                                                <div className="step-visual">
                                                    <div className="step-bar" style={{ width: `${pct}%` }}></div>
                                                    {idx < stats.funnels.length - 1 && <ArrowDown size={14} className="funnel-arrow" />}
                                                </div>
                                            </div>
                                            <div className="step-users-preview">
                                                {step.users?.slice(0, 10).map(u => (
                                                    <div key={u.userId} className="user-tooltip-wrapper" title={`${u.userName} ${u.userSurname}`}>
                                                        <UserAvatar user={{ name: u.userName, surname: u.userSurname }} size="xs" />
                                                    </div>
                                                ))}
                                                {step.users?.length > 10 && <span className="more-users">+{step.users.length - 10}</span>}
                                                {(!step.users || step.users.length === 0) && (
                                                    <span style={{ fontSize: '11px', opacity: 0.4 }}>Henüz kullanıcı yok</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'search' && (
                <div className="analytics-card main-card full-width">
                    <div className="card-header">
                        <h2>En Çok Aranan Terimler</h2>
                        <Search size={20} />
                    </div>
                    {(!stats?.searchStats || stats.searchStats.length === 0) ? (
                        <div className="empty-state">
                            <Search size={40} opacity={0.2} />
                            <p>Bu dönemde arama verisi bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="search-stats-grid">
                            {stats.searchStats.map((s, idx) => (
                                <div key={idx} className="search-stat-chip">
                                    <span className="query">"{s.query}"</span>
                                    <span className="count">{s.count} kez</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="analytics-modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="analytics-modal" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <div className="modal-user-info">
                                <UserAvatar user={{ name: selectedUser.userName, surname: selectedUser.userSurname }} size="md" />
                                <div>
                                    <h2>{selectedUser.userName} {selectedUser.userSurname}</h2>
                                    <p>Detaylı Aktivite Analizi ({period === 'daily' ? 'Günlük' : period === 'weekly' ? 'Haftalık' : period === 'monthly' ? 'Aylık' : 'Tüm Zamanlar'})</p>
                                </div>
                            </div>
                            <button className="close-modal" onClick={() => setSelectedUser(null)}><X size={24} /></button>
                        </header>
                        <div className="modal-content">
                            {loadingUser ? (
                                <div className="modal-loading"><Loader2 className="animate-spin" size={32} /><p>Yükleniyor...</p></div>
                            ) : (
                                <>
                                    <div className="user-summary-grid">
                                        <div className="summary-item">
                                            <span className="label">Toplam Süre</span>
                                            <span className="value">{formatDuration(userSummary?.totalDuration || 0)}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="label">Ziyaret Edilen Sayfa</span>
                                            <span className="value">{userSummary?.pages?.length || 0}</span>
                                        </div>
                                    </div>
                                    <h3 className="section-title">Sayfa Bazlı Detaylar</h3>
                                    <div className="user-page-list">
                                        {userSummary?.pages?.map((p) => (
                                            <div key={p.page} className="user-page-item">
                                                <div className="page-label">
                                                    <MapPin size={16} className="text-accent" />
                                                    <span>{getPageDisplayName(p.page)}</span>
                                                </div>
                                                <div className="page-duration">{formatDuration(parseInt(p.duration))}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Page Detail Modal */}
            {selectedPage && (
                <div className="analytics-modal-overlay" onClick={() => setSelectedPage(null)}>
                    <div className="analytics-modal" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <div className="modal-user-info">
                                <div className="page-rank-large">{getPageDisplayName(selectedPage.page).charAt(0)}</div>
                                <div>
                                    <h2>{getPageDisplayName(selectedPage.page)}</h2>
                                    <p>Bu sayfada kim ne kadar vakit geçirdi?</p>
                                </div>
                            </div>
                            <button className="close-modal" onClick={() => setSelectedPage(null)}><X size={24} /></button>
                        </header>
                        <div className="modal-content">
                            {loadingPage ? (
                                <div className="modal-loading"><Loader2 className="animate-spin" size={32} /><p>Yükleniyor...</p></div>
                            ) : (
                                <>
                                    <div className="user-summary-grid">
                                        <div className="summary-item">
                                            <span className="label">Toplam Süre</span>
                                            <span className="value">{formatDuration(parseInt(selectedPage.totalDuration))}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="label">Toplam Ziyaret</span>
                                            <span className="value">{Number(selectedPage.visitCount).toLocaleString()} kez</span>
                                        </div>
                                    </div>
                                    <h3 className="section-title">Kullanıcı Bazlı Dağılım</h3>
                                    <div className="user-page-list">
                                        {pageUsers?.map((u) => (
                                            <div key={u.userId} className="user-page-item">
                                                <div className="page-label">
                                                    <UserAvatar user={{ name: u.userName, surname: u.userSurname }} size="xs" />
                                                    <span>{u.userName} {u.userSurname}</span>
                                                </div>
                                                <div className="page-duration" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                    <span>{formatDuration(parseInt(u.duration))}</span>
                                                    <span style={{ fontSize: '10px', opacity: 0.5 }}>{u.visitCount} ziyaret</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'cohort' && (
                <div className="analytics-cohort-section">
                    <div className="analytics-overview-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        <div className="analytics-card stat-card clickable-card" onClick={() => {
                            setSelectedUserList(stats?.dauMau?.users || []);
                            setUserListTitle("Bağlı (Aktif) Kullanıcılar");
                            setUserListSubTitle(`Son 30 günde giriş yapan ${stats?.dauMau?.users?.length || 0} kullanıcı`);
                        }}>
                            <div className="stat-icon-wrapper orange"><Target size={24} /></div>
                            <div className="stat-content">
                                <h3>Uygulama Bağlılığı (DAU/MAU)</h3>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                    <p className="stat-value">{stats?.dauMau?.ratio || 0}%</p>
                                    <span className="text-secondary" style={{ fontSize: '0.85rem', paddingBottom: '4px' }}>
                                        (DAU: {stats?.dauMau?.dau || 0} / MAU: {stats?.dauMau?.mau || 0})
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="analytics-card stat-card clickable-card" onClick={() => {
                            setSelectedUserList(stats?.churnRate?.users || []);
                            setUserListTitle("Terk Eden Kullanıcılar");
                            setUserListSubTitle(`Son 30 gündür aktif olmayan ${stats?.churnRate?.users?.length || 0} kullanıcı`);
                        }}>
                            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}>
                                <UserMinus size={24} />
                            </div>
                            <div className="stat-content">
                                <h3>Kullanıcı Terk Oranı (Churn)</h3>
                                <p className="stat-value">{stats?.churnRate?.rate || 0}%</p>
                                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Son 30 gün aktif olmayanlar</p>
                            </div>
                        </div>
                    </div>

                    <div className="analytics-card main-card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <h2>Kohort Analizi (Haftalık Elde Tutma)</h2>
                            <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                                Kullanıcıların kayıt olduktan sonraki haftalarda uygulamaya dönme oranları
                            </span>
                        </div>
                        <div className="cohort-table-wrapper">
                            <table className="cohort-table">
                                <thead>
                                    <tr>
                                        <th>Kayıt Haftası</th>
                                        <th>Kullanıcı Sayısı</th>
                                        <th>0. Hafta</th>
                                        <th>1. Hafta</th>
                                        <th>2. Hafta</th>
                                        <th>3. Hafta</th>
                                        <th>4. Hafta</th>
                                        <th>5. Hafta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(stats?.cohortRetention || []).length > 0 ? (
                                        stats.cohortRetention.map((cohortData, index) => (
                                            <tr key={index}>
                                                <td className="cohort-date">{cohortData.cohort}</td>
                                                <td className="cohort-total">{cohortData.totalUsers}</td>
                                                {cohortData.retentionRates.map((rate, rateIndex) => {
                                                    // rate.rate is the percentage, rate.users is the array
                                                    const opacity = Math.max(0.05, rate.rate / 100);
                                                    const bgColor = `rgba(99, 102, 241, ${opacity})`; 
                                                    const textColor = rate.rate > 40 ? '#fff' : 'var(--color-text-primary)';
                                                    
                                                    return (
                                                        <td 
                                                            key={rateIndex} 
                                                            className="cohort-cell clickable-cell"
                                                            style={{ backgroundColor: bgColor, color: textColor }}
                                                            title={`Hafta ${rateIndex}: %${rate.rate}`}
                                                            onClick={() => {
                                                                setSelectedUserList(rate.users || []);
                                                                setUserListTitle(`${cohortData.cohort} Kohortu`);
                                                                setUserListSubTitle(`Kayıt olduktan sonraki ${rateIndex}. haftada dönenler (${rate.users?.length || 0} kişi)`);
                                                            }}
                                                        >
                                                            {rate.rate}%
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                                                Yeterli kohort verisi bulunamadı.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* User List Modal */}
            {selectedUserList && (
                <div className="analytics-modal-overlay" onClick={() => setSelectedUserList(null)}>
                    <div className="analytics-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{userListTitle}</h2>
                                {userListSubTitle && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{userListSubTitle}</p>}
                            </div>
                            <button className="close-modal" onClick={() => setSelectedUserList(null)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-content">
                            {selectedUserList.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '20px' }}>Bu listede hiç kullanıcı yok.</p>
                            ) : (
                                <div className="user-page-list">
                                    {selectedUserList.map((u, i) => (
                                        <div key={i} className=" admin-list-item" style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-start' }}>
                                            <UserAvatar user={u} size="40px" />
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <h4 style={{ color: 'var(--color-text-primary)', fontSize: '1rem', fontWeight: 600, margin: 0 }}>{u.name} {u.surname}</h4>
                                                {u.stickinessRate !== undefined && (
                                                    <p style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, margin: '2px 0 0 0' }}>
                                                        Bağlılık Oranı: %{u.stickinessRate} <span style={{color: 'var(--color-text-tertiary)'}}>({u.activeDays} gün aktif, {u.inactiveDays} gün inaktif)</span>
                                                    </p>
                                                )}
                                                {u.email && (
                                                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', margin: '2px 0 0 0' }}>{u.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnalyticsPage;
