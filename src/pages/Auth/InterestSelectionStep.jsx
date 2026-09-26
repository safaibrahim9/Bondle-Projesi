import React from 'react';
import { interestCategories } from '../../data/interestCategories.js';
import './Onboarding.css';

const InterestSelectionStep = ({ selectedInterests, onInterestToggle }) => {
    const minSelection = 3;
    const selectionCount = selectedInterests.length;
    const isMinimumMet = selectionCount >= minSelection;

    return (
        <div className="onboarding-content">
            <h2 className="step-title">İlgi Alanlarını Seç</h2>
            <p className="step-description">
                En az {minSelection} ilgi alanı seç. Bu, seni doğru insanlarla buluşturmamıza yardımcı olacak.
            </p>

            <div className="interest-counter">
                <span className="interest-counter-text">Seçilen: </span>
                <span className="interest-counter-number">
                    {selectionCount} {!isMinimumMet && `/ ${minSelection} minimum`}
                </span>
            </div>

            <div className="interest-grid">
                {interestCategories.map((interest) => (
                    <button
                        key={interest.id}
                        type="button"
                        className={`interest-chip ${selectedInterests.includes(interest.id) ? 'selected' : ''
                            }`}
                        onClick={() => onInterestToggle(interest.id)}
                    >
                        <span className="interest-emoji">{interest.emoji}</span>
                        <span>{interest.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default InterestSelectionStep;

