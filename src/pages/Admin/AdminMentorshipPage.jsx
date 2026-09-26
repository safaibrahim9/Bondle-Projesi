import React, { useState, useEffect, useRef } from 'react';
import mentorshipService from '../../services/mentorshipService';
import api from '../../services/api';
import {
    GraduationCap,
    Plus,
    Trash2,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Users,
    Mail,
    Phone,
    Loader,
    X,
    ImagePlus,
    Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const AdminMentorshipPage = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null); // null = create, object = edit
    const [expandedProgram, setExpandedProgram] = useState(null);
    const [applications, setApplications] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        applicationStartDate: '',
        applicationEndDate: '',
        programStartDate: '',
        programEndDate: '',
        maxParticipants: 20,
    });

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            setLoading(true);
            const data = await mentorshipService.getPrograms();
            setPrograms(data || []);
        } catch (error) {
            console.error('Error fetching programs:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingProgram(null);
        setFormData({
            title: '', description: '',
            applicationStartDate: '', applicationEndDate: '',
            programStartDate: '', programEndDate: '',
            maxParticipants: 20,
        });
        setImageFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEditModal = (program) => {
        setEditingProgram(program);
        const formatDate = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
        setFormData({
            title: program.title || '',
            description: program.description || '',
            applicationStartDate: formatDate(program.applicationStartDate),
            applicationEndDate: formatDate(program.applicationEndDate),
            programStartDate: formatDate(program.programStartDate),
            programEndDate: formatDate(program.programEndDate),
            maxParticipants: program.maxParticipants || 20,
        });
        setImageFile(null);
        setImagePreview(program.imageUrl || null);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.description || !formData.applicationStartDate || !formData.applicationEndDate || !formData.programStartDate) {
            alert('Lütfen zorunlu alanları doldurun.');
            return;
        }
        try {
            setIsSaving(true);
            let imageUrl = editingProgram?.imageUrl || null;
            if (imageFile) {
                const uploadResult = await api.uploadFile(imageFile);
                imageUrl = uploadResult.url;
            }
            const payload = { ...formData, imageUrl };

            if (editingProgram) {
                await mentorshipService.updateProgram(editingProgram.id, payload);
                alert('✅ Program güncellendi!');
            } else {
                await mentorshipService.createProgram(payload);
                alert('✅ Program oluşturuldu!');
            }
            setShowModal(false);
            fetchPrograms();
        } catch (error) {
            alert('❌ Hata: ' + (error.message || 'İşlem başarısız.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (programId) => {
        if (!window.confirm('Bu programı silmek istediğinize emin misiniz?')) return;
        try {
            await mentorshipService.deleteProgram(programId);
            fetchPrograms();
        } catch (error) {
            alert('Silinemedi: ' + error.message);
        }
    };

    const toggleExpand = async (programId) => {
        if (expandedProgram === programId) {
            setExpandedProgram(null);
            return;
        }
        setExpandedProgram(programId);
        if (!applications[programId]) {
            try {
                const data = await mentorshipService.getProgramApplications(programId);
                setApplications(prev => ({ ...prev, [programId]: data }));
            } catch (error) {
                console.error('Error fetching applications:', error);
            }
        }
    };

    const handleStatus = async (applicationId, status, programId) => {
        try {
            await mentorshipService.updateApplicationStatus(applicationId, status);
            const data = await mentorshipService.getProgramApplications(programId);
            setApplications(prev => ({ ...prev, [programId]: data }));
        } catch (error) {
            alert('Hata: ' + error.message);
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
                fontWeight: '600', color: c.color, background: `${c.color}15`, border: `1px solid ${c.color}30`,
            }}>
                {c.label}
            </span>
        );
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
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                        <div>
                            <h1 style={{ margin: 0 }}>Mentorluk Yönetimi</h1>
                            <p className="text-secondary" style={{ margin: 0 }}>Programları oluştur ve başvuruları yönet</p>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                            onClick={openCreateModal}
                        >
                            <Plus size={18} />
                            Yeni Program
                        </button>
                    </div>

                    {/* Programs List */}
                    {programs.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {programs.map((program) => (
                                <div key={program.id} className=" admin-list-item" style={{ overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            padding: 'var(--spacing-lg)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => toggleExpand(program.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1 }}>
                                            {program.imageUrl && (
                                                <img src={program.imageUrl} alt="" style={{
                                                    width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                                                    objectFit: 'cover', flexShrink: 0,
                                                }} />
                                            )}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '4px' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{program.title}</h3>
                                                    {getStatusBadge(program.status)}
                                                </div>
                                                <div className="text-secondary" style={{ fontSize: '12px', display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                                                    <span>📅 {format(new Date(program.applicationStartDate), 'd MMM', { locale: tr })} - {format(new Date(program.applicationEndDate), 'd MMM', { locale: tr })}</span>
                                                    <span>👥 {program.applicationCount || 0} başvuru</span>
                                                    <span>📋 {program.maxParticipants} kontenjan</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={(e) => { e.stopPropagation(); openEditModal(program); }}
                                                style={{ color: 'var(--color-text-secondary)' }}
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(program.id); }}
                                                style={{ color: '#ef4444' }}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                            {expandedProgram === program.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>

                                    {/* Expanded Applications */}
                                    {expandedProgram === program.id && (
                                        <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--spacing-lg)' }}>
                                            <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Başvurular</h4>
                                            {applications[program.id]?.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                                    {applications[program.id].map((app) => (
                                                        <div key={app.id} className=" admin-list-item" style={{
                                                            padding: 'var(--spacing-md)',
                                                            background: 'var(--color-bg-tertiary)',
                                                            borderRadius: 'var(--radius-lg)',
                                                            border: '1px solid var(--color-border)',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                                                                        {app.fullName || `${app.user?.name || 'Anonim'} ${app.user?.surname || ''}`}
                                                                    </div>
                                                                    <div className="text-secondary" style={{ fontSize: '12px', display: 'flex', gap: 'var(--spacing-md)', marginBottom: '4px' }}>
                                                                        {app.university && <span>🎓 {app.university} {app.department ? `- ${app.department}` : ''}</span>}
                                                                    </div>
                                                                    <div className="text-secondary" style={{ fontSize: '12px', display: 'flex', gap: 'var(--spacing-md)' }}>
                                                                        {app.email && <span><Mail size={12} style={{ marginRight: '2px' }} /> {app.email}</span>}
                                                                        {app.phone && <span><Phone size={12} style={{ marginRight: '2px' }} /> {app.phone}</span>}
                                                                    </div>
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                                                    {format(new Date(app.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                                                                </div>
                                                            </div>

                                                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Motivasyon:</div>
                                                                <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{app.motivation}</div>
                                                            </div>

                                                            {app.experience && (
                                                                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Deneyim:</div>
                                                                    <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{app.experience}</div>
                                                                </div>
                                                            )}

                                                            {app.status === 'pending' ? (
                                                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        style={{
                                                                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                                                            border: '1px solid rgba(16,185,129,0.3)',
                                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                                        }}
                                                                        onClick={() => handleStatus(app.id, 'accepted', program.id)}
                                                                    >
                                                                        <CheckCircle size={14} /> Kabul Et
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        style={{
                                                                            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                                                            border: '1px solid rgba(239,68,68,0.3)',
                                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                                        }}
                                                                        onClick={() => handleStatus(app.id, 'rejected', program.id)}
                                                                    >
                                                                        <XCircle size={14} /> Reddet
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div style={{ marginTop: 'var(--spacing-xs)' }}>
                                                                    <span style={{
                                                                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                                                                        color: app.status === 'accepted' ? '#10b981' : '#ef4444',
                                                                        background: app.status === 'accepted' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                                    }}>
                                                                        {app.status === 'accepted' ? '✅ Kabul Edildi' : '❌ Reddedildi'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-secondary" style={{ fontSize: '14px' }}>Henüz başvuru yok.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                            <GraduationCap size={48} color="var(--color-text-tertiary)" style={{ marginBottom: 'var(--spacing-md)' }} />
                            <h3>Henüz program yok</h3>
                            <p className="text-secondary">İlk mentorluk programını oluşturun.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: 'var(--spacing-lg)',
                }}>
                    <div className="card" style={{ padding: 'var(--spacing-xl)', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h3 style={{ margin: 0 }}>{editingProgram ? 'Programı Düzenle' : 'Yeni Mentorluk Programı'}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                    Başlık <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ör: Bondle Mentorluk Programı Dönem 1"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    style={{
                                        width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)',
                                        background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)', fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                    Açıklama <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <textarea
                                    placeholder="Program hakkında bilgiler..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{
                                        width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)',
                                        background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)', minHeight: '100px', resize: 'vertical', fontSize: '14px',
                                    }}
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Program Görseli</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setImageFile(file);
                                            setImagePreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                                {imagePreview ? (
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{
                                                width: '100%', height: '160px', objectFit: 'cover',
                                                borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
                                            }}
                                        />
                                        <button
                                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                                            style={{
                                                position: 'absolute', top: '8px', right: '8px',
                                                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                                                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', color: 'var(--color-text-on-accent)',
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: '100%', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)',
                                            background: 'var(--color-bg-tertiary)', border: '2px dashed var(--color-border)',
                                            color: 'var(--color-text-secondary)', cursor: 'pointer',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                        }}
                                    >
                                        <ImagePlus size={24} />
                                        <span style={{ fontSize: '13px' }}>Görsel Yükle</span>
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                        Başvuru Başlangıcı <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input type="datetime-local" value={formData.applicationStartDate}
                                        onChange={(e) => setFormData({ ...formData, applicationStartDate: e.target.value })}
                                        style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                        Başvuru Bitişi <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input type="datetime-local" value={formData.applicationEndDate}
                                        onChange={(e) => setFormData({ ...formData, applicationEndDate: e.target.value })}
                                        style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '14px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                        Program Başlangıcı <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input type="datetime-local" value={formData.programStartDate}
                                        onChange={(e) => setFormData({ ...formData, programStartDate: e.target.value })}
                                        style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                        Program Bitişi
                                    </label>
                                    <input type="datetime-local" value={formData.programEndDate}
                                        onChange={(e) => setFormData({ ...formData, programEndDate: e.target.value })}
                                        style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '14px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Kontenjan</label>
                                <input type="number" min="1" value={formData.maxParticipants}
                                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                                    style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '14px' }}
                                />
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Kaydediliyor...' : (editingProgram ? 'Güncelle' : 'Programı Oluştur')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMentorshipPage;
