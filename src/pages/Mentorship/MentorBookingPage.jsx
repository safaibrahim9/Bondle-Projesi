import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
const getMentorById = () => null; // Mock mentors removed
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import Toast from '../../components/Toast';

const MentorBookingPage = () => {
    const { id } = useParams();
    const mentor = getMentorById(parseInt(id));
    const [selectedSlot, setSelectedSlot] = useState('');
    const [message, setMessage] = useState('');
    const [toastConfig, setToastConfig] = useState({ isOpen: false, message: '', type: 'success' });

    if (!mentor) return <div className="page"><div className="container"><p>Mentör bulunamadı</p></div></div>;

    const handleBook = () => {
        if (!selectedSlot) {
            setToastConfig({ isOpen: true, message: 'Lütfen bir zaman dilimi seçin', type: 'error' });
            return;
        }

        if (mentor.isPaid) {
            window.open('https://www.shopier.com/BondleX', '_blank');
            setToastConfig({ isOpen: true, message: 'Ödeme sonrası mentorluk seansınız planlanacak.', type: 'info' });
        } else {
            setToastConfig({ isOpen: true, message: `${mentor.name} ile ${selectedSlot} tarihinde mentorluk seansınız oluşturuldu!`, type: 'success' });
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
                        <img src={mentor.photo} alt={mentor.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                            <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>{mentor.name}</h1>
                            <p className="text-secondary">{mentor.area}</p>
                            {mentor.isPaid && (
                                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                                    <span className="badge badge-paid">₺{mentor.price}/seans</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <h3>Uzmanlık Alanları</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                            {mentor.expertise.map((exp) => (
                                <span key={exp} style={{ padding: 'var(--spacing-xs) var(--spacing-md)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)' }}>
                                    {exp}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <h3>
                            <Calendar size={20} style={{ display: 'inline', marginRight: 'var(--spacing-sm)' }} />
                            Müsait Saatler
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                            {mentor.availability.map((slot) => (
                                <label key={slot} style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-md)', background: selectedSlot === slot ? 'rgba(147, 51, 234, 0.1)' : 'var(--color-bg-secondary)', border: selectedSlot === slot ? '2px solid #6b21a8' : '2px solid transparent', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="slot"
                                        value={slot}
                                        checked={selectedSlot === slot}
                                        onChange={(e) => setSelectedSlot(e.target.value)}
                                        style={{ marginRight: 'var(--spacing-md)' }}
                                    />
                                    <Clock size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
                                    {slot}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <label htmlFor="message">Mesajınız (Opsiyonel)</label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Mentörünüze kısa bir mesaj bırakın..."
                            rows={4}
                        />
                    </div>

                    <button className="btn btn-primary btn-lg mentorship-btn-primary" onClick={handleBook} style={{ width: '100%' }}>
                        {mentor.isPaid ? (
                            <>
                                <ExternalLink size={20} />
                                Ödeme Yap ve Rezervasyon Oluştur
                            </>
                        ) : (
                            'Rezervasyon Oluştur'
                        )}
                    </button>
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

export default MentorBookingPage;
