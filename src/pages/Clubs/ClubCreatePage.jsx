import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createClub, uploadClubLogo } from '../../services/clubService';
import { Camera, Type, FileText, MapPin, Users, Instagram, Linkedin, Hash } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';
import Toast from '../../components/Toast';
import './ClubCreatePage.css';

const turkishCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli', 'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri', 'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın', 'Tekirdağ', 'Sakarya', 'Denizli', 'Muğla', 'Eskişehir', 'Mardin', 'Trabzon', 'Malatya', 'Ordu', 'Erzurum', 'Afyonkarahisar', 'Sivas', 'Adıyaman', 'Batman', 'Zonguldak', 'Tokat', 'Elazığ', 'Kütahya', 'Çanakkale', 'Osmaniye', 'Çorum', 'Şırnak', 'Ağrı', 'Giresun', 'Isparta', 'Aksaray', 'Yozgat', 'Edirne', 'Muş', 'Düzce', 'Kastamonu', 'Uşak', 'Niğde', 'Kırklareli', 'Bitlis', 'Rize', 'Amasya', 'Siirt', 'Bolu', 'Nevşehir', 'Yalova', 'Bingöl', 'Kırıkkale', 'Hakkari', 'Kars', 'Burdur', 'Karaman', 'Karabük', 'Kırşehir', 'Erzincan', 'Bilecik', 'Sinop', 'Iğdır', 'Bartın', 'Çankırı', 'Artvin', 'Gümüşhane', 'Kilis', 'Ardahan', 'Tunceli', 'Bayburt'].sort();

const ClubCreatePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        city: 'İstanbul',
        categories: [],
        memberCount: '',
        instagramUrl: '',
        linkedinUrl: ''
    });

    const categories = [
        'Bilim & Araştırma', 'Blockchain & Kripto', 'Çevre & Sürdürülebilirlik', 'Dans', 'E-Spor & Oyun',
        'Edebiyat', 'Ekonomi & Finans', 'Fotoğrafçılık', 'Gastronomi', 'Gezi & Doğa',
        'Girişimcilik', 'Gönüllülük', 'Hayvan Hakları', 'Hukuk', 'Kariyer & Gelişim',
        'Kültür', 'Liderlik', 'Mimarlık', 'Mühendislik', 'Münazara',
        'Müzik', 'Oyun Geliştirme', 'Pazarlama & İletişim', 'Psikoloji', 'Robotik',
        'Sanat & Tasarım', 'Satranç', 'Siber Güvenlik', 'Sinema & Tiyatro', 'Sosyal Sorumluluk',
        'Spor', 'Tıp & Sağlık', 'Veri Bilimi', 'Yabancı Dil', 'Yapay Zeka',
        'Yazılım & Teknoloji'
    ];

    const handleCategoryToggle = (category) => {
        const newCategories = formData.categories.includes(category)
            ? formData.categories.filter(c => c !== category)
            : [...formData.categories, category];
        setFormData({ ...formData, categories: newCategories });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name) {
            setError('Kulüp adı gerekli');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Prepare submission data - converting empty memberCount string to 0
            const submissionData = {
                ...formData,
                memberCount: formData.memberCount === '' ? 0 : Number(formData.memberCount)
            };

            // Create club first
            const newClub = await createClub(submissionData);

            // Upload logo if provided
            if (logoFile) {
                const compressedLogo = await compressImage(logoFile, { maxWidth: 500, maxHeight: 500, quality: 0.7 });
                await uploadClubLogo(newClub.id, compressedLogo);
            }

            // Show success message
            setToast({ type: 'success', message: 'Kulüp başarıyla oluşturuldu! Admin onayı bekleniyor.' });
            setTimeout(() => {
                navigate('/clubs');
            }, 2000);
        } catch (err) {
            console.error('Error creating club:', err);
            setError(err.message || 'Kulüp oluşturulurken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Any logged in user can access this page now to create a club request.

    return (
        <div className="page club-create-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="container">
                <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, background: 'linear-gradient(to right, var(--gradient-text-start), var(--gradient-text-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Yeni Kulüp Oluştur
                    </h1>
                    <p className="text-secondary" style={{ fontSize: '1.1rem', margin: '8px 0 0 0' }}>
                        Kulübünüzü oluşturun. Admin onayından sonra yayına alınacaktır.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 'var(--radius-md)' }}>
                        {error}
                    </div>
                )}

                <div className="card poster-card glass-card" style={{ padding: 'var(--spacing-md)' }}>
                    <form onSubmit={handleSubmit} className="club-form">
                        
                        {/* Logo Upload (Admin style) */}
                        <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '600' }}>Kulüp Logosu</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: 'var(--radius-xl)',
                                    border: '2px dashed rgba(139, 92, 246, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    background: logoPreview ? `url(${logoPreview}) center/cover` : 'rgba(139, 92, 246, 0.05)',
                                    transition: 'all 0.2s ease',
                                    margin: '0 auto'
                                }}
                            >
                                {!logoPreview && (
                                    <Camera size={32} color="#8b5cf6" />
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Temel Bilgiler Section */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.4)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-lg)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent-primary)' }}>
                                <FileText size={20} /> Temel Bilgiler
                            </h2>

                            {/* Club Name */}
                            <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label htmlFor="name" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--spacing-xs)', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                    <Type size={16} /> Kulüp Adı *
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Örn: Yazılım Kulübü"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(255, 255, 255, 0.6)', color: 'var(--color-text-primary)', fontSize: '1rem', transition: 'border-color 0.2s' }}
                                />
                            </div>

                            {/* Description */}
                            <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label htmlFor="description" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--spacing-xs)', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                    <FileText size={16} /> Açıklama
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Kulübünüzün vizyonunu, amacını ve neler yaptığını detaylıca anlatın..."
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(255, 255, 255, 0.6)', color: 'var(--color-text-primary)', fontSize: '1rem', resize: 'vertical' }}
                                />
                            </div>

                            {/* City */}
                            <div className="form-group" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                <label htmlFor="city" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--spacing-xs)', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                    <MapPin size={16} /> Şehir
                                </label>
                                <select
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(255, 255, 255, 0.6)', color: 'var(--color-text-primary)', fontSize: '1rem', cursor: 'pointer' }}
                                >
                                    <option value="Online">Online</option>
                                    {turkishCities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Ekstra Detaylar Section */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.4)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-lg)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent-primary)' }}>
                                <Hash size={20} /> Ekstra Detaylar
                            </h2>

                            {/* Member Count */}
                            <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label htmlFor="memberCount" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--spacing-xs)', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                    <Users size={16} /> Üye Sayısı (Opsiyonel)
                                </label>
                                <input
                                    id="memberCount"
                                    name="memberCount"
                                    type="number"
                                    value={formData.memberCount}
                                    onChange={handleChange}
                                    placeholder="Mevcut üye sayınız"
                                    min="0"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(255, 255, 255, 0.6)', color: 'var(--color-text-primary)', fontSize: '1rem' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xs)' }}>
                                {/* Instagram URL */}
                                <div className="form-group">
                                    <label htmlFor="instagramUrl" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--spacing-xs)', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                        <Instagram size={16} /> Instagram
                                    </label>
                                    <input
                                        id="instagramUrl"
                                        name="instagramUrl"
                                        type="url"
                                        value={formData.instagramUrl}
                                        onChange={handleChange}
                                        placeholder="https://instagram.com/..."
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(255, 255, 255, 0.6)', color: 'var(--color-text-primary)', fontSize: '1rem' }}
                                    />
                                </div>

                                {/* LinkedIn URL */}
                                <div className="form-group">
                                    <label htmlFor="linkedinUrl" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--spacing-xs)', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                        <Linkedin size={16} /> LinkedIn
                                    </label>
                                    <input
                                        id="linkedinUrl"
                                        name="linkedinUrl"
                                        type="url"
                                        value={formData.linkedinUrl}
                                        onChange={handleChange}
                                        placeholder="https://linkedin.com/company/..."
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(255, 255, 255, 0.6)', color: 'var(--color-text-primary)', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Categories (Admin style) */}
                        <div className="form-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '600' }}>Kategoriler (Birden fazla seçebilirsiniz)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
                                {categories.map(category => {
                                    const isActive = formData.categories.includes(category);
                                    return (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => handleCategoryToggle(category)}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '10px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                border: '1px solid',
                                                borderColor: isActive ? 'var(--color-accent-primary)' : 'rgba(139, 92, 246, 0.2)',
                                                background: isActive ? 'var(--color-accent-primary)' : 'rgba(255, 255, 255, 0.6)',
                                                color: isActive ? '#fff' : 'var(--color-accent-primary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }} />}
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-lg)' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/clubs')}
                                className="btn btn-secondary mentorship-btn-secondary"
                                style={{ flex: 1 }}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary mentorship-btn-primary"
                                disabled={loading}
                                style={{ flex: 2 }}
                            >
                                {loading ? 'Oluşturuluyor...' : 'Kulüp Başvurusunu Gönder'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClubCreatePage;
