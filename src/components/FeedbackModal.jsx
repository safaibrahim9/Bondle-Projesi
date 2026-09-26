import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import './FeedbackModal.css';

const FeedbackModal = ({ event, onClose }) => {
    const { submitFeedback } = useEvents();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [suggestions, setSuggestions] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (rating === 0) {
            alert('Lütfen bir puan verin');
            return;
        }

        submitFeedback(event.id, {
            rating,
            comment,
            suggestions,
        });

        onClose();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && null}>
            <div className="modal-content feedback-modal">
                <div className="feedback-modal-header">
                    <h2>Etkinlik Geri Bildirimi</h2>
                    <p className="text-secondary">
                        Devam etmek için lütfen geri bildiriminizi paylaşın
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="feedback-form">
                    <div className="form-group">
                        <label>Etkinliği Değerlendirin *</label>
                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`star ${rating >= star ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="comment">Yorumunuz</label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Etkinlik hakkında düşünceleriniz..."
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="suggestions">Öneriler</label>
                        <textarea
                            id="suggestions"
                            value={suggestions}
                            onChange={(e) => setSuggestions(e.target.value)}
                            placeholder="Gelecek etkinlikler için önerileriniz..."
                        />
                    </div>

                    <div className="feedback-modal-actions">
                        <button type="submit" className="btn btn-primary btn-lg">
                            Gönder ve Devam Et
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
