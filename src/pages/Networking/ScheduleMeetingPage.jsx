import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Globe, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import Toast from '../../components/Toast';

const ScheduleMeetingPage = () => {
    // Support both /connections/:connectionId/schedule and /users/:targetUserId/schedule
    const { connectionId, targetUserId } = useParams();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [toastConfig, setToastConfig] = useState({ isOpen: false, message: '', type: 'success' });

    const [formData, setFormData] = useState({
        dateTime: '',
        motivation: '',
        notes: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent duplicate submissions
        if (submitting) return;

        if (!formData.dateTime) {
            setToastConfig({ isOpen: true, message: 'Lütfen bir tarih ve saat seçin', type: 'error' });
            return;
        }

        if (!formData.motivation.trim()) {
            setToastConfig({ isOpen: true, message: 'Lütfen görüşme motivasyonunuzu yazın', type: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            if (connectionId) {
                // Existing connection flow
                await api.scheduleMeeting({
                    connectionId: parseInt(connectionId),
                    scheduledDate: new Date(formData.dateTime),
                    location: 'Online',
                    isOnline: true,
                    motivation: formData.motivation.trim(),
                    notes: formData.notes,
                });
            } else {
                // Direct flow (no connection required)
                await api.scheduleMeetingDirect({
                    targetUserId: parseInt(targetUserId),
                    scheduledDate: new Date(formData.dateTime),
                    location: 'Online',
                    isOnline: true,
                    motivation: formData.motivation.trim(),
                    notes: formData.notes,
                });
            }
            // Navigate to requests tab after scheduling
            navigate('/network/connections?tab=requests', { state: { toast: 'Toplantı başarıyla planlandı! 🎉' } });
        } catch (error) {
            setToastConfig({ isOpen: true, message: error.message || 'Toplantı planlanamadı', type: 'error' });
            setSubmitting(false);
        }
    };

    return (
        <div className="page" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 'var(--spacing-xl)',
            paddingBottom: 'calc(80px + var(--spacing-xl))',
            background: 'var(--color-bg-primary)'
        }}>
            <style>{`
                .schedule-glass-card {
                    background: linear-gradient(150deg, #ffffff 0%, #f5f3ff 40%, #e9d5ff 100%);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border-radius: 28px;
                    padding: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.9);
                    box-shadow: 0 20px 40px -12px rgba(109, 40, 217, 0.15);
                    position: relative;
                    overflow: hidden;
                }
                .schedule-form-section {
                    background: rgba(255, 255, 255, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    padding: 16px;
                    border-radius: 16px;
                }
                .schedule-input {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.9);
                    border: 1px solid rgba(147, 51, 234, 0.15);
                    border-radius: 12px;
                    color: #4c1d95;
                    font-size: 0.95rem;
                    font-weight: 500;
                    outline: none;
                    transition: all 0.2s;
                }
                .schedule-input:focus {
                    border-color: #9333ea;
                    box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
                }
                .schedule-input::placeholder {
                    color: rgba(76, 29, 149, 0.4);
                }
                input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                    filter: invert(0.2) sepia(1) saturate(5) hue-rotate(250deg);
                    cursor: pointer;
                }
                .schedule-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 8px;
                    font-weight: 700;
                    color: #4c1d95;
                    font-size: 0.9rem;
                }
                .schedule-info-box {
                    background: rgba(147, 51, 234, 0.05);
                    border: 1px dashed rgba(147, 51, 234, 0.2);
                    padding: 12px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .schedule-submit-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #9333ea, #4c1d95);
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 8px 20px rgba(109, 40, 217, 0.2);
                    transition: all 0.2s;
                }
                .schedule-submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 24px rgba(109, 40, 217, 0.3);
                }
                .schedule-submit-btn:disabled {
                    background: #a78bfa;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                .schedule-cancel-btn {
                    width: 100%;
                    padding: 14px;
                    background: transparent;
                    color: #6b21a8;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .schedule-cancel-btn:hover {
                    background: rgba(147, 51, 234, 0.05);
                }
            `}</style>
            
            <div className="container" style={{ width: '100%', maxWidth: '480px' }}>
                <div className="schedule-glass-card">
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            background: 'linear-gradient(135deg, #9333ea, #4c1d95)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            boxShadow: '0 8px 20px rgba(109, 40, 217, 0.25)',
                            transform: 'rotate(-3deg)'
                        }}>
                            <Calendar size={28} color="#ffffff" />
                        </div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '4px', color: '#4c1d95', letterSpacing: '-0.5px' }}>Toplantı Planla</h1>
                        <p style={{ fontSize: '0.9rem', color: '#6b21a8', margin: 0, fontWeight: '500' }}>
                            Fikirlerini paylaşmak için harika bir zaman!
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Date Time Section */}
                        <div className="schedule-form-section">
                            <label htmlFor="dateTime" className="schedule-label">
                                <Calendar size={16} color="#9333ea" />
                                Tarih ve Saat *
                            </label>
                            <input
                                id="dateTime"
                                name="dateTime"
                                type="datetime-local"
                                value={formData.dateTime}
                                onChange={handleChange}
                                required
                                className="schedule-input"
                            />
                        </div>

                        {/* Location Info Section */}
                        <div className="schedule-info-box">
                            <div style={{ 
                                width: '32px', height: '32px', 
                                background: '#ffffff', borderRadius: '50%', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                boxShadow: '0 4px 10px rgba(109, 40, 217, 0.05)',
                                flexShrink: 0
                            }}>
                                <Globe size={16} color="#9333ea" />
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b21a8', lineHeight: '1.3', fontWeight: '500' }}>
                                <strong style={{ color: '#9333ea' }}>Online Görüşme:</strong> Tüm görüşmeler platform üzerinden gerçekleşir.
                            </p>
                        </div>

                        {/* Motivation Section */}
                        <div className="schedule-form-section">
                            <label htmlFor="motivation" className="schedule-label">
                                <MessageSquare size={16} color="#9333ea" />
                                Motivasyonunuz *
                            </label>
                            <textarea
                                id="motivation"
                                name="motivation"
                                value={formData.motivation}
                                onChange={handleChange}
                                placeholder="Örn: Yapay zeka projeleri hakkında fikir alışverişi..."
                                rows={2}
                                required
                                className="schedule-input"
                                style={{ resize: 'vertical', minHeight: '60px' }}
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="schedule-submit-btn"
                            >
                                {submitting ? (
                                    <>
                                        <div className="loading-spinner-small" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', margin: 0 }}></div>
                                        Planlanıyor...
                                    </>
                                ) : (
                                    <>
                                        <Calendar size={18} /> Planla
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/network/connections')}
                                disabled={submitting}
                                className="schedule-cancel-btn"
                            >
                                İptal Et
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {toastConfig.isOpen && (
                <Toast
                    message={toastConfig.message}
                    type={toastConfig.type}
                    onClose={() => setToastConfig({ ...toastConfig, isOpen: false })}
                />
            )}
        </div>
    );
};

export default ScheduleMeetingPage;
