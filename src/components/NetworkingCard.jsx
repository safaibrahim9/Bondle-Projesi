import React from 'react';
import { X, Heart, MapPin, Briefcase, Star } from 'lucide-react';
import './NetworkingCard.css';

const NetworkingCard = ({ user, onAccept, onReject }) => {
    if (!user) return null;

    return (
        <div className="networking-card">
            <div className="networking-card-content card">
                <div className="networking-card-image">
                    <div className="networking-card-avatar">
                        {user.name.charAt(0)}
                    </div>
                </div>

                <div className="networking-card-info">
                    <h2 className="networking-card-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        {user.name}
                        {user.isPremium && (
                            <Star
                                size={20}
                                fill="#fbbf24"
                                color="#fbbf24"
                                title="Premium Üye"
                            />
                        )}
                    </h2>

                    {user.city && (
                        <div className="networking-card-meta-item">
                            <MapPin size={16} />
                            <span>{user.city}</span>
                        </div>
                    )}

                    {user.clubAffiliation && (
                        <div className="networking-card-meta-item">
                            <Briefcase size={16} />
                            <span>{user.clubAffiliation}</span>
                        </div>
                    )}

                    {user.bio && (
                        <p className="networking-card-bio">{user.bio}</p>
                    )}

                    {user.interests && user.interests.length > 0 && (
                        <div className="networking-card-interests">
                            {user.interests.map((interest) => (
                                <span key={interest} className="interest-tag">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="networking-card-actions">
                <button
                    className="btn-networking btn-reject"
                    onClick={() => onReject(user)}
                    aria-label="Reddet"
                >
                    <X size={28} />
                </button>

                <button
                    className="btn-networking btn-accept"
                    onClick={() => onAccept(user)}
                    aria-label="Kabul Et"
                >
                    <Heart size={28} />
                </button>
            </div>
        </div>
    );
};

export default NetworkingCard;
