import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Toast from '../../components/Toast';
import { Camera, ArrowRight, ArrowLeft } from 'lucide-react';
// Turkish cities import removed
const turkishCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli', 'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri', 'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın', 'Tekirdağ', 'Sakarya', 'Denizli', 'Muğla', 'Eskişehir', 'Mardin', 'Trabzon', 'Malatya', 'Ordu', 'Erzurum', 'Afyonkarahisar', 'Sivas', 'Adıyaman', 'Batman', 'Zonguldak', 'Tokat', 'Elazığ', 'Kütahya', 'Çanakkale', 'Osmaniye', 'Çorum', 'Şırnak', 'Ağrı', 'Giresun', 'Isparta', 'Aksaray', 'Yozgat', 'Edirne', 'Muş', 'Düzce', 'Kastamonu', 'Uşak', 'Niğde', 'Kırklareli', 'Bitlis', 'Rize', 'Amasya', 'Siirt', 'Bolu', 'Nevşehir', 'Yalova', 'Bingöl', 'Kırıkkale', 'Hakkari', 'Kars', 'Burdur', 'Karaman', 'Karabük', 'Kırşehir', 'Erzincan', 'Bilecik', 'Sinop', 'Iğdır', 'Bartın', 'Çankırı', 'Artvin', 'Gümüşhane', 'Kilis', 'Ardahan', 'Tunceli', 'Bayburt'].sort();
import './Onboarding.css';

const ClubOnboarding = () => {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const fileInputRef = useRef(null);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        city: 'İstanbul',
        categories: [],
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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleCategoryToggle = (category) => {
        const newCategories = formData.categories.includes(category)
            ? formData.categories.filter(c => c !== category)
            : [...formData.categories, category];
        setFormData({ ...formData, categories: newCategories });
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

    const handleNext = () => {
        if (step === 1 && formData.name && formData.description) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async () => {
        if (!logoFile) {
            setToast({ type: 'error', message: 'Lütfen kulüp logosu yükleyin' });
            return;
        }

        setLoading(true);
        try {
            const club = await api.createClub(formData);
            console.log('Club created:', club);

            await api.uploadClubLogo(club.id, logoFile);
            console.log('Logo uploaded');

            await updateUser();

            setToast({ type: 'success', message: 'Kulübünüz başarıyla oluşturuldu! 🎉' });
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error) {
            console.error('Club onboarding error:', error);
            setToast({ type: 'error', message: 'Kulüp oluşturulurken hata oluştu: ' + (error.message || 'Bilinmeyen hata') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-page club-onboarding">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="onboarding-container">
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <h1>Kulüp Bilgilerini Gir</h1>
                    <p className="text-secondary">Adım {step}/2</p>
                </div>

                <div style={{
                    width: '100%',
                    height: '4px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-full)',
                    marginBottom: 'var(--spacing-xl)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${(step / 2) * 100}%`,
                        height: '100%',
                        background: 'var(--color-accent-primary)',
                        transition: 'width 0.3s ease'
                    }} />
                </div>

                {step === 1 && (
                    <div className="onboarding-step">
                        <div className="form-group">
                            <label htmlFor="name">Kulüp Adı *</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Örn: Bilgisayar Kulübü"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Kulüp Açıklaması *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Kulübünüz hakkında kısaca bilgi verin..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="city">Şehir</label>
                            <select
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                            >
                                {turkishCities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Kategoriler (En az 1 seçin)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        type="button"
                                        className={`interest-option ${formData.categories.includes(category) ? 'active' : ''}`}
                                        onClick={() => handleCategoryToggle(category)}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleNext}
                            disabled={!formData.name || !formData.description}
                            style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
                        >
                            Devam Et
                            <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="onboarding-step">
                        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h3>Kulüp Logosu</h3>
                            <p className="text-secondary">Kulübünüzü temsil edecek bir logo yükleyin</p>
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '200px',
                                height: '200px',
                                margin: '0 auto var(--spacing-xl)',
                                borderRadius: 'var(--radius-xl)',
                                border: '2px dashed var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: logoPreview ? `url(${logoPreview}) center/cover` : 'var(--color-bg-secondary)',
                                position: 'relative',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                            }}
                        >
                            {!logoPreview && (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    <Camera size={48} style={{ marginBottom: 'var(--spacing-sm)' }} />
                                    <p>Logo Yükle</p>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            style={{ display: 'none' }}
                        />

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={handleBack}
                                style={{ flex: 1 }}
                            >
                                <ArrowLeft size={20} />
                                Geri
                            </button>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleSubmit}
                                disabled={loading || !logoFile}
                                style={{ flex: 2 }}
                            >
                                {loading ? 'Kaydediliyor...' : 'Kulübü Oluştur'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubOnboarding;
