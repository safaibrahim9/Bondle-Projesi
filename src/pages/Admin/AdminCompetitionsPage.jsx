import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Calendar, Trophy, Image as ImageIcon, Type, Link as LinkIcon, ArrowLeft, Users, Edit3, X, Trash2 } from 'lucide-react';

const INITIAL_FORM = {
    title: '',
    description: '',
    category: 'Teknoloji',
    prize: '',
    deadline: '',
    startDate: '',
    imageUrl: '',
    externalLink: '',
    isOnline: false,
};

const AdminCompetitionsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [competitionsList, setCompetitionsList] = useState([]);
    const [editingCompetition, setEditingCompetition] = useState(null);
    const [formData, setFormData] = useState({ ...INITIAL_FORM });

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        try {
            const data = await api.getAllCompetitions();
            setCompetitionsList(data || []);
        } catch (err) {
            console.error('Failed to fetch competitions', err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleEdit = (comp) => {
        setEditingCompetition(comp);
        const deadlineStr = comp.deadline ? formatDateForInput(comp.deadline) : '';
        const startDateStr = comp.startDate ? formatDateForInput(comp.startDate) : '';
        setFormData({
            title: comp.title || '',
            description: comp.description || '',
            category: comp.category || 'Teknoloji',
            prize: comp.prize || '',
            deadline: deadlineStr,
            startDate: startDateStr,
            imageUrl: comp.imageUrl || '',
            externalLink: comp.externalLink || '',
            isOnline: comp.isOnline || false,
        });
        setSuccess('');
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingCompetition(null);
        setFormData({ ...INITIAL_FORM });
        setError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu yarışmayı ve tüm başvurularını silmek istediğinize emin misiniz?')) return;
        try {
            await api.deleteCompetition(id);
            setSuccess('Yarışma silindi.');
            if (editingCompetition?.id === id) {
                handleCancelEdit();
            }
            fetchCompetitions();
        } catch (err) {
            console.error('Delete failed', err);
            setError('Silme işlemi başarısız oldu.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                ...formData,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
            };

            if (editingCompetition) {
                await api.updateCompetition(editingCompetition.id, payload);
                setSuccess('Yarışma başarıyla güncellendi! ✅');
                setEditingCompetition(null);
            } else {
                await api.createCompetition(payload);
                setSuccess('Yarışma başarıyla oluşturuldu! 🎉');
            }

            fetchCompetitions();
            setFormData({ ...INITIAL_FORM });
            window.scrollTo(0, 0);
        } catch (err) {
            console.error('Competition save error:', err);
            setError(editingCompetition
                ? 'Yarışma güncellenirken bir hata oluştu.'
                : 'Yarışma oluşturulurken bir hata oluştu.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container">
                <button
                    onClick={() => navigate('/admin')}
                    className="btn btn-ghost"
                    style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ArrowLeft size={20} />
                    Panele Dön
                </button>

                <div className="page-header">
                    <h1>Yarışma & Eğitimler</h1>
                    <p className="text-secondary">
                        {editingCompetition ? `"${editingCompetition.title}" düzenleniyor` : 'Yarışma ve eğitimleri, programları ve başvuruları yönetin.'}
                    </p>
                </div>

                {success && <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-lg)' }}>{success}</div>}
                {error && <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-lg)' }}>{error}</div>}

                <div className="card" style={{ padding: 'var(--spacing-xl)', position: 'relative' }}>
                    {editingCompetition && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--spacing-md)',
                            padding: '10px 14px',
                            backgroundColor: 'rgba(255, 165, 0, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 165, 0, 0.3)'
                        }}>
                            <span style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '14px' }}>
                                ✏️ Düzenleme Modu
                            </span>
                            <button
                                onClick={handleCancelEdit}
                                className="btn"
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '13px',
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <X size={14} />
                                İptal
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

                        {/* Title */}
                        <div className="form-group-modern">
                            <label className="form-label-modern">
                                <Type size={18} />
                                <span>Yarışma / Eğitim Adı</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="form-input-modern"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="form-group-modern">
                            <label className="form-label-modern">
                                <Type size={18} />
                                <span>Açıklama / Detaylar</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-input-modern"
                                rows="4"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            {/* Category */}
                            <div className="form-group-modern">
                                <label className="form-label-modern">
                                    <Type size={18} />
                                    <span>Kategori</span>
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="form-input-modern"
                                >
                                    <option>Teknoloji</option>
                                    <option>Tasarım</option>
                                    <option>İnovasyon</option>
                                    <option>Eğitim</option>
                                    <option>Sosyal Sorumluluk</option>
                                    <option>Diğer</option>
                                </select>
                            </div>

                            {/* Prize */}
                            <div className="form-group-modern">
                                <label className="form-label-modern">
                                    <Trophy size={18} />
                                    <span>Ödül / Sertifika</span>
                                </label>
                                <input
                                    type="text"
                                    name="prize"
                                    value={formData.prize}
                                    onChange={handleChange}
                                    className="form-input-modern"
                                    placeholder="Örn: 50.000 TL veya Sertifika"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            {/* Start Date */}
                            <div className="form-group-modern">
                                <label className="form-label-modern">
                                    <Calendar size={18} />
                                    <span>Başlangıç Tarihi (Opsiyonel)</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="form-input-modern"
                                />
                            </div>

                            {/* Deadline */}
                            <div className="form-group-modern">
                                <label className="form-label-modern">
                                    <Calendar size={18} />
                                    <span>Son Başvuru Tarihi</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    className="form-input-modern"
                                    required
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="form-group-modern">
                            <label className="form-label-modern">
                                <ImageIcon size={18} />
                                <span>Görsel / Afiş</span>
                            </label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        try {
                                            const res = await api.uploadFile(file);
                                            setFormData(prev => ({ ...prev, imageUrl: res.url }));
                                        } catch (err) {
                                            alert('Görsel yüklenemedi');
                                        }
                                    }}
                                    className="form-input-modern"
                                />
                                {formData.imageUrl && (
                                    <img src={formData.imageUrl} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                                )}
                            </div>
                        </div>

                        {/* Online / Yüz Yüze Toggle */}
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                                <input
                                    type="checkbox"
                                    name="isOnline"
                                    checked={formData.isOnline}
                                    onChange={handleChange}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontWeight: '500' }}>🌐 Online Katılım</span>
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 'var(--spacing-md)' }}>
                            {loading
                                ? (editingCompetition ? 'Güncelleniyor...' : 'Kaydediliyor...')
                                : (editingCompetition ? '✅ Değişiklikleri Kaydet' : 'Kaydet ve Yayınla')
                            }
                        </button>
                    </form>
                </div>

                {/* List */}
                <div style={{ marginTop: 'var(--spacing-2xl)' }}>
                    <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Mevcut İçerikler (Yarışma & Eğitim)</h2>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {competitionsList.length === 0 ? (
                            <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                Henüz içerik eklenmemiş.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {competitionsList.map((comp, index) => (
                                    <div key={comp.id} className=" admin-list-item" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--spacing-md)',
                                        borderBottom: index !== competitionsList.length - 1 ? '1px solid var(--color-border)' : 'none',
                                        backgroundColor: editingCompetition?.id === comp.id ? 'rgba(255, 165, 0, 0.05)' : 'var(--color-bg-secondary)',
                                        transition: 'background-color 0.2s ease',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1 }}>
                                            {comp.imageUrl && (
                                                <div style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                    border: '1px solid var(--color-border)'
                                                }}>
                                                    <img
                                                        src={comp.imageUrl}
                                                        alt={comp.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '15px' }}>{comp.title}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                                                    <span>{comp.category}</span>
                                                    <span>•</span>
                                                    <span>Son: {new Date(comp.deadline).toLocaleDateString('tr-TR')}</span>
                                                    <span>•</span>
                                                    <span>{comp.participantCount} başvuru</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                            <button
                                                onClick={() => navigate(`/admin/competitions/${comp.id}/applications`)}
                                                className="btn btn-outline"
                                                style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '8px 12px', fontSize: '13px', borderRadius: '6px' }}
                                            >
                                                <Users size={14} />
                                                Başvurular
                                            </button>
                                            <button
                                                onClick={() => handleEdit(comp)}
                                                className="btn"
                                                style={{
                                                    padding: '8px 12px',
                                                    fontSize: '13px',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                    color: '#3b82f6',
                                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <Edit3 size={14} />
                                                Düzenle
                                            </button>
                                            <button
                                                onClick={() => handleDelete(comp.id)}
                                                className="btn"
                                                style={{
                                                    padding: '8px 12px',
                                                    fontSize: '13px',
                                                    backgroundColor: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Format date for datetime-local input (local time, not UTC)
function formatDateForInput(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default AdminCompetitionsPage;
