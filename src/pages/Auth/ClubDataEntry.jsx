import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Users, Calendar, Info, ArrowRight } from 'lucide-react';
import './AuthPages.css';

const ClubDataEntry = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        memberCount: '',
        eventCount: '',
        clubInfo: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.updateProfile({
                memberCount: parseInt(formData.memberCount),
                eventCount: parseInt(formData.eventCount),
                clubInfo: formData.clubInfo,
                onboardingComplete: true
            });

            await updateUser(); // Refresh local user state
            navigate('/');
        } catch (error) {
            console.error('Club data update failed:', error);
            alert('Veriler güncellenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Kulüp Detayları</h1>
                    <p className="text-secondary">Kulübünüz hakkındaki istatistikleri ve bilgileri paylaşın.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="memberCount">
                            <Users size={16} style={{ display: 'inline', marginRight: '8px' }} />
                            Üye Sayısı
                        </label>
                        <input
                            id="memberCount"
                            name="memberCount"
                            type="number"
                            min="0"
                            value={formData.memberCount}
                            onChange={handleChange}
                            placeholder="Örn: 150"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="eventCount">
                            <Calendar size={16} style={{ display: 'inline', marginRight: '8px' }} />
                            Gerçekleştirilen Etkinlik Sayısı
                        </label>
                        <input
                            id="eventCount"
                            name="eventCount"
                            type="number"
                            min="0"
                            value={formData.eventCount}
                            onChange={handleChange}
                            placeholder="Örn: 12"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="clubInfo">
                            <Info size={16} style={{ display: 'inline', marginRight: '8px' }} />
                            Kulüp Hakkında
                        </label>
                        <textarea
                            id="clubInfo"
                            name="clubInfo"
                            value={formData.clubInfo}
                            onChange={handleChange}
                            placeholder="Kulübünüzün misyonu, vizyonu ve faaliyetleri hakkında bilgi verin..."
                            rows={5}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? 'Kaydediliyor...' : 'Tamamla'}
                        <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClubDataEntry;
