import React from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Trophy } from 'lucide-react';
import './CompetitionCard.css';

const CompetitionCard = ({ competition, onJoinClick, submissionStatus }) => {
    const formatDeadlineDate = (deadline) => {
        const date = new Date(deadline);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatDeadlineTime = (deadline) => {
        const date = new Date(deadline);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getButtonConfig = () => {
        switch (submissionStatus) {
            case 'pending':
                return {
                    text: 'İnceleme Devam Ediyor',
                    icon: <Clock size={16} />,
                    className: 'comp-btn-pending',
                    disabled: true,
                };
            case 'approved':
                return {
                    text: 'Yarışmaya Katılındı ✓',
                    icon: <CheckCircle size={16} />,
                    className: 'comp-btn-approved',
                    disabled: true,
                };
            case 'rejected':
                return {
                    text: 'Başvuru Reddedildi',
                    icon: <XCircle size={16} />,
                    className: 'comp-btn-rejected',
                    disabled: true,
                };
            default:
                if (new Date(competition.deadline) < new Date()) {
                    return {
                        text: 'Tarihi Geçti',
                        icon: <XCircle size={16} />,
                        className: 'comp-btn-rejected',
                        disabled: true,
                    };
                }
                return {
                    text: 'Katıl',
                    icon: null,
                    className: 'comp-btn-default',
                    disabled: false,
                };
        }
    };

    const buttonConfig = getButtonConfig();
    const title = competition.title || competition.name;
    const getValidImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) return url;
        return null;
    };

    const imageUrl = getValidImageUrl(competition.imageUrl) || getValidImageUrl(competition.posterImage) || getValidImageUrl(competition.image);

    return (
        <div className="comp-card">
            {/* Competition Image / Gradient Header */}
            {imageUrl ? (
                <div className="comp-card-image">
                    <img src={imageUrl} alt={title} />
                    <div className="comp-card-image-overlay" />
                    <div className="comp-card-badges">
                        {competition.isOnline
                            ? <span className="comp-card-badge comp-badge-online">🌐 Online</span>
                            : <span className="comp-card-badge comp-badge-offline">🏢 Yüz Yüze</span>
                        }
                        {competition.category && (
                            <span className="comp-card-badge">{competition.category}</span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="comp-card-gradient-header">
                    <Trophy size={32} color="rgba(255,255,255,0.3)" />
                    <div className="comp-card-badges">
                        {competition.isOnline
                            ? <span className="comp-card-badge comp-badge-online">🌐 Online</span>
                            : <span className="comp-card-badge comp-badge-offline">🏢 Yüz Yüze</span>
                        }
                        {competition.category && (
                            <span className="comp-card-badge">{competition.category}</span>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="comp-card-content">
                {/* Title */}
                <h3 className="comp-card-title">{title}</h3>

                {/* Description */}
                <p className="comp-card-desc">
                    {competition.description}
                </p>

                {/* Deadline */}
                <div className="comp-card-deadline">
                    <Calendar size={15} />
                    <span>Son Başvuru: <strong>{formatDeadlineDate(competition.deadline)}</strong></span>
                    <span className="comp-card-deadline-divider">•</span>
                    <Clock size={15} />
                    <span><strong>{formatDeadlineTime(competition.deadline)}</strong></span>
                </div>

                {/* Prize */}
                {competition.prize && (
                    <div className="comp-card-prize">
                        🏆 {competition.prize}
                    </div>
                )}

                {/* Join Button */}
                <button
                    className={`comp-card-btn ${buttonConfig.className}`}
                    onClick={() => !buttonConfig.disabled && onJoinClick(competition)}
                    disabled={buttonConfig.disabled}
                >
                    {buttonConfig.icon}
                    {buttonConfig.text}
                </button>
            </div>
        </div>
    );
};

export default CompetitionCard;
