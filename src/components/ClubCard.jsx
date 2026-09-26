import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users as UsersIcon, Star } from 'lucide-react';
import './ClubCard.css';

const ClubCard = ({ club }) => {
    const navigate = useNavigate();

    return (
        <div className="club-card card" onClick={() => navigate(`/clubs/${club.id}`)}>
            <div className="club-card-header">
                <div className="club-card-logo">
                    <img src={club.logoUrl || club.logo || 'https://via.placeholder.com/150'} alt={club.name} />
                </div>
                {club.isPremium && (
                    <span className="badge badge-premium">
                        <Star size={12} />
                        Premium
                    </span>
                )}
            </div>

            <div className="card-body">
                <h3 className="club-card-title">{club.name}</h3>
                <p className="club-card-description">{club.description}</p>

                <div className="club-card-meta">
                    <div className="club-card-meta-item">
                        <MapPin size={16} />
                        <span>{club.city}</span>
                    </div>

                    <div className="club-card-meta-item">
                        <UsersIcon size={16} />
                        <span>{club.memberCount} üye</span>
                    </div>
                </div>

                <div className="club-card-categories">
                    {(Array.isArray(club.categories) ? club.categories : []).slice(0, 3).map((category) => (
                        <span key={category} className="club-card-category">
                            {category}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClubCard;
