import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, MapPin, Image as ImageIcon, Type, DollarSign, Globe, ArrowLeft, Users, Edit3, X, Copy } from 'lucide-react';

const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Eskişehir', 'Kayseri', 'Trabzon', 'Gaziantep', 'Nevşehir'];

const INITIAL_FORM = {
    title: '',
    description: '',
    date: '',
    location: '',
    isOnline: false,
    onlinePlatform: 'external',
    meetingLink: '',
    eventType: 'Yarışma',
    imageUrl: '',
    paymentType: 'free',
    price: '',
    participantLimit: 100,
    city: 'İstanbul',
    requiresForm: true,
    shopierUrl: '',
    premiumShopierUrl: '',
    premiumPrice: '',
};

const EventManagementPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [eventsList, setEventsList] = useState([]);
    const [branchReps, setBranchReps] = useState([]);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({ ...INITIAL_FORM, assignedRepresentativeId: '' });

    React.useEffect(() => {
        fetchEvents();
        fetchBranchReps();
    }, []);

    const fetchBranchReps = async () => {
        try {
            const data = await api.getBranchRepresentatives();
            setBranchReps(data || []);
        } catch (err) {
            console.error('Failed to fetch branch reps', err);
        }
    };

    const fetchEvents = async () => {
        try {
            const data = await eventService.getAllAdminEvents();
            setEventsList(data || []);
        } catch (err) {
            console.error('Failed to fetch events', err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
            try {
                await eventService.deleteEvent(id);
                setSuccess('Etkinlik silindi.');
                fetchEvents();
            } catch (err) {
                console.error('Delete failed', err);
                setError('Silme işlemi başarısız oldu.');
            }
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        const d = event.date ? new Date(event.date) : null;
        const dateStr = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '';
        setFormData({
            title: event.title || '',
            description: event.description || '',
            date: dateStr,
            location: event.location || '',
            isOnline: event.isOnline || false,
            onlinePlatform: (event.isOnline && event.zoomLink === 'BONDLE_MEET') ? 'bondle' : 'external',
            meetingLink: event.zoomLink === 'BONDLE_MEET' ? '' : (event.zoomLink || ''),
            eventType: event.eventType === 'circle' ? 'circle' : (event.topics?.[0] || 'Yarışma'),
            imageUrl: event.posterImage || '',
            paymentType: event.paymentType || 'free',
            price: event.price || '',
            participantLimit: event.participantLimit || 100,
            city: event.city || 'İstanbul',
            requiresForm: event.requiresForm !== undefined ? event.requiresForm : true,
            shopierUrl: event.shopierUrl || '',
            premiumShopierUrl: event.premiumShopierUrl || '',
            premiumPrice: event.premiumPrice || '',
            assignedRepresentativeId: event.assignedRepresentativeId || '',
        });
        setSuccess('');
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingEvent(null);
        setFormData({ ...INITIAL_FORM });
        setError('');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await eventService.uploadEventImage(file);
            setFormData(prev => ({
                ...prev,
                imageUrl: res.url
            }));
        } catch (err) {
            console.error('Upload failed', err);
            setError('Görsel yüklenemedi! Lütfen tekrar deneyin.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                date: new Date(formData.date).toISOString(),
                price: formData.paymentType === 'paid' ? parseFloat(String(formData.price).replace(',', '.')) : 0,
                premiumPrice: formData.paymentType === 'paid' && formData.premiumPrice ? parseFloat(String(formData.premiumPrice).replace(',', '.')) : null,
                eventType: formData.eventType === 'circle' ? 'circle' : 'standard',
                paymentType: formData.paymentType,
                isOnline: formData.isOnline,
                zoomLink: formData.isOnline ? (formData.onlinePlatform === 'bondle' ? 'BONDLE_MEET' : formData.meetingLink) : undefined,
                location: !formData.isOnline ? formData.location : undefined,
                posterImage: formData.imageUrl || undefined,
                city: formData.city,
                participantLimit: formData.participantLimit ? Number(formData.participantLimit) : 100,
                requiresForm: formData.requiresForm,
                shopierUrl: formData.paymentType === 'paid' ? formData.shopierUrl : undefined,
                premiumShopierUrl: formData.paymentType === 'paid' ? formData.premiumShopierUrl : undefined,
                topics: [formData.eventType === 'circle' ? 'General' : formData.eventType],
                assignedRepresentativeId: formData.assignedRepresentativeId ? Number(formData.assignedRepresentativeId) : undefined,
            };

            if (editingEvent) {
                await eventService.updateEvent(editingEvent.id, payload);
                setSuccess('Etkinlik başarıyla güncellendi! ✅');
                setEditingEvent(null);
            } else {
                await eventService.createEvent(payload);
                setSuccess('Etkinlik başarıyla oluşturuldu! 🎉');
            }

            fetchEvents();
            setFormData({ ...INITIAL_FORM });
            window.scrollTo(0, 0);
        } catch (err) {
            console.error('Event save error:', err);
            setError(editingEvent
                ? 'Etkinlik güncellenirken bir hata meydana geldi.'
                : 'Etkinlik oluşturulurken bir hata meydana geldi.'
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
                    <h1>Etkinlik Yönetimi</h1>
                    <p className="text-secondary">
                        {editingEvent ? `"${editingEvent.title}" düzenleniyor` : 'Yeni etkinlik oluştur'}
                    </p>
                </div>

                {success && (
                    <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        {success}
                    </div>
                )}

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        {error}
                    </div>
                )}

                <div className="card" style={{ padding: 'var(--spacing-xl)', position: 'relative' }}>
                    {editingEvent && (
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
                                <span>Etkinlik Başlığı</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="form-input-modern"
                                placeholder="Örn: Girişimcilik Zirvesi 2024"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="form-group-modern">
                            <label className="form-label-modern">
                                <Type size={18} />
                                <span>Açıklama</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-input-modern"
                                rows="4"
                                placeholder="Etkinlik detayları..."
                                required
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            {/* Date */}
                            <div className="form-group-modern">
                                <label className="form-label-modern">
                                    <Calendar size={18} />
                                    <span>Tarih ve Saat</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="form-input-modern"
                                    required
                                />
                            </div>

                            {/* Type */}
                            <div className="form-group-modern">
                                <label className="form-label-modern">
                                    <Type size={18} />
                                    <span>Kategori</span>
                                </label>
                                <select
                                    name="eventType"
                                    value={formData.eventType}
                                    onChange={handleChange}
                                    className="form-input-modern"
                                    required
                                    style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                                >
                                    <option value="Yarışma">Yarışma</option>
                                    <option value="Workshop">Workshop</option>
                                    <option value="Bootcamp">Bootcamp</option>
                                    <option value="Seminer">Seminer</option>
                                    <option value="Zirve & Konferans">Zirve & Konferans</option>
                                    <option value="Networking">Networking</option>
                                    <option value="Eğlence & Sosyal">Eğlence & Sosyal</option>
                                    <option value="Sosyal Sorumluluk">Sosyal Sorumluluk</option>
                                </select>
                            </div>
                        </div>

                        {/* Kontenjan + Şehir */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            {/* Participant Limit */}
                            <div className="form-group-modern">
                                <label className="form-label-modern">
                                    <Users size={18} />
                                    <span>Kontenjan</span>
                                </label>
                                <input
                                    type="number"
                                    name="participantLimit"
                                    value={formData.participantLimit}
                                    onChange={handleChange}
                                    className="form-input-modern"
                                    placeholder="100"
                                    min="1"
                                    max="10000"
                                    required
                                />
                                <small className="text-secondary" style={{ marginTop: '4px', display: 'block' }}>
                                    Maksimum katılımcı sayısı
                                </small>
                            </div>

                            {/* City */}
                            <div className="form-group-modern">
                                <label className="form-label-modern">
                                    <MapPin size={18} />
                                    <span>Şehir</span>
                                </label>
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="form-input-modern"
                                    required
                                    style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                                >
                                    {CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Online / Location Toggle */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                                    <input
                                        type="checkbox"
                                        name="isOnline"
                                        checked={formData.isOnline}
                                        onChange={handleChange}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontWeight: '500' }}>Online Etkinlik</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                                    <input
                                        type="checkbox"
                                        name="requiresForm"
                                        checked={formData.requiresForm}
                                        onChange={handleChange}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontWeight: '500', color: 'var(--color-accent)' }}>Kayıt İçin Onay Gereksin (Form)</span>
                                </label>
                            </div>
                        </div>

                        {/* Assigned Representative */}
                        <div className="form-group-modern">
                            <label className="form-label-modern">
                                <Users size={18} />
                                <span>İl Temsilcisi Ata (Sadece Seçilen Temsilci Yanıtları Görebilir)</span>
                            </label>
                            <select
                                name="assignedRepresentativeId"
                                value={formData.assignedRepresentativeId || ''}
                                onChange={handleChange}
                                className="form-input-modern"
                                style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                            >
                                <option value="">Temsilci Atanmadı</option>
                                {branchReps.map(rep => (
                                    <option key={rep.id} value={rep.id}>
                                        {rep.name} {rep.surname} ({rep.branch})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Location / Link */}
                        <div className="form-group-modern">
                            <label className="form-label-modern">
                                {formData.isOnline ? <Globe size={18} /> : <MapPin size={18} />}
                                <span>{formData.isOnline ? 'Platform / Link' : 'Konum / Adres'}</span>
                            </label>

                            {formData.isOnline && (
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="radio" name="onlinePlatform" value="external" checked={formData.onlinePlatform === 'external'} onChange={handleChange} />
                                        Harici Link (Zoom, Meet vb.)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="radio" name="onlinePlatform" value="bondle" checked={formData.onlinePlatform === 'bondle'} onChange={handleChange} />
                                        Bondle Meet (Yerleşik)
                                    </label>
                                </div>
                            )}

                            {(!formData.isOnline || formData.onlinePlatform === 'external') && (
                                <input
                                    type="text"
                                    name={formData.isOnline ? "meetingLink" : "location"}
                                    value={formData.isOnline ? formData.meetingLink : formData.location}
                                    onChange={handleChange}
                                    className="form-input-modern"
                                    placeholder={formData.isOnline ? "https://meet.google.com/..." : "Örn: Teknopark Konferans Salonu"}
                                    required={!formData.isOnline || formData.onlinePlatform === 'external'}
                                />
                            )}
                        </div>

                        {/* Image Upload */}
                        <div className="form-group-modern">
                            <label className="form-label-modern">
                                <ImageIcon size={18} />
                                <span>Kapak Görseli</span>
                            </label>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="form-input-modern"
                                        style={{ padding: '8px' }}
                                        disabled={uploading}
                                    />
                                    <small className="text-secondary" style={{ marginTop: '4px', display: 'block' }}>
                                        {uploading ? '⏳ Görsel yükleniyor...' : 'Cihazınızdan bir kapak resmi seçin.'}
                                    </small>
                                </div>

                                {formData.imageUrl && (
                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                        <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Type */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div className="form-group-modern">
                                <label className="form-label-modern">
                                    <DollarSign size={18} />
                                    <span>Ücret Tipi</span>
                                </label>
                                <select
                                    name="paymentType"
                                    value={formData.paymentType}
                                    onChange={handleChange}
                                    className="form-input-modern"
                                    style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                                >
                                    <option value="free">Ücretsiz</option>
                                    <option value="paid">Ücretli</option>
                                </select>
                            </div>

                            {formData.paymentType === 'paid' && (
                                <>
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">
                                            <DollarSign size={18} />
                                            <span>Normal Fiyat (₺)</span>
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="form-input-modern"
                                            placeholder="Örn: 199,99"
                                            required
                                        />
                                    </div>
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">
                                            <DollarSign size={18} color="#fbbf24" />
                                            <span style={{ color: '#fbbf24' }}>Premium Fiyat (₺)</span>
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            name="premiumPrice"
                                            value={formData.premiumPrice}
                                            onChange={handleChange}
                                            className="form-input-modern"
                                            placeholder="Örn: 149,99 (İsteğe Bağlı)"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Shopier Link */}
                        {formData.paymentType === 'paid' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group-modern">
                                    <label className="form-label-modern">
                                        <Globe size={18} />
                                        <span>Normal Ödeme Linki (Shopier)</span>
                                    </label>
                                    <input
                                        type="url"
                                        name="shopierUrl"
                                        value={formData.shopierUrl}
                                        onChange={handleChange}
                                        className="form-input-modern"
                                        placeholder="https://www.shopier.com/ShowProductNew/..."
                                        required
                                    />
                                    <small className="text-secondary" style={{ marginTop: '4px', display: 'block' }}>
                                        Standart kullanıcılar için ödeme linki.
                                    </small>
                                </div>
                                <div className="form-group-modern">
                                    <label className="form-label-modern">
                                        <Globe size={18} color="#fbbf24" />
                                        <span style={{ color: '#fbbf24' }}>Premium Ödeme Linki (İsteğe Bağlı)</span>
                                    </label>
                                    <input
                                        type="url"
                                        name="premiumShopierUrl"
                                        value={formData.premiumShopierUrl}
                                        onChange={handleChange}
                                        className="form-input-modern"
                                        placeholder="https://www.shopier.com/ShowProductNew/..."
                                    />
                                    <small className="text-secondary" style={{ marginTop: '4px', display: 'block' }}>
                                        Premium kullanıcılara özel indirimli fiyatın linki.
                                    </small>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={loading || uploading}
                            style={{ marginTop: 'var(--spacing-md)' }}
                        >
                            {loading
                                ? (editingEvent ? 'Güncelleniyor...' : 'Oluşturuluyor...')
                                : (editingEvent ? '✅ Etkinliği Güncelle' : 'Etkinliği Yayınla')
                            }
                        </button>
                    </form>
                </div>

                {/* Existing Events List */}
                <div style={{ marginTop: 'var(--spacing-2xl)' }}>
                    <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Mevcut Etkinlikler</h2>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {eventsList.length === 0 ? (
                            <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                Henüz hiç etkinlik oluşturulmamış.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {eventsList.map((event, index) => (
                                    <div key={event.id} className=" admin-list-item" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--spacing-md)',
                                        borderBottom: index !== eventsList.length - 1 ? '1px solid var(--color-border)' : 'none',
                                        backgroundColor: editingEvent?.id === event.id ? 'rgba(255, 165, 0, 0.05)' : 'var(--color-bg-secondary)',
                                        transition: 'background-color 0.2s ease',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1 }}>
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                border: '1px solid var(--color-border)'
                                            }}>
                                                <img
                                                    src={event.posterImage || event.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                                                    alt={event.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '15px' }}>{event.title}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                                                    <span>{new Date(event.date).toLocaleDateString('tr-TR')}</span>
                                                    <span>•</span>
                                                    <span>{event.currentParticipants || 0}/{event.participantLimit || '∞'} Katılımcı</span>
                                                    {event.city && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{event.city}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                            <button
                                                onClick={() => {
                                                    const url = `https://bondlecommunity.com/events/${event.id}?ref=${user?.referralCode || ''}`;
                                                    navigator.clipboard.writeText(url);
                                                    setSuccess('Davet linki kopyalandı!');
                                                    setTimeout(() => setSuccess(''), 3000);
                                                }}
                                                className="btn"
                                                style={{
                                                    padding: '8px 12px',
                                                    fontSize: '13px',
                                                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                                    color: '#8b5cf6',
                                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <Copy size={14} />
                                                Davet Linki
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/events/${event.id}/applications`)}
                                                className="btn"
                                                style={{
                                                    padding: '8px 12px',
                                                    fontSize: '13px',
                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#10b981',
                                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <Users size={14} />
                                                Başvurular
                                            </button>
                                            <button
                                                onClick={() => handleEdit(event)}
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
                                                onClick={() => handleDelete(event.id)}
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
                                                Sil
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default EventManagementPage;
