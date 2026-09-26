import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
    Code2, Users, Plus, Search, Github, Linkedin,
    Globe, CheckCircle2, XCircle, Send, X, Briefcase,
    Layers, BookOpen, Cpu, Gamepad2, BarChart3,
    Smartphone, AlertCircle, Trash2, Lock, ExternalLink,
} from 'lucide-react';
import './ProjectsPage.css';

import './ProjectsPage.css';
const CATEGORIES = [
    { id: 'all', label: 'Tümü', icon: Layers },
    { id: 'web', label: 'Web', icon: Globe },
    { id: 'mobile', label: 'Mobil', icon: Smartphone },
    { id: 'ai', label: 'Yapay Zeka', icon: Cpu },
    { id: 'data', label: 'Veri Bilimi', icon: BarChart3 },
    { id: 'game', label: 'Oyun', icon: Gamepad2 },
    { id: 'other', label: 'Diğer', icon: BookOpen },
];

const SKILL_SUGGESTIONS = [
    'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Django', 'FastAPI',
    'Flutter', 'React Native', 'Swift', 'Kotlin', 'Java', 'Spring Boot',
    'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'AWS', 'TensorFlow',
    'PyTorch', 'Unity', 'Unreal Engine', 'Figma', 'UI/UX', 'TypeScript',
    'Go', 'Rust', 'C++', 'Next.js', 'NestJS', 'GraphQL'
];

const INITIAL_FORM = {
    title: '', description: '', category: 'web',
    requiredSkills: [], maxMembers: 4,
    githubUrl: '', linkedinUrl: '', projectUrl: ''
};

const ProjectsPage = () => {
    const { user, isPremium } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [skillSearch, setSkillSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [skillInput, setSkillInput] = useState('');
    const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'mine' | 'applications'
    const [myProjects, setMyProjects] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const INITIAL_APPLY_FORM = {
        nameSurname: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        motivation: ''
    };
    const [selectedProject, setSelectedProject] = useState(null);
    const [applyForm, setApplyForm] = useState(INITIAL_APPLY_FORM);
    const [applyLoading, setApplyLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotif = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const data = await api.getProjects(
                activeCategory !== 'all' ? activeCategory : null,
                skillSearch || null
            );
            setProjects(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyData = async () => {
        try {
            const [mine, apps] = await Promise.all([api.getMyProjects(), api.getMyProjectApplications()]);
            setMyProjects(Array.isArray(mine) ? mine : []);
            setMyApplications(Array.isArray(apps) ? apps : []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        document.title = 'Bondle | Projects';
        fetchProjects();
    }, [activeCategory, skillSearch]);

    useEffect(() => {
        if (activeTab !== 'browse') fetchMyData();
    }, [activeTab]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.createProject(formData);
            setShowForm(false);
            setFormData(INITIAL_FORM);
            showNotif('Proje başarıyla oluşturuldu! 🚀');
            fetchProjects();
            fetchMyData();
        } catch (err) {
            showNotif(err.message || 'Bir hata oluştu.', 'error');
        }
    };

    const handleApply = async (projectId) => {
        setApplyLoading(true);
        try {
            await api.applyToProject(projectId, applyForm);
            showNotif('Başvurunuz gönderildi! ✅');
            setSelectedProject(null);
            setApplyForm(INITIAL_APPLY_FORM);
            fetchProjects();
        } catch (err) {
            showNotif(err.message || 'Başvuru gönderilemedi.', 'error');
        } finally {
            setApplyLoading(false);
        }
    };

    const handleRespond = async (appId, accept) => {
        try {
            if (accept) {
                await api.acceptProjectApplication(appId);
                showNotif('Başvuru kabul edildi! 🎉');
            } else {
                await api.rejectProjectApplication(appId);
                showNotif('Başvuru reddedildi.');
            }
            fetchMyData();
        } catch (err) {
            showNotif(err.message || 'İşlem başarısız.', 'error');
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
        try {
            await api.deleteProject(id);
            showNotif('Proje silindi.');
            fetchMyData();
            fetchProjects();
        } catch (err) {
            showNotif(err.message || 'Silinemedi.', 'error');
        }
    };

    const addSkill = (skill) => {
        const trimmed = skill.trim();
        if (trimmed && !formData.requiredSkills.includes(trimmed)) {
            setFormData(f => ({ ...f, requiredSkills: [...f.requiredSkills, trimmed] }));
        }
        setSkillInput('');
    };

    const removeSkill = (skill) => {
        setFormData(f => ({ ...f, requiredSkills: f.requiredSkills.filter(s => s !== skill) }));
    };

    const getCategoryIcon = (cat) => {
        const found = CATEGORIES.find(c => c.id === cat);
        return found ? found.icon : Layers;
    };

    const getStatusBadge = (status) => {
        const map = {
            pending: { label: 'Bekliyor', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            accepted: { label: 'Kabul Edildi', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            rejected: { label: 'Reddedildi', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        };
        return map[status] || map.pending;
    };

    // ── Premium Gate ──────────────────────────────────────────────────────────
    if (!isPremium()) {
        return (
            <div className="page projects-page">
                <div className="container">
                    <div className="premium-gate">
                        <div className="premium-gate-glow" />
                        <div className="premium-gate-icon">
                            <Lock size={40} color="#fbbf24" />
                        </div>
                        <div className="premium-gate-badge">⭐ PREMIUM ÖZELLİK</div>
                        <h1 className="premium-gate-title">
                            Proje Ortağı Bulma
                        </h1>
                        <p className="premium-gate-desc">
                            Takım kur, proje ilanı oluştur, GitHub ve LinkedIn profillerini paylaş.
                            Bu özelliğe erişmek için <strong>Premium üyelik</strong> gereklidir.
                        </p>

                        <div className="premium-gate-perks">
                            <div className="perk-item">🚀 Sınırsız proje ilanı</div>
                            <div className="perk-item">👥 Takım başvuruları al</div>
                            <div className="perk-item">🔗 GitHub & LinkedIn entegrasyonu</div>
                            <div className="perk-item">🎯 Teknoloji bazlı eşleşme</div>
                        </div>

                        <button
                            onClick={() => navigate('/premium')}
                            className="shopier-btn"
                        >
                            <ExternalLink size={20} />
                            Premium'u Keşfet
                        </button>

                        <button
                            className="back-btn"
                            style={{ display: 'block', margin: '16px auto 0', color: '#94a3b8', width: '100%', textAlign: 'center' }}
                            onClick={() => navigate('/')}
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="page projects-page">
            <div className="container">
                {/* Header */}
                <div className="projects-header">
                    <div className="projects-header-text">
                        <div className="projects-badge">PROJE ORTAĞI BUL</div>
                        <h1>Hayal Ettiğin Projeyi <span className="gradient-text">Birlikte Yap</span></h1>
                        <p>Takım arkadaşı ara, proje oluştur, hayallerini gerçeğe dönüştür.</p>
                    </div>
                    <button className="create-project-btn" onClick={() => setShowForm(true)}>
                        <Plus size={20} /> Proje Oluştur
                    </button>
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`notif-bar ${notification.type}`}>
                        {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {notification.msg}
                    </div>
                )}

                {/* Tabs */}
                <div className="projects-tabs">
                    {[
                        { id: 'browse', label: 'İlanları Keşfet' },
                        { id: 'mine', label: 'Projelerim' },
                        { id: 'applications', label: 'Başvurularım' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`projects-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Browse Tab */}
                {activeTab === 'browse' && (
                    <>
                        {/* Filters */}
                        <div className="projects-filters">
                            <div className="category-filters">
                                {CATEGORIES.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        className={`cat-btn ${activeCategory === id ? 'active' : ''}`}
                                        onClick={() => setActiveCategory(activeCategory === id && id !== 'all' ? 'all' : id)}
                                    >
                                        <Icon size={15} /> {label}
                                    </button>
                                ))}
                            </div>
                            <div className="skill-search">
                                <Search size={16} />
                                <input
                                    placeholder="Teknoloji ara (React, Python...)"
                                    value={skillSearch}
                                    onChange={e => setSkillSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Project Cards */}
                        {loading ? (
                            <div className="projects-loading"><div className="spinner" /></div>
                        ) : projects.length === 0 ? (
                            <div className="projects-empty">
                                <Code2 size={48} opacity={0.3} />
                                <p>Henüz ilan yok. İlk ilanı sen oluştur!</p>
                            </div>
                        ) : (
                            <div className="projects-grid">
                                {projects.map(project => {
                                    const CatIcon = getCategoryIcon(project.category);
                                    return (
                                        <div key={project.id} className="project-card" onClick={() => setSelectedProject(project)}>
                                            <div className="project-card-header">
                                                <div className="project-cat-icon">
                                                    <CatIcon size={20} />
                                                </div>
                                                <div className="project-meta">
                                                    <span className="project-cat-label">{CATEGORIES.find(c => c.id === project.category)?.label || project.category}</span>
                                                    <div className="member-count">
                                                        <Users size={13} />
                                                        {project.currentMembers}/{project.maxMembers} üye
                                                    </div>
                                                </div>
                                            </div>

                                            <h3 className="project-title">{project.title}</h3>
                                            <p className="project-desc">{project.description}</p>

                                            <div className="project-skills">
                                                {(project.requiredSkills || []).slice(0, 4).map(skill => (
                                                    <span key={skill} className="skill-tag">{skill}</span>
                                                ))}
                                                {(project.requiredSkills || []).length > 4 && (
                                                    <span className="skill-tag-more">+{project.requiredSkills.length - 4}</span>
                                                )}
                                            </div>

                                            <div className="project-footer">
                                                <div className="project-creator">
                                                    <div className="creator-avatar">
                                                        {project.creator?.profilePicture
                                                            ? <img src={project.creator.profilePicture} alt="" />
                                                            : <span>{project.creator?.name?.charAt(0)}</span>
                                                        }
                                                    </div>
                                                    <span>{project.creator?.name} {project.creator?.surname?.charAt(0)}.</span>
                                                </div>
                                                <div className="project-links">
                                                    {project.githubUrl && <Github size={16} color="#94a3b8" />}
                                                    {project.linkedinUrl && <Linkedin size={16} color="#94a3b8" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* My Projects Tab */}
                {activeTab === 'mine' && (
                    <div className="my-projects-list">
                        {myProjects.length === 0 ? (
                            <div className="projects-empty">
                                <Briefcase size={48} opacity={0.3} />
                                <p>Henüz bir proje oluşturmadın.</p>
                                <button className="create-project-btn small" onClick={() => setShowForm(true)}>
                                    <Plus size={16} /> Proje Oluştur
                                </button>
                            </div>
                        ) : (
                            myProjects.map(project => (
                                <div key={project.id} className="my-project-item">
                                    <div className="my-project-info">
                                        <h3>{project.title}</h3>
                                        <div className="my-project-meta">
                                            <span><Users size={13} /> {project.currentMembers}/{project.maxMembers} Üye</span>
                                            <span className={`status-badge ${project.status}`}>
                                                {project.status === 'open' ? 'Açık' : project.status === 'closed' ? 'Kapalı' : 'Tamamlandı'}
                                            </span>
                                        </div>
                                        {project.applications?.length > 0 && (
                                            <div className="pending-applications">
                                                <strong>{project.applications.filter(a => a.status === 'pending').length} bekleyen başvuru</strong>
                                                <div className="application-list">
                                                    {project.applications.filter(a => a.status === 'pending').map(app => (
                                                        <div key={app.id} className="application-item">
                                                            <div className="applicant-info">
                                                                <div className="creator-avatar small">
                                                                    {app.user?.profilePicture
                                                                        ? <img src={app.user.profilePicture} alt="" />
                                                                        : <span>{app.user?.name?.charAt(0)}</span>
                                                                    }
                                                                </div>
                                                                <div style={{ width: '100%' }}>
                                                                    <div className="applicant-name">
                                                                        {app.nameSurname || `${app.user?.name} ${app.user?.surname}`}
                                                                    </div>
                                                                    
                                                                    <div className="applicant-links" style={{ display: 'flex', gap: '8px', marginTop: '4px', marginBottom: '8px' }}>
                                                                        {app.linkedinUrl && (
                                                                            <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                <Linkedin size={12} /> LinkedIn
                                                                            </a>
                                                                        )}
                                                                        {app.githubUrl && (
                                                                            <a href={app.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                <Github size={12} /> GitHub
                                                                            </a>
                                                                        )}
                                                                        {app.portfolioUrl && (
                                                                            <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                <Globe size={12} /> Portfolyo
                                                                            </a>
                                                                        )}
                                                                    </div>

                                                                    {app.motivation && <div className="applicant-msg" style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>"{app.motivation}"</div>}
                                                                </div>
                                                            </div>
                                                            <div className="application-actions">
                                                                <button className="accept-btn" onClick={() => handleRespond(app.id, true)}>
                                                                    <CheckCircle2 size={16} /> Kabul
                                                                </button>
                                                                <button className="reject-btn" onClick={() => handleRespond(app.id, false)}>
                                                                    <XCircle size={16} /> Reddet
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button className="delete-project-btn" onClick={() => handleDeleteProject(project.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* My Applications Tab */}
                {activeTab === 'applications' && (
                    <div className="my-applications-list">
                        {myApplications.length === 0 ? (
                            <div className="projects-empty">
                                <Send size={48} opacity={0.3} />
                                <p>Henüz hiçbir projeye başvurmadın.</p>
                            </div>
                        ) : (
                            myApplications.map(app => {
                                const badge = getStatusBadge(app.status);
                                return (
                                    <div key={app.id} className="my-application-item">
                                        <div className="application-project-info">
                                            <h3>{app.project?.title}</h3>
                                            <p>{app.project?.category}</p>
                                            {app.motivation && <p className="my-app-message">Motivasyonun: "{app.motivation}"</p>}
                                        </div>
                                        <span className="status-pill" style={{ color: badge.color, background: badge.bg }}>
                                            {badge.label}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Project Detail Modal */}
            {selectedProject && (
                <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
                    <div className="project-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedProject(null)}><X size={20} /></button>

                        <div className="modal-header">
                            <div className="modal-cat-icon">
                                {React.createElement(getCategoryIcon(selectedProject.category), { size: 22 })}
                            </div>
                            <div>
                                <h2>{selectedProject.title}</h2>
                                <div className="modal-meta">
                                    <span><Users size={14} /> {selectedProject.currentMembers}/{selectedProject.maxMembers} Üye</span>
                                </div>
                            </div>
                        </div>

                        <p className="modal-desc">{selectedProject.description}</p>

                        <div className="modal-skills">
                            <h4>Aranan Teknolojiler</h4>
                            <div className="skill-tags">
                                {(selectedProject.requiredSkills || []).map(s => (
                                    <span key={s} className="skill-tag large">{s}</span>
                                ))}
                            </div>
                        </div>

                        <div className="modal-creator">
                            <h4>Proje Sahibi</h4>
                            <div className="creator-row">
                                <div className="creator-avatar">
                                    {selectedProject.creator?.profilePicture
                                        ? <img src={selectedProject.creator.profilePicture} alt="" />
                                        : <span>{selectedProject.creator?.name?.charAt(0)}</span>
                                    }
                                </div>
                                <div>
                                    <div className="creator-name">{selectedProject.creator?.name} {selectedProject.creator?.surname}</div>
                                    {selectedProject.creator?.title && <div className="creator-title">{selectedProject.creator.title}</div>}
                                </div>
                                <div className="creator-ext-links">
                                    {selectedProject.githubUrl && (
                                        <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer" className="ext-link">
                                            <Github size={18} /> GitHub
                                        </a>
                                    )}
                                    {selectedProject.linkedinUrl && (
                                        <a href={selectedProject.linkedinUrl} target="_blank" rel="noopener noreferrer" className="ext-link linkedin">
                                            <Linkedin size={18} /> LinkedIn
                                        </a>
                                    )}
                                    {selectedProject.projectUrl && (
                                        <a href={selectedProject.projectUrl} target="_blank" rel="noopener noreferrer" className="ext-link web">
                                            <Globe size={18} /> Demo
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selectedProject.creatorId !== user?.id && (
                            <div className="apply-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <h4 style={{ marginBottom: '8px' }}>Projeye Başvur</h4>
                                
                                <input
                                    type="text"
                                    placeholder="Ad Soyad"
                                    value={applyForm.nameSurname}
                                    onChange={e => setApplyForm(f => ({ ...f, nameSurname: e.target.value }))}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'white' }}
                                />
                                
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        type="url"
                                        placeholder="LinkedIn URL"
                                        value={applyForm.linkedinUrl}
                                        onChange={e => setApplyForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'white' }}
                                    />
                                    <input
                                        type="url"
                                        placeholder="GitHub URL"
                                        value={applyForm.githubUrl}
                                        onChange={e => setApplyForm(f => ({ ...f, githubUrl: e.target.value }))}
                                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'white' }}
                                    />
                                </div>

                                <input
                                    type="url"
                                    placeholder="Geçmiş Projeler / Portfolyo URL (İsteğe Bağlı)"
                                    value={applyForm.portfolioUrl}
                                    onChange={e => setApplyForm(f => ({ ...f, portfolioUrl: e.target.value }))}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'white' }}
                                />

                                <textarea
                                    placeholder="Motivasyonun: Kendini kısaca tanıt, neden bu projeye katılmak istiyorsun?"
                                    value={applyForm.motivation}
                                    onChange={e => setApplyForm(f => ({ ...f, motivation: e.target.value }))}
                                    rows={3}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'white' }}
                                />

                                <button
                                    className="apply-btn"
                                    onClick={() => handleApply(selectedProject.id)}
                                    disabled={applyLoading || !applyForm.nameSurname || !applyForm.motivation}
                                    style={{ marginTop: '8px' }}
                                >
                                    {applyLoading ? 'Gönderiliyor...' : <><Send size={18} /> Başvuruyu Tamamla</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Project Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="create-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
                        <h2>Yeni Proje İlanı</h2>

                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label>Proje Adı *</label>
                                <input required placeholder="Örn: E-Ticaret Platformu" value={formData.title}
                                    onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} />
                            </div>

                            <div className="form-group">
                                <label>Açıklama *</label>
                                <textarea required rows={4} placeholder="Projen hakkında detaylı bilgi ver..."
                                    value={formData.description}
                                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Kategori</label>
                                    <select value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                                        {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Max Üye Sayısı</label>
                                    <input type="number" min={2} max={20} value={formData.maxMembers}
                                        onChange={e => setFormData(f => ({ ...f, maxMembers: +e.target.value }))} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Aranan Teknolojiler</label>
                                <div className="skill-input-row">
                                    <input
                                        placeholder="Teknoloji ekle ve Enter'a bas"
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                                        list="skill-suggestions"
                                    />
                                    <datalist id="skill-suggestions">
                                        {SKILL_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                                    </datalist>
                                    <button type="button" onClick={() => addSkill(skillInput)} className="add-skill-btn">Ekle</button>
                                </div>
                                <div className="added-skills">
                                    {formData.requiredSkills.map(s => (
                                        <span key={s} className="skill-tag removable">
                                            {s} <X size={12} onClick={() => removeSkill(s)} />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label><Github size={14} /> GitHub URL</label>
                                    <input placeholder="https://github.com/..." value={formData.githubUrl}
                                        onChange={e => setFormData(f => ({ ...f, githubUrl: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label><Linkedin size={14} /> LinkedIn URL</label>
                                    <input placeholder="https://linkedin.com/..." value={formData.linkedinUrl}
                                        onChange={e => setFormData(f => ({ ...f, linkedinUrl: e.target.value }))} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label><Globe size={14} /> Proje URL (Demo/Figma)</label>
                                <input placeholder="https://..." value={formData.projectUrl}
                                    onChange={e => setFormData(f => ({ ...f, projectUrl: e.target.value }))} />
                            </div>

                            <button type="submit" className="submit-project-btn">
                                <Plus size={18} /> İlan Oluştur
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;
