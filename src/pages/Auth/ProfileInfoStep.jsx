import React from 'react';
import { Briefcase, MapPin, Camera, AlignLeft } from 'lucide-react';
import './Onboarding.css';

const turkishCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli', 'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri', 'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın', 'Tekirdağ', 'Sakarya', 'Denizli', 'Muğla', 'Eskişehir', 'Mardin', 'Trabzon', 'Malatya', 'Ordu', 'Erzurum', 'Afyonkarahisar', 'Sivas', 'Adıyaman', 'Batman', 'Zonguldak', 'Tokat', 'Elazığ', 'Kütahya', 'Çanakkale', 'Osmaniye', 'Çorum', 'Şırnak', 'Ağrı', 'Giresun', 'Isparta', 'Aksaray', 'Yozgat', 'Edirne', 'Muş', 'Düzce', 'Kastamonu', 'Uşak', 'Niğde', 'Kırklareli', 'Bitlis', 'Rize', 'Amasya', 'Siirt', 'Bolu', 'Nevşehir', 'Yalova', 'Bingöl', 'Kırıkkale', 'Hakkari', 'Kars', 'Burdur', 'Karaman', 'Karabük', 'Kırşehir', 'Erzincan', 'Bilecik', 'Sinop', 'Iğdır', 'Bartın', 'Çankırı', 'Artvin', 'Gümüşhane', 'Kilis', 'Ardahan', 'Tunceli', 'Bayburt'].sort();

const ProfileInfoStep = ({ profileInfo, onProfileInfoChange, isStandRegistration }) => {
    const fileInputRef = React.useRef(null);

    const handleChange = (field, value) => {
        onProfileInfoChange({
            ...profileInfo,
            [field]: value,
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 500;

                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    handleChange('profilePicture', compressedBase64);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const isValid = !!profileInfo.city;

    return (
        <div className="onboarding-content">
            <h2 className="step-title">Profilini Oluştur</h2>
            <p className="step-description">
                Seni daha iyi tanıyalım! İstersen bir profil fotoğrafı ekleyebilir, bulunduğun şehri, ünvanını ve kısaca kendini anlatan bir biyografi girebilirsin.
            </p>

            <div className="profile-photo-upload" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        position: 'relative',
                        width: '100px',
                        height: '100px',
                        margin: '0 auto',
                        borderRadius: '30%',
                        background: 'var(--color-subtle-bg)',
                        border: '2px dashed var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {profileInfo.profilePicture ? (
                        <img 
                            src={profileInfo.profilePicture} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            alt="Preview" 
                        />
                    ) : (
                        <Camera size={32} color="var(--color-text-secondary)" />
                    )}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'var(--color-bg-primary)',
                        padding: '4px 0',
                        fontSize: '10px',
                        color: 'var(--color-text-primary)'
                    }}>
                        {profileInfo.profilePicture ? 'Değiştir' : 'Ekle'}
                    </div>
                </div>
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                    style={{ display: 'none' }} 
                />
                <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '8px', display: 'block' }}>(Opsiyonel)</span>
            </div>

            <div className="profile-form">
                {isStandRegistration && (
                    <>
                        <div className="form-group-modern">
                            <label htmlFor="name" className="form-label-modern">
                                <span style={{ fontSize: '18px' }}>👤</span>
                                <span>Ad</span>
                                <span className="required-mark">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                className="form-input-modern"
                                placeholder="Adınızı girin"
                                value={profileInfo.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                        </div>

                        <div className="form-group-modern">
                            <label htmlFor="surname" className="form-label-modern">
                                <span style={{ fontSize: '18px' }}>👤</span>
                                <span>Soyad</span>
                                <span className="required-mark">*</span>
                            </label>
                            <input
                                id="surname"
                                type="text"
                                className="form-input-modern"
                                placeholder="Soyadınızı girin"
                                value={profileInfo.surname || ''}
                                onChange={(e) => handleChange('surname', e.target.value)}
                            />
                        </div>
                    </>
                )}

                <div className="form-group-modern">
                    <label htmlFor="city" className="form-label-modern">
                        <MapPin size={18} />
                        <span>Şehir</span>
                        <span className="required-mark">*</span>
                    </label>
                    <input
                        id="city"
                        list="turkish-cities"
                        className="form-input-modern city-select"
                        placeholder="Şehir yazın veya seçin"
                        value={profileInfo.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        autoComplete="off"
                    />
                    <datalist id="turkish-cities">
                        {turkishCities.map((city) => (
                            <option key={city} value={city} />
                        ))}
                    </datalist>
                </div>

                <div className="form-group-modern">
                    <label htmlFor="phone" className="form-label-modern">
                        <span style={{ fontSize: '18px' }}>📱</span>
                        <span>Telefon Numarası</span>
                        {isStandRegistration ? (
                            <span className="required-mark">*</span>
                        ) : (
                            <span className="optional-mark">(opsiyonel)</span>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginLeft: '4px', fontWeight: 'normal' }}>
                            (WhatsApp grubu için)
                        </span>
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        className="form-input-modern"
                        placeholder="Örn: 05551234567"
                        value={profileInfo.phone || ''}
                        onChange={(e) => handleChange('phone', e.target.value)}
                    />
                </div>

                <div className="form-group-modern">
                    <label htmlFor="title" className="form-label-modern">
                        <Briefcase size={18} />
                        <span>Ünvan</span>
                        <span className="optional-mark">(opsiyonel)</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        className="form-input-modern"
                        placeholder="Örn: Yazılım Geliştirici, Öğrenci, vb."
                        value={profileInfo.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                    />
                </div>

                <div className="form-group-modern">
                    <label htmlFor="bio" className="form-label-modern">
                        <AlignLeft size={18} />
                        <span>Hakkımda (Biyografi)</span>
                        <span className="optional-mark">(opsiyonel)</span>
                    </label>
                    <textarea
                        id="bio"
                        className="form-input-modern"
                        placeholder="Kendinden, yeteneklerinden veya hedeflerinden kısaca bahset..."
                        value={profileInfo.bio || ''}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        rows="3"
                        style={{ resize: 'vertical', minHeight: '80px' }}
                    />
                </div>

                {!isValid && (
                    <div className="form-hint">
                        <span>⚠️</span>
                        <span>Şehir seçimi zorunludur</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileInfoStep;

