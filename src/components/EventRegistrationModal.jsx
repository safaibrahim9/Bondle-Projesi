import React, { useState } from 'react';
import { X, Send, User, Phone, GraduationCap, BookOpen, School, Star, MessageSquare, Lock } from 'lucide-react';
import './EventRegistrationModal.css';

const EventRegistrationModal = ({ event, user, onClose, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        firstName: user?.name || '',
        lastName: user?.surname || '',
        email: user?.email || '',
        phone: '',
        university: '',
        department: '',
        classLevel: '',
        motivation: '',
        expectations: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 11) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container registration-modal">
                <div className="modal-header">
                    <div>
                        <h2>Etkinlik Kayıt Formu</h2>
                        <p className="subtitle">{event.title}</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-section">
                        <h3>Kişisel Bilgiler</h3>
                        <p style={{ 
                            fontSize: '12px', 
                            color: 'var(--color-text-secondary)', 
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Lock size={12} />
                            Ad, soyad ve e-posta bilgileriniz hesabınızdan otomatik getirilmektedir.
                        </p>
                        <div className="form-grid">
                            <div className="form-group">
                                <label><User size={16} /> İsim</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    readOnly
                                    style={{ 
                                        opacity: 0.7, 
                                        cursor: 'not-allowed',
                                        background: 'var(--color-subtle-bg)',
                                        borderColor: 'var(--color-subtle-border)'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label><User size={16} /> Soyisim</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    readOnly
                                    style={{ 
                                        opacity: 0.7, 
                                        cursor: 'not-allowed',
                                        background: 'var(--color-subtle-bg)',
                                        borderColor: 'var(--color-subtle-border)'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label><MessageSquare size={16} /> Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    readOnly
                                    style={{ 
                                        opacity: 0.7, 
                                        cursor: 'not-allowed',
                                        background: 'var(--color-subtle-bg)',
                                        borderColor: 'var(--color-subtle-border)'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label><Phone size={16} /> Telefon Numarası</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="05xx xxx xx xx"
                                    minLength="10"
                                    maxLength="11"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Eğitim Bilgileri</h3>
                        <div className="form-group">
                            <label><School size={16} /> Üniversite</label>
                            <input
                                type="text"
                                name="university"
                                value={formData.university}
                                onChange={handleChange}
                                placeholder="Üniversiteniz"
                                required
                            />
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label><BookOpen size={16} /> Bölüm</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="Bölümünüz"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label><GraduationCap size={16} /> Sınıf</label>
                                <select
                                    name="classLevel"
                                    value={formData.classLevel}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="Hazırlık">Hazırlık</option>
                                    <option value="1. Sınıf">1. Sınıf</option>
                                    <option value="2. Sınıf">2. Sınıf</option>
                                    <option value="3. Sınıf">3. Sınıf</option>
                                    <option value="4. Sınıf">4. Sınıf</option>
                                    <option value="Mezun">Mezun</option>
                                    <option value="Yüksek Lisans / Doktora">Yüksek Lisans / Doktora</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Başvuru Detayları</h3>
                        <div className="form-group">
                            <label><Star size={16} /> Etkinliğe Katılma Motivasyonunuz</label>
                            <textarea
                                name="motivation"
                                value={formData.motivation}
                                onChange={handleChange}
                                placeholder="Neden bu etkinliğe katılmak istiyorsunuz? Elemeler bu alana göre yapılacaktır."
                                required
                                rows={4}
                            />
                        </div>
                        <div className="form-group">
                            <label><MessageSquare size={16} /> Etkinlikten Beklentileriniz</label>
                            <textarea
                                name="expectations"
                                value={formData.expectations}
                                onChange={handleChange}
                                placeholder="Bu etkinlikten neler öğrenmeyi veya kazanmayı umuyorsunuz?"
                                required
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="modal-btn-cancel" onClick={onClose} disabled={loading}>
                            İptal
                        </button>
                        <button type="submit" className="modal-btn-submit" disabled={loading}>
                            {loading ? 'Gönderiliyor...' : (
                                <>
                                    <Send size={18} />
                                    Hemen Başvur
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventRegistrationModal;
