import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus } from 'lucide-react';

const RequireAuthModal = ({ isOpen, onClose, title = 'Giriş Yapmanız Gerekiyor', message = 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.', icon: Icon = LogIn }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content card animate-fade-in" style={{ maxWidth: '400px', width: '90%', padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-md)' }}>
                    <button onClick={onClose} className="btn-close"><X size={20} /></button>
                </div>
                
                <div style={{ 
                    width: '64px', height: '64px', borderRadius: '50%', 
                    background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-accent-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--spacing-lg)'
                }}>
                    <Icon size={32} />
                </div>
                
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>{title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)', lineHeight: '1.5' }}>
                    {message}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => {
                            onClose();
                            navigate('/login');
                        }}
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}
                    >
                        <LogIn size={18} /> Giriş Yap
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequireAuthModal;
