import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const EventFeedbackPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            alert('Lütfen bir puan verin');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`http://localhost:3001/api/events/${id}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    userName: user ? `${user.name} ${user.surname}` : 'Anonim',
                    feedback,
                    rating,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Geri bildirim gönderilemedi');
            }

            alert('Geri bildiriminiz başarıyla gönderildi! Teşekkürler 🎉');
            navigate('/events');
        } catch (err) {
            alert(err.message || 'Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <h1>Etkinlik Geri Bildirimi</h1>
                    <p className="text-secondary" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        Etkinlik hakkındaki görüşlerinizi bizimle paylaşın
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        <div>
                            <label>Puanınız *</label>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)', margin: 'var(--spacing-md) 0' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        style={{ fontSize: '2.5rem', background: 'none', border: 'none', color: rating >= star ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)', cursor: 'pointer', transition: 'all 0.15s' }}
                                        onClick={() => setRating(star)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="feedback">Görüşleriniz *</label>
                            <textarea
                                id="feedback"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Etkinlik hakkında düşünceleriniz..."
                                required
                                rows="6"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={submitting}
                        >
                            {submitting ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EventFeedbackPage;
