import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Plus, Edit2, Trash2, X, Camera } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';
// Turkish cities import removed
const turkishCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli', 'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri', 'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın', 'Tekirdağ', 'Sakarya', 'Denizli', 'Muğla', 'Eskişehir', 'Mardin', 'Trabzon', 'Malatya', 'Ordu', 'Erzurum', 'Afyonkarahisar', 'Sivas', 'Adıyaman', 'Batman', 'Zonguldak', 'Tokat', 'Elazığ', 'Kütahya', 'Çanakkale', 'Osmaniye', 'Çorum', 'Şırnak', 'Ağrı', 'Giresun', 'Isparta', 'Aksaray', 'Yozgat', 'Edirne', 'Muş', 'Düzce', 'Kastamonu', 'Uşak', 'Niğde', 'Kırklareli', 'Bitlis', 'Rize', 'Amasya', 'Siirt', 'Bolu', 'Nevşehir', 'Yalova', 'Bingöl', 'Kırıkkale', 'Hakkari', 'Kars', 'Burdur', 'Karaman', 'Karabük', 'Kırşehir', 'Erzincan', 'Bilecik', 'Sinop', 'Iğdır', 'Bartın', 'Çankırı', 'Artvin', 'Gümüşhane', 'Kilis', 'Ardahan', 'Tunceli', 'Bayburt'].sort();

const ClubManagementPage = () => {
    const { user } = useAuth();
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [selectedClub, setSelectedClub] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const [allUsers, setAllUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedOfficials, setSelectedOfficials] = useState([]); // Array of user objects

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        city: 'İstanbul',
        categories: [],
        presidentId: null,
        memberCount: 0,
    });

    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

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

    useEffect(() => {
        const allowedRoles = ['admin', 'club_management', 'club_president'];
        if (user && allowedRoles.includes(user.role)) {
            fetchClubs();
            if (user.role === 'admin') {
                fetchUsers();
            }
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            const data = await api.getAdminUsers();
            setAllUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchClubs = async () => {
        try {
            setLoading(true);
            // If admin, fetch all. Otherwise fetch only managed.
            const data = user.role === 'admin' 
                ? await api.getClubs() 
                : await api.getManagedClubs();
            setClubs(data || []);
        } catch (error) {
            console.error('Error fetching clubs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setFormData({ name: '', description: '', city: 'İstanbul', categories: [], presidentId: null, instagramUrl: '', linkedinUrl: '' });
        setSelectedOfficials([]);
        setLogoFile(null);
        setLogoPreview(null);
        setShowModal(true);
    };

    const handleOpenEdit = async (club) => {
        setModalMode('edit');
        setSelectedClub(club);
        setFormData({
            name: club.name,
            description: club.description || '',
            city: club.city || 'İstanbul',
            categories: club.categories || [],
            presidentId: club.presidentId,
            memberCount: club.memberCount || 0,
            instagramUrl: club.instagramUrl || '',
            linkedinUrl: club.linkedinUrl || ''
        });
        setLogoPreview(club.logoUrl || null);
        setLogoFile(null);

        // Fetch officials
        try {
            const officials = await api.getClubOfficials(club.id);
            // Officials return as objects with { user: User, ... }
            setSelectedOfficials(officials.map(o => o.user));
        } catch (error) {
            console.error('Error fetching officials:', error);
            setSelectedOfficials([]);
        }

        setShowModal(true);
    };

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

    const handleAddOfficial = (user) => {
        if (selectedOfficials.find(o => o.id === user.id)) return;
        setSelectedOfficials([...selectedOfficials, user]);
        setUserSearchTerm('');
    };

    const handleRemoveOfficial = (userId) => {
        setSelectedOfficials(selectedOfficials.filter(o => o.id !== userId));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            alert('Kulüp adı gerekli');
            return;
        }

        setSaving(true);
        try {
            let clubId;
            if (modalMode === 'create') {
                const club = await api.createClub(formData);
                clubId = club.id;
                if (logoFile) {
                    const compressedLogo = await compressImage(logoFile, { maxWidth: 500, maxHeight: 500, quality: 0.7 });
                    await api.uploadClubLogo(clubId, compressedLogo);
                }
            } else {
                clubId = selectedClub.id;
                await api.updateClub(clubId, formData);
                if (logoFile) {
                    const compressedLogo = await compressImage(logoFile, { maxWidth: 500, maxHeight: 500, quality: 0.7 });
                    await api.uploadClubLogo(clubId, compressedLogo);
                }
            }

            // Save officials
            await api.updateClubOfficials(clubId, selectedOfficials.map(o => o.id));

            alert(`Kulüp başarıyla ${modalMode === 'create' ? 'oluşturuldu' : 'güncellendi'}!`);
            setShowModal(false);
            fetchClubs();
        } catch (error) {
            console.error('Error saving club:', error);
            alert('Hata: ' + (error.message || 'Kulüp kaydedilemedi'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (clubId) => {
        if (!confirm('Bu kulübü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            return;
        }

        try {
            await api.deleteClub(clubId);
            alert('Kulüp silindi');
            fetchClubs();
        } catch (error) {
            console.error('Error deleting club:', error);
            alert('Kulüp silinemedi: ' + error.message);
        }
    };

    const allowedRoles = ['admin', 'club_management', 'club_president'];
    if (!user || !allowedRoles.includes(user.role)) {
        return (
            <div className="page">
                <div className="container">
                    <p>Bu sayfaya erişim yetkiniz yok.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <h1>{user.role === 'admin' ? 'Tüm Kulüpler' : 'Yönettiğim Kulüpler'}</h1>
                    {user.role === 'admin' && (
                        <button className="btn btn-primary" onClick={handleOpenCreate}>
                            <Plus size={20} />
                            Yeni Kulüp Oluştur
                        </button>
                    )}
                </div>

                {loading ? (
                    <p>Yükleniyor...</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                        {clubs.map(club => (
                            <div key={club.id} className=" admin-list-item" style={{ padding: 'var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                                    <img
                                        src={club.logoUrl || 'https://via.placeholder.com/60'}
                                        alt={club.name}
                                        style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>{club.name}</h3>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)' }}>
                                            <span className="text-secondary">{club.city}</span>
                                            {club.president && (
                                                <span style={{ color: 'var(--color-primary)' }}>• Başkan: {club.president.name} {club.president.surname}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
                                    {club.description?.substring(0, 80)}{club.description?.length > 80 ? '...' : ''}
                                </p>

                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleOpenEdit(club)}
                                        style={{ flex: 1 }}
                                    >
                                        <Edit2 size={16} />
                                        Düzenle
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => handleDelete(club.id)}
                                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 'var(--spacing-lg)'
                    }}>
                        <div className="card" style={{
                            padding: 'var(--spacing-xl)',
                            maxWidth: '500px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                <h3 style={{ marginBottom: 0 }}>{modalMode === 'create' ? 'Yeni Kulüp Oluştur' : 'Kulüp Düzenle'}</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Logo */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    margin: '0 auto var(--spacing-lg)',
                                    borderRadius: 'var(--radius-xl)',
                                    border: '2px dashed var(--color-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    background: logoPreview ? `url(${logoPreview}) center/cover` : 'var(--color-bg-tertiary)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {!logoPreview && (
                                    <Camera size={32} color="var(--color-text-secondary)" />
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                style={{ display: 'none' }}
                            />

                            <div className="form-group">
                                <label htmlFor="name">Kulüp Adı *</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Kulüp adı"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Açıklama</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Kulüp açıklaması"
                                    rows={3}
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

                            {user.role === 'admin' && (
                                <div className="form-group">
                                    <label htmlFor="presidentId">Kulüp Başkanı *</label>
                                    <select
                                        id="presidentId"
                                        name="presidentId"
                                        value={formData.presidentId || ''}
                                        onChange={handleChange}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {allUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} {u.surname} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="memberCount">Üye Sayısı</label>
                                <input
                                    id="memberCount"
                                    name="memberCount"
                                    type="number"
                                    value={formData.memberCount}
                                    onChange={handleChange}
                                    placeholder="0"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="instagramUrl">Instagram Hesabı</label>
                                <input
                                    id="instagramUrl"
                                    name="instagramUrl"
                                    type="text"
                                    value={formData.instagramUrl}
                                    onChange={handleChange}
                                    placeholder="https://instagram.com/hesap"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="linkedinUrl">LinkedIn Hesabı</label>
                                <input
                                    id="linkedinUrl"
                                    name="linkedinUrl"
                                    type="text"
                                    value={formData.linkedinUrl}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/in/hesap"
                                />
                            </div>

                            <div className="form-group">
                                <label>Kategoriler</label>
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
                                                    borderColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                                    background: isActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(30, 41, 59, 0.4)',
                                                    color: isActive ? '#fff' : 'var(--color-text-secondary)',
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

                            {/* Officials Selection - Admin Only */}
                            {user.role === 'admin' && (
                                <div className="form-group" style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <label>Kulüp Yetkilileri</label>
                                    <div style={{ position: 'relative', marginBottom: 'var(--spacing-md)' }}>
                                        <input
                                            type="text"
                                            placeholder="Kullanıcı ara (isim veya email)..."
                                            value={userSearchTerm}
                                            onChange={(e) => setUserSearchTerm(e.target.value)}
                                            style={{ marginBottom: '4px' }}
                                        />
                                        {userSearchTerm.length > 1 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                background: 'var(--color-bg-secondary)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-md)',
                                                zIndex: 10,
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                            }}>
                                                {allUsers
                                                    .filter(u => 
                                                        (u.name + ' ' + u.surname).toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                                        u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                                                    )
                                                    .map(u => (
                                                        <div
                                                            key={u.id}
                                                            onClick={() => handleAddOfficial(u)}
                                                            style={{
                                                                padding: '10px 15px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid var(--color-bg-tertiary)',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                        >
                                                            <div>
                                                                <div style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>{u.name} {u.surname}</div>
                                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{u.email}</div>
                                                            </div>
                                                            <Plus size={16} color="var(--color-primary)" />
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                                        {selectedOfficials.map(official => (
                                            <div
                                                key={official.id} className=" admin-list-item" style={{
                                                    background: 'rgba(139, 92, 246, 0.1)',
                                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                                    color: 'var(--color-primary)',
                                                    padding: '4px 12px',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: 'var(--font-size-xs)',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                {official.name} {official.surname}
                                                <X
                                                    size={14}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleRemoveOfficial(official.id)}
                                                />
                                            </div>
                                        ))}
                                        {selectedOfficials.length === 0 && (
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                                                Henüz yetkili atanmadı.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setShowModal(false)}
                                    style={{ flex: 1 }}
                                >
                                    İptal
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    style={{ flex: 2 }}
                                >
                                    {saving ? 'Kaydediliyor...' : (modalMode === 'create' ? 'Oluştur' : 'Güncelle')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubManagementPage;
