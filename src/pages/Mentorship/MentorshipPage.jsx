import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import mentorshipService from '../../services/mentorshipService';
import {
    GraduationCap,
    Clock,
    CheckCircle,
    XCircle,
    CalendarDays,
    Send,
    Loader,
    Users,
    X
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import RequireAuthModal from '../../components/RequireAuthModal';
import Toast from '../../components/Toast';
import './MentorshipPage.css';

const MentorshipPage = () => {
    const { user } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastConfig, setToastConfig] = useState({ isOpen: false, message: '', type: 'success' });
    const [formData, setFormData] = useState({
        fullName: user?.name ? `${user.name} ${user.surname || ''}`.trim() : '',
        university: user?.university || '',
        department: user?.department || '',
        motivation: '',
        experience: '',
        phone: user?.phone || '',
        email: user?.email || '',
    });
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetailProgram, setSelectedDetailProgram] = useState(null);

    const handleShowDetails = (program) => {
        setSelectedDetailProgram(program);
        setShowDetailModal(true);
    };

    useEffect(() => {
        document.title = 'Bondle | Mentorship';
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const programsData = await mentorshipService.getPrograms().catch(e => {
                console.error('Error fetching programs:', e);
                return [];
            });
            setPrograms(programsData || []);

            if (user) {
                const applicationsData = await mentorshipService.getMyApplications().catch(e => {
                    console.error('Error fetching applications:', e);
                    return [];
                });
                setMyApplications(applicationsData || []);
            } else {
                setMyApplications([]);
            }
        } catch (error) {
            console.error('Error in mentorship fetchData:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (program) => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        setSelectedProgram(program);
        setFormData({ 
            fullName: user?.name ? `${user.name} ${user.surname || ''}`.trim() : '',
            university: user?.university || '',
            department: user?.department || '',
            motivation: '', 
            experience: '', 
            phone: user?.phone || '', 
            email: user?.email || '' 
        });
        setShowApplyModal(true);
    };

    const handleSubmitApplication = async () => {
        if (!formData.fullName?.trim()) {
            setToastConfig({ isOpen: true, message: 'Lütfen isim soyisim alanını doldurun.', type: 'error' });
            return;
        }
        if (!formData.motivation?.trim()) {
            setToastConfig({ isOpen: true, message: 'Lütfen motivasyon alanını doldurun.', type: 'error' });
            return;
        }
        try {
            setIsSubmitting(true);
            await mentorshipService.applyToProgram(selectedProgram.id, formData);
            setToastConfig({ isOpen: true, message: 'Başvurunuz başarıyla gönderildi!', type: 'success' });
            setShowApplyModal(false);
            fetchData();
        } catch (error) {
            setToastConfig({ isOpen: true, message: error.message || 'Başvuru gönderilemedi.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            upcoming: { label: 'Yaklaşan', color: '#3b82f6' },
            accepting: { label: 'Başvuru Açık', color: '#10b981' },
            in_review: { label: 'Değerlendirmede', color: '#f59e0b' },
            active: { label: 'Devam Ediyor', color: '#8b5cf6' },
            completed: { label: 'Tamamlandı', color: '#6b7280' },
        };
        const c = config[status] || config.upcoming;
        return (
            <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                fontWeight: '600', color: c.color, background: `${c.color}12`,
                border: `1px solid ${c.color}30`,
            }}>
                {c.label}
            </span>
        );
    };

    const getAppStatusBadge = (status) => {
        const config = {
            pending: { label: 'Beklemede', color: '#f59e0b', icon: Clock },
            accepted: { label: 'Kabul Edildi', color: '#10b981', icon: CheckCircle },
            rejected: { label: 'Reddedildi', color: '#ef4444', icon: XCircle },
        };
        const c = config[status] || config.pending;
        const Icon = c.icon;
        return (
            <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                fontWeight: '600', color: c.color, background: `${c.color}12`,
                display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}>
                <Icon size={13} /> {c.label}
            </span>
        );
    };

    const hasApplied = (programId) => myApplications.some(a => a.programId === programId);

    const getCountdown = (endDate) => {
        const diff = new Date(endDate) - new Date();
        if (diff <= 0) return null;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return days > 0 ? `${days}g ${hours}s kaldı` : `${hours}s kaldı`;
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <Loader size={32} className="spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <h1 className="mentorship-title" style={{ margin: 0, marginBottom: '4px' }}>Mentorluk Programı</h1>
                        <p className="mentorship-subtitle" style={{ margin: 0, fontSize: '14px' }}>Alanında uzman mentörlerden rehberlik al</p>
                    </div>

                    {/* Programs */}
                    {programs.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {programs.map((program) => {
                                const isAccepting = program.status === 'accepting';
                                const countdown = isAccepting ? getCountdown(program.applicationEndDate) : null;
                                const applied = hasApplied(program.id);

                                return (
                                    <div key={program.id} className="card mentorship-card">
                                        {/* Portrait Image - Left Side */}
                                        <div className="mentorship-card-img-wrapper">
                                            <img
                                                src={program.imageUrl || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=400&q=80'}
                                                alt={program.title}
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=400&q=80';
                                                }}
                                                style={{
                                                    width: '100%', height: '100%',
                                                    objectFit: 'cover', display: 'block',
                                                }}
                                            />
                                        </div>

                                        {/* Content - Right Side */}
                                        <div style={{
                                            flex: 1, padding: 'var(--spacing-lg)',
                                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                            minWidth: 0,
                                        }}>
                                            {/* Top */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                    <h3 className="mentorship-title" style={{ margin: 0, fontSize: '1.1rem' }}>{program.title}</h3>
                                                    {getStatusBadge(program.status)}
                                                </div>
                                                <p className="text-secondary" style={{
                                                    margin: 0, fontSize: '13px', lineHeight: 1.5,
                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden', marginBottom: 'var(--spacing-sm)',
                                                }}>
                                                    {program.description}
                                                </p>

                                                {/* Meta Info - Compact Row */}
                                                <div style={{
                                                    display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap',
                                                    fontSize: '12px', color: '#6b21a8',
                                                    marginBottom: 'var(--spacing-sm)',
                                                }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CalendarDays size={13} />
                                                        {format(new Date(program.applicationStartDate), 'd MMM', { locale: tr })} – {format(new Date(program.applicationEndDate), 'd MMM', { locale: tr })}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Users size={13} />
                                                        {program.maxParticipants} kişi
                                                    </span>
                                                </div>

                                                {/* Countdown */}
                                                {isAccepting && countdown && (
                                                    <div style={{
                                                        fontSize: '12px', color: '#10b981', fontWeight: '600',
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                        marginBottom: 'var(--spacing-sm)',
                                                    }}>
                                                        <Clock size={13} /> {countdown}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom Action */}
                                            <div>
                                                {isAccepting && (
                                                    <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={13} />
                                                        Son başvuru: {format(new Date(program.applicationEndDate), 'd MMMM yyyy', { locale: tr })}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <button
                                                        className="btn btn-sm mentorship-btn-secondary"
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)',
                                                            color: '#4c1d95',
                                                            fontWeight: '600',
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            padding: '8px 16px', borderRadius: 'var(--radius-md)',
                                                            cursor: 'pointer', fontSize: '13px',
                                                        }}
                                                        onClick={() => handleShowDetails(program)}
                                                    >
                                                        Detayları Gör
                                                    </button>
                                                    {isAccepting && !applied && (
                                                        <button
                                                            className="btn btn-sm mentorship-btn-secondary"
                                                            style={{
                                                                background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                                                                border: 'none', color: '#fff', fontWeight: '600',
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                padding: '8px 16px', borderRadius: 'var(--radius-md)',
                                                                cursor: 'pointer', fontSize: '13px',
                                                            }}
                                                            onClick={() => handleApply(program)}
                                                        >
                                                            <Send size={14} /> Başvur
                                                        </button>
                                                    )}
                                                    {applied && (
                                                        <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '500' }}>
                                                            ✅ Başvurdunuz
                                                        </span>
                                                    )}
                                                </div>
                                                {program.status === 'upcoming' && (
                                                    <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '500', marginTop: '8px', display: 'block' }}>
                                                        📅 {format(new Date(program.applicationStartDate), 'd MMMM yyyy', { locale: tr })} tarihinde açılacak
                                                    </span>
                                                )}
                                                {(program.status === 'in_review' || program.status === 'completed') && (
                                                    <span style={{ fontSize: '12px', color: '#6b21a8', marginTop: '8px', display: 'block' }}>
                                                        Başvuru dönemi kapandı
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="glass-card mentorship-modal-card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                            <GraduationCap size={48} color="var(--color-text-tertiary)" style={{ marginBottom: 'var(--spacing-md)' }} />
                            <h3>Henüz mentorluk programı yok</h3>
                            <p className="text-secondary">Yeni programlar açıldığında burada gösterilecek.</p>
                        </div>
                    )}

                    {/* My Applications */}
                    {myApplications.length > 0 && (
                        <div style={{ marginTop: 'var(--spacing-2xl)' }}>
                            <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.1rem' }}>Başvurularım</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {myApplications.map((app) => (
                                    <div key={app.id} className="glass-card mentorship-modal-card" style={{
                                        padding: 'var(--spacing-md) var(--spacing-lg)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '2px', fontSize: '14px' }}>
                                                {app.program?.title || 'Mentorluk Programı'}
                                            </div>
                                            <div className="text-secondary" style={{ fontSize: '11px' }}>
                                                {format(new Date(app.createdAt), 'd MMM yyyy', { locale: tr })}
                                            </div>
                                        </div>
                                        {getAppStatusBadge(app.status)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedDetailProgram && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: 'var(--spacing-lg)',
                }}>
                    <div className="glass-card mentorship-modal-card" style={{ padding: 0, maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div className="mentorship-modal-img-wrapper">
                            {/* Blurred Background */}
                            <img
                                src={selectedDetailProgram.imageUrl || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=400&q=80'}
                                alt=""
                                style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', objectFit: 'cover', filter: 'blur(20px)', opacity: 0.6, zIndex: 0 }}
                            />
                            {/* Main Image */}
                            <img
                                src={selectedDetailProgram.imageUrl || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=400&q=80'}
                                alt={selectedDetailProgram.title}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', position: 'relative', zIndex: 1 }}
                            />
                            <button
                                onClick={() => setShowDetailModal(false)}
                                style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: '#fff', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', zIndex: 2 }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: 'var(--spacing-xl)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                                <h2 style={{ margin: 0 }}>{selectedDetailProgram.title}</h2>
                                {getStatusBadge(selectedDetailProgram.status)}
                            </div>
                            
                            <div style={{
                                display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap',
                                fontSize: '13px', color: '#6b21a8',
                                marginBottom: 'var(--spacing-lg)',
                                padding: 'var(--spacing-md)', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)', borderRadius: 'var(--radius-md)'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CalendarDays size={16} />
                                    Başvuru: {format(new Date(selectedDetailProgram.applicationStartDate), 'd MMM', { locale: tr })} – {format(new Date(selectedDetailProgram.applicationEndDate), 'd MMM', { locale: tr })}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Users size={16} />
                                    {selectedDetailProgram.maxParticipants} Kontenjan
                                </span>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                                <h3 className="mentorship-title" style={{ fontSize: '16px', marginBottom: 'var(--spacing-sm)' }}>Program Hakkında</h3>
                                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#6b21a8', whiteSpace: 'pre-wrap', margin: 0 }}>
                                    {selectedDetailProgram.description}
                                </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-lg)' }}>
                                <button
                                    className="btn btn-secondary mentorship-btn-secondary"
                                    onClick={() => setShowDetailModal(false)}
                                    style={{ padding: '8px 24px', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)', color: '#4c1d95', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                >
                                    Kapat
                                </button>
                                {selectedDetailProgram.status === 'accepting' && !hasApplied(selectedDetailProgram.id) && (
                                    <button
                                        className="btn btn-primary mentorship-btn-primary"
                                        style={{
                                            background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                                            border: 'none', color: '#fff', fontWeight: '600',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 24px', borderRadius: 'var(--radius-md)', cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            handleApply(selectedDetailProgram);
                                        }}
                                    >
                                        <Send size={16} /> Başvur
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Apply Modal */}
            {showApplyModal && selectedProgram && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: 'var(--spacing-lg)',
                }}>
                    <div className="glass-card mentorship-modal-card" style={{ padding: 'var(--spacing-xl)', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h3 style={{ margin: 0 }}>Başvuru Formu</h3>
                            <button
                                onClick={() => setShowApplyModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b21a8' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-secondary" style={{ marginBottom: 'var(--spacing-lg)', fontSize: '14px' }}>
                            <strong>{selectedProgram.title}</strong> programına başvuruyorsunuz.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                    İsim Soyisim <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input type="text" placeholder="Adınız ve Soyadınız"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)', color: '#4c1d95', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                        Üniversite
                                    </label>
                                    <input type="text" placeholder="Üniversite adınız"
                                        value={formData.university}
                                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                        style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)', color: '#4c1d95', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                        Bölüm
                                    </label>
                                    <input type="text" placeholder="Bölümünüz"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)', color: '#4c1d95', fontSize: '14px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                    Motivasyon <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <textarea
                                    placeholder="Bu programdan beklentileriniz ve katılmak isteme nedenleriniz..."
                                    value={formData.motivation}
                                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                                    style={{
                                        width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)',
                                        background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)',
                                        color: '#4c1d95', minHeight: '120px', resize: 'vertical', fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Deneyim</label>
                                <textarea
                                    placeholder="İlgili deneyimleriniz, projeleriniz veya becerileriniz..."
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    style={{
                                        width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)',
                                        background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)',
                                        color: '#4c1d95', minHeight: '80px', resize: 'vertical', fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Telefon</label>
                                    <input type="tel" placeholder="05XX XXX XX XX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)', color: '#4c1d95', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>E-posta</label>
                                    <input type="email" placeholder="ornek@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(147, 51, 234, 0.2)', color: '#4c1d95', fontSize: '14px' }}
                                    />
                                </div>
                            </div>

                            <button
                                className="btn btn-primary mentorship-btn-primary"
                                style={{ width: '100%', marginTop: 'var(--spacing-sm)', background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', border: 'none' }}
                                onClick={handleSubmitApplication}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <RequireAuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                message="Mentorluk programına başvurmak için giriş yapmalısınız." 
            />

            {toastConfig.isOpen && (
                <Toast
                    message={toastConfig.message}
                    type={toastConfig.type}
                    onClose={() => setToastConfig({ ...toastConfig, isOpen: false })}
                />
            )}
        </div>
    );
};

export default MentorshipPage;
