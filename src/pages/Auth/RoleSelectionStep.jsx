import React from 'react';
import { Check } from 'lucide-react';
import './Onboarding.css';

const RoleSelectionStep = ({ selectedRole, onRoleSelect }) => {
    const roles = [
        {
            id: 'user',
            icon: '??',
            title: 'Bireysel Kullanýcý',
            description: 'Bondle\'te etkinliklere katýl, insanlarla tanýþ ve kariyerini geliþtir.',
        },
        {
            id: 'club_management',
            icon: '??',
            title: 'Kulüp Yöneticisi',
            description: 'Kulübünü yönet, analitiðe eriþ ve diðer kulüplerle iþbirliði yap.',
        },
    ];

    return (
        <div className="onboarding-content">
            <h2 className="step-title">Rolünü Seç</h2>
            <p className="step-description">
                Bondle ekosisteminde nasýl yer alacaðýný belirle
            </p>

            <div className="role-grid">
                {roles.map((role) => (
                    <div
                        key={role.id}
                        className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                        onClick={() => onRoleSelect(role.id)}
                    >
                        <span className="role-icon">{role.icon}</span>
                        <h3>{role.title}</h3>
                        <p>{role.description}</p>
                        {selectedRole === role.id && (
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                <Check size={24} color="var(--color-accent-primary)" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoleSelectionStep;

