import React, { useState, useEffect } from 'react';
import { 
    X, Star, MapPin, Briefcase, GraduationCap, 
    Loader2, Zap, AlertTriangle, Shield, MessageSquare,
    Link as LinkIcon, Github, Linkedin, Globe
} from 'lucide-react';
import api from '../services/api';
import './UserProfileModal.css';

import { interestCategories } from '../data/interestCategories.js';

/**
 * Shared premium User Profile Modal
 * @param {Object} user - Basic user object (id, name, profilePicture, etc.)
 * @param {Boolean} isOpen - Modal visibility
 * @param {Function} onClose - Close callback
 * @param {React.ReactNode} footerActions - Optional action buttons to show at bottom
 */
const UserProfileModal = ({ user, isOpen, onClose, footerActions }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAllInterests, setShowAllInterests] = useState(false);
    const [showAllSkills, setShowAllSkills] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && user?.id) {
            fetchFullProfile();
            document.body.style.overflow = 'hidden';
        } else {
            // Reset when closed
            setProfileData(null);
            setError(null);
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        }
    }, [isOpen, user?.id]);

    const fetchFullProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getPublicUserProfile(user.id);
            setProfileData(data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setError('Profil detayları yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    const displayUser = profileData || user;

    return (
        <div className="user-profile-modal-overlay" onClick={onClose}>
            <div className="user-profile-modal-container" onClick={e => e.stopPropagation()}>
                {/* Header Banner */}
                <div className="user-profile-modal-header">
                    <button className="user-profile-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Profile Top Info */}
                <div className="user-profile-modal-avatar-wrapper">
                    <div className="user-profile-modal-avatar">
                        {displayUser.profilePicture ? (
                            <img src={displayUser.profilePicture} alt={displayUser.name} />
                        ) : (
                            displayUser.name?.charAt(0) || 'U'
                        )}
                    </div>
                    <div className="user-profile-modal-name-info">
                        <h2 className="user-profile-modal-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>{displayUser.name} {displayUser.surname || ''}</span>
                            {displayUser.isPremium && (
                                <Star size={20} fill="var(--color-warning)" color="var(--color-warning)" />
                            )}
                            {displayUser.role === 'campus_ambassador' && (
                                <span style={{
                                    fontSize: '11px',
                                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
                                }}>
                                    <Shield size={12} fill="#fff" /> KAMPÜS ELÇİSİ
                                </span>
                            )}
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <p className="user-profile-modal-title" style={{ margin: 0 }}>
                                {displayUser.title || 'Bondle Üyesi'}
                            </p>
                            {displayUser.isBranchRepresentative ? (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)', 
                                    color: '#ef4444', 
                                    padding: '2px 8px', 
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    width: 'fit-content',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                    {displayUser.branch ? (displayUser.branch.includes('Bondle') ? `${displayUser.branch} - İl Temsilcisi` : `Bondle ${displayUser.branch} - İl Temsilcisi`) : 'İl Temsilcisi'}
                                </div>
                            ) : (displayUser.team || displayUser.branch) ? (
                                <div style={{
                                    background: 'rgba(59, 130, 246, 0.1)', 
                                    color: '#3b82f6', 
                                    padding: '2px 8px', 
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    width: 'fit-content',
                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                    {`${displayUser.branch ? (displayUser.branch.includes('Bondle') ? displayUser.branch : `Bondle ${displayUser.branch}`) : ''} ${displayUser.team ? `- ${displayUser.team}` : ''}`.trim().replace(/^-|-$/g, '').trim()}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="user-profile-modal-content">
                    {loading && !profileData ? (
                        <div className="user-profile-modal-loading">
                            <Loader2 className="animate-spin" size={32} />
                            <p>Detaylar yükleniyor...</p>
                        </div>
                    ) : error ? (
                        <div className="user-profile-modal-loading" style={{ color: 'var(--color-danger)' }}>
                            <AlertTriangle size={40} />
                            <p>{error}</p>
                            <button className="btn btn-sm btn-primary" onClick={fetchFullProfile}>Tekrar Dene</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Bio */}
                            {displayUser.bio && (
                                <div className="user-profile-modal-section">
                                    <span className="user-profile-modal-section-label">
                                        <MessageSquare size={14} /> Hakkında
                                    </span>
                                    <p className="user-profile-modal-bio">
                                        {displayUser.bio}
                                    </p>
                                </div>
                            )}

                            {/* Basic Details Chips */}
                            <div className="user-profile-modal-chips">
                                {displayUser.city && (
                                    <span className="user-profile-modal-chip">
                                        <MapPin size={14} /> {displayUser.city}
                                    </span>
                                )}
                                {displayUser.university && (
                                    <span className="user-profile-modal-chip">
                                        <GraduationCap size={14} /> {displayUser.university}
                                    </span>
                                )}
                                {displayUser.department && (
                                    <span className="user-profile-modal-chip">
                                        <Briefcase size={14} /> {displayUser.department}
                                    </span>
                                )}
                                {displayUser.classYear && (
                                    <span className="user-profile-modal-chip">
                                        📅 {displayUser.classYear}. Sınıf
                                    </span>
                                )}
                            </div>

                            {/* Interests */}
                            {displayUser.interests?.length > 0 && (
                                <div className="user-profile-modal-section">
                                    <span className="user-profile-modal-section-label">İlgi Alanları</span>
                                    <div className="user-profile-modal-chips">
                                        {displayUser.interests.slice(0, showAllInterests ? displayUser.interests.length : 4).map((interest, i) => {
                                            const interestName = interest.interestCategory || interest;
                                            const normalizedKey = interestName.toLowerCase().trim();
                                            const found = interestCategories.find(c => c.id === normalizedKey);
                                            const translatedName = found ? found.label : interestName;
                                            return (
                                                <span key={i} className="user-profile-modal-chip accent">
                                                    {found ? `${found.emoji} ` : ''}{translatedName}
                                                </span>
                                            );
                                        })}
                                        {displayUser.interests.length > 4 && !showAllInterests && (
                                            <span 
                                                className="user-profile-modal-chip"
                                                onClick={() => setShowAllInterests(true)}
                                                style={{ cursor: 'pointer', background: 'rgba(147, 51, 234, 0.1)', color: '#9333ea', fontWeight: 'bold' }}
                                            >
                                                +{displayUser.interests.length - 4}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Skills */}
                            {displayUser.skills?.length > 0 && (
                                <div className="user-profile-modal-section">
                                    <span className="user-profile-modal-section-label">Yetenekler</span>
                                    <div className="user-profile-modal-chips">
                                        {displayUser.skills.slice(0, 4).map((skill, i) => (
                                            <span key={i} className="user-profile-modal-chip">
                                                {skill.skillName || skill}
                                            </span>
                                        ))}
                                        {displayUser.skills.length > 4 && (
                                            <span className="user-profile-modal-chip">+{displayUser.skills.length - 4}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Social Links */}
                            {(displayUser.linkedinUrl || displayUser.githubUrl || displayUser.websiteUrl) && (
                                <div className="user-profile-modal-section">
                                    <span className="user-profile-modal-section-label">Bağlantılar</span>
                                    <div className="user-profile-modal-socials">
                                        {displayUser.linkedinUrl && (
                                            <a href={displayUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="user-profile-modal-social-link">
                                                <Linkedin size={16} /> LinkedIn
                                            </a>
                                        )}
                                        {displayUser.githubUrl && (
                                            <a href={displayUser.githubUrl} target="_blank" rel="noopener noreferrer" className="user-profile-modal-social-link">
                                                <Github size={16} /> GitHub
                                            </a>
                                        )}
                                        {displayUser.websiteUrl && (
                                            <a href={displayUser.websiteUrl} target="_blank" rel="noopener noreferrer" className="user-profile-modal-social-link">
                                                <Globe size={16} /> Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {footerActions && (
                    <div className="user-profile-modal-footer">
                        {footerActions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileModal;
