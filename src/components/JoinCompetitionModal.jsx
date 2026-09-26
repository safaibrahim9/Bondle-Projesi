import React, { useState } from 'react';
import { X, Trophy, Send } from 'lucide-react';

const JoinCompetitionModal = ({ competition, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        phone: '',
        university: '',
        department: '',
        motivation: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Ad zorunlu';
        if (!formData.surname.trim()) newErrors.surname = 'Soyad zorunlu';
        if (!formData.email.trim()) newErrors.email = 'Email zorunlu';
        if (!formData.phone.trim()) newErrors.phone = 'Telefon zorunlu';
        if (!formData.university.trim()) newErrors.university = 'Üniversite zorunlu';
        if (!formData.department.trim()) newErrors.department = 'Bölüm zorunlu';
        if (!formData.motivation.trim()) {
            newErrors.motivation = 'Motivasyon zorunlu';
        } else if (formData.motivation.trim().length < 20) {
            newErrors.motivation = 'En az 20 karakter yazın';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            setFormData({ name: '', surname: '', email: '', phone: '', university: '', department: '', motivation: '' });
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000,
        }} onClick={onClose}>
            <div
                className="card"
                style={{
                    maxWidth: '440px',
                    width: '100%',
                    padding: '28px',
                    position: 'relative',
                    animation: 'fadeIn 0.2s ease',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                    }}
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Trophy size={20} color="#fff" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px' }}>Yarışmaya Başvur</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            {competition.name}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Name + Surname Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block', color: 'var(--color-text-secondary)' }}>
                                Ad
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Adınız"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: errors.name ? '1px solid #ef4444' : '1px solid var(--color-border, rgba(255,255,255,0.1))',
                                    background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.name}</p>}
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block', color: 'var(--color-text-secondary)' }}>
                                Soyad
                            </label>
                            <input
                                type="text"
                                name="surname"
                                value={formData.surname}
                                onChange={handleChange}
                                placeholder="Soyadınız"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: errors.surname ? '1px solid #ef4444' : '1px solid var(--color-border, rgba(255,255,255,0.1))',
                                    background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {errors.surname && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.surname}</p>}
                        </div>
                    </div>

                    {/* Email + Phone Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block', color: 'var(--color-text-secondary)' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ornek@mail.com"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: errors.email ? '1px solid #ef4444' : '1px solid var(--color-border, rgba(255,255,255,0.1))',
                                    background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.email}</p>}
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block', color: 'var(--color-text-secondary)' }}>
                                Telefon
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="05XX XXX XX XX"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: errors.phone ? '1px solid #ef4444' : '1px solid var(--color-border, rgba(255,255,255,0.1))',
                                    background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {errors.phone && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.phone}</p>}
                        </div>
                    </div>

                    {/* University + Department Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block', color: 'var(--color-text-secondary)' }}>
                                Üniversite
                            </label>
                            <input
                                type="text"
                                name="university"
                                value={formData.university}
                                onChange={handleChange}
                                placeholder="Üniversiteniz"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: errors.university ? '1px solid #ef4444' : '1px solid var(--color-border, rgba(255,255,255,0.1))',
                                    background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {errors.university && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.university}</p>}
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block', color: 'var(--color-text-secondary)' }}>
                                Bölüm
                            </label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                placeholder="Bölümünüz"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: errors.department ? '1px solid #ef4444' : '1px solid var(--color-border, rgba(255,255,255,0.1))',
                                    background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {errors.department && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.department}</p>}
                        </div>
                    </div>

                    {/* Motivation */}
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block', color: 'var(--color-text-secondary)' }}>
                            Neden katılmak istiyorsun?
                        </label>
                        <textarea
                            name="motivation"
                            value={formData.motivation}
                            onChange={handleChange}
                            placeholder="Kısa bir motivasyon yazınız..."
                            rows={3}
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: errors.motivation ? '1px solid #ef4444' : '1px solid var(--color-border, rgba(255,255,255,0.1))',
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-primary)',
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'vertical',
                                minHeight: '80px',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            {errors.motivation
                                ? <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>{errors.motivation}</p>
                                : <span />
                            }
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                {formData.motivation.length} karakter
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
                                background: 'transparent',
                                color: 'var(--color-text-secondary)',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                            }}
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                flex: 2,
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                        >
                            {isSubmitting ? 'Gönderiliyor...' : (
                                <>
                                    <Send size={16} />
                                    Başvur
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JoinCompetitionModal;
