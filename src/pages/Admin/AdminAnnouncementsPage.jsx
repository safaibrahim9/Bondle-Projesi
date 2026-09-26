import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2, AlertCircle, Plus, Calendar as CalendarIcon, Trophy, Image as ImageIcon, GraduationCap, Megaphone, Edit3, X, Star, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '../../services/api';
import mentorshipService from '../../services/mentorshipService';
import { compressImage } from '../../utils/imageCompression';

const AdminAnnouncementsPage = () => {
    const { token } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [events, setEvents] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [mentorshipPrograms, setMentorshipPrograms] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    // Form states
    const [announcementType, setAnnouncementType] = useState('custom'); // 'custom', 'event', 'competition', 'mentorship'
    const [selectedItemId, setSelectedItemId] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: '',
        linkTo: '',
        city: '',
        isPinned: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [announcementsRes, eventsRes, compsRes, programsRes] = await Promise.all([
                api.get('/announcements/admin'),
                api.get('/events'),
                api.get('/competitions'),
                mentorshipService.getPrograms(),
            ]);
            setAnnouncements(announcementsRes || []);
            setEvents(eventsRes || []);
            setCompetitions(compsRes || []);
            setMentorshipPrograms(programsRes || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Veriler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // File size check (Increased to 50MB)
        if (file.size > 50 * 1024 * 1024) {
            setError('Resim boyutu çok büyük (Maksimum 50MB). Lütfen daha küçük bir resim seçin.');
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            
            // Compress image before sending to backend
            const compressedImage = await compressImage(file, { quality: 0.6 });
            formData.append('file', compressedImage);
            console.log(`Original size: ${(file.size / 1024).toFixed(2)} KB, Compressed size: ${(compressedImage.size / 1024).toFixed(2)} KB`);
            
            const response = await api.request('/announcements/upload', {
                method: 'POST',
                body: formData,
                headers: {} // Let browser set boundary
            });
            
            setFormData(prev => ({ ...prev, image: response.url }));
        } catch (err) {
            console.error('Upload error:', err);
            setError('Resim yüklenirken bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTypeChange = (type) => {
        setAnnouncementType(type);
        setSelectedItemId('');
        setFormData({ title: '', description: '', image: '', linkTo: '', city: '', isPinned: false });
    };

    const handleItemSelect = (e) => {
        const id = e.target.value;
        setSelectedItemId(id);

        if (announcementType === 'event') {
            const event = events.find(ev => ev.id.toString() === id);
            if (event) {
                setFormData({
                    title: event.title,
                    description: `${format(new Date(event.date), 'dd MMMM yyyy HH:mm', { locale: tr })} - ${event.location}`,
                    image: event.posterImage || event.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
                    linkTo: `/events/${event.id}`,
                    city: event.city || '',
                    isPinned: false
                });
            }
        } else if (announcementType === 'competition') {
            const comp = competitions.find(c => c.id.toString() === id);
            if (comp) {
                setFormData({
                    title: comp.title,
                    description: `Son Başvuru: ${format(new Date(comp.deadline), 'dd MMMM yyyy', { locale: tr })}`,
                    image: comp.image || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600',
                    linkTo: `/competitions/${comp.id}`,
                });
            }
        } else if (announcementType === 'mentorship') {
            const program = mentorshipPrograms.find(p => p.id.toString() === id);
            if (program) {
                const now = new Date();
                const appStart = new Date(program.applicationStartDate);
                const appEnd = new Date(program.applicationEndDate);
                let desc;
                if (now >= appStart && now <= appEnd) {
                    desc = `Son başvuru: ${format(appEnd, 'dd MMMM yyyy', { locale: tr })}`;
                } else if (now < appStart) {
                    desc = `${format(appStart, 'dd MMMM yyyy', { locale: tr })} tarihinde açılacak`;
                } else {
                    desc = `Başvuru: ${format(appStart, 'dd MMMM', { locale: tr })} - ${format(appEnd, 'dd MMMM yyyy', { locale: tr })}`;
                }
                setFormData({
                    title: program.title,
                    description: desc,
                    image: program.imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600',
                    linkTo: '/mentorship',
                });
            }
        }
    };

    const handleEdit = (announcement) => {
        setEditingId(announcement.id);
        setAnnouncementType('custom'); // Default to custom when editing to allow manual changes
        setFormData({
            title: announcement.title,
            description: announcement.description,
            image: announcement.image,
            linkTo: announcement.linkTo || '',
            city: announcement.city || '',
            isPinned: announcement.isPinned || false
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ title: '', description: '', image: '', linkTo: '', city: '', isPinned: false });
        setSelectedItemId('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.image) {
            setError('Başlık ve görsel zorunludur.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            
            if (editingId) {
                await api.put(`/announcements/${editingId}`, formData);
            } else {
                await api.post('/announcements', formData);
            }

            // Başarılı
            setFormData({ title: '', description: '', image: '', linkTo: '', city: '', isPinned: false });
            setSelectedItemId('');
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error('Error saving announcement:', err);
            setError(editingId ? 'Duyuru güncellenirken bir hata oluştu.' : 'Duyuru oluşturulurken bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return;

        try {
            await api.delete(`/announcements/${id}`);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Error deleting announcement:', err);
            alert('Duyuru silinemedi.');
        }
    };

    const handleDragStart = (index) => {
        setDraggedItemIndex(index);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (index) => {
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newAnnouncements = [...announcements];
        const [draggedItem] = newAnnouncements.splice(draggedItemIndex, 1);
        newAnnouncements.splice(index, 0, draggedItem);

        // Calculate new priorities (top down)
        const reorderedItems = newAnnouncements.map((item, idx) => ({
            id: item.id,
            priority: newAnnouncements.length - idx
        }));

        setAnnouncements(newAnnouncements);
        setDraggedItemIndex(null);

        try {
            await api.put('/announcements/reorder', reorderedItems);
        } catch (err) {
            console.error('Error reordering announcements:', err);
            setError('Sıralama güncellenirken bir hata oluşti.');
            fetchData(); // Rollback
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-header">
                    <h2>Duyuru Yönetimi</h2>
                </div>
                <div className="admin-loading">
                    <div className="spinner"></div>
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ background: 'linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)' }}>
            <div className="container">
                <div className="page-header" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xs)' }}>
                        <div style={{ padding: '8px', background: 'var(--color-accent-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Megaphone size={20} color="white" />
                        </div>
                        <h1 style={{ fontSize: 'var(--font-size-3xl)', margin: 0, background: 'linear-gradient(90deg, var(--gradient-text-start), var(--gradient-text-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Duyuru Yönetimi</h1>
                    </div>
                    <p className="text-secondary">Ana sayfada gösterilecek afiş ve duyuruları yönetin.</p>
                </div>

            {error && (
                <div className="error-alert" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="admin-grid" style={{ gridTemplateColumns: 'minmax(350px, 1fr) 2fr', alignItems: 'start' }}>
                {/* Sol Taraf - Duyuru Ekleme Formu */}
                <div className="admin-card poster-card glass-card">
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Yeni Duyuru Ekle</h3>

                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                        <button
                            className={`btn ${announcementType === 'custom' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                            onClick={() => handleTypeChange('custom')}
                            style={{ flex: 1 }}
                        >
                            Özel
                        </button>
                        <button
                            className={`btn ${announcementType === 'event' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                            onClick={() => handleTypeChange('event')}
                            style={{ flex: 1 }}
                        >
                            Etkinlik
                        </button>
                        <button
                            className={`btn ${announcementType === 'competition' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                            onClick={() => handleTypeChange('competition')}
                            style={{ flex: 1.5 }}
                        >
                            Yarışma & Eğitim
                        </button>
                        <button
                            className={`btn ${announcementType === 'mentorship' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                            onClick={() => handleTypeChange('mentorship')}
                            style={{ flex: 1 }}
                        >
                            Mentorluk
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="admin-form">
                        {announcementType === 'event' && (
                            <div className="form-group">
                                <label className="form-label-modern">Etkinlik Seç</label>
                                <select
                                    className="form-input-modern"
                                    value={selectedItemId}
                                    onChange={handleItemSelect}
                                    required
                                >
                                    <option value="">Seçiniz...</option>
                                    {events.map(ev => (
                                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {announcementType === 'competition' && (
                            <div className="form-group">
                                <label className="form-label-modern">Yarışma & Eğitim Seç</label>
                                <select
                                    className="form-input-modern"
                                    value={selectedItemId}
                                    onChange={handleItemSelect}
                                    required
                                >
                                    <option value="">Seçiniz...</option>
                                    {competitions.map(comp => (
                                        <option key={comp.id} value={comp.id}>{comp.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {announcementType === 'mentorship' && (
                            <div className="form-group">
                                <label className="form-label-modern">Mentorluk Programı Seç</label>
                                <select
                                    className="form-input-modern"
                                    value={selectedItemId}
                                    onChange={handleItemSelect}
                                    required
                                >
                                    <option value="">Seçiniz...</option>
                                    {mentorshipPrograms.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label-modern">Başlık</label>
                            <input
                                type="text"
                                className="form-input-modern"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label-modern">Kısa Açıklama</label>
                            <input
                                type="text"
                                className="form-input-modern"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label-modern">Duyuru Görseli (Afiş)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="file"
                                    id="announcement-image"
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="announcement-image"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: 'var(--spacing-md)',
                                        border: '2px dashed var(--color-border)',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        background: 'var(--color-bg-tertiary)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
                                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                                    }}
                                >
                                    <ImageIcon size={20} />
                                    <span>{submitting ? 'Yükleniyor...' : formData.image ? 'Resmi Değiştir' : 'Cihazdan Resim Seç'}</span>
                                </label>
                            </div>
                            
                            {formData.image && (
                                <div style={{ marginTop: 'var(--spacing-md)', position: 'relative' }}>
                                    <img
                                        src={formData.image}
                                        alt="Önizleme"
                                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, image: '' })}
                                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '50%', padding: '4px', color: 'white', cursor: 'pointer' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label-modern">Şehir (Opsiyonel)</label>
                            <input
                                type="text"
                                className="form-input-modern"
                                placeholder="Örn: İstanbul"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm) 0' }}>
                            <input
                                type="checkbox"
                                id="isPinned"
                                checked={formData.isPinned}
                                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="isPinned" style={{ cursor: 'pointer', fontWeight: '600' }}>En Başta Göster (Sabitle)</label>
                        </div>

                        <div className="form-group">
                            <label className="form-label-modern">Yönlendirme Linki (Opsiyonel)</label>
                            <input
                                type="text"
                                className="form-input-modern"
                                placeholder="Örn: /events/1 veya https://..."
                                value={formData.linkTo}
                                onChange={(e) => setFormData({ ...formData, linkTo: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button
                                type="submit"
                                className={`btn btn-primary ${submitting ? 'loading' : ''}`}
                                disabled={submitting}
                                style={{ flex: 2 }}
                            >
                                {submitting ? (editingId ? 'Güncelleniyor...' : 'Ekleniyor...') : (editingId ? 'Değişiklikleri Kaydet' : 'Duyuruyu Ekle')}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={cancelEdit}
                                    style={{ flex: 1 }}
                                >
                                    İptal
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Sağ Taraf - Duyuru Listesi */}
                <div className="admin-card poster-card glass-card">
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Aktif Duyurular ({announcements.length})</h3>

                    {announcements.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                            <ImageIcon size={48} color="var(--color-text-tertiary)" />
                            <p>Henüz eklenmiş bir duyuru bulunmuyor.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {announcements.map((announcement, index) => (
                                <div 
                                    key={announcement.id} 
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(index)}
                                    style={{
                                        display: 'flex',
                                        gap: 'var(--spacing-md)',
                                        padding: 'var(--spacing-md)',
                                        background: 'var(--color-bg-primary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--color-bg-tertiary)',
                                        alignItems: 'center',
                                        cursor: 'grab',
                                        opacity: draggedItemIndex === index ? 0.5 : 1,
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ color: 'var(--color-text-tertiary)', cursor: 'grab' }}>
                                        <GripVertical size={20} />
                                    </div>
                                    <div style={{ width: '100px', height: '100px', flexShrink: 0 }}>
                                        <img
                                            src={announcement.image}
                                            alt={announcement.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <h4 style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {announcement.title}
                                            {announcement.isPinned && <Star size={14} fill="#fbbf24" color="#fbbf24" title="Sabitlenmiş" />}
                                            {announcement.city && <span style={{ fontSize: '10px', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>{announcement.city}</span>}
                                        </h4>
                                        <p style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {announcement.description}
                                        </p>
                                        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-primary)', wordBreak: 'break-all' }}>
                                            {announcement.linkTo || 'Link eklenmedi'}
                                        </p>
                                    </div>
                                    <div style={{ paddingLeft: 'var(--spacing-md)', borderLeft: '1px solid var(--color-bg-tertiary)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <button
                                            className="btn btn-icon btn-outline"
                                            onClick={() => handleEdit(announcement)}
                                            title="Düzenle"
                                            style={{ padding: '8px', border: 'none', background: 'transparent' }}
                                        >
                                            <Edit3 size={20} color="var(--color-text-secondary)" />
                                        </button>
                                        <button
                                            className="btn btn-icon btn-danger"
                                            onClick={() => handleDelete(announcement.id)}
                                            title="Sil"
                                            style={{ padding: '8px', border: 'none', background: 'transparent' }}
                                        >
                                            <Trash2 size={20} color="#ef4444" />
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

export default AdminAnnouncementsPage;

