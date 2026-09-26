import React from 'react';
import { Zap } from 'lucide-react';
import './PremiumBadge.css';

const PremiumBadge = ({ size = 'md' }) => {
    return (
        <span className={`premium-badge premium-badge-${size}`}>
            <Zap size={size === 'sm' ? 11 : (size === 'lg' ? 16 : 13)} fill="currentColor" strokeWidth={0} />
            <span>Premium</span>
            <div className="premium-badge-shine"></div>
        </span>
    );
};

export default PremiumBadge;
